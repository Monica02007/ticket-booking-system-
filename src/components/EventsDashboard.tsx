import React, { useState, useMemo } from 'react';
import { Show } from '../types';
import { SeatInventory } from '../services/inventory';
import { Calendar, MapPin, Search, Plus, ArrowRight, Compass } from 'lucide-react';

interface EventsDashboardProps {
  events: Show[];
  activeShowId: string;
  onSelectEvent: (event: Show) => void;
  onOpenHostModal: () => void;
  getEventInventory: (show: Show) => SeatInventory;
}

export const EventsDashboard: React.FC<EventsDashboardProps> = ({
  events,
  activeShowId,
  onSelectEvent,
  onOpenHostModal,
  getEventInventory,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((ev) => {
      if (ev.category) set.add(ev.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesCategory =
        selectedCategory === 'ALL' || ev.category?.toUpperCase() === selectedCategory.toUpperCase();
      const text = `${ev.title} ${ev.artist} ${ev.venue} ${ev.city || ''} ${ev.tags?.join(' ') || ''}`.toLowerCase();
      const matchesSearch = text.includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [events, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Dashboard Top Banner & Host Event Action */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Compass className="w-3.5 h-3.5" />
              <span>Multi-Event Flash Sale Hub</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Live Shows & Event Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Discover concerts, theatrical premieres, and esports grand finals. Each event features isolated concurrent seat inventories and real-time locking engines.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={onOpenHostModal}
              id="btn-open-host-event"
              className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span>Host / Create Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            id="input-search-events"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by artist, title, city..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat === 'ALL' ? 'All Events' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((show) => {
          const isCurrentActive = show.id === activeShowId;
          const inv = getEventInventory(show);
          const allSeats = inv.getAllSeats();
          const bookedCount = allSeats.filter((s) => s.isBooked).length;
          const availableCount = allSeats.length - bookedCount;
          const occupancyPercent = Math.round((bookedCount / (allSeats.length || 1)) * 100);

          return (
            <div
              key={show.id}
              className={`flex flex-col bg-slate-900 border rounded-2xl overflow-hidden shadow-lg transition-all duration-200 group hover:-translate-y-1 hover:shadow-2xl ${
                isCurrentActive
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Event Poster Banner */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                <img
                  src={show.bannerImage}
                  alt={show.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                {/* Category & Status Pill */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 backdrop-blur text-indigo-300 border border-indigo-500/30 shadow">
                    {show.category || 'Concert'}
                  </span>
                  {isCurrentActive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                      Active Stage
                    </span>
                  )}
                </div>

                {/* Price Pill */}
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-slate-950/90 text-emerald-400 border border-slate-700 shadow">
                    From ${show.basePrice}
                  </span>
                </div>

                {/* Bottom of poster: Title & Artist */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-base font-bold text-white tracking-tight leading-snug line-clamp-1">
                    {show.title}
                  </h3>
                  <p className="text-xs text-indigo-300 font-medium truncate">{show.artist}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{show.dateTime}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{show.venue}</span>
                  </div>

                  {show.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 pt-1 border-t border-slate-800/80">
                      {show.description}
                    </p>
                  )}

                  {/* Tags */}
                  {show.tags && show.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {show.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded bg-slate-950 text-[10px] text-slate-400 border border-slate-800 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Occupancy Metric Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-slate-400">Live Availability</span>
                    <span className={availableCount > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {availableCount} of {allSeats.length} seats left ({occupancyPercent}% booked)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        occupancyPercent > 80
                          ? 'bg-rose-500'
                          : occupancyPercent > 40
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action: Select Event */}
                <button
                  onClick={() => onSelectEvent(show)}
                  id={`btn-select-event-${show.id}`}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
                    isCurrentActive
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                  }`}
                >
                  <span>{isCurrentActive ? 'Viewing Seat Map' : 'Select & Book Seats'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No matching events found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or host a new event to publish it directly to the dashboard.
          </p>
          <button
            onClick={onOpenHostModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
          >
            Host New Event Now
          </button>
        </div>
      )}
    </div>
  );
};
