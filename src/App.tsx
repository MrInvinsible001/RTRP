/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CloudRain, 
  Droplets, 
  Thermometer, 
  Sun, 
  Moon, 
  Gauge, 
  AlertTriangle,
  Activity,
  History,
  TrendingDown,
  TrendingUp,
  Cpu,
  Zap,
  Info,
  Radio,
  Shield,
  Wifi,
  Settings,
  ChevronRight
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

// --- FIREBASE IMPORTS ---
import { ref, onValue } from 'firebase/database';
import { db } from './firebase'; 

// --- PULL TO REFRESH IMPORT ---
import PullToRefresh from 'react-simple-pull-to-refresh';

// --- Types ---

interface SensorData {
  temperature: number; // DHT22
  humidity: number;    // DHT22
  pressure: number;    // BMP180
  altitude: number;    // Calculated from BMP180
  isRainDetected: boolean; // HW-61
  lightLevel: number;  // LDR (0-1023)
  isDaylight: boolean; // Derived from LDR
  lastUpdated: string;
  pressureTrend: 'rising' | 'falling' | 'stable';
  rainLikelihood: number; // Calculated
  wifiSignal: number;  // ESP8266 RSSI
}

interface HistoryPoint {
  time: string;
  temp: number;
  hum: number;
  press: number;
  rain: number;
}

type TimeRange = '24h' | '1w' | '1m';

interface Alert {
  id: string;
  type: 'rain' | 'warning' | 'info' | 'success';
  message: string;
  time: string;
}

// --- Components ---

const Header = ({ time, signal, onRefresh, refreshing }: { time: Date, signal: number, onRefresh: () => void, refreshing: boolean }) => (
  <header className="px-6 pt-8 pb-4 flex justify-between items-start w-full">
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 text-secondary text-sm font-semibold mb-0.5">
        <Cpu size={14} className="text-blue-500" />
        <span>NodeMCU Station v1.0</span>
      </div>
      <p className="text-secondary text-xs opacity-70 font-medium tracking-tight">
        Local IOT Gateway · ESP8266
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
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-0.5">
             {[...Array(4)].map((_, i) => (
               <motion.div 
                key={i} 
                initial={false}
                animate={{ opacity: i < (Math.abs(signal) / 25) ? 1 : 0.2 }}
                className="w-1 h-3 rounded-full bg-emerald-500" 
               />
             ))}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary opacity-60">
            {refreshing ? 'Syncing...' : 'WiFi Connected'}
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
          <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[80px] rounded-full opacity-30 ${data.isDaylight ? 'bg-amber-400' : 'bg-indigo-500'}`} />
          
          <div className="relative z-10 w-full">
            <div className="flex justify-between items-center w-full mb-8">
               <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-secondary flex items-center gap-1.5 border border-slate-200/50 dark:border-slate-700/50">
                  <Sun size={12} className={data.isDaylight ? "text-amber-500" : "text-slate-400"} />
                  {data.isDaylight ? 'DAYLIGHT' : 'NIGHT'} · LDR Sensor
               </div>
               <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-secondary border border-slate-200/50 dark:border-slate-700/50">
                  ALTITUDE: {Math.floor(data.altitude)}m
               </div>
            </div>

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
                {data.temperature.toFixed(1)}
              </h2>
              <span className="text-4xl font-light text-secondary mt-3">°C</span>
            </div>
            
            <p className="text-primary font-bold text-xl mb-1 capitalize tracking-tight">
              {data.isRainDetected ? 'Precipitation Detected' : data.temperature > 28 ? 'Stable Room Temp' : 'Optimal Environment'}
            </p>
            <p className="text-secondary text-[10px] font-bold uppercase tracking-wider mb-8 opacity-60">Status Reported by HW-61 Sensor</p>
            
            <div className="flex items-center justify-center gap-6 text-secondary text-sm font-medium">
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/30 dark:border-slate-700/30">
                <TrendingUp size={14} className="text-orange-400" />
                <span className="text-[10px] opacity-40 font-bold uppercase mr-1">High</span>
                <span>{Math.floor(data.temperature + 2)}.0°</span>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/30 dark:border-slate-700/30">
                <TrendingDown size={14} className="text-blue-400" />
                <span className="text-[10px] opacity-40 font-bold uppercase mr-1">Low</span>
                <span>{Math.floor(data.temperature - 3)}.0°</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  </motion.section>
);

const StatCard = ({ icon: Icon, label, sensor, value, unit, colorClass, trend, loading }: { icon: any, label: string, sensor: string, value: string | number, unit: string, colorClass: string, trend?: 'up' | 'down' | 'stable', loading: boolean }) => (
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
              {trend.toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1 opacity-70">
            <p className="text-secondary text-[10px] font-bold uppercase tracking-wider">{label}</p>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold whitespace-nowrap">· {sensor}</span>
          </div>
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
  <section className="px-6 py-4">
    <div className="flex items-center gap-2 mb-4 px-1">
       <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
       <h2 className="text-secondary text-[10px] font-bold uppercase tracking-widest">Environment Status · DHT22 & BMP180</h2>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <StatCard 
        icon={Droplets} 
        label="Humidity" 
        sensor="DHT22"
        value={data.humidity} 
        unit="%" 
        colorClass="text-blue-500" 
        trend={data.humidity > 60 ? 'up' : 'stable'}
        loading={loading}
      />
      <StatCard 
        icon={Gauge} 
        label="Pressure" 
        sensor="BMP180"
        value={data.pressure} 
        unit="hPa" 
        colorClass="text-emerald-500" 
        trend={data.pressureTrend === 'stable' ? 'stable' : data.pressureTrend === 'rising' ? 'up' : 'down'}
        loading={loading}
      />
      <StatCard 
        icon={Sun} 
        label="Ambient Light" 
        sensor="LDR Sensor"
        value={data.lightLevel} 
        unit="lux" 
        colorClass="text-amber-500" 
        loading={loading}
      />
      <StatCard 
        icon={Zap} 
        label="Rain Chance" 
        sensor="CALCULATED"
        value={data.rainLikelihood} 
        unit="%" 
        colorClass="text-blue-600" 
        trend={data.rainLikelihood > 40 ? 'up' : 'stable'}
        loading={loading}
      />
    </div>
  </section>
);

const ChartsSection = ({ history, loading, range, onRangeChange }: { history: HistoryPoint[], loading: boolean, range: TimeRange, onRangeChange: (r: TimeRange) => void }) => (
  <section className="px-6 py-4 flex flex-col gap-4">
    <div className="flex items-center justify-between px-1">
      <h3 className="text-secondary text-sm font-bold uppercase tracking-wider">Atmospheric Trends</h3>
      <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
        {(['24h', '1w', '1m'] as TimeRange[]).map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
              range === r 
                ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm' 
                : 'text-secondary opacity-60 hover:opacity-100'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
    
    {/* Temperature Chart */}
    <div className="card-base p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-primary font-bold">Temperature History</p>
          <p className="text-secondary text-[10px] uppercase font-bold opacity-60">Degrees Celsius</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-secondary">Avg</span>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="h-48 w-full skeleton rounded-2xl" />
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
              />
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
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
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

    {/* Humidity Chart */}
    <div className="card-base p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-primary font-bold">Humidity Level</p>
          <p className="text-secondary text-[10px] uppercase font-bold opacity-60">Percentage %</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-secondary">Level</span>
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
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0F172A', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                formatter={(value: any) => [`${value}%`, 'Humidity']}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              />
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

    {/* Rainfall Chart */}
    <div className="card-base p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-primary font-bold">Rainfall Distribution</p>
          <p className="text-secondary text-[10px] uppercase font-bold opacity-60">Millimeters mm</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-[10px] font-bold text-secondary">Precipitation</span>
        </div>
      </div>
      
      {loading ? (
        <div className="h-40 w-full skeleton rounded-2xl" />
      ) : (
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis hide domain={[0, 'dataMax + 5']} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0F172A', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                formatter={(value: any) => [`${value}mm`, 'Rainfall']}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="rain" 
                stroke="#6366f1" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorRain)" 
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
      <h2 className="text-secondary text-sm font-bold uppercase tracking-wider">Node Diagnostics</h2>
      <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Broadcasting</span>
      </div>
    </div>
    
    <div className="card-base p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 shadow-sm border border-orange-500/10">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-primary font-bold">Rain Simulation</p>
            <p className="text-secondary text-xs font-medium opacity-70">Force HW-61 HIGH state</p>
          </div>
        </div>
        <button 
          onClick={onSimulateRain}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
            data.isRainDetected ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-primary'
          }`}
        >
          {data.isRainDetected ? 'RAIN: HIGH' : 'TRIGGER RAIN'}
        </button>
      </div>

      <div className="h-px bg-slate-200/50 dark:bg-slate-700/50" />

      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 shadow-sm border border-blue-500/10">
            <Wifi size={20} />
          </div>
          <div>
            <p className="text-primary font-bold">WiFi Connectivity</p>
            <p className="text-secondary text-xs font-medium opacity-70">Signal: {data.wifiSignal}dBm · ESP8266</p>
          </div>
        </div>
        <div className="p-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-secondary">
          DHCP OK
        </div>
      </div>
    </div>

    <div className="card-base p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-secondary shadow-sm">
          <Radio size={20} />
        </div>
        <div>
          <p className="text-primary font-bold">Sensor Hub Status</p>
          <p className="text-secondary text-xs font-medium opacity-70">Polling 4 active sensor buses</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
         <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
            <span className="text-[10px] font-bold text-secondary">DHT22</span>
            <span className="text-[10px] font-bold text-emerald-500">READY</span>
         </div>
         <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
            <span className="text-[10px] font-bold text-secondary">BMP180</span>
            <span className="text-[10px] font-bold text-emerald-500">READY</span>
         </div>
         <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
            <span className="text-[10px] font-bold text-secondary">LDR</span>
            <span className="text-[10px] font-bold text-emerald-500">READY</span>
         </div>
         <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
            <span className="text-[10px] font-bold text-secondary">HW-61</span>
            <span className="text-[10px] font-bold text-emerald-500">READY</span>
         </div>
      </div>
    </div>

    <div className="mt-8 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary opacity-30">Serial Console: Listening on COM3</p>
    </div>
  </motion.div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'system'>('dashboard');
  const [historyRange, setHistoryRange] = useState<TimeRange>('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [data, setData] = useState<SensorData>({
    temperature: 0,
    humidity: 0,
    pressure: 0,
    altitude: 124,
    isRainDetected: false,
    lightLevel: 840,
    isDaylight: true,
    lastUpdated: new Date().toLocaleTimeString(),
    pressureTrend: 'stable',
    rainLikelihood: 12,
    wifiSignal: -65
  });

  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Data Generation Helper (Keeping this for the fake history graphs until your hardware sends lists)
  const generateHistoricalData = (range: TimeRange): HistoryPoint[] => {
    let points = 0;
    let increment = 1; 
    let formatOptions: Intl.DateTimeFormatOptions = {};

    if (range === '24h') {
      points = 24;
      increment = 1;
      formatOptions = { hour: '2-digit', minute: '2-digit' };
    } else if (range === '1w') {
      points = 7;
      increment = 24;
      formatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    } else if (range === '1m') {
      points = 30;
      increment = 24;
      formatOptions = { month: 'short', day: 'numeric' };
    }

    const data: HistoryPoint[] = [];
    const now = new Date();

    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * increment * 60 * 60 * 1000);
      const timeStr = range === '24h' 
        ? d.toLocaleTimeString([], formatOptions)
        : d.toLocaleDateString([], formatOptions);
        
      data.push({
        time: timeStr,
        temp: parseFloat((20 + Math.random() * 8 + (Math.sin(i / 2) * 4)).toFixed(1)),
        hum: Math.floor(40 + Math.random() * 40 + (Math.cos(i / 4) * 10)),
        press: Math.floor(1005 + Math.random() * 15),
        rain: parseFloat((Math.random() > 0.7 ? Math.random() * 10 : 0).toFixed(1))
      });
    }
    return data;
  };

  // Initial Load Setting
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setHistory(generateHistoricalData('24h'));
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Handle Range Change
  const handleRangeChange = (newRange: TimeRange) => {
    setHistoryRange(newRange);
    setIsLoading(true);
    setTimeout(() => {
      setHistory(generateHistoricalData(newRange));
      setIsLoading(false);
    }, 600);
  };

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

  // NEW: Handle Pull-to-Refresh / Hard Reload
  const handleRefresh = async () => {
    setIsRefreshing(true);
    addAlert('info', 'Forcing app reload...');
    
    // Wait 1 second for the animation, then force the browser to reload the page
    return new Promise((resolve) => {
      setTimeout(() => {
        window.location.reload(); 
        resolve(undefined);
      }, 1000);
    });
  };

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // --- REAL FIREBASE LISTENER LOGIC ---
  useEffect(() => {
    const weatherRef = ref(db, 'weather');
    
    const listener = onValue(weatherRef, (snapshot) => {
      const fbData = snapshot.val();
      
      if (fbData) {
        setData(prev => {
          const isRaining = fbData.rain === "RAINING";
          const currentPressure = fbData.pressure !== undefined ? fbData.pressure : prev.pressure;
          
          // Trigger the UI alert if it starts raining
          if (isRaining && !prev.isRainDetected) {
             setTimeout(() => addAlert('rain', 'Showers detected at local station'), 0);
          }

          // Calculate altitude based on new pressure (Standard formula estimation)
          const newAltitude = 44330 * (1 - Math.pow(currentPressure / 1013.25, 0.1903));

          return {
            ...prev,
            temperature: fbData.temperature !== undefined ? fbData.temperature : prev.temperature,
            humidity: fbData.humidity !== undefined ? fbData.humidity : prev.humidity,
            pressure: currentPressure,
            altitude: newAltitude || prev.altitude,
            isRainDetected: isRaining,
            pressureTrend: currentPressure > prev.pressure ? 'rising' : (currentPressure < prev.pressure ? 'falling' : 'stable'),
            lastUpdated: new Date().toLocaleTimeString()
          };
        });
      }
    });

    return () => listener();
  }, []);

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
        signal={Math.abs(data.wifiSignal)}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
      />
      
      <main className="max-w-2xl mx-auto h-full">
        <PullToRefresh onRefresh={handleRefresh} pullingContent={''} maxPullDownDistance={100}>
          <div className="min-h-[calc(100vh-200px)]">
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
                  <ChartsSection 
                    history={history} 
                    loading={isLoading} 
                    range={historyRange} 
                    onRangeChange={handleRangeChange} 
                  />
                </motion.div>
              )}

              {activeTab === 'system' && (
                <SystemView data={data} onSimulateRain={toggleRain} />
              )}
            </AnimatePresence>
          </div>
        </PullToRefresh>
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
