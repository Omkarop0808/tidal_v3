import { XCircle, Square, Zap } from 'lucide-react';

interface ComparisonVisualProps {
  activeScenarioId?: number | null;
  selectedZone?: any;
}

export const ComparisonVisual = ({ activeScenarioId = 1, selectedZone }: ComparisonVisualProps) => {
  const zoneName = selectedZone?.zone_name || 'COASTAL HOTSPOT';

  // Compute adaptive metrics based on the active scenario
  const getScenarioMetrics = () => {
    switch (activeScenarioId) {
      case 1: // Deploy to Active Zone
        return {
          recovery: 86,
          recoveryDelta: '+48%',
          clearance: '14H',
          clearanceDelta: '-58H',
          efficiency: 'OPTIMAL',
          desc: `Pre-emptive autonomous skimmer interception deployed to ${zoneName} captures buoyant polymers before peak tidal accumulation, preventing coastal disintegration.`
        };
      case 2: // Offshore Boom
        return {
          recovery: 89,
          recoveryDelta: '+51%',
          clearance: '10H',
          clearanceDelta: '-62H',
          efficiency: 'MAX',
          desc: `Seaward containment boom blocks 45% of incoming Arabian Sea debris influx, consolidating floating plastics for rapid automated vessel retrieval.`
        };
      case 3: // Surge Squads
        return {
          recovery: 93,
          recoveryDelta: '+55%',
          clearance: '6H',
          clearanceDelta: '-66H',
          efficiency: 'PEAK',
          desc: `18 coordinated field squads execute synchronized containment sweeps across rocky breakwaters and sandy shores, reducing shoreline dwelling time to under 6 hours.`
        };
      case 4: // Storm Delay (Monsoon penalty)
        return {
          recovery: 52,
          recoveryDelta: '+14%',
          clearance: '34H',
          clearanceDelta: '-38H',
          efficiency: 'DEGRADED',
          desc: `Monsoon storm surge and turbulent swells disperse debris clusters across seawalls, triggering heavy retrieval penalties and extended operational clearance windows.`
        };
      default:
        return {
          recovery: 78,
          recoveryDelta: '+40%',
          clearance: '18H',
          clearanceDelta: '-54H',
          efficiency: 'HIGH',
          desc: `Predictive hydrodynamics dispatch autonomous interceptors 12 to 24 hours ahead of beached landfall.`
        };
    }
  };

  const metrics = getScenarioMetrics();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      
      {/* Conventional Reactionary Cleanups (Without TIDAL) */}
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6 relative shadow-sm">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs font-semibold uppercase tracking-wider rounded-md border border-slate-200 dark:border-slate-700">
            CONVENTIONAL CLEANUP
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
            <XCircle className="w-6 h-6 shrink-0" />
          </div>
          <div className="flex flex-col">
            <h4 className="font-sans font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">WITHOUT TIDAL</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Reactionary Manual Sweeps</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl flex flex-col gap-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Recovery</span>
            <span className="font-sans font-bold text-2xl text-slate-700 dark:text-slate-300 font-mono">38%</span>
            <span className="text-[10px] text-slate-400 uppercase">Manual Limit</span>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl flex flex-col gap-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Impact</span>
            <span className="font-sans font-bold text-2xl text-slate-700 dark:text-slate-300 font-mono">72H+</span>
            <span className="text-[10px] text-slate-400 uppercase">Lag Time</span>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl flex flex-col gap-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Efficiency</span>
            <span className="font-sans font-bold text-2xl text-slate-700 dark:text-slate-300 font-mono">LOW</span>
            <span className="text-[10px] text-slate-400 uppercase">Dispersed</span>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
          Debris fragments into toxic microplastics upon crashing onto rocky seawalls before crews arrive, causing severe ecological contamination and exponentially higher manual retrieval costs.
        </p>
      </div>

      {/* With TIDAL Autonomous Prediction (Adaptive Scenario Deltas) */}
      <div className="bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-card dark:via-orange-950/20 dark:to-card border-2 border-orange-500/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6 relative shadow-md">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>PREDICTION-DRIVEN</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-950/60 rounded-xl text-orange-500">
            <Square className="w-6 h-6 fill-orange-500 text-orange-500 shrink-0" />
          </div>
          <div className="flex flex-col">
            <h4 className="font-sans font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">WITH TIDAL</h4>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              Adaptive Countermeasure Active
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-850/50 rounded-xl flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Recovery</span>
            <span className="font-sans font-bold text-2xl text-orange-600 dark:text-orange-400 font-mono">{metrics.recovery}%</span>
            <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold">{metrics.recoveryDelta} Delta</span>
          </div>
          <div className="p-3.5 bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-850/50 rounded-xl flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Clearance</span>
            <span className="font-sans font-bold text-2xl text-slate-900 dark:text-white font-mono">{metrics.clearance}</span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{metrics.clearanceDelta} Speedup</span>
          </div>
          <div className="p-3.5 bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-850/50 rounded-xl flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Efficiency</span>
            <span className="font-sans font-bold text-2xl text-emerald-600 dark:text-emerald-400 font-mono">{metrics.efficiency}</span>
            <span className="text-[11px] font-mono text-orange-600 dark:text-orange-400 font-bold">Optimized</span>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 border-l-2 border-orange-500 pl-3 font-medium">
          {metrics.desc}
        </p>
      </div>

    </div>
  );
};

export default ComparisonVisual;
