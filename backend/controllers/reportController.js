import PDFDocument from "pdfkit";
import { fileURLToPath } from "node:url";
import path from "node:path";

const fmt = value => Number.isFinite(Number(value)) ? Number(value).toFixed(2).replace(/\.00$/, "") : String(value ?? "—");
const algorithmInfo = {
  fcfs: {
    title: "First Come, First Served (FCFS)", rule: "Non-preemptive: run the ready process with the earliest arrival time.",
    definition: "Processes receive the CPU in arrival order. Once a process starts, it keeps the CPU until its CPU burst finishes.",
    advantages: "Simple, predictable and easy to implement; no starvation caused by the ordering rule.",
    disadvantages: "A long process can delay many short ones (the convoy effect); response time can be poor for interactive work.",
    real: "Like a single service counter: customers are served in the order they join the queue.",
    link: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf", linkLabel: "OSTEP: CPU Scheduling"
  },
  sjf: {
    title: "Shortest Job First (SJF) — Non-preemptive", rule: "Choose the ready process with the smallest full CPU burst; ties use arrival/input order.",
    definition: "Among processes that have already arrived, the scheduler selects the one with the shortest CPU burst. It runs to completion without interruption.",
    advantages: "Often minimizes average waiting time when burst lengths are known; short jobs finish quickly.",
    disadvantages: "The next burst must be estimated or known; long jobs may starve if short jobs keep arriving; a running job is not interrupted.",
    real: "A print shop may finish small print jobs before a large batch, provided both jobs are waiting.",
    link: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf", linkLabel: "OSTEP: SJF and scheduling"
  },
  srtf: {
    title: "Shortest Remaining Time First (SRTF)", rule: "Preemptive SJF: run the ready process with the least remaining CPU time.",
    definition: "The scheduler may interrupt the current process when a newly arrived process has a shorter remaining burst, then resume the interrupted process later.",
    advantages: "Can improve waiting and turnaround for short jobs; adapts to newly arriving work.",
    disadvantages: "Requires remaining-time estimates; can cause many context switches and may starve long jobs.",
    real: "A help desk reprioritizes a task when a very quick request arrives, pausing a longer task if policy allows.",
    link: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf", linkLabel: "OSTEP: SJF / STCF"
  },
  priority: {
    title: "Priority Scheduling — Non-preemptive", rule: "Choose the ready process with the smallest numeric priority value (1 is highest).",
    definition: "Each process is assigned a priority. The highest-priority ready process runs to completion; a running process is not interrupted.",
    advantages: "Important or urgent work can be served first; priorities are easy to reason about.",
    disadvantages: "Low-priority processes can starve; priority assignment needs careful design.",
    real: "A clinic triages waiting patients by urgency, but a patient already being treated is not interrupted in this simplified model.",
    link: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf", linkLabel: "OSTEP: Scheduling policies"
  },
  priorityPreemptive: {
    title: "Priority Scheduling — Preemptive", rule: "Run the ready process with the smallest numeric priority; a higher-priority arrival can preempt.",
    definition: "Priority determines CPU access. If a process with a higher priority arrives, the current process may be paused and later resumed.",
    advantages: "Urgent work can respond quickly; useful when priority levels reflect real service requirements.",
    disadvantages: "Low-priority work may starve and frequent preemption adds overhead; aging is a common mitigation.",
    real: "An operating system may pause background work so a time-critical system task can run immediately.",
    link: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf", linkLabel: "OSTEP: Scheduling policies"
  },
  roundRobin: {
    title: "Round Robin (RR)", rule: "Each ready process receives at most one time quantum per turn, then unfinished work returns to the queue.",
    definition: "A preemptive, cyclic queue gives each process a time slice. An unfinished process is placed at the back of the ready queue.",
    advantages: "Fair CPU sharing and good interactive responsiveness when the quantum is appropriate.",
    disadvantages: "A very small quantum increases context-switch overhead; a very large quantum behaves more like FCFS.",
    real: "Several users share one help-desk agent in short turns, so nobody monopolizes the service for too long.",
    link: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf", linkLabel: "OSTEP: Round Robin"
  }
};

export function generateReport(req, res) {
  const { processes, algorithmName, algorithm, quantum, result } = req.body || {};
  if (!Array.isArray(processes) || !processes.length || !result ||
      !Array.isArray(result.processes) || !Array.isArray(result.ganttChart)) {
    return res.status(400).json({ success: false, message: "Run a simulation first, then generate the report." });
  }

  const key = String(algorithm || "");
  const info = algorithmInfo[key] || algorithmInfo.fcfs;
  const name = algorithmName || result.algorithm || info.title;
  const doc = new PDFDocument({
    size: "A4", margin: 34, autoFirstPage: true,
    info: { Title: `${name} — CPU Scheduling Analysis`, Author: "ARCHION CPU Scheduling Simulator", Subject: "Two-page CPU scheduling learning report" }
  });
  const filename = `CPU-Scheduling-Report-${key.replace(/[^a-z0-9_-]/gi, "-") || "simulation"}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);

  const W = doc.page.width, H = doc.page.height, M = 36, CW = W - M * 2;
  const headerImage = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/pdf-header.png");
  const navy = "#172D42", teal = "#167C80", ink = "#243746", muted = "#536779";
  const pale = "#EAF4F2", light = "#F3F7FA", border = "#D6E1E5", white = "#FFFFFF";
  const text = (str, x, y, width, size=9, color=ink, font="Helvetica", opts={}) => {
    doc.font(font).fontSize(size).fillColor(color).text(String(str ?? ""), x, y, { width, lineGap: 2, characterSpacing: 0.28, ...opts });
  };
  const titleBar = (page, subtitle) => {
    // User-provided artwork is confined to the PDF heading strip, cropped to fit.
    // A translucent navy wash fades the image and preserves strong title contrast.
    // The banner asset is pre-cropped to a panoramic circuit background without baked-in text.
    // Stretch it to the full page width; all three title lines are rendered once, in white.
    const headerH = 78;
    doc.image(headerImage, 0, 0, { width: W, height: headerH });
    doc.save();
    doc.fillOpacity(0.64).rect(0, 0, W, headerH).fill(navy);
    doc.restore();
    text("ARCHION  /  OPERATING SYSTEMS", M, 9, CW, 10.0, white, "Helvetica-Bold", { lineBreak: false });
    text(page === 1 ? "CPU SCHEDULING • ALGORITHM GUIDE" : "SIMULATION RESULTS • FORMULA WALKTHROUGH", M, 25, CW, 17.5, white, "Helvetica-Bold", { lineBreak: false });
    text(subtitle, M, 51, CW, 10.0, white, "Helvetica-Bold", { lineBreak: false });
  };
  const section = (label, x, y, width=CW) => {
    text(label.toUpperCase(), x, y, width, 13, teal, "Helvetica-Bold");
    doc.moveTo(x, y+14).lineTo(x+width, y+14).strokeColor(border).lineWidth(0.8).stroke();
    return y+23;
  };
  // Draw wrapped lines manually so PDFKit never auto-inserts overflow pages.
  // All report content stays on the two deliberately designed A4 pages.
  const paragraph = (str, x, y, width, size=9, color=ink, opts={}) => {
    const font = opts.font || "Helvetica";
    // Increase leading substantially for comfortable reading while keeping the existing two-page structure.
const lineHeight = opts.lineHeight || size * 1.25;
    const maxLines = opts.maxLines || 8;
    doc.font(font).fontSize(size).fillColor(color);
    const words = String(str ?? "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && doc.widthOfString(candidate) > width) { lines.push(line); line = word; }
      else line = candidate;
    }
    if (line) lines.push(line);
    const visible = lines.slice(0, maxLines);
    visible.forEach((ln, i) => doc.text(ln, x, y + i * lineHeight, { lineBreak: false, continued: false, characterSpacing: 0.28 }));
    if (lines.length > maxLines && visible.length) {
      let last = visible[visible.length - 1];
      while (last.length && doc.widthOfString(`${last}…`) > width) last = last.slice(0, -1);
      doc.text(`${last}…`, x, y + (visible.length - 1) * lineHeight, { lineBreak: false, characterSpacing: 0.28 });
    }
    return y + visible.length * lineHeight;
  };
 const footer = (page) => {
  doc.moveTo(M, H - 55)
    .lineTo(W - M, H - 55)
    .strokeColor(border)
    .lineWidth(0.7)
    .stroke();

  text(
    "Generated from your simulator inputs",
    M,
    H - 47,
    CW - 60,
    7.5,
    muted,
    "Helvetica",
    { lineBreak: false }
  );

  text(
    `${page} / 2`,
    W - M - 35,
    H - 47,
    35,
    7.5,
    muted,
    "Helvetica-Bold",
    { align: "right", lineBreak: false }
  );
};
  const drawTable = (x, y, widths, headers, rows, options={}) => {
    const totalW = widths.reduce((a,b)=>a+b,0);
    const rowH = options.rowH || 20;
    const fs = options.fontSize || 9;
    doc.roundedRect(x, y, totalW, 20, 3).fill(navy);
    let xx=x;
    headers.forEach((h,i)=>{ text(h,xx+4,y+5,widths[i]-8,9.6,white,"Helvetica-Bold",{lineBreak:false}); xx+=widths[i]; });
    y+=20;
    rows.forEach((row,ri)=>{
      if(ri%2===0) doc.rect(x,y,totalW,rowH).fill(light);
      xx=x;
      row.forEach((v,i)=>{ text(v,xx+4,y+(rowH-fs)/2-1,widths[i]-8,fs,ink,"Helvetica",{lineBreak:false, ellipsis:true}); xx+=widths[i]; });
      y+=rowH;
    });
    doc.moveTo(x,y).lineTo(x+totalW,y).strokeColor(border).lineWidth(.5).stroke();
    return y+5;
  };

  // PAGE 1: algorithm-specific learning material + problem/input.
  titleBar(1, "Concepts, real-world analogy and the problem being solved");
  let y=91;
  text(name, M, y, CW, 16.5, navy, "Helvetica-Bold"); y+=21;
  const badgeText = key === "roundRobin" ? `TIME QUANTUM: ${fmt(quantum)} units` : (key.includes("Preemptive") || key === "srtf" ? "PREEMPTIVE POLICY" : "NON-PREEMPTIVE POLICY");
  doc.roundedRect(M,y,CW,25,5).fill(pale);
  text("SCHEDULING RULE",M+9,y+5,100,8.6,teal,"Helvetica-Bold");
  text(info.rule+(key==="roundRobin" ? ` Quantum q = ${fmt(quantum)} time units.` : ""),M+105,y+5,CW-115,9.5,ink);
  y+=34;
  y=section("Definition and how it works",M,y);
  y=paragraph(info.definition,M,y,CW,12)+5;
  // Real-life and pros/cons in two balanced columns.
  const gap=14, col=(CW-gap)/2, x2=M+col+gap;
  let yy=section("Real-life analogy",M,y,col);
  yy=paragraph(info.real,M,yy,col,11.5)+4;
  yy=paragraph("In the simulator, arrival time (AT) says when a process joins the ready queue; burst time (BT) is the CPU time it needs.",M,yy,col,11,muted);
  let ry=section("Advantages and limitations",x2,y,col);
  ry=paragraph("ADVANTAGES",x2,ry,col,7.6,teal,{});
  ry=paragraph(info.advantages,x2,ry,col,11)+4;
  ry=paragraph("LIMITATIONS",x2,ry,col,7.6,teal,{});
  ry=paragraph(info.disadvantages,x2,ry,col,11);
  y=Math.max(yy,ry)+7;

  y=section("Scheduling diagram • decision flow",M,y);
  // A compact diagram with labeled boxes and connectors, not a screenshot.
  const boxY=y, boxH=30, gapB=8, boxW=(CW-gapB*3)/4;
  const labels=[
    ["1  ARRIVAL","Process enters queue"],
    ["2  READY QUEUE","Eligible processes"],
    ["3  SELECT","Apply policy rule"],
    ["4  CPU RUN","Complete / preempt"]
  ];
  labels.forEach((a,i)=>{
    const bx=M+i*(boxW+gapB);
    doc.roundedRect(bx,boxY,boxW,boxH,4).fill(i===2?"#D7EEEA":light).stroke(border);
    text(a[0],bx+4,boxY+5,boxW-8,8.2,navy,"Helvetica-Bold",{align:"center"});
    text(a[1],bx+4,boxY+16,boxW-8,7.6,muted,"Helvetica",{align:"center"});
    if(i<3){
      const ax=bx+boxW+1, ay=boxY+boxH/2;
      doc.moveTo(ax,ay).lineTo(ax+gapB-2,ay).strokeColor(teal).lineWidth(1).stroke();
      doc.moveTo(ax+gapB-5,ay-3).lineTo(ax+gapB-2,ay).lineTo(ax+gapB-5,ay+3).strokeColor(teal).lineWidth(1).stroke();
    }
  });
  y=boxY+boxH+7;
  text("Non-preemptive: the selected process runs to completion. Preemptive: a new decision may interrupt it. RR: switch after the time quantum.",M,y,CW,9.2,muted,"Helvetica-Oblique");
  y+=20;

  y=section("Problem statement and input data",M,y);
  const usesPriority = key === "priority" || key === "priorityPreemptive";
  const inputText=processes.map(p=>`${p.id}: AT=${fmt(p.arrivalTime)}, BT=${fmt(p.burstTime)}${usesPriority ? `, Priority=${fmt(p.priority ?? 1)}` : ""}`).join("; ");
  y=paragraph(`Given the processes below, apply ${name}${key==="roundRobin" ? ` with quantum q = ${fmt(quantum)}` : ""}. Draw the CPU Gantt chart and calculate CT, TAT, WT and RT for each process, then evaluate average waiting/turnaround time and CPU utilization.`,M,y,CW,11.5)+4;
  const showN=Math.min(processes.length,8);
  const inputRows=processes.slice(0,showN).map(p=>usesPriority ? [p.id,fmt(p.arrivalTime),fmt(p.burstTime),fmt(p.priority ?? 1)] : [p.id,fmt(p.arrivalTime),fmt(p.burstTime)]);
  if(processes.length>showN) inputRows.push(usesPriority ? [`+${processes.length-showN} more`, "See results", "All inputs", ""] : [`+${processes.length-showN} more`, "See results", "All inputs"]);
  y=usesPriority
    ? drawTable(M,y,[CW*.25,CW*.25,CW*.25,CW*.25],["PROCESS","ARRIVAL (AT)","BURST (BT)","PRIORITY"],inputRows,{rowH:20,fontSize:10.5})
    : drawTable(M,y,[CW/3,CW/3,CW/3],["PROCESS","ARRIVAL (AT)","BURST (BT)"],inputRows,{rowH:20,fontSize:10.5});
  if(usesPriority) text("Priority convention: a smaller number means a higher priority. All values and results are based on the current simulation.",M,Math.min(y+1,H-43),CW,9.5,muted,"Helvetica-Oblique");
  footer(1);

  // PAGE 2: Gantt, results, formula glossary with definitions and significance.
  doc.addPage({ size:"A4", margin:34 });
  titleBar(2, "Worked output, formula meanings and performance interpretation");
  y=91;
  y=section("CPU execution Gantt chart",M,y);
  const blocks=result.ganttChart;
  const chartX=M, chartY=y, chartW=CW, chartH=38;
  const endTime=Math.max(1,Number(result.totalTime)||Math.max(1,...blocks.map(b=>Number(b.end)||0)));
  const colors=["#CBE9E1","#DCD5F0","#F5DDC9","#D5E7F4","#F1E7B8","#EED4E0"];
  blocks.forEach((b,i)=>{
    const bx=chartX+(Number(b.start)/endTime)*chartW;
    const bw=Math.max(1,(Number(b.end)-Number(b.start))/endTime*chartW);
    const n=Number((String(b.id).match(/\d+/)||[1])[0]);
    doc.rect(bx,chartY,bw,chartH).fillAndStroke(b.id==="IDLE"?"#E4E9ED":colors[(n-1)%colors.length],white);
    if(bw>20){
      text(String(b.id),bx+1,chartY+5,bw-2,8.5,navy,"Helvetica-Bold",{align:"center",lineBreak:false});
      text(`${fmt(b.start)}–${fmt(b.end)}`,bx+1,chartY+18,bw-2,7.5,muted,"Helvetica",{align:"center",lineBreak:false});
    }
  });
  const ticks=[...new Set([0,...blocks.map(b=>Number(b.end))])].sort((a,b)=>a-b);
  ticks.forEach(t=>{
    const tx=chartX+t/endTime*chartW;
    doc.moveTo(tx,chartY+chartH).lineTo(tx,chartY+chartH+4).strokeColor(muted).lineWidth(.6).stroke();
    text(fmt(t),Math.max(M,Math.min(W-M-22,tx-10)),chartY+chartH+5,22,6.5,muted,"Helvetica",{align:"center",lineBreak:false});
  });
  y=chartY+chartH+20;
  y=section("Calculated process metrics",M,y);
  const metrics=result.processes;
  const metricRows=metrics.slice(0,8).map(p=>[p.id,fmt(p.arrivalTime),fmt(p.burstTime),fmt(p.startTime),fmt(p.completionTime),fmt(p.turnaroundTime),fmt(p.waitingTime),fmt(p.responseTime)]);
  if(metrics.length>8) metricRows.push([`+${metrics.length-8} more`,"—","—","—","—","—","—","—"]);
  y=drawTable(M,y,[CW*.13,CW*.105,CW*.105,CW*.12,CW*.12,CW*.14,CW*.14,CW*.14],["PID","AT","BT","FIRST","CT","TAT","WT","RT"],metricRows,{rowH:20,fontSize:10.5});
  const avgW=fmt(result.averageWaitingTime), avgT=fmt(result.averageTurnaroundTime);
  // Use the exact displayed metric returned by the scheduling service and shown
  // in the website. The service retains rawCpuUtilization for formula auditing.
  // Never independently recalculate the displayed value in the PDF.
  const reportedUtilization = Number(result.cpuUtilization);
  const util = fmt(Number.isFinite(reportedUtilization) ? reportedUtilization : 0);
  const statY=y+1, statGap=8, statW=(CW-statGap*2)/3;
  [[ "AVG WAITING",`${avgW} units` ],["AVG TURNAROUND",`${avgT} units`],["CPU UTILIZATION",`${util}%`]].forEach((s,i)=>{
    const sx=M+i*(statW+statGap);
    doc.roundedRect(sx,statY,statW,34,4).fill(i===2?"#E8F3F1":light).stroke(border);
    text(s[0],sx+7,statY+6,statW-14,8.5,teal,"Helvetica-Bold");
    text(s[1],sx+7,statY+17,statW-14,12,navy,"Helvetica-Bold");
  });
  y=statY+43;
  y=section("Formula reference • every term explained",M,y);
  const formulas=[
    ["Completion time (CT)","CT = AT + TAT","AT is arrival time and TAT is turnaround time. CT is the time when the process finishes its last CPU run."],
    ["Turnaround time (TAT)","TAT = CT - AT","CT is completion time and AT is arrival time. TAT is total elapsed time in the system, including waiting and CPU execution."],
    ["Waiting time (WT)","WT = TAT - BT = CT - AT - BT","BT is the required CPU burst time. WT measures time spent ready but not executing (under this model)."],
    ["Response time (RT)","RT = first CPU start time - AT","First CPU start is the first instant the process runs. RT measures initial responsiveness, not total waiting."],
    ["Average WT / TAT","Average WT = (WT1 + WT2 + ... + WTn) ÷ n; Average TAT = (TAT1 + TAT2 + ... + TATn) ÷ n","Add each process metric, then divide by n, the number of processes. A lower average often means less delay."],
    ["CPU utilization","CPU utilization = (busy CPU time ÷ elapsed schedule time) × 100%","Busy CPU time is the sum of all process burst times. Elapsed schedule time includes any idle gaps, so utilization varies with the actual process arrival and burst times. The website and PDF show the same calculated value."]
  ];
  const fRowH=38;
  formulas.forEach((f,i)=>{
    if(i%2===0) doc.rect(M,y,CW,fRowH).fill(light);
    text(f[0],M+5,y+4,105,8.6,navy,"Helvetica-Bold");
    text(f[1],M+115,y+3,CW-120,9.5,teal,"Helvetica-Bold",{lineBreak:false});
    paragraph(f[2],M+115,y+15,CW-120,9,muted,{maxLines:2,lineHeight:9});
    y+=fRowH;
  });
  y+=5;
  y=section("Interpretation and further learning",M,y);
  const summary=`This run reports ${fmt(result.contextSwitches)} context switch(es) and ${fmt(result.totalTime)} total time units. Compare averages alongside fairness: a low average can still hide long delays for individual processes.`;
  y=paragraph(summary,M,y,CW,10.2,ink,{maxLines:2,lineHeight:10})+2;
  text("Free university reference:",M,y,CW,9.5,muted,"Helvetica",{lineBreak:false}); y+=13;
  text("Operating Systems: Three Easy Pieces — CPU scheduling chapter",M,y,CW,9.8,teal,"Helvetica-Bold",{link:info.link, underline:true, lineBreak:false});
  y+=16;
  text("https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf",M,y,CW,9.1,muted,"Helvetica",{link:info.link, underline:true, lineBreak:false});
  footer(2);
  const pageRange = doc.bufferedPageRange();
  // The report is laid out on two explicit A4 pages. Do not mutate PDFKit's
  // internal page buffer: that can prevent the response stream from finishing.
  // Keep content within the designed page regions and let PDFKit stream normally.
  doc.end();
}
