import React from 'react';
import { Seat, Booking } from '../types';
import { X, Lock, CheckCircle2, AlertOctagon, UserPlus, Trash2 } from 'lucide-react';
import { bookingDAO } from '../services/dbStore';

interface SeatDetailsModalProps {
  seat: Seat | null;
  onClose: () => void;
  onOpenBookingModal: (seat: Seat) => void;
  onRefresh: () => void;
}

export const SeatDetailsModal: React.FC<SeatDetailsModalProps> = ({
  seat,
  onClose,
  onOpenBookingModal,
  onRefresh,
}) => {
  if (!seat) return null;

  const bookings: Booking[] = bookingDAO.getBookingsForSeat(seat.id);
  const isOverbooked = seat.bookedByCustomerIds.length > 1;

  const handleCancelBooking = (bookingId: string) => {
    bookingDAO.cancelBooking(bookingId);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${
              isOverbooked
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : seat.isBooked
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {seat.id}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Seat {seat.id}</h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                  seat.category === 'VIP'
                    ? 'bg-amber-500/20 text-amber-300'
                    : seat.category === 'PREMIUM'
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {seat.category}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Row {seat.row}, Number {seat.number} • Base Price ${seat.basePrice}
            </p>
          </div>
        </div>

        {/* State Status Banner */}
        {isOverbooked ? (
          <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl space-y-1 text-xs text-rose-300">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <AlertOctagon className="w-4 h-4" />
              CRITICAL: Double Booking Race Condition Detected!
            </div>
            <p className="text-[11px] opacity-90">
              This seat has been confirmed to {seat.bookedByCustomerIds.length} different customers simultaneously due to unsynchronized TOCTOU execution.
            </p>
          </div>
        ) : seat.isLocked && !seat.isBooked ? (
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Lock actively held by customer {seat.lockedByCustomerId}</span>
          </div>
        ) : seat.isBooked ? (
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>Seat confirmed and assigned to customer.</span>
          </div>
        ) : (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Seat is currently available for booking.</span>
          </div>
        )}

        {/* Confirmed Customers / Bookings on this seat */}
        {bookings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Assigned Bookings ({bookings.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{b.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Ref: {b.bookingRef} • {b.serviceType}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-lg transition"
                    title="Cancel Booking & Refund"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {!seat.isBooked && !seat.isLocked && (
          <button
            onClick={() => {
              onClose();
              onOpenBookingModal(seat);
            }}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Book This Seat Now ($ {seat.basePrice})
          </button>
        )}
      </div>
    </div>
  );
};
