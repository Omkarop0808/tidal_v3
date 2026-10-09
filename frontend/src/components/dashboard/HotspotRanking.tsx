import { ListOrdered, CheckCircle2 } from 'lucide-react';

export interface Hotspot {
  zone_name: string;
  sector: string;
  lat: number;
  lon: number;
  risk_percentage: number;
  estimated_debris_kg: number;
  peak_arrival_hours: number;
  severity: string;
  top_driver?: string;
  shap_values?: any;
}

export const MOCK_HOTSPOTS: Hotspot[] = [
  { zone_name: 'Versova Creek Outfall', sector: 'North-West', lat: 19.1350, lon: 72.8140, risk_percentage: 94, estimated_debris_kg: 520, peak_arrival_hours: 6, severity: 'Critical', top_driver: 'Wind Vector (+42.1)' },
  { zone_name: 'Juhu Beach Shoreline', sector: 'North-West', lat: 19.0970, lon: 72.8258, risk_percentage: 82, estimated_debris_kg: 380, peak_arrival_hours: 12, severity: 'High', top_driver: 'Tidal Surge (+28.4)' },
  { zone_name: 'Aksa Beach & Dana Pani', sector: 'North-West', lat: 19.1750, lon: 72.7920, risk_percentage: 76, estimated_debris_kg: 290, peak_arrival_hours: 14, severity: 'High', top_driver: 'Current Vel (+21.0)' },
  { zone_name: 'Mahim Bay & Mithi River', sector: 'Central', lat: 19.0350, lon: 72.8350, risk_percentage: 88, estimated_debris_kg: 650, peak_arrival_hours: 8, severity: 'Critical', top_driver: 'River Outflow (+55.2)' },
  { zone_name: 'Bandra Channel & Carter', sector: 'Central', lat: 19.0550, lon: 72.8180, risk_percentage: 61, estimated_debris_kg: 310, peak_arrival_hours: 18, severity: 'Moderate', top_driver: 'Wind Vector (+12.1)' },
  { zone_name: 'Worli Sea Face Basin', sector: 'South', lat: 19.0120, lon: 72.8150, risk_percentage: 54, estimated_debris_kg: 230, peak_arrival_hours: 20, severity: 'Moderate', top_driver: 'Tidal Surge (+8.4)' },
  { zone_name: 'Girgaon Marine Drive Bay', sector: 'South', lat: 18.9550, lon: 72.8120, risk_percentage: 42, estimated_debris_kg: 190, peak_arrival_hours: 24, severity: 'Moderate', top_driver: 'Current Vel (+5.2)' },
];

interface HotspotRankingProps {
  hotspots?: Hotspot[];
  selectedZoneIndex?: number;
  onSelectZone?: (index: number) => void;
  isFleetDispatched?: boolean;
}

export const HotspotRanking = ({ 
  hotspots = MOCK_HOTSPOTS,
  selectedZoneIndex = 0, 
  onSelectZone, 
  isFleetDispatched = false 
}: HotspotRankingProps) => {

  return (
    <div className="flex flex-col h-full bg-white dark:bg-card min-h-[500px]">
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-border/70 bg-slate-50 dark:bg-muted/40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 rounded-lg">
            <ListOrdered className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white">Hotspot Matrix</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Mumbai Coastal Sectors</span>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700">
          {hotspots.length} SECTORS
        </span>
      </div>
      
      {/* Hotspots List */}
      <div className="flex flex-col overflow-y-auto max-h-[550px] divide-y divide-slate-100 dark:divide-border/40">
        {hotspots.map((hotspot, index) => {
          const isCritical = hotspot.severity.toLowerCase() === 'critical';
          const isSelected = selectedZoneIndex === index;

          return (
            <div 
              key={index} 
              onClick={() => onSelectZone?.(index)}
              className={`p-4 cursor-pointer flex flex-col gap-3 transition-colors ${
                isSelected 
                  ? 'bg-orange-500/10 dark:bg-orange-950/30 border-l-4 border-l-orange-500' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-orange-500' : isCritical ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
                  <span className={`font-sans font-bold text-sm ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
                    ZONE {String.fromCharCode(65 + index)}: {hotspot.zone_name}
                  </span>
                </div>
                {isFleetDispatched ? (
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold rounded-md flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    INTERCEPTING
                  </span>
                ) : (
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${
                    isCritical 
                      ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400' 
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {hotspot.severity}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex flex-col">
                  <span className="text-slate-400 dark:text-slate-500 uppercase font-medium text-[11px]">Risk Score</span>
                  <span className={`font-mono font-bold text-sm ${isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {isFleetDispatched ? Math.round(hotspot.risk_percentage * 0.35) : hotspot.risk_percentage}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 dark:text-slate-500 uppercase font-medium text-[11px]">Est. Debris</span>
                  <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">{hotspot.estimated_debris_kg} KG</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 dark:text-slate-500 uppercase font-medium text-[11px]">Top Driver</span>
                  <span className="text-orange-600 dark:text-orange-400 font-medium text-xs truncate">{hotspot.top_driver || 'WIND SURGE'}</span>
                </div>
              </div>
              
              {isSelected && (
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 relative overflow-hidden">
                  <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                      isFleetDispatched ? 'bg-emerald-500' : isCritical ? 'bg-orange-500' : 'bg-sky-500'
                    }`} 
                    style={{ width: `${isFleetDispatched ? hotspot.risk_percentage * 0.35 : hotspot.risk_percentage}%` }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-muted/40 border-t border-slate-200 dark:border-border/70 flex items-center justify-between text-xs mt-auto">
        <span className="text-slate-500 dark:text-slate-400 uppercase font-medium">Selected Sector:</span>
        <span className="text-slate-900 dark:text-white font-bold font-mono">
          {hotspots[selectedZoneIndex]?.zone_name || 'VERSOVA OUTFALL'}
        </span>
      </div>
    </div>
  );
};

export default HotspotRanking;
