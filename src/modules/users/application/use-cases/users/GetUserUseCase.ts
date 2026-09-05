import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { UserRepository } from "@modules/users/domain/repositories/UserRepository.js";
import { UserRoleDetailResponse } from "../../dto/responses/UserResponse.js";
import { UserMapper } from "../../mappers/UserMapper.js";
import { NotFoundError } from "@shared/errors/NotFoundError.js";
import { EntityRequest } from "@shared/application/dto/EntityRequest.js";


export class GetUserUseCase implements UseCase<EntityRequest,UserRoleDetailResponse>{

    constructor(private readonly repository: UserRepository){}

    async execute(entityRequest:EntityRequest): Promise<UserRoleDetailResponse> {
        const user = await this.repository.findByIdWithRoles(entityRequest.id);

        if(!user){
            throw new NotFoundError(`User: ${entityRequest.id}`);
        }
        return UserMapper.toRoleDetailResponse(user);
    }
    
}