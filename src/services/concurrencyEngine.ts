import { Customer, Seat, SimulationResult } from '../types';
import { SeatInventory } from './inventory';
import { SafeBookingService, UnsafeBookingService } from './bookingServices';
import { auditLogger } from './auditLogger';

export interface ThreadTaskState {
  threadId: string;
  customer: Customer;
  targetSeatId: string;
  status: 'PENDING' | 'ACQUIRING' | 'PAYING' | 'SUCCESS' | 'FAILED' | 'OVERBOOKED';
  message: string;
  durationMs?: number;
}

export class ConcurrencySimulatorEngine {
  private isRunning: boolean = false;
  private cancelRequested: boolean = false;

  async runSimulation(
    inventory: SeatInventory,
    mode: 'SAFE' | 'UNSAFE',
    options: {
      threadsCount: number;
      targetSeats: string[]; // e.g. ["A1", "A2", "A3", "A4"] hotspot seats
      showId: string;
      delayMs?: number;
      onThreadUpdate?: (tasks: ThreadTaskState[]) => void;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<SimulationResult> {
    this.isRunning = true;
    this.cancelRequested = false;

    const { threadsCount, targetSeats, showId, delayMs = 60, onThreadUpdate, onProgress } = options;
    const startTime = performance.now();

    const service = mode === 'SAFE' ? new SafeBookingService(inventory) : new UnsafeBookingService(inventory);

    auditLogger.log({
      threadName: 'MAIN-CONTROLLER',
      serviceType: mode,
      action: 'SYSTEM_INFO',
      seatId: 'ALL',
      customerId: 'SYS',
      customerName: 'System Orchestrator',
      message: `⚡ FLASH SALE CONCURRENCY TEST STARTED: Spawning ${threadsCount} concurrent worker threads targeting ${targetSeats.length} high-demand seats in [${mode}] mode.`,
      status: 'INFO',
    });

    const threadTasks: ThreadTaskState[] = [];
    const customerNames = [
      'Alexander Wright', 'Beatrice King', 'Charles Evans', 'Diana Prince', 'Ethan Hunt',
      'Fiona Gallagher', 'George Clark', 'Hannah Abbott', 'Ian Malcolm', 'Julia Roberts',
      'Kevin Bacon', 'Laura Croft', 'Michael Scott', 'Natalie Portman', 'Oliver Queen',
      'Peter Parker', 'Quinn Fabray', 'Rachel Green', 'Steve Rogers', 'Tony Stark',
      'Uma Thurman', 'Victor Creed', 'Wanda Maximoff', 'Xavier Woods', 'Ygritte Snow', 'Zack Taylor'
    ];

    for (let i = 0; i < threadsCount; i++) {
      const name = customerNames[i % customerNames.length] + ` (#${i + 1})`;
      const targetSeatId = targetSeats[i % targetSeats.length];
      threadTasks.push({
        threadId: `Thread-${i + 1 < 10 ? '0' : ''}${i + 1}`,
        customer: {
          id: `CUST-SIM-${1000 + i}`,
          name,
          email: `user${i + 1}@flashsale.demo`,
        },
        targetSeatId,
        status: 'PENDING',
        message: `Queued for seat ${targetSeatId}`,
      });
    }

    if (onThreadUpdate) onThreadUpdate([...threadTasks]);

    let completedCount = 0;
    let successfulCount = 0;
    let failedCount = 0;

    // Launch all concurrent workers concurrently (simulating simultaneous HTTP flash-sale burst)
    const workerPromises = threadTasks.map(async (task) => {
      if (this.cancelRequested) {
        task.status = 'FAILED';
        task.message = 'Simulation aborted';
        return;
      }

      // Small jitter between 0 and 20ms to mimic realistic network packet arrival
      const jitter = Math.random() * 25;
      await new Promise((r) => setTimeout(r, jitter));

      task.status = 'ACQUIRING';
      task.message = `Attempting to reserve seat ${task.targetSeatId}...`;
      if (onThreadUpdate) onThreadUpdate([...threadTasks]);

      const threadStart = performance.now();
      const result = await service.bookSeat(
        showId,
        task.targetSeatId,
        task.customer,
        task.threadId,
        delayMs
      );

      task.durationMs = Math.round(performance.now() - threadStart);

      if (result.success) {
        if (result.overbookingDetected) {
          task.status = 'OVERBOOKED';
          task.message = `⚠️ OVERBOOKED! Double-allocated seat ${task.targetSeatId}`;
        } else {
          task.status = 'SUCCESS';
          task.message = `✅ Confirmed seat ${task.targetSeatId} (${result.booking?.bookingRef})`;
        }
        successfulCount++;
      } else {
        task.status = 'FAILED';
        task.message = `❌ Failed: ${result.error || 'Seat unavailable'}`;
        failedCount++;
      }

      completedCount++;
      if (onProgress) onProgress(completedCount, threadsCount);
      if (onThreadUpdate) onThreadUpdate([...threadTasks]);
    });

    await Promise.all(workerPromises);

    const totalDuration = Math.round(performance.now() - startTime);
    this.isRunning = false;

    // Compute latency stats
    const durations = threadTasks
      .map((t) => t.durationMs || 0)
      .filter((d) => d > 0)
      .sort((a, b) => a - b);
    const avgLockLatencyMs =
      durations.length > 0
        ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
        : Math.round(delayMs * 1.1);
    const p99Index = Math.min(durations.length - 1, Math.floor(durations.length * 0.99));
    const p99LatencyMs = durations.length > 0 ? durations[p99Index] : Math.round(avgLockLatencyMs * 1.4);
    const throughputRps = totalDuration > 0 ? Math.round((threadsCount / (totalDuration / 1000)) * 10) / 10 : 0;

    // Audit inventory seats to detect total double-booked anomalies
    const allSeats: Seat[] = inventory.getAllSeats();
    let overbookedSeatsCount = 0;
    let doubleBookedTransactionsCount = 0;

    for (const seat of allSeats) {
      if (seat.bookedByCustomerIds.length > 1) {
        overbookedSeatsCount++;
        doubleBookedTransactionsCount += (seat.bookedByCustomerIds.length - 1);
      }
    }

    auditLogger.log({
      threadName: 'MAIN-CONTROLLER',
      serviceType: mode,
      action: 'SYSTEM_INFO',
      seatId: 'ALL',
      customerId: 'SYS',
      customerName: 'System Orchestrator',
      message: `🏁 SIMULATION FINISHED in ${totalDuration}ms: Mode=${mode}, Success=${successfulCount}, Failed=${failedCount}, Overbooked Seats=${overbookedSeatsCount} (${doubleBookedTransactionsCount} duplicate ticket sales). Throughput: ${throughputRps} req/sec, Avg Latency: ${avgLockLatencyMs}ms, P99: ${p99LatencyMs}ms.`,
      status: overbookedSeatsCount > 0 ? 'WARNING' : 'SUCCESS',
    });

    return {
      runId: 'RUN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      mode,
      totalThreads: threadsCount,
      totalTargetSeats: targetSeats.length,
      successfulBookings: successfulCount,
      failedBookings: failedCount,
      overbookedSeatsCount,
      doubleBookedTransactionsCount,
      executionTimeMs: totalDuration,
      completedAt: Date.now(),
      throughputRps,
      avgLockLatencyMs,
      p99LatencyMs,
    };
  }

  stop(): void {
    this.cancelRequested = true;
    this.isRunning = false;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const simulatorEngine = new ConcurrencySimulatorEngine();
