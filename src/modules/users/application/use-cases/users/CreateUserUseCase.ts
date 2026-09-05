import { IdentityManagementProvider } from "@modules/auth/application/providers/IdentityManagementProvider.js";
import { User, UserStatus } from "@modules/users/domain/entities/User.js";
import { UserRepository } from "@modules/users/domain/repositories/UserRepository.js";
import { UserRoleRepository } from "@modules/users/domain/repositories/UserRoleRepository.js";
import { ExternalSyncOrchestrator } from "@shared/application/orchestration/ExternalSyncOrchestrator.js";
import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { ConflictError } from "@shared/errors/ConflictError.js";
import { PasswordHasher } from "@shared/security/hash/PasswordHasher.js";
import { CreateUserRequest } from "../../dto/requests/users/CreateUserRequest.js";
import { UserDetailResponse } from "../../dto/responses/UserResponse.js";
import { UserMapper } from "../../mappers/UserMapper.js";
import { RoleValidator } from "../../services/RoleValidatorService.js";


export class CreateUserUseCase implements UseCase<CreateUserRequest,UserDetailResponse>{

    constructor(
        private readonly userRepository:UserRepository,
        private readonly userRoleRepository:UserRoleRepository,
        private readonly roleValidator: RoleValidator,
        private readonly passwordHasher:PasswordHasher,
        private readonly identityManagementProvider: IdentityManagementProvider,
        private readonly orchestrator: ExternalSyncOrchestrator
    ){}
    async execute(request: CreateUserRequest): Promise<UserDetailResponse> {

        const exists = await this.userRepository.findByEmail(request.email);
    
        if(exists){
            throw new ConflictError("User already exists");
        }
       
        const password = await this.passwordHasher.hash(request.password);
        const user = User.create({...request, status:UserStatus.PENDING});
        user.setPassword(password);
        const externalUser = User.create({...request, status:UserStatus.PENDING});
        externalUser.setPassword(request.password);
        
        await this.orchestrator.run({
            aggregate: user,
            localTransaction: async() => {
                await this.userRepository.create(user);

                if(request.rolesIds?.length){
                    const roles = await this.roleValidator.validate(request.rolesIds);
                    user.setRoles(roles);
                    await this.userRoleRepository.assignMany(user.id,new Set(roles.map(r=>r.id)));
                }  
            },
            externalSync: async ()=> this.identityManagementProvider.create(externalUser),
            compensate: async ()=>{
                await this.userRepository.delete(user.id, true);
            }
        });
      

        return UserMapper.toDetailResponse(user);

    }
    
}