import { Router, type IRouter } from "express";

const router: IRouter = Router();

type DiagnosticRequest = {
  teamSize?: string;
  industry?: string;
  priority?: string;
  pain?: string;
  hours?: string | number;
};

type DiagnosticResponse = {
  score: number;
  headline: string;
  summary: string;
  recommendations: Array<{ title: string; detail: string }>;
};

function deterministicFallback(input: DiagnosticRequest): DiagnosticResponse {
  const hours = Number(input.hours ?? 0);
  let score = 42;
  if (hours >= 5) score += 12;
  if (hours >= 15) score += 12;
  if (["margin", "operations", "workforce"].includes(String(input.priority))) score += 10;
  if (String(input.pain ?? "").trim().length > 60) score += 8;
  if (["11-50", "51-250", "251-499"].includes(String(input.teamSize))) score += 8;

  return {
    score: Math.min(score, 92),
    headline: "Start with value, then choose the technology.",
    summary: `For a ${input.teamSize || "growing"} person ${input.industry || "SMB"}, start with one measurable workflow, a clear owner and a human approval point for material decisions.`,
    recommendations: [
      {
        title: "Automate one repeated workflow first",
        detail: `Start with a process consuming roughly ${input.hours || 10} hours per week and measure the current baseline before changing it.`,
      },
      {
        title: input.priority === "margin" ? "Run Project Margin Analyzer" : "Run AI Opportunity Map",
        detail: input.priority === "margin"
          ? "Quantify cost-to-complete, scope exposure and the decisions required before adding more automation."
          : "Map the work, systems, decision rights and risks before selecting an agent or tool.",
      },
      {
        title: "Create a 30-day value baseline",
        detail: "Track hours, cycle time, error rate and cost so the business can prove whether the intervention improves the outcome.",
      },
    ],
  };
}

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === "string") return payload.output_text;
  const chunks: string[] = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content?.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("\n");
}

router.post("/ai/opportunity-diagnostic", async (req, res) => {
  const input = req.body as DiagnosticRequest;
  if (!input?.industry || !input?.pain) {
    return res.status(400).json({ error: "industry and pain are required" });
  }

  const fallback = deterministicFallback(input);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.json({ ...fallback, source: "deterministic-fallback" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        instructions: "You are an SMB operations advisor. Return only valid JSON. Be conservative: do not promise savings or imply that AI is suitable where evidence is weak. Recommend one narrow, measurable starting workflow and keep material decisions human-owned.",
        input: `Assess this Canadian SMB AI opportunity. Team size: ${input.teamSize}. Industry: ${input.industry}. Priority: ${input.priority}. Estimated hours/week: ${input.hours}. Current pain: ${input.pain}. Return JSON with keys score (0-100 integer), headline, summary, and recommendations (exactly 3 objects with title and detail).`,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      req.log?.warn({ status: response.status }, "OpenAI diagnostic request failed; using fallback");
      return res.json({ ...fallback, source: "deterministic-fallback" });
    }

    const payload = await response.json();
    const text = extractOutputText(payload);
    const parsed = JSON.parse(text) as DiagnosticResponse;

    if (!Number.isFinite(parsed.score) || !Array.isArray(parsed.recommendations) || parsed.recommendations.length < 3) {
      throw new Error("Invalid diagnostic response shape");
    }

    return res.json({
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      headline: String(parsed.headline || fallback.headline),
      summary: String(parsed.summary || fallback.summary),
      recommendations: parsed.recommendations.slice(0, 3).map((item) => ({
        title: String(item.title || "Recommendation"),
        detail: String(item.detail || ""),
      })),
      source: "openai",
    });
  } catch (error) {
    req.log?.warn({ err: error }, "OpenAI diagnostic parsing failed; using fallback");
    return res.json({ ...fallback, source: "deterministic-fallback" });
  }
});

export default router;
