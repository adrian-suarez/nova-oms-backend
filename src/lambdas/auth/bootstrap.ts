import { applicationServices, sharedContainer, sharedInfrastructure} from "@bootstrap/Bootstrap.js";
import { AuthContainer } from "@modules/auth/AuthContainer.js";

export const authContainer = new AuthContainer(sharedContainer,sharedInfrastructure, applicationServices);
