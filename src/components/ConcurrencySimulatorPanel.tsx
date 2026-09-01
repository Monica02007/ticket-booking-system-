import React, { useState } from 'react';
import { Seat, SimulationResult } from '../types';
import { ThreadTaskState, simulatorEngine } from '../services/concurrencyEngine';
import { SeatInventory } from '../services/inventory';
import { Zap, Square, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Layers, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ConcurrencySimulatorPanelProps {
  inventory: SeatInventory;
  seats: Seat[];
  onRefreshSeats: () => void;
  showId: string;
}

export const ConcurrencySimulatorPanel: React.FC<ConcurrencySimulatorPanelProps> = ({
  inventory,
  seats,
  onRefreshSeats,
  showId,
}) => {
  const [threadsCount, setThreadsCount] = useState<number>(20);
  const [targetStrategy, setTargetStrategy] = useState<'HOTSPOT_VIP' | 'ROW_RUSH' | 'RANDOM_DISTRIBUTED'>('HOTSPOT_VIP');
  const [processingDelayMs, setProcessingDelayMs] = useState<number>(80);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });
  const [threadStates, setThreadStates] = useState<ThreadTaskState[]>([]);
  const [resultsHistory, setResultsHistory] = useState<SimulationResult[]>([]);

  // Calculate target seats based on chosen strategy
  const getTargetSeats = (): string[] => {
    if (targetStrategy === 'HOTSPOT_VIP') {
      // 4 high-demand VIP seats
      return ['A1', 'A2', 'A3', 'A4'];
    } else if (targetStrategy === 'ROW_RUSH') {
      // Entire VIP + Premium Rows A & B (16 seats)
      return seats.filter((s) => s.row === 'A' || s.row === 'B').map((s) => s.id);
    } else {
      // Full stadium (all 48 seats)
      return seats.map((s) => s.id);
    }
  };

  const handleRunSimulation = async (mode: 'SAFE' | 'UNSAFE') => {
    if (isRunning) return;

    setIsRunning(true);
    setProgress({ completed: 0, total: threadsCount });
    setThreadStates([]);

    const targets = getTargetSeats();

    try {
      const result = await simulatorEngine.runSimulation(inventory, mode, {
        threadsCount,
        targetSeats: targets,
        showId,
        delayMs: processingDelayMs,
        onThreadUpdate: (tasks) => {
          setThreadStates(tasks);
          onRefreshSeats();
        },
        onProgress: (completed, total) => {
          setProgress({ completed, total });
        },
      });

      setResultsHistory((prev) => [result, ...prev.slice(0, 9)]);
      onRefreshSeats();

      if (mode === 'SAFE' && result.overbookedSeatsCount === 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsRunning(false);
      onRefreshSeats();
    }
  };

  const handleStop = () => {
    simulatorEngine.stop();
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Flash Sale Concurrency Lab</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Simulate high-volume ticket bursts to prove ReentrantLock correctness vs Unsynchronized Race Conditions
            </p>
          </div>

          {/* Action Launch Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-run-unsafe-demo"
              disabled={isRunning}
              onClick={() => handleRunSimulation('UNSAFE')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-lg shadow-rose-600/30 transition active:scale-95"
            >
              <ShieldAlert className="w-4 h-4" />
              Run Unsynchronized (Show Bug)
            </button>

            <button
              id="btn-run-safe-demo"
              disabled={isRunning}
              onClick={() => handleRunSimulation('SAFE')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              Run Synchronized (Safe Lock)
            </button>

            {isRunning && (
              <button
                id="btn-stop-simulation"
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <Square className="w-3.5 h-3.5 text-rose-400" />
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Configuration Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Thread Count Slider */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Concurrent Threads</span>
              <span className="font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold">
                {threadsCount} Threads
              </span>
            </div>
            <input
              id="slider-threads"
              type="range"
              min="5"
              max="60"
              step="5"
              value={threadsCount}
              disabled={isRunning}
              onChange={(e) => setThreadsCount(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>5 Threads</span>
              <span>20 (Normal)</span>
              <span>60 (Extreme)</span>
            </div>
          </div>

          {/* Hotspot Strategy */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-300">Target Seats Contention</label>
            <select
              id="select-contention-strategy"
              value={targetStrategy}
              disabled={isRunning}
              onChange={(e) => setTargetStrategy(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="HOTSPOT_VIP">VIP Hotspot (All threads rush A1-A4)</option>
              <option value="ROW_RUSH">Front Rows Rush (A1-A8 & B1-B8)</option>
              <option value="RANDOM_DISTRIBUTED">Distributed Rush (All 48 Stadium Seats)</option>
            </select>
            <p className="text-[10px] text-slate-500">
              {targetStrategy === 'HOTSPOT_VIP'
                ? 'High contention: Heavy race collisions expected in unsafe mode.'
                : 'Broader contention: Spreads threads across multiple seats.'}
            </p>
          </div>

          {/* Artificial Latency / Delay */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Payment Gateway Delay</span>
              <span className="font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">
                {processingDelayMs} ms
              </span>
            </div>
            <input
              id="slider-delay"
              type="range"
              min="10"
              max="200"
              step="10"
              value={processingDelayMs}
              disabled={isRunning}
              onChange={(e) => setProcessingDelayMs(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Vulnerability window during which unsynchronized threads collide.
            </p>
          </div>
        </div>

        {/* Progress Bar (When running) */}
        {isRunning && (
          <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-indigo-500/30 animate-pulse">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-indigo-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                Executing Concurrent Transactions ({progress.completed}/{progress.total})...
              </span>
              <span className="text-slate-400 font-mono">
                {Math.round((progress.completed / (progress.total || 1)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-150"
                style={{ width: `${(progress.completed / (progress.total || 1)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Worker Thread Monitor */}
      {threadStates.length > 0 && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Live Worker Thread States ({threadStates.length} Active Coroutines)
            </h3>
            <span className="text-xs text-slate-400">Real-time concurrency execution feed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
            {threadStates.map((task) => {
              let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
              let icon = <Clock className="w-3 h-3 text-slate-400" />;

              if (task.status === 'OVERBOOKED') {
                badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
                icon = <AlertTriangle className="w-3 h-3 text-rose-400" />;
              } else if (task.status === 'SUCCESS') {
                badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                icon = <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
              } else if (task.status === 'FAILED') {
                badgeColor = 'bg-slate-800/80 text-slate-400 border-slate-700';
                icon = <XCircle className="w-3 h-3 text-slate-500" />;
              } else if (task.status === 'PAYING' || task.status === 'ACQUIRING') {
                badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                icon = <Clock className="w-3 h-3 text-amber-400 animate-spin" />;
              }

              return (
                <div
                  key={task.threadId}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200">{task.threadId}</span>
                    <span className="px-1.5 py-0.5 bg-slate-900 text-slate-400 font-mono text-[10px] rounded border border-slate-800">
                      Target: {task.targetSeatId}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 truncate">{task.customer.name}</p>

                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-medium ${badgeColor}`}>
                    {icon}
                    <span className="truncate">{task.message}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Benchmark History & Results Comparison */}
      {resultsHistory.length > 0 && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Simulation Evidence & Benchmark Log
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Run ID</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Threads</th>
                  <th className="py-2.5 px-3">Target Seats</th>
                  <th className="py-2.5 px-3 text-emerald-400">Confirmed</th>
                  <th className="py-2.5 px-3 text-rose-400">Overbooked Seats</th>
                  <th className="py-2.5 px-3 text-rose-300">Duplicate Tickets</th>
                  <th className="py-2.5 px-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {resultsHistory.map((res) => (
                  <tr key={res.runId} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 text-slate-300">{res.runId}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          res.mode === 'SAFE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {res.mode === 'SAFE' ? 'SAFE (Lock)' : 'UNSAFE (Buggy)'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{res.totalThreads}</td>
                    <td className="py-2.5 px-3 text-slate-300">{res.totalTargetSeats}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{res.successfulBookings}</td>
                    <td className="py-2.5 px-3 font-bold">
                      {res.overbookedSeatsCount > 0 ? (
                        <span className="text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 animate-pulse">
                          {res.overbookedSeatsCount} SEATS
                        </span>
                      ) : (
                        <span className="text-emerald-400">0 (Zero Bug)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {res.doubleBookedTransactionsCount > 0 ? (
                        <span className="text-rose-400 font-bold">
                          +{res.doubleBookedTransactionsCount} Double Sales!
                        </span>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{res.executionTimeMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
