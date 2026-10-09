import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  RotateCw, 
  ArrowRight, 
  CheckCircle2,
  Trash2,
  Square
} from 'lucide-react';
import { HotspotRanking, MOCK_HOTSPOTS } from '../components/dashboard/HotspotRanking';
import { LiveMap } from '../components/dashboard/LiveMap';
import { CleanupOptimization } from '../components/dashboard/CleanupOptimization';
import ComparisonVisual from '../components/dashboard/ComparisonVisual';
import InterventionSimulator from '../components/dashboard/InterventionSimulator';
import { DispatchPlanModal } from '../components/dashboard/DispatchPlanModal';
import FieldCleanupModal from '../components/dashboard/FieldCleanupModal';
import { api } from '../lib/api';
import { useSim } from '../store';

const Hotspots = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);
  const [isFleetDispatched, setIsFleetDispatched] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<number>(1);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>(MOCK_HOTSPOTS);

  const setActiveMissionZone = useSim(state => state.setActiveMissionZone);

  const fetchHotspotsData = async () => {
    try {
      const data = await api.getHotspots();
      if (data && data.length > 0) {
        setHotspots(data);
        const activeZoneId = useSim.getState().activeMission?.zoneId;
        const matchedIdx = data.findIndex((hs: any) => hs.id?.toLowerCase() === activeZoneId?.toLowerCase());
        if (matchedIdx >= 0) {
          setSelectedZoneIndex(matchedIdx);
        }
        const assigns = await api.optimizeDispatch(data);
        setAssignments(assigns || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    await fetchHotspotsData();
    setIsRecalculating(false);
  };

  useEffect(() => {
    fetchHotspotsData();
    const handleCleanup = () => {
      fetchHotspotsData();
    };
    window.addEventListener('CleanupCompletedEvent', handleCleanup);
    const interval = setInterval(fetchHotspotsData, 10000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('CleanupCompletedEvent', handleCleanup);
    };
  }, []);

  const handleSelectZone = (index: number) => {
    setSelectedZoneIndex(index);
    const hs = hotspots[index];
    if (hs && hs.id) {
      setActiveMissionZone(hs.id);
    }
  };

  const currentBeach = hotspots[selectedZoneIndex] || hotspots[0];

  return (
    <div className="flex flex-col w-full p-4 md:p-8 gap-8 bg-slate-50 dark:bg-background text-slate-900 dark:text-slate-100 min-h-screen font-sans selection:bg-orange-500 selection:text-white transition-colors duration-200">
      
      {/* Top Header / Intro Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-border/70">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-850/50 text-xs font-semibold uppercase tracking-wider rounded-md flex items-center gap-1.5">
              <Square className="w-2.5 h-2.5 fill-current" />
              TACTICAL DEPLOYMENT & FIELD OPS
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-xs tracking-wider">
              // SEC_04 — GREATER MUMBAI COASTLINE
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-sans font-extrabold text-slate-900 dark:text-white tracking-tight uppercase leading-tight">
            Hotspots & <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Fleet Operations</span>
          </h1>
          <p className="text-sm sm:text-base font-normal text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed border-l-2 border-orange-500/70 pl-4 mt-1">
            Transform machine learning forecasts into deterministic intercept missions. Real-time telemetry guides vessel assignment, before/after evidence recording, and central state synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsCleanupModalOpen(true)}
            className="px-5 py-3 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs uppercase tracking-wider rounded-xl shadow-sm border border-slate-200 dark:border-border/70 transition-all flex items-center gap-2.5"
          >
            <Trash2 className="w-4 h-4 text-orange-500" />
            <span>LOG FIELD SWEEP ({currentBeach.zone_name.split(' ')[0]})</span>
          </button>

          <button 
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="px-5 py-3 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs uppercase tracking-wider rounded-xl shadow-sm border border-slate-200 dark:border-border/70 transition-all flex items-center gap-2.5 disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 text-orange-500 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>{isRecalculating ? 'SYNCING...' : 'RECALCULATE'}</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="relative px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2.5"
          >
            <span className="absolute -top-2.5 -right-2 px-2 py-0.5 bg-slate-900 text-white border border-slate-700 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full">
              {isFleetDispatched ? 'ACTIVE' : 'AI LIVE'}
            </span>
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{isFleetDispatched ? 'RE-OPTIMIZE PLAN' : 'DEPLOY AI PLAN'}</span>
          </button>
        </div>
      </div>

      {/* Fleet Dispatched Banner (if active) */}
      {isFleetDispatched && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Fleet Orders Transmitted • 3 Autonomous Skimmers En Route to Coastal Hotspots</span>
          </div>
          <span className="bg-emerald-600 text-white px-3 py-1 rounded-md text-xs font-mono font-bold">ETA: 0.8H - 2.4H</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="col-span-1 lg:col-span-4 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <HotspotRanking 
            hotspots={hotspots}
            selectedZoneIndex={selectedZoneIndex}
            onSelectZone={handleSelectZone}
            isFleetDispatched={isFleetDispatched}
          />
        </div>
        <div className="col-span-1 lg:col-span-5 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <LiveMap 
            hotspots={hotspots}
            selectedZoneIndex={selectedZoneIndex}
            onSelectZone={handleSelectZone}
            isFleetDispatched={isFleetDispatched}
          />
        </div>
        <div className="col-span-1 lg:col-span-3 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <CleanupOptimization 
            assignments={assignments} 
            selectedZone={currentBeach}
            selectedZoneIndex={selectedZoneIndex}
            hotspots={hotspots}
            onSelectZone={handleSelectZone}
            onDispatchTarget={() => setIsModalOpen(true)}
          />
        </div>
      </div>

      {/* Comparison Visual: Reactionary vs TIDAL Predictive (Adaptive Deltas) */}
      <ComparisonVisual 
        activeScenarioId={activeScenarioId} 
        selectedZone={currentBeach} 
      />

      {/* Intervention Simulator: Interactive Action Scenarios */}
      <InterventionSimulator 
        activeScenarioId={activeScenarioId}
        onSelectScenario={setActiveScenarioId}
        selectedZone={currentBeach}
      />

      {/* Bottom CTA connecting to Circular Recovery */}
      <div className="p-6 sm:p-8 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-mono text-xs font-semibold uppercase tracking-wider">
            <Square className="w-2.5 h-2.5 fill-current" />
            <span>Downstream Material Routing</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-sans font-bold text-slate-900 dark:text-white tracking-tight">
            Route Plastics to Circular Recovery
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-l-2 border-orange-500/70 pl-3">
            Seamlessly transfer collected ocean debris batches into verified upcycler networks, automated YOLO11 material valuation, and carbon offset ledgers.
          </p>
        </div>

        <Link 
          to="/circular-recovery" 
          className="px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 shrink-0 w-full md:w-auto"
        >
          <span>PROCEED TO RECOVERY</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <DispatchPlanModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onConfirmDispatch={() => setIsFleetDispatched(true)}
      />

      <FieldCleanupModal 
        isOpen={isCleanupModalOpen}
        onClose={() => setIsCleanupModalOpen(false)}
        beach={{
          id: currentBeach.zone_name.toLowerCase().split(' ')[0],
          name: currentBeach.zone_name,
          sector: currentBeach.sector,
          estimated_debris_kg: currentBeach.estimated_debris_kg
        }}
        onSuccess={() => {
          setIsFleetDispatched(true);
        }}
      />
    </div>
  );
};

export default Hotspots;
