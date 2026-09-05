import { lambdaFactory } from "@bootstrap/Bootstrap.js";
import { roleContainer } from "./bootstrap.js";


export const handler = lambdaFactory.create(roleContainer.getGetRoleHandler());