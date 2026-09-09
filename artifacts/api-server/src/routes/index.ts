import { Router, type IRouter } from "express";
import healthRouter from "./health";
import opportunityDiagnosticRouter from "./opportunityDiagnostic";
import projectMarginRouter from "./projectMargin";
import platformRouter from "./platform";

const router: IRouter = Router();

router.use(healthRouter);
router.use(opportunityDiagnosticRouter);
router.use(projectMarginRouter);
router.use(platformRouter);

export default router;
