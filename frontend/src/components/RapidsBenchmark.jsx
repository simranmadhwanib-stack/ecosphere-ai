import React, { useState } from 'react';
import { Cpu, Zap, Activity, Award, BarChart3, HelpCircle, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RapidsBenchmark({ apiBase }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const startBenchmark = async () => {
    setRunning(true);
    setResults(null);
    setProgress(10);
    
    // Simulate loading bar steps
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 20;
      });
    }, 200);

    try {
      const res = await fetch(`${apiBase}/benchmark`);
      if (res.ok) {
        const data = await res.json();
        
        // Add a slight delay to let user see the cool telemetry scan animation
        setTimeout(() => {
          clearInterval(interval);
          setProgress(100);
          setResults(data);
          setRunning(false);
        }, 1200);
      }
    } catch (e) {
      clearInterval(interval);
      setRunning(false);
      alert("Error contacting the backend benchmarking API.");
    }
  };

  // Chart data formatting
  const chartData = results ? [
    { name: 'CPU Pandas', time: results.cpuTimeMs, color: '#94a3b8' },
    { name: 'NVIDIA cuDF (GPU)', time: results.gpuTimeMs, color: '#22bd6c' }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 border-eco-500/20 hover:border-eco-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="cyber-scanline"></div>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-eco-400" /> NVIDIA® RAPIDS™ GPU Acceleration Benchmarks
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Compare big-data ingestion & aggregation timings. Process 10,000,000 environmental telemetry records on CPU (single-thread Pandas) vs. GPU (CUDA-parallelized cuDF).
          </p>
        </div>
        <div className="bg-eco-500/10 border border-eco-500/20 text-eco-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono">
          <Activity className="w-4 h-4 animate-pulse" /> NVIDIA GPU DIRECT ACCESS ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RUN CONSOLE PANEL */}
        <div className="glass-panel p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              Analytics Accelerator
            </h3>
            <p className="text-xs text-slate-400">
              By offloading BigQuery aggregation tasks and forecasting models directly to GPU CUDA tensor cores, EcoSphere decreases latency, permitting real-time civic disaster alerting.
            </p>
          </div>

          {/* Benchmark trigger console */}
          <div className="bg-slate-950/60 p-5 rounded-xl border border-white/5 space-y-4">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono text-slate-500 block">TARGET SET: 10,000,000 RECORDS</span>
              <button
                disabled={running}
                onClick={startBenchmark}
                className={`w-full py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  running 
                    ? 'bg-slate-900 border border-white/10 text-slate-500 cursor-not-allowed'
                    : 'bg-eco-500 text-white shadow-neon-green hover:bg-eco-600 cursor-pointer'
                }`}
              >
                <Cpu className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
                {running ? 'Processing Data Grid...' : 'Run GPU Benchmark Query'}
              </button>
            </div>

            {/* In-progress progress bar */}
            {running && (
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono text-eco-400">
                  <span>AGGREGATING DATASETS...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-eco-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 space-y-1">
            <div className="flex justify-between"><span>GPU Model:</span><span className="text-slate-300">NVIDIA RTX A5000</span></div>
            <div className="flex justify-between"><span>CUDA Drivers:</span><span className="text-slate-300">v12.2</span></div>
            <div className="flex justify-between"><span>Max Allocatable VRAM:</span><span className="text-slate-300">24 GB</span></div>
          </div>
        </div>

        {/* RESULTS PANEL */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-between">
          {results ? (
            <div className="space-y-6 flex-grow flex flex-col justify-between">
              
              {/* Timing results grids */}
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-eco-400" /> Benchmark Results
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">CPU (Pandas) Time</span>
                    <p className="text-2xl font-extrabold text-slate-400 mt-1 font-mono">{results.cpuTimeMs} ms</p>
                    <span className="text-[9px] text-slate-500 font-mono">Single-threaded Loop</span>
                  </div>

                  <div className="bg-eco-500/10 p-4 rounded-xl border border-eco-500/20 text-center relative overflow-hidden">
                    <span className="text-[10px] text-eco-400 font-bold uppercase tracking-wider block">GPU (RAPIDS cuDF) Time</span>
                    <p className="text-2xl font-extrabold text-eco-400 mt-1 font-mono">{results.gpuTimeMs} ms</p>
                    <span className="text-[9px] text-eco-500 font-mono">CUDA Grid Aggregation</span>
                  </div>

                  <div className="bg-gradient-to-br from-eco-500/25 to-blue-500/25 p-4 rounded-xl border border-eco-500/30 text-center flex flex-col justify-center items-center">
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider block">Speedup Factor</span>
                    <p className="text-3xl font-extrabold text-white mt-1 font-mono">{results.speedup}x</p>
                    <span className="text-[9px] text-eco-300 font-bold">FASTER RUN TIME</span>
                  </div>
                </div>
              </div>

              {/* Timing Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* Visual bar chart */}
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, fontSize: 11 }} 
                      />
                      <Bar dataKey="time" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <rect key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Explanation text */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
                  <span className="text-slate-300 font-bold flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-eco-400" /> Explainable GPU AI</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    By parallelizing file reads and column filters across **{results.cudaCoresActive} CUDA cores**, NVIDIA RAPIDS bypasses Python GIL bottlenecks. Operations that block server APIs for hundreds of milliseconds are resolved in milliseconds, enabling real-time Sustainability Scores for city governors.
                  </p>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full space-y-4 py-16 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-white/10 text-slate-500">
                <BarChart3 className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Benchmarks Ready</h4>
                <p className="text-xs text-slate-400 max-w-[280px] mt-1 mx-auto">
                  Click the 'Run GPU Benchmark Query' button to execute parallel processing comparisons on 10M records.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
