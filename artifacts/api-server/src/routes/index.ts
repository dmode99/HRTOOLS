import { Router, type IRouter } from "express";
import healthRouter from "./health";
import opportunityDiagnosticRouter from "./opportunityDiagnostic";
import projectMarginRouter from "./projectMargin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(opportunityDiagnosticRouter);
router.use(projectMarginRouter);

export default router;
