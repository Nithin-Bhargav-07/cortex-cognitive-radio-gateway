import React, { useMemo } from 'react';
import { TrackMap } from './TrackMap';

const LiveChart = ({ data, color, max, title, height }) => {
  const points = useMemo(() => {
    return data.map((val, i) => {
      const x = (i / 59) * 100;
      const y = 100 - (val / max) * 100;
      return `${x},${Math.max(0, Math.min(100, y))}`;
    }).join(' ');
  }, [data, max]);

  return (
    <div className="mb-4">
      <div className="text-zinc-500 text-xs tracking-widest uppercase mb-2">{title}</div>
      <div className="w-full relative border-b border-zinc-800" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <div className="absolute left-0 bottom-0 w-full border-t border-zinc-800/50" />
      </div>
    </div>
  );
};


const TimingTower = () => {
  const drivers = [
    { p: 1, name: "VER", gap: "+0.000" },
    { p: 2, name: "LEC", gap: "+2.341" },
    { p: 3, name: "HAM", gap: "+4.892", ourCar: true },
    { p: 4, name: "NOR", gap: "+7.123" },
    { p: 5, name: "PIA", gap: "+9.456" },
    { p: 6, name: "SAI", gap: "+11.201" }
  ];

  return (
    <div className="mb-4">
      <div className="flex flex-col border border-zinc-800 bg-[#09090b]">
        {drivers.map(d => (
          <div key={d.p} className={`flex px-3 items-center border-b border-zinc-800/50 last:border-0 relative h-[20px] ${d.ourCar ? 'bg-zinc-800/30' : ''}`}>
            {d.ourCar && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7f77dd]" />}
            <div className="w-6 text-zinc-500 font-mono text-[11px]">{d.p}</div>
            <div className="flex-1 text-white font-mono font-bold text-[11px]">{d.name}</div>
            <div className={`font-mono text-[11px] ${d.p === 1 ? 'text-[#7f77dd]' : 'text-zinc-400'}`}>{d.gap}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RaceInfoStrip = ({ frame }) => {
  const statusColor = 
    frame.race_status === 'RACING' ? 'text-green-500' : 
    frame.race_status === 'YELLOW FLAG' ? 'text-amber-500' : 
    frame.race_status === 'SAFETY CAR' ? 'text-red-500' : 'text-zinc-500';

  return (
    <div className="flex w-full mt-auto border-t border-zinc-800">
      <div className="flex-1 py-3 border-r border-zinc-800 text-center font-mono text-[10px] text-zinc-400 uppercase">
        LAP {frame.lap}
      </div>
      <div className="flex-1 py-3 border-r border-zinc-800 text-center font-mono text-[10px] text-zinc-400 uppercase">
        SECTOR {frame.sector}
      </div>
      <div className="flex-1 py-3 border-r border-zinc-800 text-center font-mono text-[10px] text-zinc-400 uppercase">
        DRY / 28°C
      </div>
      <div className="flex-1 py-3 border-r border-zinc-800 text-center font-mono text-[10px] text-zinc-400 uppercase">
        SFT (C4)
      </div>
      <div className={`flex-1 py-3 text-center font-mono text-[10px] uppercase font-bold ${statusColor}`}>
        {frame.race_status}
      </div>
    </div>
  );
};

export const CommandRight = ({ frame, history }) => {
  return (
    <div className="w-[28%] flex flex-col bg-zinc-900 rounded-sm border border-zinc-800 p-6 flex-shrink-0">
      <LiveChart data={history.speed.slice(-60)} color="#22c55e" max={320} title="SPEED LIVE (60 PT)" height={120} />
      <LiveChart data={history.brake.slice(-60)} color="#ef4444" max={100} title="BRAKE LIVE (60 PT)" height={100} />
      <div className="mb-6 flex-1 flex flex-col">
        <div className="text-zinc-500 text-xs tracking-widest uppercase mb-2">TRACK MAP (MONACO)</div>
        <div className="flex-1 min-h-[200px] relative border border-zinc-800 rounded-sm bg-[#09090b] flex items-center justify-center p-0">
          <TrackMap frame={frame} history={history} mapMode="GEAR TRACE" />
        </div>
      </div>
      <TimingTower />
      <RaceInfoStrip frame={frame} />
    </div>
  );
};
