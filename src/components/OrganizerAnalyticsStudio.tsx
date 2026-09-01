import React, { useMemo } from 'react';
import { Booking, Show, Seat } from '../types';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Download,
  Sparkles,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
  ShoppingBag
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface OrganizerAnalyticsStudioProps {
  show: Show;
  allBookings: Booking[];
  seats: Seat[];
}

export const OrganizerAnalyticsStudio: React.FC<OrganizerAnalyticsStudioProps> = ({
  show,
  allBookings,
  seats,
}) => {

  // Filter bookings for this show
  const showBookings = useMemo(() => {
    return allBookings.filter((b) => b.showId === show.id && b.status === 'CONFIRMED');
  }, [allBookings, show.id]);

  // Gross Revenue Math
  const totalGrossRevenue = showBookings.reduce((sum, b) => sum + b.amountPaid, 0);
  const totalTicketsSold = showBookings.length;
  const occupancyPercent = seats.length > 0 ? Math.round((totalTicketsSold / seats.length) * 100) : 0;
  const averageOrderValue = totalTicketsSold > 0 ? Math.round(totalGrossRevenue / totalTicketsSold) : 0;

  // Add-on revenue calculation
  const totalAddOnRevenue = showBookings.reduce((sum, b) => {
    if (!b.addOns) return sum;
    return sum + b.addOns.reduce((acc, a) => acc + a.price, 0);
  }, 0);

  // 1. Tier Revenue Breakdown Data
  const tierData = useMemo(() => {
    let vipRev = 0;
    let vipCount = 0;
    let premRev = 0;
    let premCount = 0;
    let regRev = 0;
    let regCount = 0;

    showBookings.forEach((b) => {
      if (b.seatCategory === 'VIP') {
        vipRev += b.amountPaid;
        vipCount++;
      } else if (b.seatCategory === 'PREMIUM') {
        premRev += b.amountPaid;
        premCount++;
      } else {
        regRev += b.amountPaid;
        regCount++;
      }
    });

    return [
      { name: 'VIP Orchestra', tickets: vipCount, revenue: vipRev, fill: '#f59e0b' },
      { name: 'Mezzanine Premium', tickets: premCount, revenue: premRev, fill: '#6366f1' },
      { name: 'Grand Balcony', tickets: regCount, revenue: regRev, fill: '#10b981' },
    ];
  }, [showBookings]);

  // 2. Payment Methods Breakdown
  const paymentMethodData = useMemo(() => {
    const counts: Record<string, number> = {
      'Credit Card': 0,
      'Debit Card': 0,
      UPI: 0,
    };

    showBookings.forEach((b) => {
      if (b.paymentMethod === 'DEBIT_CARD') counts['Debit Card']++;
      else if (b.paymentMethod === 'UPI') counts['UPI']++;
      else counts['Credit Card']++;
    });

    return [
      { name: 'Credit Card', value: counts['Credit Card'] || (showBookings.length > 0 ? 1 : 0), color: '#6366f1' },
      { name: 'Debit Card', value: counts['Debit Card'], color: '#06b6d4' },
      { name: 'UPI / QR', value: counts['UPI'], color: '#10b981' },
    ];
  }, [showBookings]);

  // 3. Sales Velocity Timeline (Hourly / Transaction sequence)
  const velocityData = useMemo(() => {
    if (showBookings.length === 0) {
      return [
        { time: '10:00', tickets: 0, cumulativeRevenue: 0 },
        { time: '12:00', tickets: 0, cumulativeRevenue: 0 },
        { time: '14:00', tickets: 0, cumulativeRevenue: 0 },
        { time: '16:00', tickets: 0, cumulativeRevenue: 0 },
      ];
    }

    const sorted = [...showBookings].sort((a, b) => a.timestamp - b.timestamp);
    let runningRevenue = 0;

    return sorted.map((b, idx) => {
      runningRevenue += b.amountPaid;
      const date = new Date(b.timestamp);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      return {
        time: timeStr || `T+${idx + 1}`,
        tickets: idx + 1,
        cumulativeRevenue: runningRevenue,
        amount: b.amountPaid,
      };
    });
  }, [showBookings]);

  // CSV Manifest Export for Door Attendants
  const handleExportCSV = () => {
    const headers = [
      'Booking Reference',
      'Customer Name',
      'Email',
      'Seat Assigned',
      'Tier Category',
      'Amount Paid ($)',
      'Gate Entrance',
      'Add-On Perks',
      'Transaction Timestamp',
      'ACID Concurrency Mode',
    ];

    const rows = showBookings.map((b) => [
      `"${b.bookingRef}"`,
      `"${b.customerName}"`,
      `"${b.customerEmail}"`,
      `"${b.seatIds ? b.seatIds.join(';') : b.seatId}"`,
      `"${b.seatCategory}"`,
      b.amountPaid,
      `"${b.gateNumber || 'Gate A'}"`,
      `"${b.addOns ? b.addOns.map((a) => a.name).join(' | ') : 'None'}"`,
      `"${new Date(b.timestamp).toISOString()}"`,
      `"${b.serviceType}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TicketCore-Door-Manifest-${show.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="organizer-analytics-studio-container"
      className="space-y-8 animate-in fade-in duration-200"
    >
      {/* HEADER BAR & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl text-indigo-300 shadow-md">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Organizer Revenue & Analytics Studio
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Financial metrics, tier profitability, sales velocity, and door attendant manifest for {show.title}
            </p>
          </div>
        </div>

        {/* CSV Export & Actions */}
        <div className="flex items-center gap-3">
          <button
            id="btn-export-csv-manifest"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Door Scanner CSV</span>
          </button>
        </div>
      </div>

      {/* 4 CORE KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Gross Ticket Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">
              ${totalGrossRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>100% Collected & Cleared</span>
            </div>
          </div>
        </div>

        {/* Occupancy / Fill Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Occupancy & Fill Rate</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">
              {occupancyPercent}%
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <span>{totalTicketsSold} / {seats.length} Total Seats Sold</span>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Average Order Value (AOV)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">
              ${averageOrderValue}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Base ticket + Perks included</span>
            </div>
          </div>
        </div>

        {/* Add-On Merch & Parking Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Add-On & Merch Revenue</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">
              ${totalAddOnRevenue}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-purple-300">
              <span>Parking, T-Shirts, Lounge</span>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Velocity Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Sales Velocity & Cumulative Revenue
              </h3>
              <p className="text-xs text-slate-400">Real-time ticket volume intake trajectory</p>
            </div>
            <span className="text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
              Live Stream
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`$${Number(val) || 0}`, 'Cumulative Gross']}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeRevenue"
                  stroke="#818cf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown Pie Chart (1 col) */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              Payment Methods Share
            </h3>
            <p className="text-xs text-slate-400">Channel distribution of transactions</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-around gap-2 pt-2 border-t border-slate-800/80 text-xs">
            {paymentMethodData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-300 font-medium">{d.name}</span>
                <span className="text-slate-500 text-[10px]">({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TIER REVENUE COMPARISON & RECENT ORDERS TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Revenue Comparison Bar Chart */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Tier Revenue & Ticket Volume Breakdown
          </h3>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => [
                    name === 'revenue' ? `$${val}` : val,
                    name === 'revenue' ? 'Revenue' : 'Tickets Sold',
                  ]}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} name="Revenue ($)" />
                <Bar dataKey="tickets" fill="#06b6d4" radius={[8, 8, 0, 0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Door Attendant Scanner Table Preview */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Door Scanner Live Manifest ({showBookings.length})
            </h3>
            <span className="text-[10px] text-slate-400">Top 5 Recent</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-2">Attendee</th>
                  <th className="pb-2">Seats</th>
                  <th className="pb-2">Gate</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {showBookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="text-slate-300">
                    <td className="py-2.5">
                      <div className="font-semibold text-slate-200">{b.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{b.bookingRef}</div>
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[11px]">
                        {b.seatIds ? b.seatIds.join(', ') : b.seatId}
                      </span>
                    </td>
                    <td className="py-2.5 text-[11px] text-slate-400">
                      {b.gateNumber || 'Gate A'}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                      ${b.amountPaid}
                    </td>
                  </tr>
                ))}
                {showBookings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No ticket orders recorded yet. Run a simulation or book seats above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Ready for optical 2D barcode scanner integration</span>
            <button
              onClick={handleExportCSV}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Full CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
