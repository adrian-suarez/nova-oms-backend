import { AuthenticationResponse } from "@modules/auth/domain/entities/AuthUser.js";
import { UserDetailResponse } from "@modules/users/application/dto/responses/UserResponse.js";

export interface LoginResponse{
    user: UserDetailResponse,
    auth: AuthenticationResponse
}