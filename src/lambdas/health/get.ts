import { lambdaFactory } from "@bootstrap/Bootstrap.js";
import { healthContainer } from "./bootstrap.js";


export const handler = lambdaFactory.create(healthContainer.getHandler());