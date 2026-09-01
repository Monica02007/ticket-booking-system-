import React from 'react';
import { ShieldCheck, ShieldAlert, Zap, RotateCcw, Database, FileText, Info } from 'lucide-react';

interface NavbarProps {
  activeTab: 'seatmap' | 'simulator' | 'audit' | 'database';
  setActiveTab: (tab: 'seatmap' | 'simulator' | 'audit' | 'database') => void;
  serviceMode: 'SAFE' | 'UNSAFE';
  setServiceMode: (mode: 'SAFE' | 'UNSAFE') => void;
  onReset: () => void;
  onOpenArchitectureInfo: () => void;
  overbookingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  serviceMode,
  setServiceMode,
  onReset,
  onOpenArchitectureInfo,
  overbookingCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">TicketCore</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  v1.0.0
                </span>
                {overbookingCount > 0 && (
                  <span className="animate-pulse flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    <ShieldAlert className="w-3 h-3" />
                    {overbookingCount} Overbooked!
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Flash Sale Concurrency & Locking Engine</p>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              id="nav-tab-seatmap"
              onClick={() => setActiveTab('seatmap')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'seatmap'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Interactive Seat Map
            </button>
            <button
              id="nav-tab-simulator"
              onClick={() => setActiveTab('simulator')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'simulator'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Flash Sale Simulator
            </button>
            <button
              id="nav-tab-audit"
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Audit Log
            </button>
            <button
              id="nav-tab-database"
              onClick={() => setActiveTab('database')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'database'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              JDBC / SQL Store
            </button>
          </nav>

          {/* Right Controls: Mode Toggle & Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Mode Selector */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                id="btn-mode-safe"
                onClick={() => setServiceMode('SAFE')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  serviceMode === 'SAFE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Safe Mode: ReentrantLock / Atomic CAS guarantees 0 overbooking"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Safe (Locked)</span>
              </button>
              <button
                id="btn-mode-unsafe"
                onClick={() => setServiceMode('UNSAFE')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  serviceMode === 'UNSAFE'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Unsafe Mode: Unsynchronized check-then-act causes overbooking bug"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Unsafe (Race Condition)</span>
              </button>
            </div>

            {/* Architecture Info */}
            <button
              id="btn-architecture-info"
              onClick={onOpenArchitectureInfo}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="View OOP, Concurrency & System Design Info"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Reset Inventory */}
            <button
              id="btn-reset-inventory"
              onClick={onReset}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
              title="Clear all bookings and reset seats to available state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
