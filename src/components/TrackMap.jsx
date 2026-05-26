import React, { useRef, useState, useEffect } from 'react';

const TRACK_LENGTH = 3337;
const TRACK_PATH = "M 80 15 C 90 20, 95 35, 85 45 C 75 55, 60 40, 50 50 C 40 60, 30 70, 20 60 C 10 50, 20 30, 40 20 C 60 10, 70 10, 80 15 Z";

const getHighFidelityGearColor = (g) => {
  switch(g) {
    case 1: return '#38bdf8'; // Light Blue
    case 2: return '#fb923c'; // Orange
    case 3: return '#4ade80'; // Green
    case 4: return '#f87171'; // Red
    case 5: return '#f472b6'; // Pink
    case 6: return '#3b82f6'; // Dark Blue
    case 7: return '#a1a1aa'; // Grey
    case 8: return '#ffffff'; // White
    default: return '#27272a'; // Un-driven faint dark grey
  }
};

export const TrackMap = ({ frame, mapMode = 'GEAR TRACE' }) => {
  const trackPathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);
  const [dots, setDots] = useState([]);
  const [paintedGears, setPaintedGears] = useState(Array(300).fill(null));

  useEffect(() => {
    if (trackPathRef.current) {
      const length = trackPathRef.current.getTotalLength();
      setPathLength(length);
      
      const numDots = 300;
      const computedDots = [];
      for (let i = 0; i < numDots; i++) {
        const pt = trackPathRef.current.getPointAtLength((i / numDots) * length);
        computedDots.push({ x: pt.x, y: pt.y });
      }
      setDots(computedDots);
    }
  }, []);

  // Update painted gears
  useEffect(() => {
    if (frame && dots.length > 0) {
      const progress = frame.progress ?? Math.max(0, Math.min(1, (frame.lap_distance || 0) / TRACK_LENGTH));
      // Prevent mapping errors if data jumps
      const nearestIdx = Math.floor(progress * dots.length) % dots.length;
      
      if (frame.n_gear) {
        setPaintedGears(prev => {
          // If lap reset, we might want to reset the painted gears, but the spec says:
          // "painted lap must persist until lap 2 begins"
          // We'll just continuously paint over it.
          // Wait, if it resets to 0 (progress near 0), and prev had 299 painted, maybe clear?
          // The spec doesn't explicitly mention clearing logic besides "persist until lap 2 begins", so we just keep updating.
          if (progress < 0.05 && prev[290] !== null) {
            // rudimentary lap reset
            const next = Array(300).fill(null);
            next[nearestIdx] = frame.n_gear;
            return next;
          }
          const next = [...prev];
          next[nearestIdx] = frame.n_gear;
          return next;
        });
      }
    }
  }, [frame, dots]);

  const progress = frame?.progress ?? Math.max(0, Math.min(1, ((frame?.lap_distance || 0) / TRACK_LENGTH)));
  const dotPos = trackPathRef.current && pathLength > 0 
    ? trackPathRef.current.getPointAtLength(progress * pathLength) 
    : { x: 0, y: 0 };

  const s1 = frame?.sector_delta_s1 || 0;
  const s2 = frame?.sector_delta_s2 || 0;
  const s3 = frame?.sector_delta_s3 || 0;
  
  const traffic = frame?.traffic || [];

  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-4">
      <svg viewBox="0 0 100 100" className="w-full h-full max-w-3xl overflow-visible" preserveAspectRatio="xMidYMid meet">
        {mapMode === 'SECTOR DELTA' && (
          <defs>
            <linearGradient id="sectorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="33%" stopColor={s1 > 0 ? '#ef4444' : '#22c55e'} />
              <stop offset="33%" stopColor={s2 > 0 ? '#ef4444' : '#22c55e'} />
              <stop offset="66%" stopColor={s2 > 0 ? '#ef4444' : '#22c55e'} />
              <stop offset="66%" stopColor={s3 > 0 ? '#ef4444' : '#22c55e'} />
            </linearGradient>
          </defs>
        )}
        
        {/* We need the invisible path to measure it */}
        <path 
          ref={trackPathRef} 
          d={TRACK_PATH} 
          fill="none" 
          stroke={mapMode === 'SECTOR DELTA' ? "url(#sectorGradient)" : "none"} 
          strokeWidth={mapMode === 'SECTOR DELTA' ? "2" : "0"} 
          strokeLinecap="butt" 
        />
        
        {/* Render discrete dots if mapMode is GEAR TRACE */}
        {mapMode === 'GEAR TRACE' && dots.map((pt, i) => (
          <circle 
            key={i} 
            cx={pt.x} 
            cy={pt.y} 
            r="1" 
            fill={paintedGears[i] ? getHighFidelityGearColor(paintedGears[i]) : '#27272a'} 
          />
        ))}

        {/* Traffic rendering */}
        {traffic.map(t => {
          if (!trackPathRef.current || !pathLength) return null;
          const pt = trackPathRef.current.getPointAtLength(t.progress * pathLength);
          return (
            <g key={t.id}>
              <circle cx={pt.x} cy={pt.y} r="1" fill="#71717a" />
              <text x={pt.x + 2} y={pt.y + 1} fontSize="4" fill="#71717a" fontFamily="monospace">{t.id}</text>
            </g>
          );
        })}

        {/* Main car dot */}
        {trackPathRef.current && (
          <circle cx={dotPos.x} cy={dotPos.y} r="0.75" fill="#7f77dd" />
        )}
      </svg>
      {mapMode === 'SECTOR DELTA' && (
        <>
          <div className="absolute top-8 left-10 bg-zinc-900 border border-zinc-700 px-1 font-mono text-[10px]" style={{color: s1 > 0 ? '#ef4444' : '#22c55e'}}>S1 {s1 > 0 ? '+' : ''}{s1.toFixed(3)}</div>
          <div className="absolute top-1/2 left-1/2 bg-zinc-900 border border-zinc-700 px-1 font-mono text-[10px]" style={{color: s2 > 0 ? '#ef4444' : '#22c55e'}}>S2 {s2 > 0 ? '+' : ''}{s2.toFixed(3)}</div>
          <div className="absolute bottom-8 right-10 bg-zinc-900 border border-zinc-700 px-1 font-mono text-[10px]" style={{color: s3 > 0 ? '#ef4444' : '#22c55e'}}>S3 {s3 > 0 ? '+' : ''}{s3.toFixed(3)}</div>
        </>
      )}
    </div>
  );
};
