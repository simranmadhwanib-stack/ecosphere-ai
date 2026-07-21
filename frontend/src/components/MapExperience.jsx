import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Trees, Droplets, BatteryCharging, MapPin } from 'lucide-react';

const layers = [
  { key: 'pollution', label: 'Pollution Zones', color: 'bg-red-500' },
  { key: 'leaks', label: 'Leakage', color: 'bg-cyan-500' },
  { key: 'trees', label: 'Tree Cover', color: 'bg-eco-500' },
  { key: 'waste', label: 'Waste', color: 'bg-orange-500' },
  { key: 'violations', label: 'Violations', color: 'bg-purple-500' },
  { key: 'renewables', label: 'Renewables', color: 'bg-blue-500' }
];

export default function MapExperience({ apiBase, activeLocationName }) {
  const [activeLayer, setActiveLayer] = useState('pollution');
  const [mapQuery, setMapQuery] = useState(activeLocationName);
  const [sectors, setSectors] = useState([]);
  const markers = useMemo(() => [
    { id: 1, x: 120, y: 140, type: 'pollution', title: 'Industrial corridor', severity: 'High' },
    { id: 2, x: 307, y: 175, type: 'leaks', title: 'Water main rupture', severity: 'Active' },
    { id: 3, x: 240, y: 290, type: 'trees', title: 'Canopy belt', severity: 'Dense' },
    { id: 4, x: 420, y: 220, type: 'waste', title: 'Overflowing bin', severity: 'Critical' },
    { id: 5, x: 170, y: 350, type: 'violations', title: 'Dumping hotspot', severity: 'Flagged' },
    { id: 6, x: 472, y: 118, type: 'renewables', title: 'Solar cluster', severity: 'Green' }
  ], []);

  useEffect(() => {
    setMapQuery(activeLocationName);
    fetch(`${apiBase}/sectors`).then((response) => response.ok ? response.json() : []).then(setSectors).catch(() => setSectors([]));
  }, [apiBase, activeLocationName]);

  const mapStats = useMemo(() => {
    const pollution = sectors.filter((sector) => sector.aqi > 100).length;
    const leaks = sectors.filter((sector) => sector.water_leak_rate > 0).length;
    const treeCover = sectors.reduce((total, sector) => total + (sector.tree_cover_sqm || 0), 0);
    const solar = sectors.reduce((total, sector) => total + (sector.solar_kwh || 0), 0);
    return [
      { label: 'High-AQI zones', value: `${pollution}`, icon: <AlertTriangle className="w-4 h-4" /> },
      { label: 'Active leaks', value: `${leaks}`, icon: <Droplets className="w-4 h-4" /> },
      { label: 'Tree cover', value: `${Math.round(treeCover / 1000).toLocaleString()}k m²`, icon: <Trees className="w-4 h-4" /> },
      { label: 'Solar generation', value: `${solar.toLocaleString()} kWh`, icon: <BatteryCharging className="w-4 h-4" /> }
    ];
  }, [sectors]);

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-white">Advanced city map</h3>
          <p className="mt-1 text-sm text-slate-400">A premium geospatial layer for pollution, leaks, waste, violations, and renewable assets.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {layers.map((layer) => (
            <button key={layer.key} onClick={() => setActiveLayer(layer.key)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeLayer === layer.key ? 'bg-eco-500/15 text-eco-300 border border-eco-500/20' : 'bg-slate-900/70 text-slate-400 border border-white/5'}`}>
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/5 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <MapPin className="w-4 h-4 text-eco-400" />
          <input
            value={mapQuery}
            onChange={(e) => setMapQuery(e.target.value)}
            placeholder="Search city or district"
            className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-eco-500"
          />
          <button onClick={() => setMapQuery('Delhi, India')} className="rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-slate-300">Delhi</button>
          <button onClick={() => setMapQuery('Jaipur, India')} className="rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-slate-300">Jaipur</button>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-2">
          <iframe
            title="Smart city map"
            src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=12&output=embed`}
            className="h-[360px] w-full rounded-xl border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
        {mapStats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/5 bg-slate-950/60 p-3 text-sm">
            <div className="flex items-center gap-2 text-slate-400">{item.icon} {item.label}</div>
            <div className="mt-2 text-lg font-bold text-white">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
