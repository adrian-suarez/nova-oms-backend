import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { LoginRequest } from "../dto/request/LoginRequest.js";
import { LoginResponse } from "../dto/response/LoginResponse.js";
import { AuthenticationProvider } from "../providers/AuthenticationProvider.js";
import { UserRepository } from "@modules/users/domain/repositories/UserRepository.js";
import { UserMapper } from "@modules/users/application/mappers/UserMapper.js";
import { UnauthorizedError } from "@shared/errors/UnauthorizedError.js";


export class LoginUseCase implements UseCase<LoginRequest,LoginResponse>{

    constructor( private readonly userRepository: UserRepository, private authenticationProvider: AuthenticationProvider,){}

    async execute(request: LoginRequest): Promise<LoginResponse> {
        const userFound = await this.userRepository.findByEmail(request.email);
        if(!userFound){
            throw new UnauthorizedError('Invalid Credentials');
        }
        const user = UserMapper.toDetailResponse(userFound); 

        const auth = await this.authenticationProvider.login(request);
        return {user, auth}
    }
    
}