import React, { useState } from 'react';
import { Seat } from '../types';
import {
  Crown,
  Star,
  UserCheck,
  AlertOctagon,
  Lock,
  Eye,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  RotateCcw,
  CheckCircle
} from 'lucide-react';

interface SeatMapGridProps {
  seats: Seat[];
  onSelectSeat?: (seat: Seat) => void;
  onCheckoutSeats?: (seats: Seat[]) => void;
  selectedSeatIds?: string[];
  onToggleSeatSelect?: (seat: Seat) => void;
  onClearSelectedSeats?: () => void;
}

export const SeatMapGrid: React.FC<SeatMapGridProps> = ({
  seats,
  onSelectSeat,
  onCheckoutSeats,
  selectedSeatIds = [],
  onToggleSeatSelect,
  onClearSelectedSeats,
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [viewMode, setViewMode] = useState<'AMPHITHEATER' | 'COMPACT'>('AMPHITHEATER');

  // Group seats by row
  const rowsMap = new Map<string, Seat[]>();
  seats.forEach((seat) => {
    const list = rowsMap.get(seat.row) || [];
    list.push(seat);
    rowsMap.set(seat.row, list);
  });

  const rowLetters = Array.from(rowsMap.keys()).sort();

  // Selected seats objects
  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalBasketPrice = selectedSeats.reduce((acc, s) => acc + s.basePrice, 0);

  const handleSeatClick = (seat: Seat) => {
    if (onToggleSeatSelect) {
      onToggleSeatSelect(seat);
    } else if (onSelectSeat) {
      onSelectSeat(seat);
    }
  };

  return (
    <div
      id="amphitheater-venue-container"
      className="relative bg-slate-900/95 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-8 overflow-hidden"
    >
      {/* Top Background Atmospheric Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-gradient-to-b from-indigo-500/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* STAGE & VENUE CONTROLS HEADER */}
      <div className="flex flex-col items-center space-y-4 relative z-10">
        <div className="flex items-center justify-between w-full max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-400 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Amphitheater Seating Engine
            </span>
          </div>

          {/* Layout Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('AMPHITHEATER')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                viewMode === 'AMPHITHEATER'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Curved Amphitheater
            </button>
            <button
              onClick={() => setViewMode('COMPACT')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                viewMode === 'COMPACT'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Grid View
            </button>
          </div>
        </div>

        {/* GLOWING CURVED STAGE SCREEN */}
        <div className="relative w-full max-w-2xl text-center">
          {/* Spotlight beams */}
          <div className="absolute -top-6 left-1/4 w-1/2 h-20 bg-indigo-500/20 blur-2xl pointer-events-none rounded-full" />

          {/* Curved Stage Graphic */}
          <div className="relative py-3.5 px-8 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-900/80 to-slate-950 border border-indigo-500/50 shadow-xl shadow-indigo-950/80 overflow-hidden">
            {/* Stage edge lighting line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />

            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-cyan-200 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]">
                ★ MAIN STAGE / PERFORMANCE AREA ★
              </span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <span className="text-[10px] text-indigo-300/80 font-mono block mt-0.5">
              4K Acoustic Center Sound System • Direct Sightline Field
            </span>
          </div>

          <div className="flex justify-center items-center gap-6 mt-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Orchestra Tier A
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Mezzanine Rows B-C
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Grand Balcony Rows D-F
            </span>
          </div>
        </div>
      </div>

      {/* SEAT MAP ARCHITECTURE CANVAS */}
      <div className="relative overflow-x-auto py-4 flex flex-col items-center">
        <div className="min-w-[660px] max-w-4xl w-full mx-auto space-y-4">
          {rowLetters.map((rowLetter, rIndex) => {
            const rowSeats = rowsMap.get(rowLetter) || [];
            const category = rowSeats[0]?.category || 'REGULAR';
            const totalSeatsInRow = rowSeats.length;

            return (
              <div
                key={rowLetter}
                className="flex items-center justify-center gap-3 relative"
              >
                {/* Row Indicator Left */}
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-xl border text-xs font-black shadow-sm ${
                    category === 'VIP'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : category === 'PREMIUM'
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {rowLetter}
                </div>

                {/* Curved or Grid Row of Seats */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                  {rowSeats.map((seat, colIndex) => {
                    const isSelected = selectedSeatIds.includes(seat.id);
                    const isOverbooked = seat.bookedByCustomerIds.length > 1;
                    const isBooked = seat.isBooked;
                    const isLocked = seat.isLocked && !isBooked;

                    // Amphitheater curvature transform
                    let transformStyle = '';
                    if (viewMode === 'AMPHITHEATER') {
                      const centerOffset = colIndex - (totalSeatsInRow - 1) / 2;
                      const yOffset = Math.abs(centerOffset) * (rIndex === 0 ? 1.8 : 2.4);
                      const rotation = centerOffset * 2.2; // slight angle towards stage center
                      transformStyle = `translateY(${yOffset}px) rotate(${rotation}deg)`;
                    }

                    // Default styling
                    let bgStyle =
                      'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/40 text-emerald-200 hover:border-emerald-400 hover:scale-105';
                    let statusBadge = 'Available';

                    if (isOverbooked) {
                      bgStyle =
                        'bg-rose-600 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-600/50 hover:bg-rose-500';
                      statusBadge = `OVERBOOKED (${seat.bookedByCustomerIds.length}x)`;
                    } else if (isBooked) {
                      bgStyle =
                        'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500';
                      statusBadge = 'Booked';
                    } else if (isLocked) {
                      bgStyle =
                        'bg-amber-500/30 border-amber-400 text-amber-300 animate-pulse hover:border-amber-300';
                      statusBadge = 'Holding Lock';
                    }

                    if (isSelected) {
                      bgStyle =
                        'bg-indigo-600 border-indigo-300 text-white ring-4 ring-indigo-500/50 scale-110 shadow-lg shadow-indigo-600/50 z-20';
                    }

                    return (
                      <div
                        key={seat.id}
                        className="relative"
                        style={{ transform: transformStyle }}
                      >
                        <button
                          id={`seat-${seat.id}`}
                          onClick={() => handleSeatClick(seat)}
                          onMouseEnter={() => setHoveredSeat(seat)}
                          onMouseLeave={() => setHoveredSeat(null)}
                          className={`relative w-12 sm:w-14 h-12 rounded-xl border flex flex-col items-center justify-center p-1 transition-all duration-200 active:scale-95 shadow-md ${bgStyle}`}
                          title={`Seat ${seat.id} (${seat.category}): ${statusBadge}`}
                        >
                          {/* Seat Header / Tier */}
                          <div className="flex items-center gap-0.5 text-[10px] font-black">
                            {seat.category === 'VIP' && (
                              <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            )}
                            {seat.category === 'PREMIUM' && (
                              <Star className="w-2.5 h-2.5 text-indigo-300 flex-shrink-0" />
                            )}
                            <span>{seat.id}</span>
                          </div>

                          {/* Price or State label */}
                          <div className="text-[10px] leading-tight mt-0.5">
                            {isOverbooked ? (
                              <span className="flex items-center gap-0.5 font-bold text-[9px] text-white">
                                <AlertOctagon className="w-2.5 h-2.5" />
                                {seat.bookedByCustomerIds.length}x
                              </span>
                            ) : isLocked ? (
                              <span className="flex items-center gap-0.5 text-[9px] text-amber-300 font-bold">
                                <Lock className="w-2.5 h-2.5" /> Lock
                              </span>
                            ) : isBooked ? (
                              <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                                <UserCheck className="w-2.5 h-2.5" /> Sold
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] font-bold ${
                                  isSelected ? 'text-white' : 'text-emerald-300'
                                }`}
                              >
                                ${seat.basePrice}
                              </span>
                            )}
                          </div>

                          {/* Selected check overlay */}
                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-indigo-400 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                              ✓
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Row Indicator Right */}
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-xl border text-xs font-black shadow-sm ${
                    category === 'VIP'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : category === 'PREMIUM'
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {rowLetter}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INTERACTIVE HOVER PREVIEW TOOLTIP CARD */}
      {hoveredSeat && (
        <div
          id="seat-hover-preview-card"
          className="p-4 rounded-2xl bg-slate-950/95 border border-indigo-500/40 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border font-black text-base ${
                hoveredSeat.category === 'VIP'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : hoveredSeat.category === 'PREMIUM'
                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                  : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
              }`}
            >
              {hoveredSeat.id}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">
                  Seat {hoveredSeat.id} • {hoveredSeat.sectionName || `${hoveredSeat.category} Tier`}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    hoveredSeat.isBooked
                      ? 'bg-slate-800 text-slate-400'
                      : hoveredSeat.isLocked
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {hoveredSeat.isBooked
                    ? 'Sold Out'
                    : hoveredSeat.isLocked
                    ? 'Lock In-Flight'
                    : 'Available for Lock'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-300">
                <span className="flex items-center gap-1 text-cyan-300 font-medium">
                  <Eye className="w-3.5 h-3.5" />
                  {hoveredSeat.viewAngleRating || 'Direct Unobstructed Sightline'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  ${hoveredSeat.basePrice}
                </span>
              </div>
            </div>
          </div>

          {/* Perks list */}
          {hoveredSeat.perks && hoveredSeat.perks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {hoveredSeat.perks.map((perk, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  {perk}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DOCKED MULTI-SEAT SELECTION CART BASKET */}
      {selectedSeats.length > 0 && (
        <div
          id="multi-seat-cart-basket"
          className="sticky bottom-0 z-30 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-2 border-indigo-500/60 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/40">
              <ShoppingBag className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">
                  {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat Selected' : 'Seats Selected'}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Total: ${totalBasketPrice}
                </span>
              </div>

              {/* Badges of selected seats */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {selectedSeats.map((s) => (
                  <span
                    key={s.id}
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-600/30 border border-indigo-400 text-indigo-200"
                  >
                    {s.id} (${s.basePrice})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {onClearSelectedSeats && (
              <button
                id="btn-clear-seat-selection"
                onClick={onClearSelectedSeats}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>
            )}

            {onCheckoutSeats && (
              <button
                id="btn-proceed-multi-checkout"
                onClick={() => onCheckoutSeats(selectedSeats)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all"
              >
                <span>Proceed to Checkout ({selectedSeats.length} Tickets)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* LEGEND & METRICS */}
      <div className="border-t border-slate-800/80 pt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/60" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-indigo-600 border border-indigo-400" />
            <span>Selected in Cart</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-500/40 border border-amber-400 animate-pulse" />
            <span>Lock Held (In-Flight)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-600 border border-rose-400 animate-pulse" />
            <span className="text-rose-400 font-bold">Race Overbooking Anomaly</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-amber-400" /> Orchestra VIP Tier
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-indigo-300" /> Mezzanine Premium
          </span>
        </div>
      </div>
    </div>
  );
};
