import { Router, type IRouter } from "express";

const router: IRouter = Router();

type MarginRequest = {
  contractValue?: number | string;
  plannedCost?: number | string;
  actualCost?: number | string;
  percentComplete?: number | string;
  approvedChanges?: number | string;
  unapprovedScope?: number | string;
};

router.post("/analysis/project-margin", (req, res) => {
  const input = req.body as MarginRequest;
  const contractValue = Number(input.contractValue ?? 0);
  const approvedChanges = Number(input.approvedChanges ?? 0);
  const plannedCost = Number(input.plannedCost ?? 0);
  const actualCost = Number(input.actualCost ?? 0);
  const percentComplete = Math.max(1, Math.min(100, Number(input.percentComplete ?? 0))) / 100;
  const unapprovedScope = Number(input.unapprovedScope ?? 0);

  if (!Number.isFinite(contractValue) || contractValue <= 0 || !Number.isFinite(plannedCost) || plannedCost < 0 || !Number.isFinite(actualCost) || actualCost < 0) {
    return res.status(400).json({ error: "valid contract value, planned cost and actual cost are required" });
  }

  const adjustedValue = contractValue + Math.max(0, approvedChanges);
  const forecastCost = Math.max(actualCost, actualCost / percentComplete);
  const forecastMargin = adjustedValue - forecastCost;
  const forecastMarginPct = adjustedValue ? (forecastMargin / adjustedValue) * 100 : 0;
  const costVariance = forecastCost - plannedCost;
  const risk = forecastMarginPct < 30 || costVariance > adjustedValue * 0.1 ? "High" : forecastMarginPct < 45 || costVariance > 0 ? "Watch" : "Healthy";

  const actions: string[] = [];
  if (costVariance > 0) actions.push("Revalidate remaining effort, delivery assumptions and resource mix because forecast cost is above plan.");
  if (unapprovedScope > 0) actions.push("Classify and commercially review unapproved scope before further effort is committed.");
  if (forecastMarginPct < 45) actions.push("Set a margin recovery action owner and review the project weekly until the forecast stabilises.");
  if (!actions.length) actions.push("Current trajectory is within plan; continue monitoring cost-to-complete and scope changes.");

  return res.json({ adjustedValue, forecastCost, forecastMargin, forecastMarginPct, costVariance, unapprovedScope, risk, actions });
});

export default router;
