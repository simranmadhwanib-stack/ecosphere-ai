import React, { useState, useEffect } from 'react';
import { 
  Activity, Zap, Droplet, Wind, Trees, 
  Trash2, AlertTriangle, CheckCircle, RefreshCw, 
  MapPin, Cpu, Database, Flame, Trophy
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function Overview({ apiBase, kpis, setKpis, fetchGlobalState, activeLocationName, activeLocation }) {
  const [sectors, setSectors] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedSector, setSelectedSector] = useState(null);
  const [mapOverlay, setMapOverlay] = useState('sustainability'); // 'sustainability', 'aqi', 'energy', 'water', 'waste'
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');

  // Fetch telemetry logs
  const fetchTelemetry = async () => {
    try {
      const res = await fetch(`${apiBase}/sectors`);
      if (res.ok) {
        const data = await res.json();
        setSectors(data);
        // Find if selected sector needs updating
        if (selectedSector) {
          const updated = data.find(s => s.name === selectedSector.name);
          if (updated) setSelectedSector(updated);
        }
      }
    } catch (e) {
      console.warn("Backend sector fetch failed, using fallback mocks", e);
    }
  };

  // Fetch charts history
  const fetchHistoryData = async () => {
    try {
      const res = await fetch(`${apiBase}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.warn("Backend history fetch failed", e);
    }
  };

  // Run initial state loading and continuous log streams
  useEffect(() => {
    setSelectedSector(null);
    fetchTelemetry();
    fetchHistoryData();
    
    // Auto-update telemetry feeds
    const interval = setInterval(() => {
      fetchTelemetry();
      generateRandomLog();
    }, 4000);

    // Initial logs seed
    setLogs([
      { id: 1, time: new Date().toLocaleTimeString(), text: `Smart Grid synchronized with ${activeLocationName}.`, type: "success" },
      { id: 2, time: new Date().toLocaleTimeString(), text: "Anomalous water flow pressure detected in a local utility zone.", type: "warning" },
      { id: 3, time: new Date().toLocaleTimeString(), text: "AQI sensor mesh is reporting elevated particulate mix.", type: "error" },
    ]);

    return () => clearInterval(interval);
  }, [activeLocationName]);

  const generateRandomLog = () => {
    const events = [
      { text: "Air quality particulate sensors refreshed city-wide.", type: "info" },
      { text: "Rooftop solar telemetry uploaded. Grid absorption stable.", type: "success" },
      { text: "Residential waste collection optimized path generated.", type: "success" },
      { text: "Peak electricity draw warning cleared in the civic core.", type: "info" },
      { text: "Wind speed variance registered. Carbon offset model recalibrated.", type: "info" }
    ];
    const picked = events[Math.floor(Math.random() * events.length)];
    setLogs(prev => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), text: picked.text, type: picked.type },
      ...prev.slice(0, 14)
    ]);
  };

  // Dispatch interactive municipal actions (plant trees, fix leaks, install solar)
  const handleEcoAction = async (actionId, sectorName) => {
    setLoading(true);
    setActionFeedback('');
    try {
      const res = await fetch(`${apiBase}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, sector: sectorName })
      });
      if (res.ok) {
        const result = await res.json();
        setActionFeedback(result.message);
        
        // Refresh local UI states and global dashboard KPIs
        fetchTelemetry();
        fetchGlobalState();
        fetchHistoryData();

        // Confetti celebration if they solved a leak or solar
        if (window.confetti && (actionId === 'FIX_LEAKS' || actionId === 'INSTALL_SOLAR')) {
          window.confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#22bd6c', '#3b82f6', '#06b6d4']
          });
        }
      }
    } catch (e) {
      setActionFeedback('Action transmission error. Check server node connectivity.');
    } finally {
      setLoading(false);
    }
  };

  // Helper colors for sector circles based on toggle layer
  const getSectorOverlayColor = (sector) => {
    switch (mapOverlay) {
      case 'aqi':
        if (sector.aqi < 50) return 'fill-eco-400 stroke-eco-500 shadow-neon-green';
        if (sector.aqi < 100) return 'fill-orange-400 stroke-orange-500 shadow-neon-orange';
        return 'fill-red-500 stroke-red-600 shadow-red-500/50';
      case 'energy':
        if (sector.electricity_kwh < 500) return 'fill-blue-400 stroke-blue-500 shadow-neon-blue';
        if (sector.electricity_kwh < 1500) return 'fill-cyan-400 stroke-cyan-500 shadow-neon-cyan';
        return 'fill-orange-500 stroke-orange-600 shadow-neon-orange';
      case 'water':
        return sector.water_leak_rate > 0 ? 'fill-red-500 stroke-red-600' : 'fill-blue-400 stroke-blue-500';
      case 'waste':
        if (sector.waste_fill_pct < 50) return 'fill-eco-400 stroke-eco-500';
        if (sector.waste_fill_pct < 80) return 'fill-orange-400 stroke-orange-500';
        return 'fill-red-500 stroke-red-600';
      case 'sustainability':
      default:
        if (sector.sustainability_score > 80) return 'fill-eco-400 stroke-eco-500';
        if (sector.sustainability_score > 60) return 'fill-cyan-400 stroke-cyan-500';
        return 'fill-orange-500 stroke-orange-600';
    }
  };

  const getLocationMarker = () => {
    if (!activeLocation) return { x: 300, y: 225 };
    const lat = Number(activeLocation.latitude) || 0;
    const lon = Number(activeLocation.longitude) || 0;
    return {
      x: 60 + ((lon + 180) / 360) * 480,
      y: 55 + ((90 - lat) / 180) * 340
    };
  };

  const locationMarker = getLocationMarker();

  return (
    <div className="space-y-6">
      {/* 1. TOP KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-4 glow-border-green flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Sustainability Index</span>
            <div className="text-3xl font-extrabold text-eco-400 mt-1">{kpis.sustainabilityScore}%</div>
            <span className="text-xs text-eco-500 flex items-center mt-1">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Stabilizing Trend
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-eco-500/10 flex items-center justify-center text-eco-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-4 glow-border-blue flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Energy Demand</span>
            <div className="text-3xl font-extrabold text-blue-400 mt-1">{kpis.totalEnergyUsageKwh?.toLocaleString()} kWh</div>
            <span className="text-xs text-blue-500 flex items-center mt-1">
              <Zap className="w-3.5 h-3.5 mr-1 animate-pulse" /> Grid Mix: {Math.round((kpis.solarGenerationKwh / kpis.totalEnergyUsageKwh) * 100) || 12}% Solar
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-4 glow-border-cyan flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Water Consumption</span>
            <div className="text-3xl font-extrabold text-cyan-400 mt-1">{kpis.totalWaterUsageLiters?.toLocaleString()} L</div>
            <span className="text-xs text-cyan-500 flex items-center mt-1">
              <Droplet className="w-3.5 h-3.5 mr-1" /> Pressure Stabilized
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Droplet className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-4 glow-border-orange flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Carbon Savings</span>
            <div className="text-3xl font-extrabold text-orange-400 mt-1">-{kpis.carbonOffsetKg?.toLocaleString()} kg</div>
            <span className="text-xs text-orange-500 flex items-center mt-1">
              <Trees className="w-3.5 h-3.5 mr-1" /> Annual Canopy Offset
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-4 border-red-500/20 hover:border-red-500/40 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Active Anomalies</span>
            <div className="text-3xl font-extrabold text-red-500 mt-1">{kpis.activeAlerts} Alerts</div>
            <span className="text-xs text-red-400 flex items-center mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Attention Needed
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. MAP AND ACTION INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INTERACTIVE MAP CONTAINER */}
        <div className="glass-panel p-6 lg:col-span-2 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
          <div className="cyber-scanline"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 z-10">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-eco-400" /> EcoSphere Location Map Telemetry
              </h2>
              <p className="text-xs text-slate-400">Click any zone to inspect telemetry indicators and execute interventions.</p>
            </div>
            
            {/* Map Overlay Selector buttons */}
            <div className="flex flex-wrap gap-1 bg-slate-950/60 p-1 rounded-lg border border-white/5 text-xs">
              {['sustainability', 'aqi', 'energy', 'water', 'waste'].map(overlay => (
                <button
                  key={overlay}
                  onClick={() => setMapOverlay(overlay)}
                  className={`px-3 py-1.5 rounded transition-all capitalize ${
                    mapOverlay === overlay 
                      ? 'bg-eco-500 text-white font-semibold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {overlay}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Map Layout */}
          <div className="flex items-center justify-center flex-1 relative min-h-[300px]">
            <svg 
              viewBox="0 0 600 450" 
              className="w-full max-w-[500px] h-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            >
              {/* Virtual zone polygons */}
              <polygon points="50,50 300,50 250,200 50,150" className="fill-slate-900/40 stroke-white/5 hover:fill-slate-800/30 transition-all cursor-pointer" onClick={() => setSelectedSector(sectors[2] || null)} />
              
              <polygon points="300,50 550,50 550,220 350,200" className="fill-slate-900/40 stroke-white/5 hover:fill-slate-800/30 transition-all cursor-pointer" onClick={() => setSelectedSector(sectors[1] || null)} />
              
              <polygon points="250,200 350,200 420,320 180,320" className="fill-slate-900/40 stroke-white/5 hover:fill-slate-800/30 transition-all cursor-pointer" onClick={() => setSelectedSector(sectors[0] || null)} />
              
              <polygon points="350,200 550,220 550,400 420,320" className="fill-slate-900/40 stroke-white/5 hover:fill-slate-800/30 transition-all cursor-pointer" onClick={() => setSelectedSector(sectors[3] || null)} />
              
              <polygon points="50,150 250,200 180,320 50,400" className="fill-slate-900/40 stroke-white/5 hover:fill-slate-800/30 transition-all cursor-pointer" onClick={() => setSelectedSector(sectors[4] || null)} />

              {/* Grid overlay lines (Futuristic blueprint feel) */}
              <line x1="50" y1="150" x2="550" y2="220" stroke="rgba(255,255,255,0.03)" strokeDasharray="5,5" />
              <line x1="250" y1="50" x2="180" y2="400" stroke="rgba(255,255,255,0.03)" strokeDasharray="5,5" />

              <g transform={`translate(${locationMarker.x}, ${locationMarker.y})`} className="pointer-events-none">
                <circle r="26" className="fill-eco-400/10 animate-ping" />
                <circle r="9" className="fill-white stroke-eco-400 stroke-[3px]" />
                <path d="M0 -27 L8 -10 L0 -14 L-8 -10 Z" className="fill-eco-400" />
                <text y="34" textAnchor="middle" className="fill-eco-300 text-[10px] font-bold pointer-events-none">
                  Selected Location
                </text>
              </g>

              {/* Dynamic Telemetry Sensor Nodes */}
              {sectors.map(sector => (
                <g 
                  key={sector.name}
                  transform={`translate(${sector.coordinates.x}, ${sector.coordinates.y})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedSector(sector)}
                >
                  {/* Outer Radar pulse */}
                  <circle r="22" className={`opacity-20 animate-ping ${getSectorOverlayColor(sector)}`} />
                  {/* Glowing Core */}
                  <circle r="12" className={`${getSectorOverlayColor(sector)} shadow-neon-green border-2 border-slate-950 transition-all duration-300`} />
                  
                  {/* Label tooltip */}
                  <text 
                    y="-18" 
                    textAnchor="middle" 
                    className="fill-slate-300 text-[11px] font-bold tracking-wide pointer-events-none drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]"
                  >
                    {sector.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          
          {/* Map Legend */}
          <div className="flex gap-4 justify-center items-center text-xs text-slate-400 mt-4 border-t border-white/5 pt-4 z-10">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-eco-500"></span> Optimal/Stable</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Moderate</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Alert Warning</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Hazardous Anomaly</span>
          </div>
        </div>

        {/* SECTOR TELEMETRY INSPECTOR & DECISION ACTIONS */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          {selectedSector ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              
              {/* Header */}
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-eco-400" /> {selectedSector.name}
                  </h3>
                  <span className="text-xs bg-eco-500/10 text-eco-400 font-bold px-2 py-1 rounded-full">
                    Index: {selectedSector.sustainability_score}%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Real-time localized IoT sensor arrays</p>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm my-4">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-xs flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-blue-400" /> Electricity</span>
                  <p className="text-base font-extrabold mt-1 text-blue-400">{selectedSector.electricity_kwh?.toLocaleString()} kWh</p>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-xs flex items-center gap-1"><Droplet className="w-3.5 h-3.5 text-cyan-400" /> Water Flow</span>
                  <p className="text-base font-extrabold mt-1 text-cyan-400">{selectedSector.water_liters?.toLocaleString()} L</p>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-xs flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-orange-400" /> Air Quality</span>
                  <p className={`text-base font-extrabold mt-1 ${selectedSector.aqi > 100 ? 'text-red-500' : 'text-orange-400'}`}>AQI: {selectedSector.aqi}</p>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-xs flex items-center gap-1"><Trees className="w-3.5 h-3.5 text-eco-400" /> Greenery</span>
                  <p className="text-base font-extrabold mt-1 text-eco-400">{(selectedSector.tree_cover_sqm / 1000).toFixed(1)}k sqm</p>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-xs flex items-center gap-1"><Trash2 className="w-3.5 h-3.5 text-slate-400" /> Waste Bins</span>
                  <p className="text-base font-extrabold mt-1 text-slate-200">{selectedSector.waste_fill_pct}% Full</p>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-xs flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" /> Carbon Emitted</span>
                  <p className="text-base font-extrabold mt-1 text-slate-200">{selectedSector.carbon_kg} kg</p>
                </div>
              </div>

              {/* Anomaly / Alert Status */}
              <div className="space-y-2">
                <span className="text-slate-400 text-xs font-semibold">Active Warnings:</span>
                {selectedSector.alerts.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedSector.alerts.map((alert, idx) => (
                      <div 
                        key={idx} 
                        className={`text-xs p-2 rounded-lg flex items-center gap-1.5 border ${
                          alert.type === 'danger' 
                            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                            : alert.type === 'warning'
                            ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{alert.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-eco-500/10 border border-eco-500/20 text-eco-400 text-xs p-2.5 rounded-lg flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-eco-400 shrink-0" />
                    <span>Zone telemetry registers optimal. No active leakage or pollution warnings.</span>
                  </div>
                )}
              </div>

              {/* Decision Action Console */}
              <div className="border-t border-white/5 pt-4 mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-eco-400" /> Municipal Interventions
                  </span>
                  {loading && <RefreshCw className="w-3.5 h-3.5 text-eco-400 animate-spin" />}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    disabled={loading}
                    onClick={() => handleEcoAction('PLANT_TREES', selectedSector.name)}
                    className="w-full py-2 bg-eco-500/20 hover:bg-eco-500 text-eco-400 hover:text-white rounded-lg border border-eco-500/30 hover:border-transparent text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trees className="w-4 h-4" /> Plant Urban Trees (+10,000 sqm)
                  </button>

                  <button
                    disabled={loading || selectedSector.water_leak_rate === 0}
                    onClick={() => handleEcoAction('FIX_LEAKS', selectedSector.name)}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      selectedSector.water_leak_rate > 0 
                        ? 'bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-white border-cyan-500/30 hover:border-transparent cursor-pointer' 
                        : 'bg-slate-900 border-white/5 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Droplet className="w-4 h-4" /> Dispatch Smart Pipe Leak Repair
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => handleEcoAction('INSTALL_SOLAR', selectedSector.name)}
                    className="w-full py-2 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg border border-blue-500/30 hover:border-transparent text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-4 h-4" /> Install Rooftop Smart Solar Array
                  </button>
                </div>

                {actionFeedback && (
                  <div className="text-[11px] text-eco-400 bg-eco-500/5 p-2 rounded border border-eco-500/10 text-center font-medium">
                    {actionFeedback}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full space-y-4 py-12">
              <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-white/10 text-slate-500">
                <MapPin className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">No Zone Selected</h4>
                <p className="text-xs text-slate-400 max-w-[200px] mt-1 mx-auto">
                  Select a zone on the visual map to load its sensor indicators and options.
                </p>
              </div>
              <button 
                onClick={() => setSelectedSector(sectors[0])}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-xs font-semibold"
              >
                Inspect Primary Zone
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 3. LOG FEED AND HISTORY CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART GRID */}
        <div className="glass-panel p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Carbon Footprint vs Solar Generation</h3>
              <p className="text-xs text-slate-400">Environmental logs over the last 30 days</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-eco-500 animate-pulse"></div>
          </div>

          <div className="h-[220px] w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, fontSize: 11 }} 
                  />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#fff' }} />
                  <Area type="monotone" name="Carbon Emissions (kg)" dataKey="carbon" stroke="#f97316" fillOpacity={1} fill="url(#colorCarbon)" strokeWidth={2} />
                  <Area type="monotone" name="Solar Produced (kWh)" dataKey="solar" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSolar)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Querying database telemetry histories...
              </div>
            )}
          </div>
        </div>

        {/* LIVE TELEMETRY CONSOLE FEED */}
        <div className="glass-panel p-6 flex flex-col justify-between h-[302px]">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-eco-400" /> Operational System Log
            </h3>
            <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] text-eco-400 font-mono border border-eco-500/20">LIVE</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 my-4 font-mono text-[10px] pr-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-1.5 leading-relaxed">
                <span className="text-slate-500">[{log.time}]</span>
                <span className={
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'warning' ? 'text-orange-400' :
                  log.type === 'success' ? 'text-eco-400' :
                  'text-slate-300'
                }>
                  {log.text}
                </span>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-slate-500 flex justify-between items-center border-t border-white/5 pt-2 font-mono">
            <span>Sensors Active: 45 / 45</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-eco-500 animate-ping"></span> 1.25 Gb/s stream</span>
          </div>
        </div>

      </div>
    </div>
  );
}
