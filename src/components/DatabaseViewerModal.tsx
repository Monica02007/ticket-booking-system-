import React, { useState, useEffect } from 'react';
import { Booking, Customer } from '../types';
import { bookingDAO, DBQueryLog } from '../services/dbStore';
import { Database, Search, Code, CheckCircle, XCircle, AlertOctagon, RotateCcw, User, Clock } from 'lucide-react';

export const DatabaseViewerModal: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [queryLogs, setQueryLogs] = useState<DBQueryLog[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'queries'>('bookings');

  const loadData = () => {
    setBookings(bookingDAO.getAllBookings());
    setCustomers(bookingDAO.getAllCustomers());
    setQueryLogs(bookingDAO.getQueryLogs());
  };

  useEffect(() => {
    loadData();
    const unsub = bookingDAO.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleCancelBooking = (bookingId: string) => {
    bookingDAO.cancelBooking(bookingId);
  };

  const handleClearDatabase = () => {
    bookingDAO.clearAll();
  };

  const filteredBookings = bookings.filter((b) => {
    if (selectedCustomerId !== 'ALL' && b.customerId !== selectedCustomerId) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        b.bookingRef.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.seatId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">JDBC Persistence & SQL Data Store (Part D)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            PreparedStatement CRUD records, customer transaction histories, and query latency telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('bookings')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                activeSubTab === 'bookings' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bookings Table ({bookings.length})
            </button>
            <button
              onClick={() => setActiveSubTab('queries')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                activeSubTab === 'queries' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SQL Query Logs ({queryLogs.length})
            </button>
          </div>

          <button
            onClick={handleClearDatabase}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Truncate
          </button>
        </div>
      </div>

      {activeSubTab === 'bookings' ? (
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search reference, customer, seat..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Customers ({customers.length})</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end text-slate-400 text-xs font-mono">
              <span>Showing {filteredBookings.length} database records</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Seat</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Engine</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No booking records found in database.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 text-cyan-400 font-bold">{b.bookingRef}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {b.seatId}
                        </span>
                        <span className="ml-1 text-[10px] text-slate-400">({b.seatCategory})</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-sans font-medium text-slate-200">{b.customerName}</div>
                        <div className="text-[10px] text-slate-500">{b.customerEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">${b.amountPaid}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            b.serviceType === 'SAFE'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {b.serviceType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {b.isDoubleBooked || b.status === 'OVERBOOKED_ERROR' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                            <AlertOctagon className="w-3 h-3" />
                            OVERBOOKED
                          </span>
                        ) : b.status === 'CONFIRMED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle className="w-3 h-3" />
                            CONFIRMED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            <XCircle className="w-3 h-3" />
                            CANCELLED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {new Date(b.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {b.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="px-2 py-1 text-[11px] font-sans font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-950/60 rounded border border-rose-800/60 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* SQL Query Logs */
        <div className="space-y-3 font-mono text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-96 overflow-y-auto space-y-2.5">
            {queryLogs.length === 0 ? (
              <p className="text-slate-500">No SQL queries executed yet.</p>
            ) : (
              queryLogs.map((q) => (
                <div key={q.id} className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-cyan-400 font-bold">
                      <Code className="w-3.5 h-3.5" />
                      PreparedStatement Query
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      {q.executionTimeMs}ms • {q.affectedRows} row(s) affected
                    </span>
                  </div>
                  <div className="text-emerald-300 break-all">{q.sql}</div>
                  {q.params.length > 0 && (
                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-500">Params: </span>
                      {JSON.stringify(q.params)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
