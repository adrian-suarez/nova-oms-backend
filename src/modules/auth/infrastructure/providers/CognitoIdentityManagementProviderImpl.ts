import { AdminCreateUserCommand, AdminDeleteUserCommand, AdminDisableUserCommand, AdminEnableUserCommand, AdminSetUserPasswordCommand, AdminUpdateUserAttributesCommand, AliasExistsException, CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { IdentityManagementProvider } from "@modules/auth/application/providers/IdentityManagementProvider.js";
import { User } from "@modules/users/domain/entities/User.js";
import { Config } from "@shared/config/Config.js";
import { ExternalServiceError } from "@shared/errors/ExternalServiceError.js";
import { IPolicy } from "cockatiel";

export class CognitoIdentityManagementProviderImpl implements IdentityManagementProvider{

    constructor(readonly cognito: CognitoIdentityProviderClient,
        readonly config: Config,
        readonly policy:IPolicy
    ){
    }

    async create(user: User): Promise<void> {
        try{
            await this.policy.execute(()=>  this.cognito.send(new AdminCreateUserCommand({
                UserPoolId: this.config.cognitoUserPoolId,
                Username: user.email,
                TemporaryPassword: user.password!,
                UserAttributes:[
                    {
                        Name:"email",
                        Value:user.email
                    },
                    {
                        Name:"given_name",
                        Value: user.firstName
                    },
                    {
                        Name: "family_name",
                        Value: user.lastName
                    }
                ]
            })));

            await this.changePassword(user.email, user.password!);
        }catch(error){
            if(error instanceof AliasExistsException){
                throw new ExternalServiceError("COGNITO_EMAIL_ALREADY_EXIST","Email already exists",error);
            }
            throw new ExternalServiceError("COGNITO_CREATE_USER_ERROR","Unable to create user",error);

        }
    }
    async update(user: User): Promise<void> {
        try{
            await this.policy.execute(()=> this.cognito.send(new AdminUpdateUserAttributesCommand({
                UserPoolId: this.config.cognitoUserPoolId,
                Username: user.email,
                UserAttributes:[
                    {
                        Name:"given_name",
                        Value: user.firstName
                    },
                    {
                        Name: "family_name",
                        Value: user.lastName
                    }
                ]
            })));
        }catch(error){
            throw new ExternalServiceError("COGNITO_UPDATE_USER_ERROR","Unable to update user",error);
        }
    }
    async delete(userId: string): Promise<void> {
        try{
            await this.policy.execute(()=> this.cognito.send(new AdminDeleteUserCommand({
                UserPoolId: this.config.cognitoUserPoolId,
                Username: userId,
            })));
        }catch(error){
            throw new ExternalServiceError("COGNITO_DELETE_USER_ERROR","Unable to delete user",error);
        }
    }
    async enable(userId: string): Promise<void> {
        try{
            await this.policy.execute(()=> this.cognito.send(new AdminEnableUserCommand({
                UserPoolId: this.config.cognitoUserPoolId,
                Username: userId,
            })));
        }catch(error){
            throw new ExternalServiceError("COGNITO_ENABLE_USER_ERROR","Unable to enable user",error);
        }
    }
    async disable(userId: string): Promise<void> {
        try{
            await this.policy.execute(()=>  this.cognito.send(new AdminDisableUserCommand({
                UserPoolId: this.config.cognitoUserPoolId,
                Username: userId,
            })));
        }catch(error){
            throw new ExternalServiceError("COGNITO_DISABLE_USER_ERROR","Unable to disable user",error);
        }
    }
    async changePassword(userId: string, newPassword: string): Promise<void> {
        try{
            await this.policy.execute(()=> this.cognito.send(new AdminSetUserPasswordCommand({
                UserPoolId: this.config.cognitoUserPoolId,
                Username: userId,
                Password: newPassword,
                Permanent:true
            })));
        }catch(error){
            throw new ExternalServiceError("COGNITO_CHANGE_PASSWORD_USER_ERROR","Unable to change user password",error);

        }
    }
   
    
}