import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Save, 
  Wind, 
  CloudRain, 
  Play, 
  Pause, 
  Shield, 
  ShieldCheck, 
  RotateCw, 
  Anchor, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  ArrowRight,
  Square,
  Cpu,
  Recycle,
  Compass,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { Scene } from '../components/Map3D/Scene';
import { runSimulationMiddleware } from '../middleware/simulationMiddleware';
import { useSim, OUTFALL_LOCATIONS } from '../store';

export const Simulate = () => {
  const selectedLocation = useSim(state => state.selectedLocation);
  const debrisMassKg = useSim(state => state.debrisMassKg);
  const materialType = useSim(state => state.materialType);
  const windSpeed = useSim(state => state.windSpeed);
  const precipitation = useSim(state => state.precipitation);
  const barrierEfficiency = useSim(state => state.barrierEfficiency);
  const cleanupTeams = useSim(state => state.cleanupTeams);
  const isBarrierActive = useSim(state => state.isBarrierActive);
  
  const trajectory = useSim(state => state.trajectory);
  const trajectoryBaseline = useSim(state => state.trajectoryBaseline);
  const currentFrameIndex = useSim(state => state.currentFrameIndex);
  const isPlaying = useSim(state => state.isPlaying);
  const playbackSpeed = useSim(state => state.playbackSpeed);
  const cameraView = useSim(state => state.cameraView);
  
  const setSelectedLocation = useSim(state => state.setSelectedLocation);
  const setScenario = useSim(state => state.setScenario);
  const setCurrentFrame = useSim(state => state.setCurrentFrame);
  const togglePlay = useSim(state => state.togglePlay);
  const setIsPlaying = useSim(state => state.setIsPlaying);
  const setPlaybackSpeed = useSim(state => state.setPlaybackSpeed);
  const setCameraView = useSim(state => state.setCameraView);

  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 3D Visual Layer Toggles
  const [showBaseline, setShowBaseline] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [showTrapped, setShowTrapped] = useState(true);
  const [showBeached, setShowBeached] = useState(true);
  const [showForceVectors, setShowForceVectors] = useState(true);
  const [isHudOpen, setIsHudOpen] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && trajectory.length > 0) {
      const stepMs = Math.max(120, Math.round(500 / (playbackSpeed || 1)));
      interval = setInterval(() => {
        setCurrentFrame((currentFrameIndex + 1) % trajectory.length);
      }, stepMs);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentFrameIndex, trajectory.length, setCurrentFrame, playbackSpeed]);

  const runSimulation = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = {
        wind_speed: Number(windSpeed) || 0,
        rainfall_increase: Number(precipitation) || 0,
        barrier_efficiency: Number(isBarrierActive ? barrierEfficiency : 0),
        cleanup_teams: Math.max(1, Number(cleanupTeams) || 4),
        is_barrier_active: Boolean(isBarrierActive),
        lat: Number(selectedLocation.lat),
        lon: Number(selectedLocation.lon)
      };
      
      await runSimulationMiddleware(payload);
      setCurrentFrame(0);
      setIsPlaying(true);
      setToastMessage(`MONTE CARLO EXECUTION COMPLETE // T+0H TO T+72H STREAMING`);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (error) {
      console.error('Simulation run failed:', error);
      setToastMessage(`SIMULATION LINK OFFLINE // VERIFYING TELEMETRY`);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } finally {
      setIsLoading(false);
    }
  }, [windSpeed, precipitation, barrierEfficiency, isBarrierActive, cleanupTeams, selectedLocation.lat, selectedLocation.lon, setCurrentFrame, setIsPlaying]);

  useEffect(() => {
    runSimulation();
  }, [selectedLocation.id]);

  // Debounce parameter changes so drift updates live when sliders are adjusted
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 450);
    return () => clearTimeout(timer);
  }, [windSpeed, precipitation, barrierEfficiency, cleanupTeams, isBarrierActive]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loc = OUTFALL_LOCATIONS.find(l => l.id === e.target.value) || OUTFALL_LOCATIONS[0];
    setSelectedLocation(loc);
  };

  const handleSaveScenario = () => {
    const payload = {
      wind_speed: windSpeed,
      rainfall_increase: precipitation,
      barrier_efficiency: isBarrierActive ? barrierEfficiency : 0,
      cleanup_teams: cleanupTeams,
      lat: selectedLocation.lat,
      lon: selectedLocation.lon,
      savedAt: new Date().toISOString()
    };
    
    try {
      const existing = JSON.parse(localStorage.getItem('tidal_saved_scenarios') || '[]');
      localStorage.setItem('tidal_saved_scenarios', JSON.stringify([...existing, payload]));
    } catch {
      localStorage.setItem('tidal_saved_scenarios', JSON.stringify([payload]));
    }

    setSaveSuccess(true);
    setToastMessage(`CAPTURED: /VOL/SCENARIOS/${Date.now().toString().slice(-6)}.JSON`);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const activeFrame = trajectory[currentFrameIndex] || { hour: 0, beached_percent: 0 };
  const baselineFrame = trajectoryBaseline[currentFrameIndex] || { hour: 0, beached_percent: 0 };

  const baselineBeachedKg = Math.round((baselineFrame.beached_percent / 100) * debrisMassKg);
  const mitigatedBeachedKg = Math.round((activeFrame.beached_percent / 100) * debrisMassKg);
  const capturedOffshoreKg = Math.max(0, debrisMassKg - mitigatedBeachedKg);
  const avoidedPercent = baselineFrame.beached_percent > 0 
    ? Math.max(0, Math.round(((baselineFrame.beached_percent - activeFrame.beached_percent) / baselineFrame.beached_percent) * 100))
    : 0;

  // Compute real hourly trajectory points for the Concentration Curve (T+0 to T+72)
  const trajectoryHours = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72];
  const curvePoints = trajectoryHours.map((h, idx) => {
    let baselinePct = trajectoryBaseline[idx]?.beached_percent;
    let activePct = trajectory[idx]?.beached_percent;

    if (baselinePct === undefined || baselinePct === null) {
      const sigmoid = 1 / (1 + Math.exp(-(h - 26) / 8));
      baselinePct = Math.min(95, Math.round(sigmoid * 78 * (1 + (windSpeed - 20) / 100)));
    }

    if (activePct === undefined || activePct === null) {
      const reduction = (isBarrierActive ? (barrierEfficiency / 100) * 0.65 : 0) + Math.min(0.25, (cleanupTeams / 24) * 0.2);
      activePct = Math.max(5, Math.round(baselinePct * (1 - reduction)));
    }

    const baselineKg = Math.round((baselinePct / 100) * debrisMassKg);
    const activeKg = Math.round((activePct / 100) * debrisMassKg);

    return {
      hour: h,
      index: idx,
      baselinePct,
      activePct,
      baselineKg,
      activeKg,
      x: (idx / (trajectoryHours.length - 1)) * 100,
      yBaseline: Math.max(6, Math.min(44, 44 - (baselinePct / 100) * 36)),
      yActive: Math.max(6, Math.min(44, 44 - (activePct / 100) * 36)),
    };
  });

  const activePoint = curvePoints[currentFrameIndex] || curvePoints[0];
  const baselinePathD = `M ${curvePoints.map(p => `${p.x.toFixed(1)} ${p.yBaseline.toFixed(1)}`).join(' L ')}`;
  const activePathD = `M ${curvePoints.map(p => `${p.x.toFixed(1)} ${p.yActive.toFixed(1)}`).join(' L ')}`;
  const activeAreaD = `M 0 44 L ${curvePoints.map(p => `${p.x.toFixed(1)} ${p.yActive.toFixed(1)}`).join(' L ')} L 100 44 Z`;

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-abyss text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 border-b border-slate-200 dark:border-abyss-border bg-white dark:bg-abyss-card transition-colors">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-semibold rounded-full w-fit">
            <span className="w-2 h-2 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-pulse" />
            <span>HYDRODYNAMIC TWIN // MONTE CARLO ENGINE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-headline font-bold text-slate-900 dark:text-white tracking-tight">
            Drift & Interception Modeling
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed max-w-2xl">
            72-hour stochastic coastal dispersion, offshore containment modeling, and tactical fleet countermeasure dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-2 bg-slate-100 dark:bg-abyss-elevated border border-slate-200 dark:border-abyss-border text-slate-700 dark:text-slate-200 font-mono text-xs font-medium rounded-lg flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-cyan-500" />
            <span>ZONE: <strong className="text-slate-900 dark:text-white font-bold">{selectedLocation.name.split(' ')[0]}</strong></span>
          </span>

          <button 
            onClick={handleSaveScenario}
            className="px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-cyan-600 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-headline font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>SAVE SCENARIO</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {saveSuccess && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-24 right-8 z-50 p-5 bg-white dark:bg-abyss-elevated text-slate-900 dark:text-white border border-cyan-500 flex items-center gap-4 shadow-2xl rounded-xl"
          >
            <CheckCircle2 className="w-6 h-6 text-cyan-500" />
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sm uppercase">CONFIGURATION PERSISTED</span>
              <span className="font-mono text-xs text-cyan-600 dark:text-cyan-300 font-medium">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 lg:p-8 flex-1">
        
        {/* Left Column: Parametric Controls & Countermeasures (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Card 1: Outfall Origin */}
          <div className="p-6 sm:p-7 bg-white dark:bg-abyss-card border border-slate-200 dark:border-abyss-border rounded-xl shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-abyss-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 text-cyan-500 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h2 className="font-headline font-bold text-base text-slate-900 dark:text-white">Outfall Origin & Loading</h2>
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">Step 1: Source Point Coordinates</span>
                </div>
              </div>
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-md">
                CONFIG 01
              </span>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Outfall Release Point</label>
                <select 
                  value={selectedLocation.id}
                  onChange={handleLocationChange}
                  className="w-full bg-slate-50 dark:bg-abyss-elevated border border-slate-300 dark:border-abyss-border focus:border-cyan-500 text-slate-900 dark:text-white px-3.5 py-3 rounded-lg appearance-none outline-none transition-colors cursor-pointer text-sm font-medium"
                >
                  {OUTFALL_LOCATIONS.map(loc => (
                    <option key={loc.id} value={loc.id} className="bg-white dark:bg-abyss-card text-slate-900 dark:text-white">
                      {loc.name} ({loc.lat.toFixed(3)}°N, {loc.lon.toFixed(3)}°E)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Debris Mass (kg)</label>
                  <input 
                    type="number" 
                    value={debrisMassKg}
                    onChange={(e) => setScenario({ debrisMassKg: Math.max(10, parseInt(e.target.value) || 100) })}
                    className="w-full bg-slate-50 dark:bg-abyss-elevated border border-slate-300 dark:border-abyss-border focus:border-cyan-500 text-slate-900 dark:text-white font-mono px-3.5 py-2.5 rounded-lg outline-none transition-colors text-sm font-bold" 
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Polymer Class</label>
                  <select 
                    value={materialType}
                    onChange={(e) => setScenario({ materialType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-abyss-elevated border border-slate-300 dark:border-abyss-border focus:border-cyan-500 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-lg outline-none transition-colors appearance-none cursor-pointer text-sm font-medium"
                  >
                    <option className="bg-white dark:bg-abyss-card text-slate-900 dark:text-white">MIXED (PET / HDPE)</option>
                    <option className="bg-white dark:bg-abyss-card text-slate-900 dark:text-white">NYLON NETS</option>
                    <option className="bg-white dark:bg-abyss-card text-slate-900 dark:text-white">MICRO-PLASTICS (&lt; 5MM)</option>
                    <option className="bg-white dark:bg-abyss-card text-slate-900 dark:text-white">RIGID CONTAINERS</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Ocean Forces */}
          <div className="p-6 sm:p-7 bg-white dark:bg-abyss-card border border-slate-200 dark:border-abyss-border rounded-xl shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-abyss-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                  <Wind className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h2 className="font-headline font-bold text-base text-slate-900 dark:text-white">Ocean Dynamics</h2>
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">Step 2: Hydrodynamic Vectors</span>
                </div>
              </div>
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                ACTIVE
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-abyss-elevated border border-slate-200 dark:border-abyss-border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Wind className="w-4 h-4 text-cyan-500" />
                    ONSHORE WIND VELOCITY
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-300 text-sm font-bold font-mono">{windSpeed} KM/H (SW)</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="60" 
                  value={windSpeed} 
                  onChange={(e) => setScenario({ windSpeed: Number(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-abyss-elevated border border-slate-200 dark:border-abyss-border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-amber-500" />
                    STORM RUNOFF SURGE
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 text-sm font-bold font-mono">+{precipitation} MM</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={precipitation} 
                  onChange={(e) => setScenario({ precipitation: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Countermeasures */}
          <div className="p-6 sm:p-7 bg-white dark:bg-abyss-card border border-slate-200 dark:border-abyss-border rounded-xl shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-abyss-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h2 className="font-headline font-bold text-base text-slate-900 dark:text-white">Tactical Interception</h2>
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">Step 3: Barriers & Fleet Deployment</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              
              {/* Offshore Containment Boom Toggle Card */}
              <div 
                className={`p-4 border-2 transition-all duration-200 flex items-center justify-between cursor-pointer rounded-xl ${
                  isBarrierActive 
                    ? 'bg-emerald-50/70 dark:bg-[#071d18] border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-sm' 
                    : 'bg-slate-50 dark:bg-abyss-elevated border-slate-200 dark:border-abyss-border text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
                onClick={() => setScenario({ isBarrierActive: !isBarrierActive })}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2 rounded-lg ${isBarrierActive ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-abyss-border text-slate-500'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-headline font-bold text-slate-900 dark:text-white tracking-tight">
                      Offshore Containment Boom
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-sans">
                      Anchored marine barrier traps floating plastics seaward
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
                    isBarrierActive 
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40' 
                      : 'bg-slate-200 dark:bg-abyss-border text-slate-500 border border-slate-300 dark:border-slate-700'
                  }`}>
                    {isBarrierActive ? 'ACTIVE' : 'STANDBY'}
                  </span>
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center ${
                    isBarrierActive ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-abyss-border'
                  }`}>
                    {isBarrierActive && <CheckCircle2 className="w-4 h-4 text-white stroke-[3]" />}
                  </div>
                </div>
              </div>

              {isBarrierActive && (
                <div className="p-4 bg-slate-50 dark:bg-abyss-elevated border border-emerald-500/40 rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-200">BOOM CAPTURE EFFICIENCY:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-base font-bold font-mono">{barrierEfficiency}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="90" 
                    value={barrierEfficiency} 
                    onChange={(e) => setScenario({ barrierEfficiency: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
              )}

              <div className="p-4 bg-slate-50 dark:bg-abyss-elevated border border-slate-200 dark:border-abyss-border rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Anchor className="w-5 h-5 text-cyan-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">AUTO SKIMMER SQUADS:</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setScenario({ cleanupTeams: Math.max(2, cleanupTeams - 2) })}
                    className="w-8 h-8 bg-white dark:bg-abyss-card text-slate-800 dark:text-white border border-slate-300 dark:border-abyss-border hover:border-cyan-500 flex items-center justify-center font-bold text-base transition-colors cursor-pointer rounded-lg shadow-2xs"
                  >
                    -
                  </button>
                  <span className="text-xl font-headline font-bold text-slate-900 dark:text-white px-2 min-w-[2rem] text-center font-mono">{cleanupTeams}</span>
                  <button 
                    onClick={() => setScenario({ cleanupTeams: Math.min(24, cleanupTeams + 2) })}
                    className="w-8 h-8 bg-white dark:bg-abyss-card text-slate-800 dark:text-white border border-slate-300 dark:border-abyss-border hover:border-cyan-500 flex items-center justify-center font-bold text-base transition-colors cursor-pointer rounded-lg shadow-2xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Monte Carlo Trigger Button */}
              <button 
                onClick={runSimulation}
                disabled={isLoading}
                className="mt-2 w-full py-4 bg-gradient-to-r from-[#ff4d00] to-[#ea580c] hover:from-[#ff6622] hover:to-[#f97316] text-white font-headline font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-500/25 rounded-xl active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-5 h-5 animate-spin text-white" />
                    <span>CRUNCHING DYNAMICS...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current text-white" />
                    <span>EXECUTE MONTE CARLO</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Ocean-GPT Scenario Analysis */}
          <div className="p-6 bg-white dark:bg-abyss-card border border-slate-200 dark:border-abyss-border rounded-xl shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-abyss-border">
              <div className="flex items-center gap-2.5 text-[#ff4d00]">
                <Cpu className="w-5 h-5" />
                <h3 className="font-headline font-bold text-sm uppercase tracking-wide">OCEAN-GPT SCENARIO ANALYSIS</h3>
              </div>
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-md font-bold">
                AI TACTICAL ADVISORY
              </span>
            </div>
            <p className="text-sm font-sans text-slate-700 dark:text-slate-200 leading-relaxed">
              {windSpeed > 30 ? (
                <span>
                  Severe onshore wind forces (<strong className="text-amber-600 dark:text-amber-400 font-semibold">{windSpeed} km/h</strong>) are accelerating surface drift toward the coastline. 
                </span>
              ) : (
                <span>
                  Moderate wind vectors (<strong className="text-cyan-600 dark:text-cyan-300 font-semibold">{windSpeed} km/h</strong>) indicate stable surface drift pacing. 
                </span>
              )}
              {precipitation > 20 ? (
                <span>
                  Heavy storm runoff (<strong className="text-orange-600 dark:text-orange-400 font-semibold">+{precipitation} mm</strong>) significantly increases outfall buoyant debris loading. 
                </span>
              ) : (
                <span>
                  Nominal storm runoff detected at outfall channel. 
                </span>
              )}
              {isBarrierActive && barrierEfficiency > 60 ? (
                <span>
                  Offshore booms are highly effective (<strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{barrierEfficiency}%</strong> capture), trapping majority of plastics before shoreline contact. 
                </span>
              ) : isBarrierActive ? (
                <span>
                  Containment boom is deployed at <strong className="text-amber-600 dark:text-amber-300 font-semibold">{barrierEfficiency}%</strong> efficiency; some debris may bypass barrier under hydrodynamic load. 
                </span>
              ) : (
                <span>
                  <strong className="text-rose-600 dark:text-rose-400 font-semibold">No offshore barriers deployed.</strong> Shoreline is fully exposed to incoming marine plastics. 
                </span>
              )}
              {cleanupTeams > 10 ? (
                <span>
                  Heavy autonomous fleet deployment (<strong className="text-cyan-600 dark:text-cyan-400 font-semibold">{cleanupTeams} squads</strong>) ensures high-capacity marine interception.
                </span>
              ) : (
                <span>
                  Fleet of <strong className="text-slate-900 dark:text-slate-100 font-semibold">{cleanupTeams} squads</strong> provides localized interception capacity.
                </span>
              )}
            </p>
          </div>

          {/* Physical Simulation Contract */}
          <div className="p-5 bg-slate-50 dark:bg-abyss-elevated border border-slate-200 dark:border-abyss-border rounded-xl flex flex-col gap-3 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-abyss-border pb-2">
              <span className="text-slate-900 dark:text-white font-headline font-bold text-xs uppercase tracking-wide">Physical Simulation Engine Contract</span>
              <span className="text-[#ea580c] dark:text-[#ff4d00] font-mono text-xs font-bold">RK4 ADVECTION // 72H</span>
            </div>
            <div className="text-slate-700 dark:text-slate-200 leading-relaxed flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold shrink-0 text-xs">ADVECTION:</span>
                <span>4th-order Runge-Kutta numerical integration under 2D coastal Eulerian velocity vectors + 3% surface windage slip coefficient.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold shrink-0 text-xs">DISPERSION:</span>
                <span>Stochastic Brownian diffusion term with isotropic diffusivity coefficient D = 2.5 m²/s.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold shrink-0 text-xs">OFFSHORE BOOM:</span>
                <span>Semi-circular 800m seaward perimeter; intercepted particles are pinned to barrier arc ({isBarrierActive ? barrierEfficiency : 0}% efficiency).</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] pt-1.5 border-t border-slate-200 dark:border-abyss-border italic">
                *Model operates as a 2D surface layer simulation. 3D vertical water-column mixing and microplastic bio-fouling sedimentation are not modeled in this release.
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: 3D Digital Twin Viewport & Comparative Metrics Dashboard (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="relative w-full h-[640px] lg:h-[700px] min-h-[580px] bg-black rounded-2xl overflow-hidden border border-slate-200 dark:border-[#262626] flex flex-col shadow-xl">
            
            {/* 3D Scene Canvas in Background */}
            <div className="absolute inset-0 z-0 opacity-100">
              <Scene 
                showBaseline={showBaseline}
                showActive={showActive}
                showTrapped={showTrapped}
                showBeached={showBeached}
                showForceVectors={showForceVectors}
              />
            </div>

            {/* Top Navigation & Controls Toolbar */}
            <div className="relative z-20 px-4 py-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
              {/* Left: Location, Camera Perspective Switcher & HUD Toggle */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap pointer-events-auto">
                <div className="hud-dark flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 dark:bg-black/90 backdrop-blur-md text-xs font-mono text-white font-bold tracking-wider uppercase border border-slate-700/60 dark:border-[#262626] rounded-lg shadow-md">
                  <Square className="w-3 h-3 fill-white text-white" />
                  <span>MUMBAI TWIN</span>
                </div>

                {/* Camera View Switcher */}
                <div className="hud-dark flex items-center bg-slate-900/90 dark:bg-black/90 backdrop-blur-md border border-slate-700/60 dark:border-[#262626] p-1 rounded-lg font-mono text-xs uppercase shadow-md">
                  <span className="text-slate-400 dark:text-neutral-400 px-2 font-bold">CAM:</span>
                  {(['perspective', 'topDown', 'shoreline'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setCameraView(mode)}
                      className={`px-2.5 py-1 font-semibold rounded transition-colors cursor-pointer text-xs ${
                        cameraView === mode 
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs' 
                          : 'text-slate-300 dark:text-neutral-300 hover:text-white hover:bg-slate-800 dark:hover:bg-[#141414]'
                      }`}
                    >
                      {mode === 'perspective' ? '45° OBLIQUE' : mode === 'topDown' ? '90° NADIR' : '15° COASTAL'}
                    </button>
                  ))}
                </div>

                {/* HUD Visibility Toggle Button */}
                <button
                  onClick={() => setIsHudOpen(prev => !prev)}
                  title={isHudOpen ? "Hide Mission Telemetry HUD to inspect 3D Twin & Forecast" : "Show Mission Telemetry HUD"}
                  className={`hud-dark flex items-center gap-1.5 px-2.5 py-1.5 backdrop-blur-md text-xs font-mono font-bold uppercase border rounded-lg pointer-events-auto transition-colors cursor-pointer shadow-md ${
                    isHudOpen 
                      ? 'bg-slate-900/90 dark:bg-black/90 text-slate-300 dark:text-neutral-300 border-slate-700/60 dark:border-[#262626] hover:text-white hover:bg-slate-800 dark:hover:bg-[#141414]' 
                      : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/25'
                  }`}
                >
                  {isHudOpen ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
                  <span className="hidden sm:inline">{isHudOpen ? "HUD" : "SHOW HUD"}</span>
                </button>
              </div>
              
              {/* Right: Interactive Layer Toggles Legend */}
              <div className="hud-dark flex flex-wrap items-center gap-1.5 sm:gap-2 px-3 py-1.5 bg-slate-900/90 dark:bg-black/90 backdrop-blur-md text-xs font-mono border border-slate-700/60 dark:border-[#262626] rounded-xl pointer-events-auto font-medium uppercase tracking-wider shadow-md">
                <button
                  onClick={() => setShowBaseline(prev => !prev)}
                  title="Toggle Baseline Ghost Trajectory"
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors border cursor-pointer ${
                    showBaseline 
                      ? 'border-slate-500 dark:border-neutral-500 text-slate-200 dark:text-neutral-200 bg-slate-800 dark:bg-[#171717]' 
                      : 'border-transparent text-slate-500 dark:text-neutral-500 opacity-60'
                  }`}
                >
                  <span className="w-2.5 h-2.5 bg-slate-500 rounded-xs"></span>
                  <span>BASELINE (GHOST)</span>
                </button>

                <button
                  onClick={() => setShowActive(prev => !prev)}
                  title="Toggle Active Floating Plastic Particles"
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors border cursor-pointer ${
                    showActive 
                      ? 'border-white text-white bg-slate-800 dark:bg-[#171717]' 
                      : 'border-transparent text-slate-500 dark:text-neutral-500 opacity-60'
                  }`}
                >
                  <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
                  <span>FLOATING DEBRIS</span>
                </button>

                <button
                  onClick={() => setShowTrapped(prev => !prev)}
                  title="Toggle Debris Intercepted at Offshore Boom"
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors border cursor-pointer ${
                    showTrapped 
                      ? 'border-cyan-400 text-cyan-300 bg-slate-800 dark:bg-[#171717]' 
                      : 'border-transparent text-slate-500 dark:text-neutral-500 opacity-60'
                  }`}
                >
                  <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse"></span>
                  <span>INTERCEPTED (BOOM)</span>
                </button>

                <button
                  onClick={() => setShowBeached(prev => !prev)}
                  title="Toggle Debris Beached on Shoreline"
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors border cursor-pointer ${
                    showBeached 
                      ? 'border-orange-400 text-orange-300 bg-slate-800 dark:bg-[#171717]' 
                      : 'border-transparent text-slate-500 dark:text-neutral-500 opacity-60'
                  }`}
                >
                  <span className="w-2.5 h-2.5 bg-orange-400 rounded-full"></span>
                  <span>BEACHED ON SHORE</span>
                </button>

                <button
                  onClick={() => setShowForceVectors(prev => !prev)}
                  title="Toggle Current & Wind Flow Vectors"
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors border cursor-pointer ${
                    showForceVectors 
                      ? 'border-slate-400 dark:border-neutral-400 text-white bg-slate-800 dark:bg-[#171717]' 
                      : 'border-transparent text-slate-500 dark:text-neutral-500 opacity-60'
                  }`}
                >
                  <span className="w-2.5 h-2.5 border border-white/60 flex items-center justify-center text-[7px] text-white">▲</span>
                  <span>FLOW VECTORS</span>
                </button>
              </div>
            </div>

            {/* Middle Viewport Area: Left Tactical Mission & Telemetry HUD Panel (Collapsible) */}
            <div className="relative z-20 flex-1 px-4 py-2 sm:px-5 pointer-events-none flex items-start justify-start">
              <AnimatePresence mode="wait">
                {isHudOpen ? (
                  <motion.div
                    key="hud-expanded"
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="hud-dark pointer-events-auto w-[330px] sm:w-[360px] bg-slate-900/95 dark:bg-black/95 backdrop-blur-md border border-slate-700/70 dark:border-[#262626] rounded-xl shadow-2xl p-4 flex flex-col gap-3.5 transition-all"
                  >
                    {/* Purpose & Objective */}
                    <div className="flex flex-col gap-1.5 border-l-2 border-[#ff4d00] pl-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[#ff4d00] font-headline font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00] animate-pulse"></span>
                          PURPOSE & OBJECTIVE
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-400 px-1.5 py-0.5 bg-slate-800 dark:bg-[#141414] border border-slate-700/60 dark:border-[#262626] rounded">
                            RK4 ENGINE
                          </span>
                          <button
                            onClick={() => setIsHudOpen(false)}
                            title="Minimize HUD to see full 3D Twin & Forecast"
                            className="p-1 hover:bg-slate-800 dark:hover:bg-[#171717] rounded text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-0.5 text-[10px] font-mono"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">HIDE</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs sm:text-[13px] font-sans text-slate-200 dark:text-neutral-200 leading-relaxed font-normal">
                        Simulates Monte-Carlo hydrodynamic drift to forecast shoreline beaching impact and guide fleet countermeasure placement.
                      </p>
                    </div>

                    {/* Real-time Dynamic Particle Telemetry */}
                    <div className="border-t border-slate-800 dark:border-[#262626] pt-3 flex flex-col gap-2.5 font-mono text-xs uppercase tracking-wider">
                      <div className="flex items-center justify-between text-slate-300 dark:text-neutral-300 font-bold">
                        <span className="flex items-center gap-1.5 text-white">
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          TELEMETRY (T+{activeFrame.hour}H)
                        </span>
                        <span className="text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded text-[11px]">
                          {activeFrame.particles?.length || 0} PARTICLES
                        </span>
                      </div>

                      {/* Floating Debris Row with Progress Bar */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] sm:text-xs">
                          <span className="flex items-center gap-1.5 text-white font-medium">
                            <span className="w-2 h-2 bg-white rounded-full"></span>
                            FLOATING DEBRIS
                          </span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-slate-400 dark:text-neutral-400 text-[10px]">
                              ({Math.max(0, (activeFrame.particles?.length || 0) - (activeFrame.particles?.filter((p: any) => p.trapped).length || 0) - (activeFrame.particles?.filter((p: any) => p.beached).length || 0))} pts)
                            </span>
                            <span className="text-white">
                              {activeFrame.particles ? Math.max(0, 100 - Math.round(((activeFrame.particles.filter((p: any) => p.trapped).length + activeFrame.particles.filter((p: any) => p.beached).length) / Math.max(1, activeFrame.particles.length)) * 100)) : 100}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-800 dark:bg-[#171717] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-white h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${activeFrame.particles ? Math.max(0, 100 - Math.round(((activeFrame.particles.filter((p: any) => p.trapped).length + activeFrame.particles.filter((p: any) => p.beached).length) / Math.max(1, activeFrame.particles.length)) * 100)) : 100}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Intercepted Debris Row with Progress Bar */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] sm:text-xs">
                          <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                            INTERCEPTED (BOOM)
                          </span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-cyan-600 dark:text-cyan-500/80 text-[10px]">
                              ({activeFrame.particles?.filter((p: any) => p.trapped).length || 0} pts)
                            </span>
                            <span className="text-cyan-400">
                              {activeFrame.particles ? Math.round((activeFrame.particles.filter((p: any) => p.trapped).length / Math.max(1, activeFrame.particles.length)) * 100) : 0}% [DEFENDED]
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-800 dark:bg-[#171717] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-cyan-400 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                            style={{
                              width: `${activeFrame.particles ? Math.round((activeFrame.particles.filter((p: any) => p.trapped).length / Math.max(1, activeFrame.particles.length)) * 100) : 0}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Beached on Shore Row with Progress Bar */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] sm:text-xs">
                          <span className="flex items-center gap-1.5 text-orange-400 font-medium">
                            <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                            BEACHED ON SHORE
                          </span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-orange-600 dark:text-orange-500/80 text-[10px]">
                              ({activeFrame.particles?.filter((p: any) => p.beached).length || 0} pts)
                            </span>
                            <span className="text-orange-400">
                              {activeFrame.particles ? Math.round((activeFrame.particles.filter((p: any) => p.beached).length / Math.max(1, activeFrame.particles.length)) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-800 dark:bg-[#171717] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-orange-400 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(251,146,60,0.4)]"
                            style={{
                              width: `${activeFrame.particles ? Math.round((activeFrame.particles.filter((p: any) => p.beached).length / Math.max(1, activeFrame.particles.length)) * 100) : 0}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Barrier & Deployment Status Sub-row */}
                      <div className="pt-2 border-t border-slate-800/80 dark:border-[#262626] flex items-center justify-between text-[10px] text-slate-400 dark:text-neutral-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isBarrierActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                          BARRIER: {isBarrierActive ? `ACTIVE (${barrierEfficiency}%)` : 'STANDBY'}
                        </span>
                        <span className="text-slate-300 dark:text-neutral-300">
                          LOC: {selectedLocation.name.split(' ')[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    key="hud-collapsed"
                    initial={{ opacity: 0, scale: 0.9, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -6 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setIsHudOpen(true)}
                    title="Click to expand full Mission Objective & Telemetry HUD"
                    className="hud-dark pointer-events-auto flex items-center gap-2.5 px-3 py-2 bg-slate-900/90 dark:bg-black/90 backdrop-blur-md border border-slate-700/70 dark:border-[#262626] hover:border-cyan-500/60 dark:hover:border-cyan-500/60 rounded-xl shadow-2xl text-xs font-mono text-white transition-all cursor-pointer group hover:scale-[1.02]"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#ff4d00] group-hover:bg-cyan-400 animate-pulse" />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 dark:text-neutral-200 uppercase tracking-wider text-[11px]">
                        HUD TELEMETRY (T+{activeFrame.hour}H)
                      </span>
                      <span className="text-cyan-400 text-[10px] bg-cyan-950/40 border border-cyan-800/40 px-1.5 py-0.5 rounded font-bold">
                        {activeFrame.particles ? Math.round((activeFrame.particles.filter((p: any) => p.trapped).length / Math.max(1, activeFrame.particles.length)) * 100) : 0}% DEFENDED
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 group-hover:text-cyan-400 pl-1.5 border-l border-slate-700 dark:border-[#262626]">
                      <span>EXPAND</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom: Playback & Timeline Controls Bar */}
            <div className="hud-dark relative z-20 mt-auto p-4 sm:p-5 m-3 sm:m-4 bg-slate-900/90 dark:bg-black/95 backdrop-blur-md border border-slate-700/60 dark:border-[#262626] rounded-xl flex flex-col gap-3.5 shadow-2xl pointer-events-auto">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono uppercase font-semibold tracking-wider">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={togglePlay}
                    className="w-10 h-10 bg-white hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition-colors rounded-lg cursor-pointer shadow-md"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <span className="text-white text-base font-bold font-headline">
                    T + {activeFrame.hour}H FORECAST
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Playback Speed Multipliers */}
                  <div className="flex items-center bg-slate-800 dark:bg-[#141414] border border-slate-700 dark:border-[#262626] p-1 rounded-lg gap-1">
                    <span className="text-slate-400 dark:text-neutral-400 text-xs px-1 font-bold">SPEED:</span>
                    {[0.5, 1, 2, 4].map(spd => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2 py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
                          playbackSpeed === spd 
                            ? 'bg-cyan-500 text-slate-950 font-bold' 
                            : 'text-slate-300 dark:text-neutral-300 hover:text-white hover:bg-slate-700 dark:hover:bg-[#1f2937]'
                        }`}
                      >
                        {spd}X
                      </button>
                    ))}
                  </div>

                  <div className="text-slate-300 dark:text-neutral-300 font-mono text-xs">
                    <span>
                      FRAME: <strong className="text-white font-bold">{currentFrameIndex + 1}</strong> / {trajectory.length || 13}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <input 
                  type="range" 
                  min="0" 
                  max={Math.max(0, trajectory.length - 1)} 
                  value={currentFrameIndex} 
                  onChange={(e) => { setCurrentFrame(Number(e.target.value)); if (isPlaying) togglePlay(); }}
                  className="w-full accent-cyan-400" 
                />
                <div className="flex justify-between text-xs font-mono font-semibold uppercase tracking-wider pt-1">
                  {[
                    { label: 'T+0H REL', index: 0 },
                    { label: 'T+18H SURGE', index: 3 },
                    { label: 'T+36H PEAK', index: 6 },
                    { label: 'T+54H DEFL', index: 9 },
                    { label: 'T+72H END', index: 12 },
                  ].map(anchor => (
                    <button
                      key={anchor.label}
                      onClick={() => {
                        if (trajectory.length > anchor.index) {
                          setCurrentFrame(anchor.index);
                        }
                      }}
                      className={`hover:underline cursor-pointer transition-colors ${
                        currentFrameIndex === anchor.index 
                          ? 'text-cyan-400 font-bold underline' 
                          : 'text-slate-400 dark:text-neutral-400 hover:text-white'
                      }`}
                    >
                      {anchor.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Unmitigated Baseline Card */}
            <div className="p-6 bg-white dark:bg-abyss-card border border-rose-200 dark:border-rose-950/60 border-l-4 border-l-rose-500 rounded-xl shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-abyss-border">
                <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                  <XCircle className="w-5 h-5" />
                  <h3 className="font-headline font-bold text-sm uppercase tracking-wide">
                    UNMITIGATED BASELINE
                  </h3>
                </div>
                <span className="text-xs font-mono text-rose-600 dark:text-rose-400 font-semibold px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-md">
                  NO INTERVENTION
                </span>
              </div>

              <div className="flex items-baseline justify-between font-mono">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 uppercase font-semibold">Shoreline Beaching</span>
                  <span className="font-headline font-extrabold text-4xl sm:text-5xl text-rose-600 dark:text-rose-400 font-mono">
                    {baselineFrame.beached_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 uppercase font-semibold">Beached Mass</span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">{baselineBeachedKg} KG</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed border-l-2 border-rose-500/60 pl-3">
                Surface currents transport unmitigated plastics eastward, causing severe accumulation across <strong className="text-slate-900 dark:text-white font-semibold">{selectedLocation.name.split(' ')[0]}</strong>.
              </p>
            </div>

            {/* Mitigated Intervention Card */}
            <div className="p-6 bg-white dark:bg-abyss-card border border-emerald-200 dark:border-emerald-950/60 border-l-4 border-l-emerald-500 rounded-xl shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-abyss-border">
                <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <h3 className="font-headline font-bold text-sm uppercase tracking-wide">
                    MITIGATED INTERVENTION
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
                  {avoidedPercent}% AVOIDED
                </span>
              </div>

              <div className="flex items-baseline justify-between font-mono">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 uppercase font-semibold">Offshore Capture</span>
                  <span className="font-headline font-extrabold text-4xl sm:text-5xl text-emerald-600 dark:text-emerald-400 font-mono">
                    {(100 - activeFrame.beached_percent).toFixed(1)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 uppercase font-semibold">Captured Mass</span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">{capturedOffshoreKg} KG</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed border-l-2 border-emerald-500 pl-3">
                Offshore boom barrier and autonomous skimmers trap plastics seaward, protecting <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{avoidedPercent}%</strong> of the coastal shoreline.
              </p>
            </div>

          </div>

          {/* DYNAMIC CONCENTRATION CURVE */}
          <div className="p-6 bg-white dark:bg-abyss-card border border-slate-200 dark:border-abyss-border rounded-xl shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-cyan-500" />
                <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white">Hydrodynamic Concentration Curve</h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-medium">
                  <span className="w-3 h-0.5 bg-rose-500 inline-block"></span> Baseline
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span> Mitigated
                </span>
                <span className="text-cyan-600 dark:text-cyan-300 font-semibold px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded-md uppercase">
                  T+36H PEAK RISK
                </span>
              </div>
            </div>

            {/* Live Chart Canvas */}
            <div className="h-44 w-full bg-slate-50 dark:bg-abyss-elevated border border-slate-200 dark:border-abyss-border rounded-xl p-4 flex flex-col justify-between relative overflow-hidden font-mono">
              
              {/* Telemetry Readout Header */}
              <div className="flex items-center justify-between text-xs border-b border-slate-200 dark:border-slate-800 pb-2 z-10">
                <span className="text-slate-600 dark:text-slate-300">
                  PLAYHEAD <strong className="text-cyan-600 dark:text-cyan-400 font-bold">T+{activePoint.hour}H</strong>: Mitigated Beaching <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{activePoint.activeKg} KG</strong> ({activePoint.activePct}%) vs Baseline <strong className="text-rose-600 dark:text-rose-400 font-bold">{activePoint.baselineKg} KG</strong> ({activePoint.baselinePct}%)
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {Math.max(0, activePoint.baselineKg - activePoint.activeKg)} KG AVOIDED
                </span>
              </div>

              {/* Dynamic SVG Curves */}
              <div className="relative flex-1 w-full my-1">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 50">
                  <defs>
                    <linearGradient id="simActiveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1="0" y1="12" x2="100" y2="12" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="2 2" strokeWidth="0.8" />
                  <line x1="0" y1="28" x2="100" y2="28" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="2 2" strokeWidth="0.8" />
                  <line x1="0" y1="44" x2="100" y2="44" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1" />

                  {/* Mitigated Area Fill */}
                  <path d={activeAreaD} fill="url(#simActiveGradient)" />

                  {/* Baseline Curve (Red / Rose Dashed Line) */}
                  <path 
                    d={baselinePathD} 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth="2" 
                    strokeDasharray="3 2" 
                  />

                  {/* Mitigated Curve (Emerald Solid Line) */}
                  <path 
                    d={activePathD} 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="2.5" 
                  />

                  {/* Active Playhead Vertical Line */}
                  <line 
                    x1={activePoint.x} 
                    y1="6" 
                    x2={activePoint.x} 
                    y2="44" 
                    stroke="#00e5ff" 
                    strokeWidth="1.5" 
                    strokeDasharray="2 2" 
                  />

                  {/* Active Playhead Cursor Dots */}
                  <circle 
                    cx={activePoint.x} 
                    cy={activePoint.yBaseline} 
                    r="3" 
                    fill="#ef4444" 
                  />
                  <circle 
                    cx={activePoint.x} 
                    cy={activePoint.yActive} 
                    r="4" 
                    fill="#00e5ff" 
                    stroke="#ffffff" 
                    strokeWidth="1"
                    className="animate-pulse" 
                  />
                </svg>
              </div>

              {/* X-Axis Timeline Markers */}
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 z-10 font-medium">
                <span>T+0H REL</span>
                <span>T+18H SURGE</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">T+36H PEAK LOAD</span>
                <span>T+54H DECAY</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">T+72H STEADY STATE</span>
              </div>
            </div>

            {/* Plastics Exchange & Real-Time Circular Economic Ledger */}
            <div className="p-5 bg-slate-50 dark:bg-abyss-elevated border border-slate-200 dark:border-abyss-border rounded-xl flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-mono text-xs font-bold uppercase tracking-wider">
                  <Recycle className="w-4 h-4 text-[#ea580c] dark:text-[#ff4d00]" />
                  <span>Plastics Exchange // Value Recovery</span>
                </div>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">₹35.0 / KG SPOT RATE</span>
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono text-center">
                <div className="p-3.5 bg-white dark:bg-abyss-card border border-slate-200 dark:border-abyss-border rounded-lg flex flex-col gap-1 shadow-2xs">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Recovered Value</span>
                  <span className="text-xl sm:text-2xl font-headline font-extrabold text-slate-900 dark:text-white">₹{(capturedOffshoreKg * 35).toLocaleString()}</span>
                </div>
                <div className="p-3.5 bg-white dark:bg-abyss-card border border-slate-200 dark:border-abyss-border rounded-lg flex flex-col gap-1 shadow-2xs">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">CO₂e Avoided</span>
                  <span className="text-xl sm:text-2xl font-headline font-extrabold text-emerald-600 dark:text-emerald-400">+{Math.round(capturedOffshoreKg * 1.8)} KG</span>
                </div>
                <div className="p-3.5 bg-white dark:bg-abyss-card border border-slate-200 dark:border-abyss-border rounded-lg flex flex-col gap-1 shadow-2xs">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">EPR Credits</span>
                  <span className="text-xl sm:text-2xl font-headline font-extrabold text-[#ea580c] dark:text-[#ff4d00]">{Math.round(capturedOffshoreKg * 1.2)}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed border-l-2 border-[#ea580c] dark:border-[#ff4d00] pl-3">
                Offshore interception of <strong className="text-slate-900 dark:text-white font-bold">{capturedOffshoreKg} kg</strong> prevents microplastic weathering, generating verifiable EPR credits and circular revenue to cover squad operations.
              </p>
            </div>

            {/* Unified Tactical Fleet Dispatch Card */}
            <div className="p-5 bg-slate-50 dark:bg-abyss-elevated border border-slate-200 dark:border-abyss-border rounded-xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>TACTICAL FLEET DISPATCH // INTERCEPT VECTOR</span>
                </div>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                  STATUS: READY FOR ROUTING
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans">
                    Recommended Vector: Deploy <strong className="text-slate-900 dark:text-white font-bold">{Math.max(2, Math.round(cleanupTeams / 2))} skimmer squads</strong> to defend <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{selectedLocation.name.split(' ')[0]}</strong> outfall perimeter.
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    SECTOR COORD: {selectedLocation.lat.toFixed(3)}°N, {selectedLocation.lon.toFixed(3)}°E // RISK FACTOR: {avoidedPercent}% AVOIDABLE
                  </span>
                </div>

                <Link 
                  to="/hotspots"
                  className="px-6 py-3.5 bg-slate-900 dark:bg-white hover:bg-cyan-600 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-colors shrink-0 rounded-xl cursor-pointer shadow-md"
                >
                  <span>DEPLOY TO HOTSPOTS</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Simulate;
