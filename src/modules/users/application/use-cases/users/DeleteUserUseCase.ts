import { IdentityManagementProvider } from "@modules/auth/application/providers/IdentityManagementProvider.js";
import { UserRepository } from "@modules/users/domain/repositories/UserRepository.js";
import { EntityRequest } from "@shared/application/dto/EntityRequest.js";
import { DomainEventDispatcher } from "@shared/application/orchestration/DomainEventDispatcher.js";
import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { NotFoundError } from "@shared/errors/NotFoundError.js";


export class DeleteUserUseCase implements UseCase<EntityRequest,void>{

    constructor(private readonly repository: UserRepository,
        private readonly identityManagementProvider: IdentityManagementProvider,
        private readonly domainEventDispatcher:DomainEventDispatcher
    ){}

    async execute(entityRequest:EntityRequest): Promise<void> {
        const user = await this.repository.findById(entityRequest.id);

        if(!user){
            throw new NotFoundError(`User: ${entityRequest.id}`);
        }
        await this.identityManagementProvider.delete(user.email);
        user.delete();

        await this.domainEventDispatcher.dispatcher(user, async () => {
            await this.repository.update(user);
        });


    }
    
}