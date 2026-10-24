export function validateProcesses(processes) {
  if (!Array.isArray(processes) || processes.length === 0) throw new Error("At least one process is required.");
  if (processes.length > 100) throw new Error("Maximum 100 processes are allowed.");
  const ids = new Set();
  processes.forEach((p, i) => {
    if (!p || typeof p.id !== "string" || !p.id.trim()) throw new Error(`Enter a process ID for row ${i + 1}.`);
    if (ids.has(p.id.trim())) throw new Error(`Duplicate process ID: ${p.id.trim()}.`);
    ids.add(p.id.trim());
    const at=Number(p.arrivalTime), bt=Number(p.burstTime), priority=Number(p.priority ?? 1);
    if (!Number.isFinite(at)||at<0) throw new Error(`Arrival time for ${p.id} must be zero or greater.`);
    if (!Number.isFinite(bt)||bt<=0) throw new Error(`Burst time for ${p.id} must be greater than zero.`);
    if (!Number.isFinite(priority)||priority<=0) throw new Error(`Priority for ${p.id} must be greater than zero.`);
  });
}
