import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import { DEFAULT_CENTER, DEFAULT_ZOOM, SEVERITY_COLOR } from '../data/seedReports';

function MapClickCapture({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick && onMapClick(e.latlng) });
  return null;
}

export default function MapView({ reports, onClaimSpot, onMapClick, pickingLocation, t }) {
  if (!t) return null; // Prevent crash if t is missing

  return (
    <div className="relative w-full h-full">

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickCapture onMapClick={onMapClick} />

        {reports && Array.isArray(reports) && reports.map(report => {
          const isCleaned = report.status === 'cleaned';
          
          return (
            <CircleMarker
              key={report.id}
              center={[report.lat, report.lng]}
              radius={report.severity === 'high' ? 14 : report.severity === 'medium' ? 11 : 9}
              pathOptions={{
                fillColor: SEVERITY_COLOR[report.severity] || '#94a3b8',
                color: report.status === 'in-progress' ? '#f97316' : '#fff',
                weight: 2,
                fillOpacity: isCleaned ? 0.35 : 0.85,
                dashArray: report.status === 'in-progress' ? '4 4' : null,
              }}
            >
              <Popup className="custom-popup">
                <div className="min-w-[210px] max-w-[260px]">
                  <div className="font-bold text-[0.95rem] mb-1 text-slate-100">{report.desc}</div>
                  <div className="text-[0.78rem] text-slate-400 mb-2">
                    {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[0.74rem] font-bold
                      ${report.severity === 'low'    ? 'bg-green-500/15 text-green-400'  : ''}
                      ${report.severity === 'medium' ? 'bg-orange-500/15 text-orange-400' : ''}
                      ${report.severity === 'high'   ? 'bg-red-500/15 text-red-400'      : ''}
                    `}>
                      {t[report.severity]?.toUpperCase() || report.severity.toUpperCase()}
                    </span>
                    {isCleaned && (
                      <span className="bg-green-500/15 text-green-400 px-2.5 py-0.5 rounded-full text-[0.74rem] font-bold uppercase">
                        {t.cleaned}
                      </span>
                    )}
                  </div>

                  {/* Before/After Card */}
                  {isCleaned ? (
                    <div className="mb-3">
                      <div className="text-[0.75rem] font-bold text-slate-500 uppercase tracking-wider mb-2">{t.compareImpact}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/5">
                            <img 
                              src={report.image_data || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=60&w=200'} 
                              alt="Before" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <span className="text-[0.65rem] text-slate-500 text-center font-bold tracking-tight">{t.before}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="relative aspect-square rounded-lg overflow-hidden border border-green-500/30 shadow-[0_4px_12px_rgba(34,197,94,0.15)] bg-white/5">
                            <img 
                              src={report.after_image_data || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=60&w=200'} 
                              alt="After" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <span className="text-[0.65rem] text-green-500 text-center font-bold tracking-tight">{t.after}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 mb-3 bg-white/5">
                      <img 
                        src={report.image_data || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=60&w=200'} 
                        alt="Before" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}

                  {report.status === 'reported' && (
                    <button
                      onClick={() => onClaimSpot(report.id)}
                      className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[0.85rem] rounded-lg cursor-pointer transition-colors border-0"
                    >
                      {t.claimForCleanup}
                    </button>
                  )}
                  {report.status === 'in-progress' && (
                    <div className="flex flex-col gap-2">
                      <div className="text-orange-400 text-[0.8rem] font-semibold">{t.volunteerOnWay}</div>
                      <button
                        onClick={() => onClaimSpot(report.id, true)} 
                        className="w-full py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-bold text-[0.8rem] rounded-lg cursor-pointer transition-colors"
                      >
                        {t.submitProof}
                      </button>
                    </div>
                  )}
                  {isCleaned && report.volunteer_name && (
                    <div className="mt-2 pt-2 border-t border-white/5 text-[0.7rem] text-slate-500 flex justify-between">
                      <span className="italic">Cleaned by {report.volunteer_name}</span>
                      <span className="font-bold text-indigo-400">+{report.severity === 'high' ? 50 : report.severity === 'medium' ? 25 : 10} {t.points}</span>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-26 right-6 z-[1000]
                      bg-[rgba(10,15,30,0.85)] backdrop-blur-md
                      border border-white/[0.08] rounded-xl px-3.5 py-2.5
                      flex flex-col gap-1.5 text-[0.78rem] text-slate-400">
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-400" />{t.low}</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-400" />{t.medium}</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-400" />{t.high}</div>
      </div>
    </div>
  );
}
