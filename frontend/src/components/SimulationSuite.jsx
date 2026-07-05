import React, { useState, useEffect } from 'react';
import { Sliders, HelpCircle, Activity, Zap, Droplet, Wind, Flame, TrendingDown, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SimulationSuite({ apiBase, activeLocationName }) {
  // Simulator parameter states
  const [params, setParams] = useState({
    renewablePct: 20,
    treeCoverPct: 0, // % change
    tempRise: 0, // °C increase
    evAdoptionPct: 15
  });

  const [simResults, setSimResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        setSimResults(data);
      }
    } catch (e) {
      console.error("Failed to run scenario simulation", e);
    } finally {
      setLoading(false);
    }
  };

  // Run simulation on slider change (debounce or trigger instantly)
  useEffect(() => {
    runSimulation();
  }, [params, activeLocationName]);

  const handleSliderChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: Number(value) }));
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 glow-border-cyan flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="cyber-scanline"></div>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" /> "What-If" Sustainability Scenario Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Adjust global civic attributes to simulate energy grid load shifts, AQI atmospheric particulate levels, and carbon footprint trends over 12 months.
          </p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono">
          <Activity className="w-4 h-4 animate-pulse" /> SIMULATION ENGINE ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SLIDERS MODULE */}
        <div className="glass-panel p-6 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            System Parameters
          </h3>
          
          <div className="space-y-5 text-xs">
            {/* Slider 1: Renewable Grid Mix */}
            <div className="space-y-2">
              <div className="flex justify-between font-medium">
                <span className="text-slate-300">Renewable Energy Mix</span>
                <span className="text-blue-400 font-bold font-mono">{params.renewablePct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.renewablePct}
                onChange={(e) => handleSliderChange('renewablePct', e.target.value)}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <p className="text-[10px] text-slate-400">Replaces fossil fuel base-load. Drops carbon emissions by 0.7% for every 1% mix.</p>
            </div>

            {/* Slider 2: Tree Cover */}
            <div className="space-y-2">
              <div className="flex justify-between font-medium">
                <span className="text-slate-300">Tree Canopy Expansion</span>
                <span className="text-eco-400 font-bold font-mono">{params.treeCoverPct > 0 ? `+${params.treeCoverPct}` : params.treeCoverPct}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="100"
                value={params.treeCoverPct}
                onChange={(e) => handleSliderChange('treeCoverPct', e.target.value)}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-eco-500"
              />
              <p className="text-[10px] text-slate-400">Canopy covers filter particulate smog. +10% canopy improves average AQI by 2.5 points.</p>
            </div>

            {/* Slider 3: Temp Rise */}
            <div className="space-y-2">
              <div className="flex justify-between font-medium">
                <span className="text-slate-300">Ambient Temperature Rise</span>
                <span className="text-orange-400 font-bold font-mono">+{params.tempRise}°C</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={params.tempRise}
                onChange={(e) => handleSliderChange('tempRise', e.target.value)}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <p className="text-[10px] text-slate-400">Simulates global heating. Each +1°C increases AC energy draws by 4% and water demand by 3%.</p>
            </div>

            {/* Slider 4: EV Adoption */}
            <div className="space-y-2">
              <div className="flex justify-between font-medium">
                <span className="text-slate-300">Electric Vehicle (EV) Adoption</span>
                <span className="text-cyan-400 font-bold font-mono">{params.evAdoptionPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.evAdoptionPct}
                onChange={(e) => handleSliderChange('evAdoptionPct', e.target.value)}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[10px] text-slate-400">Displaces internal combustion engines. Cuts carbon emissions but raises grid charging loads.</p>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 space-y-2 text-[10px] text-slate-400">
            <span className="font-bold text-white flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-eco-400" /> Scenario Presets</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <button 
                onClick={() => setParams({ renewablePct: 80, treeCoverPct: 50, tempRise: 0, evAdoptionPct: 75 })}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-white/10"
              >
                🌲 Green Utopia
              </button>
              <button 
                onClick={() => setParams({ renewablePct: 5, treeCoverPct: -30, tempRise: 3.5, evAdoptionPct: 5 })}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-white/10"
              >
                🔥 Climate Alert
              </button>
              <button 
                onClick={() => setParams({ renewablePct: 50, treeCoverPct: 20, tempRise: 1.5, evAdoptionPct: 40 })}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-white/10"
              >
                ⚖ Intermediate
              </button>
            </div>
          </div>
        </div>

        {/* METRICS & CHART PREDICTIONS */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-between space-y-6">
          
          {/* SIMULATED RESULTS SCORE MATRIX */}
          {simResults && (
            <div className="space-y-6">
              
              {/* Score card grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 relative">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Simulated Index</span>
                  <p className="text-2xl font-extrabold text-eco-400 mt-1">{simResults.metrics.sustainabilityScore}%</p>
                  <span className="text-[9px] text-slate-500">Global Score</span>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Energy Load</span>
                  <p className="text-2xl font-extrabold text-blue-400 mt-1">{simResults.metrics.energyKwh?.toLocaleString()} kWh</p>
                  <span className="text-[9px] text-slate-500">Peak Demand Draw</span>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Carbon Footprint</span>
                  <p className="text-2xl font-extrabold text-orange-400 mt-1">{simResults.metrics.carbonKg?.toLocaleString()} kg</p>
                  <span className="text-[9px] text-slate-500">Daily GHG Output</span>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Average AQI</span>
                  <p className={`text-2xl font-extrabold mt-1 ${simResults.metrics.aqi > 100 ? 'text-red-500' : 'text-cyan-400'}`}>{simResults.metrics.aqi}</p>
                  <span className="text-[9px] text-slate-500">Air Pollutant Level</span>
                </div>
              </div>

              {/* Projections Chart */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">12-Month Carbon Trend: Baseline vs. Simulated</h4>
                  {loading && <span className="text-[10px] text-cyan-400 animate-pulse">Recalculating...</span>}
                </div>

                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={simResults.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, fontSize: 11 }} 
                      />
                      <Legend wrapperStyle={{ fontSize: 10, color: '#fff' }} />
                      <Line type="monotone" name="Baseline Carbon (kg)" dataKey="baselineCarbon" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" name="Simulated Carbon (kg)" dataKey="simulatedCarbon" stroke="#f97316" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {!simResults && (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs py-20">
              Initializing scenario matrix queries...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
