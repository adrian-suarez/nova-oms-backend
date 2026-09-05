import { AuthenticationProvider } from "@modules/auth/application/providers/AuthenticationProvider.js";
import { LoginUseCase } from "@modules/auth/application/use-cases/LoginUseCase.js";
import { User, UserStatus } from "@modules/users/domain/entities/User.js";
import { UserRepository } from "@modules/users/domain/repositories/UserRepository.js";
import { UnauthorizedError } from "@shared/errors/UnauthorizedError.js";
import { mock } from "vitest-mock-extended";

describe("LoginUseCase",()=>{

    function makeDeps(){
        return {
            userRepository: mock<UserRepository>(),
            authenticationProvider: mock<AuthenticationProvider>()
        }
    }

    it("throw UnauthorizedError if the email doesn't exists",async() => {
        const {userRepository, authenticationProvider}= makeDeps();
        userRepository.findByEmail.mockResolvedValue(null);
        const useCase = new LoginUseCase(userRepository,authenticationProvider);

        await expect(useCase.execute({email:"invalid@novaoms.com", password:"whatever"}))
        .rejects.toThrow(UnauthorizedError);

        expect(authenticationProvider.login).not.toHaveBeenCalled();

    });

    it("with an existing email,it delegates the authentication to provider and build the response",async ()=>{
        const {userRepository, authenticationProvider} = makeDeps();
        const existingUser = User.create({
            email: "user@novaoms.com",
            firstName: "Adrian",
            lastName: "Suarez",
            status: UserStatus.ACTIVE
        });

        userRepository.findByEmail.mockResolvedValue(existingUser);
        const authResponse = {accessToken:"at", refreshToken:"rt", expiresIn:3600};
        authenticationProvider.login.mockResolvedValue(authResponse);

        const useCase = new LoginUseCase(userRepository, authenticationProvider);
        const result = await useCase
        .execute({email:"user@novaoms.com", password:"Nova*123"});

        expect(result.auth).toEqual(authResponse);
        expect(result.user.email).toBe("user@novaoms.com");
        expect(authenticationProvider.login)
        .toHaveBeenCalledWith({email:"user@novaoms.com", password:"Nova*123"});

    });


});