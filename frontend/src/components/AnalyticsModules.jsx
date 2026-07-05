import React, { useState, useEffect } from 'react';
import { Zap, Droplet, Wind, Trash2, ShieldAlert, Award, FileText, CheckCircle, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

export default function AnalyticsModules({ apiBase }) {
  const [activeTab, setActiveTab] = useState('electricity');
  const [history, setHistory] = useState([]);
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hRes = await fetch(`${apiBase}/history`);
        const sRes = await fetch(`${apiBase}/sectors`);
        if (hRes.ok) setHistory(await hRes.json());
        if (sRes.ok) setSectors(await sRes.json());
      } catch (e) {
        console.error("Telemetry load failed in analytics tabs", e);
      }
    };
    fetchData();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Tab bar header */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-white/5 text-xs select-none">
        <button
          onClick={() => setActiveTab('electricity')}
          className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'electricity' ? 'bg-blue-500 text-white shadow-neon-blue' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" /> Electricity Analytics
        </button>

        <button
          onClick={() => setActiveTab('water')}
          className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'water' ? 'bg-cyan-500 text-white shadow-neon-cyan' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Droplet className="w-4 h-4" /> Water Grid
        </button>

        <button
          onClick={() => setActiveTab('air')}
          className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'air' ? 'bg-eco-500 text-white shadow-neon-green' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wind className="w-4 h-4" /> Air & Tree Cover
        </button>

        <button
          onClick={() => setActiveTab('waste')}
          className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'waste' ? 'bg-orange-500 text-white shadow-neon-orange' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trash2 className="w-4 h-4" /> Waste & Carbon
        </button>
      </div>

      {/* Dynamic Tab Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TAB SPECIFIC TEXTS & RECOMMENDATIONS */}
        <div className="glass-panel p-6 flex flex-col justify-between space-y-6">
          {activeTab === 'electricity' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" /> Smart Grid Demand Analysis
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                EcoSphere monitors municipal smart meters, correlating grid draws with ambient weather indicators. High humidity and heat indices increase AC demand loads downtown.
              </p>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 text-xs space-y-2.5">
                <span className="font-bold text-white block">AI Grid Recommendations:</span>
                <div className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> <span>Deploy battery peak shifters in the civic core.</span></div>
                <div className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> <span>Increase solar microgrid rooftop density in the innovation district.</span></div>
              </div>
            </div>
          )}

          {activeTab === 'water' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Droplet className="w-5 h-5 text-cyan-400" /> Volumetric Flow Telemetry
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Localized telemetry watches distribution pressures. Standard household consumption peaks between 07:00 and 09:00, whereas industrial sector volumes draw continuously.
              </p>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 text-xs space-y-2.5">
                <span className="font-bold text-white block">AI Leak Control Guides:</span>
                <div className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" /> <span>Isolate smart valves during drop pressure intervals.</span></div>
                <div className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" /> <span>Promote gray-water irrigation in Residential park domains.</span></div>
              </div>
            </div>
          )}

          {activeTab === 'air' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wind className="w-5 h-5 text-eco-400" /> Canopy & Smog Mitigation
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Leaf indices show park domains absorbing significant particulate matter. Industrial sectors require buffer greenways to protect neighboring housing grids.
              </p>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 text-xs space-y-2.5">
                <span className="font-bold text-white block">Plantation Recommendation Engine:</span>
                <div className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-eco-400 shrink-0 mt-0.5" /> <span>Plant deep-root broadleaf trees in Sector 2.</span></div>
                <div className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-eco-400 shrink-0 mt-0.5" /> <span>Install vertical gardens on dense civic high-rises.</span></div>
              </div>
            </div>
          )}

          {activeTab === 'waste' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-orange-400" /> Logistics & Carbon Index
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ultrasound sensors on waste bins update fill indexes. Collection routes are automatically mapped via GPU linear solver solvers to minimize diesel carbon footprint.
              </p>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 text-xs space-y-2.5">
                <span className="font-bold text-white block">Carbon Optimization Paths:</span>
                <div className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" /> <span>Dynamic route rerouting when bin thresholds hit 80%.</span></div>
                <div className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" /> <span>Expand compost digestors near Residential markets.</span></div>
              </div>
            </div>
          )}

          <div className="text-[10px] text-slate-500 flex justify-between items-center border-t border-white/5 pt-4 font-mono">
            <span>SDG Track: Target 11, 13</span>
            <span>UN SDGs Verified</span>
          </div>
        </div>

        {/* RESOURCE SPECIFIC VISUAL CHART */}
        <div className="glass-panel p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              {activeTab === 'electricity' ? 'Electricity Demand Profiles' :
               activeTab === 'water' ? 'Water Supply Pressures' :
               activeTab === 'air' ? 'Air Pollution (AQI) Trends' : 'Waste Fullness Levels'}
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Telemetry (30 days)</span>
          </div>

          <div className="h-[240px] w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={
                        activeTab === 'electricity' ? '#3b82f6' :
                        activeTab === 'water' ? '#06b6d4' :
                        activeTab === 'air' ? '#22bd6c' : '#f97316'
                      } stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={
                        activeTab === 'electricity' ? '#3b82f6' :
                        activeTab === 'water' ? '#06b6d4' :
                        activeTab === 'air' ? '#22bd6c' : '#f97316'
                      } stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, fontSize: 11 }} />
                  <Area
                    type="monotone"
                    name={
                      activeTab === 'electricity' ? 'Energy (kWh)' :
                      activeTab === 'water' ? 'Water Volume (Liters)' :
                      activeTab === 'air' ? 'Air Pollutants (AQI)' : 'Carbon Emitted (kg)'
                    }
                    dataKey={
                      activeTab === 'electricity' ? 'electricity' :
                      activeTab === 'water' ? 'water' :
                      activeTab === 'air' ? 'aqi' : 'carbon'
                    }
                    stroke={
                      activeTab === 'electricity' ? '#3b82f6' :
                      activeTab === 'water' ? '#06b6d4' :
                      activeTab === 'air' ? '#22bd6c' : '#f97316'
                    }
                    fillOpacity={1}
                    fill="url(#analyticsGrad)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Querying database telemetry indices...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

