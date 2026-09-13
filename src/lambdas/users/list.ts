import { lambdaFactory } from "@bootstrap/Bootstrap.js";
import { userContainer } from "./bootstrap.js";

export const handler = lambdaFactory.create(userContainer.getGetUsersHandler());