import { sharedContainer } from "@bootstrap/Bootstrap.js";
import { EventSharedContainer } from "@bootstrap/events/EventSharedContainer.js";
import { EventWorkerSharedContainer } from "@bootstrap/events/EventWorkerSharedContainer.js";


const eventSharedContainers = new EventSharedContainer(sharedContainer);
export const eventWorkerSharedContainer = new EventWorkerSharedContainer(eventSharedContainers);

