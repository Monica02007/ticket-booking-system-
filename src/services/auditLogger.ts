import { AuditLogEntry } from '../types';

class AuditLoggerService {
  private logs: AuditLogEntry[] = [];
  private listeners: ((logs: AuditLogEntry[]) => void)[] = [];

  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };

    // Keep up to last 500 logs in memory for high-frequency simulation
    this.logs.unshift(newEntry);
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(0, 500);
    }

    this.notifyListeners();
    return newEntry;
  }

  getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }

  subscribe(listener: (logs: AuditLogEntry[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.logs]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const copy = [...this.logs];
    this.listeners.forEach((l) => l(copy));
  }

  exportAsText(): string {
    return this.logs
      .map((l) => {
        const time = new Date(l.timestamp).toISOString();
        return `[${time}] [${l.threadName}] [${l.serviceType}] [${l.action}] [Seat: ${l.seatId}] [Customer: ${l.customerName}] - ${l.message} (Status: ${l.status})`;
      })
      .join('\n');
  }
}

export const auditLogger = new AuditLoggerService();
