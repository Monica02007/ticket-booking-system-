import React from 'react';
import { Seat } from '../types';
import { Crown, Star, UserCheck, AlertOctagon, Lock } from 'lucide-react';

interface SeatMapGridProps {
  seats: Seat[];
  onSelectSeat: (seat: Seat) => void;
  selectedSeatId?: string;
}

export const SeatMapGrid: React.FC<SeatMapGridProps> = ({
  seats,
  onSelectSeat,
  selectedSeatId,
}) => {
  // Group seats by row
  const rowsMap = new Map<string, Seat[]>();
  seats.forEach((seat) => {
    const list = rowsMap.get(seat.row) || [];
    list.push(seat);
    rowsMap.set(seat.row, list);
  });

  const rowLetters = Array.from(rowsMap.keys()).sort();

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Header & Stage Graphic */}
      <div className="flex flex-col items-center space-y-3">
        <div className="w-full max-w-2xl py-2 px-6 rounded-xl bg-gradient-to-r from-indigo-950 via-indigo-800 to-indigo-950 border border-indigo-500/40 text-center shadow-lg shadow-indigo-950/50">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-200">
            ★ STAGE / PERFORMANCE PLATFORM ★
          </span>
        </div>
        <p className="text-xs text-slate-400">Click on any seat to book as customer or inspect transaction state</p>
      </div>

      {/* Seating Grid */}
      <div className="overflow-x-auto py-2">
        <div className="min-w-[640px] max-w-3xl mx-auto space-y-3">
          {rowLetters.map((rowLetter) => {
            const rowSeats = rowsMap.get(rowLetter) || [];
            const category = rowSeats[0]?.category || 'REGULAR';

            return (
              <div key={rowLetter} className="flex items-center gap-3">
                {/* Row Label */}
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-slate-400">
                  {rowLetter}
                </div>

                {/* Seats in this row */}
                <div className="flex-1 grid grid-cols-8 gap-2 sm:gap-3">
                  {rowSeats.map((seat) => {
                    const isSelected = selectedSeatId === seat.id;
                    const isOverbooked = seat.bookedByCustomerIds.length > 1;
                    const isBooked = seat.isBooked;
                    const isLocked = seat.isLocked && !isBooked;

                    let bgStyle = 'bg-emerald-600/20 border-emerald-500/40 hover:bg-emerald-600/40 text-emerald-300';
                    let statusLabel = 'Available';

                    if (isOverbooked) {
                      bgStyle = 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-600/40';
                      statusLabel = `OVERBOOKED (${seat.bookedByCustomerIds.length}x)`;
                    } else if (isBooked) {
                      bgStyle = 'bg-slate-800/90 border-slate-700 text-slate-400 hover:border-slate-500';
                      statusLabel = 'Booked';
                    } else if (isLocked) {
                      bgStyle = 'bg-amber-500/30 border-amber-400/80 text-amber-300 animate-pulse';
                      statusLabel = 'Holding Lock';
                    }

                    if (isSelected) {
                      bgStyle += ' ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900';
                    }

                    return (
                      <button
                        key={seat.id}
                        id={`seat-${seat.id}`}
                        onClick={() => onSelectSeat(seat)}
                        className={`relative group h-12 rounded-xl border flex flex-col items-center justify-center p-1 transition-all duration-150 active:scale-95 ${bgStyle}`}
                        title={`Seat ${seat.id} [${seat.category}] - ${statusLabel}`}
                      >
                        {/* Category Icon */}
                        <div className="flex items-center gap-0.5 text-[10px] font-bold">
                          {seat.category === 'VIP' && <Crown className="w-3 h-3 text-amber-400" />}
                          {seat.category === 'PREMIUM' && <Star className="w-2.5 h-2.5 text-indigo-300" />}
                          <span>{seat.id}</span>
                        </div>

                        {/* State icon / price */}
                        <div className="text-[10px] leading-none mt-0.5">
                          {isOverbooked ? (
                            <span className="flex items-center gap-0.5 font-bold text-[9px] text-white">
                              <AlertOctagon className="w-2.5 h-2.5" />
                              {seat.bookedByCustomerIds.length}x
                            </span>
                          ) : isLocked ? (
                            <span className="flex items-center gap-0.5 text-[9px] text-amber-300">
                              <Lock className="w-2.5 h-2.5" /> Lock
                            </span>
                          ) : isBooked ? (
                            <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                              <UserCheck className="w-2.5 h-2.5" /> Sold
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-300">
                              ${seat.basePrice}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Category Badge for Row */}
                <div className="hidden sm:flex w-20 justify-end">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      category === 'VIP'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : category === 'PREMIUM'
                        ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Seat Types */}
      <div className="border-t border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/60" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-500/40 border border-amber-400 animate-pulse" />
            <span>Lock Held (In-Flight)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700" />
            <span>Booked (1 Owner)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-600 border border-rose-400 animate-pulse" />
            <span className="text-rose-400 font-bold">Overbooked (Double-Booked Race Bug)</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-400" /> VIP Row (2.5x)
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-indigo-300" /> Premium (1.5x)
          </span>
        </div>
      </div>
    </div>
  );
};
