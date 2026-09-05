import { IdentityManagementProvider } from "@modules/auth/application/providers/IdentityManagementProvider.js";
import { RoleValidator } from "@modules/users/application/services/RoleValidatorService.js";
import { CreateUserUseCase } from "@modules/users/application/use-cases/users/CreateUserUseCase.js";
import { User, UserStatus } from "@modules/users/domain/entities/User.js";
import { UserRepository } from "@modules/users/domain/repositories/UserRepository.js";
import { UserRoleRepository } from "@modules/users/domain/repositories/UserRoleRepository.js";
import { ExternalSyncOrchestrator } from "@shared/application/orchestration/ExternalSyncOrchestrator.js";
import { ConflictError } from "@shared/errors/ConflictError.js";
import { PasswordHasher } from "@shared/security/hash/PasswordHasher.js";
import { mock } from "vitest-mock-extended";


describe("CreateUserUseCase",()=>{

    const request = {email: "nuevo@novaoms.com",
        password:"Nova*123",
        firstName:"Adrian",
        lastName:"Suarez",
        rolesIds:[] as string[]
    };

    function makeDeps(){
        const passwordHasher = mock<PasswordHasher>();
        passwordHasher.hash.mockResolvedValue("hashed-password");

        return {
            userRepository: mock<UserRepository>(),
            userRoleRepository: mock<UserRoleRepository>(),
            roleValidator: mock<RoleValidator>(),
            passwordHasher,
            identityManagementProvider: mock<IdentityManagementProvider>(),
            orchestrator: mock<ExternalSyncOrchestrator>()
        };
    }

    it("throws conflictError if a user with that email already exists",async ()=>{
        const deps = makeDeps();

        deps.userRepository.findByEmail.mockResolvedValue(
            User.create({...request, status:UserStatus.ACTIVE})
        );

        const useCase = new CreateUserUseCase(deps.userRepository,
            deps.userRoleRepository,
            deps.roleValidator,
            deps.passwordHasher,
            deps.identityManagementProvider,
            deps.orchestrator
        );

        await expect(useCase.execute(request)).rejects.toThrow(ConflictError);
        expect(deps.orchestrator.run).not.toHaveBeenCalled();
    });

    it("happy path, it creates locally and sync with the external provider", async()=>{
        const deps = makeDeps();
        deps.userRepository.findByEmail.mockResolvedValue(null);
        deps.orchestrator.run.mockImplementation(async({localTransaction, externalSync})=>{
            await localTransaction();
            await externalSync!();
        });

        const useCase = new CreateUserUseCase(deps.userRepository,
            deps.userRoleRepository,
            deps.roleValidator,
            deps.passwordHasher,
            deps.identityManagementProvider,
            deps.orchestrator
        );

        const result = await useCase.execute(request);
        
        expect(deps.userRepository.create).toHaveBeenCalledOnce();
        expect(deps.identityManagementProvider.create).toHaveBeenCalledOnce();
        expect(result.email).toBe(request.email);

    });

    it("with rolesIds, it validates and assigns the roles within the local transaction", async()=>{
        const deps = makeDeps();
        
        deps.userRepository.findByEmail.mockResolvedValue(null);
        deps.roleValidator.validate.mockResolvedValue([{id:"role1",name:"role1",description:"desc"}as never]);
        deps.orchestrator.run.mockImplementation(async({localTransaction})=>{
            await localTransaction();
        });

        const useCase = new CreateUserUseCase(deps.userRepository,
            deps.userRoleRepository,
            deps.roleValidator,
            deps.passwordHasher,
            deps.identityManagementProvider,
            deps.orchestrator
        );
        
        const result = await useCase.execute({...request, rolesIds:["role1"]});

        expect(deps.roleValidator.validate).toHaveBeenCalledWith(["role1"]);
        expect(deps.userRoleRepository.assignMany).toHaveBeenCalledOnce();
        expect(result.email).toBe(request.email);

    });

});