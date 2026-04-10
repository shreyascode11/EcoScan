import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import ReportModal from './components/ReportModal';
import Leaderboard from './components/Leaderboard';
import { fetchReports, createReport, claimReport, submitCleanup } from './api/reports';
import { SEED_REPORTS } from './data/seedReports';
import { translations } from './i18n/translations';
import './index.css';

export default function App() {
  const [started, setStarted]                 = useState(false);
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [reports, setReports]                 = useState([]);
  const [showModal, setShowModal]             = useState(false);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [pinnedLocation, setPinnedLocation]   = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [lang, setLang]                       = useState(localStorage.getItem('ecoScanLang') || 'en');
  const [modalMode, setModalMode]             = useState('REPORT');
  const [activeReportId, setActiveReportId]   = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isMobile, setIsMobile]               = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('ecoScanLang', lang);
  }, [lang]);

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

  async function handleClaimSpot(id, openProof = false) {
    if (openProof) {
      setActiveReportId(id);
      setModalMode('PROOF');
      setShowModal(true);
      return;
    }

    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'in-progress', volunteer_name: 'Rajdeep Shaw' } : r));
    try { 
      await claimReport(id, 'Rajdeep Shaw'); 
      await loadReports();
    } catch (err) { 
      console.warn('Claim failed:', err.message); 
    }
  }

  async function handleNewReport({ severity, lat, lng, photo, desc, mode, reportId }) {
    if (mode === 'PROOF') {
      try {
        await submitCleanup(reportId, photo);
        await loadReports(); // Refresh everything
      } catch (err) {
        console.warn('Cleanup proof failed:', err.message);
        // Optimistic update if backend fails
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'cleaned', after_image_data: photo, volunteer_name: 'Rajdeep Shaw' } : r));
      }
      return;
    }

    try {
      const newReport = await createReport({ 
        lat, lng, severity, desc, 
        imageData: photo,
        reporter_name: 'Rajdeep Shaw' // [cite: 1]
      });
      setReports(prev => [...prev, newReport]);
      await loadReports();
    } catch (err) {
      console.warn('Create failed, adding locally:', err.message);
      setReports(prev => [...prev, {
        id: Date.now(), lat, lng, severity,
        status: 'reported', desc: desc || 'New waste spot', image_data: photo,
        reporter_name: 'Rajdeep Shaw'
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

  function handleOpenReportModal() {
    setModalMode('REPORT');
    setPickingLocation(false);
    setShowModal(true);
  }

  if (!started) return <LandingPage onGetStarted={() => setStarted(true)} t={t} lang={lang} setLang={setLang} />;

  // Dynamic sidebar width
  const sidebarWidth = sidebarOpen ? 260 : 56;

  return (
    <>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(prev => !prev)}
        onLogout={() => setStarted(false)}
        reports={reports}
        t={t}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
      />
      <Dashboard
        reports={reports}
        t={t}
        lang={lang}
        setLang={setLang}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      />

      {/* Map — adjusts to sidebar width on desktop, full width on mobile */}
      <div
        className="fixed top-[52px] bottom-0 right-0 z-10 transition-all duration-300"
        style={{ left: isMobile ? 0 : sidebarWidth }}
      >
        <MapView
          reports={reports}
          onClaimSpot={handleClaimSpot}
          onMapClick={handleMapClick}
          pickingLocation={pickingLocation}
          t={t}
        />
      </div>

      {loading && (
        <div className="fixed top-16 left-[80px] z-[1100] bg-indigo-500/90 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
          {t.loadingReports}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={handleOpenReportModal}
        className="fixed bottom-7 right-6 z-[1000] w-14 h-14 rounded-full bg-indigo-500
                   text-white border-0 flex items-center justify-center cursor-pointer
                   shadow-[0_8px_30px_rgba(99,102,241,0.5)] hover:scale-105
                   hover:shadow-[0_12px_40px_rgba(99,102,241,0.7)] active:scale-95 transition-all"
        title="Report a waste spot"
      >
        <Plus size={28} />
      </button>

      <div className="fixed bottom-24 right-1/2 -translate-x-1/2 z-[1100] pointer-events-none transition-opacity duration-300"
           style={{ opacity: pickingLocation ? 1 : 0 }}>
        <div className="bg-indigo-500/90 text-white text-[0.82rem] font-semibold px-4 py-2 rounded-full">
          {t.clickToPin}
        </div>
      </div>

      {showModal && (
        <ReportModal
          onClose={() => setShowModal(false)}
          onSubmit={handleNewReport}
          pinnedLocation={pinnedLocation}
          onStartPinning={handleStartPinning}
          mode={modalMode}
          reportId={activeReportId}
          t={t}
        />
      )}

      {showLeaderboard && (
        <Leaderboard
          onClose={() => setShowLeaderboard(false)}
          reports={reports}
          t={t}
        />
      )}
    </>
  );
}