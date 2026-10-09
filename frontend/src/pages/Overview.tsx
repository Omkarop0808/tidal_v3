import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { 
  ArrowRight, 
  Activity, 
  AlertTriangle, 
  Users, 
  Wifi, 
  Radio, 
  ShieldAlert, 
  Wind, 
  Droplets, 
  TrendingUp, 
  Square
} from 'lucide-react';
import { IntelligenceMap } from '../components/IntelligenceMap';
import { ProtocolAlphaOverlay } from '../components/ProtocolAlphaOverlay';
import { FleetCommandPanel } from '../components/FleetCommandPanel';
import { DebrisAnalysisPanel } from '../components/DebrisAnalysisPanel';
import { useLiveFeed } from '../hooks/useLiveFeed';
import { api } from '../lib/api';
import { useSim } from '../store';

interface TelemetrySummary {
  predicted_debris: number;
  high_risk_zones: number;
  cleanup_teams_active: number;
  recovery_potential: number;
  shap_values?: any;
  recent_activity: Array<{
    time: string;
    event: string;
    type: string;
  }>;
}

const Overview = () => {
  const [data, setData] = useState<TelemetrySummary | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isAlphaOpen, setIsAlphaOpen] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [debrisMultiplier, setDebrisMultiplier] = useState(0);
  const [activeLayers, setActiveLayers] = useState<string[]>(['Debris', 'Current']);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | undefined>();
  const [selectedBeach, setSelectedBeach] = useState<any>(null);
  const activeMission = useSim(state => state.activeMission);
  const setActiveMissionZone = useSim(state => state.setActiveMissionZone);

  const { data: liveData, isConnected } = useLiveFeed('ws://localhost:8000/ws/live');

  useEffect(() => {
    if (liveData?.weather) {
      setWeatherData(liveData.weather);
    }
  }, [liveData]);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const data = await api.getTelemetrySummary();
        setData(data);
      } catch (error) {
        console.error('Error fetching telemetry summary:', error);
      }
    };

    fetchTelemetry();
    
    const handleCleanup = () => {
      fetchTelemetry();
    };
    window.addEventListener('CleanupCompletedEvent', handleCleanup);

    const interval = setInterval(fetchTelemetry, 5000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('CleanupCompletedEvent', handleCleanup);
    };
  }, []);

  const handleReleaseDebris = () => {
    if (isReleasing) return;
    setIsReleasing(true);
    setTimeout(() => {
      setDebrisMultiplier(prev => prev + 1);
      setIsReleasing(false);
    }, 2000);
  };

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev => 
      prev.includes(layer) 
        ? prev.filter(l => l !== layer)
        : [...prev, layer]
    );
  };

  const predictedDebris = data ? ((data.predicted_debris / 1000) + (debrisMultiplier * 1.2)).toFixed(1) : '--';
  const highRiskZones = data ? data.high_risk_zones + debrisMultiplier : '--';

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    })
  };

  const filteredActivity = data?.recent_activity.filter(a => {
    if (activityFilter === 'all') return true;
    return a.type.toLowerCase() === activityFilter.toLowerCase();
  }) || [];

  return (
    <main className="w-full min-h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-orange-500 selection:text-white font-sans transition-colors duration-200">
      
      <ProtocolAlphaOverlay isOpen={isAlphaOpen} onClose={() => setIsAlphaOpen(false)} />
      <FleetCommandPanel isOpen={isFleetOpen} onClose={() => setIsFleetOpen(false)} />
      <DebrisAnalysisPanel 
        isOpen={isAnalysisOpen} 
        onClose={() => setIsAnalysisOpen(false)} 
        activityId={selectedActivityId} 
      />

      {/* TACTICAL HERO SECTION */}
      <section className="relative p-4 md:p-8 flex flex-col gap-8">
        
        {/* Top Status Ticker */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-slate-200 dark:border-border/70 bg-white dark:bg-card rounded-xl shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-sm">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              SEC_04 LIVE
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tracking-wider hidden md:inline">
              LAT: 18.9750° N • LON: 72.8258° E • ARABIAN SEA BASIN
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono font-medium">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Wind className="w-4 h-4 text-orange-500" />
              <span>{weatherData ? `${weatherData.wind_speed_10m} KM/H` : '18.4 KM/H'} SW</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Droplets className="w-4 h-4 text-sky-500" />
              <span>{weatherData ? `${weatherData.precipitation} MM` : '12.0 MM'} RAIN</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-md border border-slate-200/80 dark:border-slate-700">
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              {isConnected ? 'SYNC ACTIVE' : 'TELEMETRY ON'}
            </div>
          </div>
        </div>

        {/* Hero Headline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <motion.div 
            custom={0} initial="hidden" animate="visible" variants={fadeUp}
            className="lg:col-span-8 flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-mono text-xs tracking-wider uppercase font-semibold">
              <Square className="w-3 h-3 fill-current text-orange-500" />
              Hydrodynamic Prediction & Logistics
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-sans font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
              Autonomous <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-cyan-500">
                Marine Intelligence
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mt-2 border-l-2 border-orange-500/70 pl-4 font-normal">
              Physics-informed Monte Carlo drift, XGBoost coastal beaching risk, and real-time Hungarian-optimized skimmer dispatch for Greater Mumbai coastline.
            </p>
          </motion.div>
          
          <motion.div 
            custom={1} initial="hidden" animate="visible" variants={fadeUp}
            className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end"
          >
            <button 
              onClick={handleReleaseDebris}
              disabled={isReleasing}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm tracking-wide rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-between disabled:opacity-50"
            >
              {isReleasing ? (
                <span>INJECTING DRIFT PARTICLES...</span>
              ) : (
                <span>SIMULATE DEBRIS DROP</span>
              )}
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link 
              to="/simulate" 
              className="w-full py-3.5 px-6 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-200 dark:border-border/70 rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-between"
            >
              <span>LAUNCH 72H DIGITAL TWIN</span>
              <Activity className="w-4 h-4 text-orange-500" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* BENTO INSTRUMENTATION GRID */}
      <section className="p-4 md:p-8 pt-0">
        <div className="grid grid-cols-12 gap-5">
          
          {/* Bento Card 1: Predicted Debris */}
          <motion.div 
            custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="col-span-12 lg:col-span-8 p-6 sm:p-8 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[300px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 rounded-lg">
                  <Activity className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Predicted Coastal Accumulation</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Next 24-hour shoreline estimate</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/50 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                +12% 24H
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mt-6">
              <div className="flex items-baseline gap-3">
                <span className="text-6xl sm:text-7xl font-sans font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                  {predictedDebris}
                </span>
                <span className="text-lg font-mono text-orange-600 dark:text-orange-400 font-bold uppercase">TONS</span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs font-medium w-full sm:w-auto min-w-[220px]">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">VERSOVA HOTSPOT:</span>
                  <span className="text-slate-900 dark:text-white font-bold font-mono">58%</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">JUHU SHORELINE:</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold font-mono">29%</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">BANDRA ESTUARY:</span>
                  <span className="text-slate-900 dark:text-white font-bold font-mono">13%</span>
                </div>
              </div>
            </div>
            
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-6 overflow-hidden relative">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(20, (parseFloat(predictedDebris as string) || 12) * 5))}%` }}
              ></div>
            </div>
          </motion.div>

          {/* Bento Card 2: High Risk Zones */}
          <motion.div 
            custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="col-span-12 md:col-span-6 lg:col-span-4 p-6 sm:p-8 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-full">
                CRITICAL WATCH
              </span>
            </div>
            <div className="flex flex-col mt-6">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Threat Zones</span>
              <span className="text-5xl font-sans font-extrabold text-slate-900 dark:text-white tracking-tight mt-1 font-mono">{highRiskZones}</span>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6 flex justify-between text-xs font-medium">
              <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">Primary Sector:</span>
              <span className="text-orange-600 dark:text-orange-400 font-bold uppercase font-mono">VERSOVA CREEK</span>
            </div>
          </motion.div>

          {/* Bento Card 3: Fleet */}
          <motion.div 
            custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            onClick={() => setIsFleetOpen(true)}
            className="col-span-12 md:col-span-6 lg:col-span-4 p-6 sm:p-8 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/40 rounded-lg">
                <Users className="w-5 h-5 text-sky-500" />
              </div>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full flex items-center gap-1.5 group-hover:bg-orange-500 group-hover:text-white transition-all">
                OPEN FLEET <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex flex-col mt-6">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Response Units</span>
              <span className="text-5xl font-sans font-extrabold text-slate-900 dark:text-white tracking-tight mt-1 font-mono">{data ? data.cleanup_teams_active : '12'}</span>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6 flex justify-between text-xs font-medium">
              <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">Autonomous Skimmers:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">3 ACTIVE DEPLOYED</span>
            </div>
          </motion.div>

          {/* Bento Card 4: Circular */}
          <motion.div 
            custom={5} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="col-span-12 lg:col-span-8 p-6 sm:p-8 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Circular Economy Feasibility</span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Interception & Recovery Rate</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verified upcycler material valuation pipeline</p>
            </div>
            <div className="flex-1 w-full max-w-md">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Interception Efficiency</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{data ? data.recovery_potential : '78'}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${data ? data.recovery_potential : 78}%` }}></div>
              </div>
            </div>
            <Link 
              to="/circular-recovery"
              className="px-5 py-3 border border-slate-200 dark:border-border/70 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-3 transition-all shrink-0"
            >
              <span>VIEW VISION FEEDS</span>
              <ArrowRight className="w-4 h-4 text-orange-500" />
            </Link>
          </motion.div>

        </div>
      </section>

      {/* TACTICAL MAP & MARITIME TELEMETRY SECTION */}
      <section className="p-4 md:p-8 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Map Container */}
          <motion.div 
            custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="lg:col-span-8 relative min-h-[650px] bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl overflow-hidden shadow-sm flex flex-col"
          >
            <div className="absolute inset-0 z-0">
              <IntelligenceMap 
                onSelectBeach={(beach) => {
                  setSelectedBeach(beach);
                  setActiveMissionZone(beach.id);
                }} 
                selectedBeachId={selectedBeach?.id || activeMission?.zoneId} 
                activeLayers={activeLayers}
              />
            </div>

            <div className="relative z-10 p-5 flex justify-between pointer-events-none text-xs font-semibold">
              <div className="px-3 py-1.5 bg-white/90 dark:bg-card/90 backdrop-blur-md border border-slate-200 dark:border-border/70 rounded-lg text-slate-800 dark:text-slate-200 flex items-center gap-2.5 shadow-sm pointer-events-auto">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>
                <span className="font-mono text-xs font-bold">RADAR 04 • LIVE MESH</span>
              </div>
              <div className="px-3 py-1.5 bg-white/90 dark:bg-card/90 backdrop-blur-md border border-slate-200 dark:border-border/70 rounded-lg text-slate-600 dark:text-slate-400 font-mono text-xs shadow-sm pointer-events-auto">
                ZOOM: 12X • AUTO-TRACK
              </div>
            </div>

            <div className="relative z-10 mt-auto p-5 flex flex-col md:flex-row justify-between gap-3 pointer-events-none text-xs font-semibold">
              <div className="px-4 py-3 bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200 dark:border-border/70 rounded-xl text-slate-800 dark:text-slate-200 flex flex-col gap-1 shadow-md pointer-events-auto">
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase">
                  {selectedBeach ? `TARGET: ${selectedBeach.name.toUpperCase()}` : `TARGET: ${activeMission?.zoneName?.toUpperCase() || 'VERSOVA CREEK'}`}
                </span>
                <span className="text-orange-600 dark:text-orange-400 font-mono font-bold text-xs">
                  {selectedBeach 
                    ? `${selectedBeach.lat.toFixed(4)}° N, ${selectedBeach.lon.toFixed(4)}° E • ${selectedBeach.baseline_risk}% RISK`
                    : `${activeMission?.lat?.toFixed(4) || '19.1350'}° N, ${activeMission?.lon?.toFixed(4) || '72.8140'}° E • ${activeMission?.riskScore || 94}% RISK`}
                </span>
              </div>
              <div className="px-4 py-3 bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200 dark:border-border/70 rounded-xl flex gap-3 shadow-md pointer-events-auto items-center">
                {['Current', 'Wind', 'Tide', 'Debris'].map(layer => {
                  const isActive = activeLayers.includes(layer);
                  return (
                    <button
                      key={layer} 
                      onClick={() => toggleLayer(layer)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-all ${
                        isActive 
                          ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Square className={`w-3 h-3 ${isActive ? 'fill-orange-500 text-orange-500' : ''}`} />
                      <span>{layer}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Coastal Intelligence */}
          <motion.div 
            custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="lg:col-span-4 p-6 sm:p-8 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm flex flex-col justify-between"
          >
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-4 text-xs font-semibold">
                <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                  <Radio className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span>SENSOR FUSION</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">99.4% UPTIME</span>
              </div>

              <h2 className="text-2xl font-sans font-bold text-slate-900 dark:text-white">
                Hydrodynamic Vectors & Risk
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl flex flex-col gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Tidal State</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">Rising</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl flex flex-col gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Wind Vector</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">18 KM/H</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl flex flex-col gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Drift Velocity</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">0.54 M/S</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl flex flex-col gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Confidence</span>
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400 font-mono">89.2%</span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 border-l-2 border-orange-500 pl-3">
                Hydrodynamic current convergence indicates elevated debris deposition across <strong className="text-slate-900 dark:text-white font-semibold">Versova Beach</strong> within the next 12-hour window.
              </p>
            </div>

            <div className="pt-6">
              <button 
                onClick={() => setIsAlphaOpen(true)}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 uppercase tracking-wider"
              >
                <ShieldAlert className="w-5 h-5" />
                EXECUTE PROTOCOL ALPHA
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* REAL-TIME TELEMETRY EVENT STREAM */}
      <section className="p-4 md:p-8 pt-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 border-b border-slate-200 dark:border-border/70 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
              <Square className="w-2.5 h-2.5 fill-current" /> Telemetry Log
            </div>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold text-slate-900 dark:text-white">Live Coastal Feed</h2>
          </div>
          
          <div className="flex gap-2">
            {['all', 'alert', 'dispatch', 'info'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActivityFilter(filter)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-all ${
                  activityFilter === filter
                    ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                    : 'bg-white dark:bg-card border-slate-200 dark:border-border/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-slate-200 dark:border-border/70 bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 dark:border-border/70 bg-slate-50 dark:bg-muted/40">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">/var/log/tidal/telemetry.log</span>
          </div>
          
          <div className="flex flex-col h-[380px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {filteredActivity.length > 0 ? (
              filteredActivity.map((activity, index) => {
                const isAlert = activity.type.toLowerCase() === 'alert';
                const isDispatch = activity.type.toLowerCase() === 'dispatch';
                
                return (
                  <motion.div 
                    key={`${activity.time}-${activity.event}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      setSelectedActivityId(`activity_${index}`);
                      setIsAnalysisOpen(true);
                    }}
                    className={`px-5 py-3.5 border-b border-slate-100 dark:border-border/40 cursor-pointer flex flex-col md:flex-row md:items-center gap-4 group transition-colors ${
                      isAlert 
                        ? 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-4 w-48 shrink-0">
                      <span className="text-xs font-mono text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">{activity.time}</span>
                      <span className={`px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider rounded border ${
                        isAlert 
                          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400' 
                          : isDispatch 
                            ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-400' 
                            : 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {activity.type}
                      </span>
                    </div>

                    <p className={`flex-1 text-sm font-medium ${isAlert ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                      {activity.event}
                    </p>

                    <div className="hidden md:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 text-orange-600 dark:text-orange-400 text-xs font-semibold tracking-wider transition-opacity">
                      INSPECT <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-8 font-mono text-xs text-slate-400 text-center">
                 [~] NO LOGS MATCHING ACTIVE FILTER QUERY
              </div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </section>

    </main>
  );
};

export default Overview;
