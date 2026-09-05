import { LocalSessionManagerImpl } from "@modules/auth/infrastructure/managers/LocalSessionManagerImpl.js";
import { LocalAuthenticationProviderImpl } from "@modules/auth/infrastructure/providers/LocalAuthenticationProviderImpl.js";
import { PrismaUserSessionRepositoryImpl } from "@modules/auth/infrastructure/repositories/PrismaUserSessionRepositoryImpl.js";
import { SharedContainer } from "@bootstrap/shared//SharedContainer.js";
import { SharedInfrastructure } from "@bootstrap/shared//SharedInfrastructure.js";
import { LocalIdentityManagementProviderImpl } from "@modules/auth/infrastructure/providers/LocalIdentityManagementProviderImpl.js";
import { CognitoAuthenticationProviderImpl } from "@modules/auth/infrastructure/providers/CognitoAuthenticationProviderImpl.js";
import { AliasExistsException, CognitoIdentityProviderClient, NotAuthorizedException, UserNotFoundException } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoIdentityManagementProviderImpl } from "@modules/auth/infrastructure/providers/CognitoIdentityManagementProviderImpl.js";
import * as AWSXRay from "aws-xray-sdk-core";
import { ResiliencePolicyFactory } from "@shared/infrastructure/resilience/ResiliencePolicyFactory.js";


export class ApplicationServices {
  readonly identityManagementProvider;
  readonly authenticationProvider;

  constructor(container: SharedContainer,
    sharedInfrastructure: SharedInfrastructure) {

      if(container.config.authProvider ==="cognito"){
        const cognitoClient =  new CognitoIdentityProviderClient({region: container.config.awsRegion});
        AWSXRay.captureAWSv3Client(cognitoClient);

        const policy = ResiliencePolicyFactory.create({
                metricName:"cognito",
                isTransientError: (error)=> !(error instanceof NotAuthorizedException || error instanceof UserNotFoundException || error instanceof AliasExistsException)
            },
            container.metrics
        );
        
        this.authenticationProvider = new CognitoAuthenticationProviderImpl(cognitoClient,container.config, policy, container.metrics);
        this.identityManagementProvider = new CognitoIdentityManagementProviderImpl(cognitoClient, container.config, policy);
    
        return;
      }

      const userSessionRepository = new PrismaUserSessionRepositoryImpl(container.prismaProvider);
      const sessionManager = new LocalSessionManagerImpl(
        userSessionRepository,
        sharedInfrastructure.userRepository,
        container.jwtService,
        container.refreshTokenService,
        container.config.accessTokenExpires,
        container.config.refreshTokenDays,
      );

      this.authenticationProvider = new LocalAuthenticationProviderImpl(
        sharedInfrastructure.userRepository,
        container.passwordHasher,
        sessionManager,
        container.logger
      );

      this.identityManagementProvider = new LocalIdentityManagementProviderImpl();
  }
}
