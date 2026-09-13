import { ApplicationServices } from "@bootstrap/application/ApplicationServices.js";
import { AuthenticationBehavior } from "@shared/application/pipelines/behaviors/AuthenticationBehavior.js";
import { SharedInfrastructure } from "@bootstrap/shared/SharedInfrastructure.js";
import { SharedContainer } from "@bootstrap/shared//SharedContainer.js";


export function createAuthBehavior(sharedContainer:SharedContainer,sharedInfrastructure : SharedInfrastructure, applicationServices:ApplicationServices){
    return new AuthenticationBehavior(applicationServices.authenticationProvider,
        sharedInfrastructure.identityRepository,
        sharedContainer.executionContextProvider
    );
}
