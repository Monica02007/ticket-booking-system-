import React from 'react';
import { X, BookOpen, Layers, ShieldCheck, Database, Zap, Cpu } from 'lucide-react';

interface ArchitectureInfoModalProps {
  onClose: () => void;
}

export const ArchitectureInfoModal: React.FC<ArchitectureInfoModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">System Architecture & OOP / Concurrency Rubric</h2>
            <p className="text-xs text-slate-400">
              Flash sale overbooking prevention, ReentrantLock semantics, custom checked exceptions, and JDBC persistence
            </p>
          </div>
        </div>

        {/* Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Part A: OOP Domain Model */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-400">
              <Layers className="w-4 h-4" />
              <span>Part A — OOP Domain Model</span>
            </div>
            <p className="text-slate-300">
              Encapsulated domain entities with polymorphic hierarchy:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-1 font-mono text-[11px]">
              <li><strong className="text-slate-200">Seat (Abstract base)</strong>: Encapsulates state & lock handles</li>
              <li><strong className="text-slate-200">RegularSeat, PremiumSeat, VIPSeat</strong>: Polymorphic <code className="text-indigo-300">calculatePrice()</code></li>
              <li><strong className="text-slate-200">Booking, Show, Customer, Payment</strong>: Immutable audit records</li>
            </ul>
          </div>

          {/* Part B: Collection Framework */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-cyan-400">
              <Cpu className="w-4 h-4" />
              <span>Part B — Collections & Inventory</span>
            </div>
            <p className="text-slate-300">
              High-throughput concurrent data structures:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-1 font-mono text-[11px]">
              <li><strong className="text-slate-200">SeatInventory</strong>: Fine-grained mutex per seat</li>
              <li><strong className="text-slate-200">ConcurrentHashMap</strong>: Thread-safe O(1) seat lookups</li>
              <li><strong className="text-slate-200">Atomic CAS</strong>: Check-and-set atomic state guarantees</li>
            </ul>
          </div>

          {/* Part C: Concurrency Core */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Part C — Concurrency & Exception Handling</span>
            </div>
            <p className="text-slate-300">
              Proves overbooking bug elimination:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-1 font-mono text-[11px]">
              <li><strong className="text-rose-400">UnsafeBookingService</strong>: TOCTOU race bug (double allocation)</li>
              <li><strong className="text-emerald-400">SafeBookingService</strong>: ReentrantLock critical section (0 double-booking)</li>
              <li><strong className="text-slate-200">Exceptions</strong>: <code className="text-amber-300">SeatNotAvailableException</code>, <code className="text-amber-300">PaymentFailureException</code></li>
            </ul>
          </div>

          {/* Part D: JDBC Persistence */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <Database className="w-4 h-4" />
              <span>Part D — Persistence & DAO</span>
            </div>
            <p className="text-slate-300">
              Transactional data persistence layer:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-1 font-mono text-[11px]">
              <li><strong className="text-slate-200">BookingDAO</strong>: PreparedStatement queries</li>
              <li><strong className="text-slate-200">CRUD & History</strong>: Customer history queries & cancellation</li>
              <li><strong className="text-slate-200">Audit Logging</strong>: Streaming transactions to <code className="text-amber-300">audit.log</code></li>
            </ul>
          </div>
        </div>

        {/* Concurrency Flow Diagram */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
          <div className="text-slate-300 font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Race Condition vs. Safe Locking Flow</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
{`[UNSAFE MODE]
Thread 1 (Read: Available) ───► [Sleep/Payment Gateway] ───► [Confirm Booking] ──► Confirmed!
Thread 2 (Read: Available) ───► [Sleep/Payment Gateway] ───► [Confirm Booking] ──► Confirmed! (BUG: OVERBOOKED!)

[SAFE MODE]
Thread 1 ───► [Acquire ReentrantLock(Seat A1)] ──► Lock Granted ──► [Payment] ──► [Commit] ──► [Release Lock]
Thread 2 ───► [Acquire ReentrantLock(Seat A1)] ──► Lock REJECTED (SeatNotAvailableException) ──► Safe 0 Error`}
          </div>
        </div>
      </div>
    </div>
  );
};
