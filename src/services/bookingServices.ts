import { Booking, Customer, AddOnItem } from '../types';
import { SeatInventory } from './inventory';
import { SimulatedPaymentGateway } from './domain';
import { auditLogger } from './auditLogger';
import { bookingDAO } from './dbStore';
import {
  SeatNotAvailableException,
  PaymentFailureException,
} from './exceptions';

export interface BookingResult {
  success: boolean;
  booking?: Booking;
  error?: string;
  overbookingDetected?: boolean;
}

export interface MultiBookingResult {
  success: boolean;
  bookings?: Booking[];
  primaryBooking?: Booking;
  error?: string;
  overbookingDetected?: boolean;
}

export interface IBookingService {
  bookSeat(
    showId: string,
    seatId: string,
    customer: Customer,
    threadName?: string,
    artificialDelayMs?: number,
    paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI',
    paymentDetails?: string
  ): Promise<BookingResult>;

  bookSeats(
    showId: string,
    seatIds: string[],
    customer: Customer,
    options?: {
      threadName?: string;
      artificialDelayMs?: number;
      paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI';
      paymentDetails?: string;
      addOns?: AddOnItem[];
      promoCode?: string;
      discountAmount?: number;
    }
  ): Promise<MultiBookingResult>;
}

/**
 * UNSAFE BOOKING SERVICE
 * -------------------------------------------------------------
 * Demonstrates classic Concurrency Race Condition (Check-Then-Act / TOCTOU).
 * 1. Checks if seat is available (read).
 * 2. Pauses for payment gateway / verification.
 * 3. Blindly writes confirmation without holding an exclusive lock or atomic CAS.
 * When multiple threads run simultaneously against the same seats, OVERBOOKING occurs!
 */
export class UnsafeBookingService implements IBookingService {
  private inventory: SeatInventory;

  constructor(inventory: SeatInventory) {
    this.inventory = inventory;
  }

  async bookSeat(
    showId: string,
    seatId: string,
    customer: Customer,
    threadName: string = 'Thread-Unsafe',
    artificialDelayMs: number = 80,
    paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' = 'CREDIT_CARD',
    paymentDetails: string = 'Card ending in 4242'
  ): Promise<BookingResult> {
    const multi = await this.bookSeats(showId, [seatId], customer, {
      threadName,
      artificialDelayMs,
      paymentMethod,
      paymentDetails,
    });
    return {
      success: multi.success,
      booking: multi.primaryBooking,
      error: multi.error,
      overbookingDetected: multi.overbookingDetected,
    };
  }

  async bookSeats(
    showId: string,
    seatIds: string[],
    customer: Customer,
    options: {
      threadName?: string;
      artificialDelayMs?: number;
      paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI';
      paymentDetails?: string;
      addOns?: AddOnItem[];
      promoCode?: string;
      discountAmount?: number;
    } = {}
  ): Promise<MultiBookingResult> {
    const threadName = options.threadName || 'Thread-Unsafe';
    const artificialDelayMs = options.artificialDelayMs ?? 80;
    const paymentMethod = options.paymentMethod || 'CREDIT_CARD';
    const paymentDetails = options.paymentDetails || 'Card ending in 4242';
    const addOns = options.addOns || [];
    const promoCode = options.promoCode;
    const discountAmount = options.discountAmount || 0;

    let totalSeatPrice = 0;
    for (const sId of seatIds) {
      const seat = this.inventory.getSeat(sId);
      if (!seat) {
        return { success: false, error: `Seat ${sId} does not exist.` };
      }
      totalSeatPrice += seat.basePrice;
    }

    const addOnTotal = addOns.reduce((acc, item) => acc + item.price, 0);
    const finalAmount = Math.max(0, totalSeatPrice + addOnTotal - discountAmount);

    // 1. Unsynchronized checks
    for (const sId of seatIds) {
      auditLogger.log({
        threadName,
        serviceType: 'UNSAFE',
        action: 'LOCK_ATTEMPT',
        seatId: sId,
        customerId: customer.id,
        customerName: customer.name,
        message: `[NO-LOCK ENGINE] Checking availability for seat ${sId}`,
        status: 'INFO',
      });

      const isAvailable = this.inventory.unsafeCheckAvailable(sId);
      if (!isAvailable) {
        auditLogger.log({
          threadName,
          serviceType: 'UNSAFE',
          action: 'LOCK_FAILED',
          seatId: sId,
          customerId: customer.id,
          customerName: customer.name,
          message: `Seat ${sId} was seen as already booked.`,
          status: 'FAILED',
        });
        return { success: false, error: `Seat ${sId} is already booked.` };
      }
    }

    // 2. Simulating payment processing delay while NOT holding any lock
    auditLogger.log({
      threadName,
      serviceType: 'UNSAFE',
      action: 'PAYMENT_START',
      seatId: seatIds.join(','),
      customerId: customer.id,
      customerName: customer.name,
      message: `Processing payment of $${finalAmount} for [${seatIds.join(', ')}] (Vulnerable sleep window)...`,
      status: 'INFO',
    });

    const paymentResult = await SimulatedPaymentGateway.processPayment(finalAmount, 0.02, artificialDelayMs);
    if (!paymentResult.success) {
      auditLogger.log({
        threadName,
        serviceType: 'UNSAFE',
        action: 'PAYMENT_FAILED',
        seatId: seatIds.join(','),
        customerId: customer.id,
        customerName: customer.name,
        message: `Payment failed for ${customer.name}`,
        status: 'FAILED',
      });
      return { success: false, error: 'Payment declined.' };
    }

    // 3. Blind confirmation write!
    let anyOverbooked = false;
    const bookings: Booking[] = [];
    const gateLetters = ['Gate A', 'Gate B', 'Gate C', 'Gate VIP'];
    const assignedGate = gateLetters[Math.floor(Math.random() * gateLetters.length)];

    for (const sId of seatIds) {
      const seat = this.inventory.getSeat(sId)!;
      const wasAlreadyBooked = seat.isBooked;
      this.inventory.unsafeConfirmBooking(sId, customer.id);

      const isDoubleBooked = wasAlreadyBooked || seat.bookedByCustomerIds.length > 1;
      if (isDoubleBooked) anyOverbooked = true;

      const booking: Booking = {
        id: 'BK-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        bookingRef: 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        showId,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        seatId: sId,
        seatIds,
        seatCategory: seat.category,
        amountPaid: finalAmount / seatIds.length,
        baseAmount: seat.basePrice,
        discountAmount: discountAmount / seatIds.length,
        promoCode,
        addOns,
        paymentMethod,
        paymentDetails,
        status: isDoubleBooked ? 'OVERBOOKED_ERROR' : 'CONFIRMED',
        timestamp: Date.now(),
        threadId: threadName,
        serviceType: 'UNSAFE',
        isDoubleBooked,
        gateNumber: assignedGate,
      };

      bookingDAO.insertBooking(booking);
      bookings.push(booking);

      if (isDoubleBooked) {
        auditLogger.log({
          threadName,
          serviceType: 'UNSAFE',
          action: 'OVERBOOKING_DETECTED',
          seatId: sId,
          customerId: customer.id,
          customerName: customer.name,
          message: `CRITICAL ERROR: OVERBOOKING DETECTED on seat ${sId} (booked by ${seat.bookedByCustomerIds.length} users)!`,
          status: 'WARNING',
        });
      } else {
        auditLogger.log({
          threadName,
          serviceType: 'UNSAFE',
          action: 'BOOKING_CONFIRMED',
          seatId: sId,
          customerId: customer.id,
          customerName: customer.name,
          message: `Booking confirmed for ${customer.name} (Seat ${sId}, Ref: ${booking.bookingRef})`,
          status: 'SUCCESS',
        });
      }
    }

    return {
      success: true,
      bookings,
      primaryBooking: bookings[0],
      overbookingDetected: anyOverbooked,
    };
  }
}

/**
 * SAFE BOOKING SERVICE
 * -------------------------------------------------------------
 * Eliminates race conditions with atomic fine-grained locking (ReentrantLock equivalent).
 * 1. Atomically acquires exclusive locks on all requested seats.
 * 2. If any lock fails or seat booked, safely rolls back all locks and throws SeatNotAvailableException.
 * 3. Holds the locks throughout payment processing.
 * 4. Atomically confirms the bookings & transitions state to CONFIRMED.
 * 5. Safely releases locks in finally block.
 * Result: GUARANTEED ZERO OVERBOOKING under any concurrent load!
 */
export class SafeBookingService implements IBookingService {
  private inventory: SeatInventory;

  constructor(inventory: SeatInventory) {
    this.inventory = inventory;
  }

  async bookSeat(
    showId: string,
    seatId: string,
    customer: Customer,
    threadName: string = 'Thread-Safe',
    artificialDelayMs: number = 80,
    paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' = 'CREDIT_CARD',
    paymentDetails: string = 'Card ending in 4242'
  ): Promise<BookingResult> {
    const multi = await this.bookSeats(showId, [seatId], customer, {
      threadName,
      artificialDelayMs,
      paymentMethod,
      paymentDetails,
    });
    return {
      success: multi.success,
      booking: multi.primaryBooking,
      error: multi.error,
      overbookingDetected: false,
    };
  }

  async bookSeats(
    showId: string,
    seatIds: string[],
    customer: Customer,
    options: {
      threadName?: string;
      artificialDelayMs?: number;
      paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI';
      paymentDetails?: string;
      addOns?: AddOnItem[];
      promoCode?: string;
      discountAmount?: number;
    } = {}
  ): Promise<MultiBookingResult> {
    const threadName = options.threadName || 'Thread-Safe';
    const artificialDelayMs = options.artificialDelayMs ?? 80;
    const paymentMethod = options.paymentMethod || 'CREDIT_CARD';
    const paymentDetails = options.paymentDetails || 'Card ending in 4242';
    const addOns = options.addOns || [];
    const promoCode = options.promoCode;
    const discountAmount = options.discountAmount || 0;

    let totalSeatPrice = 0;
    for (const sId of seatIds) {
      const seat = this.inventory.getSeat(sId);
      if (!seat) {
        return { success: false, error: `Seat ${sId} does not exist.` };
      }
      totalSeatPrice += seat.basePrice;
    }

    const addOnTotal = addOns.reduce((acc, item) => acc + item.price, 0);
    const finalAmount = Math.max(0, totalSeatPrice + addOnTotal - discountAmount);

    // 1. Atomic Multi-Lock Acquisition (All-or-Nothing)
    auditLogger.log({
      threadName,
      serviceType: 'SAFE',
      action: 'LOCK_ATTEMPT',
      seatId: seatIds.join(','),
      customerId: customer.id,
      customerName: customer.name,
      message: `[ATOMIC REENTRANT LOCK] Attempting atomic multi-lock on seats [${seatIds.join(', ')}]`,
      status: 'INFO',
    });

    const locksAcquired = this.inventory.acquireSafeLocks(seatIds, customer.id, 600000);
    if (!locksAcquired) {
      auditLogger.log({
        threadName,
        serviceType: 'SAFE',
        action: 'LOCK_FAILED',
        seatId: seatIds.join(','),
        customerId: customer.id,
        customerName: customer.name,
        message: `Lock acquisition rejected: One or more seats in [${seatIds.join(', ')}] are already held or booked.`,
        status: 'FAILED',
      });
      return {
        success: false,
        error: new SeatNotAvailableException(seatIds.join(', ')).message,
      };
    }

    auditLogger.log({
      threadName,
      serviceType: 'SAFE',
      action: 'LOCK_SUCCESS',
      seatId: seatIds.join(','),
      customerId: customer.id,
      customerName: customer.name,
      message: `Exclusive locks GRANTED for [${seatIds.join(', ')}]. Holding lock during payment...`,
      status: 'SUCCESS',
    });

    try {
      // 2. Process payment under lock protection
      auditLogger.log({
        threadName,
        serviceType: 'SAFE',
        action: 'PAYMENT_START',
        seatId: seatIds.join(','),
        customerId: customer.id,
        customerName: customer.name,
        message: `Executing payment gateway verification ($${finalAmount})...`,
        status: 'INFO',
      });

      const paymentResult = await SimulatedPaymentGateway.processPayment(finalAmount, 0.02, artificialDelayMs);
      if (!paymentResult.success) {
        throw new PaymentFailureException('Payment gateway declined transaction');
      }

      // 3. Atomically commit bookings
      const confirmed = this.inventory.confirmSafeBookings(seatIds, customer.id);
      if (!confirmed) {
        throw new SeatNotAvailableException(seatIds.join(', '), 'Failed to commit booking state under lock.');
      }

      const bookings: Booking[] = [];
      const gateLetters = ['Gate A (Fast-Track)', 'Gate B (Orchestra)', 'Gate C (North)', 'Gate VIP Exclusive'];
      const assignedGate = gateLetters[Math.floor(Math.random() * gateLetters.length)];

      for (const sId of seatIds) {
        const seat = this.inventory.getSeat(sId)!;
        const booking: Booking = {
          id: 'BK-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          bookingRef: 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          showId,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          seatId: sId,
          seatIds,
          seatCategory: seat.category,
          amountPaid: finalAmount / seatIds.length,
          baseAmount: seat.basePrice,
          discountAmount: discountAmount / seatIds.length,
          promoCode,
          addOns,
          paymentMethod,
          paymentDetails,
          status: 'CONFIRMED',
          timestamp: Date.now(),
          threadId: threadName,
          serviceType: 'SAFE',
          isDoubleBooked: false,
          gateNumber: assignedGate,
        };

        bookingDAO.insertBooking(booking);
        bookings.push(booking);

        auditLogger.log({
          threadName,
          serviceType: 'SAFE',
          action: 'BOOKING_CONFIRMED',
          seatId: sId,
          customerId: customer.id,
          customerName: customer.name,
          message: `Transaction committed cleanly! Ref: ${booking.bookingRef}. Zero double-booking guarantee honored.`,
          status: 'SUCCESS',
        });
      }

      return { success: true, bookings, primaryBooking: bookings[0] };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown booking exception';
      // Safe rollback and release all locks
      this.inventory.releaseSafeLocks(seatIds, customer.id);

      auditLogger.log({
        threadName,
        serviceType: 'SAFE',
        action: 'BOOKING_RELEASED',
        seatId: seatIds.join(','),
        customerId: customer.id,
        customerName: customer.name,
        message: `Transaction aborted (${errorMsg}). All locks safely released back to public inventory.`,
        status: 'FAILED',
      });

      return { success: false, error: errorMsg };
    }
  }
}

