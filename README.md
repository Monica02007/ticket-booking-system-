# Ticketing Booking System — Flash Sale Overbooking Fix

Basic project skeleton for the assignment: redesign, implement, and prove the
correctness of a concert-ticket booking core in Java (OOP + Collections +
Concurrency + Exceptions + JDBC, with a bonus Swing dashboard).

## Project structure

```
ticketing-booking-system/
├── pom.xml
├── README.md
├── logs/
│   └── audit.log                 (created at runtime by AuditLogger)
└── src/main/java/com/booking/
    ├── Main.java                 Entry point — runs before/after demos
    ├── model/                    Part A — OOP domain model
    │   ├── Seat.java             abstract base (encapsulated, no public fields)
    │   ├── RegularSeat.java      extends Seat, overrides calculatePrice()
    │   ├── PremiumSeat.java      extends Seat, overrides calculatePrice()
    │   ├── VIPSeat.java          extends Seat, overrides calculatePrice()
    │   ├── Show.java
    │   ├── Customer.java
    │   ├── Booking.java          LOCKED / CONFIRMED / CANCELLED / RELEASED
    │   └── Payment.java          simulated payment gateway
    ├── exceptions/                Part C — custom checked exceptions
    │   ├── SeatNotAvailableException.java
    │   ├── InvalidSeatSelectionException.java
    │   ├── PaymentFailureException.java
    │   └── BookingTimeoutException.java
    ├── inventory/                 Part B — Collection Framework
    │   └── SeatInventory.java    ConcurrentHashMap + CopyOnWriteArrayList
    ├── service/                   Part C — booking core
    │   ├── UnsafeBookingService.java   "before" — unsynchronized (buggy)
    │   └── SafeBookingService.java     "after"  — ReentrantLock, atomic
    ├── concurrency/                Part C — stress test demos
    │   ├── UnsynchronizedDemo.java     reproduces the overbooking bug
    │   └── SynchronizedDemo.java       proves zero overbooking
    ├── db/                         Part D — JDBC persistence
    │   ├── DBConnection.java     connection factory (edit URL/user/pass)
    │   └── BookingDAO.java       PreparedStatement CRUD + history query
    ├── gui/                        Part E — bonus
    │   └── AdminDashboard.java   Swing seat map (green/red) + counter
    └── util/
        └── AuditLogger.java     Java I/O transaction audit log
```

## How to run

1. **Before/after concurrency demo (no DB needed):**
   ```
   javac -d out $(find src -name "*.java")
   java -cp out com.booking.Main
   ```
   This runs `UnsynchronizedDemo` first (capture this console output as your
   "before" evidence showing overbooking), then `SynchronizedDemo` (capture
   this as "after" evidence showing zero double-bookings). Both also write
   to `logs/audit.log`.

2. **JDBC persistence (Part D):**
   - Uncomment the relevant driver dependency in `pom.xml`.
   - Update `DBConnection.java` with your DB URL / user / password.
   - Call `BookingDAO.createTableIfNotExists()` once, then
     `insertBooking()` / `cancelBooking()` / `getBookingHistoryForCustomer()`
     from your own test/main class.
   - Take before/after screenshots of the `bookings` table as evidence.

3. **Swing dashboard (bonus, Part E):**
   ```
   java -cp out com.booking.gui.AdminDashboard
   ```

## Notes

- This is a **structural skeleton**, intentionally kept lean — flesh out
  error handling, add JUnit tests, wire the DAO into the booking services
  (e.g. call `insertBooking()` inside `SafeBookingService.book()` after a
  CONFIRMED status), and add report screenshots/log excerpts as required by
  the rubric.
- Report sections (Problem Understanding, Application of Course Knowledge,
  Analysis & Trade-offs, Reflection, References, etc.) are not included here
  — only the code structure — and should be written up separately per
  Section E of the assignment.
