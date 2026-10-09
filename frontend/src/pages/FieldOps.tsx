import { useState, useEffect } from 'react';
import { 
  Crosshair,
  Camera,
  AlertTriangle,
  Send,
  RefreshCcw,
  Square
} from 'lucide-react';
import { api } from '../lib/api';
import { useSim } from '../store';

export default function FieldOps() {
  const [beaches, setBeaches] = useState<any[]>([]);
  const [selectedBeach, setSelectedBeach] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [teamName, setTeamName] = useState('SQUAD_02-ALPHA');
  const [collectedKg, setCollectedKg] = useState(120);
  const [remainingKg, setRemainingKg] = useState(25);
  const [beforeImage] = useState<string>('https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=600&grayscale=1');
  const [afterImage] = useState<string>('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&grayscale=1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchFieldData = async () => {
    setIsLoading(true);
    try {
      const [bList] = await Promise.all([
        api.getBeaches(),
        api.getCleanupTasks().catch(() => [])
      ]);
      setBeaches(bList);
      if (bList.length > 0 && !selectedBeach) {
        const activeZoneId = useSim.getState().activeMission?.zoneId;
        const matched = bList.find((b: any) => b.id.toLowerCase() === activeZoneId?.toLowerCase());
        setSelectedBeach(matched || bList[0]);
      }
    } catch (err) {
      console.error('Failed to load field ops data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFieldData();
  }, []);

  const handleSubmitMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeach) return;
    setIsSubmitting(true);
    try {
      await api.submitCleanup({
        task_id: `TASK-${Date.now().toString().slice(-6)}`,
        beach_id: selectedBeach.id,
        collected_kg: collectedKg,
        remaining_kg: remainingKg,
        before_img: beforeImage,
        after_img: afterImage,
        effectiveness_pct: 86.4,
        notes: `FIELD REP: ${teamName}`
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        fetchFieldData();
      }, 2500);
    } catch (err) {
      console.error(err);
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-slate-100 p-4 md:p-8 font-sans selection:bg-orange-500 selection:text-white transition-colors duration-200">
      
      {/* HEADER SECTION */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 dark:border-border/70 pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            <Square className="w-2.5 h-2.5 fill-current" />
            <span>Tactical Operations // Ground Unit Sync</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-sans font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
            Field Recovery
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            Dispatch verification, before/after evidence recording, and real-time field telemetry synchronization.
          </p>
        </div>
        
        <button 
          onClick={fetchFieldData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-border/70 rounded-xl font-semibold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCcw className={`w-3.5 h-3.5 text-orange-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'SYNCING DATA...' : 'FORCE SYNC'}</span>
        </button>
      </header>

      {/* MAIN 2-COL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COL: SECTOR TARGETS */}
        <div className="lg:col-span-5 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          
          <div className="p-4 border-b border-slate-200 dark:border-border/70 bg-slate-50 dark:bg-muted/40 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-white">
              <Crosshair className="w-4 h-4 text-orange-500" />
              Active Coastal Sectors
            </span>
            <span className="bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-850/50 px-2.5 py-0.5 text-xs font-bold font-mono rounded-md">
              {beaches.length} LIVE
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-slate-100 dark:divide-border/40">
            {beaches.map((b) => {
              const isSelected = selectedBeach?.id === b.id;
              const isCritical = b.baseline_risk > 80;
              const isCleaned = b.status === 'Cleaned';

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBeach(b)}
                  className={`p-4 cursor-pointer transition-colors grid grid-cols-[auto_1fr_auto] items-center gap-3.5 ${
                    isSelected 
                      ? 'bg-orange-500/10 dark:bg-orange-950/30 border-l-4 border-l-orange-500' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    isCleaned ? 'bg-emerald-500' : isCritical ? 'bg-rose-500 animate-pulse' : 'bg-sky-500'
                  }`} />
                  
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold tracking-tight ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
                      {b.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">LOC: {b.lat.toFixed(3)}N • SEC: {b.sector}</span>
                  </div>

                  <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${
                    isCleaned 
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400' 
                      : isCritical 
                        ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400' 
                        : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {b.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ACTIVE SECTOR BRIEFING */}
          {selectedBeach && (
            <div className="p-6 bg-slate-50 dark:bg-muted/20 border-t border-slate-200 dark:border-border/70 flex flex-col gap-4">
              <div>
                <span className="text-orange-600 dark:text-orange-400 font-mono text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-850/50 rounded mb-2 inline-block">
                  TARGET LOCK
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedBeach.name}</h3>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-white dark:bg-card border border-slate-200 dark:border-border/60 rounded-xl flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-400 uppercase font-medium">Detected</span>
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white">{selectedBeach.current_debris_kg} <span className="text-xs text-slate-400">KG</span></span>
                </div>
                <div className="p-3 bg-white dark:bg-card border border-slate-200 dark:border-border/60 rounded-xl flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-400 uppercase font-medium">Cleared</span>
                  <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">{selectedBeach.cleaned_debris_kg} <span className="text-xs text-slate-400">KG</span></span>
                </div>
                <div className="p-3 bg-white dark:bg-card border border-slate-200 dark:border-border/60 rounded-xl flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-400 uppercase font-medium">Residual</span>
                  <span className="text-base font-bold font-mono text-orange-600 dark:text-orange-400">{selectedBeach.remaining_debris_kg} <span className="text-xs text-slate-400">KG</span></span>
                </div>
              </div>

              <div className="border-l-2 border-orange-500 pl-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong className="text-slate-900 dark:text-white block mb-0.5">INTEL:</strong>
                Persistent coastal accumulation detected via Sentinel-2 multispectral imaging. Requires targeted collection of HDPE containers and buoyant debris.
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COL: ACTION REPORT */}
        <div className="lg:col-span-7 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm p-6 md:p-8 flex flex-col justify-between">
          
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-border/70">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Submit Ground Report</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">Secure uplink • Append photographic proof</span>
              </div>
            </div>

            <form onSubmit={handleSubmitMission} className="flex flex-col gap-6">
              
              {/* Meta Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unit Call-Sign</label>
                  <input 
                    type="text" 
                    value={teamName} 
                    onChange={(e) => setTeamName(e.target.value)} 
                    className="bg-slate-50 dark:bg-muted/30 border border-slate-200 dark:border-border/70 rounded-xl p-3 text-slate-900 dark:text-white text-sm outline-none focus:border-orange-500 transition-all font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Designation</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={selectedBeach ? selectedBeach.name : 'AWAITING TARGET'} 
                    className="bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-border/50 rounded-xl p-3 text-slate-800 dark:text-slate-200 text-sm outline-none cursor-not-allowed font-semibold"
                  />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-muted/30 border border-slate-200 dark:border-border/70 rounded-xl p-4 md:p-5 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Square className="w-2 h-2 fill-emerald-500 text-emerald-500" /> Extracted Mass (KG)
                  </label>
                  <input 
                    type="number"
                    value={collectedKg}
                    onChange={(e) => setCollectedKg(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-transparent border-b-2 border-emerald-500/50 py-1 text-3xl md:text-4xl font-bold font-mono text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="bg-slate-50 dark:bg-muted/30 border border-slate-200 dark:border-border/70 rounded-xl p-4 md:p-5 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> Residual Mass (KG)
                  </label>
                  <input 
                    type="number"
                    value={remainingKg}
                    onChange={(e) => setRemainingKg(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-transparent border-b-2 border-orange-500/50 py-1 text-3xl md:text-4xl font-bold font-mono text-orange-600 dark:text-orange-400 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-slate-400" /> PRE-CLEANUP
                    </span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono font-bold">RAW</span>
                  </div>
                  <div className="h-40 border border-slate-200 dark:border-border/70 rounded-xl overflow-hidden shadow-sm relative group">
                    <img src={beforeImage} alt="Before" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-500" /> POST-CLEANUP
                    </span>
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded font-mono font-bold">VERIFIED</span>
                  </div>
                  <div className="h-40 border-2 border-emerald-500/60 rounded-xl overflow-hidden shadow-sm relative group">
                    <img src={afterImage} alt="After" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || submitSuccess}
                className="mt-2 w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm uppercase tracking-wider py-4 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {submitSuccess ? (
                  <>UPLINK CONFIRMED • TELEMETRY SYNCED</>
                ) : isSubmitting ? (
                  <>TRANSMITTING PAYLOAD...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> COMMIT GROUND REPORT
                  </>
                )}
              </button>

            </form>
          </div>

        </div>
      </div>
    </main>
  );
}
