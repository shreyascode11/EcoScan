import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import ReportModal from './components/ReportModal';
import Leaderboard from './components/Leaderboard';
import Toast from './components/Toast';
import ThemeSwitcher from './components/ThemeSwitcher';
import StatsDrawer from './components/StatsDrawer';
import { translations } from './i18n/translations';
import { Plus } from 'lucide-react';
import { fetchCurrentUser, loginUser, registerUser } from './api/auth';
import { fetchReports, createReport, claimReport, submitCleanup, unclaimReport } from './api/reports';
import './index.css';


export default function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('ecoscan_session')) || null;
    } catch {
      return null;
    }
  });
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
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [mapMode, setMapMode] = useState(localStorage.getItem('ecoScanMapMode') || 'street');
  const [toast, setToast] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('ecoScanTheme') || 'midnight';
  });
  const [showStats, setShowStats] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null); // null = show all
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const t = { ...translations.en, ...(translations[lang] || {}) };

  useEffect(() => {
    localStorage.setItem('ecoScanLang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('ecoScanTheme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('ecoScanMapMode', mapMode);
  }, [mapMode]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!session?.token) {
      setReports([]);
      return;
    }
    loadReports();

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const wsBase = apiBaseUrl.replace(/^http/, 'ws');
    const socketUrl = import.meta.env.VITE_WS_URL || `${wsBase.endsWith('/') ? wsBase.slice(0, -1) : wsBase}/ws/updates`;
    const socket = new WebSocket(socketUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_REPORT') {
          setReports(prev => {
            if (prev.some(r => r.id === data.report.id)) return prev;
            return [data.report, ...prev];
          });
        } else if (data.type === 'REPORT_UPDATED') {
          setReports(prev => prev.map(r => r.id === data.report.id ? data.report : r));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };

    socket.onclose = () => console.log('WebSocket disconnected');

    return () => {
      socket.close();
    };
  }, [session?.token]);

  useEffect(() => {
    if (!session?.token) return;

    let ignore = false;
    async function syncSession() {
      try {
        const { user } = await fetchCurrentUser(session.token);
        if (!ignore) {
          setSession(prev => {
            if (!prev) return null;
            const nextSession = { ...prev, user };
            sessionStorage.setItem('ecoscan_session', JSON.stringify(nextSession));
            return nextSession;
          });
        }
      } catch (error) {
        // Only log out if the backend explicitly returned a 401 Unauthorized status.
        // Temporary network issues or server errors should not clear the session.
        if (!ignore && error?.response?.status === 401) {
          sessionStorage.removeItem('ecoscan_session');
          setSession(null);
        }
      }
    }

    syncSession();
    return () => {
      ignore = true;
    };
  }, [session?.token]);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await fetchReports();
      setReports(data || []);
      setLastRefreshed(Date.now());
    } catch (err) {
      if (err?.response?.status === 401) {
        sessionStorage.removeItem('ecoscan_session');
        setSession(null);
      }
      console.warn('Failed to load reports:', err.message);
      setReports([]);
    }
    setLoading(false);
  }

  function formatApiError(error, fallbackMessage) {
    const detail = error?.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => {
          const fieldPath = Array.isArray(item?.loc) ? item.loc.slice(1).join(' ') : '';
          const message = item?.msg || 'Invalid input';
          return fieldPath ? `${fieldPath}: ${message}` : message;
        })
        .join('. ');
    }
    return fallbackMessage;
  }

  async function handleAuthenticate(credentials) {
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = credentials.mode === 'register'
        ? await registerUser(credentials)
        : await loginUser(credentials);

      const nextSession = {
        token: response.token,
        user: response.user,
      };
      sessionStorage.setItem('ecoscan_session', JSON.stringify(nextSession));
      setSession(nextSession);
    } catch (error) {
      setAuthError(formatApiError(error, t.authFailed));
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleClaimSpot(id, openProof = false) {
    if (session?.user?.role !== 'volunteer') {
      setToast({ message: t.volunteerOnlyAction, type: 'error' });
      return;
    }

    if (openProof) {
      setActiveReportId(id);
      setModalMode('PROOF');
      setShowModal(true);
      return;
    }

    const backupReports = [...reports];
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'in-progress', volunteer_name: session.user.name } : r));
    try { 
      await claimReport(id); 
      await loadReports();
      setToast({ message: t.toastClaimSuccess || 'Spot claimed! Happy cleaning!', type: 'success' });
    } catch (err) { 
      setReports(backupReports);
      if (err?.response?.status === 401) {
        sessionStorage.removeItem('ecoscan_session');
        setSession(null);
      }
      setToast({ message: err?.response?.data?.detail || 'Claim failed.', type: 'error' });
    }
  }

  async function handleUnclaimSpot(id) {
    if (session?.user?.role !== 'volunteer') {
      setToast({ message: t.volunteerOnlyAction, type: 'error' });
      return;
    }

    const backupReports = [...reports];
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'reported', volunteer_name: null } : r));
    try {
      await unclaimReport(id);
      await loadReports();
      setToast({ message: t.toastUnclaimSuccess || 'Claim released successfully.', type: 'success' });
    } catch (err) {
      setReports(backupReports);
      if (err?.response?.status === 401) {
        sessionStorage.removeItem('ecoscan_session');
        setSession(null);
      }
      setToast({ message: err?.response?.data?.detail || 'Failed to cancel claim.', type: 'error' });
    }
  }

  async function handleNewReport({ severity, lat, lng, photo, desc, landmark, mode, reportId }) {
    if (mode === 'PROOF') {
      try {
        const res = await submitCleanup(reportId, photo);
        await loadReports(); 
        if (res?.verification?.status === 'approved') {
          const awardMsg = lang === 'hi' 
            ? `सत्यापन स्वीकृत! +${res.points_awarded} अंक मिले!` 
            : `Cleanup approved! +${res.points_awarded} points awarded!`;
          setToast({ message: awardMsg, type: 'success' });
        } else if (res?.verification?.status === 'rejected') {
          const rejectMsg = lang === 'hi'
            ? `सत्यापन विफल: ${res.verification.summary || 'तस्वीरें मेल नहीं खातीं।'}`
            : `Verification failed: ${res.verification.summary || 'Images do not match.'}`;
          setToast({ message: rejectMsg, type: 'error' });
        } else {
          setToast({ message: t.toastCleanSuccess || 'Cleanup proof submitted!', type: 'info' });
        }

        if (res && res.points_awarded > 0) {
          setSession(prev => {
            if (!prev) return null;
            const updatedUser = {
              ...prev.user,
              score: prev.user.score + res.points_awarded,
              cleanups: prev.user.cleanups + 1
            };
            const nextSession = { ...prev, user: updatedUser };
            sessionStorage.setItem('ecoscan_session', JSON.stringify(nextSession));
            return nextSession;
          });
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          sessionStorage.removeItem('ecoscan_session');
          setSession(null);
        }
        if (err?.response?.status !== 401) {
          setToast({ message: err?.response?.data?.detail || t.cleanupFailed, type: 'error' });
        }
      }
      return;
    }

    try {
      const newReport = await createReport({ 
        lat, lng, severity, desc, landmark,
        imageData: photo,
      });
      setReports(prev => [...prev, newReport]);
      await loadReports();
      setToast({ message: t.toastReportSuccess || 'Report submitted successfully!', type: 'success' });
    } catch (err) {
      if (err?.response?.status === 401) {
        sessionStorage.removeItem('ecoscan_session');
        setSession(null);
      }
      if (err?.response?.status !== 401) {
        setToast({ message: err?.response?.data?.detail || t.reportFailed, type: 'error' });
      }
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

  if (!session?.token) {
    return (
      <LandingPage
        onAuthenticate={handleAuthenticate}
        t={t}
        lang={lang}
        setLang={setLang}
        loading={authLoading}
        authError={authError}
      />
    );
  }

  const sidebarWidth = isSidebarOpen ? 268 : 60;

  return (
    <div className={`theme-${currentTheme} min-h-screen bg-black text-white`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(prev => !prev)}
        onLogout={() => {
          sessionStorage.removeItem('ecoscan_session');
          setSession(null);
        }}
        reports={reports}
        t={t}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        currentUser={session.user}
      />
      <Dashboard
        reports={reports}
        t={t}
        lang={lang}
        setLang={setLang}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onOpenStats={() => setShowStats(true)}
        mapMode={mapMode}
        setMapMode={setMapMode}
        userName={session.user?.name}
        currentTheme={currentTheme}
        onChangeTheme={setCurrentTheme}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        onRefresh={loadReports}
        lastRefreshed={lastRefreshed}
      />

      <div
        className="fixed top-12 bottom-0 right-0 z-10 transition-all duration-300"
        style={{ left: isMobile ? 0 : sidebarWidth }}
      >
        <MapView
          reports={reports.filter(r => {
            if (!activeFilter || activeFilter === 'all') return true;
            // Status-based filters
            if (activeFilter === 'reported')    return r.status === 'reported' || r.status === 'verification-failed';
            if (activeFilter === 'in-progress') return r.status === 'in-progress';
            if (activeFilter === 'cleaned')     return r.status === 'cleaned';
            // Severity-based filters
            return r.severity === activeFilter;
          })}
          onClaimSpot={handleClaimSpot}
          onUnclaimSpot={handleUnclaimSpot}
          onMapClick={handleMapClick}
          pickingLocation={pickingLocation}
          setPickingLocation={setPickingLocation}
          setPinnedLocation={setPinnedLocation}
          t={t}
          mapMode={mapMode}
          currentUser={session.user}
        />
      </div>

      {loading && (
        <div className="fixed top-14 right-4 sm:right-6 z-[1100] bg-emerald-800/90 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
          {t.loadingReports}
        </div>
      )}

      <button
        onClick={handleOpenReportModal}
        className="fixed bottom-6 right-4 sm:bottom-7 sm:right-6 z-[1000] w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700
                   text-white border-0 flex items-center justify-center cursor-pointer
                   shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
      >
        <Plus size={22} />
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
          currentUser={session.user}
        />
      )}

      {showLeaderboard && (
        <Leaderboard
          onClose={() => setShowLeaderboard(false)}
          t={t}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}


      <StatsDrawer
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        reports={reports}
        t={t}
      />
    </div>
  );
}
