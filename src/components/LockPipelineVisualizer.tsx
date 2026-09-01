import React from 'react';
import { SimulationResult } from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ArrowRight
} from 'lucide-react';

interface LockPipelineVisualizerProps {
  serviceMode: 'SAFE' | 'UNSAFE';
  latestResult: SimulationResult | null;
  isRunning: boolean;
  totalSafeBookings: number;
  totalRaceOverbookings: number;
}

export const LockPipelineVisualizer: React.FC<LockPipelineVisualizerProps> = ({
  serviceMode,
  latestResult,
  isRunning,
  totalRaceOverbookings,
}) => {
  const isSafe = serviceMode === 'SAFE';

  // Metrics extraction
  const avgLatency = latestResult?.avgLockLatencyMs || (isSafe ? 142 : 88);
  const p99Latency = latestResult?.p99LatencyMs || (isSafe ? 260 : 190);
  const throughputRps = latestResult?.throughputRps || (isRunning ? 48 : 0);

  const pipelineStages = [
    {
      step: 1,
      title: 'Incoming Thread Burst',
      desc: 'N concurrent HTTP requests stream into seat reservation controller',
      icon: Cpu,
      color: 'indigo',
    },
    {
      step: 2,
      title: isSafe ? 'ReentrantLock Acquisition' : 'Unsynchronized Read',
      desc: isSafe
        ? 'Atomic Mutex Lock acquired on Seat ID hash; blocks competing threads'
        : 'Threads read seat status simultaneously without synchronization lock',
      icon: isSafe ? Lock : Unlock,
      color: isSafe ? 'emerald' : 'rose',
    },
    {
      step: 3,
      title: isSafe ? 'CAS Double-Check Verification' : 'Dirty Read State',
      desc: isSafe
        ? 'TOCTOU verified: ensures seat is still free after acquiring lock'
        : 'All threads evaluate isBooked=false concurrently (Time-of-Check flaw)',
      icon: isSafe ? ShieldCheck : ShieldAlert,
      color: isSafe ? 'emerald' : 'rose',
    },
    {
      step: 4,
      title: 'Payment Gateway Authorization',
      desc: 'Simulated 100-300ms external payment settlement latency',
      icon: Zap,
      color: 'amber',
    },
    {
      step: 5,
      title: isSafe ? 'Atomic Commit & Lock Release' : 'Blind Overwrite (Race)',
      desc: isSafe
        ? 'Seat marked booked; Mutex lock safely released; 1 winner, losers rejected'
        : 'Multiple threads write their customer ID into same seat (Overbooked!)',
      icon: isSafe ? CheckCircle2 : AlertTriangle,
      color: isSafe ? 'emerald' : 'rose',
    },
  ];

  return (
    <div
      id="visual-concurrency-pipeline"
      className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-6 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-2xl border ${
              isSafe
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <Activity className={`w-6 h-6 ${isRunning ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">
                Visual Concurrency & Lock Pipeline Architecture
              </h3>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  isSafe
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {isSafe ? 'Pessimistic Locking (Safe)' : 'No Synchronization (Unsafe)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live inspection of thread contention, critical sections, and atomic CAS resolution
            </p>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRunning ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span className="text-slate-300 font-mono">
              {isRunning ? 'SIMULATION IN FLIGHT' : 'PIPELINE READY'}
            </span>
          </div>
        </div>
      </div>

      {/* 5-STAGE ANIMATED PIPELINE */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {pipelineStages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.step}
              className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                isRunning
                  ? 'bg-slate-950/90 border-indigo-500/40 ring-1 ring-indigo-500/20 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    STAGE 0{stage.step}
                  </span>
                  <div
                    className={`p-1.5 rounded-lg ${
                      stage.color === 'emerald'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : stage.color === 'rose'
                        ? 'bg-rose-500/15 text-rose-400'
                        : stage.color === 'amber'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-indigo-500/15 text-indigo-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-200 leading-snug">
                  {stage.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {stage.desc}
                </p>
              </div>

              {/* Progress connector indicator */}
              {idx < 4 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* REAL-TIME TELEMETRY METRICS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Average Latency
          </span>
          <div className="text-lg font-black font-mono text-white mt-1">
            {avgLatency} ms
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Simulated DB & Gateway</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            P99 Tail Latency
          </span>
          <div className="text-lg font-black font-mono text-indigo-400 mt-1">
            {p99Latency} ms
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Worst-case queue depth</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Throughput (RPS)
          </span>
          <div className="text-lg font-black font-mono text-emerald-400 mt-1">
            {throughputRps} req/s
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Parallel transactions</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Race Overbookings
          </span>
          <div
            className={`text-lg font-black font-mono mt-1 ${
              totalRaceOverbookings > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {totalRaceOverbookings}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {totalRaceOverbookings > 0 ? 'Data Inconsistency!' : 'Zero Anomaly'}
          </span>
        </div>
      </div>
    </div>
  );
};
