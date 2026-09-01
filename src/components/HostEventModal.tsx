import React, { useState } from 'react';
import { Show } from '../types';
import { Plus, Sparkles, Calendar, DollarSign, Layout } from 'lucide-react';

interface HostEventModalProps {
  onClose: () => void;
  onAddEvent: (newEvent: Show) => void;
}

const PRESET_BANNERS = [
  {
    label: 'Concert & Arena',
    url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'EDM & Festival',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Theatre & Broadway',
    url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Esports & Gaming',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Standup Comedy',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Tech Conference',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
  },
];

export const HostEventModal: React.FC<HostEventModalProps> = ({ onClose, onAddEvent }) => {
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('');
  const [venue, setVenue] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [dateTime, setDateTime] = useState<string>('Saturday, Dec 20, 2026 • 8:00 PM');
  const [category, setCategory] = useState<Show['category']>('Concert');
  const [basePrice, setBasePrice] = useState<number>(65);
  const [rows, setRows] = useState<number>(6);
  const [seatsPerRow, setSeatsPerRow] = useState<number>(8);
  const [bannerImage, setBannerImage] = useState<string>(PRESET_BANNERS[0].url);
  const [tagsInput, setTagsInput] = useState<string>('Live, Tour, Exclusive');
  const [description, setDescription] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSeats = rows * seatsPerRow;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Event title is required.';
    if (!artist.trim()) newErrors.artist = 'Artist or Host / Organizer name is required.';
    if (!venue.trim()) newErrors.venue = 'Venue name is required.';
    if (!city.trim()) newErrors.city = 'City / Location is required.';
    if (basePrice <= 0) newErrors.basePrice = 'Base price must be greater than $0.';
    if (rows < 2 || rows > 10) newErrors.rows = 'Rows must be between 2 and 10.';
    if (seatsPerRow < 4 || seatsPerRow > 12) newErrors.seatsPerRow = 'Seats per row must be between 4 and 12.';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 24);
      const newShow: Show = {
        id: `show-${slug}-${Date.now().toString().slice(-4)}`,
        title: title.trim(),
        artist: artist.trim(),
        venue: `${venue.trim()}, ${city.trim()}`,
        city: city.trim(),
        dateTime: dateTime.trim(),
        totalSeats,
        basePrice: Number(basePrice),
        bannerImage: bannerImage || PRESET_BANNERS[0].url,
        category,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        description:
          description.trim() ||
          `Exclusive live experience at ${venue.trim()} featuring ${artist.trim()}. Secure your seats now with synchronized instant locking.`,
        rows: Number(rows),
        seatsPerRow: Number(seatsPerRow),
      };

      onAddEvent(newShow);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Host / Create New Event</h2>
              <p className="text-xs text-slate-400">
                Publish a new concert, musical, festival or arena show with an isolated seat inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Event Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">Event Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Neon Nights Symphony Tour"
                className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none ${
                  errors.title ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                }`}
              />
              {errors.title && <p className="text-[11px] text-rose-400 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Show['category'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Concert">Concert</option>
                <option value="Festival">Festival</option>
                <option value="Theatre">Theatre</option>
                <option value="Sports">Sports & Esports</option>
                <option value="Comedy">Comedy</option>
                <option value="Conference">Conference</option>
              </select>
            </div>
          </div>

          {/* Artist & City / Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Artist / Performer / Host *</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Dua Lipa or Riot Games"
                className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none ${
                  errors.artist ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                }`}
              />
              {errors.artist && <p className="text-[11px] text-rose-400 mt-1">{errors.artist}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Venue Name *</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Madison Square Garden"
                className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none ${
                  errors.venue ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                }`}
              />
              {errors.venue && <p className="text-[11px] text-rose-400 mt-1">{errors.venue}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">City / Region *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New York, NY"
                className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none ${
                  errors.city ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                }`}
              />
              {errors.city && <p className="text-[11px] text-rose-400 mt-1">{errors.city}</p>}
            </div>
          </div>

          {/* Date & Base Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Date & Time String</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  placeholder="e.g. Saturday, Dec 20, 2026 • 8:00 PM"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Base Ticket Price ($ USD) *</label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className={`w-full bg-slate-950 border rounded-xl pl-8 pr-3.5 py-2 text-slate-200 focus:outline-none ${
                    errors.basePrice ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                  }`}
                />
              </div>
              {errors.basePrice && <p className="text-[11px] text-rose-400 mt-1">{errors.basePrice}</p>}
            </div>
          </div>

          {/* Venue Seating Layout Dimensions */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-indigo-400" />
                Venue Seating Grid Matrix
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[11px] font-mono border border-indigo-500/20">
                {totalSeats} Total Seats ({rows} Rows × {seatsPerRow} Cols)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-400 mb-1">Number of Rows (2 to 10)</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Seats per Row (4 to 12)</label>
                <input
                  type="number"
                  min="4"
                  max="12"
                  value={seatsPerRow}
                  onChange={(e) => setSeatsPerRow(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              Rows A-B become VIP (2.5x price), Row C-D become Premium (1.5x price), and remaining rows are Regular tier.
            </p>
          </div>

          {/* Banner Image Presets */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Select Poster / Banner Style</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_BANNERS.map((preset) => {
                const isSelected = bannerImage === preset.url;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setBannerImage(preset.url)}
                    className={`relative rounded-lg overflow-hidden border transition group ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-12 object-cover"
                    />
                    <span className="block text-[9px] font-medium text-slate-300 bg-slate-950/80 text-center py-0.5 truncate px-1">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Hashtags (Comma Separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Pop, Stadium, Live2026"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Brief Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High energy stadium show with laser production..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publish & Host Event</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
