import React from 'react';
import { Show } from '../types';
import { Calendar, MapPin, Ticket, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ShowBannerProps {
  show: Show;
  serviceMode: 'SAFE' | 'UNSAFE';
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  overbookedSeats: number;
}

export const ShowBanner: React.FC<ShowBannerProps> = ({
  show,
  serviceMode,
  totalSeats,
  availableSeats,
  bookedSeats,
  overbookedSeats,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 p-6 shadow-xl">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Concert Details */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3 h-3" />
              Live Concert Flash Sale
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                serviceMode === 'SAFE'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
              }`}
            >
              {serviceMode === 'SAFE' ? (
                <>
                  <ShieldCheck className="w-3 h-3" />
                  Engine: Safe ReentrantLock Active
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  Engine: Unsynchronized (Race Conditions Possible)
                </>
              )}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {show.title}
          </h1>
          <p className="text-sm font-medium text-indigo-300">{show.artist}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{show.dateTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>{show.venue}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-slate-500" />
              <span>Starting from ${show.basePrice}</span>
            </div>
          </div>
        </div>

        {/* Right: Real-time Seat Metric Indicators */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div className="text-center px-2">
            <span className="block text-xl font-bold text-white">{totalSeats}</span>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total</span>
          </div>
          <div className="text-center px-2 border-l border-slate-800">
            <span className="block text-xl font-bold text-emerald-400">{availableSeats}</span>
            <span className="text-[11px] font-medium text-emerald-500/80 uppercase tracking-wider">Available</span>
          </div>
          <div className="text-center px-2 border-l border-slate-800">
            <span className="block text-xl font-bold text-indigo-400">{bookedSeats}</span>
            <span className="text-[11px] font-medium text-indigo-400/80 uppercase tracking-wider">Booked</span>
          </div>
          <div className="text-center px-2 border-l border-slate-800 col-span-3 sm:col-span-1 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0">
            <span
              className={`block text-xl font-bold ${
                overbookedSeats > 0 ? 'text-rose-400 animate-bounce' : 'text-slate-500'
              }`}
            >
              {overbookedSeats}
            </span>
            <span
              className={`text-[11px] font-medium uppercase tracking-wider ${
                overbookedSeats > 0 ? 'text-rose-400' : 'text-slate-500'
              }`}
            >
              Overbooked
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
