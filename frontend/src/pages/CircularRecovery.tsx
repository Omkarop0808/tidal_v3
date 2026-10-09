import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  PlayCircle, 
  StopCircle, 
  Sparkles, 
  Recycle, 
  Truck, 
  FileText,
  Sliders,
  Square,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';

export default function CircularRecovery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isClaheActive, setIsClaheActive] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [manifestGenerated, setManifestGenerated] = useState(false);
  const [manifestHash, setManifestHash] = useState('');
  const [isGeneratingManifest, setIsGeneratingManifest] = useState(false);
  const [manifests, setManifests] = useState<any[]>([]);
  const [isLoadingManifests, setIsLoadingManifests] = useState(false);
  const [signingId, setSigningId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadManifests = async () => {
    setIsLoadingManifests(true);
    try {
      const data = await api.getCircularManifests();
      setManifests(data);
    } catch (err) {
      console.error("Failed to load circular manifests:", err);
    } finally {
      setIsLoadingManifests(false);
    }
  };

  useEffect(() => {
    loadManifests();
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setManifestGenerated(false);
      
      const formData = new FormData();
      formData.append('file', file);

      setIsAnalyzing(true);
      try {
        const result = await api.reportObservation(formData);
        setAnalysisResult(result);
      } catch (error) {
        console.error("Error analyzing image:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleExecuteManifest = async () => {
    setIsGeneratingManifest(true);
    try {
      const pending = manifests.find(m => m.status === 'PENDING_VALUATION');
      if (pending) {
        await api.signCircularManifest({ manifest_id: pending.id });
        setManifestHash(pending.id);
      } else {
        const hash = '0x' + Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase();
        setManifestHash(hash);
      }
      await loadManifests();
      setManifestGenerated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingManifest(false);
    }
  };

  const handleSignRowManifest = async (id: string) => {
    setSigningId(id);
    try {
      await api.signCircularManifest({ manifest_id: id });
      await loadManifests();
    } catch (err) {
      console.error("Failed to sign manifest:", err);
    } finally {
      setSigningId(null);
    }
  };

  const estimatedWeight = isLiveMode ? 25.0 : (analysisResult?.ai_analysis?.estimated_weight_kg || 18.4);
  const spotRate = 35.0; 
  const grossValue = Math.round(estimatedWeight * spotRate);

  const totalMassKg = manifests.reduce((acc, m) => acc + (m.plastic_mass_kg || 0), 0);
  const totalGrossInr = manifests.reduce((acc, m) => acc + (m.gross_valuation_inr || 0), 0);
  const totalCo2e = manifests.reduce((acc, m) => acc + (m.co2e_avoided_kg || 0), 0);
  const totalCredits = manifests.reduce((acc, m) => acc + (m.epr_credits || 0), 0);

  return (
    <main className="w-full bg-slate-50 dark:bg-background min-h-screen text-slate-900 dark:text-slate-100 px-4 sm:px-8 lg:px-12 py-8 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      <div className="flex flex-col gap-10">
        
        {/* Header Bar */}
        <div className="flex flex-col gap-3 pb-6 border-b border-slate-200 dark:border-border/70">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-mono text-xs uppercase font-semibold rounded-md flex items-center gap-1.5">
              <Recycle className="w-3.5 h-3.5 text-emerald-500" />
              CIRCULAR VALUATION
            </span>
            <span className="text-orange-600 dark:text-orange-400 font-mono text-xs uppercase font-semibold tracking-wider">
              // YOLO11 + GEMINI PIPELINE
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-sans font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
            Upcycler Exchange
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed border-l-2 border-emerald-500 pl-4">
            Upload field drone imagery or activate the live coastal camera stream. YOLO11 executes classification, while Gemini determines polymer composition, calculates real-time spot valuation, and matches local upcycling facilities.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left: Drone Feed / Vision Upload Viewport (6 cols) */}
          <div className="lg:col-span-6 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="relative w-full h-[480px] bg-slate-900 rounded-xl border border-slate-200 dark:border-border/70 overflow-hidden flex items-center justify-center shadow-inner">
              
              {isLiveMode ? (
                <div className="absolute inset-0 bg-slate-950 overflow-hidden flex flex-col justify-center items-center">
                  <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-4 pointer-events-none">
                    <div className="flex items-center gap-2.5 px-3 py-1.5 bg-black/80 backdrop-blur-md border border-orange-500 text-xs font-mono text-orange-400 font-bold uppercase rounded-lg pointer-events-auto">
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>
                      <span>LIVE FEED // SEC-04</span>
                    </div>

                    <button 
                      onClick={() => setIsClaheActive(!isClaheActive)}
                      className={`px-3 py-1.5 font-mono text-xs uppercase font-bold rounded-lg border pointer-events-auto transition-all flex items-center gap-2 ${
                        isClaheActive 
                          ? 'bg-white text-slate-900 border-white shadow-sm' 
                          : 'bg-black/80 text-slate-400 border-slate-700'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>CLAHE: {isClaheActive ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  <div className={`relative w-full h-full bg-[url('https://images.unsplash.com/photo-1621451537084-482c73073e0f?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center ${
                    isClaheActive ? 'filter grayscale contrast-125' : 'opacity-60 grayscale'
                  }`}>
                    <div className="absolute border-2 border-orange-500 bg-orange-500/20 top-[38%] left-[28%] w-[20%] h-[22%] flex items-start justify-start p-1.5 rounded">
                      <span className="bg-orange-500 text-white font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                        PET (88%)
                      </span>
                    </div>

                    <div className="absolute border-2 border-white bg-white/20 top-[58%] left-[56%] w-[24%] h-[20%] flex items-start justify-start p-1.5 rounded">
                      <span className="bg-white text-slate-900 font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                        NET (92%)
                      </span>
                    </div>

                    <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 animate-pulse"></div>
                  </div>
                </div>
              ) : selectedImage ? (
                <div className="relative w-full h-full">
                  <img 
                    src={selectedImage} 
                    alt="Uploaded Debris" 
                    className="w-full h-full object-cover filter grayscale contrast-125" 
                  />

                  {analysisResult?.ai_analysis?.bounding_boxes?.map((box: any, i: number) => {
                    const [y1, x1, y2, x2] = box.box_2d || [50, 50, 200, 200];
                    return (
                      <div 
                        key={i}
                        className="absolute border-2 border-white bg-white/10 rounded"
                        style={{
                          top: `${(y1 / 480) * 100}%`,
                          left: `${(x1 / 640) * 100}%`,
                          height: `${((y2 - y1) / 480) * 100}%`,
                          width: `${((x2 - x1) / 640) * 100}%`,
                        }}
                      >
                        <span className="absolute -top-7 left-0 bg-white text-slate-900 font-mono text-[10px] uppercase px-2 py-0.5 font-bold rounded shadow-sm whitespace-nowrap">
                          {box.label} {((box.confidence || 0.89) * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-400 p-8 text-center font-mono">
                  <Camera className="w-12 h-12 text-slate-500" />
                  <div className="flex flex-col gap-1">
                    <p className="text-white text-sm font-bold uppercase">Awaiting Visual Telemetry</p>
                    <p className="text-xs text-slate-400">Upload shoreline image or start drone feed</p>
                  </div>
                </div>
              )}

              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center gap-3 z-30">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => { setIsLiveMode(false); handleImageUpload(e); }} 
                  accept="image/*" 
                  className="hidden" 
                />

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-white/95 dark:bg-card/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md border border-slate-200 dark:border-border/70 backdrop-blur-md transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-orange-500" />
                  <span>UPLOAD IMAGE</span>
                </button>

                <button 
                  onClick={() => setIsLiveMode(!isLiveMode)}
                  className={`px-5 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md backdrop-blur-md transition-all flex items-center gap-2 ${
                    isLiveMode 
                      ? 'bg-rose-600 text-white hover:bg-rose-700' 
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white'
                  }`}
                >
                  {isLiveMode ? (
                    <>
                      <StopCircle className="w-4 h-4" />
                      <span>TERMINATE FEED</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      <span>START LIVE FEED</span>
                    </>
                  )}
                </button>
              </div>

              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
                  <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-mono text-xs uppercase tracking-wider text-white font-bold bg-slate-900/90 px-4 py-2 rounded-lg border border-slate-700">
                    ANALYZING POLYMERS...
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
              <span>CLAHE equalization filters turbidity for high-accuracy polymer segmentation.</span>
            </div>
          </div>

          {/* Right: Plastics Exchange HUD & Upcycler Matching (6 cols) */}
          <div className="lg:col-span-6 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-6 justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-border/70">
              <h2 className="text-xl font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Square className="w-4 h-4 fill-orange-500 text-orange-500" />
                EXCHANGE TERMINAL
              </h2>
              <span className="text-xs font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 font-bold rounded-md uppercase">
                LIVE MARKET
              </span>
            </div>

            {/* Live Spot Market Rates */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-muted/30 px-3.5 py-2 rounded-lg border border-slate-100 dark:border-border/50">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  SPOT POLYMER BENCHMARK
                </span>
                <span className="font-mono text-xs text-orange-600 dark:text-orange-400 font-bold">UPDATED 5M AGO</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl flex flex-col gap-1">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">CLEAR PET</div>
                  <div className="font-sans font-bold text-xl text-slate-900 dark:text-white font-mono">₹35.00</div>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl flex flex-col gap-1">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">RIGID HDPE</div>
                  <div className="font-sans font-bold text-xl text-slate-900 dark:text-white font-mono">₹28.50</div>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border/50 rounded-xl flex flex-col gap-1">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">NYLON NETS</div>
                  <div className="font-sans font-bold text-xl text-orange-600 dark:text-orange-400 font-mono">₹42.00</div>
                </div>
              </div>
            </div>

            {/* Current Catch Valuation */}
            <div className="flex flex-col gap-2 mt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Batch Estimation
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-5 bg-slate-50 dark:bg-muted/30 border border-slate-200 dark:border-border/60 rounded-xl flex flex-col gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Classified Mass</span>
                  <span className="text-3xl font-sans font-extrabold text-slate-900 dark:text-white font-mono">
                    {estimatedWeight.toFixed(1)} <span className="text-sm font-normal text-slate-400">KG</span>
                  </span>
                </div>

                <div className="p-5 bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-850/50 rounded-xl flex flex-col gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Gross Value</span>
                  <span className="text-3xl font-sans font-extrabold text-orange-600 dark:text-orange-400 font-mono">
                    ₹{grossValue}
                  </span>
                </div>
              </div>
            </div>

            {/* Smart Upcycler Match Contract */}
            <div className="mt-2 p-6 bg-slate-50 dark:bg-muted/30 border border-slate-200 dark:border-border/70 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-border/60 pb-3">
                <span className="text-xs uppercase font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Square className="w-3 h-3 fill-orange-500 text-orange-500" />
                  UPCYCLER CONTRACT
                </span>
                <span className="text-xs px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-bold rounded">
                  CERTIFIED PARTNER
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-sans font-bold text-slate-900 dark:text-white">
                  {isLiveMode ? 'LUCRO PLASTECYCLE' : (analysisResult?.matched_upcycler || 'LUCRO PLASTECYCLE')}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <Truck className="w-3.5 h-3.5 text-orange-500" />
                  Distance: 12.4 km via Western Expressway
                </span>
              </div>

              {manifestGenerated ? (
                <div className="p-4 bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-850/60 rounded-xl flex flex-col gap-2 text-xs mt-2">
                  <div className="flex items-center justify-between border-b border-orange-200/80 dark:border-orange-850/40 pb-1.5">
                    <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-bold">
                      <FileText className="w-4 h-4" />
                      MANIFEST VERIFIED
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">HASH: {manifestHash}</span>
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Batch: {estimatedWeight} kg • Status: Dispatch Queued
                  </span>
                </div>
              ) : (
                <button 
                  onClick={handleExecuteManifest}
                  disabled={isGeneratingManifest}
                  className="self-start px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2.5 mt-2 disabled:opacity-50"
                >
                  {isGeneratingManifest ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>MINTING LEDGER...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>EXECUTE MANIFEST</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Circular Economy & Real-Time EPR Material Audit Ledger */}
        <div className="flex flex-col gap-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-border/70">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <Recycle className="w-4 h-4 text-emerald-500" />
                <span>OFFICIAL VERIFICATION // RECOVERY REPOSITORY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold text-slate-900 dark:text-white">
                EPR Material Audit Ledger
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadManifests}
                disabled={isLoadingManifests}
                className="px-4 py-2 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-border/70 rounded-xl font-semibold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${isLoadingManifests ? 'animate-spin' : ''}`} />
                <span>REFRESH LEDGER</span>
              </button>
            </div>
          </div>

          {/* Aggregate KPI Summary Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total Recovered</span>
              <span className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-900 dark:text-white font-mono">{totalMassKg.toLocaleString()} KG</span>
              <span className="text-[11px] text-slate-400">All coastal sweeps</span>
            </div>

            <div className="p-5 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase font-semibold">Market Value</span>
              <span className="text-2xl sm:text-3xl font-sans font-extrabold text-orange-600 dark:text-orange-400 font-mono">₹{totalGrossInr.toLocaleString()}</span>
              <span className="text-[11px] text-slate-400">Realized inflow</span>
            </div>

            <div className="p-5 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase font-semibold">CO₂e Avoided</span>
              <span className="text-2xl sm:text-3xl font-sans font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">+{totalCo2e.toFixed(0)} KG</span>
              <span className="text-[11px] text-slate-400">Virgin resin offset</span>
            </div>

            <div className="p-5 bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase font-semibold">EPR Credits</span>
              <span className="text-2xl sm:text-3xl font-sans font-extrabold text-sky-600 dark:text-sky-400 font-mono">{totalCredits}</span>
              <span className="text-[11px] text-slate-400">CPCB compliant</span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="w-full bg-white dark:bg-card border border-slate-200 dark:border-border/70 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-border/70 bg-slate-50 dark:bg-muted/40 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="p-4">MANIFEST REF</th>
                  <th className="p-4">COASTAL ZONE</th>
                  <th className="p-4">MASS & POLYMER</th>
                  <th className="p-4">VALUATION (₹)</th>
                  <th className="p-4">CERTIFIED UPCYCLER</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border/40">
                {manifests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-mono text-xs">
                      AWAITING FIRST COMPLETED FIELD OPERATION TO MINT CERTIFICATE
                    </td>
                  </tr>
                ) : (
                  manifests.map((m) => {
                    const isIssued = m.status === 'MANIFEST_ISSUED' || m.status === 'DISPATCHED_TO_UPCYCLER';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-900 dark:text-white font-mono font-bold">{m.id}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{m.created_at ? new Date(m.created_at).toLocaleDateString() : 'ACTIVE'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-slate-900 dark:text-white font-bold">{m.beach_name || m.beach_id}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-900 dark:text-white font-mono font-bold">{m.plastic_mass_kg} KG</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{m.composition || 'MIXED POLYMERS'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-orange-600 dark:text-orange-400 font-mono font-bold text-sm">₹{Number(m.gross_valuation_inr).toLocaleString()}</span>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">+{m.co2e_avoided_kg} KG CO₂</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Truck className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="text-xs font-semibold">{m.upcycler_facility}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md inline-flex items-center gap-1.5 ${
                            isIssued 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60' 
                              : 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60'
                          }`}>
                            {isIssued ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Clock className="w-3.5 h-3.5 text-orange-500" />}
                            {m.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {isIssued ? (
                            <span className="text-xs text-slate-400 font-mono font-bold uppercase">
                              SIGNED
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSignRowManifest(m.id)}
                              disabled={signingId === m.id}
                              className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all disabled:opacity-50"
                            >
                              {signingId === m.id ? 'SIGNING...' : 'SIGN & ISSUE'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
