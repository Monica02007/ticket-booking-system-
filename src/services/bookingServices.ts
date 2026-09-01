import { Booking, Customer } from '../types';
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
    const seat = this.inventory.getSeat(seatId);
    if (!seat) {
      return { success: false, error: `Seat ${seatId} does not exist.` };
    }

    auditLogger.log({
      threadName,
      serviceType: 'UNSAFE',
      action: 'LOCK_ATTEMPT',
      seatId,
      customerId: customer.id,
      customerName: customer.name,
      message: `[NO-LOCK ENGINE] Customer checking availability for seat ${seatId}`,
      status: 'INFO',
    });

    // 1. Unsynchronized check (RACE CONDITION WINDOW OPENS HERE)
    const isAvailable = this.inventory.unsafeCheckAvailable(seatId);
    if (!isAvailable) {
      auditLogger.log({
        threadName,
        serviceType: 'UNSAFE',
        action: 'LOCK_FAILED',
        seatId,
        customerId: customer.id,
        customerName: customer.name,
        message: `Seat ${seatId} was seen as already booked.`,
        status: 'FAILED',
      });
      return { success: false, error: `Seat ${seatId} is already booked.` };
    }

    // 2. Simulating payment processing delay while NOT holding any lock
    auditLogger.log({
      threadName,
      serviceType: 'UNSAFE',
      action: 'PAYMENT_START',
      seatId,
      customerId: customer.id,
      customerName: customer.name,
      message: `Processing payment of $${seat.basePrice} (Vulnerable sleep window)...`,
      status: 'INFO',
    });

    const paymentResult = await SimulatedPaymentGateway.processPayment(seat.basePrice, 0.02, artificialDelayMs);
    if (!paymentResult.success) {
      auditLogger.log({
        threadName,
        serviceType: 'UNSAFE',
        action: 'PAYMENT_FAILED',
        seatId,
        customerId: customer.id,
        customerName: customer.name,
        message: `Payment failed for ${customer.name}`,
        status: 'FAILED',
      });
      return { success: false, error: 'Payment declined.' };
    }

    // 3. Blind confirmation write! (Check if another thread already booked it during the delay)
    const wasAlreadyBooked = seat.isBooked;
    this.inventory.unsafeConfirmBooking(seatId, customer.id);

    const isDoubleBooked = wasAlreadyBooked || seat.bookedByCustomerIds.length > 1;

    const booking: Booking = {
      id: 'BK-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      bookingRef: 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      showId,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      seatId,
      seatCategory: seat.category,
      amountPaid: seat.basePrice,
      paymentMethod,
      paymentDetails,
      status: isDoubleBooked ? 'OVERBOOKED_ERROR' : 'CONFIRMED',
      timestamp: Date.now(),
      threadId: threadName,
      serviceType: 'UNSAFE',
      isDoubleBooked,
    };

    bookingDAO.insertBooking(booking);

    if (isDoubleBooked) {
      auditLogger.log({
        threadName,
        serviceType: 'UNSAFE',
        action: 'OVERBOOKING_DETECTED',
        seatId,
        customerId: customer.id,
        customerName: customer.name,
        message: `CRITICAL ERROR: OVERBOOKING DETECTED! Seat ${seatId} has been booked by ${seat.bookedByCustomerIds.length} customers!`,
        status: 'WARNING',
      });
      return { success: true, booking, overbookingDetected: true };
    }

    auditLogger.log({
      threadName,
      serviceType: 'UNSAFE',
      action: 'BOOKING_CONFIRMED',
      seatId,
      customerId: customer.id,
      customerName: customer.name,
      message: `Booking confirmed for ${customer.name} (Ref: ${booking.bookingRef})`,
      status: 'SUCCESS',
    });

    return { success: true, booking };
  }
}

/**
 * SAFE BOOKING SERVICE
 * -------------------------------------------------------------
 * Eliminates race conditions with atomic fine-grained locking (ReentrantLock equivalent).
 * 1. Atomically acquires an exclusive lock on the specific seat.
 * 2. If lock fails or seat booked, immediately throws SeatNotAvailableException.
 * 3. Holds the lock throughout payment processing.
 * 4. Atomically confirms the booking & transitions state to CONFIRMED.
 * 5. Safely releases lock in finally block.
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
    const seat = this.inventory.getSeat(seatId);
    if (!seat) {
      return { success: false, error: `Seat ${seatId} does not exist.` };
    }

    // 1. Atomic Lock Acquisition
    auditLogger.log({
      threadName,
      serviceType: 'SAFE',
      action: 'LOCK_ATTEMPT',
      seatId,
      customerId: customer.id,
      customerName: customer.name,
      message: `[ATOMIC REENTRANT LOCK] Attempting exclusive lock on seat ${seatId}`,
      status: 'INFO',
    });

    const lockAcquired = this.inventory.acquireSafeLock(seatId, customer.id, 5000);
    if (!lockAcquired) {
      auditLogger.log({
        threadName,
        serviceType: 'SAFE',
        action: 'LOCK_FAILED',
        seatId,
        customerId: customer.id,
        customerName: customer.name,
        message: `Lock acquisition rejected: Seat ${seatId} is already held or booked.`,
        status: 'FAILED',
      });
      return {
        success: false,
        error: new SeatNotAvailableException(seatId).message,
      };
    }

    auditLogger.log({
      threadName,
      serviceType: 'SAFE',
      action: 'LOCK_SUCCESS',
      seatId,
      customerId: customer.id,
      customerName: customer.name,
      message: `Exclusive lock GRANTED for seat ${seatId}. Holding lock during payment...`,
      status: 'SUCCESS',
    });

    try {
      // 2. Process payment under lock protection
      auditLogger.log({
        threadName,
        serviceType: 'SAFE',
        action: 'PAYMENT_START',
        seatId,
        customerId: customer.id,
        customerName: customer.name,
        message: `Executing payment gateway verification ($${seat.basePrice})...`,
        status: 'INFO',
      });

      const paymentResult = await SimulatedPaymentGateway.processPayment(seat.basePrice, 0.02, artificialDelayMs);
      if (!paymentResult.success) {
        throw new PaymentFailureException('Payment gateway declined transaction');
      }

      // 3. Atomically commit booking
      const confirmed = this.inventory.confirmSafeBooking(seatId, customer.id);
      if (!confirmed) {
        throw new SeatNotAvailableException(seatId, 'Failed to commit booking state under lock.');
      }

      const booking: Booking = {
        id: 'BK-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        bookingRef: 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        showId,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        seatId,
        seatCategory: seat.category,
        amountPaid: seat.basePrice,
        paymentMethod,
        paymentDetails,
        status: 'CONFIRMED',
        timestamp: Date.now(),
        threadId: threadName,
        serviceType: 'SAFE',
        isDoubleBooked: false,
      };

      bookingDAO.insertBooking(booking);

      auditLogger.log({
        threadName,
        serviceType: 'SAFE',
        action: 'BOOKING_CONFIRMED',
        seatId,
        customerId: customer.id,
        customerName: customer.name,
        message: `Transaction committed cleanly! Ref: ${booking.bookingRef}. Zero double-booking guarantee honored.`,
        status: 'SUCCESS',
      });

      return { success: true, booking };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown booking exception';
      // Release lock on error
      this.inventory.releaseSafeLock(seatId, customer.id);

      auditLogger.log({
        threadName,
        serviceType: 'SAFE',
        action: 'BOOKING_RELEASED',
        seatId,
        customerId: customer.id,
        customerName: customer.name,
        message: `Transaction aborted (${errorMsg}). Lock safely released.`,
        status: 'FAILED',
      });

      return { success: false, error: errorMsg };
    }
  }
}
