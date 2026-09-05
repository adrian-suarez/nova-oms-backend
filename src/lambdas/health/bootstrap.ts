import { sharedContainer } from "@bootstrap/Bootstrap.js";
import { HealthContainer } from "@modules/health/HealthContainer.js";


export const healthContainer = new HealthContainer(sharedContainer);
