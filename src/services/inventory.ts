import { Seat, SeatCategory } from '../types';
import { RegularSeat, PremiumSeat, VIPSeat } from './domain';

export class SeatInventory {
  private seats: Map<string, Seat> = new Map();
  // Fine-grained locks per seat for Safe concurrency engine (ReentrantLock equivalent)
  private seatLocks: Map<string, { lockedBy: string; lockExpiry: number }> = new Map();

  constructor(rowCount: number = 6, seatsPerRow: number = 8, basePrice: number = 45) {
    this.initializeSeats(rowCount, seatsPerRow, basePrice);
  }

  public initializeSeats(rowCount: number = 6, seatsPerRow: number = 8, basePrice: number = 45): void {
    this.seats.clear();
    this.seatLocks.clear();

    const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    for (let r = 0; r < rowCount; r++) {
      const rowLetter = rowLetters[r] || String.fromCharCode(65 + r);
      let category: SeatCategory = 'REGULAR';
      if (r === 0) category = 'VIP';
      else if (r === 1 || r === 2) category = 'PREMIUM';

      for (let s = 1; s <= seatsPerRow; s++) {
        const seatId = `${rowLetter}${s}`;
        let seatInstance: Seat;

        if (category === 'VIP') {
          seatInstance = new VIPSeat(seatId, rowLetter, s, basePrice);
          seatInstance.sectionName = 'Orchestra VIP Tier';
          seatInstance.viewAngleRating = '100% Direct Center Stage Sightline';
          seatInstance.perks = ['Backstage Pass Included', 'Complimentary Champagne & Snacks', 'Gate A Priority Fast-Track'];
        } else if (category === 'PREMIUM') {
          seatInstance = new PremiumSeat(seatId, rowLetter, s, basePrice);
          seatInstance.sectionName = 'Mezzanine Premium Tier';
          seatInstance.viewAngleRating = '95% Unobstructed Elevated View';
          seatInstance.perks = ['Dedicated Mezzanine Lounge Bar', 'Padded Ergonomic Seating', 'Gate B Express Entry'];
        } else {
          seatInstance = new RegularSeat(seatId, rowLetter, s, basePrice);
          seatInstance.sectionName = 'Grand Balcony & Stalls';
          seatInstance.viewAngleRating = '88% Panoramic Arena Vista';
          seatInstance.perks = ['Standard Arena Access', 'Nearby Merchandise & Beverage Kiosks'];
        }

        this.seats.set(seatId, seatInstance);
      }
    }
  }

  getAllSeats(): Seat[] {
    return Array.from(this.seats.values());
  }

  getSeat(seatId: string): Seat | undefined {
    return this.seats.get(seatId);
  }

  // --- SAFE LOCKING (Atomic Check-and-Set) ---
  acquireSafeLock(seatId: string, customerId: string, timeoutMs: number = 3000): boolean {
    const seat = this.seats.get(seatId);
    if (!seat || seat.isBooked) {
      return false;
    }

    const now = Date.now();
    const existingLock = this.seatLocks.get(seatId);

    // If locked and not expired, cannot acquire
    if (existingLock && existingLock.lockExpiry > now && existingLock.lockedBy !== customerId) {
      return false;
    }

    // Atomically establish lock
    this.seatLocks.set(seatId, {
      lockedBy: customerId,
      lockExpiry: now + timeoutMs,
    });
    seat.isLocked = true;
    seat.lockedByCustomerId = customerId;
    seat.lockTimestamp = now;
    return true;
  }

  // Atomically acquire multiple seat locks with all-or-nothing rollback
  acquireSafeLocks(seatIds: string[], customerId: string, timeoutMs: number = 600000): boolean {
    const acquired: string[] = [];
    for (const seatId of seatIds) {
      const ok = this.acquireSafeLock(seatId, customerId, timeoutMs);
      if (ok) {
        acquired.push(seatId);
      } else {
        // Rollback already acquired locks
        for (const acq of acquired) {
          this.releaseSafeLock(acq, customerId);
        }
        return false;
      }
    }
    return true;
  }

  releaseSafeLock(seatId: string, customerId: string): void {
    const existing = this.seatLocks.get(seatId);
    if (existing && existing.lockedBy === customerId) {
      this.seatLocks.delete(seatId);
      const seat = this.seats.get(seatId);
      if (seat && !seat.isBooked) {
        seat.isLocked = false;
        seat.lockedByCustomerId = undefined;
        seat.lockTimestamp = undefined;
      }
    }
  }

  releaseSafeLocks(seatIds: string[], customerId: string): void {
    for (const seatId of seatIds) {
      this.releaseSafeLock(seatId, customerId);
    }
  }

  confirmSafeBooking(seatId: string, customerId: string): boolean {
    const seat = this.seats.get(seatId);
    if (!seat) return false;

    // Must hold the active lock and not already booked
    const existingLock = this.seatLocks.get(seatId);
    if (!existingLock || existingLock.lockedBy !== customerId) {
      return false;
    }
    if (seat.isBooked) {
      return false;
    }

    seat.isBooked = true;
    seat.isLocked = false;
    seat.bookedByCustomerIds.push(customerId);
    this.seatLocks.delete(seatId);
    return true;
  }

  confirmSafeBookings(seatIds: string[], customerId: string): boolean {
    // Verify all can be confirmed
    for (const seatId of seatIds) {
      const seat = this.seats.get(seatId);
      const lock = this.seatLocks.get(seatId);
      if (!seat || !lock || lock.lockedBy !== customerId || seat.isBooked) {
        return false;
      }
    }
    for (const seatId of seatIds) {
      this.confirmSafeBooking(seatId, customerId);
    }
    return true;
  }

  // --- UNSAFE BOOKING (Demonstrates TOCTOU / Check-Then-Act Race Condition) ---
  // In unsafe mode: Thread reads isBooked (it's false), pauses for processing/payment,
  // then blindly writes isBooked = true, allowing multiple threads to confirm the same seat!
  unsafeCheckAvailable(seatId: string): boolean {
    const seat = this.seats.get(seatId);
    return seat ? !seat.isBooked : false;
  }

  unsafeConfirmBooking(seatId: string, customerId: string): void {
    const seat = this.seats.get(seatId);
    if (seat) {
      seat.isBooked = true;
      seat.bookedByCustomerIds.push(customerId);
    }
  }

  resetAll(): void {
    for (const seat of this.seats.values()) {
      seat.isBooked = false;
      seat.isLocked = false;
      seat.bookedByCustomerIds = [];
      seat.lockedByCustomerId = undefined;
      seat.lockTimestamp = undefined;
    }
    this.seatLocks.clear();
  }
}
