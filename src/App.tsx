import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Seat, Show } from './types';
import { SeatInventory } from './services/inventory';
import { INITIAL_SHOWS } from './services/domain';
import { auditLogger } from './services/auditLogger';
import { bookingDAO } from './services/dbStore';
import { Navbar, NavTabType } from './components/Navbar';
import { ShowBanner } from './components/ShowBanner';
import { SeatMapGrid } from './components/SeatMapGrid';
import { ConcurrencySimulatorPanel } from './components/ConcurrencySimulatorPanel';
import { AuditLogViewer } from './components/AuditLogViewer';
import { DatabaseViewerModal } from './components/DatabaseViewerModal';
import { CustomerBookingModal } from './components/CustomerBookingModal';
import { SeatDetailsModal } from './components/SeatDetailsModal';
import { ArchitectureInfoModal } from './components/ArchitectureInfoModal';
import { EventsDashboard } from './components/EventsDashboard';
import { HostEventModal } from './components/HostEventModal';

export const App: React.FC = () => {
  // Multi-event registry state
  const [events, setEvents] = useState<Show[]>(INITIAL_SHOWS);
  const [activeShow, setActiveShow] = useState<Show>(INITIAL_SHOWS[0]);

  // Dedicated inventory instances map per event
  const inventoriesRef = useRef<Map<string, SeatInventory>>(new Map());

  const getEventInventory = useCallback((show: Show): SeatInventory => {
    let inv = inventoriesRef.current.get(show.id);
    if (!inv) {
      const rows = show.rows || 6;
      const cols = show.seatsPerRow || 8;
      inv = new SeatInventory(rows, cols, show.basePrice);
      inventoriesRef.current.set(show.id, inv);
    }
    return inv;
  }, []);

  const currentInventory = getEventInventory(activeShow);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [activeTab, setActiveTab] = useState<NavTabType>('dashboard');
  const [serviceMode, setServiceMode] = useState<'SAFE' | 'UNSAFE'>('SAFE');

  // Modals state
  const [bookingSeat, setBookingSeat] = useState<Seat | null>(null);
  const [inspectSeat, setInspectSeat] = useState<Seat | null>(null);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);
  const [isHostModalOpen, setIsHostModalOpen] = useState<boolean>(false);

  const refreshSeats = useCallback(() => {
    setSeats(currentInventory.getAllSeats());
  }, [currentInventory]);

  useEffect(() => {
    refreshSeats();
  }, [activeShow, refreshSeats]);

  const handleResetInventory = () => {
    currentInventory.resetAll();
    bookingDAO.clearAll();
    auditLogger.clearLogs();
    refreshSeats();
    setBookingSeat(null);
    setInspectSeat(null);
  };

  const handleSelectSeat = (seat: Seat) => {
    if (!seat.isBooked && !seat.isLocked) {
      setBookingSeat(seat);
    } else {
      setInspectSeat(seat);
    }
  };

  const handleSelectEvent = (event: Show) => {
    setActiveShow(event);
    setActiveTab('seatmap');
  };

  const handleAddNewEvent = (newEvent: Show) => {
    // Pre-initialize inventory for new show
    const inv = new SeatInventory(newEvent.rows || 6, newEvent.seatsPerRow || 8, newEvent.basePrice);
    inventoriesRef.current.set(newEvent.id, inv);

    setEvents((prev) => [newEvent, ...prev]);
    setActiveShow(newEvent);
    setActiveTab('seatmap');
  };

  // Compute live seat statistics for currently active event
  const totalSeats = seats.length;
  const bookedSeats = seats.filter((s) => s.isBooked).length;
  const availableSeats = totalSeats - bookedSeats;
  const overbookedSeats = seats.filter((s) => s.bookedByCustomerIds.length > 1).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serviceMode={serviceMode}
        setServiceMode={setServiceMode}
        onReset={handleResetInventory}
        onOpenArchitectureInfo={() => setIsArchitectureModalOpen(true)}
        onOpenHostModal={() => setIsHostModalOpen(true)}
        overbookingCount={overbookedSeats}
        activeShowTitle={activeShow.title}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* EVENTS DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <EventsDashboard
            events={events}
            activeShowId={activeShow.id}
            onSelectEvent={handleSelectEvent}
            onOpenHostModal={() => setIsHostModalOpen(true)}
            getEventInventory={getEventInventory}
          />
        )}

        {/* SEATMAP, SIMULATOR, AUDIT, DATABASE (Active on chosen event) */}
        {activeTab !== 'dashboard' && (
          <>
            {/* Show Header & Global State Bar */}
            <ShowBanner
              show={activeShow}
              serviceMode={serviceMode}
              totalSeats={totalSeats}
              availableSeats={availableSeats}
              bookedSeats={bookedSeats}
              overbookedSeats={overbookedSeats}
              onSwitchEvent={() => setActiveTab('dashboard')}
              onHostEvent={() => setIsHostModalOpen(true)}
            />

            {/* SEAT MAP TAB */}
            {activeTab === 'seatmap' && (
              <div className="space-y-6">
                <SeatMapGrid
                  seats={seats}
                  onSelectSeat={handleSelectSeat}
                  selectedSeatId={bookingSeat?.id || inspectSeat?.id}
                />

                {/* Quick Helper Banners */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-200">Interactive Seat Selection:</span>
                    <p>
                      Click any available green seat to checkout with multi-step attendee info and real-time payment authorization.
                    </p>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-200">Flash Sale Concurrency Simulator:</span>
                    <p>
                      Switch to the <strong className="text-indigo-400">Flash Sale Simulator</strong> tab to run 50+ concurrent coroutines against this event.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATOR TAB */}
            {activeTab === 'simulator' && (
              <ConcurrencySimulatorPanel
                inventory={currentInventory}
                seats={seats}
                onRefreshSeats={refreshSeats}
                showId={activeShow.id}
              />
            )}

            {/* AUDIT LOG TAB */}
            {activeTab === 'audit' && <AuditLogViewer />}

            {/* JDBC DATABASE TAB */}
            {activeTab === 'database' && <DatabaseViewerModal />}
          </>
        )}
      </main>

      {/* Modals */}
      {isHostModalOpen && (
        <HostEventModal
          onClose={() => setIsHostModalOpen(false)}
          onAddEvent={handleAddNewEvent}
        />
      )}

      {bookingSeat && (
        <CustomerBookingModal
          seat={bookingSeat}
          onClose={() => setBookingSeat(null)}
          inventory={currentInventory}
          serviceMode={serviceMode}
          showId={activeShow.id}
          onBookingSuccess={() => {
            refreshSeats();
          }}
        />
      )}

      {inspectSeat && (
        <SeatDetailsModal
          seat={inspectSeat}
          onClose={() => setInspectSeat(null)}
          onOpenBookingModal={(s) => setBookingSeat(s)}
          onRefresh={refreshSeats}
        />
      )}

      {isArchitectureModalOpen && (
        <ArchitectureInfoModal onClose={() => setIsArchitectureModalOpen(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>TicketCore Multi-Event Booking & Concurrency Locking Platform • AI Studio Web Runtime</p>
      </footer>
    </div>
  );
};

export default App;
