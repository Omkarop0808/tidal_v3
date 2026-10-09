import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, Crosshair } from 'lucide-react';

const CENTER_POS: [number, number] = [19.06, 72.82];
const BASE_POS: [number, number] = [18.9100, 72.8250]; // Colaba Naval Dock

interface LiveMapProps {
  hotspots?: any[];
  selectedZoneIndex?: number;
  onSelectZone?: (index: number) => void;
  isFleetDispatched?: boolean;
}

// Controller component to smoothly pan/zoom to selected hotspot and open popup
const MapController = ({ 
  selectedHotspot, 
  selectedZoneIndex,
  markerRefs 
}: { 
  selectedHotspot?: any; 
  selectedZoneIndex: number;
  markerRefs: React.MutableRefObject<Record<number, L.Marker | null>>;
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedHotspot && selectedHotspot.lat && selectedHotspot.lon) {
      map.flyTo([selectedHotspot.lat, selectedHotspot.lon], 13, {
        duration: 0.9,
        easeLinearity: 0.25
      });

      // Auto-open marker popup after flight begins
      const timer = setTimeout(() => {
        const marker = markerRefs.current[selectedZoneIndex];
        if (marker) {
          marker.openPopup();
        }
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [selectedZoneIndex, selectedHotspot, map, markerRefs]);

  return null;
};

const createHotspotIcon = (h: any, isSelected: boolean) => {
  const isCritical = h.severity?.toLowerCase() === 'critical' || (h.risk_percentage && h.risk_percentage > 75);
  const isCleaned = h.status === 'Cleaned';
  const label = (h.zone_name || 'ZONE').split(' ')[0].toUpperCase();
  const risk = Math.round(h.risk_percentage || 60);

  // Tactical color theme
  const themeColor = isCleaned ? '#10b981' : isCritical ? '#ff4d00' : '#00e5ff';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer group" style="width: 32px; height: 32px;">
        
        <!-- Subtle 1px Sonar Pulse -->
        ${isCritical ? `
          <span class="absolute inset-1 rounded-full border border-[#ff4d00] animate-ping opacity-60 pointer-events-none" style="animation-duration: 2.2s;"></span>
        ` : ''}

        <!-- Active Target Lock Reticle (when selected) -->
        ${isSelected ? `
          <div class="absolute inset-0 border border-white/80 pointer-events-none animate-pulse scale-110">
            <span class="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#ff4d00]"></span>
            <span class="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[#ff4d00]"></span>
            <span class="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[#ff4d00]"></span>
            <span class="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#ff4d00]"></span>
          </div>
        ` : ''}

        <!-- Tactical Core Beacon -->
        <div class="relative w-3.5 h-3.5 flex items-center justify-center transition-transform duration-150 group-hover:scale-125 shadow-md ${isSelected ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-black' : ''}"
             style="background-color: ${themeColor}; border: 1.5px solid #ffffff;">
          ${isCleaned ? `
            <svg class="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ` : `
            <span class="w-1 h-1 bg-black rounded-full"></span>
          `}
        </div>

        <!-- Clean Interactive Hover / Selected Tactical Pill -->
        <div class="absolute left-full ml-2 px-2 py-0.5 bg-black/95 border border-[${themeColor}] text-white font-mono text-[9px] font-bold uppercase tracking-wider whitespace-nowrap shadow-2xl pointer-events-none transition-all duration-150 z-50 flex items-center gap-1.5 ${
          isSelected 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
        }">
          <span style="color: ${themeColor}">${label}</span>
          <span class="px-1 py-0.2 text-[8px] font-mono text-black font-extrabold" style="background-color: ${themeColor}">
            ${isCleaned ? 'OK' : `${risk}%`}
          </span>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const LiveMap = ({ 
  hotspots = [], 
  selectedZoneIndex = 0, 
  onSelectZone, 
  isFleetDispatched = false 
}: LiveMapProps) => {
  const markerRefs = useRef<Record<number, L.Marker | null>>({});
  const selectedHotspot = hotspots[selectedZoneIndex] || hotspots[0];

  return (
    <div className="flex flex-col h-full bg-[#050505] relative overflow-hidden min-h-[560px]">
      
      {/* Map Overlay Header */}
      <div className="absolute top-0 left-0 w-full z-10 flex items-start justify-between p-4 sm:p-6 pointer-events-none">
        <div className="flex items-center gap-3 bg-black border-2 border-white text-white px-4 py-2 pointer-events-auto font-mono text-[10px] uppercase font-bold tracking-widest shadow-2xl">
          <span className="w-2.5 h-2.5 bg-[#ff4d00] animate-ping"></span>
          <span>MUMBAI RADAR • SECTOR OPS</span>
        </div>
        
        <div className={`flex items-center gap-3 bg-black border-2 text-[10px] px-4 py-2 font-mono font-bold tracking-widest uppercase pointer-events-auto shadow-2xl ${isFleetDispatched ? 'border-[#ff4d00] text-[#ff4d00]' : 'border-[#333333] text-white'}`}>
          {isFleetDispatched ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ff4d00] animate-pulse"></span>
              SKIMMERS EN ROUTE
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Navigation className="w-3 h-3 text-[#ff4d00]" />
              FLEET ON STANDBY
            </span>
          )}
        </div>
      </div>

      {/* Esri World Dark Gray Base Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={CENTER_POS} 
          zoom={11} 
          style={{ height: '100%', width: '100%', background: '#050505' }}
          zoomControl={false}
          attributionControl={false}
        >
          {/* Synchronized map movement & popup focus */}
          <MapController 
            selectedHotspot={selectedHotspot} 
            selectedZoneIndex={selectedZoneIndex}
            markerRefs={markerRefs}
          />

          <TileLayer 
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
            minZoom={7}
            attribution="&copy; Esri &copy; DeLorme"
          />
          <TileLayer 
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
            minZoom={7}
            opacity={0.65}
          />

          {/* Colaba Base Station */}
          <Marker 
            position={BASE_POS}
            icon={L.divIcon({
              className: 'custom-leaflet-marker',
              html: `
                <div class="relative flex items-center justify-center cursor-pointer group" style="width: 28px; height: 28px;">
                  <div class="w-3.5 h-3.5 bg-white border border-black flex items-center justify-center transition-transform duration-150 group-hover:scale-125 shadow-md">
                    <span class="w-1.5 h-1.5 bg-[#ff4d00]"></span>
                  </div>
                  <div class="absolute left-full ml-2 px-2 py-0.5 bg-black/95 border border-white text-white font-mono text-[8px] font-bold uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-xl">
                    BASE HQ (COLABA)
                  </div>
                </div>
              `,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            })}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <span className="font-mono text-xs uppercase font-bold">Colaba Fleet Deployment HQ</span>
            </Tooltip>
          </Marker>

          {/* Transit Vectors */}
          {hotspots.slice(0, 6).map((h, idx) => {
            const isSelected = selectedZoneIndex === idx;
            return (
              <Polyline 
                key={`vector-${idx}`}
                positions={[BASE_POS, [h.lat, h.lon]]} 
                pathOptions={{ 
                  color: isSelected ? '#ff4d00' : isFleetDispatched ? '#ffffff' : '#333333', 
                  dashArray: isSelected ? '4, 4' : '6, 8', 
                  weight: isSelected ? 3.5 : isFleetDispatched ? 2 : 1,
                  opacity: isSelected ? 1 : 0.5
                }} 
              />
            );
          })}

          {/* Hotspot Markers */}
          {hotspots.map((h, idx) => {
            const isSelected = selectedZoneIndex === idx;
            const icon = createHotspotIcon(h, isSelected);

            return (
              <Marker 
                key={`hotspot-${idx}`} 
                ref={el => { markerRefs.current[idx] = el; }}
                position={[h.lat, h.lon]} 
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (onSelectZone) onSelectZone(idx);
                  }
                }}
              >
                <Popup>
                  <div className="p-4 bg-white dark:bg-card text-slate-900 dark:text-white font-sans text-xs min-w-[240px] rounded-xl shadow-xl border border-slate-200 dark:border-border/70">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-border/60 mb-3">
                      <div className="font-sans font-bold text-sm text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-orange-500' : 'bg-sky-500'}`}></span>
                        {h.zone_name}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold rounded">
                        {h.sector}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="bg-slate-50 dark:bg-muted/40 p-2.5 rounded-lg border border-slate-100 dark:border-border/50">
                        <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-semibold">BEACHING RISK</span>
                        <span className="font-bold text-sm text-orange-600 dark:text-orange-400 font-mono">
                          {h.risk_percentage}%
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-muted/40 p-2.5 rounded-lg border border-slate-100 dark:border-border/50">
                        <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-semibold">EST. DEBRIS</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                          {h.estimated_debris_kg} KG
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed border-l-2 border-orange-500 pl-2">
                      PRIMARY DRIVER: <strong className="text-slate-900 dark:text-white">{h.top_driver || 'WIND SURGE'}</strong><br />
                      PEAK ARRIVAL: <strong className="text-slate-900 dark:text-white font-mono">T+{h.peak_arrival_hours || 12}H</strong>
                    </div>

                    <div className="px-3 py-1.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-850/60 text-orange-600 dark:text-orange-400 text-xs text-center font-bold rounded-lg tracking-wider">
                      {isSelected ? 'LOCKED TARGET // TELEMETRY SYNCED' : 'CLICK TO SELECT'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* On-Map Tactical Legend Box */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200 dark:border-border/70 p-3.5 text-slate-800 dark:text-slate-200 font-sans text-xs font-semibold rounded-xl shadow-lg flex flex-col gap-2 pointer-events-auto max-w-[250px]">
        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-border/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold">
          <Crosshair className="w-3.5 h-3.5 text-orange-500" />
          <span>TACTICAL RADAR TARGETS</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          <span className="text-orange-600 dark:text-orange-400 font-semibold">Critical (&gt;75% Risk)</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
          <span className="text-sky-600 dark:text-cyan-400 font-semibold">Monitored Watch (30-75%)</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Secured / Cleaned</span>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
