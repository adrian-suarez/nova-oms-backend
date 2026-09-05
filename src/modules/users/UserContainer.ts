
import { GetUserUseCase } from "./application/use-cases/users/GetUserUseCase.js";
import { GetUsersUseCase } from "./application/use-cases/users/GetUsersUseCase.js";
import { CreateUserUseCase } from "./application/use-cases/users/CreateUserUseCase.js";
import { GetUserHandler } from "./presentation/handlers/users/GetUserHandler.js";
import { GetUsersHandler } from "./presentation/handlers/users/GetUsersHandler.js";
import { CreateUserHandler } from "./presentation/handlers/users/CreateUserHandler.js";
import { HttpHandler, SqsHandler } from "@shared/aws/lambda/Handler.js";
import { ApplicationServices } from "@bootstrap/application/ApplicationServices.js";
import { GetCurrentUserHandler } from "./presentation/handlers/users/GetCurrentUserHandler.js";
import { UpdateUserUseCase } from "./application/use-cases/users/UpdateUserUseCase.js";
import { DeleteUserUseCase } from "./application/use-cases/users/DeleteUserUseCase.js";
import { UpdateUserHandler } from "./presentation/handlers/users/UpdateUserHandler.js";
import { DeleteUserHandler } from "./presentation/handlers/users/DeleteUserHandler.js";
import { EventSharedContainer } from "@bootstrap/events/EventSharedContainer.js";
import { UserQueueConsumerHandler } from "./presentation/consumers/UserQueueConsumerHandler.js";
import { SharedContainer } from "@bootstrap/shared/SharedContainer.js";
import { SharedInfrastructure } from "@bootstrap/shared/SharedInfrastructure.js";


export class UserContainer {

    private readonly getUserHandler:HttpHandler;
    private readonly getUsersHandler:HttpHandler;
    private readonly createUserHandler:HttpHandler;
    private readonly getCurrentUserHandler:HttpHandler;
    private readonly updateUserHandler:HttpHandler;
    private readonly deleteUserHandler:HttpHandler;

    private readonly userQueueConsumerHandler:SqsHandler;

    constructor(container: SharedContainer,
        eventSharedContainers: EventSharedContainer,
        applicationServices:ApplicationServices,
        sharedInfrastructure:SharedInfrastructure){

        // use cases
        const getUserUseCase = new GetUserUseCase(sharedInfrastructure.userRepository);
        const getUsersUseCase = new GetUsersUseCase(sharedInfrastructure.userRepository);
        const createUserUseCase = new CreateUserUseCase(sharedInfrastructure.userRepository,
            sharedInfrastructure.userRoleRepository,
            sharedInfrastructure.roleValidator,
            container.passwordHasher  ,
            applicationServices.identityManagementProvider,
            eventSharedContainers.orchestrator
        );
        const updateUserUseCase = new UpdateUserUseCase(sharedInfrastructure.userRepository,
            sharedInfrastructure.userRoleRepository,
            sharedInfrastructure.roleValidator,
            applicationServices.identityManagementProvider,
            eventSharedContainers.domainEventDispatcher
        );
        const deleteUserUseCase = new DeleteUserUseCase(sharedInfrastructure.userRepository,
            applicationServices.identityManagementProvider,
            eventSharedContainers.domainEventDispatcher

        );

        // handlers
        this.getUserHandler = new GetUserHandler(getUserUseCase,container.executionContextProvider);
        this.getUsersHandler = new GetUsersHandler(getUsersUseCase,container.executionContextProvider);
        this.createUserHandler = new CreateUserHandler(createUserUseCase,container.executionContextProvider);
        this.getCurrentUserHandler = new GetCurrentUserHandler(getUserUseCase,container.executionContextProvider);
        this.updateUserHandler = new UpdateUserHandler(updateUserUseCase,container.executionContextProvider);
        this.deleteUserHandler = new DeleteUserHandler(deleteUserUseCase,container.executionContextProvider);

        //consumers
        this.userQueueConsumerHandler = new UserQueueConsumerHandler(container.logger);
    }

    getGetCurrentUserHandler():HttpHandler{
        return this.getCurrentUserHandler;
    } 

    getGetUserHandler():HttpHandler{
        return this.getUserHandler;
    } 
    getGetUsersHandler():HttpHandler{
        return this.getUsersHandler;
    }
    getCreateUserHandler():HttpHandler{
        return this.createUserHandler;
    }
    getUpdateUserHandler():HttpHandler{
        return this.updateUserHandler;
    }
    getDeleteUserHandler():HttpHandler{
        return this.deleteUserHandler;
    }

    getUserQueueConsumerHandler():SqsHandler{
        return this.userQueueConsumerHandler;
    }
}