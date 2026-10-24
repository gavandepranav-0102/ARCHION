import { fcfs, sjf, srtf, priorityNonPreemptive, priorityPreemptive, roundRobin } from "../services/schedulingService.js";
import { validateProcesses } from "../utils/validation.js";

function execute(res, body, algorithm, options = {}) {
  try {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ success: false, message: "Request body must be a JSON object containing a processes array." });
    }
    validateProcesses(body.processes);
    const result = algorithm(body.processes, options);
    if (!result || !Array.isArray(result.processes) || !Array.isArray(result.ganttChart)) {
      throw new Error("The scheduling algorithm returned an incomplete result.");
    }
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    // Invalid user input is a client error; unexpected calculation errors are logged
    // and returned as JSON so the frontend never receives an opaque HTML 500 page.
    const isInputError = /required|must be|duplicate|maximum|at least|enter a process|time quantum|arrival time|burst time|priority/i.test(error?.message || "");
    if (!isInputError) console.error("Scheduling calculation failed:", error);
    return res.status(isInputError ? 400 : 500).json({
      success: false,
      message: isInputError ? error.message : "The scheduling calculation failed unexpectedly. Check the process values and restart the backend."
    });
  }
}

export const runFCFS = (req, res) => execute(res, req.body, fcfs);
export const runSJF = (req, res) => execute(res, req.body, sjf);
export const runSRTF = (req, res) => execute(res, req.body, srtf);
export const runPriority = (req, res) => execute(res, req.body, priorityNonPreemptive);
export const runPriorityPreemptive = (req, res) => execute(res, req.body, priorityPreemptive);
export const runRoundRobin = (req, res) => execute(res, req.body, roundRobin, { quantum: Number(req.body?.quantum) });
