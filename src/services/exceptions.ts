export class CustomBookingException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class SeatNotAvailableException extends CustomBookingException {
  seatId: string;
  constructor(seatId: string, message: string = `Seat ${seatId} is not available (already booked or locked).`) {
    super(message);
    this.seatId = seatId;
  }
}

export class InvalidSeatSelectionException extends CustomBookingException {
  seatId: string;
  constructor(seatId: string, message: string = `Seat ${seatId} is invalid or out of bounds.`) {
    super(message);
    this.seatId = seatId;
  }
}

export class PaymentFailureException extends CustomBookingException {
  constructor(message: string = 'Payment processing failed during transaction checkout.') {
    super(message);
  }
}

export class BookingTimeoutException extends CustomBookingException {
  constructor(message: string = 'Hold lock timed out before customer confirmed payment.') {
    super(message);
  }
}
