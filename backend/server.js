import express from "express";
import cors from "cors";
import schedulingRoutes from "./routes/schedulingRoutes.js";
import { generateReport } from "./controllers/reportController.js";

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "CPU Scheduling API is running." });
});
app.use("/api/scheduling", schedulingRoutes);
app.post("/api/report", generateReport);

app.post("/api/assistant/command", async (req, res) => {
  const { command, language = "en-IN", context = {} } = req.body || {};
  if (typeof command !== "string" || !command.trim() || command.length > 1000) {
    return res.status(400).json({ success: false, message: "A valid voice command is required." });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({ success: false, message: "AI fallback is not configured; built-in voice commands remain available." });
  try {
    const response = await fetch(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `You classify voice commands for a CPU scheduling educational website. Reply ONLY as JSON with keys action, page, algorithm, count, message. Allowed actions: navigate, select_algorithm, add_processes, simulate, answer, unsupported. Allowed pages: home, simulator. Allowed algorithms: fcfs, sjf, srtf, priority, priorityPreemptive, roundRobin. Never invent an action. For destructive/ambiguous actions use answer and ask a concise clarification. Support English, Hindi and Hinglish. Context: ${JSON.stringify({page:context.page,algorithm:context.algorithm,processCount:Array.isArray(context.processes)?context.processes.length:0,hasResult:!!context.hasResult})}. Do not return code or arbitrary commands.` },
          { role: "user", content: `Language: ${language}. Command: ${command}` }
        ]
      }),
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) return res.status(502).json({ success: false, message: "AI command interpretation is temporarily unavailable." });
    const payload = await response.json();
    let parsed;
    try { parsed = JSON.parse(payload.choices?.[0]?.message?.content || "{}"); }
    catch { return res.status(502).json({ success: false, message: "AI returned an invalid command." }); }
    const allowedActions = new Set(["navigate", "select_algorithm", "add_processes", "simulate", "answer", "unsupported"]);
    const allowedPages = new Set(["home", "simulator"]);
    const allowedAlgorithms = new Set(["fcfs", "sjf", "srtf", "priority", "priorityPreemptive", "roundRobin"]);
    if (!allowedActions.has(parsed.action)) parsed.action = "unsupported";
    if (parsed.action === "navigate" && !allowedPages.has(parsed.page)) parsed.action = "unsupported";
    if (parsed.action === "select_algorithm" && !allowedAlgorithms.has(parsed.algorithm)) parsed.action = "unsupported";
    if (parsed.action === "add_processes") parsed.count = Math.max(1, Math.min(20, Number.parseInt(parsed.count, 10) || 1));
    parsed.message = typeof parsed.message === "string" ? parsed.message.slice(0, 300) : "";
    return res.json(parsed);
  } catch (error) {
    console.error("AI command fallback failed:", error.message);
    return res.status(502).json({ success: false, message: "AI command interpretation failed." });
  }
});


app.use((err, _req, res, _next) => {
  console.error("API request failed:", err?.stack || err);
  if (res.headersSent) return;
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Request body is not valid JSON. Please retry the simulation." });
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request is too large. Reduce the number of processes and try again." });
  }
  return res.status(500).json({ success: false, message: "The backend encountered an unexpected error. Check the backend terminal for details." });
});

app.listen(PORT, () => console.log(`CPU Scheduling API running on http://localhost:${PORT}`));
