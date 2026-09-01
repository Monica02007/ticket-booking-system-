import React, { useState } from 'react';
import { Seat, Customer, Booking } from '../types';
import { SafeBookingService, UnsafeBookingService } from '../services/bookingServices';
import { SeatInventory } from '../services/inventory';
import {
  Crown,
  Star,
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomerBookingModalProps {
  seat: Seat | null;
  onClose: () => void;
  inventory: SeatInventory;
  serviceMode: 'SAFE' | 'UNSAFE';
  showId: string;
  onBookingSuccess: (booking: Booking) => void;
}

type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI';

export const CustomerBookingModal: React.FC<CustomerBookingModalProps> = ({
  seat,
  onClose,
  inventory,
  serviceMode,
  showId,
  onBookingSuccess,
}) => {
  // Navigation step: 1 = Attendee Info, 2 = Payment Method & Validation, 3 = Confirmation Ticket
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Step 1: Attendee Info
  const [customerName, setCustomerName] = useState<string>('Alex Morgan');
  const [customerEmail, setCustomerEmail] = useState<string>('alex.m@example.com');
  const [customerPhone, setCustomerPhone] = useState<string>('+1 (555) 234-5678');
  const [step1Errors, setStep1Errors] = useState<{ name?: string; email?: string }>({});

  // Step 2: Payment Method
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

  // Processing & State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  if (!seat) return null;
  const price = seat.basePrice;

  // Auto-format card numbers with spaces
  const formatCardNumber = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    return raw.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  // Auto-format expiry MM/YY
  const formatExpiry = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      return `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    return raw;
  };

  // Detect card brand (mock)
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
      errors.name = 'Please enter your full name (minimum 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail.trim() || !emailRegex.test(customerEmail.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    setStep1Errors(errors);

    if (Object.keys(errors).length === 0) {
      setCurrentStep(2);
      setGlobalError(null);
    }
  };

  // Validate Step 2 & Execute Booking
  const handleAuthorizeAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    let isValid = true;
    let paymentDetailsSummary = '';

    // Mock validation per payment method
    if (selectedMethod === 'CREDIT_CARD') {
      const errors: { name?: string; number?: string; expiry?: string; cvv?: string } = {};
      const cleanNum = ccNumber.replace(/\s/g, '');

      if (!ccName.trim() || ccName.trim().length < 2) {
        errors.name = 'Cardholder name is required.';
        isValid = false;
      }
      if (cleanNum.length !== 16 || !/^\d+$/.test(cleanNum)) {
        errors.number = 'Credit card number must be exactly 16 digits.';
        isValid = false;
      }
      const expMatch = ccExpiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
      if (!expMatch) {
        errors.expiry = 'Expiry format must be MM/YY.';
        isValid = false;
      } else {
        const expMonth = parseInt(expMatch[1], 10);
        const expYear = 2000 + parseInt(expMatch[2], 10);
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth() + 1;
        if (expYear < curYear || (expYear === curYear && expMonth < curMonth)) {
          errors.expiry = 'Card is expired.';
          isValid = false;
        }
      }
      if (!/^\d{3,4}$/.test(ccCvv)) {
        errors.cvv = 'CVV must be 3 or 4 digits.';
        isValid = false;
      }

      setCcErrors(errors);
      paymentDetailsSummary = `Credit Card •••• ${cleanNum.slice(-4) || '8892'} (${getCardBrand(ccNumber).name})`;
    } else if (selectedMethod === 'DEBIT_CARD') {
      const errors: { name?: string; number?: string; expiry?: string; cvv?: string } = {};
      const cleanNum = dcNumber.replace(/\s/g, '');

      if (!dcName.trim() || dcName.trim().length < 2) {
        errors.name = 'Cardholder name is required.';
        isValid = false;
      }
      if (cleanNum.length !== 16 || !/^\d+$/.test(cleanNum)) {
        errors.number = 'Debit card number must be exactly 16 digits.';
        isValid = false;
      }
      const expMatch = dcExpiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
      if (!expMatch) {
        errors.expiry = 'Expiry format must be MM/YY.';
        isValid = false;
      }
      if (!/^\d{3,4}$/.test(dcCvv)) {
        errors.cvv = 'CVV/PIN must be 3 or 4 digits.';
        isValid = false;
      }

      setDcErrors(errors);
      paymentDetailsSummary = `Debit Card •••• ${cleanNum.slice(-4) || '5678'} (${dcNetwork})`;
    } else if (selectedMethod === 'UPI') {
      const errors: { upiId?: string } = {};
      if (upiMode === 'VPA') {
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,64}$/;
        if (!upiId.trim() || !upiRegex.test(upiId.trim())) {
          errors.upiId = 'Invalid UPI ID format (e.g. yourname@okhdfcbank, name@paytm).';
          isValid = false;
        }
        paymentDetailsSummary = `UPI ID • ${upiId.trim()}`;
      } else {
        paymentDetailsSummary = 'UPI Instant Dynamic QR Code';
      }
      setUpiErrors(errors);
    }

    if (!isValid) return;

    // Proceed to booking simulation
    setIsProcessing(true);
    setProcessingStatus('Locking seat & authorizing payment...');

    const customer: Customer = {
      id: 'CUST-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
    };

    const service =
      serviceMode === 'SAFE' ? new SafeBookingService(inventory) : new UnsafeBookingService(inventory);

    try {
      // Step visual feedback
      setTimeout(() => {
        setProcessingStatus(`Processing ${selectedMethod.replace('_', ' ')} authorization...`);
      }, 150);

      const result = await service.bookSeat(
        showId,
        seat.id,
        customer,
        'Web-Client-Thread',
        180,
        selectedMethod,
        paymentDetailsSummary
      );

      if (result.success && result.booking) {
        setConfirmedBooking(result.booking);
        onBookingSuccess(result.booking);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setGlobalError(result.error || 'Seat booking failed. The seat might have been taken.');
      }
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'An unexpected exception occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          id="btn-close-booking-modal"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {confirmedBooking ? (
          /* =========================================================
             CONFIRMED TICKET VIEW
             ========================================================= */
          <div className="space-y-6 text-center py-2">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">Booking Confirmed!</h3>
              <p className="text-xs text-slate-400">
                Payment verified successfully. Your electronic ticket pass is ready.
              </p>
            </div>

            {/* Electronic Ticket Card */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-dashed border-indigo-500/40 text-left space-y-4 shadow-inner">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-mono">Reference No</span>
                  <p className="text-sm font-mono font-bold text-indigo-400">{confirmedBooking.bookingRef}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-500 font-mono">Allocated Seat</span>
                  <p className="text-base font-bold text-white flex items-center gap-1 justify-end">
                    {confirmedBooking.seatCategory === 'VIP' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                    {confirmedBooking.seatCategory === 'PREMIUM' && <Star className="w-3.5 h-3.5 text-indigo-300" />}
                    {confirmedBooking.seatId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Attendee</span>
                  <p className="font-semibold text-slate-200">{confirmedBooking.customerName}</p>
                  <p className="text-[11px] text-slate-400">{confirmedBooking.customerEmail}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] uppercase">Total Paid</span>
                  <p className="text-base font-bold text-emerald-400">${confirmedBooking.amountPaid}.00</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Mode: {confirmedBooking.serviceType}
                  </span>
                </div>
              </div>

              {/* Payment Receipt Info */}
              <div className="pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/40 -mx-5 -mb-5 px-5 py-2.5 rounded-b-2xl">
                <span>Payment Method:</span>
                <span className="font-semibold text-slate-200">{confirmedBooking.paymentDetails || confirmedBooking.paymentMethod}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              id="btn-return-seatmap"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/30"
            >
              Done & Return to Seat Map
            </button>
          </div>
        ) : (
          /* =========================================================
             MULTI-STEP BOOKING & PAYMENT FLOW
             ========================================================= */
          <div className="space-y-5">
            {/* Header / Seat Summary */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Ticket className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white truncate">Reserve Seat {seat.id}</h3>
                  <span className="text-base font-bold text-emerald-400">${price}.00</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-slate-300">
                    {seat.category === 'VIP' && <Crown className="w-3 h-3 text-amber-400" />}
                    {seat.category === 'PREMIUM' && <Star className="w-3 h-3 text-indigo-300" />}
                    {seat.category} Tier
                  </span>
                  <span>•</span>
                  <span>Row {seat.row}, Seat {seat.number}</span>
                </div>
              </div>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition ${
                  currentStep === 1
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {currentStep === 2 ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">
                    1
                  </span>
                )}
                <span>1. Attendee Details</span>
              </div>

              <div className="w-6 h-px bg-slate-800" />

              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition ${
                  currentStep === 2
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-950 text-slate-500 border border-slate-800'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center">
                  2
                </span>
                <span>2. Payment & Validation</span>
              </div>
            </div>

            {/* Service Engine Warning Banner */}
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
                  {serviceMode === 'SAFE' ? 'Atomic Lock Protected' : 'Unsynchronized Concurrency Engine'}
                </span>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {serviceMode === 'SAFE'
                    ? 'Seat is guarded by an exclusive ReentrantLock during payment gateway authorization.'
                    : 'No locks held; demonstrates race conditions when concurrent requests hit simultaneously.'}
                </p>
              </div>
            </div>

            {/* Global Error Banner */}
            {globalError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{globalError}</span>
              </div>
            )}

            {/* STEP 1: Attendee Details Form */}
            {currentStep === 1 && (
              <form onSubmit={handleProceedToPayment} className="space-y-4">
                <div className="space-y-3 text-xs">
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
                    <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
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

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      id="input-attendee-phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] text-slate-400">Total payable</span>
                    <p className="text-base font-bold text-white">${price}.00</p>
                  </div>
                  <button
                    type="submit"
                    id="btn-proceed-payment-step"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                  >
                    <span>Choose Payment Method</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Payment Method Selection & Mock Validation */}
            {currentStep === 2 && (
              <form onSubmit={handleAuthorizeAndPay} className="space-y-4">
                {/* Payment Method Selector Tabs */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                    Select Payment Option
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Credit Card Option */}
                    <button
                      type="button"
                      id="tab-payment-credit"
                      onClick={() => setSelectedMethod('CREDIT_CARD')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                        selectedMethod === 'CREDIT_CARD'
                          ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-indigo-400" />
                      <div>
                        <div className="text-xs font-bold">Credit Card</div>
                        <div className="text-[10px] text-slate-400">Visa / MC / Amex</div>
                      </div>
                    </button>

                    {/* Debit Card Option */}
                    <button
                      type="button"
                      id="tab-payment-debit"
                      onClick={() => setSelectedMethod('DEBIT_CARD')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                        selectedMethod === 'DEBIT_CARD'
                          ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <Landmark className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="text-xs font-bold">Debit Card</div>
                        <div className="text-[10px] text-slate-400">ATM / Bank Card</div>
                      </div>
                    </button>

                    {/* UPI Option */}
                    <button
                      type="button"
                      id="tab-payment-upi"
                      onClick={() => setSelectedMethod('UPI')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                        selectedMethod === 'UPI'
                          ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold">UPI / QR</div>
                        <div className="text-[10px] text-slate-400">VPA & Dynamic QR</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* METHOD 1: CREDIT CARD FORM */}
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
                        className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-slate-200 focus:outline-none ${
                          ccErrors.name ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                        }`}
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
                        className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none ${
                          ccErrors.number ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                        }`}
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
                          className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none ${
                            ccErrors.expiry ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                          }`}
                          placeholder="12/28"
                        />
                        {ccErrors.expiry && (
                          <p className="text-[11px] text-rose-400 mt-1">{ccErrors.expiry}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">CVV / CVC</label>
                        <input
                          type="password"
                          id="input-cc-cvv"
                          maxLength={4}
                          value={ccCvv}
                          onChange={(e) => {
                            setCcCvv(e.target.value.replace(/\D/g, ''));
                            if (ccErrors.cvv) setCcErrors({ ...ccErrors, cvv: undefined });
                          }}
                          className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none ${
                            ccErrors.cvv ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                          }`}
                          placeholder="384"
                        />
                        {ccErrors.cvv && <p className="text-[11px] text-rose-400 mt-1">{ccErrors.cvv}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* METHOD 2: DEBIT CARD FORM */}
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
                        <option value="Maestro">Maestro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        id="input-dc-name"
                        value={dcName}
                        onChange={(e) => {
                          setDcName(e.target.value);
                          if (dcErrors.name) setDcErrors({ ...dcErrors, name: undefined });
                        }}
                        className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-slate-200 focus:outline-none ${
                          dcErrors.name ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                        }`}
                        placeholder="Alex Morgan"
                      />
                      {dcErrors.name && <p className="text-[11px] text-rose-400 mt-1">{dcErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">16-Digit Debit Card Number</label>
                      <input
                        type="text"
                        id="input-dc-number"
                        maxLength={19}
                        value={dcNumber}
                        onChange={(e) => {
                          setDcNumber(formatCardNumber(e.target.value));
                          if (dcErrors.number) setDcErrors({ ...dcErrors, number: undefined });
                        }}
                        className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none ${
                          dcErrors.number ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                        }`}
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
                          className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none ${
                            dcErrors.expiry ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                          }`}
                          placeholder="08/29"
                        />
                        {dcErrors.expiry && (
                          <p className="text-[11px] text-rose-400 mt-1">{dcErrors.expiry}</p>
                        )}
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
                          className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none ${
                            dcErrors.cvv ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                          }`}
                          placeholder="712"
                        />
                        {dcErrors.cvv && <p className="text-[11px] text-rose-400 mt-1">{dcErrors.cvv}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* METHOD 3: UPI FORM */}
                {selectedMethod === 'UPI' && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                    {/* UPI Sub-Mode Switch */}
                    <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        id="btn-upi-mode-vpa"
                        onClick={() => setUpiMode('VPA')}
                        className={`flex-1 py-1.5 rounded-md font-semibold transition ${
                          upiMode === 'VPA' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Enter UPI ID (VPA)
                      </button>
                      <button
                        type="button"
                        id="btn-upi-mode-qr"
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
                          id="input-upi-id"
                          value={upiId}
                          onChange={(e) => {
                            setUpiId(e.target.value);
                            if (upiErrors.upiId) setUpiErrors({ ...upiErrors, upiId: undefined });
                          }}
                          className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-slate-200 focus:outline-none ${
                            upiErrors.upiId ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                          }`}
                          placeholder="e.g. name@okhdfcbank"
                        />
                        {upiErrors.upiId && (
                          <p className="text-[11px] text-rose-400">{upiErrors.upiId}</p>
                        )}

                        {/* Quick Handle Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-500">Quick handles:</span>
                          {['@okhdfcbank', '@okaxis', '@oksbi', '@paytm', '@ybl'].map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => {
                                const userPart = upiId.includes('@') ? upiId.split('@')[0] : upiId || 'alex';
                                setUpiId(`${userPart}${h}`);
                                setUpiErrors({});
                              }}
                              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px] transition"
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Dynamic QR Simulation */
                      <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-xl border border-slate-800 text-center space-y-3">
                        <div className="p-3 bg-white rounded-xl shadow-md">
                          {/* Stylized QR Vector Graphic */}
                          <svg className="w-28 h-28 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                            {/* Position Detection Squares */}
                            <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z" />
                            <path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z" />
                            <path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z" />
                            {/* QR Data Matrix simulation */}
                            <rect x="45" y="15" width="8" height="8" />
                            <rect x="45" y="30" width="8" height="8" />
                            <rect x="15" y="45" width="8" height="8" />
                            <rect x="30" y="45" width="8" height="8" />
                            <rect x="45" y="45" width="10" height="10" />
                            <rect x="60" y="45" width="8" height="8" />
                            <rect x="75" y="45" width="10" height="8" />
                            <rect x="45" y="60" width="8" height="8" />
                            <rect x="60" y="60" width="8" height="15" />
                            <rect x="75" y="60" width="12" height="8" />
                            <rect x="45" y="75" width="10" height="12" />
                            <rect x="70" y="75" width="16" height="12" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Scan with any UPI App</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            GPay, PhonePe, Paytm, BHIM, or any Banking App
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Back / Pay Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    id="btn-back-to-step1"
                    onClick={() => setCurrentStep(1)}
                    disabled={isProcessing}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-600 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    id="btn-authorize-payment"
                    disabled={isProcessing}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{processingStatus || 'Verifying Payment...'}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          Pay ${price}.00 via{' '}
                          {selectedMethod === 'CREDIT_CARD'
                            ? 'Credit Card'
                            : selectedMethod === 'DEBIT_CARD'
                            ? 'Debit Card'
                            : 'UPI'}
                        </span>
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
  );
};
