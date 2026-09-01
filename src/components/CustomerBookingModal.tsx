import React, { useState } from 'react';
import { Seat, Customer, Booking, AddOnItem, Show } from '../types';
import { SafeBookingService, UnsafeBookingService } from '../services/bookingServices';
import { SeatInventory } from '../services/inventory';
import { HoldCountdownTimer } from './HoldCountdownTimer';
import {
  Ticket,
  X,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  Smartphone,
  Landmark,
  ArrowLeft,
  ArrowRight,
  QrCode,
  Lock,
  Check,
  User,
  Mail,
  Car,
  Shirt,
  Wine,
  Shield,
  Tag,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomerBookingModalProps {
  seat?: Seat | null;
  seats?: Seat[];
  onClose: () => void;
  inventory: SeatInventory;
  serviceMode: 'SAFE' | 'UNSAFE';
  showId: string;
  currentShow?: Show;
  onBookingSuccess: (booking: Booking) => void;
  onViewTicketPass?: (booking: Booking) => void;
}

type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'NET_BANKING';

const AVAILABLE_ADD_ONS: AddOnItem[] = [
  {
    id: 'addon-parking',
    name: 'Priority VIP Parking Pass',
    price: 25,
    description: 'Reserved parking spot directly adjacent to venue Entrance A.',
    iconName: 'car',
  },
  {
    id: 'addon-tshirt',
    name: 'Official Commemorative Tour T-Shirt',
    price: 35,
    description: 'Premium heavyweight cotton tour merch. Voucher redeemed at merch desk.',
    iconName: 'shirt',
  },
  {
    id: 'addon-lounge',
    name: 'All-Access VIP Lounge & Bar Pass',
    price: 45,
    description: 'Complimentary champagne welcome flute, artisan hors d\'oeuvres & private restrooms.',
    iconName: 'wine',
  },
  {
    id: 'addon-protection',
    name: '100% Refund Ticket Protection',
    price: 9,
    description: 'Guaranteed 100% reimbursement if cancelled up to 2 hours prior to showtime.',
    iconName: 'shield',
  },
];

export const CustomerBookingModal: React.FC<CustomerBookingModalProps> = ({
  seat,
  seats,
  onClose,
  inventory,
  serviceMode,
  showId,
  onBookingSuccess,
  onViewTicketPass,
}) => {
  // Normalize seats list (supports multi-seat basket or single seat)
  const targetSeats: Seat[] = seats && seats.length > 0 ? seats : seat ? [seat] : [];
  const seatIds = targetSeats.map((s) => s.id);

  // Stepper: 1 = Attendee & Add-ons, 2 = Promo & Payment Method, 3 = Confirmed
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Attendee Info
  const [customerName, setCustomerName] = useState<string>('Alex Morgan');
  const [customerEmail, setCustomerEmail] = useState<string>('alex.m@example.com');
  const [customerPhone, setCustomerPhone] = useState<string>('+1 (555) 234-5678');
  const [step1Errors, setStep1Errors] = useState<{ name?: string; email?: string }>({});

  // Add-Ons Selection
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>(['addon-protection']);

  // Promo Code Engine
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Payment Method Selection
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CREDIT_CARD');

  // Credit Card Form
  const [ccName, setCcName] = useState<string>('Alex Morgan');
  const [ccNumber, setCcNumber] = useState<string>('4532 8921 4321 8892');
  const [ccExpiry, setCcExpiry] = useState<string>('12/28');
  const [ccCvv, setCcCvv] = useState<string>('384');
  const [ccErrors, setCcErrors] = useState<{ name?: string; number?: string; expiry?: string; cvv?: string }>({});

  // Debit Card Form
  const [dcName, setDcName] = useState<string>('Alex Morgan');
  const [dcNumber, setDcNumber] = useState<string>('5241 6789 1234 5678');
  const [dcExpiry, setDcExpiry] = useState<string>('08/29');
  const [dcCvv, setDcCvv] = useState<string>('712');
  const [dcNetwork, setDcNetwork] = useState<string>('Visa Debit');
  const [dcErrors, setDcErrors] = useState<{ name?: string; number?: string; expiry?: string; cvv?: string }>({});

  // UPI Form
  const [upiId, setUpiId] = useState<string>('alex.morgan@oksbi');
  const [upiMode, setUpiMode] = useState<'VPA' | 'QR'>('VPA');
  const [upiErrors, setUpiErrors] = useState<{ upiId?: string }>({});

  // Net Banking Form
  const [selectedBank, setSelectedBank] = useState<string>('Chase Bank');

  // Processing & State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  if (targetSeats.length === 0) return null;

  // Calculation Math
  const baseTicketTotal = targetSeats.reduce((acc, s) => acc + s.basePrice, 0);
  const selectedAddOns = AVAILABLE_ADD_ONS.filter((item) => selectedAddOnIds.includes(item.id));
  const addOnsTotal = selectedAddOns.reduce((acc, item) => acc + item.price, 0);
  const discountVal = appliedPromo ? appliedPromo.discountAmount : 0;
  const finalPayable = Math.max(0, baseTicketTotal + addOnsTotal - discountVal);

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleApplyPromo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPromoError(null);
    const code = promoCodeInput.trim().toUpperCase();

    if (!code) {
      setPromoError('Please enter a coupon code.');
      return;
    }

    if (code === 'EARLYBIRD10') {
      const discount = Math.round(baseTicketTotal * 0.1);
      setAppliedPromo({
        code: 'EARLYBIRD10',
        discountAmount: discount,
        description: '10% Early Bird Flash Discount Applied',
      });
    } else if (code === 'VIPPASS') {
      setAppliedPromo({
        code: 'VIPPASS',
        discountAmount: 25,
        description: '$25 VIP Pass Discount + Backstage Lounge Upgrade',
      });
    } else if (code === 'ROCK20') {
      const discount = Math.round(baseTicketTotal * 0.2);
      setAppliedPromo({
        code: 'ROCK20',
        discountAmount: discount,
        description: '20% Headliner Tour Promotion',
      });
    } else if (code === 'STUDENT15') {
      const discount = Math.round(baseTicketTotal * 0.15);
      setAppliedPromo({
        code: 'STUDENT15',
        discountAmount: discount,
        description: '15% Student Campus Pass',
      });
    } else {
      setPromoError('Invalid promo code. Try EARLYBIRD10, VIPPASS, or ROCK20.');
    }
  };

  // Card Formatting helpers
  const formatCardNumber = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    return raw.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      return `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    return raw;
  };

  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return { name: 'Visa', color: 'text-blue-400' };
    if (clean.startsWith('5')) return { name: 'Mastercard', color: 'text-amber-400' };
    if (clean.startsWith('3')) return { name: 'Amex', color: 'text-emerald-400' };
    return { name: 'Card', color: 'text-slate-400' };
  };

  // Validate Step 1
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; email?: string } = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      errors.name = 'Please enter your full name.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail.trim() || !emailRegex.test(customerEmail.trim())) {
      errors.email = 'Please enter a valid email address for ticket delivery.';
    }

    setStep1Errors(errors);

    if (Object.keys(errors).length === 0) {
      setCurrentStep(2);
      setGlobalError(null);
    }
  };

  // Validate Step 2 & Execute Atomic Multi-Seat Booking
  const handleAuthorizeAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    let isValid = true;
    let paymentDetailsSummary = '';

    if (selectedMethod === 'CREDIT_CARD') {
      const errors: { name?: string; number?: string; expiry?: string; cvv?: string } = {};
      const cleanNum = ccNumber.replace(/\s/g, '');

      if (!ccName.trim()) {
        errors.name = 'Cardholder name is required.';
        isValid = false;
      }
      if (cleanNum.length !== 16 || !/^\d+$/.test(cleanNum)) {
        errors.number = 'Credit card number must be 16 digits.';
        isValid = false;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(ccExpiry)) {
        errors.expiry = 'MM/YY format required.';
        isValid = false;
      }
      if (!/^\d{3,4}$/.test(ccCvv)) {
        errors.cvv = 'CVV must be 3-4 digits.';
        isValid = false;
      }

      setCcErrors(errors);
      paymentDetailsSummary = `Credit Card •••• ${cleanNum.slice(-4) || '8892'} (${getCardBrand(ccNumber).name})`;
    } else if (selectedMethod === 'DEBIT_CARD') {
      const errors: { name?: string; number?: string; expiry?: string; cvv?: string } = {};
      const cleanNum = dcNumber.replace(/\s/g, '');

      if (!dcName.trim()) {
        errors.name = 'Cardholder name is required.';
        isValid = false;
      }
      if (cleanNum.length !== 16 || !/^\d+$/.test(cleanNum)) {
        errors.number = 'Debit card number must be 16 digits.';
        isValid = false;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(dcExpiry)) {
        errors.expiry = 'MM/YY format required.';
        isValid = false;
      }
      if (!/^\d{3,4}$/.test(dcCvv)) {
        errors.cvv = 'PIN/CVV must be 3-4 digits.';
        isValid = false;
      }

      setDcErrors(errors);
      paymentDetailsSummary = `Debit Card •••• ${cleanNum.slice(-4) || '5678'} (${dcNetwork})`;
    } else if (selectedMethod === 'UPI') {
      const errors: { upiId?: string } = {};
      if (upiMode === 'VPA') {
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,64}$/;
        if (!upiId.trim() || !upiRegex.test(upiId.trim())) {
          errors.upiId = 'Invalid UPI ID format (e.g. name@okhdfcbank).';
          isValid = false;
        }
        paymentDetailsSummary = `UPI • ${upiId.trim()}`;
      } else {
        paymentDetailsSummary = 'UPI Dynamic QR Scan';
      }
      setUpiErrors(errors);
    } else if (selectedMethod === 'NET_BANKING') {
      paymentDetailsSummary = `Net Banking • ${selectedBank}`;
    }

    if (!isValid) return;

    setIsProcessing(true);
    setProcessingStatus(`Acquiring atomic lock on [${seatIds.join(', ')}]...`);

    const customer: Customer = {
      id: 'CUST-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
    };

    const service =
      serviceMode === 'SAFE' ? new SafeBookingService(inventory) : new UnsafeBookingService(inventory);

    try {
      setTimeout(() => {
        setProcessingStatus(`Authorizing $${finalPayable}.00 via ${selectedMethod}...`);
      }, 120);

      const result = await service.bookSeats(
        showId,
        seatIds,
        customer,
        {
          threadName: 'Web-Client-Session',
          artificialDelayMs: 160,
          paymentMethod: selectedMethod === 'NET_BANKING' ? 'CREDIT_CARD' : selectedMethod,
          paymentDetails: paymentDetailsSummary,
          addOns: selectedAddOns,
          promoCode: appliedPromo?.code,
          discountAmount: discountVal,
        }
      );

      if (result.success && result.primaryBooking) {
        setConfirmedBooking(result.primaryBooking);
        onBookingSuccess(result.primaryBooking);
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      } else {
        setGlobalError(result.error || 'Seat booking failed. One or more seats may have been reserved by another attendee.');
      }
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'An unexpected booking exception occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderAddOnIcon = (iconName: string) => {
    switch (iconName) {
      case 'car':
        return <Car className="w-4 h-4 text-amber-400" />;
      case 'shirt':
        return <Shirt className="w-4 h-4 text-cyan-400" />;
      case 'wine':
        return <Wine className="w-4 h-4 text-rose-400" />;
      default:
        return <Shield className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div
      id="customer-booking-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
    >
      <div
        id="customer-booking-modal-card"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden my-6 max-h-[92vh] flex flex-col justify-between"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          id="btn-close-booking-modal"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto pr-1 space-y-6 flex-1">
          {confirmedBooking ? (
            /* =========================================================
               CONFIRMED TICKET RECEIPT & WALLET PASS TRIGGER
               ========================================================= */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-white tracking-tight">
                  Seats Confirmed & Reserved!
                </h3>
                <p className="text-xs text-slate-300">
                  Payment authorized. Zero double-booking guarantee honored.
                </p>
              </div>

              {/* Electronic Ticket Pass Preview Mini-Card */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/40 text-left space-y-4 shadow-inner">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-mono">Reference No</span>
                    <p className="text-sm font-mono font-bold text-indigo-400">{confirmedBooking.bookingRef}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-500 font-mono">
                      Allocated Seats ({targetSeats.length})
                    </span>
                    <div className="flex items-center gap-1.5 justify-end mt-0.5">
                      {seatIds.map((id) => (
                        <span
                          key={id}
                          className="px-2 py-0.5 rounded bg-indigo-600/30 border border-indigo-400 text-indigo-200 text-xs font-mono font-bold"
                        >
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Ticket Holder</span>
                    <p className="font-bold text-slate-200">{confirmedBooking.customerName}</p>
                    <p className="text-[11px] text-slate-400">{confirmedBooking.customerEmail}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] uppercase block">Total Amount Paid</span>
                    <p className="text-lg font-black text-emerald-400">${finalPayable}.00</p>
                    {appliedPromo && (
                      <span className="text-[10px] text-indigo-300">
                        Promo ({appliedPromo.code}): -${appliedPromo.discountAmount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add-Ons Listed */}
                {selectedAddOns.length > 0 && (
                  <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-amber-400 font-bold uppercase">Included:</span>
                    {selectedAddOns.map((item) => (
                      <span
                        key={item.id}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons: Open Full Ticket Pass or Return */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {onViewTicketPass && (
                  <button
                    id="btn-view-official-pass"
                    onClick={() => onViewTicketPass(confirmedBooking)}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/40 flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>View & Download Ticket Pass</span>
                  </button>
                )}

                <button
                  id="btn-return-seatmap"
                  onClick={onClose}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  Return to Event Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* =========================================================
               MULTI-STEP BOOKING FLOW (ATTENDEE + ADD-ONS + PROMO + PAYMENT)
               ========================================================= */
            <div className="space-y-5">
              {/* Header / Seat Summary */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Checkout {targetSeats.length} {targetSeats.length === 1 ? 'Ticket' : 'Tickets'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">
                        Seats: {seatIds.join(', ')}
                      </span>
                      <span>•</span>
                      <span className="text-indigo-300">
                        {targetSeats[0]?.category} Tier
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Subtotal</span>
                  <span className="text-lg font-black text-emerald-400">${baseTicketTotal}.00</span>
                </div>
              </div>

              {/* LIVE SEAT HOLD COUNTDOWN TIMER */}
              <HoldCountdownTimer
                durationSeconds={600}
                seatCount={targetSeats.length}
                onExpire={() => {
                  setGlobalError('Your 10-minute seat hold has expired. The seats were released back to the inventory.');
                }}
                onRelease={onClose}
              />

              {/* Stepper Navigation */}
              <div className="flex items-center justify-center gap-2 text-xs">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition ${
                    currentStep === 1
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {currentStep === 2 ? <Check className="w-3.5 h-3.5" /> : <span>1</span>}
                  <span>Attendee & Add-Ons</span>
                </div>

                <div className="w-6 h-px bg-slate-800" />

                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition ${
                    currentStep === 2
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                      : 'bg-slate-950 text-slate-500 border border-slate-800'
                  }`}
                >
                  <span>2</span>
                  <span>Promo & Payment</span>
                </div>
              </div>

              {/* Service Engine Indicator */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  serviceMode === 'SAFE'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                {serviceMode === 'SAFE' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold">
                    {serviceMode === 'SAFE' ? 'Atomic Lock Pipeline Active' : 'Unsynchronized Concurrency Mode'}
                  </span>
                  <p className="text-[11px] opacity-85 mt-0.5">
                    {serviceMode === 'SAFE'
                      ? 'Guaranteed zero overbooking: seats are atomically locked across all threads during checkout.'
                      : 'No lock synchronization: concurrent bookings will produce race-condition duplicates.'}
                  </p>
                </div>
              </div>

              {globalError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{globalError}</span>
                </div>
              )}

              {/* STEP 1: Attendee Info + Add-On Perks */}
              {currentStep === 1 && (
                <form onSubmit={handleProceedToPayment} className="space-y-5">
                  <div className="space-y-3 text-xs">
                    <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                      1. Attendee Contact Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            id="input-attendee-name"
                            value={customerName}
                            onChange={(e) => {
                              setCustomerName(e.target.value);
                              if (step1Errors.name) setStep1Errors({ ...step1Errors, name: undefined });
                            }}
                            className={`w-full bg-slate-950 border rounded-xl pl-9 pr-3.5 py-2 text-slate-200 focus:outline-none ${
                              step1Errors.name
                                ? 'border-rose-500 focus:border-rose-500'
                                : 'border-slate-700 focus:border-indigo-500'
                            }`}
                            placeholder="e.g. Alex Morgan"
                          />
                        </div>
                        {step1Errors.name && (
                          <p className="text-[11px] text-rose-400 mt-1">{step1Errors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Email for Pass Delivery</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                          <input
                            type="email"
                            id="input-attendee-email"
                            value={customerEmail}
                            onChange={(e) => {
                              setCustomerEmail(e.target.value);
                              if (step1Errors.email) setStep1Errors({ ...step1Errors, email: undefined });
                            }}
                            className={`w-full bg-slate-950 border rounded-xl pl-9 pr-3.5 py-2 text-slate-200 focus:outline-none ${
                              step1Errors.email
                                ? 'border-rose-500 focus:border-rose-500'
                                : 'border-slate-700 focus:border-indigo-500'
                            }`}
                            placeholder="e.g. alex.m@example.com"
                          />
                        </div>
                        {step1Errors.email && (
                          <p className="text-[11px] text-rose-400 mt-1">{step1Errors.email}</p>
                        )}
                      </div>

                      <div className="col-span-1 sm:col-span-2">
                        <label className="block font-semibold text-slate-300 mb-1">Mobile Phone (for SMS Gate Alerts)</label>
                        <div className="relative">
                          <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                          <input
                            type="tel"
                            id="input-attendee-phone"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ADD-ON PERKS SELECTION */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        2. Enhance Your Event Experience (Optional Add-Ons)
                      </h4>
                      <span className="text-[10px] text-slate-400">Bundle & Save</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {AVAILABLE_ADD_ONS.map((item) => {
                        const isSelected = selectedAddOnIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleAddOn(item.id)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                              isSelected
                                ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50'
                                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="mt-0.5 p-2 rounded-xl bg-slate-900 border border-slate-800">
                              {renderAddOnIcon(item.iconName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-200">{item.name}</span>
                                <span className="text-xs font-mono font-bold text-amber-400">+${item.price}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                            </div>
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-400 text-white'
                                  : 'border-slate-700 bg-slate-900'
                              }`}
                            >
                              {isSelected && '✓'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 1 Footer */}
                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Estimated Total</span>
                      <p className="text-base font-bold text-white">${baseTicketTotal + addOnsTotal}.00</p>
                    </div>
                    <button
                      type="submit"
                      id="btn-proceed-step2"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                    >
                      <span>Proceed to Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Promo Code + Payment Method Selection */}
              {currentStep === 2 && (
                <form onSubmit={handleAuthorizeAndPay} className="space-y-4">
                  {/* PROMO CODE BOX */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" /> Apply Discount / Promo Code
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. EARLYBIRD10, VIPPASS, ROCK20"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
                      >
                        Apply
                      </button>
                    </div>

                    {promoError && (
                      <p className="text-[11px] text-rose-400">{promoError}</p>
                    )}

                    {appliedPromo && (
                      <div className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>{appliedPromo.description}</span>
                        </div>
                        <span className="font-bold font-mono">-${appliedPromo.discountAmount}.00</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                      Select Payment Option
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* Credit Card */}
                      <button
                        type="button"
                        id="tab-payment-credit"
                        onClick={() => setSelectedMethod('CREDIT_CARD')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                          selectedMethod === 'CREDIT_CARD'
                            ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-indigo-400" />
                        <div>
                          <div className="text-xs font-bold">Credit Card</div>
                          <div className="text-[10px] text-slate-400">Visa/MC/Amex</div>
                        </div>
                      </button>

                      {/* Debit Card */}
                      <button
                        type="button"
                        id="tab-payment-debit"
                        onClick={() => setSelectedMethod('DEBIT_CARD')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                          selectedMethod === 'DEBIT_CARD'
                            ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <Landmark className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className="text-xs font-bold">Debit Card</div>
                          <div className="text-[10px] text-slate-400">Bank ATM Card</div>
                        </div>
                      </button>

                      {/* UPI */}
                      <button
                        type="button"
                        id="tab-payment-upi"
                        onClick={() => setSelectedMethod('UPI')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                          selectedMethod === 'UPI'
                            ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="text-xs font-bold">UPI / QR</div>
                          <div className="text-[10px] text-slate-400">Instant VPA</div>
                        </div>
                      </button>

                      {/* Net Banking */}
                      <button
                        type="button"
                        id="tab-payment-netbanking"
                        onClick={() => setSelectedMethod('NET_BANKING')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                          selectedMethod === 'NET_BANKING'
                            ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <Landmark className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="text-xs font-bold">Net Banking</div>
                          <div className="text-[10px] text-slate-400">Direct Bank</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* CREDIT CARD DETAILS FORM */}
                  {selectedMethod === 'CREDIT_CARD' && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                      <div className="flex items-center justify-between pb-1">
                        <span className="font-semibold text-slate-300">Credit Card Details</span>
                        <span className={`text-[11px] font-bold ${getCardBrand(ccNumber).color}`}>
                          {getCardBrand(ccNumber).name}
                        </span>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          id="input-cc-name"
                          value={ccName}
                          onChange={(e) => {
                            setCcName(e.target.value);
                            if (ccErrors.name) setCcErrors({ ...ccErrors, name: undefined });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                          placeholder="Alex Morgan"
                        />
                        {ccErrors.name && <p className="text-[11px] text-rose-400 mt-1">{ccErrors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">16-Digit Card Number</label>
                        <input
                          type="text"
                          id="input-cc-number"
                          maxLength={19}
                          value={ccNumber}
                          onChange={(e) => {
                            setCcNumber(formatCardNumber(e.target.value));
                            if (ccErrors.number) setCcErrors({ ...ccErrors, number: undefined });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                          placeholder="4532 0000 0000 0000"
                        />
                        {ccErrors.number && <p className="text-[11px] text-rose-400 mt-1">{ccErrors.number}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            id="input-cc-expiry"
                            maxLength={5}
                            value={ccExpiry}
                            onChange={(e) => {
                              setCcExpiry(formatExpiry(e.target.value));
                              if (ccErrors.expiry) setCcErrors({ ...ccErrors, expiry: undefined });
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                            placeholder="12/28"
                          />
                          {ccErrors.expiry && <p className="text-[11px] text-rose-400 mt-1">{ccErrors.expiry}</p>}
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">CVV</label>
                          <input
                            type="password"
                            id="input-cc-cvv"
                            maxLength={4}
                            value={ccCvv}
                            onChange={(e) => {
                              setCcCvv(e.target.value.replace(/\D/g, ''));
                              if (ccErrors.cvv) setCcErrors({ ...ccErrors, cvv: undefined });
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                            placeholder="384"
                          />
                          {ccErrors.cvv && <p className="text-[11px] text-rose-400 mt-1">{ccErrors.cvv}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DEBIT CARD DETAILS FORM */}
                  {selectedMethod === 'DEBIT_CARD' && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                      <div className="flex items-center justify-between pb-1">
                        <span className="font-semibold text-slate-300">Debit Card Details</span>
                        <select
                          value={dcNetwork}
                          onChange={(e) => setDcNetwork(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-md px-2 py-0.5 text-[11px] text-slate-300 focus:outline-none"
                        >
                          <option value="Visa Debit">Visa Debit</option>
                          <option value="Mastercard Debit">Mastercard Debit</option>
                          <option value="RuPay Debit">RuPay Debit</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          id="input-dc-name"
                          value={dcName}
                          onChange={(e) => {
                            setDcName(e.target.value);
                            if (dcErrors.name) setDcErrors({ ...dcErrors, name: undefined });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                          placeholder="Alex Morgan"
                        />
                        {dcErrors.name && <p className="text-[11px] text-rose-400 mt-1">{dcErrors.name}</p>}
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">16-Digit Debit Card Number</label>
                        <input
                          type="text"
                          id="input-dc-number"
                          maxLength={19}
                          value={dcNumber}
                          onChange={(e) => {
                            setDcNumber(formatCardNumber(e.target.value));
                            if (dcErrors.number) setDcErrors({ ...dcErrors, number: undefined });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                          placeholder="5241 0000 0000 0000"
                        />
                        {dcErrors.number && <p className="text-[11px] text-rose-400 mt-1">{dcErrors.number}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            id="input-dc-expiry"
                            maxLength={5}
                            value={dcExpiry}
                            onChange={(e) => {
                              setDcExpiry(formatExpiry(e.target.value));
                              if (dcErrors.expiry) setDcErrors({ ...dcErrors, expiry: undefined });
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                            placeholder="08/29"
                          />
                          {dcErrors.expiry && <p className="text-[11px] text-rose-400 mt-1">{dcErrors.expiry}</p>}
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">CVV / ATM PIN</label>
                          <input
                            type="password"
                            id="input-dc-cvv"
                            maxLength={4}
                            value={dcCvv}
                            onChange={(e) => {
                              setDcCvv(e.target.value.replace(/\D/g, ''));
                              if (dcErrors.cvv) setDcErrors({ ...dcErrors, cvv: undefined });
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                            placeholder="712"
                          />
                          {dcErrors.cvv && <p className="text-[11px] text-rose-400 mt-1">{dcErrors.cvv}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI DETAILS FORM */}
                  {selectedMethod === 'UPI' && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                      <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setUpiMode('VPA')}
                          className={`flex-1 py-1.5 rounded-md font-semibold transition ${
                            upiMode === 'VPA' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Enter UPI ID (VPA)
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpiMode('QR')}
                          className={`flex-1 py-1.5 rounded-md font-semibold transition flex items-center justify-center gap-1.5 ${
                            upiMode === 'QR' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Instant Dynamic QR</span>
                        </button>
                      </div>

                      {upiMode === 'VPA' ? (
                        <div className="space-y-2">
                          <label className="block text-slate-400">Virtual Payment Address (UPI ID)</label>
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => {
                              setUpiId(e.target.value);
                              if (upiErrors.upiId) setUpiErrors({});
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                            placeholder="e.g. alex@okhdfcbank"
                          />
                          {upiErrors.upiId && <p className="text-[11px] text-rose-400">{upiErrors.upiId}</p>}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl text-center space-y-2">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <svg className="w-24 h-24 text-black" viewBox="0 0 33 33" fill="currentColor">
                              <rect x="2" y="2" width="7" height="7" fill="black" />
                              <rect x="3" y="3" width="5" height="5" fill="white" />
                              <rect x="4" y="4" width="3" height="3" fill="black" />
                              <rect x="24" y="2" width="7" height="7" fill="black" />
                              <rect x="25" y="3" width="5" height="5" fill="white" />
                              <rect x="26" y="4" width="3" height="3" fill="black" />
                              <rect x="2" y="24" width="7" height="7" fill="black" />
                              <rect x="3" y="25" width="5" height="5" fill="white" />
                              <rect x="4" y="26" width="3" height="3" fill="black" />
                              <rect x="11" y="4" width="3" height="3" fill="black" />
                              <rect x="15" y="11" width="4" height="4" fill="black" />
                              <rect x="21" y="15" width="5" height="5" fill="black" />
                            </svg>
                          </div>
                          <span className="text-[11px] text-slate-300 font-medium">
                            Scan with GPay, PhonePe, Paytm, or Apple Pay
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* NET BANKING FORM */}
                  {selectedMethod === 'NET_BANKING' && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                      <label className="block text-slate-400">Select Bank Portal</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Chase Bank">Chase Bank</option>
                        <option value="Bank of America">Bank of America</option>
                        <option value="Wells Fargo">Wells Fargo</option>
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="Barclays">Barclays</option>
                      </select>
                    </div>
                  )}

                  {/* Summary & Pay Button */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      id="btn-back-to-step1"
                      onClick={() => setCurrentStep(1)}
                      disabled={isProcessing}
                      className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>

                    <button
                      type="submit"
                      id="btn-authorize-multi-payment"
                      disabled={isProcessing}
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/40 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{processingStatus || 'Verifying CAS Lock...'}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Pay ${finalPayable}.00 & Confirm Booking</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
