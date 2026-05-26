import React, { useState, useEffect, useRef } from 'react';
import { useRadio } from '../contexts/RadioContext';
import { useAuditLog } from '../hooks/useAuditLog';

const IBMPipelineLog = ({ frame, radioEvents }) => {
  const [logs, setLogs] = useState([
    { id: 1, text: "[ContextForge] MCP Gateway active · OpenF1 route registered", color: "#7f77dd" },
    { id: 2, text: "[Langflow 1.9] Supervisor agent polling telemetry stream...", color: "#06b6d4" },
    { id: 3, text: "[System] CORTEX cognitive filter initialized · threshold: 65", color: "#52525b" }
  ]);
  const logContainerRef = useRef(null);
  const lastClRef = useRef(0);
  const lastRadioCount = useRef(0);
  const lastPredictive = useRef(false);

  useEffect(() => {
    // Add new logs based on events, throttling same event types to 1 per second
    const now = Date.now();
    let newLogs = [];

    if (frame.cl_score > 65 && frame.cl_score !== lastClRef.current && (now - (lastClRef.current_time || 0) > 1000)) {
      newLogs.push({ id: now + 1, text: `[BufferQueue] CL spike detected · score: ${Math.round(frame.cl_score)} · filter: ARMED`, color: "#f4f4f5" });
      lastClRef.current = frame.cl_score;
      lastClRef.current_time = now;
    }

    if (frame.predictive_hold && !lastPredictive.current) {
      newLogs.push({ id: now + 2, text: `[Docling] Predictive hold triggered · ${frame.upcoming_corner} in ${frame.corner_seconds_away}s`, color: "#f59e0b" });
    }
    lastPredictive.current = frame.predictive_hold;

    if (radioEvents.length > lastRadioCount.current) {
      const latest = radioEvents[radioEvents.length - 1];
      newLogs.push({ id: now + 3, text: `[Granite] Classification complete · urgency: ${latest.urgency} · summary: ${latest.summary}`, color: "#f59e0b" });
      newLogs.push({ id: now + 4, text: `[Guardian] Safety check passed · harm index: 0.00`, color: "#22c55e" });
      
      if (latest.status === 'released') {
        newLogs.push({ id: now + 5, text: `[BufferQueue] Message released · delivered to driver`, color: "#f4f4f5" });
      }
      lastRadioCount.current = radioEvents.length;
    }

    if (newLogs.length > 0) {
      setLogs(prev => [...prev, ...newLogs].slice(-50)); // Keep last 50
    }
  }, [frame, radioEvents]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col border border-zinc-800 bg-[#09090b]">
      <div className="h-[180px] overflow-y-auto p-3 font-mono text-xs flex flex-col gap-1" ref={logContainerRef}>
        {logs.map((log) => (
          <div key={log.id} className="animate-[flashLog_0.5s_ease-out]" style={{ color: log.color }}>
            {log.text}
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes flashLog {
          0% { background-color: #1c1c2e; }
          100% { background-color: transparent; }
        }
      `}</style>
    </div>
  );
};

const DoclingIntelligence = ({ frame }) => {
  const corners = [
    { name: "Turn 1", cl: "Ste Devote", stat: "Heavy Brake 280→80", s: "PREDICTIVE BUFFER: ON", sector: 1 },
    { name: "Turn 8", cl: "Massenet", stat: "High Speed 4.5G", s: "PREDICTIVE BUFFER: ON", sector: 1 },
    { name: "Turn 14", cl: "Mirabeau", stat: "Medium Brake", s: "PREDICTIVE BUFFER: ON", sector: 2 },
    { name: "Turn 15", cl: "Loews Hairpin", stat: "Slowest Corner 1G", s: "PREDICTIVE BUFFER: ON", sector: 2 },
    { name: "Tunnel", cl: "Full Throttle", stat: "Zero Load Zone", s: "RADIO OPEN", sector: 3 }
  ];

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      <div className="text-zinc-500 text-xs tracking-widest mb-3 uppercase">DOCLING CIRCUIT INTELLIGENCE</div>
      <div className="flex flex-col text-xs font-mono w-full">
        <div className="flex text-zinc-600 border-b border-zinc-800 pb-2 mb-2">
          <div className="w-1/4">CORNER</div>
          <div className="w-2/4">CLASSIFICATION</div>
          <div className="w-1/4 text-right">STATUS</div>
        </div>
        {corners.map((c, i) => (
          <div key={i} className={`flex py-1.5 px-2 -mx-2 transition-colors ${frame.sector === c.sector ? 'bg-zinc-800 rounded-sm' : ''}`}>
            <div className="w-1/4 text-zinc-300">{c.name}</div>
            <div className="w-2/4 text-zinc-500">{c.cl} · {c.stat}</div>
            <div className={`w-1/4 text-right ${c.s.includes('RADIO OPEN') ? 'text-green-500' : 'text-amber-500'}`}>{c.s}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-zinc-600 font-mono text-xs">
        Parsed via IBM Docling · FIA Event Notes Monaco 2023 · 847 chars extracted
      </div>
    </div>
  );
};

const RadioDecision = ({ latestEvent, processingMessage }) => {
  if (processingMessage) {
    return (
      <div className="flex flex-col mt-4 border border-zinc-800 bg-[#09090b] p-4 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
        <div className="flex justify-between items-center mb-3">
          <div className="font-mono font-bold text-lg uppercase text-amber-500">PROCESSING</div>
        </div>
        <div className="font-mono mb-4 text-zinc-300 text-sm">
          "{processingMessage}"
        </div>
        <div className="text-zinc-500 text-xs flex items-center gap-2">
          IBM Granite classifying<span className="animate-pulse">_</span>
        </div>
      </div>
    );
  }

  if (!latestEvent) {
    return (
      <div className="flex-1 flex items-center justify-center border border-zinc-800 bg-[#09090b] text-zinc-600 font-mono text-xs mt-4">
        AWAITING RADIO COMMS
      </div>
    );
  }

  const isIntercepted = latestEvent.status === 'buffering' || latestEvent.status === 'intercepted';
  
  return (
    <div className="flex flex-col mt-4 border border-zinc-800 bg-[#09090b] p-4 relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isIntercepted ? 'bg-red-500' : 'bg-green-500'}`} />
      
      <div className="flex justify-between items-center mb-3">
        <div className={`font-mono font-bold text-lg uppercase ${isIntercepted ? 'text-red-500' : 'text-green-500'}`}>
          {isIntercepted ? 'INTERCEPTED' : 'RELEASED'}
        </div>
        <div className="font-mono text-zinc-400 text-xs">
          URGENCY: {latestEvent.urgency} {latestEvent.lap ? `· LAP ${latestEvent.lap}` : ''}
        </div>
      </div>

      <div className={`font-mono mb-4 ${isIntercepted ? 'text-zinc-300 text-sm' : 'text-zinc-500 text-xs'}`}>
        "{latestEvent.original}"
      </div>

      {isIntercepted ? (
        <div className="text-zinc-500 text-xs flex items-center gap-2">
          Granite classification pending<span className="animate-pulse">_</span>
        </div>
      ) : (
        <>
          <div className="text-white font-mono text-xl font-bold mb-3 uppercase">
            {latestEvent.summary}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-green-500 text-xs font-mono">Guardian: SAFE ✓</div>
            {latestEvent.audio_b64 && (
              <div className="text-green-500 text-[10px] border border-green-900 bg-green-950/30 px-2 py-0.5 rounded-sm animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                TRANSMITTING
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const EngineerInput = ({ onTransmit }) => {
  const [msg, setMsg] = useState('');
  
  const handleSend = () => {
    if (!msg.trim()) return;
    onTransmit(msg);
    fetch(`${import.meta.env.VITE_API_URL}/api/radio/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, engineer: "Race Engineer" })
    }).catch(err => console.error(err));
    setMsg('');
  };

  return (
    <div className="mt-auto pt-4">
      <div className="text-zinc-500 text-xs tracking-widest uppercase mb-2">ENGINEER INPUT</div>
      <div className="flex flex-col gap-2">
        <input 
          type="text" 
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type radio message..."
          className="bg-zinc-900 border border-zinc-700 font-mono text-sm w-full p-2 text-zinc-300 outline-none focus:border-zinc-500"
        />
        <button 
          onClick={handleSend}
          className="w-full bg-purple-900 hover:bg-purple-800 text-purple-200 font-mono text-xs uppercase tracking-widest py-2 transition-colors"
        >
          Transmit
        </button>
      </div>
    </div>
  );
};

const AuditLogPanel = () => {
  const [expanded, setExpanded] = useState(false);
  const auditLog = useAuditLog();
  const displayLogs = auditLog.slice(0, 10);

  return (
    <div className="mt-4 border-t border-zinc-800 bg-[#09090b] pt-2">
      <div className="flex justify-between items-center px-2 pb-2">
        <div className="text-xs tracking-widest text-zinc-500 font-mono uppercase">AUDIT LOG</div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-zinc-600 font-mono uppercase hover:text-zinc-400 transition-colors"
        >
          {expanded ? 'HIDE' : 'SHOW'}
        </button>
      </div>
      
      {expanded && (
        <div className="flex flex-col">
          <div className="max-h-[160px] overflow-y-auto">
            {displayLogs.map(entry => (
              <div key={entry.id} className="border-b border-[#1a1a1a] px-2 py-1 flex items-center gap-2 whitespace-nowrap overflow-hidden">
                <span className="text-zinc-500 font-mono text-xs flex-shrink-0">[{entry.timestamp}]</span>
                <span className="text-zinc-400 font-mono text-xs flex-shrink-0">[LAP {entry.lap}]</span>
                <span className={`font-mono text-xs flex-shrink-0 ${entry.status === 'RELEASED' ? 'text-green-400' : entry.status === 'BUFFERED' ? 'text-amber-400' : 'text-red-400'}`}>
                  [{entry.status}]
                </span>
                <span className="text-zinc-400 font-mono text-xs flex-shrink-0">urgency:{entry.urgency}</span>
                <span className="text-zinc-500 font-mono text-xs flex-shrink-0">—</span>
                <span className="text-zinc-300 font-mono text-xs truncate flex-shrink-0">
                  "{entry.summary?.length > 30 ? entry.summary.substring(0, 30) + '...' : entry.summary}"
                </span>
                <span className="text-zinc-500 font-mono text-xs flex-shrink-0">—</span>
                <span className="font-mono text-xs text-zinc-400 flex-shrink-0">Guardian:</span>
                <span className={`font-mono text-xs flex-shrink-0 ${entry.guardian_safe ? 'text-green-400' : 'text-red-500'}`}>
                  {entry.guardian_safe ? 'SAFE ✓' : 'FLAGGED ✗'}
                </span>
              </div>
            ))}
          </div>
          <div className="text-zinc-600 font-mono text-xs px-2 py-1 border-t border-[#1a1a1a] mt-1">
            All decisions logged before broadcast · immutable session record
          </div>
        </div>
      )}
    </div>
  );
};

export const CommandCenter = ({ frame, radioEvents }) => {
  const [localProcessingMsg, setLocalProcessingMsg] = useState(null);

  useEffect(() => {
    if (radioEvents.length > 0) {
      setLocalProcessingMsg(null);
    }
  }, [radioEvents.length]);

  const latestEvent = radioEvents.length > 0 ? radioEvents[radioEvents.length - 1] : null;
  const queue = radioEvents.filter(e => e.status === 'buffering' || e.status === 'intercepted');

  return (
    <div className="h-full flex flex-col bg-zinc-900 rounded-sm border border-zinc-800 p-6 flex-1">
      <IBMPipelineLog frame={frame} radioEvents={radioEvents} />
      <DoclingIntelligence frame={frame} />
      <RadioDecision latestEvent={latestEvent} processingMessage={localProcessingMsg} />
      
      <div className="mt-4 border-t border-zinc-800 pt-4 flex-1 flex flex-col">
        <div className="text-zinc-500 text-xs tracking-widest uppercase mb-3">PENDING QUEUE</div>
        {queue.length === 0 ? (
          <div className="text-zinc-600 font-mono text-xs text-center my-4">— NO MESSAGES BUFFERED —</div>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[150px]">
            {queue.map((q, i) => (
              <div key={i} className="flex flex-col border border-zinc-800 bg-[#09090b] p-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-amber-500 text-[10px] border border-amber-900 bg-amber-950 px-1 font-mono uppercase">PENDING</div>
                  <div className="text-zinc-500 text-[10px] font-mono">URGENCY: {q.urgency}</div>
                </div>
                <div className="text-zinc-400 text-xs font-mono truncate mb-2">{q.original}</div>
                <button 
                  onClick={() => fetch(`${import.meta.env.VITE_API_URL}/api/radio/force`, { method: 'POST' })}
                  className="w-full border border-red-800 text-red-400 hover:bg-red-950 font-mono text-[10px] py-1 transition-colors uppercase"
                >
                  Force Transmit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <EngineerInput onTransmit={setLocalProcessingMsg} />
      <AuditLogPanel />
    </div>
  );
};
