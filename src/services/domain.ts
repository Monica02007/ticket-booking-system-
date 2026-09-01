import { Seat, SeatCategory, Show } from '../types';

export abstract class BaseSeat implements Seat {
  id: string;
  row: string;
  number: number;
  category: SeatCategory;
  basePrice: number;
  isBooked: boolean;
  isLocked: boolean;
  bookedByCustomerIds: string[];
  lockedByCustomerId?: string;
  lockTimestamp?: number;

  constructor(id: string, row: string, number: number, category: SeatCategory, basePrice: number) {
    this.id = id;
    this.row = row;
    this.number = number;
    this.category = category;
    this.basePrice = basePrice;
    this.isBooked = false;
    this.isLocked = false;
    this.bookedByCustomerIds = [];
  }

  abstract calculatePrice(): number;
}

export class RegularSeat extends BaseSeat {
  constructor(id: string, row: string, number: number, basePrice: number = 45) {
    super(id, row, number, 'REGULAR', basePrice);
  }

  calculatePrice(): number {
    return this.basePrice; // Regular = 1.0x
  }
}

export class PremiumSeat extends BaseSeat {
  constructor(id: string, row: string, number: number, basePrice: number = 45) {
    super(id, row, number, 'PREMIUM', basePrice);
  }

  calculatePrice(): number {
    return Math.round(this.basePrice * 1.5); // Premium = 1.5x
  }
}

export class VIPSeat extends BaseSeat {
  constructor(id: string, row: string, number: number, basePrice: number = 45) {
    super(id, row, number, 'VIP', basePrice);
  }

  calculatePrice(): number {
    return Math.round(this.basePrice * 2.5); // VIP = 2.5x includes backstage pass
  }
}

export class SimulatedPaymentGateway {
  static async processPayment(
    _amount: number,
    failRate: number = 0.05,
    simulatedLatencyMs: number = 100
  ): Promise<{ success: boolean; transactionId?: string; errorMessage?: string }> {
    // Artificial latency to mirror network calls
    if (simulatedLatencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, simulatedLatencyMs));
    }

    if (Math.random() < failRate) {
      return {
        success: false,
        errorMessage: 'Payment gateway rejected: Insufficient funds or timeout',
      };
    }

    const txId = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    return {
      success: true,
      transactionId: txId,
    };
  }
}

export const INITIAL_SHOW: Show = {
  id: 'show-taylor-eras-2026',
  title: 'The Eras Mega Concert 2026',
  artist: 'Taylor Swift & Special Guests',
  venue: 'SoFi Grand Arena, Los Angeles',
  dateTime: 'Saturday, Nov 14, 2026 • 7:30 PM PST',
  totalSeats: 48,
  basePrice: 65,
  bannerImage: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80',
};
