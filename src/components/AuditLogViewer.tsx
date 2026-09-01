import React, { useState, useEffect, useRef } from 'react';
import { AuditLogEntry } from '../types';
import { auditLogger } from '../services/auditLogger';
import { Terminal, Trash2, Download, Search, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterService, setFilterService] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = auditLogger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (filterService !== 'ALL' && log.serviceType !== filterService) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.seatId.toLowerCase().includes(q) ||
        log.customerName.toLowerCase().includes(q) ||
        log.threadName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownload = () => {
    const text = auditLogger.exportAsText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-transactions-${Date.now()}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Live Transaction Audit Log (I/O)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Streaming thread-level lock acquisitions, payment gate cycles, and overbooking anomaly alerts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-download-logs"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Download audit.log file"
          >
            <Download className="w-3.5 h-3.5" />
            Export audit.log
          </button>
          <button
            id="btn-clear-logs"
            onClick={() => auditLogger.clearLogs()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 transition"
            title="Clear in-memory audit logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search thread, seat, customer..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Action Filter */}
        <div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Actions</option>
            <option value="LOCK_ATTEMPT">LOCK_ATTEMPT</option>
            <option value="LOCK_SUCCESS">LOCK_SUCCESS</option>
            <option value="LOCK_FAILED">LOCK_FAILED</option>
            <option value="PAYMENT_START">PAYMENT_START</option>
            <option value="BOOKING_CONFIRMED">BOOKING_CONFIRMED</option>
            <option value="OVERBOOKING_DETECTED">OVERBOOKING_DETECTED</option>
            <option value="BOOKING_RELEASED">BOOKING_RELEASED</option>
          </select>
        </div>

        {/* Service Type */}
        <div>
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Engines (Safe & Unsafe)</option>
            <option value="SAFE">Safe (ReentrantLock)</option>
            <option value="UNSAFE">Unsafe (Unsynchronized)</option>
          </select>
        </div>

        {/* Auto Scroll Checkbox */}
        <div className="flex items-center justify-end">
          <label className="flex items-center gap-2 cursor-pointer text-slate-400 select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded accent-indigo-500"
            />
            <span>Auto-pin to latest logs</span>
          </label>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        ref={logContainerRef}
        className="bg-slate-950 font-mono text-xs rounded-xl border border-slate-800 p-4 h-96 overflow-y-auto space-y-1.5"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Terminal className="w-8 h-8 opacity-40" />
            <p>No audit log entries yet. Run a flash sale simulation or book a seat to view stream.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString();
            let statusIcon = <Info className="w-3 h-3 text-slate-400" />;
            let textColor = 'text-slate-300';

            if (log.action === 'OVERBOOKING_DETECTED') {
              statusIcon = <AlertTriangle className="w-3 h-3 text-rose-400" />;
              textColor = 'text-rose-400 font-bold bg-rose-950/40 p-1 rounded';
            } else if (log.status === 'SUCCESS') {
              statusIcon = <CheckCircle className="w-3 h-3 text-emerald-400" />;
              textColor = 'text-emerald-300';
            } else if (log.status === 'FAILED') {
              statusIcon = <XCircle className="w-3 h-3 text-rose-400" />;
              textColor = 'text-slate-400';
            }

            return (
              <div
                key={log.id}
                className={`flex items-start gap-2 py-0.5 hover:bg-slate-900/60 px-1.5 rounded transition ${textColor}`}
              >
                <span className="shrink-0 mt-0.5">{statusIcon}</span>
                <span className="text-slate-500 shrink-0 select-none">[{timeStr}]</span>
                <span className="text-indigo-400 shrink-0 font-semibold">[{log.threadName}]</span>
                <span
                  className={`shrink-0 text-[10px] px-1 py-0.2 rounded border ${
                    log.serviceType === 'SAFE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {log.serviceType}
                </span>
                <span className="text-amber-300 shrink-0">[{log.action}]</span>
                {log.seatId !== 'ALL' && (
                  <span className="text-cyan-400 shrink-0 font-bold">[{log.seatId}]</span>
                )}
                <span className="truncate flex-1">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
