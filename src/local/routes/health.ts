import { Router } from "express";
import { handler as get} from "@lambdas/health/get.js";
import { invoke } from "../adapter/LocalLambdaInvoker.js";


const router:Router = Router();
router.get("/health", invoke(get));

export default router;