import { sharedContainer } from "@bootstrap/Bootstrap.js";
import { SesContainer } from "@bootstrap/ses/SesContainer.js";
import { NotificationContainer } from "@modules/notifications/NotificationContainer.js";

const sesContainer = new SesContainer(sharedContainer);

export const notificationContainer = new NotificationContainer(sharedContainer,sesContainer);