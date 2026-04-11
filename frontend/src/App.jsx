import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import ReportModal from './components/ReportModal';
import Leaderboard from './components/Leaderboard';
import { translations } from './i18n/translations';
import { Plus } from 'lucide-react';
import { fetchReports, createReport, claimReport, submitCleanup } from './api/reports';
import { SEED_REPORTS } from './data/seedReports';
import './index.css';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [lang, setLang] = useState(localStorage.getItem('ecoScanLang') || 'en');
  const [reports, setReports] = useState([]);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('REPORT');
  const [activeReportId, setActiveReportId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapMode, setMapMode] = useState(localStorage.getItem('ecoScanMapMode') || 'street');

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('ecoscan_user') || '';
  });

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('ecoScanLang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('ecoScanMapMode', mapMode);
  }, [mapMode]);

  useEffect(() => {
    loadReports();
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await fetchReports();
      setReports(data || SEED_REPORTS);
    } catch (err) {
      console.warn('API error, using seeds');
      setReports(SEED_REPORTS);
    }
    setLoading(false);
  }

  const handleGetStarted = (name) => {
    const trimmedName = name.trim();
    if (trimmedName) {
      setUserName(trimmedName);
      localStorage.setItem('ecoscan_user', trimmedName);
    }
    setShowLanding(false);
  };

  async function handleClaimSpot(id, openProof = false) {
    if (openProof) {
      setActiveReportId(id);
      setModalMode('PROOF');
      setShowModal(true);
      return;
    }

    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'in-progress', volunteer_name: userName } : r));
    try { 
      await claimReport(id, userName); 
      await loadReports();
    } catch (err) { 
      console.warn('Claim failed:', err.message); 
    }
  }

  async function handleNewReport({ severity, lat, lng, photo, desc, landmark, mode, reportId }) {
    if (mode === 'PROOF') {
      try {
        await submitCleanup(reportId, photo, userName);
        await loadReports(); 
      } catch (err) {
        console.warn('Cleanup proof failed:', err.message);
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'cleaned', after_image_data: photo, volunteer_name: userName } : r));
      }
      return;
    }

    try {
      const newReport = await createReport({ 
        lat, lng, severity, desc, landmark,
        imageData: photo,
        reporter_name: userName
      });
      setReports(prev => [...prev, newReport]);
      await loadReports();
    } catch (err) {
      console.warn('Create failed, adding locally:', err.message);
      setReports(prev => [...prev, {
        id: Date.now(), lat, lng, severity,
        status: 'reported', desc: desc || t.newWasteSpot, landmark, image_data: photo,
        reporter_name: userName
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

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} t={t} lang={lang} setLang={setLang} />;
  }

  const sidebarWidth = isSidebarOpen ? 312 : 67;

  return (
    <div>
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(prev => !prev)}
        onLogout={() => {
          localStorage.removeItem('ecoscan_user');
          setUserName('');
          setShowLanding(true);
        }}
        reports={reports}
        t={t}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        userName={userName}
      />
      <Dashboard
        reports={reports}
        t={t}
        lang={lang}
        setLang={setLang}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        mapMode={mapMode}
        setMapMode={setMapMode}
        userName={userName}
      />

      <div
        className="fixed top-[92px] bottom-0 right-0 z-10 transition-all duration-300"
        style={{ left: (isMobile || !isSidebarOpen) ? 0 : sidebarWidth }}
      >
        <MapView
          reports={reports}
          onClaimSpot={handleClaimSpot}
          onMapClick={handleMapClick}
          pickingLocation={pickingLocation}
          t={t}
          mapMode={mapMode}
        />
      </div>

      {loading && (
        <div className="fixed top-20 right-6 z-[1100] bg-green-600/90 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg">
          {t.loadingReports}
        </div>
      )}

      <button
        onClick={handleOpenReportModal}
        className="fixed bottom-7 right-6 z-[1000] w-14 h-14 rounded-full btn-green-gradient
                   text-white border-0 flex items-center justify-center cursor-pointer
                   shadow-[0_8px_30px_rgba(34,197,94,0.5)] hover:scale-105 active:scale-95 transition-all"
      >
        <Plus size={28} />
      </button>

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
          t={t}
        />
      )}
    </div>
  );
}