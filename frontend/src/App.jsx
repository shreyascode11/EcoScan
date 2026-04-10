import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import ReportModal from './components/ReportModal';
import { fetchReports, createReport, claimReport } from './api/reports';
import { SEED_REPORTS } from './data/seedReports';
import './index.css';

export default function App() {
  const [started, setStarted]                 = useState(false);
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [reports, setReports]                 = useState([]);
  const [showModal, setShowModal]             = useState(false);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [pinnedLocation, setPinnedLocation]   = useState(null);
  const [loading, setLoading]                 = useState(false);

  useEffect(() => {
    if (!started) return;
    loadReports();
  }, [started]);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await fetchReports();
      setReports(data);
    } catch (err) {
      console.warn('Backend unavailable, using seed data:', err.message);
      setReports(SEED_REPORTS);
    }
    setLoading(false);
  }

  async function handleClaimSpot(id) {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'in-progress' } : r));
    try { await claimReport(id); } catch (err) { console.warn('Claim failed:', err.message); }
  }

  async function handleNewReport({ severity, lat, lng, photo, desc }) {
    try {
      const newReport = await createReport({ lat, lng, severity, desc });
      setReports(prev => [...prev, newReport]);
    } catch (err) {
      console.warn('Create failed, adding locally:', err.message);
      setReports(prev => [...prev, {
        id: Date.now(), lat, lng, severity,
        status: 'reported', desc: desc || 'New waste spot', photo,
      }]);
    }
    setPickingLocation(false);
    setPinnedLocation(null);
  }

  function handleMapClick(latlng) {
    if (!pickingLocation) return;
    setPinnedLocation({ lat: latlng.lat, lng: latlng.lng });
    setPickingLocation(false);
    setShowModal(true);
  }

  function handleStartPinning() {
    setPinnedLocation(null);
    setPickingLocation(true);
    setShowModal(false);
  }

  if (!started) return <LandingPage onGetStarted={() => setStarted(true)} />;

  // Dynamic sidebar width
  const sidebarWidth = sidebarOpen ? 260 : 56;

  return (
    <>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(prev => !prev)}
        onLogout={() => setStarted(false)}
      />
      <Dashboard reports={reports} />

      {/* Map — adjusts to sidebar width */}
      <div
        className="fixed top-[52px] bottom-0 right-0 z-10 transition-all duration-300"
        style={{ left: sidebarWidth }}
      >
        <MapView
          reports={reports}
          onClaimSpot={handleClaimSpot}
          onMapClick={handleMapClick}
          pickingLocation={pickingLocation}
        />
      </div>

      {loading && (
        <div className="fixed top-16 left-[80px] z-[1100] bg-indigo-500/90 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
          Loading reports...
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setShowModal(true); setPickingLocation(false); }}
        className="fixed bottom-7 right-6 z-[1000] w-14 h-14 rounded-full bg-indigo-500
                   text-white border-0 flex items-center justify-center cursor-pointer
                   shadow-[0_8px_30px_rgba(99,102,241,0.5)] hover:scale-105
                   hover:shadow-[0_12px_40px_rgba(99,102,241,0.7)] active:scale-95 transition-all"
        title="Report a waste spot"
      >
        <Plus size={28} />
      </button>

      {showModal && (
        <ReportModal
          onClose={() => setShowModal(false)}
          onSubmit={handleNewReport}
          pinnedLocation={pinnedLocation}
          onStartPinning={handleStartPinning}
        />
      )}
    </>
  );
}