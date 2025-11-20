import React, { useState, useCallback } from 'react';
import { FuelInputCard } from './components/FuelInputCard';
import { AnalyticsCard } from './components/AnalyticsCard';
import { Fuel, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Function to trigger a refresh of the analytics card after a successful submission
  const handleSubmissionSuccess = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen relative selection:bg-cyan-500/30 selection:text-cyan-100">
      
      {/* Background Ambiance (Liquid Blobs) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute top-[20%] right-[-5%] w-[30rem] h-[30rem] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[35rem] h-[35rem] bg-cyan-600/10 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 pb-20 space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-4 md:mb-10">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <Fuel className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-400 tracking-tight">
                FuelTrack<span className="text-cyan-400">.Pro</span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base font-light tracking-wide">
                Tableau de bord énergétique
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-medium text-cyan-300/80 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <Zap className="w-3 h-3" /> SYSTEME OPÉRATIONNEL
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input Form */}
          {/* Mobile: Sticky top to stay behind while scrolling. Desktop: Sticky for utility. */}
          <div className="lg:col-span-4 sticky top-6 lg:top-8 z-0">
            <FuelInputCard onSuccess={handleSubmissionSuccess} />
          </div>

          {/* Right Column: Analytics & Graphs */}
          {/* Mobile: Relative & Higher Z-Index + Background to scroll OVER the input form. */}
          <div className="lg:col-span-8 space-y-8 relative z-10 mt-4 lg:mt-0">
             {/* Background wrapper for mobile parallax effect */}
            <div className="bg-black/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] -mx-4 px-4 pt-8 pb-8 rounded-t-[2rem] lg:bg-transparent lg:backdrop-blur-none lg:border-t-0 lg:shadow-none lg:mx-0 lg:px-0 lg:py-0 lg:rounded-none transition-all">
                <AnalyticsCard refreshTrigger={refreshTrigger} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;