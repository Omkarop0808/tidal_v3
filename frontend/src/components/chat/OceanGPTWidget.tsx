import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  HelpCircle,
  Compass,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useSim } from '../../store';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const OceanGPTWidget = () => {
  const location = useLocation();
  const activeMission = useSim(state => state.activeMission);
  const currentFrameIndex = useSim(state => state.currentFrameIndex);
  const trajectory = useSim(state => state.trajectory);
  const windSpeed = useSim(state => state.windSpeed);
  const precipitation = useSim(state => state.precipitation);
  const isBarrierActive = useSim(state => state.isBarrierActive);
  const barrierEfficiency = useSim(state => state.barrierEfficiency);
  const cleanupTeams = useSim(state => state.cleanupTeams);
  const isPlaying = useSim(state => state.isPlaying);

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeFrame = trajectory[currentFrameIndex] || null;

  // Dynamic context-aware suggested prompts based on the active screen
  const suggestedPrompts = useMemo(() => {
    const path = location.pathname;
    if (path.includes('simulate')) {
      return [
        "What is this simulation showing currently?",
        "What do the white, blue, and orange dots mean?",
        "Explain the RK4 drift physics model",
        "How does onshore wind affect beaching risk?"
      ];
    } else if (path.includes('field-ops')) {
      return [
        "How do I submit a field ground report?",
        "Explain extracted vs residual debris mass",
        "What is the current beaching risk at Juhu Beach?",
        "How does photo validation work?"
      ];
    } else if (path.includes('circular-recovery')) {
      return [
        "What does CLAHE turbidity filtering do?",
        "What are current spot prices for PET and HDPE?",
        "How does upcycler smart matching work?",
        "Explain cryptographic EPR manifests"
      ];
    } else if (path.includes('hotspots')) {
      return [
        "How does Hungarian fleet optimization work?",
        "Why is Versova Creek flagged as critical?",
        "Explain the spatial accumulation risk score",
        "What is the predicted 24-hour debris influx?"
      ];
    } else if (path.includes('model-lab')) {
      return [
        "Explain XGBoost feature importance",
        "What triggers covariate drift retraining?",
        "How does active learning improve accuracy?"
      ];
    }
    return [
      "What is this simulation showing currently?",
      "What do the white, blue, and orange dots mean?",
      "How does Hungarian fleet optimization work?",
      "What is the status of Versova Creek?"
    ];
  }, [location.pathname]);

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      sender: 'bot', 
      text: "👋 **Welcome to TIDAL Tactical Command.** I am **Ocean-GPT**, your real-time marine intelligence copilot.\n\nI monitor hydrodynamic drift, fleet dispatch, and circular recovery in real-time. Ask me anything about what's on your screen, what the simulation dots mean, or how to use any feature!",
      timestamp: 'Now'
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newUserMsg: Message = { 
      id: Date.now().toString(), 
      sender: 'user', 
      text: textToSend,
      timestamp: timeStr
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsLoading(true);

    // Calculate real-time particles breakdown if available
    let floatingPct = 10;
    let trappedPct = 31;
    let beachedPct = 59;
    if (activeFrame && activeFrame.particles && activeFrame.particles.length > 0) {
      const total = activeFrame.particles.length;
      const beachedCount = activeFrame.particles.filter((p: any) => p.beached).length;
      const trappedCount = activeFrame.particles.filter((p: any) => p.trapped).length;
      beachedPct = Math.round((beachedCount / total) * 100);
      trappedPct = Math.round((trappedCount / total) * 100);
      floatingPct = Math.max(0, 100 - beachedPct - trappedPct);
    }

    const telemetryPayload = {
      message: textToSend,
      current_route: location.pathname,
      active_zone: {
        id: activeMission?.zoneId,
        name: activeMission?.zoneName,
        sector: activeMission?.sector,
        riskScore: activeMission?.riskScore,
        debrisKg: activeMission?.debrisKg
      },
      sim_context: {
        currentHour: activeFrame?.hour ?? (currentFrameIndex * 6),
        currentFrame: currentFrameIndex + 1,
        totalFrames: trajectory.length || 13,
        isPlaying,
        windSpeed,
        precipitation,
        isBarrierActive,
        barrierEfficiency,
        cleanupTeams,
        floatingPercent: floatingPct,
        trappedPercent: trappedPct,
        beachedPercent: beachedPct
      }
    };

    try {
      const { api } = await import('../../lib/api');
      const res = await api.chat(telemetryPayload);
      const newBotMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'bot', 
        text: res.response || "Telemetry acknowledged. Tactical stream online.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newBotMsg]);
    } catch (error) {
      console.error('Error sending message to Ocean-GPT:', error);
      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'bot', 
        text: "⚠️ **Direct satellite link interrupted.** Active mission target is **Versova Creek Outfall** with **520 kg** predicted accumulation. Containment boom barrier is active with 12 skimmer squads on standby.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Simple Markdown text formatter for high-legibility rendering
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      // Header ###
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-headline font-bold text-sm text-slate-900 dark:text-white mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Header ##
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-headline font-bold text-base text-slate-900 dark:text-white mt-2 mb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      // Bullet * or -
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const content = line.substring(2);
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5 pl-1 text-slate-800 dark:text-slate-200">
            <span className="text-cyan-500 font-bold shrink-0">•</span>
            <span>{parseInlineStyles(content)}</span>
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Standard line
      return (
        <p key={idx} className="my-0.5 leading-relaxed text-slate-800 dark:text-slate-200">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  const parseInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="text-slate-700 dark:text-slate-300">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 font-mono text-xs rounded border border-slate-200 dark:border-slate-700">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      {isOpen && (
        <div className={`mb-3 flex flex-col bg-white dark:bg-[#0b1320] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isExpanded 
            ? 'w-[92vw] sm:w-[580px] h-[82vh] max-h-[800px]' 
            : 'w-[92vw] sm:w-[420px] h-[560px] max-h-[75vh]'
        }`}>
          
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 px-4 bg-slate-50 dark:bg-[#0e1726] border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-headline font-bold text-sm text-slate-900 dark:text-white">
                    OCEAN-GPT
                  </h3>
                  <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-bold rounded">
                    LIVE COPILOT
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Observing: {location.pathname.replace('/', '') || 'overview'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close Ocean-GPT"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-Time Screen Context Pill */}
          <div className="px-4 py-2 bg-slate-100/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/60 text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-medium truncate">
              <Compass className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              Zone: <strong className="text-slate-900 dark:text-white">{activeMission.zoneName.split(' ')[0]}</strong> ({activeMission.riskScore}% Risk)
            </span>
            {location.pathname.includes('simulate') && (
              <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 font-bold shrink-0">
                T+{activeFrame ? activeFrame.hour : currentFrameIndex * 6}H
              </span>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-white dark:bg-[#0b1320] text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-2.5 max-w-[92%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
                      : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div className={`p-3.5 rounded-2xl leading-relaxed ${
                    isUser 
                      ? 'bg-orange-500 text-white font-medium rounded-tr-none' 
                      : 'bg-slate-50 dark:bg-[#121c2d] border border-slate-200/80 dark:border-slate-800 rounded-tl-none shadow-xs'
                  }`}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                    <span className={`block text-[10px] mt-1.5 ${isUser ? 'text-orange-200' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2.5 self-start max-w-[85%]">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#121c2d] border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">Analyzing live telemetry...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Contextual Suggestions */}
          <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#0e1726] border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-cyan-500" />
              Suggested for this screen:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {suggestedPrompts.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="px-2.5 py-1 bg-white dark:bg-[#152033] hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-200 hover:text-cyan-700 dark:hover:text-cyan-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700/60 shrink-0 transition-colors shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white dark:bg-[#0b1320] border-t border-slate-200 dark:border-slate-800">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about simulation, dots, fleet, math..."
                className="flex-1 bg-slate-50 dark:bg-[#121c2d] border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 text-xs font-medium transition-colors"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 text-white rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-3 flex items-center gap-2.5 rounded-full shadow-xl transition-all duration-200 cursor-pointer border ${
          isOpen 
            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white hover:scale-105' 
            : 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white border-cyan-400/30 hover:scale-105'
        }`}
        aria-label="Open Ocean-GPT Copilot"
      >
        {isOpen ? (
          <>
            <X className="w-4 h-4" />
            <span className="font-headline font-bold text-xs">CLOSE COPILOT</span>
          </>
        ) : (
          <>
            <div className="relative">
              <Bot className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="font-headline font-bold text-xs uppercase tracking-wide">OCEAN-GPT</span>
              <span className="text-[10px] text-cyan-100 font-mono">TACTICAL COPILOT</span>
            </div>
          </>
        )}
      </button>
    </div>
  );
};

export default OceanGPTWidget;
