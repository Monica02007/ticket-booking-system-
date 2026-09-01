import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Seat } from './types';
import { SeatInventory } from './services/inventory';
import { INITIAL_SHOW } from './services/domain';
import { auditLogger } from './services/auditLogger';
import { bookingDAO } from './services/dbStore';
import { Navbar } from './components/Navbar';
import { ShowBanner } from './components/ShowBanner';
import { SeatMapGrid } from './components/SeatMapGrid';
import { ConcurrencySimulatorPanel } from './components/ConcurrencySimulatorPanel';
import { AuditLogViewer } from './components/AuditLogViewer';
import { DatabaseViewerModal } from './components/DatabaseViewerModal';
import { CustomerBookingModal } from './components/CustomerBookingModal';
import { SeatDetailsModal } from './components/SeatDetailsModal';
import { ArchitectureInfoModal } from './components/ArchitectureInfoModal';

export const App: React.FC = () => {
  // Master in-memory Inventory
  const inventory = useMemo(() => new SeatInventory(6, 8, INITIAL_SHOW.basePrice), []);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [activeTab, setActiveTab] = useState<'seatmap' | 'simulator' | 'audit' | 'database'>('seatmap');
  const [serviceMode, setServiceMode] = useState<'SAFE' | 'UNSAFE'>('SAFE');

  // Modals state
  const [bookingSeat, setBookingSeat] = useState<Seat | null>(null);
  const [inspectSeat, setInspectSeat] = useState<Seat | null>(null);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);

  const refreshSeats = useCallback(() => {
    setSeats(inventory.getAllSeats());
  }, [inventory]);

  useEffect(() => {
    refreshSeats();
  }, [refreshSeats]);

  const handleResetInventory = () => {
    inventory.resetAll();
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

  // Compute live seat statistics
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
        overbookingCount={overbookedSeats}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Concert Header & Global State Bar */}
        <ShowBanner
          show={INITIAL_SHOW}
          serviceMode={serviceMode}
          totalSeats={totalSeats}
          availableSeats={availableSeats}
          bookedSeats={bookedSeats}
          overbookedSeats={overbookedSeats}
        />

        {/* Tab Viewport */}
        {activeTab === 'seatmap' && (
          <div className="space-y-6">
            <SeatMapGrid
              seats={seats}
              onSelectSeat={handleSelectSeat}
              selectedSeatId={bookingSeat?.id || inspectSeat?.id}
            />

            {/* Quick Helper Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-200">Interactive Seat Selection:</span>
                <p>
                  Click any available green seat to complete an individual customer checkout with live lock acquisition.
                </p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-200">Stress Testing:</span>
                <p>
                  Switch to the <strong className="text-indigo-400">Flash Sale Simulator</strong> tab to run 50+ concurrent coroutines against same seats.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'simulator' && (
          <ConcurrencySimulatorPanel
            inventory={inventory}
            seats={seats}
            onRefreshSeats={refreshSeats}
            showId={INITIAL_SHOW.id}
          />
        )}

        {activeTab === 'audit' && <AuditLogViewer />}

        {activeTab === 'database' && <DatabaseViewerModal />}
      </main>

      {/* Modals */}
      {bookingSeat && (
        <CustomerBookingModal
          seat={bookingSeat}
          onClose={() => setBookingSeat(null)}
          inventory={inventory}
          serviceMode={serviceMode}
          showId={INITIAL_SHOW.id}
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
        <p>Ticketing Booking System — Concurrency & Locking Architecture • AI Studio Web Runtime</p>
      </footer>
    </div>
  );
};

export default App;
