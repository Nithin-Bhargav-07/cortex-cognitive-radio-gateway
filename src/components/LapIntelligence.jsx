import React, { useRef, useState, useEffect } from 'react';
import { useThrottleTelemetry } from '../hooks/useThrottleTelemetry';
import { TrackMap } from './TrackMap';

const TRACK_LENGTH = 3337;
const TRACK_PATH = "M 80 15 C 90 20, 95 35, 85 45 C 75 55, 60 40, 50 50 C 40 60, 30 70, 20 60 C 10 50, 20 30, 40 20 C 60 10, 70 10, 80 15 Z";

const getGearColor = (g) => {
  if (g <= 2) return '#ef4444';
  if (g <= 4) return '#eab308';
  if (g <= 6) return '#22c55e';
  return '#06b6d4';
};

const LapIntelligence = () => {
  const { frame, history } = useThrottleTelemetry(4);
  const trackPathRef = useRef(null);
  const [dotPos, setDotPos] = useState({ x: 0, y: 0 });
  const [mapMode, setMapMode] = useState('GEAR TRACE'); // 'GEAR TRACE' or 'SECTOR DELTA'

  const renderTrackMap = () => {
    return (
      <div className="flex-1 w-full flex items-center justify-center bg-[#09090b] relative min-h-0">
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <button 
            onClick={() => setMapMode('GEAR TRACE')}
            className={`px-2 py-1 font-mono text-[10px] border ${mapMode === 'GEAR TRACE' ? 'bg-zinc-800 text-white border-zinc-600' : 'text-zinc-500 border-zinc-800'}`}
          >
            GEAR TRACE
          </button>
          <button 
            onClick={() => setMapMode('SECTOR DELTA')}
            className={`px-2 py-1 font-mono text-[10px] border ${mapMode === 'SECTOR DELTA' ? 'bg-zinc-800 text-white border-zinc-600' : 'text-zinc-500 border-zinc-800'}`}
          >
            SECTOR DELTA
          </button>
        </div>
        
        <TrackMap frame={frame} history={history} mapMode={mapMode} />
      </div>
    );
  };

  const renderTelemetryBar = () => (
    <div className="w-full h-[40px] bg-[#18181b] flex items-end">
      <div className="w-full h-[40px] flex items-center px-4 font-mono text-sm border-t border-zinc-800">
        <div className="text-white font-bold mr-4 px-2 py-0.5 bg-zinc-800 rounded-sm">[HAM]</div>
        <div className="flex items-center gap-2 px-3 border-l border-zinc-700">
          <span className="text-zinc-400">SPD</span>
          <span className="text-white">{frame.speed !== undefined ? Math.round(frame.speed) : '--'}km/h</span>
        </div>
        <div className="flex items-center gap-2 px-3 border-l border-zinc-700">
          <span className="text-zinc-400">THR</span>
          <span className="text-white">{frame.throttle !== undefined ? Math.round(frame.throttle) : '--'}%</span>
        </div>
        <div className="flex items-center gap-2 px-3 border-l border-zinc-700">
          <span className="text-zinc-400">BRK</span>
          <span className="text-white">{frame.brake !== undefined ? Math.round(frame.brake) : '--'}%</span>
        </div>
        <div className="flex items-center gap-2 px-3 border-l border-zinc-700">
          <span className="text-zinc-400">GEAR</span>
          <span className="text-white">{frame.n_gear !== undefined ? frame.n_gear : '-'}</span>
        </div>
        <div className="flex items-center gap-2 px-3 border-l border-zinc-700">
          <span className="text-zinc-400">DRS</span>
          <span className="text-white">{frame.drs === 1 ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </div>
  );

  const renderSpeedProfile = () => {
    const speedPts = history.speed.map((val, i) => {
      const dist = history.lap_distance[i];
      const x = (dist / TRACK_LENGTH) * 100;
      const y = 100 - (val / 320) * 100;
      return `${x},${Math.max(0, Math.min(100, y))}`;
    }).join(' ');

    // Braking zones detection
    const brakingZones = [];
    let currentZone = null;
    let brakeCount = 0;
    
    for (let i = 0; i < history.brake.length; i++) {
      if (history.brake[i] > 60) {
        if (!currentZone) {
          currentZone = { start: history.lap_distance[i], end: history.lap_distance[i] };
          brakeCount = 1;
        } else {
          currentZone.end = history.lap_distance[i];
          brakeCount++;
        }
      } else {
        if (currentZone && brakeCount >= 3) {
          brakingZones.push(currentZone);
        }
        currentZone = null;
        brakeCount = 0;
      }
    }
    if (currentZone && brakeCount >= 3) brakingZones.push(currentZone);

    return (
      <div className="h-[20%] min-h-0 w-full bg-[#18181b] border border-zinc-800 p-4 flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-start mb-2 z-10 flex-shrink-0">
          <div className="text-zinc-500 text-xs tracking-widest uppercase">SPEED PROFILE</div>
          <div className="text-white font-mono text-sm">{frame.speed !== undefined ? Math.round(frame.speed) : '--'} km/h</div>
        </div>
        <div className="flex-1 relative border-b border-zinc-800 min-h-0">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-hidden absolute inset-0">
            {brakingZones.map((z, i) => {
              const x1 = (z.start / TRACK_LENGTH) * 100;
              const x2 = (z.end / TRACK_LENGTH) * 100;
              const w = Math.max(0.5, x2 - x1);
              return <rect key={i} x={x1} y="0" width={w} height="100" fill="#ef4444" fillOpacity="0.12" />;
            })}
            <polyline points={speedPts} fill="none" stroke="#f4f4f5" strokeWidth="1" />
          </svg>
        </div>
        <div className="flex justify-between text-zinc-600 text-xs font-mono mt-1 px-1 z-10">
          <span>0m</span><span>800m</span><span>1600m</span><span>2400m</span><span>3337m</span>
        </div>
      </div>
    );
  };

  const renderDriverInputs = () => {
    const thrPts = history.throttle.map((val, i) => {
      const x = (history.lap_distance[i] / TRACK_LENGTH) * 100;
      const y = 100 - (val / 100) * 100;
      return `${x},${Math.max(0, Math.min(100, y))}`;
    }).join(' ');

    const brkPts = history.brake.map((val, i) => {
      const x = (history.lap_distance[i] / TRACK_LENGTH) * 100;
      const y = 100 - (val / 100) * 100;
      return `${x},${Math.max(0, Math.min(100, y))}`;
    }).join(' ');

    const gearPts = history.n_gear.map((val, i) => {
      const x = (history.lap_distance[i] / TRACK_LENGTH) * 100;
      const y = 100 - (val / 8) * 100;
      return `${x},${Math.max(0, Math.min(100, y))}`;
    }).join(' ');

    const renderSectorRow = (name, val) => {
      const v = val || 0;
      const color = v > 0 ? '#ef4444' : '#22c55e';
      const mag = Math.min(1, Math.abs(v) / 0.5) * 100;
      return (
        <div className="flex flex-col mb-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400">{name}</span>
            <span className="font-bold" style={{ color }}>{v > 0 ? '+' : ''}{v.toFixed(3)}</span>
          </div>
          <div className="h-[2px] bg-zinc-800 w-full mt-0.5">
            <div className="h-full" style={{ width: `${mag}%`, backgroundColor: color }} />
          </div>
        </div>
      );
    };

    return (
      <div className="h-[25%] min-h-0 flex gap-2">
        <div className="w-[55%] bg-[#18181b] border border-zinc-800 p-4 flex flex-col relative overflow-hidden min-h-0">
          <div className="flex justify-between items-start mb-2 z-10 flex-shrink-0">
            <div className="text-zinc-500 text-xs tracking-widest uppercase">DRIVER INPUTS</div>
            <div className="flex gap-3 text-xs font-mono">
              <div className="flex items-center gap-1 text-zinc-400"><span className="w-2 h-2 rounded-full bg-green-500"></span> THR</div>
              <div className="flex items-center gap-1 text-zinc-400"><span className="w-2 h-2 rounded-full bg-red-500"></span> BRK</div>
            </div>
          </div>
          <div className="flex-1 relative border-b border-zinc-800 min-h-0">
            <div className="absolute left-0 bottom-0 w-full border-t border-zinc-800" />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-hidden absolute inset-0">
              <polyline points={thrPts} fill="none" stroke="#22c55e" strokeWidth="1" />
              <polyline points={brkPts} fill="none" stroke="#ef4444" strokeWidth="1" />
            </svg>
          </div>
        </div>
        
        <div className="w-[45%] flex flex-col gap-2 min-h-0">
          <div className="flex-1 bg-[#18181b] border border-zinc-800 p-3 flex flex-col relative overflow-hidden min-h-0">
            <div className="flex justify-between items-start z-10 flex-shrink-0">
              <div className="text-zinc-500 text-xs tracking-widest uppercase">GEAR</div>
              <div className="font-mono text-lg font-bold leading-none" style={{ color: getGearColor(frame.n_gear) }}>{frame.n_gear || '-'}</div>
            </div>
            <div className="flex-1 relative mt-1 min-h-0">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-hidden absolute inset-0">
                <polyline points={gearPts} fill="none" stroke={getGearColor(frame.n_gear)} strokeWidth="1" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 bg-[#18181b] border border-zinc-800 p-3 flex flex-col overflow-hidden min-h-0">
            <div className="text-zinc-500 text-xs tracking-widest uppercase mb-1 flex-shrink-0">SECTOR Δ vs BEST</div>
            <div className="flex-1 flex flex-col justify-center min-h-0">
              {renderSectorRow('S1', frame.sector_delta_s1)}
              {renderSectorRow('S2', frame.sector_delta_s2)}
              {renderSectorRow('S3', frame.sector_delta_s3)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdvancedDynamics = () => {
    // Steering Angle
    const steerPts = history.steering_angle.map((val, i) => {
      const x = (history.lap_distance[i] / TRACK_LENGTH) * 100;
      // Range -180 to 180, center at 50
      const y = 50 - (val / 180) * 50;
      return `${x},${Math.max(0, Math.min(100, y))}`;
    }).join(' ');
    const steerColor = Math.abs(frame.steering_angle || 0) > 90 ? '#eab308' : '#f4f4f5';

    // Friction Circle
    const fcDots = [];
    for(let i = 0; i < 200; i++) {
      const glat = history.g_lateral[history.g_lateral.length - 200 + i];
      const glon = history.g_longitudinal[history.g_longitudinal.length - 200 + i];
      if (glat !== undefined && glon !== undefined) {
        const mag = Math.sqrt(glat*glat + glon*glon);
        const col = mag > 3 ? '#ef4444' : mag > 1.5 ? '#eab308' : '#52525b';
        // Map x(-4.5 to 4.5) to 0-100, y(-3 to 3) to 0-100 (inverted Y)
        const px = ((glat + 4.5) / 9) * 100;
        const py = ((-glon + 3) / 6) * 100;
        fcDots.push(<circle key={i} cx={px} cy={py} r="2" fill={col} />);
      }
    }
    const currLat = frame.g_lateral || 0;
    const currLon = frame.g_longitudinal || 0;
    const currPx = ((currLat + 4.5) / 9) * 100;
    const currPy = ((-currLon + 3) / 6) * 100;

    return (
      <div className="h-[20%] min-h-0 flex gap-2">
        {/* STEERING */}
        <div className="w-[33.3%] bg-[#18181b] border border-zinc-800 p-4 flex flex-col relative overflow-hidden min-h-0">
          <div className="flex justify-between items-start mb-2 z-10 flex-shrink-0">
            <div className="text-zinc-500 text-xs tracking-widest uppercase">STEERING</div>
            <div className="text-white font-mono text-xs">{frame.steering_angle !== undefined ? Math.round(frame.steering_angle) : '--'}°</div>
          </div>
          <div className="flex-1 relative min-h-0">
            <div className="absolute top-1/2 left-0 w-full border-t border-zinc-700" />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-hidden absolute inset-0">
              <polyline points={steerPts} fill="none" stroke={steerColor} strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* FRICTION CIRCLE */}
        <div className="w-[33.3%] bg-[#18181b] border border-zinc-800 p-4 flex flex-col relative overflow-hidden min-h-0">
          <div className="text-zinc-500 text-xs tracking-widest uppercase mb-1 z-10 flex-shrink-0">FRICTION CIRCLE</div>
          <div className="flex-1 relative flex items-center justify-center min-h-0">
            <svg viewBox="0 0 100 100" className="w-[80px] h-full overflow-visible">
              <line x1="50" y1="0" x2="50" y2="100" stroke="#27272a" strokeWidth="1" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#27272a" strokeWidth="1" />
              {/* 1G circle: x range is 9 (-4.5 to 4.5), so 1G radius is 1/9 * 100 = 11.11. Wait, aspect ratio is not 1:1 if width and height map differently!
                  Let's use a 1:1 viewbox since Friction Circle should be a circle. 
                  ViewBox 0 0 100 100 where 50,50 is 0,0G. Let's say radius 50 = 4.5G. 
                  So 1G = 50 / 4.5 = 11.1 */}
              <circle cx="50" cy="50" r="11.1" fill="none" stroke="#3f3f46" strokeWidth="1" />
              <circle cx="50" cy="50" r="27.7" fill="none" stroke="#27272a" strokeWidth="1" />
              
              {/* Redraw dots mapping to this new scale (-4.5 to 4.5 maps to 0 to 100) */}
              {history.g_lateral.slice(-200).map((glat, i) => {
                const glon = history.g_longitudinal.slice(-200)[i];
                if (glat !== undefined && glon !== undefined) {
                  const mag = Math.sqrt(glat*glat + glon*glon);
                  const col = mag > 3 ? '#ef4444' : mag > 1.5 ? '#eab308' : '#52525b';
                  const px = 50 + (glat / 4.5) * 50;
                  const py = 50 - (glon / 4.5) * 50; // Invert Y
                  return <circle key={i} cx={px} cy={py} r="1.5" fill={col} />;
                }
                return null;
              })}
              <circle cx={50 + (currLat / 4.5) * 50} cy={50 - (currLon / 4.5) * 50} r="3" fill="#7f77dd" />
            </svg>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-mono">LAT</div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] text-zinc-600 font-mono">LONG</div>
          </div>
        </div>

        {/* LIVE TIMING */}
        <div className="w-[33.4%] bg-[#18181b] border border-zinc-800 p-4 flex flex-col relative overflow-hidden min-h-0">
          <div className="text-zinc-500 text-xs tracking-widest uppercase mb-3 flex-shrink-0">LIVE TIMING</div>
          
          <div className="flex flex-col gap-2 font-mono text-xs mb-auto overflow-y-auto min-h-0">
            <div className="flex justify-between">
              <span className="text-zinc-400">AHEAD:</span>
              <span className={(frame.gap_ahead || 0) > 2 ? 'text-green-500' : (frame.gap_ahead || 0) > 1 ? 'text-amber-500' : 'text-red-500 animate-pulse'}>
                {(frame.gap_ahead || 0).toFixed(3)}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">BEHIND:</span>
              <span className={(frame.gap_behind || 0) > 2 ? 'text-green-500' : (frame.gap_behind || 0) > 1 ? 'text-amber-500' : 'text-red-500 animate-pulse'}>
                {(frame.gap_behind || 0).toFixed(3)}s
              </span>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="font-mono text-3xl font-bold text-white">L{frame.lap || '-'}</div>
            <div className={`px-2 py-1 font-mono text-[10px] uppercase font-bold rounded-sm
              ${frame.race_status === 'RACING' ? 'bg-green-900/30 text-green-500 border border-green-900' : 
                frame.race_status === 'YELLOW FLAG' ? 'bg-amber-900/30 text-amber-500 border border-amber-900' : 
                frame.race_status === 'SAFETY CAR' ? 'bg-red-900/30 text-red-500 border border-red-900' : 'bg-zinc-800 text-zinc-400'}`}>
              {frame.race_status || 'UNKNOWN'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-2rem)] overflow-hidden bg-[#09090b] flex flex-col gap-2 p-2">
      <div className="flex flex-col w-full h-[35%] min-h-0 gap-0">
        {renderTrackMap()}
        {renderTelemetryBar()}
      </div>
      {renderSpeedProfile()}
      {renderDriverInputs()}
      {renderAdvancedDynamics()}
    </div>
  );
};

export default LapIntelligence;
