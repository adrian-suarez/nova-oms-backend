import { Router } from "express";
import { handler as current} from "@lambdas/users/current.js";
import { handler as get} from "@lambdas/users/get.js";
import { handler as list} from "@lambdas/users/list.js";
import { handler as create} from "@lambdas/users/create.js";

import { invoke } from "../adapter/LocalLambdaInvoker.js";


const router:Router = Router();
router.get("/users/me", invoke(current));
router.get("/users/:id", invoke(get));
router.get("/users", invoke(list));
router.post("/users", invoke(create));

export default router;
