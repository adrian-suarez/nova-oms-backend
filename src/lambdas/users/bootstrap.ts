import { applicationServices, sharedContainer, sharedInfrastructure } from "@bootstrap/Bootstrap.js";
import { EventSharedContainer } from "@bootstrap/events/EventSharedContainer.js";
import { UserContainer } from "@modules/users/UserContainer.js";


const eventSharedContainers = new EventSharedContainer(sharedContainer);

export const userContainer = new UserContainer(sharedContainer,eventSharedContainers, applicationServices,sharedInfrastructure);
