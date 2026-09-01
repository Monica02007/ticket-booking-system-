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

export const INITIAL_SHOWS: Show[] = [
  {
    id: 'show-taylor-eras-2026',
    title: 'The Eras Global Stadium Tour',
    artist: 'Taylor Swift & Special Guests',
    venue: 'SoFi Grand Arena, Los Angeles',
    dateTime: 'Saturday, Nov 14, 2026 • 7:30 PM PST',
    totalSeats: 48,
    basePrice: 65,
    bannerImage: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80',
    category: 'Concert',
    city: 'Los Angeles, CA',
    tags: ['Pop', 'Stadium Tour', 'Flash Sale Hotspot'],
    description: 'The monumental worldwide stadium tour celebrating all musical eras with spectacular visual stage effects.',
    rows: 6,
    seatsPerRow: 8,
  },
  {
    id: 'show-coldplay-music-spheres',
    title: 'Music of the Spheres World Tour',
    artist: 'Coldplay',
    venue: 'Wembley National Stadium, London',
    dateTime: 'Friday, Dec 18, 2026 • 8:00 PM GMT',
    totalSeats: 48,
    basePrice: 75,
    bannerImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    category: 'Concert',
    city: 'London, UK',
    tags: ['Rock/Pop', 'LED Wristbands', 'Sustainable Tour'],
    description: 'Immersive stadium experience featuring kinetic dancefloors, solar-powered laser systems, and acoustic anthems.',
    rows: 6,
    seatsPerRow: 8,
  },
  {
    id: 'show-tomorrowland-winter-2026',
    title: 'Tomorrowland Winter Electronic Festival',
    artist: 'Martin Garrix, David Guetta, Armin van Buuren',
    venue: 'Alpe d\'Huez Ice Arena, France',
    dateTime: 'Saturday, Jan 23, 2027 • 9:00 PM CET',
    totalSeats: 48,
    basePrice: 90,
    bannerImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    category: 'Festival',
    city: 'Alpe d\'Huez, France',
    tags: ['EDM', 'Winter Festival', 'Pyrotechnics'],
    description: 'High-energy electronic dance festival bringing the world\'s greatest DJs to breathtaking snowy mountain peaks.',
    rows: 6,
    seatsPerRow: 8,
  },
  {
    id: 'show-hamilton-broadway',
    title: 'Hamilton: An American Musical',
    artist: 'Lin-Manuel Miranda & Original Broadway Cast',
    venue: 'Richard Rodgers Theatre, New York City',
    dateTime: 'Sunday, Oct 25, 2026 • 7:00 PM EST',
    totalSeats: 48,
    basePrice: 110,
    bannerImage: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
    category: 'Theatre',
    city: 'New York, NY',
    tags: ['Broadway', 'Tony Winner', 'Hip-Hop Musical'],
    description: 'The story of America then, told by America now, blending hip-hop, jazz, R&B, and standard Broadway theatre.',
    rows: 6,
    seatsPerRow: 8,
  },
  {
    id: 'show-valorant-champions-finals',
    title: 'Valorant Champions Grand Finals 2026',
    artist: 'Riot Games Esports Arena',
    venue: 'Olympic Gymnastics Arena (KSPO Dome), Seoul',
    dateTime: 'Saturday, Dec 05, 2026 • 5:00 PM KST',
    totalSeats: 48,
    basePrice: 55,
    bannerImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    category: 'Sports',
    city: 'Seoul, South Korea',
    tags: ['Esports', 'World Finals', 'Live Trophy Match'],
    description: 'The ultimate battle for the world crown between North America, EMEA, Pacific, and China champion rosters.',
    rows: 6,
    seatsPerRow: 8,
  }
];

export const INITIAL_SHOW: Show = INITIAL_SHOWS[0];
