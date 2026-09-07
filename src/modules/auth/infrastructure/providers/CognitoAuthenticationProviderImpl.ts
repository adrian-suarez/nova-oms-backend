import { AuthenticationResponse, UserIdentity } from "@modules/auth/domain/entities/AuthUser.js";
import { LoginRequest } from "@modules/auth/application/dto/request/LoginRequest.js";
import { AuthenticationProvider } from "../../application/providers/AuthenticationProvider.js";
import { AdminInitiateAuthCommand, CognitoIdentityProviderClient, GlobalSignOutCommand, NotAuthorizedException, UserNotFoundException } from "@aws-sdk/client-cognito-identity-provider";
import { Config } from "@shared/config/Config.js";
import { UnauthorizedError } from "@shared/errors/UnauthorizedError.js";
import { ExternalServiceError } from "@shared/errors/ExternalServiceError.js";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoJwtVerifierSingleUserPool } from "aws-jwt-verify/cognito-verifier";
import { Metrics, MetricUnit } from "@aws-lambda-powertools/metrics";
import { IPolicy } from "cockatiel";

interface CognitoJwtPayload{
    sub: string;
    email?: string;
    [key:string]: unknown;
}

// La policy envuelve login/refresh/logout (llamadas de red a Cognito). authenticate()
// queda fuera: verifica el JWT localmente, sin red que proteger — envolverlo mezclaría
// fallos de tokens inválidos con fallos reales de Cognito en el breaker. Ver ADR-0009.
export class CognitoAuthenticationProviderImpl implements AuthenticationProvider{

    private _verifier?: CognitoJwtVerifierSingleUserPool<{
            userPoolId: string
            clientId: string,
            tokenUse: "access"
        }>;

    // Lazy a propósito: Bootstrap.ts construye este provider para toda Lambda que lo importe,
    // incluidas las que nunca llaman a authenticate() (ej. el worker del outbox, sin env vars
    // de Cognito). Construirlo en el constructor rompía el cold start de esas Lambdas.
    private get verifier() {
        if(!this._verifier){
            this._verifier = CognitoJwtVerifier.create({
                userPoolId: this.config.cognitoUserPoolId,
                clientId: this.config.cognitoClientId,
                tokenUse: "access"
            });
        }
        return this._verifier;
    }

    constructor(readonly cognito: CognitoIdentityProviderClient,
        readonly config:Config,
        readonly policy:IPolicy,
        readonly metrics: Metrics
    ){}

    async login(request: LoginRequest): Promise<AuthenticationResponse> {
        const start = Date.now();
        try {
            const response = await this.policy.execute(()=> this.cognito.send(new AdminInitiateAuthCommand({
                UserPoolId: this.config.cognitoUserPoolId,
                ClientId: this.config.cognitoClientId,
                AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
                AuthParameters:{
                    USERNAME: request.email,
                    PASSWORD: request.password
                }
            })));

            this.metrics.addDimension("provider","cognito");
            this.metrics.addDimension("operation","login");
            this.metrics.addMetric("ExternalCallDuration",MetricUnit.Milliseconds, Date.now()- start);

            if(!response.AuthenticationResult){
                throw new UnauthorizedError("Invalid credentials");
            }

            return {
                accessToken: response.AuthenticationResult.AccessToken ?? "",
                refreshToken: response.AuthenticationResult.RefreshToken ?? "",
                expiresIn: response.AuthenticationResult.ExpiresIn ?? 0,
            }
        } catch (error) {

            if(error instanceof UserNotFoundException || error instanceof NotAuthorizedException){
                throw new UnauthorizedError("Invalid credentials");
            }
            throw new ExternalServiceError("COGNITO_LOGIN_ERROR","Unable to authenticate user",error);
        }
    }
    async authenticate(accessToken: string): Promise<UserIdentity> {
        try {
            const response = await this.verifier.verify(accessToken) as CognitoJwtPayload;

            return {
                sub: response.sub
            };
        } catch {
            throw new UnauthorizedError("Invalid token");
        }
    }
    async refresh(refreshToken: string): Promise<AuthenticationResponse> {
        try {
            const response = await this.policy.execute(()=>  this.cognito.send(new AdminInitiateAuthCommand({
                UserPoolId: this.config.cognitoUserPoolId,
                ClientId: this.config.cognitoClientId,
                AuthFlow:"REFRESH_TOKEN_AUTH",
                AuthParameters:{
                    REFRESH_TOKEN: refreshToken
                }
            })));

            if(!response.AuthenticationResult){
                throw new UnauthorizedError("Invalid  refresh token response");
            }

            return {
                accessToken: response.AuthenticationResult.AccessToken ?? "",
                refreshToken,
                expiresIn: response.AuthenticationResult.ExpiresIn ?? 0,
            }
        } catch{
            throw new UnauthorizedError("Invalid refresh token");
        }
    }
    async logout(token: string): Promise<void> {
        try {
            await this.policy.execute(()=> this.cognito.send(new GlobalSignOutCommand({
                AccessToken: token
            })));
        } catch(error) {
            throw new ExternalServiceError("COGNITO_LOGOUT_ERROR","Unable to logout user",error);
        }
    }

    
}