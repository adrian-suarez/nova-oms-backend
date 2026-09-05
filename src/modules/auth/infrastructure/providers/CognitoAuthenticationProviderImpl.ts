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

// La policy (cockatiel: circuit breaker + retry + timeout) envuelve login/refresh/
// logout, que llaman a Cognito por red. authenticate() queda deliberadamente fuera:
// verifica el JWT localmente (this.verifier.verify), sin llamada remota que proteger
// — envolverlo agregaría reintentos inútiles y contaminaría el breaker compartido con
// fallos de tokens inválidos/expirados que no son fallos de Cognito. Ver ADR-0009.
export class CognitoAuthenticationProviderImpl implements AuthenticationProvider{

    readonly verifier: CognitoJwtVerifierSingleUserPool<{
            userPoolId: string
            clientId: string,
            tokenUse: "access"
        }>;

    constructor(readonly cognito: CognitoIdentityProviderClient,
        readonly config:Config,
        readonly policy:IPolicy,
        readonly metrics: Metrics
    ){
        this.verifier = CognitoJwtVerifier.create({
            userPoolId: config.cognitoUserPoolId,
            clientId: config.cognitoClientId,
            tokenUse: "access"
        });
    }

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
            if(!response.email){
                throw new UnauthorizedError("Token missing email")
            }

            return {
                sub: response.sub,
                email: response.email
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