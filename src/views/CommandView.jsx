import React, { useMemo, useEffect, useRef } from 'react';
import { useThrottleTelemetry } from '../hooks/useThrottleTelemetry';
import { useRadio } from '../contexts/RadioContext';
import { CommandCenter } from '../components/CommandCenter';
import { CommandRight } from '../components/CommandRight';

// helper
const getCLColor = (score) => {
  if (score <= 40) return '#22c55e';
  if (score <= 70) return '#eab308';
  return '#ef4444';
};

const CLTimelineStrip = ({ clHistory, radioEvents }) => {
  const segments = useMemo(() => {
    return clHistory.map((score, i) => (
      <div 
        key={i} 
        style={{ width: '1.66%', height: '100%', backgroundColor: getCLColor(score) }} 
      />
    ));
  }, [clHistory]);

  return (
    <div className="mt-6 mb-8">
      <div className="text-zinc-500 text-xs tracking-widest mb-2 uppercase">CL HISTORY · LAST 6s</div>
      <div className="w-full h-8 flex rounded-sm overflow-hidden relative">
        {segments}
        {/* We would render radio event markers here. Simplification: skip exact tick matching for now, as radio events don't easily map to the 60-point array without timestamp math. */}
      </div>
      <div className="flex justify-between text-zinc-600 text-[10px] mt-1 font-mono">
        <span>6s ago</span>
        <span>3s ago</span>
        <span>0s</span>
      </div>
    </div>
  );
};

const CLHeroMetric = ({ frame }) => {
  const color = getCLColor(frame.cl_score);
  const isRed = frame.cl_score > 70;
  
  return (
    <div className="flex flex-col mb-6">
      <div 
        className={`font-mono text-8xl font-bold leading-none mb-2 ${isRed ? 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}`}
        style={{ color: isRed ? '#ef4444' : color }}
      >
        {Math.round(frame.cl_score)}
      </div>
      <div className="tracking-widest uppercase text-sm font-semibold" style={{ color }}>
        {frame.cl_label}
      </div>
      <div className="text-zinc-400 font-mono text-xs mt-2">
        SPEED {Math.round(frame.speed)} KM/H · GEAR {frame.n_gear} · {frame.race_status}
      </div>
      
      {frame.in_battle && (
        <div className="mt-3 text-amber-500 border border-amber-900 bg-amber-950/30 px-3 py-1 rounded-sm text-xs font-mono inline-block w-max animate-pulse">
          ⚡ BATTLE MODE
        </div>
      )}
      
      {frame.predictive_hold && frame.cl_score <= 65 && (
        <div className="mt-3 text-amber-500 border border-amber-900 bg-amber-950/30 px-3 py-1 rounded-sm text-xs font-mono inline-block w-max">
          ⚠ PREDICTIVE HOLD · {frame.upcoming_corner} IN {frame.corner_seconds_away}s
        </div>
      )}
    </div>
  );
};

const Biometrics = ({ frame, history }) => {
  const renderSparkline = (data, min, max, colorFn) => {
    const pts = data.map((val, i) => {
      const x = (i / 59) * 100;
      const y = 100 - ((val - min) / (max - min)) * 100;
      return `${x},${Math.max(0, Math.min(100, y))}`;
    }).join(' ');
    
    const currentColor = colorFn(data[59]);
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-12 mt-2 mb-2 overflow-visible">
        <polyline points={pts} fill="none" stroke={currentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const hrvColor = (val) => val > 45 ? '#22c55e' : val > 30 ? '#eab308' : '#ef4444';
  const edaColor = (val) => val < 10 ? '#22c55e' : val < 18 ? '#eab308' : '#ef4444';

  return (
    <div className="flex gap-4 mb-8">
      <div className="flex-1 border-t border-zinc-800 pt-4">
        <div className="text-zinc-500 text-xs tracking-widest uppercase">HRV</div>
        {renderSparkline(history.hrv, 20, 80, hrvColor)}
        <div className="flex justify-between items-baseline">
          <span className="font-mono text-lg" style={{ color: hrvColor(frame.hrv) }}>{Math.round(frame.hrv)}ms</span>
          <span className="text-[10px] text-zinc-600 uppercase">{frame.hrv > 45 ? 'RECOVERING' : frame.hrv > 30 ? 'STRESSED' : 'CRITICAL'}</span>
        </div>
      </div>
      <div className="flex-1 border-t border-zinc-800 pt-4">
        <div className="text-zinc-500 text-xs tracking-widest uppercase">EDA</div>
        {renderSparkline(history.eda, 0, 25, edaColor)}
        <div className="flex justify-between items-baseline">
          <span className="font-mono text-lg" style={{ color: edaColor(frame.eda) }}>{frame.eda.toFixed(1)}μS</span>
          <span className="text-[10px] text-zinc-600 uppercase">{frame.eda < 10 ? 'BASELINE' : frame.eda < 18 ? 'ELEVATED' : 'SPIKE'}</span>
        </div>
      </div>
    </div>
  );
};

const BattleProximity = ({ frame }) => {
  const getGapColor = (gap) => gap > 2.0 ? '#22c55e' : gap > 1.0 ? '#eab308' : '#ef4444';
  
  return (
    <div className="border-t border-zinc-800 pt-4">
      <div className="text-zinc-500 text-xs tracking-widest uppercase mb-4">BATTLE PROXIMITY</div>
      
      <div className="flex items-center gap-3 mb-3">
        <div className="text-xs text-zinc-400 w-12 text-right">AHEAD</div>
        <div className="flex-1 bg-zinc-900 h-2 rounded-full overflow-hidden">
          <div className="h-full transition-all duration-300" style={{ width: `${Math.min(100, (frame.gap_ahead / 5) * 100)}%`, backgroundColor: getGapColor(frame.gap_ahead) }} />
        </div>
        <div className="font-mono text-sm w-12 text-left" style={{ color: getGapColor(frame.gap_ahead) }}>{frame.gap_ahead.toFixed(1)}s</div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-xs text-zinc-400 w-12 text-right">BEHIND</div>
        <div className="flex-1 bg-zinc-900 h-2 rounded-full overflow-hidden relative">
          <div className={`h-full transition-all duration-300 ${frame.gap_behind < 1.0 ? 'animate-pulse' : ''}`} style={{ width: `${Math.min(100, (frame.gap_behind / 5) * 100)}%`, backgroundColor: getGapColor(frame.gap_behind) }} />
        </div>
        <div className="font-mono text-sm w-12 text-left" style={{ color: getGapColor(frame.gap_behind) }}>
          {frame.gap_behind < 1.0 ? <span className="text-[10px] uppercase mr-1">DRS</span> : null}
          {frame.gap_behind.toFixed(1)}s
        </div>
      </div>
      
      {frame.in_battle && (
        <div className="text-amber-500 text-[10px] mt-3 font-mono">
          +20 CL · BATTLE ACTIVE
        </div>
      )}
    </div>
  );
};

const CommandView = () => {
  const { frame, history } = useThrottleTelemetry(4);
  const { radioEvents } = useRadio();

  return (
    <div className="h-full flex flex-col overflow-y-auto pr-2 pb-4">
      <div className="flex gap-4 flex-shrink-0">
        {/* Left Column (28%) */}
        <div className="w-[28%] flex flex-col bg-zinc-900 rounded-sm border border-zinc-800 p-6">
          <CLHeroMetric frame={frame} />
          <CLTimelineStrip clHistory={history.cl_score} radioEvents={radioEvents} />
          <Biometrics frame={frame} history={history} />
          <BattleProximity frame={frame} />
        </div>

        {/* Center Column (44%) */}
        <CommandCenter frame={frame} radioEvents={radioEvents} />

        {/* Right Column (28%) */}
        <CommandRight frame={frame} history={history} />
      </div>
    </div>
  );
};

export default CommandView;
