import { Booking, Customer } from '../types';

export interface DBQueryLog {
  id: string;
  sql: string;
  params: string[];
  executionTimeMs: number;
  timestamp: number;
  affectedRows: number;
}

class BookingDatabaseDAO {
  private bookings: Booking[] = [];
  private customers: Map<string, Customer> = new Map();
  private queryLogs: DBQueryLog[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.seedDefaultCustomers();
  }

  private seedDefaultCustomers(): void {
    const defaultList: Customer[] = [
      { id: 'CUST-101', name: 'Emma Watson', email: 'emma.w@example.com' },
      { id: 'CUST-102', name: 'Liam Miller', email: 'liam.m@example.com' },
      { id: 'CUST-103', name: 'Sophia Chen', email: 'sophia.c@example.com' },
      { id: 'CUST-104', name: 'Marcus Vance', email: 'marcus.v@example.com' },
      { id: 'CUST-105', name: 'Aria Stark', email: 'aria.s@example.com' },
      { id: 'CUST-106', name: 'David Beckham', email: 'david.b@example.com' },
      { id: 'CUST-107', name: 'Elena Rostova', email: 'elena.r@example.com' },
      { id: 'CUST-108', name: 'Noah James', email: 'noah.j@example.com' },
    ];
    defaultList.forEach((c) => this.customers.set(c.id, c));
  }

  insertBooking(booking: Booking): boolean {
    const start = performance.now();
    this.bookings.unshift(booking);

    // Save customer if new
    if (!this.customers.has(booking.customerId)) {
      this.customers.set(booking.customerId, {
        id: booking.customerId,
        name: booking.customerName,
        email: booking.customerEmail,
      });
    }

    const duration = Math.round((performance.now() - start) * 10) / 10 + 2;
    this.logSQL(
      `INSERT INTO bookings (id, booking_ref, show_id, customer_id, customer_name, customer_email, seat_id, seat_category, amount_paid, status, service_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());`,
      [
        booking.id,
        booking.bookingRef,
        booking.showId,
        booking.customerId,
        booking.customerName,
        booking.customerEmail,
        booking.seatId,
        booking.seatCategory,
        `$${booking.amountPaid}`,
        booking.status,
        booking.serviceType,
      ],
      1,
      duration
    );

    this.notify();
    return true;
  }

  cancelBooking(bookingId: string): boolean {
    const start = performance.now();
    const idx = this.bookings.findIndex((b) => b.id === bookingId);
    if (idx !== -1) {
      this.bookings[idx] = {
        ...this.bookings[idx],
        status: 'CANCELLED',
      };
      const duration = Math.round((performance.now() - start) * 10) / 10 + 2;
      this.logSQL(
        `UPDATE bookings SET status = 'CANCELLED', updated_at = NOW() WHERE id = ?;`,
        [bookingId],
        1,
        duration
      );
      this.notify();
      return true;
    }
    return false;
  }

  getAllBookings(): Booking[] {
    return [...this.bookings];
  }

  getBookingHistoryForCustomer(customerId: string): Booking[] {
    const start = performance.now();
    const filtered = this.bookings.filter((b) => b.customerId === customerId);
    const duration = Math.round((performance.now() - start) * 10) / 10 + 1;
    this.logSQL(
      `SELECT * FROM bookings WHERE customer_id = ? ORDER BY created_at DESC;`,
      [customerId],
      filtered.length,
      duration
    );
    return filtered;
  }

  getBookingsForSeat(seatId: string): Booking[] {
    return this.bookings.filter((b) => b.seatId === seatId && b.status === 'CONFIRMED');
  }

  getAllCustomers(): Customer[] {
    return Array.from(this.customers.values());
  }

  getQueryLogs(): DBQueryLog[] {
    return [...this.queryLogs];
  }

  clearAll(): void {
    this.bookings = [];
    this.queryLogs = [];
    this.seedDefaultCustomers();
    this.logSQL(`TRUNCATE TABLE bookings;`, [], 0, 1.2);
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  private logSQL(sql: string, params: string[], affectedRows: number, executionTimeMs: number): void {
    this.queryLogs.unshift({
      id: 'sql-' + Math.random().toString(36).substring(2, 9),
      sql,
      params,
      affectedRows,
      executionTimeMs,
      timestamp: Date.now(),
    });
    if (this.queryLogs.length > 50) {
      this.queryLogs = this.queryLogs.slice(0, 50);
    }
  }
}

export const bookingDAO = new BookingDatabaseDAO();
