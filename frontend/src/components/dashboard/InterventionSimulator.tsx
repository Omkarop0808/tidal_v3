import { useNavigate } from 'react-router-dom';
import { Zap, ShieldCheck, Users, Clock, ArrowRight } from 'lucide-react';
import { useSim } from '../../store';

interface InterventionSimulatorProps {
  activeScenarioId?: number | null;
  onSelectScenario?: (id: number) => void;
  selectedZone?: any;
}

export const InterventionSimulator = ({
  activeScenarioId = 1,
  onSelectScenario,
  selectedZone
}: InterventionSimulatorProps) => {
  const navigate = useNavigate();
  const setScenario = useSim(state => state.setScenario);
  const setActiveMissionZone = useSim(state => state.setActiveMissionZone);

  const zoneName = selectedZone?.zone_name || 'COASTAL HOTSPOT';
  const zoneShort = zoneName.split(' ')[0].toUpperCase();

  const scenarios = [
    {
      id: 1,
      icon: Zap,
      title: `DEPLOY TO ${zoneShort}`,
      desc: `Pre-emptive autonomous skimmer interception before peak tidal accumulation at ${zoneName}.`,
      impactLabel: 'RECOVERY DELTA',
      impactValue: '+34% CAPTURE',
      impactColor: 'text-[#ff4d00]',
      isPositive: true,
      config: { isBarrierActive: true, barrierEfficiency: 50, cleanupTeams: 14 }
    },
    {
      id: 2,
      icon: ShieldCheck,
      title: 'OFFSHORE BOOM',
      desc: `Anchor containment boom across ${zoneShort} channel entrance to block seaward debris drift.`,
      impactLabel: 'SEAWARD INFLUX',
      impactValue: '-45% INFLUX',
      impactColor: 'text-[#00e5ff]',
      isPositive: true,
      config: { isBarrierActive: true, barrierEfficiency: 75, cleanupTeams: 12 }
    },
    {
      id: 3,
      icon: Users,
      title: 'SURGE SQUADS',
      desc: `Scale active ground response teams from 12 to 18 squads for rapid rocky breakwater retrieval.`,
      impactLabel: 'CLEARANCE TIME',
      impactValue: '6.0H EXPEDITED',
      impactColor: 'text-[#10b981]',
      isPositive: true,
      config: { isBarrierActive: false, barrierEfficiency: 0, cleanupTeams: 18 }
    },
    {
      id: 4,
      icon: Clock,
      title: 'STORM DELAY',
      desc: `Model heavy monsoon storm surge and unconstrained high-swell tidal dispersion penalty.`,
      impactLabel: 'MONSOON PENALTY',
      impactValue: '-26% RECOVERY',
      impactColor: 'text-[#a3a3a3]',
      isPositive: false,
      config: { windSpeed: 45, precipitation: 60, cleanupTeams: 8 }
    }
  ];

  const handleApplyTo3DTwin = (scenario: typeof scenarios[0]) => {
    if (selectedZone?.id) {
      setActiveMissionZone(selectedZone.id);
    }
    setScenario(scenario.config);
    navigate('/simulate');
  };

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  return (
    <div className="flex flex-col gap-6 mt-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 rounded-lg">
            <Zap className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-sans font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">Intervention Simulator</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Countermeasure Impact Modeling for {zoneName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-orange-600 dark:text-orange-400 font-semibold uppercase tracking-wider">
            [ Click scenario to predict deltas ]
          </span>
        </div>
      </div>
      
      {/* 4 Interactive Scenario Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((scenario) => {
          const isActive = activeScenarioId === scenario.id;
          const Icon = scenario.icon;

          return (
            <div 
              key={scenario.id} 
              onClick={() => onSelectScenario?.(scenario.id)}
              className={`p-5 cursor-pointer rounded-2xl flex flex-col justify-between gap-4 transition-all shadow-sm ${
                isActive
                  ? 'bg-orange-50/40 dark:bg-orange-950/30 border-2 border-orange-500 shadow-md'
                  : 'bg-white dark:bg-card border border-slate-200 dark:border-border/70 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-orange-500 text-white rounded-md">
                      ACTIVE SCENARIO
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className={`font-sans font-bold text-sm tracking-tight ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
                    {scenario.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {scenario.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold">
                <span className="text-slate-400 dark:text-slate-500 uppercase text-[11px]">{scenario.impactLabel}</span>
                <span className={`font-mono font-bold ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {scenario.impactValue}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Scenario Action Bar */}
      <div className="p-4 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping"></span>
          <span className="text-slate-500 dark:text-slate-400 uppercase">SELECTED INTERVENTION:</span>
          <span className="text-slate-900 dark:text-white font-bold">{activeScenario.title}</span>
          <span className="text-orange-600 dark:text-orange-400 font-mono font-bold">({activeScenario.impactValue})</span>
        </div>

        <button
          onClick={() => handleApplyTo3DTwin(activeScenario)}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
        >
          <span>SIMULATE SCENARIO IN 3D TWIN</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InterventionSimulator;
