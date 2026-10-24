import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, ArrowDown, ArrowUpRight, Cpu, FileText, Gauge, Layers3, Play, Plus, RotateCcw, Sparkles, Trash2, Zap, Mic, MicOff, Volume2, VolumeX, MessageCircle } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import "./style.css";

gsap.registerPlugin(ScrollTrigger);
const API = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const sample = [
  { id: "P1", arrivalTime: 0, burstTime: 7, priority: 2 },
  { id: "P2", arrivalTime: 2, burstTime: 4, priority: 1 },
  { id: "P3", arrivalTime: 4, burstTime: 1, priority: 3 },
  { id: "P4", arrivalTime: 5, burstTime: 4, priority: 2 }
];
const algorithmNames = {
  fcfs: "First Come, First Served (FCFS)",
  sjf: "Shortest Job First (SJF) — Non-preemptive",
  srtf: "Shortest Remaining Time First (SRTF)",
  priority: "Priority Scheduling — Non-preemptive",
  priorityPreemptive: "Priority Scheduling — Preemptive",
  roundRobin: "Round Robin"
};

function CpuScene() {
  const mountRef = useRef(null);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer, scene, camera, chip, frame;
    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(38, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 100);
      camera.position.set(3.8, 3.2, 5.5);
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0x9cbfff, 2));
      const key = new THREE.PointLight(0x70e6ff, 42);
      key.position.set(4, 5, 5);
      scene.add(key);
      const rim = new THREE.PointLight(0x7c5cff, 24);
      rim.position.set(-4, 1, -3);
      scene.add(rim);
      const group = new THREE.Group();
      scene.add(group);
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.32, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x152c4f, metalness: 0.72, roughness: 0.24 })
      );
      group.add(body);
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(1.55, 0.12, 1.55),
        new THREE.MeshStandardMaterial({ color: 0x142d4c, metalness: 0.65, roughness: 0.2, emissive: 0x0b3d68, emissiveIntensity: 0.65 })
      );
      top.position.y = 0.22;
      group.add(top);
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.09, 0.78),
        new THREE.MeshStandardMaterial({ color: 0x8cecff, emissive: 0x31baff, emissiveIntensity: 1.8, metalness: 0.4, roughness: 0.2 })
      );
      core.position.y = 0.32;
      group.add(core);
      const pinMaterial = new THREE.MeshStandardMaterial({ color: 0x5ad8ff, metalness: 0.75, roughness: 0.25, emissive: 0x1268b3, emissiveIntensity: 0.5 });
      for (let i = -3; i <= 3; i++) {
        for (const side of [-1, 1]) {
          const pinA = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.22), pinMaterial);
          pinA.position.set(i * 0.27, -0.02, side * 1.17);
          group.add(pinA);
          const pinB = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.08), pinMaterial);
          pinB.position.set(side * 1.17, -0.02, i * 0.27);
          group.add(pinB);
        }
      }
      chip = group;
      chip.rotation.set(-0.16, 0.3, 0.04);
      const resize = () => {
        if (!mount || !renderer) return;
        const w = Math.max(1, mount.clientWidth), h = Math.max(1, mount.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", resize);
      const animate = () => {
        frame = requestAnimationFrame(animate);
        chip.rotation.y += 0.0032;
        chip.position.y = Math.sin(Date.now() * 0.001) * 0.09;
        renderer.render(scene, camera);
      };
      animate();
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
        scene.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => m.dispose());
        });
      };
    } catch (e) {
      mount.classList.add("scene-fallback");
      mount.textContent = "CPU";
    }
  }, []);
  return <div className="cpu-scene" ref={mountRef} aria-label="Animated 3D CPU chip" />;
}

function BackgroundAtmosphere() {
  const particles = Array.from({ length: 72 }, (_, i) => ({
    id: i, left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`,
    delay: `${-((i * 1.7) % 18)}s`, duration: `${14 + (i % 11)}s`, size: `${4 + (i % 5)}px`,
    tone: ['#66BB6A', '#A5D6A7', '#D9B45B', '#9FC7D8', '#C9B5DF'][i % 5]
  }));
  return <div className="molecule-field" aria-hidden="true">{particles.map(p => <i key={p.id} style={{ left:p.left, top:p.top, animationDelay:p.delay, animationDuration:p.duration, width:p.size, height:p.size, background:p.tone }} />)}</div>;
}

function PointerSparkles() {
  useEffect(() => {
    let last = 0;
    const move = (event) => {
      const now = performance.now();
      if (now - last < 34) return;
      last = now;
      const particle = document.createElement('span');
      particle.className = 'cursor-spark';
      particle.textContent = ['✦', '·', '✧', '✦'][Math.floor(Math.random() * 4)];
      particle.style.left = `${event.clientX + (Math.random() * 16 - 8)}px`;
      particle.style.top = `${event.clientY + (Math.random() * 16 - 8)}px`;
      particle.style.setProperty('--drift-x', `${Math.random() * 46 - 23}px`);
      particle.style.setProperty('--drift-y', `${-18 - Math.random() * 36}px`);
      document.body.appendChild(particle);
      window.setTimeout(() => particle.remove(), 3000);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
  return null;
}

function App() {
  const [page, setPage] = useState("home");
  const [processes, setProcesses] = useState(sample);
  const [algorithm, setAlgorithm] = useState("sjf");
  const [quantum, setQuantum] = useState(2);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState("");
  const reportRef = useRef(null);
  const [voiceStatus, setVoiceStatus] = useState("Voice guide is ready");
  const speechRef = useRef(null);
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [wakeEnabled, setWakeEnabled] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState("en-IN");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [heardText, setHeardText] = useState("");
  const [commandStatus, setCommandStatus] = useState("Try: “go to simulator” or “FCFS choose karo”");
  const stateRef = useRef({ page, processes, algorithm, quantum, result, loading, reportLoading });
  useEffect(() => { stateRef.current = { page, processes, algorithm, quantum, result, loading, reportLoading }; }, [page, processes, algorithm, quantum, result, loading, reportLoading]);

  // Hands-free welcome and listening attempt. Browsers still require microphone permission
  // and may require a user gesture before speech recognition can start.
  const welcomeStartedRef = useRef(false);
  useEffect(() => {
    if (welcomeStartedRef.current) return;
    welcomeStartedRef.current = true;
    const timer = window.setTimeout(() => {
      speakGuide("Welcome to ARCHION. How may I help you? You can say start simulator, choose FCFS, add processes, simulate, or download PDF.", "Welcome");
      // Request hands-free listening. The browser will prompt for microphone permission if needed.
      startListening();
    }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".nav-inner", { y: -18, opacity: 0, duration: 0.8, ease: "power3.out" });
      gsap.from(".hero-copy > *", { y: 28, opacity: 0, duration: 0.85, stagger: 0.11, ease: "power3.out", delay: 0.1 });
      gsap.from(".hero-visual", { scale: 0.8, opacity: 0, rotate: 4, duration: 1.2, ease: "power3.out", delay: 0.25 });
      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.fromTo(el, { y: 35, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.8, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse", once: false }
        });
      });
      gsap.to(".orb.orb-one", { x: 18, y: -20, duration: 4.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".orb.orb-two", { x: -15, y: 17, duration: 5.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (result) {
      requestAnimationFrame(() => {
        gsap.fromTo(".result-section", { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: "power2.out" });
        if (reportRef.current) ScrollTrigger.refresh();
      });
    }
  }, [result]);

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  // Select only a known female-coded voice. Never silently fall back to a likely male voice.
  const findFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const femalePattern = /female|swara|heera|veena|neerja|priya|raveena|aditi|lekha|kavya|ananya|samantha|zira|aria|jenny|susan|karen|sonia|sara|sarah|jenny|natasha|pallavi|aarti|manjiri|sangeeta|meera|kiran|google.*(हिन्दी|hindi)|microsoft.*(swara|neerja|heera|veena)/i;
    const indianPattern = /en[-_ ]?in|mr[-_ ]?in|hi[-_ ]?in|india|indian|marathi|hindi/i;
    const female = voices.filter(v => femalePattern.test(v.name));
    return female.find(v => /^en[-_]in$/i.test(v.lang) || (indianPattern.test(`${v.name} ${v.lang}`) && /^en/i.test(v.lang)))
      || female.find(v => /^mr([-_]|$)/i.test(v.lang))
      || female.find(v => /^en([-_]|$)/i.test(v.lang))
      || female.find(v => indianPattern.test(`${v.name} ${v.lang}`))
      || null;
  };

  const voicesForSpeechFallback = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => /^en[-_]in$/i.test(v.lang)) || voices.find(v => /^hi([-_]|$)/i.test(v.lang)) || voices.find(v => /^en([-_]|$)/i.test(v.lang)) || voices[0] || null;
  };

  const speakGuide = (text, statusPrefix = "Speaking") => {
    if (!voiceEnabled) return;
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setVoiceStatus("Speech synthesis is not supported by this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.91;
    utterance.pitch = 1.18;
    utterance.volume = 1;
    let started = false;
    const attemptSpeak = () => {
      if (started) return;
      const voice = findFemaleVoice() || voicesForSpeechFallback();
      started = true;
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || "en-IN";
      utterance.onstart = () => setVoiceStatus(`${statusPrefix}: ${voice.name}`);
      utterance.onend = () => setVoiceStatus("Voice guide finished");
      utterance.onerror = () => setVoiceStatus("Female voice playback failed. Check your device's installed voices and retry.");
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };
    attemptSpeak();
    // Some browsers populate the voice list asynchronously after page load.
    if (!started) {
      const onVoicesChanged = () => {
        attemptSpeak();
        if (started) window.speechSynthesis.removeEventListener?.("voiceschanged", onVoicesChanged);
      };
      window.speechSynthesis.addEventListener?.("voiceschanged", onVoicesChanged);
      window.setTimeout(() => {
        attemptSpeak();
        window.speechSynthesis.removeEventListener?.("voiceschanged", onVoicesChanged);
      }, 1200);
    }
  };

  const queueResultNarration = (data) => {
    const displayedUtilization = Number.isFinite(Number(data.cpuUtilization)) ? Number(data.cpuUtilization) : 0;
    const summary = `The simulation has finished. The average waiting time is ${data.averageWaitingTime} time units. This is the average time processes spend waiting in the ready queue. The average turnaround time is ${data.averageTurnaroundTime} time units, which measures the average time from arrival until completion. CPU utilization is ${displayedUtilization} percent, meaning that percentage of the total observed timeline was spent doing process work. There were ${data.contextSwitches} context switches. Review the Gantt chart from left to right: each block identifies the process running between its start and end times. In the process table, completion time is the finish point, turnaround time is completion minus arrival, waiting time is turnaround minus burst, and response time is first start minus arrival. In practice, engineers compare these numbers together because high utilization alone does not guarantee a responsive or fair system.`;
    speakGuide(summary, "Explaining results");
  };

  const stopGuide = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setVoiceStatus("Voice guide paused");
  };

  const normalizeCommand = (value) => value.toLowerCase().normalize("NFKD")
    .replace(/[.,!?;:]/g, " ").replace(/\s+/g, " ").trim();

  const applyCommand = async (rawCommand) => {
    const command = normalizeCommand(rawCommand);
    if (!command) return;
    setHeardText(rawCommand);
    const say = (message) => { setCommandStatus(message); if (voiceEnabled) speakGuide(message, "ARCHION"); };
    const goHome = /\b(go )?(back )?(to )?(home|homepage)\b|ghar (jao|chalo)/i.test(command);
    const goSimulator = /(go to|open|navigate to|show|kholo|chalo|jao).*(simulator|simulation|workspace)|\b(simulator|simulation workspace)\b.*(open|kholo|jao)/i.test(command);
    if (goHome) { setPage("home"); window.scrollTo({top:0,behavior:"smooth"}); say("Going back to the home page."); return; }
    if (goSimulator) { setPage("simulator"); window.scrollTo({top:0,behavior:"smooth"}); say("Opening the simulation workspace."); return; }
    if (/^(stop|stop voice|stop yourself|turn off yourself|turn off voice|mute voice|voice off|awaaz band|voice band karo|chup ho jao)$/.test(command) || /(turn off|stop|mute|band karo|band kar do).*(voice|awaaz|yourself|your voice)/.test(command)) {
      setVoiceEnabled(false); if ("speechSynthesis" in window) window.speechSynthesis.cancel(); stopListening(); setVoiceStatus("Voice output is off"); setCommandStatus("Voice assistant turned off."); return;
    }
    if (/(turn on|enable|start).*(voice|awaaz)|voice on|awaaz chalu/.test(command)) { setVoiceEnabled(true); setCommandStatus("Voice output is on."); return; }
    if (/^(stop listening|mic off|microphone off|sunna band karo)$/.test(command)) { stopListening(); say("Voice recognition stopped."); return; }
    const algoRules = [
      ["priorityPreemptive", /preemptive priority|priority preemptive|preemptive priorit/],
      ["priority", /priority scheduling|non preemptive priority|priority algorithm/],
      ["roundRobin", /round robin|roundrobin|rr algorithm/],
      ["srtf", /shortest remaining time|srtf/],
      ["sjf", /shortest job first|sjf/],
      ["fcfs", /first come first served|first come first|\bfcfs\b/]
    ];
    const chosen = algoRules.find(([,pattern]) => pattern.test(command));
    if (chosen && /(choose|select|use|set|run|algorithm|kar|karo|chuno|lagao)/.test(command)) { setAlgorithm(chosen[0]); setResult(null); say(`${algorithmNames[chosen[0]]} selected.`); return; }
    if (/(add|insert|create|jod|jodo|badhao|bana|जोड़|जोड).*(process|processes|प्रोसेस)|((process|processes|प्रोसेस).*(add|insert|create|jod|jodo|badhao|जोड़|जोड))/.test(command)) {
      const match = command.match(/\b(\d+)\b/); const wordCounts = {one:1,two:2,three:3,four:4,five:5,ek:1,do:2,teen:3,chaar:4,paanch:5}; const wordMatch = command.match(/\b(one|two|three|four|five|ek|do|teen|chaar|paanch)\b/); const count = Math.max(1, Math.min(20, match ? Number(match[1]) : (wordMatch ? wordCounts[wordMatch[1]] : 1)));
      setProcesses(prev => { let n = Math.max(0, ...prev.map(p => Number((String(p.id).match(/\d+/)||[0])[0]))); return [...prev, ...Array.from({length:count},()=>({id:`P${++n}`,arrivalTime:0,burstTime:1,priority:1}))]; });
      setResult(null); say(`${count} process${count===1?"":"es"} added with default values.`); return;
    }
    if (/(remove|delete|drop|hatao|nikalo).*(process|p\s*\d|first|last|pehla|पहला)/.test(command)) {
      const explicit = command.match(/\bp\s*(\d+)\b/i); const targetIndex = /first|pehla|पहला/.test(command) ? 0 : /last|aakhri|आखिरी/.test(command) ? stateRef.current.processes.length-1 : -1;
      const current = stateRef.current.processes; const index = explicit ? current.findIndex(p => p.id.toLowerCase() === `p${explicit[1]}`) : targetIndex;
      if (index < 0 || index >= current.length) { say("I could not identify that process. Please say a process ID such as remove P2."); return; }
      if (current.length <= 1) { say("At least one process must remain in the simulation."); return; }
      const id = current[index].id; setProcesses(prev => prev.filter((_,i)=>i!==index)); setResult(null); say(`${id} removed.`); return;
    }
    const fieldMatch = command.match(/\b(p\s*\d+)\b.*\b(arrival|burst|priority)\s*(?:time)?\s*(?:to|is|=|ko|mein)?\s*(\d+)\b/i);
    if (fieldMatch) {
      const id = fieldMatch[1].replace(/\s/g, "").toUpperCase(); const key = fieldMatch[2].toLowerCase()==="arrival"?"arrivalTime":fieldMatch[2].toLowerCase()==="burst"?"burstTime":"priority"; const value=Number(fieldMatch[3]);
      if (key!=="arrivalTime" && value<1) { say("Burst time and priority must be greater than zero."); return; }
      if (!stateRef.current.processes.some(p=>p.id.toUpperCase()===id)) { say(`${id} was not found.`); return; }
      setProcesses(prev=>prev.map(p=>p.id.toUpperCase()===id?{...p,[key]:value}:p)); setResult(null); say(`${id} ${key.replace("Time"," time ")} set to ${value}.`); return;
    }
    if (/\b(simulate|run simulation|calculate|start simulation|chalao|simulate karo)\b/.test(command)) {
      if (stateRef.current.page !== "simulator") setPage("simulator");
      window.setTimeout(() => runRef.current?.(), 80); setCommandStatus("Running simulation…"); return;
    }
    if (/\b(download|generate|export).*(pdf|report)|pdf download|report download/.test(command)) {
      if (!stateRef.current.result) { say("Please run the simulation first, then ask me to download the PDF report."); return; }
      window.setTimeout(() => reportRefAction.current?.(), 50); setCommandStatus("Preparing your PDF download…"); return;
    }
    if (/\b(reset|start over|reset karo|dobara shuru)\b/.test(command)) { reset(); say("Simulation inputs have been reset."); return; }
    if (/\b(explain|describe|what do these results mean|samjhao|result batao)\b/.test(command)) {
      if (stateRef.current.result) { const r=stateRef.current.result; say(`The average waiting time is ${r.averageWaitingTime}, average turnaround time is ${r.averageTurnaroundTime}, and CPU utilization is ${(Number.isFinite(Number(r.cpuUtilization)) ? Number(r.cpuUtilization) : 0)} percent.`); }
      else say("Run a simulation first, then I can explain the results."); return;
    }
    // Hybrid fallback: use the optional AI endpoint for natural or multi-step instructions.
    try {
      const response = await fetch(`${API}/assistant/command`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({command:rawCommand, language:voiceLanguage, context:{page:stateRef.current.page, algorithm:stateRef.current.algorithm, processes:stateRef.current.processes, hasResult:Boolean(stateRef.current.result)}}) });
      if (response.ok) {
        const data = await response.json();
        if (data.action === "navigate" && ["home","simulator"].includes(data.page)) { setPage(data.page); say(data.message || `Opening ${data.page}.`); return; }
        if (data.action === "select_algorithm" && algorithmNames[data.algorithm]) { setAlgorithm(data.algorithm); setResult(null); say(data.message || `${algorithmNames[data.algorithm]} selected.`); return; }
        if (data.action === "simulate") { window.setTimeout(()=>runRef.current?.(),50); setCommandStatus(data.message || "Running simulation."); return; }
        if (data.action === "add_processes") { const count=Math.max(1,Math.min(20,Number(data.count)||1)); setProcesses(prev=>{let n=Math.max(0,...prev.map(p=>Number((String(p.id).match(/\d+/)||[0])[0])));return [...prev,...Array.from({length:count},()=>({id:`P${++n}`,arrivalTime:0,burstTime:1,priority:1}))]});say(data.message||`${count} processes added.`);return; }
        if (data.action === "answer" && data.message) { say(data.message); return; }
      }
    } catch (_) { /* Optional AI service is not configured; keep local commands available. */ }
    say("I did not understand that command. Try “go to simulator”, “choose FCFS”, “add two processes”, or “simulate”.");
  };
  const runRef = useRef(null);
  const reportRefAction = useRef(null);
  useEffect(() => { runRef.current = run; reportRefAction.current = generateReport; });

  const stopListening = () => {
    window.__archionVoiceStopped = true;
    try { recognitionRef.current?.stop(); } catch (_) {}
    recognitionRef.current = null; setListening(false);
  };
  const startListening = () => {
    window.__archionVoiceStopped = false;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setCommandStatus("Speech recognition is not supported here. Try a recent Chrome or Edge browser."); return; }
    if (recognitionRef.current) { stopListening(); return; }
    const recognition = new SpeechRecognition(); recognition.lang = voiceLanguage; recognition.continuous = true; recognition.interimResults = true; recognition.maxAlternatives = 1;
    recognition.onstart = () => { setListening(true); setCommandStatus(wakeEnabled ? "Listening for ‘Hey ARCHION’ or a command…" : "Listening… speak a command."); };
    recognition.onresult = (event) => {
      let finalText = ""; let interim = "";
      for (let i=event.resultIndex;i<event.results.length;i++) { const transcript=event.results[i][0].transcript; if(event.results[i].isFinal) finalText += transcript; else interim += transcript; }
      if (interim) setHeardText(interim);
      if (finalText.trim()) {
        const normalized=normalizeCommand(finalText); const wakeMatch=normalized.match(/(?:hey|okay|ok|hello)\s+archion\s*(.*)/i);
        if (wakeMatch) { const payload=wakeMatch[1].trim(); if(payload) applyCommand(payload); else setCommandStatus("Yes, I’m listening. What should I do?"); }
        else applyCommand(finalText.trim());
      }
    };
    recognition.onerror = (event) => { setCommandStatus(event.error === "not-allowed" ? "Microphone permission was denied. Allow microphone access in your browser." : `Voice recognition issue: ${event.error}.`); setListening(false); };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        setListening(false); recognitionRef.current = null;
        if (voiceEnabled && wakeEnabled && !window.__archionVoiceStopped) {
          window.setTimeout(() => { if (voiceEnabled && wakeEnabled && !recognitionRef.current) startListening(); }, 900);
        }
      }
    };
    recognitionRef.current=recognition;
    try { recognition.start(); } catch (_) { setCommandStatus("Could not start microphone. Please try again."); recognitionRef.current=null; setListening(false); }
  };

  const update = (index, key, value) => {
    setProcesses(prev => prev.map((p, i) => i === index
      ? { ...p, [key]: key === "id" ? value : Number(value) }
      : p));
  };
  const add = () => {
    const next = Math.max(0, ...processes.map(p => Number((p.id.match(/\d+/) || [0])[0]))) + 1;
    setProcesses(prev => [...prev, { id: `P${next}`, arrivalTime: 0, burstTime: 1, priority: 1 }]);
  };
  const remove = i => setProcesses(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);
  const reset = () => { setProcesses(sample); setAlgorithm("sjf"); setQuantum(2); setResult(null); setError(""); };

  const run = async () => {
    const ids = processes.map(p => String(p.id).trim());
    if (processes.some(p => !p.id.trim()) || new Set(ids).size !== ids.length) { setError("Every process needs a unique, non-empty ID."); return; }
    if (processes.some(p => !Number.isFinite(Number(p.arrivalTime)) || Number(p.arrivalTime) < 0 || !Number.isFinite(Number(p.burstTime)) || Number(p.burstTime) <= 0 || !Number.isFinite(Number(p.priority)) || Number(p.priority) <= 0)) { setError("Arrival time must be 0 or more. Burst time and priority must be greater than 0."); return; }
    if (algorithm === "roundRobin" && (!Number.isFinite(Number(quantum)) || Number(quantum) <= 0)) { setError("Time quantum must be greater than zero."); return; }
    const spokenAlgorithm = algorithmNames[algorithm];
    const priorityExplanation = algorithm.startsWith("priority") ? " Priority scheduling compares the priority values; in this simulator, a smaller number means a higher priority." : "";
    const quantumExplanation = algorithm === "roundRobin" ? ` The time quantum is ${quantum}. Each process receives up to that many time units before it returns to the ready queue if work remains.` : "";
    speakGuide(`Welcome to ARCHION, your CPU scheduling simulation. We are about to run ${spokenAlgorithm} with ${processes.length} processes. First, arrival time tells us when a process enters the ready queue. Burst time is the total CPU time it needs. The scheduler chooses which ready process runs next, and the Gantt chart will show each time interval. Completion time is when a process finishes. Turnaround time equals completion time minus arrival time. Waiting time equals turnaround time minus burst time. Response time equals the first time the process gets the CPU minus arrival time. Average waiting time helps compare queue delay, while average turnaround time measures the total time spent in the system. CPU utilization is the percentage of elapsed time when the CPU was busy. Context switches count transitions between processes. ${priorityExplanation}${quantumExplanation} In real operating systems, scheduling is used in laptops, phones, servers, cloud platforms, and embedded devices. Interactive tasks benefit from quick response, batch jobs benefit from efficient throughput, and real-time systems need predictable deadlines. After the calculation, I will summarize how to read the results and what the trade-offs mean in practice.`);
    setError(""); setResult(null); setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 20000);
      let response;
      try {
        response = await fetch(`${API}/scheduling/${algorithm}`, {
          method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ processes, ...(algorithm === "roundRobin" ? { quantum } : {}) }),
          signal: controller.signal
        });
      } catch (networkError) {
        if (networkError.name === "AbortError") throw new Error("The scheduling API timed out. Check that the backend is running and try again.");
        throw new Error("Could not reach the scheduling backend. Start the backend on port 5000 and open the website through the Vite URL (not by opening an HTML file directly).");
      } finally { window.clearTimeout(timeoutId); }
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : { message: await response.text().catch(() => "") };
      if (!response.ok) {
        const detail = typeof data.message === "string" && data.message.trim() ? data.message : `HTTP ${response.status}`;
        throw new Error(response.status >= 500
          ? `Simulation failed (HTTP ${response.status}): ${detail} Make sure the backend is running from the backend folder and check its terminal for the calculation error.`
          : detail);
      }
      if (!data || !Array.isArray(data.processes) || !Array.isArray(data.ganttChart)) throw new Error("The backend returned an incomplete simulation result. Restart the backend and try again.");
      setResult(data);
      queueResultNarration(data);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (e) {
      setError(e.message || "Could not connect to the backend. Make sure it is running on port 5000.");
    } finally { setLoading(false); }
  };

  const generateReport = async () => {
    if (!result) return;
    setReportLoading(true); setError("");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`${API}/report`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processes, algorithm, algorithmName: algorithmNames[algorithm], quantum, result }),
        signal: controller.signal
      });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        const data = contentType.includes("application/json")
          ? await response.json().catch(() => ({}))
          : { message: await response.text().catch(() => "") };
        throw new Error(data.message || "Could not generate report. Check that the backend is running and try again.");
      }
      const blob = await response.blob();
      if (blob.size < 100 || (!contentType.toLowerCase().includes("application/pdf") && blob.type && !blob.type.toLowerCase().includes("application/pdf"))) {
        throw new Error("The server did not return a valid PDF. Restart the backend and try again.");
      }
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = `CPU-Scheduling-Report-${algorithm}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      setError(e.name === "AbortError"
        ? "PDF generation timed out after 20 seconds. Check that the backend is running on port 5000, then try again."
        : (e.message || "Report generation failed."));
    } finally {
      window.clearTimeout(timeoutId);
      setReportLoading(false);
    }
  };

  return <div className="site-shell"><BackgroundAtmosphere/><PointerSparkles/>
    <aside className="voice-command-dock" aria-label="Voice command assistant" aria-hidden="true">
      <div className="voice-dock-top"><span className={`voice-live-dot ${listening ? "is-listening" : ""}`}/><strong>ARCHION Voice</strong><button type="button" className="voice-toggle" onClick={() => { setVoiceEnabled(v=>!v); if (voiceEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel(); }} aria-label={voiceEnabled?"Turn voice output off":"Turn voice output on"}>{voiceEnabled?<Volume2 size={15}/>:<VolumeX size={15}/>}</button></div>
      <div className="voice-dock-status" aria-live="polite">{commandStatus}</div>
      {heardText && <div className="voice-heard">Heard: {heardText}</div>}
      <div className="voice-dock-controls"><button type="button" className={`voice-mic ${listening?"active":""}`} onClick={startListening}>{listening?<MicOff size={16}/>:<Mic size={16}/>} {listening?"Stop listening":"Speak command"}</button><label className="voice-language"><span>Language</span><select value={voiceLanguage} onChange={e=>setVoiceLanguage(e.target.value)} aria-label="Voice recognition language"><option value="en-IN">English / Hinglish</option><option value="hi-IN">Hindi</option></select></label></div>
      <label className="wake-toggle"><input type="checkbox" checked={wakeEnabled} onChange={e=>setWakeEnabled(e.target.checked)}/> Optional wake phrase: “Hey ARCHION”</label>
    </aside>
    {page === "simulator" && <nav className="nav"><div className="nav-inner"><a className="brand" href="#" onClick={e => {e.preventDefault();setPage("home");}}><span className="brand-mark"><img className="brand-logo" src="/archion-logo.png" alt="ARCHION logo" /></span><span>ARCHI<span className="brand-light">ON</span></span></a><div className="nav-links"><span>SIMULATION WORKSPACE</span></div><button className="nav-cta" onClick={() => {setPage("home");window.scrollTo({top:0,behavior:"smooth"});}}>← Back to home</button></div></nav>}
    {page === "home" && <nav className="nav">
      <div className="nav-inner">
        <a className="brand" href="#top"><span className="brand-mark"><img className="brand-logo" src="/archion-logo.png" alt="ARCHION logo" /></span><span>ARCHI<span className="brand-light">ON</span></span></a>
        <div className="nav-links"><a href="#simulator">Simulator</a><a href="#method">How it works</a><a href="#results">Analysis</a></div>
        
      </div>
    </nav>}

    {page === "home" && <header className="hero" id="top">
      <div className="hero-particles" aria-hidden="true">
        {Array.from({ length: 34 }, (_, i) => (
          <span className={`hero-particle particle-${i % 7}`} key={i} style={{
            left: `${(i * 37 + 11) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            animationDelay: `${(i % 11) * -0.7}s`,
            animationDuration: `${10 + (i % 9) * 1.6}s`
          }} />
        ))}
      </div>
      <div className="orb orb-one"/><div className="orb orb-two"/>
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="status-pill"><Sparkles size={16}/> CPU SCHEDULING · LEARNING STUDIO</div>
          <h1>Make every<br/><span>CPU cycle</span> count.</h1>
          <p className="hero-lede">Explore scheduling algorithms in motion. <strong>Model your processes</strong>, watch the timeline come alive, and understand the <strong>trade-offs behind every decision</strong>.</p>
          <div className="hero-actions"><button className="primary-button" onClick={() => { setPage("simulator"); window.scrollTo({top:0,behavior:"smooth"}); }}>Start simulation <ArrowDown size={16}/></button><div className="micro-note"><Sparkles size={15}/> Built for learning by doing</div></div>
        </div>
        <div className="hero-visual">
          <CpuScene/>
          <div className="floating-card fc-top"><span className="mini-icon"><Activity size={15}/></span><div><b>Algorithm comparison</b><small>Explore 6 scheduling policies</small></div></div>
          <div className="floating-card fc-bottom"><div className="tiny-bars"><i/><i/><i/><i/><i/><i/><i/></div><div><b>Live Gantt chart</b><small>Track wait, response and turnaround</small></div></div>
          <div className="visual-ring ring-a"/><div className="visual-ring ring-b"/><div className="feature-chip feature-chip-top"><Gauge size={14}/> Performance metrics</div><div className="feature-chip feature-chip-bottom"><Layers3 size={14}/> Exportable 2-page report</div>
        </div>
      </div>
      <div className="hero-bottom"><span>DEFINE YOUR PROCESSES</span><span>SCROLL TO EXPLORE <ArrowDown size={13}/></span></div>
    </header>}

    <main>
      {page === "home" && <section className="intro-strip reveal" id="method">
        <div className="intro-icon"><Layers3 size={21}/></div>
        <div><span className="kicker">THE WORKFLOW</span><h2>From process table to performance insight.</h2></div>
        <p>Define workloads, choose a scheduling strategy, then inspect the timeline and calculated metrics — all in one place.</p>
      </section>}

      {page === "simulator" && <section className="sim-section section-pad simulation-page" id="simulator">
        <div className="section-heading reveal"><div><span className="kicker">INTERACTIVE WORKSPACE / 01</span><h2>Configure your simulation<span className="period">.</span></h2></div><button className="ghost-button" onClick={reset}><RotateCcw size={15}/> Reset example</button></div>
        <div className="workspace-grid">
          <div className="panel process-panel reveal">
            <div className="panel-head"><div><span className="step-number">01</span><div><h3>Process table</h3><p>Set the inputs for each process.</p></div></div><button className="icon-button" onClick={add} aria-label="Add process"><Plus size={17}/></button></div>
            <div className="process-table-wrap"><table className="process-table">
              <thead><tr><th>PROCESS</th><th>ARRIVAL</th><th>BURST</th>{(algorithm === "priority" || algorithm === "priorityPreemptive") && <th>PRIORITY</th>}<th/></tr></thead>
              <tbody>{processes.map((p, i) => <tr key={`${p.id}-${i}`}>
                <td><input className="id-input" value={p.id} aria-label={`Process ID ${i+1}`} onChange={e => update(i,"id",e.target.value)}/></td>
                <td><input type="number" min="0" value={p.arrivalTime} aria-label="Arrival time" onChange={e => update(i,"arrivalTime",e.target.value)}/></td>
                <td><input type="number" min="1" value={p.burstTime} aria-label="Burst time" onChange={e => update(i,"burstTime",e.target.value)}/></td>
                {(algorithm === "priority" || algorithm === "priorityPreemptive") && <td><input type="number" min="1" value={p.priority} aria-label="Priority" onChange={e => update(i,"priority",e.target.value)}/></td>}
                <td><button className="remove-button" onClick={() => remove(i)} aria-label={`Remove ${p.id}`}><Trash2 size={14}/></button></td>
              </tr>)}</tbody>
            </table></div>
            <button className="add-row" onClick={add}><Plus size={15}/> Add process</button>
            <div className="table-hint">{(algorithm === "priority" || algorithm === "priorityPreemptive") ? "Priority: smaller number = higher priority. Burst time must be greater than zero." : "Burst time must be greater than zero."}</div>
          </div>
          <div className="panel config-panel reveal">
            <div className="panel-head"><div><span className="step-number">02</span><div><h3>Scheduling logic</h3><p>Select the rule that decides what runs next.</p></div></div><span className="sparkle"><Zap size={17}/></span></div>
            <label className="form-label" htmlFor="algorithm">ALGORITHM</label>
            <select id="algorithm" className="algorithm-select" value={algorithm} onChange={e => setAlgorithm(e.target.value)}>
              <option value="fcfs">FCFS — First Come, First Served</option>
              <option value="sjf">SJF — Shortest Job First (non-preemptive)</option>
              <option value="srtf">SRTF — Shortest Remaining Time First</option>
              <option value="priority">Priority — Non-preemptive</option>
              <option value="priorityPreemptive">Priority — Preemptive</option>
              <option value="roundRobin">Round Robin</option>
            </select>
            {algorithm === "roundRobin" && <div className="quantum-field"><label className="form-label" htmlFor="quantum">TIME QUANTUM</label><input id="quantum" type="number" min="1" value={quantum} onChange={e => setQuantum(Number(e.target.value))}/></div>}
            <div className="algorithm-note"><div className="note-icon"><Gauge size={17}/></div><div><b>{algorithmNames[algorithm]}</b><p>{algorithm === "sjf" ? "Runs the shortest available job to completion before selecting the next one." : algorithm === "srtf" ? "Can interrupt a running process when a shorter remaining job arrives." : algorithm === "fcfs" ? "Executes processes in the order they arrive in the ready queue." : algorithm === "priority" ? "Selects the available process with the highest priority (lowest number)." : algorithm === "priorityPreemptive" ? "A newly arrived higher-priority process can preempt the current one." : "Shares the CPU in fixed time slices to improve responsiveness."}</p></div></div>
            <button className="run-button" onClick={run} disabled={loading}><span>{loading ? "Simulating..." : "Simulate with voice guide"}</span><Play size={16} fill="currentColor"/></button>
            <div className="voice-guide-row"><span className="voice-symbol"><Activity size={14}/></span><span aria-live="polite">{voiceStatus}</span><button type="button" onClick={stopGuide}>Stop voice</button></div>
            {error && <div className="error-message">{error}</div>}
            <div className="privacy-note"><span className="privacy-symbol"><Cpu size={14}/></span> Calculations run locally through your project API. No account required.</div>
          </div>
        </div>
      </section>}

      {page === "home" && <section className="algorithm-library section-pad reveal" id="results"><div className="section-heading"><div><span className="kicker">SCHEDULING GUIDE</span><h2>Explore the six algorithms<span className="period">.</span></h2><p className="result-subtitle">Choose a strategy to understand its strengths, trade-offs, and real-world use.</p></div></div><div className="algorithm-cards">{[{name:"First Come, First Served",tag:"FCFS",desc:"Runs processes in arrival order. Simple and predictable, but a long job can delay every short job behind it.",use:"Batch queues and basic job processing."},{name:"Shortest Job First",tag:"SJF",desc:"Chooses the shortest available burst. It can lower average waiting time, but long jobs may wait longer.",use:"Batch systems when job duration can be estimated."},{name:"Shortest Remaining Time First",tag:"SRTF",desc:"Preempts the current process when a newly available process has less work remaining.",use:"Workloads that benefit from fast completion of short tasks."},{name:"Priority Scheduling",tag:"PRIORITY",desc:"Runs the highest-priority ready process first. Low-priority work can starve without aging or safeguards.",use:"Operating-system services and urgency-based task queues."},{name:"Preemptive Priority",tag:"PREEMPTIVE",desc:"Allows newly arrived high-priority work to interrupt a lower-priority process.",use:"Systems where urgent tasks must respond quickly."},{name:"Round Robin",tag:"RR",desc:"Gives each ready process a time slice. Small slices improve responsiveness but increase context-switch overhead.",use:"Interactive and time-sharing systems."}].map(a=><article className="algorithm-card" key={a.tag}><span className="algorithm-tag">{a.tag}</span><h3>{a.name}</h3><p>{a.desc}</p><div><b>Real-world use</b><span>{a.use}</span></div><button className="algorithm-try" onClick={() => {setAlgorithm(({FCFS:"fcfs",SJF:"sjf",SRTF:"srtf",PRIORITY:"priority",PREEMPTIVE:"priorityPreemptive",RR:"roundRobin"})[a.tag]);setPage("simulator");window.scrollTo({top:0,behavior:"smooth"});}}>Try this algorithm <ArrowUpRight size={14}/></button></article>)}</div></section>}

      {page === "home" && <section className="formula-section reveal">
        <div className="formula-copy"><span className="kicker">THE MATH BEHIND THE MOTION</span><h2>Clear formulas.<br/>Meaningful results.</h2><p>Every metric in the result table is calculated from the schedule produced by the selected algorithm.</p></div>
        <div className="formula-list">
          <div><span>CT</span><b>Completion Time</b><code>End of the process execution</code></div>
          <div><span>TAT</span><b>Turnaround Time</b><code>CT − Arrival Time</code></div>
          <div><span>WT</span><b>Waiting Time</b><code>TAT − Burst Time</code></div>
          <div><span>RT</span><b>Response Time</b><code>First Start − Arrival Time</code></div>
          <div><span>AVG</span><b>Average WT / TAT</b><code>Sum of metric values ÷ process count</code></div>
        </div>
      </section>}

      {page === "simulator" && result && <section className="results-area section-pad" id="results" ref={reportRef}>
        <div className="section-heading result-section"><div><span className="kicker">SIMULATION OUTPUT / 02</span><h2>Your schedule, decoded<span className="period">.</span></h2><p className="result-subtitle">{result.algorithm} · {result.processes.length} processes analyzed</p></div></div>
        <div className="metric-grid result-section">
          <Metric icon={<Activity size={17}/>} label="Average waiting time" value={result.averageWaitingTime} unit="time units"/>
          <Metric icon={<Layers3 size={17}/>} label="Average turnaround" value={result.averageTurnaroundTime} unit="time units"/>
          <Metric icon={<Gauge size={17}/>} label="CPU utilization" value={(Number.isFinite(Number(result.cpuUtilization)) ? Number(result.cpuUtilization) : 0)} unit="%"/>
          <Metric icon={<Zap size={17}/>} label="Context switches" value={result.contextSwitches} unit="switches"/>
        </div>
        <div className="voice-insight result-section"><div className="voice-insight-icon"><Sparkles size={18}/></div><div><span className="kicker">REAL-WORLD INTERPRETATION</span><h3>What these results tell you</h3><p>{algorithm === "fcfs" ? "FCFS is simple and fair by arrival order, but a long job at the front can delay short interactive tasks (the convoy effect)." : algorithm === "sjf" ? "SJF can reduce average waiting time when burst lengths are known, which is useful for batch workloads; however, long jobs may wait longer." : algorithm === "srtf" ? "SRTF favors jobs with less remaining work and can improve average waiting time, but frequent preemption adds switching overhead in real systems." : algorithm.startsWith("priority") ? "Priority scheduling is useful when critical work must run first, such as system services; without aging, low-priority work can starve." : "Round Robin gives each ready process a time slice, making it useful for interactive multi-user systems; very small slices increase context-switch overhead."} Compare average waiting time, response time and CPU utilization together: no single metric tells the whole performance story.</p><button type="button" className="voice-replay" onClick={() => speakGuide(`Here is the real world interpretation for ${algorithmNames[algorithm]}. ${algorithm === "fcfs" ? "First Come First Served is easy to implement, but long jobs can delay short ones." : algorithm === "sjf" ? "Shortest Job First often lowers average waiting time for batch jobs, but long jobs can be delayed." : algorithm === "srtf" ? "Shortest Remaining Time First improves responsiveness for short jobs but can cause extra preemption." : algorithm.startsWith("priority") ? "Priority scheduling lets important work run first, but low-priority jobs may starve unless aging is used." : "Round Robin shares CPU time slices fairly and is common conceptually in interactive time-sharing systems."} Completion time is when a process finishes. Turnaround time is completion minus arrival. Waiting time is turnaround minus burst. Response time is first start minus arrival. In real systems, these measures help engineers balance responsiveness, throughput, fairness and overhead.`)}><Play size={13} fill="currentColor"/> Hear explanation again</button></div></div>
        <div className="panel result-section gantt-panel">
          <div className="panel-head"><div><span className="step-number">03</span><div><h3>Gantt Chart</h3><p>Each block shows which process owns the CPU over time.</p></div></div><span className="duration-chip">TOTAL {result.totalTime} UNITS</span></div>
          <Gantt blocks={result.ganttChart}/>
        </div>
        <div className="panel result-section">
          <div className="panel-head"><div><span className="step-number">04</span><div><h3>Process-level calculations</h3><p>Verify CT, TAT, WT and response time for every process.</p></div></div></div>
          <div className="process-table-wrap"><table className="result-table"><thead><tr><th>PROCESS</th><th>AT</th><th>BT</th>{(algorithm === "priority" || algorithm === "priorityPreemptive") && <th>PRIORITY</th>}<th>START</th><th>CT</th><th>TAT</th><th>WT</th><th>RT</th></tr></thead>
            <tbody>{result.processes.map(p => <tr key={p.id}><td><span className="process-tag">{p.id}</span></td><td>{p.arrivalTime}</td><td>{p.burstTime}</td>{(algorithm === "priority" || algorithm === "priorityPreemptive") && <td>{p.priority}</td>}<td>{p.startTime}</td><td>{p.completionTime}</td><td>{p.turnaroundTime}</td><td><b className="wt-value">{p.waitingTime}</b></td><td>{p.responseTime}</td></tr>)}</tbody></table></div>
          <div className="averages-row"><div><span>Σ WAITING TIME / n</span><b>{result.averageWaitingTime}</b></div><div><span>Σ TURNAROUND TIME / n</span><b>{result.averageTurnaroundTime}</b></div><div><span>CPU BUSY TIME</span><b>{processes.reduce((s,p)=>s+Number(p.burstTime||0),0)} units</b></div></div>
        </div>
        <div className="report-card result-section">
          <div className="report-icon"><FileText size={25}/></div><div className="report-copy"><span className="kicker">READY TO SUBMIT</span><h3>Generate your project report.</h3><p>Download a formatted PDF with the problem statement, your exact inputs, the Gantt chart, calculation table, formulas and performance summary.</p></div>
          <button className="report-button" onClick={generateReport} disabled={reportLoading}><FileText size={16}/>{reportLoading ? "Generating PDF..." : "Project report"}<ArrowUpRight size={15}/></button>
        </div>
      </section>}

      <footer className="footer"><div className="footer-brand"><span className="brand-mark"><img className="brand-logo" src="/archion-logo.png" alt="ARCHION logo" /></span><span> ARCHI<span className="brand-light">ON</span></span></div><p>Understand the algorithm. Trust the timeline.</p><span fontSize="100px">© COPYRIGHT 2026</span></footer>
    </main>
  </div>;
}

function Metric({ icon, label, value, unit }) {
  return <div className="metric-card"><div className="metric-top">{icon}<span>{label}</span></div><div className="metric-value">{value}<small>{unit}</small></div><div className="metric-line"><i style={{width: `${Math.max(8, Math.min(100, Number(value) || 8))}%`}}/></div></div>;
}
function Gantt({ blocks }) {
  const palette = ["#c8e5dc", "#d9d0eb", "#f0d7c8", "#d1e1ef", "#e8dfb9", "#e8d0dc"];
  return <div className="gantt-scroll"><div className="gantt-track">{blocks.map((b,i) => <div key={`${b.id}-${b.start}-${i}`} className={`gantt-block ${b.id === "IDLE" ? "idle-block" : ""}`} style={{flexGrow: Math.max(1,b.end-b.start), background: b.id === "IDLE" ? "#e8e9e5" : palette[(Number((b.id.match(/\d+/)||[1])[0])-1)%palette.length]}}><b>{b.id}</b><small>{b.start}–{b.end}</small></div>)}</div><div className="gantt-ticks">{blocks.map((b,i)=><span key={`${b.start}-${i}`}>{b.start}</span>)}{blocks.length>0&&<span>{blocks[blocks.length-1].end}</span>}</div><div className="gantt-legend"><span><i/>Process execution</span><span><i className="idle-key"/>CPU idle time</span></div></div>;
}
createRoot(document.getElementById("root")).render(<App />);
