import React, { useState, useMemo } from 'react';
import { useThrottleTelemetry } from '../hooks/useThrottleTelemetry';

const LapIntelligenceView = () => {
  const { frame, history } = useThrottleTelemetry(4);
  const [mode, setMode] = useState('GEAR TRACE'); // 'GEAR TRACE' or 'SECTOR DELTA'

  // Synthetic Track Map
  const trackPath = "M 80 15 C 90 20, 95 35, 85 45 C 75 55, 60 40, 50 50 C 40 60, 30 70, 20 60 C 10 50, 20 30, 40 20 C 60 10, 70 10, 80 15 Z";

  const getGearColor = (g) => {
    if (g <= 2) return '#ef4444';
    if (g <= 4) return '#eab308';
    if (g <= 6) return '#22c55e';
    return '#06b6d4';
  };

  const gearDots = useMemo(() => {
    if (mode !== 'GEAR TRACE') return null;
    return history.x.map((x, i) => {
      const y = history.y[i];
      const g = history.gear[i];
      if (x === 0 && y === 0) return null; // skip initial zeros
      return <circle key={i} cx={x * 100} cy={y * 100} r="1" fill={getGearColor(g)} opacity={0.6} />;
    });
  }, [history.x, history.y, history.gear, mode]);

  // Synthetic distance mapping: simplistic assumption for UI visualization
  const currentDistance = (frame.lap * 3337 + frame.x * 3337) % 3337;
  
  // Synthetic charts (speed and brake traces)
  const renderSpeedTrace = () => {
    // Generate a synthetic PB line
    const pbPts = "0,100 10,10 20,20 30,90 40,80 50,20 60,10 70,80 80,90 90,30 100,100";
    
    // Convert current 60pt speed history into a line that spans 0-100 X
    const currentPts = history.speed.map((val, i) => {
      const x = (i / 59) * 100;
      const y = 100 - (val / 320) * 100;
      return `${x},${Math.max(0, Math.min(100, y))}`;
    }).join(' ');

    return (
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-sm p-4 flex flex-col relative">
        <div className="text-zinc-500 text-xs tracking-widest uppercase mb-4">SPEED TRACE</div>
        <div className="flex-1 relative">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            {/* PB line */}
            <polyline points={pbPts} fill="none" stroke="#7f77dd" strokeWidth="1.5" strokeOpacity="0.4" />
            {/* Current line */}
            <polyline points={currentPts} fill="none" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="flex justify-between text-zinc-600 text-[10px] mt-2 font-mono">
          <span>0m</span><span>800m</span><span>1600m</span><span>2400m</span><span>3337m</span>
        </div>
      </div>
    );
  };

  const renderBrakeTrace = () => {
    const currentPts = history.brake.map((val, i) => {
      const x = (i / 59) * 100;
      const y = 100 - (val / 100) * 100;
      return `${x},${Math.max(0, Math.min(100, y))}`;
    }).join(' ');

    // Fill under curve
    const fillPts = `0,100 ${currentPts} 100,100`;

    return (
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-sm p-4 flex flex-col relative">
        <div className="text-zinc-500 text-xs tracking-widest uppercase mb-4">BRAKE TRACE</div>
        <div className="flex-1 relative">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <polygon points={fillPts} fill="#ef4444" fillOpacity="0.2" />
            <polyline points={currentPts} fill="none" stroke="#ef4444" strokeWidth="1.5" />
            {/* Red dot for heavy braking */}
            {history.brake.map((val, i) => {
              if (val > 80 && i % 5 === 0) {
                const x = (i / 59) * 100;
                const y = 100 - (val / 100) * 100;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="1.5" fill="#ef4444" />
                    <text x={x} y={y - 5} fill="#ef4444" fontSize="4" textAnchor="middle" className="font-mono">HEAVY</text>
                  </g>
                );
              }
              return null;
            })}
          </svg>
        </div>
        <div className="flex justify-between text-zinc-600 text-[10px] mt-2 font-mono">
          <span>0m</span><span>800m</span><span>1600m</span><span>2400m</span><span>3337m</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Half - Monaco Track Map */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-sm p-4 flex flex-col relative">
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button 
            className={`px-3 py-1 font-mono text-xs border rounded-sm transition-colors ${mode === 'GEAR TRACE' ? 'bg-[#7f77dd]/20 border-[#7f77dd] text-[#7f77dd]' : 'border-zinc-700 text-zinc-400 hover:text-zinc-300'}`}
            onClick={() => setMode('GEAR TRACE')}
          >
            GEAR TRACE
          </button>
          <button 
            className={`px-3 py-1 font-mono text-xs border rounded-sm transition-colors ${mode === 'SECTOR DELTA' ? 'bg-[#7f77dd]/20 border-[#7f77dd] text-[#7f77dd]' : 'border-zinc-700 text-zinc-400 hover:text-zinc-300'}`}
            onClick={() => setMode('SECTOR DELTA')}
          >
            SECTOR DELTA
          </button>
        </div>

        <div className="text-zinc-500 text-xs tracking-widest uppercase mb-4 absolute top-4 left-4">TRACK INTELLIGENCE (MONACO)</div>
        
        <div className="flex-1 flex items-center justify-center relative mt-8">
          <svg viewBox="0 0 100 100" className="w-full h-full max-h-[400px] overflow-visible">
            {/* Base Track Outline */}
            <path d={trackPath} fill="none" stroke="#27272a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            
            {mode === 'SECTOR DELTA' && (
              <>
                {/* Sector 1 (Gain) */}
                <path d="M 80 15 C 90 20, 95 35, 85 45 C 75 55, 60 40, 50 50" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <text x="85" y="30" fill="#22c55e" fontSize="4" className="font-mono font-bold">-0.1s</text>
                
                {/* Sector 2 (Loss) */}
                <path d="M 50 50 C 40 60, 30 70, 20 60" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <text x="25" y="65" fill="#ef4444" fontSize="4" className="font-mono font-bold">+0.3s</text>

                {/* Sector 3 (Loss) */}
                <path d="M 20 60 C 10 50, 20 30, 40 20 C 60 10, 70 10, 80 15" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <text x="40" y="25" fill="#ef4444" fontSize="4" className="font-mono font-bold">+0.5s</text>
              </>
            )}

            {mode === 'GEAR TRACE' && gearDots}

            {/* Current Car Pos */}
            <circle cx={frame.x * 100} cy={frame.y * 100} r="2" fill="white" />
          </svg>
        </div>
      </div>

      {/* Bottom Half - Charts */}
      <div className="h-[40%] flex gap-4">
        {renderSpeedTrace()}
        {renderBrakeTrace()}
      </div>
    </div>
  );
};

export default LapIntelligenceView;
