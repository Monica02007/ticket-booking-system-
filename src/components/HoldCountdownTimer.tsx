import React, { useEffect, useState } from 'react';
import { Timer, AlertTriangle, ShieldCheck } from 'lucide-react';

interface HoldCountdownTimerProps {
  durationSeconds?: number;
  onExpire?: () => void;
  onRelease?: () => void;
  seatCount?: number;
  className?: string;
}

export const HoldCountdownTimer: React.FC<HoldCountdownTimerProps> = ({
  durationSeconds = 600, // 10 minutes default
  onExpire,
  onRelease,
  seatCount = 1,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);

  useEffect(() => {
    setTimeLeft(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / durationSeconds) * 100));

  // Color dynamics
  let strokeColor = '#10b981'; // emerald
  let textColor = 'text-emerald-400';
  let badgeBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';

  if (timeLeft < 120) {
    strokeColor = '#ef4444'; // rose red
    textColor = 'text-rose-400 animate-pulse';
    badgeBg = 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse';
  } else if (timeLeft < 300) {
    strokeColor = '#f59e0b'; // amber
    textColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/15 border-amber-500/40 text-amber-300';
  }

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      id="seat-hold-timer-card"
      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner ${className}`}
    >
      <div className="flex items-center gap-3">
        {/* Animated Circular Progress Ring */}
        <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
          <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r={radius}
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="22"
              cy="22"
              r={radius}
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <Timer className={`w-5 h-5 absolute ${textColor}`} />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-300">
              Seat Hold Guaranteed
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeBg}`}>
              {seatCount} {seatCount === 1 ? 'Seat' : 'Seats'} Locked
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Atomic lock expires in{' '}
            <span className={`font-mono font-bold text-sm ${textColor}`}>
              {formattedTime}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {timeLeft < 120 ? (
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-rose-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Release imminent!
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> CAS Protected
          </div>
        )}

        {onRelease && (
          <button
            id="btn-release-hold-lock"
            type="button"
            onClick={onRelease}
            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            Release Hold
          </button>
        )}
      </div>
    </div>
  );
};
