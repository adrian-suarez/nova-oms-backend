
import { SharedInfrastructure } from "@bootstrap/shared/SharedInfrastructure.js";
import { HttpHandler } from "@shared/aws/lambda/Handler.js";
import { CreateRoleUseCase } from "./application/use-cases/roles/CreateRoleUseCase.js";
import { DeleteRoleUseCase } from "./application/use-cases/roles/DeleteRoleUseCase.js";
import { GetRolesUseCase } from "./application/use-cases/roles/GetRolesUseCase.js";
import { GetRoleUseCase } from "./application/use-cases/roles/GetRoleUseCase.js";
import { UpdateRoleUseCase } from "./application/use-cases/roles/UpdateRoleUseCase.js";
import { CreateRoleHandler } from "./presentation/handlers/roles/CreateRoleHandler.js";
import { DeleteRoleHandler } from "./presentation/handlers/roles/DeleteRoleHandler.js";
import { GetRoleHandler } from "./presentation/handlers/roles/GetRoleHandler.js";
import { GetRolesHandler } from "./presentation/handlers/roles/GetRolesHandler.js";
import { UpdateRoleHandler } from "./presentation/handlers/roles/UpdateRoleHandler.js";
import { SharedContainer } from "@bootstrap/shared/SharedContainer.js";


export class RoleContainer {

    private readonly getRoleHandler:HttpHandler;
    private readonly getRolesHandler:HttpHandler;
    private readonly createRoleHandler:HttpHandler;
    private readonly updateRoleHandler:HttpHandler;
    private readonly deleteRoleHandler:HttpHandler;


    constructor(container: SharedContainer,sharedInfrastructure:SharedInfrastructure){

        // use cases
        const getRoleUseCase = new GetRoleUseCase(sharedInfrastructure.roleRepository);
        const getRolesUseCase = new GetRolesUseCase(sharedInfrastructure.roleRepository);
        const createRoleUseCase = new CreateRoleUseCase(sharedInfrastructure.roleRepository,
            sharedInfrastructure.rolePermissionRepository,
            sharedInfrastructure.permissionValidator);
        const updateRoleUseCase = new UpdateRoleUseCase(sharedInfrastructure.roleRepository,
            sharedInfrastructure.rolePermissionRepository,
            sharedInfrastructure.permissionValidator);
        const deleteRoleUseCase = new DeleteRoleUseCase(sharedInfrastructure.roleRepository);


        // handlers
        this.getRoleHandler = new GetRoleHandler(getRoleUseCase,container.executionContextProvider);
        this.getRolesHandler = new GetRolesHandler(getRolesUseCase,container.executionContextProvider);
        this.createRoleHandler = new CreateRoleHandler(createRoleUseCase,container.executionContextProvider);
        this.updateRoleHandler = new UpdateRoleHandler(updateRoleUseCase,container.executionContextProvider);
        this.deleteRoleHandler = new DeleteRoleHandler(deleteRoleUseCase,container.executionContextProvider);

    }

    getGetRoleHandler():HttpHandler{
        return this.getRoleHandler;
    } 
    getGetRolesHandler():HttpHandler{
        return this.getRolesHandler;
    }
    getCreateRoleHandler():HttpHandler{
        return this.createRoleHandler;
    }
    getUpdateRoleHandler():HttpHandler{
        return this.updateRoleHandler;
    }
    getDeleteRoleHandler():HttpHandler{
        return this.deleteRoleHandler;
    }
}