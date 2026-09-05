import { sharedContainer, } from "@bootstrap/Bootstrap.js";
import { EventSharedContainer } from "@bootstrap/events/EventSharedContainer.js";
import { StorageSharedContainer } from "@bootstrap/storage/StorageSharedContainer.js";
import { AttachmentContainer } from "@modules/attachments/AttachmentContainer.js";

const storageSharedContainer = new StorageSharedContainer(sharedContainer);
const eventSharedContainer = new EventSharedContainer(sharedContainer);

export const attachmentContainer = new AttachmentContainer(sharedContainer,storageSharedContainer,eventSharedContainer);
