import { useState, useEffect } from 'react';
import { 
  Globe2, 
  Bell, 
  Menu, 
  Clock, 
  SlidersHorizontal,
  ChevronRight,
  AlertTriangle,
  Sun,
  Moon
} from 'lucide-react';
import { useSim } from '../../store';

interface HeaderProps {
  onToggleMobile?: () => void;
  isCollapsed?: boolean;
}

export const Header = ({ onToggleMobile, isCollapsed = false }: HeaderProps) => {
  const [time, setTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const activeMission = useSim(state => state.activeMission);
  const theme = useSim(state => state.theme);
  const toggleTheme = useSim(state => state.toggleTheme);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const notifications = [
    { id: 1, title: 'Debris Spike at Versova', time: '2m ago', type: 'critical', desc: 'Monte Carlo drift indicates +420kg accumulation over next 6 hours.' },
    { id: 2, title: 'Autonomous Skimmer SKM-01 Active', time: '14m ago', type: 'info', desc: 'Arrived at Bandra channel coordinates. Commencing interception.' },
    { id: 3, title: 'High Onshore Wind Alert', time: '1h ago', type: 'warning', desc: 'Wind speed increased to 24 knots (SW). Beaching risk elevated.' },
  ];

  return (
    <header className={`fixed top-0 ${isCollapsed ? 'lg:left-20' : 'lg:left-72'} left-0 right-0 h-16 bg-white dark:bg-[#000000] z-40 flex items-center justify-between px-4 sm:px-6 border-b-2 border-slate-200 dark:border-[#333333] font-mono transition-all duration-300 shadow-sm dark:shadow-none`}>
      
      {/* Left: Hamburger (Mobile) + Breadcrumb/Sector */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleMobile}
          className="lg:hidden p-2 border border-slate-200 dark:border-[#333333] text-slate-700 dark:text-white bg-slate-50 dark:bg-transparent hover:bg-[#ff4d00] hover:text-white hover:border-[#ff4d00] transition-colors rounded-lg"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-xs uppercase font-bold tracking-widest">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#111111] text-slate-800 dark:text-white rounded-lg">
            <Globe2 className="w-3.5 h-3.5 text-[#ff4d00]" />
            <span>MUMBAI COAST</span>
            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-[#525252]" />
            <span className="text-slate-500 dark:text-[#a3a3a3]">{activeMission.zoneName.split(' ')[0]}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#111111] text-slate-800 dark:text-white rounded-lg">
            <span className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 animate-pulse rounded-full"></span>
            TELEMETRY SYNCED
          </div>
        </div>
      </div>

      {/* Right: Chronometer, Theme Toggle, Notifications, Settings */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time Marine Chronometer */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#111111] text-slate-800 dark:text-white text-xs font-bold tracking-widest rounded-lg">
          <Clock className="w-3.5 h-3.5 text-[#ff4d00]" />
          <span>{time || '00:00:00 UTC'}</span>
        </div>

        {/* LIGHT / DARK THEME TOGGLE */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-[#333333] bg-slate-100 dark:bg-[#111111] hover:bg-slate-200 dark:hover:bg-[#1f1f1f] text-slate-800 dark:text-white hover:border-[#ff4d00] transition-colors text-xs font-bold tracking-wider rounded-lg cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme Mode"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline uppercase text-[10px]">LIGHT</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-sky-600" />
              <span className="hidden md:inline uppercase text-[10px] text-slate-700">DARK</span>
            </>
          )}
        </button>

        {/* Notifications Toggle */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 border transition-colors flex items-center justify-center rounded-lg cursor-pointer ${
              showNotifications 
                ? 'bg-[#ff4d00] border-[#ff4d00] text-white' 
                : 'bg-slate-50 dark:bg-[#111111] border-slate-200 dark:border-[#333333] text-slate-700 dark:text-white hover:border-slate-400 dark:hover:border-white'
            }`}
            aria-label="View Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff4d00] dark:bg-white rounded-full animate-pulse"></span>
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#000000] border-2 border-slate-200 dark:border-[#333333] p-0 flex flex-col z-50 shadow-2xl">
              <div className="flex items-center justify-between p-3 border-b-2 border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#111111]">
                <span className="font-headline font-bold text-sm text-slate-900 dark:text-white uppercase flex items-center gap-2 tracking-widest">
                  <AlertTriangle className="w-4 h-4 text-[#ff4d00]" />
                  Tactical Alerts (3)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#a3a3a3] uppercase cursor-pointer hover:text-slate-900 dark:hover:text-white">CLEAR</span>
              </div>
              
              <div className="flex flex-col max-h-72 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="p-4 border-b border-slate-100 dark:border-[#222222] hover:bg-slate-50 dark:hover:bg-[#111111] transition-colors flex flex-col gap-2">
                    <div className="flex items-center justify-between font-bold uppercase text-xs">
                      <span className={n.type === 'critical' ? 'text-[#ff4d00]' : n.type === 'warning' ? 'text-amber-600 dark:text-white' : 'text-slate-600 dark:text-[#a3a3a3]'}>
                        {n.title}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-[#525252] tracking-widest">{n.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-[#a3a3a3] leading-relaxed uppercase">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Tools */}
        <button 
          className="p-2 border border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#111111] text-slate-700 dark:text-white hover:border-slate-400 dark:hover:border-white transition-colors"
          title="Sector Config"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

      </div>
    </header>
  );
};

export default Header;
