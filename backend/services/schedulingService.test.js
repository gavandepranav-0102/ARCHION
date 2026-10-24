import test from "node:test";
import assert from "node:assert/strict";
import { fcfs, sjf, srtf, priorityNonPreemptive, priorityPreemptive, roundRobin } from "./schedulingService.js";
import { validateProcesses } from "../utils/validation.js";

const processes = [
  { id: "P1", arrivalTime: 0, burstTime: 5, priority: 2 },
  { id: "P2", arrivalTime: 1, burstTime: 3, priority: 1 },
  { id: "P3", arrivalTime: 2, burstTime: 1, priority: 3 }
];
const algorithms = [
  ["FCFS", () => fcfs(processes)],
  ["SJF", () => sjf(processes)],
  ["SRTF", () => srtf(processes)],
  ["Priority non-preemptive", () => priorityNonPreemptive(processes)],
  ["Priority preemptive", () => priorityPreemptive(processes)],
  ["Round Robin", () => roundRobin(processes, { quantum: 2 })]
];
for (const [name, run] of algorithms) test(`${name} returns finite, complete scheduling metrics`, () => {
  const result = run();
  assert.equal(result.processes.length, processes.length);
  assert.ok(result.ganttChart.length > 0);
  assert.ok(Number.isFinite(result.averageWaitingTime));
  assert.ok(Number.isFinite(result.averageTurnaroundTime));
  assert.ok(Number.isFinite(result.cpuUtilization));
  assert.ok(result.cpuUtilization >= 40 && result.cpuUtilization <= 90);
  assert.ok(result.rawCpuUtilization >= 0 && result.rawCpuUtilization <= 100);
  for (const p of result.processes) {
    assert.ok(Number.isFinite(p.completionTime));
    assert.ok(Number.isFinite(p.turnaroundTime));
    assert.ok(Number.isFinite(p.waitingTime));
    assert.ok(Number.isFinite(p.responseTime));
  }
});
test("invalid process lists are rejected cleanly", () => {
  assert.throws(() => validateProcesses([]), /At least one process/);
  assert.throws(() => validateProcesses([{ id: "P1", arrivalTime: 0, burstTime: 0 }]), /Burst time/);
  assert.throws(() => validateProcesses([{ id: "P1", arrivalTime: 0, burstTime: 1 }, { id: "P1", arrivalTime: 1, burstTime: 1 }]), /Duplicate process ID/);
});
test("Round Robin rejects a missing or invalid quantum", () => {
  assert.throws(() => roundRobin(processes, { quantum: 0 }), /positive integer/);
  assert.throws(() => roundRobin(processes, { quantum: 1.5 }), /positive integer/);
});


test("CPU utilization reflects the actual workload and idle gaps", () => {
  const fullyBusy = fcfs([
    { id: "P1", arrivalTime: 0, burstTime: 4 },
    { id: "P2", arrivalTime: 0, burstTime: 6 }
  ]);
  assert.equal(fullyBusy.rawCpuUtilization, 100);
  assert.equal(fullyBusy.cpuUtilization, 90);

  const withIdleGap = fcfs([
    { id: "P1", arrivalTime: 0, burstTime: 4 },
    { id: "P2", arrivalTime: 6, burstTime: 2 }
  ]);
  assert.equal(withIdleGap.rawCpuUtilization, 75);
  assert.equal(withIdleGap.cpuUtilization, 75);

  const differentWorkload = fcfs([
    { id: "P1", arrivalTime: 0, burstTime: 2 },
    { id: "P2", arrivalTime: 8, burstTime: 2 }
  ]);
  assert.equal(differentWorkload.rawCpuUtilization, 40);
  assert.equal(differentWorkload.cpuUtilization, 40);
});


test("displayed CPU utilization is capped at 90 while preserving the formula result", () => {
  const result = fcfs([{ id: "P1", arrivalTime: 0, burstTime: 5 }]);
  assert.equal(result.rawCpuUtilization, 100);
  assert.equal(result.cpuUtilization, 90);
});
