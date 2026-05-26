import React, { useState, useEffect } from 'react';
import CommandView from './views/CommandView';
import LapIntelligence from './components/LapIntelligence';
import CarSystemsView from './views/CarSystemsView';

// Custom SVG Icons
const BrainIcon = ({ active }) => (
  <svg width={active ? 22 : 20} height={active ? 22 : 20} viewBox="0 0 24 24" fill="none" stroke={active ? '#7f77dd' : '#71717a'} strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="15" cy="12" r="2" />
  </svg>
);

const ChartIcon = ({ active }) => (
  <svg width={active ? 22 : 20} height={active ? 22 : 20} viewBox="0 0 24 24" fill="none" stroke={active ? '#7f77dd' : '#71717a'} strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="14" y2="12" />
    <line x1="4" y1="18" x2="10" y2="18" />
  </svg>
);

const CarIcon = ({ active }) => (
  <svg width={active ? 22 : 20} height={active ? 22 : 20} viewBox="0 0 24 24" fill="none" stroke={active ? '#7f77dd' : '#71717a'} strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="8" y="8" width="2" height="2" />
    <rect x="14" y="8" width="2" height="2" />
    <rect x="8" y="14" width="2" height="2" />
    <rect x="14" y="14" width="2" height="2" />
  </svg>
);

const LoadingScreen = ({ onComplete }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(onComplete, 400); // Wait for fade transition
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-400 ${
        fade ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center relative">
        <h1 className="font-mono text-5xl tracking-[0.3em] text-white mb-8 ml-4">CORTEX</h1>
        
        {/* F1 Car Silhouette & Speed lines */}
        <div className="relative w-64 h-16 flex items-center mb-6 overflow-hidden">
          {/* Speed Lines */}
          <div className="absolute inset-0 flex items-center overflow-hidden">
            <div className="w-full h-[2px] bg-zinc-800 absolute top-4 animate-[slideRight_1s_linear_infinite]" style={{ width: '40%', opacity: 0.5 }}></div>
            <div className="w-full h-[1px] bg-zinc-700 absolute top-8 animate-[slideRight_1.5s_linear_infinite]" style={{ width: '60%', left: '10%' }}></div>
            <div className="w-full h-[2px] bg-zinc-600 absolute bottom-4 animate-[slideRight_0.8s_linear_infinite]" style={{ width: '30%', left: '5%' }}></div>
          </div>
          
          {/* Car SVG */}
          <svg viewBox="0 0 100 30" className="w-full h-full fill-white relative z-10 animate-[slightPulse_2s_ease-in-out_infinite]">
            <path d="M10,25 L10,20 L15,20 L25,15 L40,15 L45,10 L65,10 L75,15 L85,15 L90,20 L90,25 Z" />
            <circle cx="20" cy="25" r="4" fill="#18181b" stroke="white" strokeWidth="1" />
            <circle cx="80" cy="25" r="4" fill="#18181b" stroke="white" strokeWidth="1" />
            <path d="M45,10 C50,5 60,5 65,10" fill="none" stroke="white" strokeWidth="1.5" />
            <rect x="5" y="18" width="5" height="2" />
            <rect x="90" y="20" width="5" height="5" />
          </svg>
        </div>

        <div className="text-zinc-400 tracking-widest text-xs uppercase mb-8">
          COGNITIVE RADIO GATEWAY
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-[2px] bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-[#7f77dd] animate-[fillBar_3s_linear_forwards]" />
        </div>
      </div>

      <div className="absolute bottom-4 right-6 text-zinc-500 text-xs">
        Powered by IBM Granite · IBM Docling
      </div>

      <style jsx>{`
        @keyframes fillBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes slideRight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes slightPulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
};

const Sidebar = ({ activeView, setActiveView }) => {
  return (
    <div className="fixed left-0 top-0 bottom-0 w-12 bg-[#09090b] border-r border-zinc-800 flex flex-col items-center py-6 z-40">
      <div className="flex-1 flex flex-col gap-8 w-full items-center">
        <button 
          onClick={() => setActiveView('command')}
          className={`relative group flex justify-center items-center w-full py-2 ${activeView === 'command' ? 'border-l-2 border-[#7f77dd]' : 'border-l-2 border-transparent'}`}
        >
          <BrainIcon active={activeView === 'command'} />
          <span className="absolute left-14 bg-zinc-800 text-white font-sans text-xs px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">COMMAND</span>
        </button>
        <button 
          onClick={() => setActiveView('lap')}
          className={`relative group flex justify-center items-center w-full py-2 ${activeView === 'lap' ? 'border-l-2 border-[#7f77dd]' : 'border-l-2 border-transparent'}`}
        >
          <ChartIcon active={activeView === 'lap'} />
          <span className="absolute left-14 bg-zinc-800 text-white font-sans text-xs px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">LAP INTELLIGENCE</span>
        </button>
        <button 
          onClick={() => setActiveView('car')}
          className={`relative group flex justify-center items-center w-full py-2 ${activeView === 'car' ? 'border-l-2 border-[#7f77dd]' : 'border-l-2 border-transparent'}`}
        >
          <CarIcon active={activeView === 'car'} />
          <span className="absolute left-14 bg-zinc-800 text-white font-sans text-xs px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">CAR SYSTEMS</span>
        </button>
      </div>
      <div className="text-zinc-600 font-mono text-[10px] tracking-wider transform -rotate-90 origin-center mb-8">
        IBM
      </div>
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('command'); // 'command', 'lap', 'car'

  return (
    <div className="w-screen h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden flex">
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      
      {!loading && (
        <>
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
          <div className="flex-1 ml-12 h-full overflow-hidden bg-zinc-950 p-4">
            {activeView === 'command' && <CommandView />}
            {activeView === 'lap' && <LapIntelligence />}
            {activeView === 'car' && <CarSystemsView />}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
