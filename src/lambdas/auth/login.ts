
import { lambdaFactory } from "@bootstrap/Bootstrap.js";
import { authContainer } from "./bootstrap.js";

export const handler = lambdaFactory.create(authContainer.getHandler());