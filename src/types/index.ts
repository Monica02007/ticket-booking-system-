export type SeatCategory = 'REGULAR' | 'PREMIUM' | 'VIP';

export type BookingStatus = 'LOCKED' | 'CONFIRMED' | 'CANCELLED' | 'RELEASED' | 'OVERBOOKED_ERROR';

export interface AddOnItem {
  id: string;
  name: string;
  price: number;
  description: string;
  iconName: string;
}

export interface PromoDiscount {
  code: string;
  discountPercent?: number;
  fixedDiscount?: number;
  perk?: string;
  description: string;
}

export interface Seat {
  id: string; // e.g. "A1", "C4"
  row: string;
  number: number;
  category: SeatCategory;
  basePrice: number;
  isBooked: boolean;
  isLocked: boolean;
  bookedByCustomerIds: string[]; // Track if multiple customers booked it (overbooking detection!)
  lockedByCustomerId?: string;
  lockTimestamp?: number;
  viewAngleRating?: string;
  perks?: string[];
  sectionName?: string;
}

export interface Show {
  id: string;
  title: string;
  artist: string;
  venue: string;
  dateTime: string;
  totalSeats: number;
  basePrice: number;
  bannerImage: string;
  category?: 'Concert' | 'Festival' | 'Theatre' | 'Sports' | 'Comedy' | 'Conference';
  city?: string;
  tags?: string[];
  description?: string;
  rows?: number;
  seatsPerRow?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Booking {
  id: string;
  bookingRef: string;
  showId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  seatId: string;
  seatIds?: string[];
  seatCategory: SeatCategory;
  amountPaid: number;
  baseAmount?: number;
  discountAmount?: number;
  promoCode?: string;
  addOns?: AddOnItem[];
  paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI';
  paymentDetails?: string;
  status: BookingStatus;
  timestamp: number;
  threadId?: string;
  serviceType: 'SAFE' | 'UNSAFE';
  isDoubleBooked?: boolean;
  gateNumber?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  threadName: string;
  action: 'LOCK_ATTEMPT' | 'LOCK_SUCCESS' | 'LOCK_FAILED' | 'PAYMENT_START' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'BOOKING_CONFIRMED' | 'BOOKING_RELEASED' | 'OVERBOOKING_DETECTED' | 'SYSTEM_INFO';
  seatId: string;
  customerId: string;
  customerName: string;
  message: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING' | 'INFO';
  serviceType: 'SAFE' | 'UNSAFE';
}

export interface SimulationResult {
  runId: string;
  mode: 'SAFE' | 'UNSAFE';
  totalThreads: number;
  totalTargetSeats: number;
  successfulBookings: number;
  failedBookings: number;
  overbookedSeatsCount: number;
  doubleBookedTransactionsCount: number;
  executionTimeMs: number;
  completedAt: number;
  throughputRps?: number;
  avgLockLatencyMs?: number;
  p99LatencyMs?: number;
}

