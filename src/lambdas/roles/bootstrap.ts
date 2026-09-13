import { sharedContainer, sharedInfrastructure } from "@bootstrap/Bootstrap.js";
import { RoleContainer } from "@modules/users/RoleContainer.js";

export const roleContainer = new RoleContainer(sharedContainer,sharedInfrastructure);
