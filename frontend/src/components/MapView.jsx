import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;
const SEVERITY_COLOR = {
  low: '#059669',
  medium: '#ffcc00',
  high: '#ff0033',
};

function MapClickCapture({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick && onMapClick(e.latlng) });
  return null;
}

const createSolidIcon = (color, size, isCleaning, isMyClaim) => {
  return L.divIcon({
    className: 'solid-marker-container',
    html: `
      <div class="solid-marker-inner ${isCleaning ? 'pulse' : ''}" 
           style="background-color: ${isMyClaim ? '#10b981' : color}; 
                  width: ${size}px; 
                  height: ${size}px; 
                  color: ${isMyClaim ? '#10b981' : color};
                  border: 2px solid ${isMyClaim ? '#a7f3d0' : '#ffffff'};
                  box-shadow: 0 0 12px ${isMyClaim ? 'rgba(16,185,129,0.7)' : 'rgba(0,0,0,0.5)'};">
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createSnapchatHeatIcon = (report, t, currentUser) => {
  const isCleaned = report.status === 'cleaned';
  
  let gradient = '';
  let borderGlow = '';
  if (isCleaned) {
    gradient = 'radial-gradient(circle, rgba(148, 163, 184, 0.45) 0%, rgba(100, 116, 139, 0.2) 45%, transparent 70%)';
    borderGlow = 'border-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)] bg-slate-800';
  } else if (report.severity === 'high') {
    gradient = 'radial-gradient(circle, rgba(239, 68, 68, 0.8) 0%, rgba(245, 158, 11, 0.45) 35%, rgba(16, 185, 129, 0.1) 65%, transparent 80%)';
    borderGlow = 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] bg-red-950/90';
  } else if (report.severity === 'medium') {
    gradient = 'radial-gradient(circle, rgba(245, 158, 11, 0.75) 0%, rgba(234, 179, 8, 0.4) 40%, rgba(16, 185, 129, 0.1) 70%, transparent 80%)';
    borderGlow = 'border-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.5)] bg-yellow-950/90';
  } else {
    gradient = 'radial-gradient(circle, rgba(16, 185, 129, 0.7) 0%, rgba(20, 184, 166, 0.3) 45%, transparent 75%)';
    borderGlow = 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] bg-emerald-950/90';
  }

  const activeUser = isCleaned ? report.volunteer_name : (report.volunteer_name || report.reporter_name || 'U');
  const initials = activeUser
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isMe = activeUser === currentUser?.name;
  
  // Dynamic English/Hindi support
  const isHi = currentUser?.lang === 'hi' || (t && Object.values(t).includes('मेरा सक्रिय कार्य')) || false;
  const labelText = isMe ? (isHi ? 'मैं' : 'Me') : activeUser;
  const statusLabel = isCleaned 
    ? (isHi ? 'साफ किया' : 'Cleaned')
    : report.status === 'in-progress' 
      ? (isHi ? 'सफाई जारी' : 'On it!') 
      : (isHi ? 'कचरा' : 'Spot');

  return L.divIcon({
    className: 'snapchat-heat-marker-container',
    html: `
      <div class="relative flex items-center justify-center" style="width: 120px; height: 120px;">
        <!-- Glowing Heat Blob (Snapchat Map style density) -->
        <div class="absolute inset-0 rounded-full" style="background: ${gradient}; filter: blur(5px); mix-blend-mode: screen;"></div>
        
        <!-- Floating Avatar Bubble in Center -->
        <div class="absolute flex flex-col items-center justify-center snapchat-avatar-bounce">
          <div class="relative w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[0.62rem] font-bold text-white tracking-wider ${borderGlow}">
            ${initials}
            <div class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-black shadow-sm"></div>
          </div>
          
          <div class="mt-1 bg-black/90 border border-white/10 px-2 py-0.5 rounded-full text-[0.52rem] font-bold text-white tracking-wide shadow-md whitespace-nowrap">
            <span class="text-emerald-400">${labelText}</span>
            <span class="text-slate-400 font-medium ml-1">${statusLabel}</span>
          </div>
        </div>
      </div>
    `,
    iconSize: [120, 120],
    iconAnchor: [60, 60]
  });
};

export default function MapView({ 
  reports, 
  onClaimSpot, 
  onUnclaimSpot,
  onMapClick, 
  pickingLocation, 
  setPickingLocation, 
  setPinnedLocation, 
  t, 
  mapMode, 
  currentUser 
}) {
  const [heatmapMode, setHeatmapMode] = useState(false);

  if (!t) return null; 

  const isSatellite = mapMode === 'satellite';
  
  const tileUrl = isSatellite
    ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
    : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

  const attribution = '&copy; <a href="https://www.google.com/mapmaker">Google</a>';

  const filterClass = isSatellite ? 'dark-map-filter' : 'street-map-filter';
  const pickingClass = pickingLocation ? 'picking-location' : '';

  const mapCenter = reports?.length ? [reports[0].lat, reports[0].lng] : DEFAULT_CENTER;

  return (
    <div className={`relative w-full h-full transition-all duration-700 ${filterClass} ${pickingClass}`}>
      
      {/* Location Picking Banner */}
      {pickingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 px-4 py-2.5 sm:px-6 sm:py-3.5 bg-black/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl shadow-2xl">
          <span className="text-[0.75rem] sm:text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            📍 {t.clickToPin || 'Click anywhere on the map to drop a pin'}
          </span>
          <button
            onClick={() => {
              setPickingLocation(false);
              setPinnedLocation(null);
            }}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[0.65rem] font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer border border-white/10"
          >
            {t.cancel || 'Cancel'}
          </button>
        </div>
      )}

      {/* Heatmap Toggle Button */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        <button
          onClick={() => setHeatmapMode(prev => !prev)}
          className={`px-4 py-2.5 rounded-xl text-[0.72rem] font-black uppercase tracking-widest cursor-pointer transition-all border-0 shadow-lg flex items-center gap-2
            ${heatmapMode 
              ? 'bg-emerald-500 text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5' 
              : 'bg-black/95 text-white/50 hover:text-white/80 hover:bg-black border border-white/[0.08]'}`}
        >
          <span>🔥</span>
          <span>{t.heatmapMode || 'Heatmap View'}</span>
        </button>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution={attribution}
          url={tileUrl}
          key={mapMode} 
        />
        <MapClickCapture onMapClick={onMapClick} />

        {reports && Array.isArray(reports) && reports.map(report => {
          const isCleaned = report.status === 'cleaned';
          const isCleaning = report.status === 'in-progress';
          const isMyClaim = report.status === 'in-progress' && report.volunteer_name === currentUser?.name;
          
          const markerColor = isCleaned ? '#64748b' : (SEVERITY_COLOR[report.severity] || '#94a3b8');
          
          // Snapchat Heatmap Mode
          if (heatmapMode) {
            const heatIcon = createSnapchatHeatIcon(report, t, currentUser);
            return (
              <Marker
                key={report.id}
                position={[report.lat, report.lng]}
                icon={heatIcon}
              >
                <Popup className="custom-popup">
                  <div className="min-w-[220px] max-w-[280px] p-1">
                    <div className="font-black text-[1rem] mb-1.5 text-white leading-tight">{report.desc}</div>
                    
                    {report.landmark && (
                      <div className="flex items-center gap-1.5 mb-2 text-[0.75rem] font-bold text-emerald-600/80">
                        <span>📍</span>
                        <span>{report.landmark}</span>
                      </div>
                    )}

                    <div className="text-[0.72rem] text-slate-500 mb-3 font-bold">
                      {t.coord}: {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                    </div>

                    {/* Location Verification Status */}
                    {report.loc_verification_status === 'approved' && (
                      <div className="flex items-center gap-1.5 mb-3 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg text-[0.68rem] text-emerald-400 font-bold uppercase tracking-wider w-max">
                        <span className="text-[0.8rem]">✅</span>
                        <span>{t.locationVerified || 'Location Verified'}</span>
                      </div>
                    )}
                    {report.loc_verification_status === 'rejected' && (
                      <div className="flex flex-col gap-1 mb-3 bg-red-500/10 border border-red-500/25 px-2.5 py-1.5 rounded-lg text-[0.68rem] text-red-400">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                          <span className="text-[0.8rem]">⚠️</span>
                          <span>{t.locationMismatch || 'Location Mismatch'}</span>
                        </div>
                        {report.loc_verification_summary && (
                          <span className="text-[0.6rem] text-red-300/80 leading-normal font-medium">{report.loc_verification_summary}</span>
                        )}
                      </div>
                    )}
                    {report.loc_verification_status === 'pending' && (
                      <div className="flex items-center gap-1.5 mb-3 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg text-[0.68rem] text-blue-400 font-bold uppercase tracking-wider w-max animate-pulse">
                        <span className="text-[0.8rem]">🔍</span>
                        <span>{t.verifyingLocation || 'Verifying Location...'}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      <span className={`inline-block px-3 py-1 rounded-lg text-[0.68rem] font-black uppercase tracking-widest
                        ${report.severity === 'low'    ? 'bg-[#059669]/15 text-[#059669]'  : ''}
                        ${report.severity === 'medium' ? 'bg-[#ffcc00]/15 text-[#ffcc00]' : ''}
                        ${report.severity === 'high'   ? 'bg-[#ff0033]/15 text-[#ff0033]'      : ''}
                      `}>
                        {t[report.severity] || report.severity}
                      </span>
                      {isCleaned ? (
                        <span className="bg-emerald-600/15 text-emerald-500 px-3 py-1 rounded-lg text-[0.68rem] font-black uppercase tracking-widest">
                          {t.cleaned}
                        </span>
                      ) : report.status === 'pending-review' ? (
                        <span className="bg-blue-500/15 text-blue-400 px-3 py-1 rounded-lg text-[0.68rem] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                          {t.aiReview}
                        </span>
                      ) : isMyClaim ? (
                        <span className="bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-lg text-[0.68rem] font-black uppercase tracking-widest">
                          {t.myClaimedSpot || 'My Task'}
                        </span>
                      ) : null}
                    </div>

                    {report.after_image ? (
                      <div className="mb-4">
                        <div className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-2.5">{t.compareImpact}</div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="flex flex-col gap-1.5">
                            <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black shadow-sm">
                              {report.before_image
                                ? <img src={report.before_image} alt="Before" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-white/20 text-[0.65rem] font-bold uppercase tracking-widest">{t.noPhoto}</div>
                              }
                            </div>
                            <span className="text-[0.62rem] text-slate-500 text-center font-black tracking-widest uppercase">{t.before}</span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className="relative aspect-square rounded-xl overflow-hidden border border-emerald-600/30 shadow-[0_4px_15px_rgba(5,150,105,0.2)] bg-black">
                              {report.status === 'pending-review' && (
                                  <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                      <div className="flex flex-col items-center gap-1">
                                           <div className="w-6 h-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                                           <span className="text-[0.5rem] font-black text-emerald-600 uppercase tracking-widest">{t.verifying}</span>
                                      </div>
                                  </div>
                              )}
                              <img src={report.after_image} alt="After" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[0.62rem] text-emerald-600 text-center font-black tracking-widest uppercase">{t.after}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 mb-4 bg-black shadow-md">
                        {report.before_image
                          ? <img src={report.before_image} alt="Before" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-white/20 text-[0.65rem] font-bold uppercase tracking-widest">{t.noPhotoUploaded}</div>
                        }
                      </div>
                    )}

                    {report.status === 'reported' && currentUser?.role === 'volunteer' && (
                      <button
                        onClick={() => onClaimSpot(report.id)}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[0.75rem] rounded-xl cursor-pointer transition-all shadow-md hover:shadow-lg uppercase tracking-wider border-0"
                      >
                        {t.claimForCleanup}
                      </button>
                    )}
                    {report.status === 'reported' && currentUser?.role !== 'volunteer' && (
                      <div className="text-[0.68rem] text-slate-500 font-semibold uppercase tracking-wider text-center py-1.5">
                        {t.volunteerOnlyAction}
                      </div>
                    )}
                    {report.status === 'in-progress' && (
                      <div className="flex flex-col gap-2">
                        <div className="text-[#ffcc00] text-[0.7rem] font-bold uppercase tracking-wider text-center mb-1">
                          {isMyClaim ? t.myClaimedSpot : t.volunteerOnWay}
                        </div>
                        {isMyClaim && (
                          <>
                            <button
                              onClick={() => onClaimSpot(report.id, true)} 
                              className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-[0.75rem] rounded-xl cursor-pointer transition-all uppercase tracking-wider"
                            >
                              {t.submitProof}
                            </button>
                            <button
                              onClick={() => onUnclaimSpot(report.id)}
                              className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-[0.75rem] rounded-xl cursor-pointer transition-all uppercase tracking-wider"
                            >
                              {t.cancelClaim || 'Cancel Claim'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {report.status === 'pending-review' && (
                      <div className="mt-2.5 pt-2.5 border-t border-white/5 text-[0.68rem] text-blue-300 font-medium">
                        {report.verification_summary || t.pendingReview}
                      </div>
                    )}
                    {report.status === 'verification-failed' && (
                      <div className="mt-2.5 pt-2.5 border-t border-white/5 text-[0.68rem] text-red-300 font-medium">
                        {report.verification_summary || t.verificationFailed}
                      </div>
                    )}
                    {isCleaned && report.volunteer_name && (
                      <div className="mt-2.5 pt-2.5 border-t border-white/5 text-[0.68rem] text-slate-400 flex justify-between items-center px-0.5">
                        <span className="font-semibold italic">{t.cleanedBy} {report.volunteer_name}</span>
                        <span className="font-bold text-emerald-400 text-[0.78rem]">+{report.severity === 'high' ? 50 : report.severity === 'medium' ? 25 : 10} {t.points}</span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          }

          const size = report.severity === 'high' ? 28 : report.severity === 'medium' ? 22 : 18;
          const icon = createSolidIcon(markerColor, size, isCleaning, isMyClaim);

          return (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              icon={icon}
              opacity={isCleaned ? 0.7 : 1}
            >
              <Popup className="custom-popup">
                <div className="min-w-[220px] max-w-[280px] p-1">
                  <div className="font-black text-[1rem] mb-1.5 text-white leading-tight">{report.desc}</div>
                  
                  {report.landmark && (
                    <div className="flex items-center gap-1.5 mb-2 text-[0.75rem] font-bold text-emerald-600/80">
                      <span>📍</span>
                      <span>{report.landmark}</span>
                    </div>
                  )}

                  <div className="text-[0.72rem] text-slate-500 mb-3 font-bold">
                    {t.coord}: {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                  </div>

                  {/* Location Verification Status */}
                  {report.loc_verification_status === 'approved' && (
                    <div className="flex items-center gap-1.5 mb-3 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg text-[0.68rem] text-emerald-400 font-bold uppercase tracking-wider w-max">
                      <span className="text-[0.8rem]">✅</span>
                      <span>{t.locationVerified || 'Location Verified'}</span>
                    </div>
                  )}
                  {report.loc_verification_status === 'rejected' && (
                    <div className="flex flex-col gap-1 mb-3 bg-red-500/10 border border-red-500/25 px-2.5 py-1.5 rounded-lg text-[0.68rem] text-red-400">
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                        <span className="text-[0.8rem]">⚠️</span>
                        <span>{t.locationMismatch || 'Location Mismatch'}</span>
                      </div>
                      {report.loc_verification_summary && (
                        <span className="text-[0.6rem] text-red-300/80 leading-normal font-medium">{report.loc_verification_summary}</span>
                      )}
                    </div>
                  )}
                  {report.loc_verification_status === 'pending' && (
                    <div className="flex items-center gap-1.5 mb-3 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg text-[0.68rem] text-blue-400 font-bold uppercase tracking-wider w-max animate-pulse">
                      <span className="text-[0.8rem]">🔍</span>
                      <span>{t.verifyingLocation || 'Verifying Location...'}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-block px-3 py-1 rounded-lg text-[0.68rem] font-black uppercase tracking-widest
                      ${report.severity === 'low'    ? 'bg-[#059669]/15 text-[#059669]'  : ''}
                      ${report.severity === 'medium' ? 'bg-[#ffcc00]/15 text-[#ffcc00]' : ''}
                      ${report.severity === 'high'   ? 'bg-[#ff0033]/15 text-[#ff0033]'      : ''}
                    `}>
                      {t[report.severity] || report.severity}
                    </span>
                    {isCleaned ? (
                      <span className="bg-emerald-600/15 text-emerald-500 px-3 py-1 rounded-lg text-[0.68rem] font-black uppercase tracking-widest">
                        {t.cleaned}
                      </span>
                    ) : report.status === 'pending-review' ? (
                      <span className="bg-blue-500/15 text-blue-400 px-3 py-1 rounded-lg text-[0.68rem] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                        {t.aiReview}
                      </span>
                    ) : isMyClaim ? (
                      <span className="bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-lg text-[0.68rem] font-black uppercase tracking-widest">
                        {t.myClaimedSpot || 'My Task'}
                      </span>
                    ) : null}
                  </div>

                  {report.after_image ? (
                    <div className="mb-4">
                      <div className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-2.5">{t.compareImpact}</div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1.5">
                          <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black shadow-sm">
                            {report.before_image
                              ? <img src={report.before_image} alt="Before" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-white/20 text-[0.65rem] font-bold uppercase tracking-widest">{t.noPhoto}</div>
                            }
                          </div>
                          <span className="text-[0.62rem] text-slate-500 text-center font-black tracking-widest uppercase">{t.before}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="relative aspect-square rounded-xl overflow-hidden border border-emerald-600/30 shadow-[0_4px_15px_rgba(5,150,105,0.2)] bg-black">
                            {report.status === 'pending-review' && (
                                <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-1">
                                         <div className="w-6 h-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                                         <span className="text-[0.5rem] font-black text-emerald-600 uppercase tracking-widest">{t.verifying}</span>
                                    </div>
                                </div>
                            )}
                            <img src={report.after_image} alt="After" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[0.62rem] text-emerald-600 text-center font-black tracking-widest uppercase">{t.after}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 mb-4 bg-black shadow-md">
                      {report.before_image
                        ? <img src={report.before_image} alt="Before" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white/20 text-[0.65rem] font-bold uppercase tracking-widest">{t.noPhotoUploaded}</div>
                      }
                    </div>
                  )}

                  {report.status === 'reported' && currentUser?.role === 'volunteer' && (
                    <button
                      onClick={() => onClaimSpot(report.id)}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[0.75rem] rounded-xl cursor-pointer transition-all shadow-md hover:shadow-lg uppercase tracking-wider border-0"
                    >
                      {t.claimForCleanup}
                    </button>
                  )}
                  {report.status === 'reported' && currentUser?.role !== 'volunteer' && (
                    <div className="text-[0.68rem] text-slate-500 font-semibold uppercase tracking-wider text-center py-1.5">
                      {t.volunteerOnlyAction}
                    </div>
                  )}
                  {report.status === 'in-progress' && (
                    <div className="flex flex-col gap-2">
                      <div className="text-[#ffcc00] text-[0.7rem] font-bold uppercase tracking-wider text-center mb-1">
                        {isMyClaim ? t.myClaimedSpot : t.volunteerOnWay}
                      </div>
                      {isMyClaim && (
                        <>
                          <button
                            onClick={() => onClaimSpot(report.id, true)} 
                            className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-[0.75rem] rounded-xl cursor-pointer transition-all uppercase tracking-wider"
                          >
                            {t.submitProof}
                          </button>
                          <button
                            onClick={() => onUnclaimSpot(report.id)}
                            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-[0.75rem] rounded-xl cursor-pointer transition-all uppercase tracking-wider"
                          >
                            {t.cancelClaim || 'Cancel Claim'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {report.status === 'pending-review' && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 text-[0.68rem] text-blue-300 font-medium">
                      {report.verification_summary || t.pendingReview}
                    </div>
                  )}
                  {report.status === 'verification-failed' && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 text-[0.68rem] text-red-300 font-medium">
                      {report.verification_summary || t.verificationFailed}
                    </div>
                  )}
                  {isCleaned && report.volunteer_name && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 text-[0.68rem] text-slate-400 flex justify-between items-center px-0.5">
                      <span className="font-semibold italic">{t.cleanedBy} {report.volunteer_name}</span>
                      <span className="font-bold text-emerald-400 text-[0.78rem]">+{report.severity === 'high' ? 50 : report.severity === 'medium' ? 25 : 10} {t.points}</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-[5.5rem] sm:bottom-28 right-4 sm:right-6 z-[1000]
                      bg-black/90 backdrop-blur-md
                      border border-white/[0.06] rounded-xl px-4 py-3.5
                      flex flex-col gap-2.5 text-[0.68rem] text-slate-300 shadow-2xl font-semibold uppercase tracking-wider">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#059669] shadow-[0_0_8px_#059669]" />
          {t.low}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#ffcc00] shadow-[0_0_8px_#ffcc00]" />
          {t.medium}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#ff0033] shadow-[0_0_8px_#ff0033]" />
          {t.high}
        </div>
        <div className="pt-2 mt-1 border-t border-white/[0.05] flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#64748b] shadow-[0_0_8px_#64748b]" />
          {t.cleaned}
        </div>
      </div>
    </div>
  );
}
