import { Router } from "express";
import { handler as login} from "@lambdas/auth/login.js";
import { invoke } from "../adapter/LocalLambdaInvoker.js";


const router:Router = Router();
router.post("/auth/login", invoke(login));

export default router;