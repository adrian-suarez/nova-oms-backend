import { ApplicationServices } from "@bootstrap/application/ApplicationServices.js";
import { LoginUseCase } from "./application/use-cases/LoginUseCase.js";
import { LoginHandler } from "./presentation/handlers/LoginHandler.js";
import { HttpHandler } from "@shared/aws/lambda/Handler.js";
import { SharedInfrastructure } from "@bootstrap/shared/SharedInfrastructure.js";
import { SharedContainer } from "@bootstrap/shared/SharedContainer.js";

export class AuthContainer{
    private readonly handler;
    constructor(container: SharedContainer,
        sharedInfrastructure: SharedInfrastructure,
        applicationServices:ApplicationServices){
        
        const loginUseCase = new LoginUseCase(sharedInfrastructure.userRepository,
            applicationServices.authenticationProvider);
        this.handler = new LoginHandler(loginUseCase,
            container.executionContextProvider);
    }
   
    getHandler():HttpHandler{
        return this.handler;
    }

}

