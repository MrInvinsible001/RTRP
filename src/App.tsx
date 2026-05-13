/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CloudRain, 
  Droplets, 
  Thermometer, 
  Sun, 
  Moon, 
  Gauge, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  Cpu,
  Zap,
  Info,
  Radio,
  Shield,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  History,
  Layers,
  Wifi,
  Settings,
  Bell,
  Navigation,
  Box,
  Compass,
  MapPin,
  ChevronRight,
  Wind
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// --- Types ---

interface SensorData {
  temperature: number;
  humidity: number;
  pressure: number;
  isRainDetected: boolean;
  isDaylight: boolean;
  lastUpdated: string;
  pressureTrend: 'rising' | 'falling' | 'stable';
  rainLikelihood: number;
}

interface HistoryPoint {
  time: string;
  temp: number;
  hum: number;
  press: number;
}

interface Alert {
  id: string;
  type: 'rain' | 'warning' | 'info' | 'success';
  message: string;
  time: string;
}

// --- Components ---

const Header = ({ time, isDay, onRefresh, refreshing }: { time: Date, isDay: boolean, onRefresh: () => void, refreshing: boolean }) => (
  <header className="px-6 pt-8 pb-4 flex justify-between items-start w-full">
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 text-secondary text-sm font-semibold mb-0.5">
        <MapPin size={14} className="text-blue-500" />
        <span>Station X · Central Hub</span>
      </div>
      <p className="text-secondary text-xs opacity-70 font-medium tracking-tight">
        {time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
    </div>
    <div className="flex flex-col items-end">
      <button 
        onClick={onRefresh}
        disabled={refreshing}
        className="flex flex-col items-end group active:scale-95 transition-transform"
      >
        <p className="text-primary text-xl font-bold tracking-tight group-hover:text-blue-500 transition-colors">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <motion.div 
            animate={refreshing ? { rotate: 360 } : {}}
            transition={refreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
          >
            <RefreshCw size={10} className={refreshing ? 'text-blue-500' : 'text-emerald-500'} />
          </motion.div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary opacity-60">
            {refreshing ? 'Syncing' : 'Live'}
          </span>
        </div>
      </button>
    </div>
  </header>
);

const Hero = ({ data, loading }: { data: SensorData, loading: boolean }) => (
  <motion.section 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="px-6 py-4"
  >
    <div className="card-base p-8 relative overflow-hidden flex flex-col items-center text-center">
      {loading ? (
        <div className="w-full flex flex-col items-center">
          <div className="w-16 h-16 skeleton rounded-full mb-6" />
          <div className="h-12 w-32 skeleton mb-4" />
          <div className="h-4 w-48 skeleton mb-8" />
          <div className="flex gap-4">
             <div className="h-4 w-20 skeleton" />
             <div className="h-4 w-20 skeleton" />
          </div>
        </div>
      ) : (
        <>
          {/* Subtle Background Glow */}
          <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[80px] rounded-full opacity-40 ${data.isDaylight ? 'bg-blue-400' : 'bg-indigo-500'}`} />
          
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-4"
            >
              {data.isRainDetected ? (
                <CloudRain size={64} className="text-blue-500 mx-auto" />
              ) : data.isDaylight ? (
                <Sun size={64} className="text-amber-400 mx-auto" />
              ) : (
                <Moon size={64} className="text-slate-400 mx-auto" />
              )}
            </motion.div>
            
            <div className="flex items-start justify-center gap-1 ml-4 mb-2">
              <h2 className="text-8xl font-bold tracking-tighter text-primary">
                {Math.floor(data.temperature)}
              </h2>
              <span className="text-4xl font-light text-secondary mt-3">°C</span>
            </div>
            
            <p className="text-primary font-bold text-xl mb-6 capitalize tracking-tight">
              {data.isRainDetected ? 'Showers Detected' : data.temperature > 28 ? 'Clear & Warm' : 'Partly Cloudy'}
            </p>
            
            <div className="flex items-center justify-center gap-6 text-secondary text-sm font-medium">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/50">
                <TrendingUp size={14} className="text-orange-400" />
                <span>H: {Math.floor(data.temperature + 2)}°</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/50">
                <TrendingDown size={14} className="text-blue-400" />
                <span>L: {Math.floor(data.temperature - 3)}°</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  </motion.section>
);

const StatCard = ({ icon: Icon, label, value, unit, colorClass, trend, loading }: { icon: any, label: string, value: string | number, unit: string, colorClass: string, trend?: 'up' | 'down' | 'stable', loading: boolean }) => (
  <div className="card-base p-5 flex flex-col gap-3 group active:scale-95 transition-all">
    {loading ? (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-10 h-10 skeleton rounded-xl" />
          <div className="w-12 h-4 skeleton rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 skeleton" />
          <div className="h-6 w-24 skeleton" />
        </div>
      </div>
    ) : (
      <>
        <div className="flex justify-between items-start">
          <div className={`p-2.5 rounded-2xl transition-colors duration-300 ${colorClass.replace('text-', 'bg-').replace('-400', '-500/10').replace('-500', '-500/10')} group-hover:bg-opacity-20`}>
            <Icon size={22} className={colorClass} />
          </div>
          {trend && (
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend === 'up' ? 'text-orange-500 bg-orange-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
              {trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Stable'}
            </div>
          )}
        </div>
        <div>
          <p className="text-secondary text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">{label}</p>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-primary leading-none tracking-tight">{value}</span>
            <span className="text-[14px] text-secondary font-medium mb-0.5">{unit}</span>
          </div>
        </div>
      </>
    )}
  </div>
);

const InfoGrid = ({ data, loading }: { data: SensorData, loading: boolean }) => (
  <section className="px-6 py-4 grid grid-cols-2 gap-4">
    <StatCard 
      icon={Droplets} 
      label="Humidity" 
      value={data.humidity} 
      unit="%" 
      colorClass="text-blue-500" 
      trend={data.humidity > 60 ? 'up' : 'stable'}
      loading={loading}
    />
    <StatCard 
      icon={Gauge} 
      label="Pressure" 
      value={data.pressure} 
      unit="hPa" 
      colorClass="text-emerald-500" 
      trend={data.pressureTrend === 'stable' ? 'stable' : data.pressureTrend === 'rising' ? 'up' : 'down'}
      loading={loading}
    />
    <StatCard 
      icon={Wind} 
      label="Wind Speed" 
      value={12.4} 
      unit="km/h" 
      colorClass="text-indigo-500" 
      trend="stable"
      loading={loading}
    />
    <StatCard 
      icon={Zap} 
      label="Rain Chance" 
      value={data.rainLikelihood} 
      unit="%" 
      colorClass="text-blue-600" 
      trend={data.rainLikelihood > 40 ? 'up' : 'stable'}
      loading={loading}
    />
  </section>
);

const ChartsSection = ({ history, loading }: { history: HistoryPoint[], loading: boolean }) => (
  <section className="px-6 py-4 flex flex-col gap-4">
    <div className="flex items-center justify-between px-1">
      <h3 className="text-secondary text-sm font-bold uppercase tracking-wider">Atmospheric Trends</h3>
      <div className="p-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-secondary">
        LIVE
      </div>
    </div>
    
    <div className="card-base p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-primary font-bold">Temperature History</p>
          <p className="text-secondary text-[10px] uppercase font-bold opacity-60">Degrees Celsius</p>
        </div>
      </div>
      
      {loading ? (
        <div className="h-48 w-full skeleton rounded-2xl" />
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {/* Recharts code */}
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0F172A', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: any) => [`${value}°C`, 'Temperature']}
                labelStyle={{ display: 'none' }}
              />
              <Area 
                type="monotone" 
                dataKey="temp" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorTemp)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>

    <div className="card-base p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-primary font-bold">Humidity Level</p>
          <p className="text-secondary text-[10px] uppercase font-bold opacity-60">Percentage %</p>
        </div>
      </div>
      
      {loading ? (
        <div className="h-40 w-full skeleton rounded-2xl" />
      ) : (
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, 100]} />
              <Area 
                type="monotone" 
                dataKey="hum" 
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorHum)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  </section>
);

const Alerts = ({ alerts, onDismiss }: { alerts: Alert[], onDismiss: (id: string) => void }) => (
  <div className="fixed top-24 left-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
    <AnimatePresence>
      {alerts.map((alert) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="pointer-events-auto"
        >
          <div className="card-base !rounded-2xl p-4 flex items-center justify-between shadow-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                alert.type === 'rain' ? 'bg-blue-500/10 text-blue-500' :
                alert.type === 'warning' ? 'bg-orange-500/10 text-orange-500' :
                'bg-slate-500/10 text-slate-500'
              }`}>
                {alert.type === 'rain' ? <CloudRain size={18} /> : 
                 alert.type === 'warning' ? <AlertTriangle size={18} /> : 
                 <Info size={18} />}
              </div>
              <p className="text-sm font-semibold tracking-tight text-primary">{alert.message}</p>
            </div>
            <button onClick={() => onDismiss(alert.id)} className="p-1 px-2 text-xs font-bold text-secondary uppercase hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Dismiss
            </button>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

const BottomNav = ({ active, onChange }: { active: string, onChange: (id: any) => void }) => (
  <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-around px-8 z-40">
    <button 
      onClick={() => onChange('dashboard')}
      className={`flex flex-col items-center gap-1 transition-all ${active === 'dashboard' ? 'text-blue-500' : 'text-secondary'}`}
    >
      <Activity size={22} strokeWidth={active === 'dashboard' ? 2.5 : 2} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Status</span>
    </button>
    <button 
      onClick={() => onChange('history')}
      className={`flex flex-col items-center gap-1 transition-all ${active === 'history' ? 'text-blue-500' : 'text-secondary'}`}
    >
      <History size={22} strokeWidth={active === 'history' ? 2.5 : 2} />
      <span className="text-[10px] font-bold uppercase tracking-wider">History</span>
    </button>
    <button 
      onClick={() => onChange('system')}
      className={`flex flex-col items-center gap-1 transition-all ${active === 'system' ? 'text-blue-500' : 'text-secondary'}`}
    >
      <Settings size={22} strokeWidth={active === 'system' ? 2.5 : 2} />
      <span className="text-[10px] font-bold uppercase tracking-wider">System</span>
    </button>
  </nav>
);

const SystemView = ({ data, onSimulateRain }: { data: SensorData, onSimulateRain: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="px-6 py-4 flex flex-col gap-6"
  >
    <div className="flex items-center justify-between px-1">
      <h2 className="text-secondary text-sm font-bold uppercase tracking-wider">System Settings</h2>
      <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Connected</span>
      </div>
    </div>
    
    <div className="card-base p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 shadow-sm">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-primary font-bold">Simulation Mode</p>
            <p className="text-secondary text-xs font-medium opacity-70">Trigger cloud events</p>
          </div>
        </div>
        <button 
          onClick={onSimulateRain}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
            data.isRainDetected ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-primary'
          }`}
        >
          {data.isRainDetected ? 'Rain Active' : 'Start Rain'}
        </button>
      </div>

      <div className="h-px bg-slate-200/50 dark:bg-slate-700/50" />

      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 shadow-sm">
            <Radio size={20} />
          </div>
          <div>
            <p className="text-primary font-bold">Connection Node</p>
            <p className="text-secondary text-xs font-medium opacity-70">Latency: 14ms · Buffer: OK</p>
          </div>
        </div>
        <div className="p-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-secondary">
          v2.4
        </div>
      </div>
    </div>

    <div className="card-base p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-secondary shadow-sm">
          <Cpu size={20} />
        </div>
        <div>
          <p className="text-primary font-bold">Hardware Performance</p>
          <p className="text-secondary text-xs font-medium opacity-70">Processing efficiency at 92%</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <div className="flex justify-between items-end mb-3">
            <span className="text-secondary text-[11px] font-bold uppercase tracking-widest opacity-60">Battery level</span>
            <span className="text-primary font-bold">94%</span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '94%' }}
              className="h-full bg-emerald-500 rounded-full" 
            />
          </div>
        </div>
        <div className="text-right">
          <p className="text-secondary text-[11px] font-bold uppercase tracking-widest mb-1 opacity-60">Voltage</p>
          <p className="text-primary font-bold">3.82V</p>
        </div>
      </div>
    </div>

    <div className="mt-8 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary opacity-30">Station X Internal Diagnostics</p>
    </div>
  </motion.div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'system'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<SensorData>({
    temperature: 24.5,
    humidity: 62,
    pressure: 1012,
    isRainDetected: false,
    isDaylight: true,
    lastUpdated: new Date().toLocaleTimeString(),
    pressureTrend: 'stable',
    rainLikelihood: 12
  });

  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Initial Load Simulation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Handle Refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addAlert('success', 'Weather data synchronized');
    }, 1500);
  };

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulation Logic
  useEffect(() => {
    // Initial history
    const initialHistory = [...Array(10)].map((_, i) => ({
      time: `${i}:00`,
      temp: 22 + Math.random() * 5,
      hum: 50 + Math.random() * 20,
      press: 1000 + Math.random() * 20
    }));
    setHistory(initialHistory);

    const interval = setInterval(() => {
      setData(prev => {
        const drift = Math.sin(Date.now() / 10000) * 0.2;
        const noise = (Math.random() * 0.2 - 0.1);
        const newTemp = parseFloat((prev.temperature + drift + noise).toFixed(1));
        const humNoise = Math.floor(Math.random() * 3 - 1);
        const newHum = Math.min(100, Math.max(0, prev.humidity + humNoise));
        const pressNoise = Math.floor(Math.random() * 5 - 2);
        const newPress = prev.pressure + pressNoise;
        const newRainLikelihood = Math.min(100, Math.max(0, prev.rainLikelihood + Math.floor(Math.random() * 10 - 5)));
        
        if (newRainLikelihood > 85 && prev.rainLikelihood <= 85) {
          addAlert('warning', 'High rain probability detected');
        }
        
        return {
          ...prev,
          temperature: newTemp,
          humidity: newHum,
          pressure: newPress,
          rainLikelihood: newRainLikelihood,
          pressureTrend: newPress > prev.pressure ? 'rising' : (newPress < prev.pressure ? 'falling' : 'stable'),
          lastUpdated: new Date().toLocaleTimeString()
        };
      });

      setHistory(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temp: data.temperature,
          hum: data.humidity,
          press: data.pressure
        };
        return [...prev.slice(1), newPoint];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [data.temperature, data.humidity, data.pressure]);

  const addAlert = (type: Alert['type'], message: string) => {
    const newAlert = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 3));
    setTimeout(() => dismissAlert(newAlert.id), 5000);
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const toggleRain = () => {
    setData(prev => {
      const newState = !prev.isRainDetected;
      if (newState) {
        addAlert('rain', 'Showers detected at local station');
      } else {
        addAlert('info', 'Weather normalization in progress');
      }
      return { ...prev, isRainDetected: newState };
    });
  };

  return (
    <div className="min-h-screen bg-app pb-28 text-primary selection:bg-blue-500/30">
      <Alerts alerts={alerts} onDismiss={dismissAlert} />
      
      <Header 
        time={currentTime} 
        isDay={data.isDaylight} 
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
      />
      
      <main className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dash"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Hero data={data} loading={isLoading} />
              <InfoGrid data={data} loading={isLoading} />
              
              <div className="px-6 py-4">
                <div className="card-base p-6 bg-blue-500/5 border-blue-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-primary font-bold">Safe Environment</p>
                      <p className="text-secondary text-xs font-medium">No weather hazards detected</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-secondary opacity-30" />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="hist"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <ChartsSection history={history} loading={isLoading} />
            </motion.div>
          )}

          {activeTab === 'system' && (
            <SystemView data={data} onSimulateRain={toggleRain} />
          )}
        </AnimatePresence>
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
