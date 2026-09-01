import React, { useState } from 'react';
import { Booking, Show } from '../types';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Smartphone,
  Share2,
  Sparkles,
  Ticket,
  ChevronRight,
  Info
} from 'lucide-react';

interface TicketPassModalProps {
  isOpen?: boolean;
  onClose: () => void;
  booking: Booking;
  show: Show;
}

export const TicketPassModal: React.FC<TicketPassModalProps> = ({
  isOpen = true,
  onClose,
  booking,
  show,
}) => {
  const [walletType, setWalletType] = useState<'APPLE' | 'GOOGLE' | null>(null);
  const [walletSaved, setWalletSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const seatList = booking.seatIds && booking.seatIds.length > 0 ? booking.seatIds : [booking.seatId];
  const gate = booking.gateNumber || 'Gate A (Fast-Track)';
  const orderDate = new Date(booking.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleSaveToWallet = (type: 'APPLE' | 'GOOGLE') => {
    setWalletType(type);
    setWalletSaved(true);
    setTimeout(() => {
      // Keep state for smooth feedback
    }, 1500);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(
      `TicketCore Pass for ${show.title} - Ref: ${booking.bookingRef} | Seats: ${seatList.join(', ')}`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      id="ticket-pass-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        id="ticket-pass-modal-content"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Official Digital Ticket Pass
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Verified Valid
                </span>
              </h2>
              <p className="text-xs text-slate-400">Ref: {booking.bookingRef} • Ready for Door Scan</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-print-ticket"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Print / Save as PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              id="btn-close-ticket-modal"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* THE TICKET PASS CARD */}
          <div
            id="printable-ticket-card"
            className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 rounded-2xl border border-slate-700 shadow-xl overflow-hidden print:border-black print:text-black print:bg-white"
          >
            {/* Top Event Banner Slice */}
            <div className="relative h-32 sm:h-36 overflow-hidden">
              <img
                src={show.bannerImage}
                alt={show.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover brightness-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

              <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {booking.seatCategory} PASS
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-300 bg-black/60 px-2 py-1 rounded-md">
                  {booking.bookingRef}
                </span>
              </div>

              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight">
                  {show.title}
                </h3>
                <p className="text-xs text-indigo-300 font-medium">{show.artist}</p>
              </div>
            </div>

            {/* Event Key Logistics */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-400" /> Date & Time
                  </span>
                  <span className="font-semibold text-slate-200 block mt-0.5">
                    {show.dateTime}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" /> Venue & City
                  </span>
                  <span className="font-semibold text-slate-200 block mt-0.5 truncate">
                    {show.venue}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" /> Gate Entrance
                  </span>
                  <span className="font-semibold text-emerald-300 block mt-0.5">
                    {gate}
                  </span>
                </div>
              </div>

              {/* Seating Assignment & Customer Details */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
                    Reserved Seating ({seatList.length} {seatList.length === 1 ? 'Ticket' : 'Tickets'})
                  </span>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {seatList.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-lg bg-indigo-600/30 border border-indigo-400 text-indigo-100 font-mono font-black text-base shadow-sm"
                      >
                        Seat {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Ticket Holder
                  </span>
                  <span className="text-sm font-bold text-slate-100 block">
                    {booking.customerName}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {booking.customerEmail}
                  </span>
                </div>
              </div>

              {/* Add-Ons / Perks Itemization if present */}
              {booking.addOns && booking.addOns.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Included Add-On Perks
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {booking.addOns.map((add) => (
                      <span
                        key={add.id}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {add.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dotted Tear Line with Cutout Notches */}
              <div className="relative py-2 flex items-center">
                <div className="absolute -left-8 w-6 h-6 rounded-full bg-slate-900 border border-slate-700" />
                <div className="w-full border-b-2 border-dashed border-slate-700" />
                <div className="absolute -right-8 w-6 h-6 rounded-full bg-slate-900 border border-slate-700" />
              </div>

              {/* Barcode & Holographic Verification Module */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                {/* Simulated SVG Barcode */}
                <div className="flex flex-col items-center sm:items-start">
                  <div className="flex items-center h-12 gap-[3px] bg-white p-2 rounded-md shadow-inner">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 3, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2].map(
                      (w, i) => (
                        <div
                          key={i}
                          className="bg-black h-full"
                          style={{ width: `${w}px` }}
                        />
                      )
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 tracking-widest">
                    * {booking.bookingRef}-{booking.customerId.slice(-4)} *
                  </span>
                </div>

                {/* QR Code Module & Security Chip */}
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white rounded-xl shadow-md">
                    {/* Render standard crisp QR matrix pattern */}
                    <svg className="w-16 h-16" viewBox="0 0 33 33" fill="none">
                      <rect width="33" height="33" fill="white" />
                      {/* Top-Left Finder */}
                      <rect x="2" y="2" width="7" height="7" fill="black" />
                      <rect x="3" y="3" width="5" height="5" fill="white" />
                      <rect x="4" y="4" width="3" height="3" fill="black" />
                      {/* Top-Right Finder */}
                      <rect x="24" y="2" width="7" height="7" fill="black" />
                      <rect x="25" y="3" width="5" height="5" fill="white" />
                      <rect x="26" y="4" width="3" height="3" fill="black" />
                      {/* Bottom-Left Finder */}
                      <rect x="2" y="24" width="7" height="7" fill="black" />
                      <rect x="3" y="25" width="5" height="5" fill="white" />
                      <rect x="4" y="26" width="3" height="3" fill="black" />
                      {/* Data dots */}
                      <rect x="11" y="4" width="2" height="2" fill="black" />
                      <rect x="15" y="4" width="2" height="2" fill="black" />
                      <rect x="19" y="4" width="2" height="2" fill="black" />
                      <rect x="11" y="11" width="3" height="3" fill="black" />
                      <rect x="16" y="10" width="2" height="4" fill="black" />
                      <rect x="20" y="11" width="3" height="2" fill="black" />
                      <rect x="11" y="16" width="4" height="2" fill="black" />
                      <rect x="17" y="16" width="3" height="3" fill="black" />
                      <rect x="22" y="16" width="2" height="2" fill="black" />
                      <rect x="26" y="16" width="4" height="4" fill="black" />
                      <rect x="11" y="22" width="2" height="5" fill="black" />
                      <rect x="15" y="24" width="4" height="2" fill="black" />
                      <rect x="21" y="22" width="3" height="3" fill="black" />
                      <rect x="26" y="25" width="4" height="4" fill="black" />
                      <rect x="16" y="28" width="3" height="2" fill="black" />
                    </svg>
                  </div>

                  {/* Security Hologram Badge */}
                  <div className="text-left space-y-1">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-teal-500/20 border border-amber-400/40 text-[9px] font-bold text-amber-300">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      SECURE PASS
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      ACID Locked
                    </p>
                    <p className="text-[9px] text-slate-500">
                      Issued: {orderDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* WALLET INTEGRATION ACTIONS */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-400" /> Add to Mobile Wallet & Storage
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Apple Wallet Button */}
              <button
                id="btn-apple-wallet"
                onClick={() => handleSaveToWallet('APPLE')}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  walletType === 'APPLE' && walletSaved
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                    : 'bg-black hover:bg-zinc-900 border-zinc-700 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold text-lg">
                    
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block">
                      {walletType === 'APPLE' && walletSaved ? 'Pass Installed' : 'Apple Wallet'}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      Add .pkpass with Live Lock screen
                    </span>
                  </div>
                </div>
                {walletType === 'APPLE' && walletSaved ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                )}
              </button>

              {/* Google Wallet Button */}
              <button
                id="btn-google-wallet"
                onClick={() => handleSaveToWallet('GOOGLE')}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  walletType === 'GOOGLE' && walletSaved
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300">
                    G
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block">
                      {walletType === 'GOOGLE' && walletSaved ? 'Pass Linked' : 'Google Wallet'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Save ticket to Google Pay
                    </span>
                  </div>
                </div>
                {walletType === 'GOOGLE' && walletSaved ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>

            {walletSaved && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  Digital Pass successfully bundled for {walletType === 'APPLE' ? 'Apple Wallet' : 'Google Wallet'}! Geofence notifications will alert you at {show.venue}.
                </span>
              </div>
            )}
          </div>

          {/* Quick Utility Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                id="btn-share-ticket"
                onClick={handleShare}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copiedLink ? 'Copied to Clipboard!' : 'Share Pass'}
              </button>
              <button
                id="btn-download-pdf"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-md shadow-indigo-600/30"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF / Print
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-500" /> Non-transferable once scanned at venue door
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
