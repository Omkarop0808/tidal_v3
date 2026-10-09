import { Sliders, Users, Truck, Anchor, CheckCircle2, Square, Target, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CleanupOptimizationProps {
  assignments?: any[];
  selectedZone?: any;
  selectedZoneIndex?: number;
  hotspots?: any[];
  onSelectZone?: (index: number) => void;
  onDispatchTarget?: () => void;
}

export const CleanupOptimization = ({ 
  assignments = [],
  selectedZone,
  selectedZoneIndex = 0,
  hotspots = [],
  onSelectZone,
  onDispatchTarget
}: CleanupOptimizationProps) => {
  const totalRecovery = assignments.reduce((acc, a) => acc + (a.estimated_recovery_kg || 0), 0) / 1000;
  
  // Find assignment matching selected zone or compute designated vessel
  const zoneName = selectedZone?.zone_name || (hotspots[selectedZoneIndex]?.zone_name) || 'VERSOVA OUTFALL';
  const matchingAssignment = assignments.find(a => 
    a.target_zone?.toLowerCase().includes(zoneName.split(' ')[0].toLowerCase()) ||
    zoneName.toLowerCase().includes(a.target_zone?.toLowerCase().split(':')[0] || '___')
  );

  const designatedVessel = matchingAssignment?.vessel_name || `TIDAL-SKIM-0${(selectedZoneIndex % 3) + 1}`;
  const estimatedRecoveryKg = selectedZone?.estimated_debris_kg || (matchingAssignment?.estimated_recovery_kg) || 420;
  const etaHours = selectedZone?.peak_arrival_hours ? Math.max(1, Math.round(selectedZone.peak_arrival_hours * 0.4)) : 2.4;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-card min-h-[500px]">
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-border/70 bg-slate-50 dark:bg-muted/40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 rounded-lg">
            <Sliders className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white">Dispatch Optimizer</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Hungarian Matcher</span>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-mono text-xs font-semibold rounded-md flex items-center gap-1.5">
          <Square className="w-2 h-2 fill-emerald-500 text-emerald-500" />
          OPTIMAL
        </span>
      </div>
      
      <div className="p-5 flex flex-col gap-5">

        {/* Selected Zone Tactical Intercept Focus Box */}
        <div className="p-4 bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-850/60 rounded-xl flex flex-col gap-3 text-xs shadow-sm">
          <div className="flex items-center justify-between border-b border-orange-200/80 dark:border-orange-850/50 pb-2">
            <span className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-orange-500" />
              ZONE {String.fromCharCode(65 + selectedZoneIndex)} DEPLOYMENT
            </span>
            <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded text-[11px] font-semibold uppercase">
              {selectedZone?.sector || 'COASTAL'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-sans font-bold text-sm text-slate-900 dark:text-white truncate">
              {zoneName}
            </span>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>ASSIGNED VESSEL:</span>
              <span className="text-slate-900 dark:text-white font-mono font-bold">{designatedVessel}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>INTERCEPT ETA:</span>
              <span className="text-orange-600 dark:text-orange-400 font-mono font-bold">T+{etaHours}H (PRE-BEACHING)</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>TARGET PAYLOAD:</span>
              <span className="text-slate-900 dark:text-white font-mono font-bold">{estimatedRecoveryKg} KG</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (onDispatchTarget) onDispatchTarget();
            }}
            className="w-full mt-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>AUTHORIZE INTERCEPT</span>
          </button>
        </div>

        {/* Resource Allocation */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl flex flex-col items-center gap-1">
            <Users className="w-4 h-4 text-orange-500" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Squads</span>
            <span className="font-sans font-bold text-lg text-slate-900 dark:text-white font-mono">{assignments.length ? 14 : '--'}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl flex flex-col items-center gap-1">
            <Truck className="w-4 h-4 text-sky-500" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Trucks</span>
            <span className="font-sans font-bold text-lg text-slate-900 dark:text-white font-mono">{assignments.length ? 6 : '--'}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl flex flex-col items-center gap-1">
            <Anchor className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Capacity</span>
            <span className="font-sans font-bold text-lg text-slate-900 dark:text-white font-mono">{assignments.length ? '2.4T' : '--'}</span>
          </div>
        </div>

        {/* Fleet Vectors */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Optimal Fleet Vectors
            </span>
            <span className="text-[11px] text-slate-400 uppercase">
              Click to focus
            </span>
          </div>

          <div className="flex flex-col gap-1.5 text-xs">
            <AnimatePresence>
              {assignments.slice(0, 4).map((a, i) => {
                const isSelectedVector = 
                  a.target_zone?.toLowerCase().includes(zoneName.split(' ')[0].toLowerCase()) ||
                  zoneName.toLowerCase().includes(a.target_zone?.toLowerCase().split(':')[0] || '___') ||
                  designatedVessel === a.vessel_name;

                return (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    key={i} 
                    onClick={() => {
                      if (onSelectZone) {
                        const targetIdx = hotspots.findIndex(h => 
                          h.zone_name?.toLowerCase().includes(a.target_zone?.toLowerCase().split(':')[0] || '___') ||
                          a.target_zone?.toLowerCase().includes(h.zone_name?.toLowerCase().split(' ')[0] || '___')
                        );
                        if (targetIdx >= 0) {
                          onSelectZone(targetIdx);
                        }
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isSelectedVector
                        ? 'bg-orange-500/10 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800/80 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-slate-800/30 border-slate-200/80 dark:border-border/50 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isSelectedVector && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0"></span>}
                      <span className="truncate font-mono font-medium text-slate-800 dark:text-slate-200">{a.vessel_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`truncate text-xs font-medium ${isSelectedVector ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                        → {a.target_zone.split(':')[0]}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              {assignments.length === 0 && (
                <span className="text-slate-400 text-center p-3 text-xs">AWAITING ASSIGNMENTS</span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-slate-200 dark:border-border/70 bg-slate-50 dark:bg-muted/40 p-4 flex flex-col gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-medium">EST. RECOVERY</span>
          <span className="text-slate-900 dark:text-white font-mono font-bold">{totalRecovery > 0 ? totalRecovery.toFixed(2) : '--'} TONS</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-medium">COVERAGE</span>
          <span className="text-slate-900 dark:text-white font-mono font-bold">{assignments.length ? `${assignments.length} SECTORS` : '--'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-medium">EFFICIENCY GAIN</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {assignments.length ? '84% (+46%)' : '--'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CleanupOptimization;
