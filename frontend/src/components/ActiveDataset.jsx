import React, { useEffect, useState } from 'react';
import { Database, Download, RefreshCw, TableProperties } from 'lucide-react';

export default function ActiveDataset({ apiBase, activeLocationName }) {
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDataset = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiBase}/dataset/active`);
      if (!response.ok) throw new Error('The active data feed is unavailable.');
      setDataset(await response.json());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataset();
  }, [apiBase, activeLocationName]);

  const downloadCsv = () => {
    if (!dataset?.records?.length) return;
    const headers = ['date', ...dataset.fields];
    const lines = [headers.join(','), ...dataset.records.map((record) => headers.map((field) => record[field] ?? '').join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecosphere-${activeLocationName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-telemetry.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-extrabold text-white"><Database className="h-5 w-5 text-cyan-400" /> Active telemetry dataset</h3>
            <p className="mt-1 text-sm text-slate-400">These are the exact records currently used by the KPIs, charts, simulation, and NLP assistant.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadDataset} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:border-cyan-400/40 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
            <button onClick={downloadCsv} disabled={!dataset?.records?.length} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"><Download className="h-3.5 w-3.5" /> Download CSV</button>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}
        {dataset && (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Location</p><p className="mt-1 text-sm font-bold text-white">{dataset.location.name}</p><p className="mt-1 text-xs text-cyan-300">{dataset.location.weather.temperatureC}°C · {dataset.location.weather.humidityPct}% humidity</p></div>
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Data source</p><p className="mt-1 text-sm font-bold text-white">{dataset.source}</p><p className="mt-1 text-xs text-slate-400">Updated {new Date(dataset.updatedAt).toLocaleString()}</p></div>
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Model input</p><p className="mt-1 text-sm font-bold text-white">{dataset.totalRecords.toLocaleString()} records</p><p className="mt-1 text-xs text-slate-400">Latest snapshot: {dataset.latestDate}</p></div>
          </div>
        )}
      </section>

      <section className="glass-panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/5 px-6 py-4 text-sm font-bold text-white"><TableProperties className="h-4 w-4 text-eco-400" /> Latest records entering the model</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-xs">
            <thead className="bg-slate-950/70 text-[10px] uppercase tracking-wider text-slate-500"><tr>{['Sector', 'Energy', 'Water', 'Leak', 'AQI', 'Tree cover', 'Waste', 'Carbon', 'Solar', 'Temperature', 'Humidity'].map((label) => <th className="px-4 py-3 font-semibold" key={label}>{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-white/5">{dataset?.records?.map((record) => <tr key={record.sector} className="text-slate-300 hover:bg-white/[0.02]"><td className="px-4 py-3 font-semibold text-white">{record.sector}</td><td className="px-4 py-3">{record.electricity_kwh.toLocaleString()} kWh</td><td className="px-4 py-3">{record.water_liters.toLocaleString()} L</td><td className="px-4 py-3">{record.water_leak_rate}%</td><td className="px-4 py-3">{record.aqi}</td><td className="px-4 py-3">{record.tree_cover_sqm.toLocaleString()} m²</td><td className="px-4 py-3">{record.waste_fill_pct}%</td><td className="px-4 py-3">{record.carbon_kg.toLocaleString()} kg</td><td className="px-4 py-3">{record.solar_kwh.toLocaleString()} kWh</td><td className="px-4 py-3">{record.temperature_c}°C</td><td className="px-4 py-3">{record.humidity_pct}%</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
