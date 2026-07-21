import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, TrendingUp, Trees, Zap, Droplets, MapPinned, AlertTriangle,
  Sparkles, BadgeCheck, Building2, Route, Recycle, BatteryCharging,
  Gauge, ArrowRight, Cpu, Users, Landmark, School, BriefcaseBusiness
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, CartesianGrid,
  XAxis, YAxis, Tooltip
} from 'recharts';

const fallbackOverview = {
  executive: {
    sustainabilityIndex: 88,
    complianceScore: 91,
    finesCollected: 1240000,
    inspectionsScheduled: 36,
    aiConfidence: 96
  },
  compliance: {
    totalViolations: 42,
    pendingCases: 18,
    resolvedCases: 24,
    repeatOffenders: 6,
    fines: 1240000,
    heatmap: [
      { label: 'North', value: 72 },
      { label: 'Central', value: 58 },
      { label: 'East', value: 88 },
      { label: 'South', value: 64 },
      { label: 'West', value: 76 }
    ]
  },
  twin: {
    buildings: 184,
    roads: 312,
    trees: 8250,
    pollution: 37,
    leaks: 4,
    solar: 28,
    waste: 6,
    grid: 93
  },
  leaderboard: [
    { name: 'Jaipur', sustainability: 91, water: 86, carbon: 89, energy: 90, trees: 87, type: 'City' },
    { name: 'Delhi', sustainability: 87, water: 82, carbon: 84, energy: 83, trees: 81, type: 'City' },
    { name: 'Sector 14', sustainability: 84, water: 80, carbon: 82, energy: 79, trees: 85, type: 'Society' },
    { name: 'Greenfield School', sustainability: 82, water: 78, carbon: 80, energy: 77, trees: 83, type: 'School' },
    { name: 'AquaTech', sustainability: 80, water: 76, carbon: 78, energy: 75, trees: 79, type: 'Business' }
  ],
  coach: [
    { citizen: 'Mira', ecoScore: 92, weeklyTrend: '+12%', carbonFootprint: '3.4 t', badge: 'Water Guardian', recommendation: 'Shift laundry to off-peak hours.' },
    { citizen: 'Arjun', ecoScore: 86, weeklyTrend: '+8%', carbonFootprint: '4.1 t', badge: 'Solar Starter', recommendation: 'Use rooftop solar surplus in the evening.' },
    { citizen: 'Neha', ecoScore: 79, weeklyTrend: '+5%', carbonFootprint: '4.9 t', badge: 'Compost Champion', recommendation: 'Install a home composting unit.' }
  ],
  sdg: [
    { goal: 'SDG 6', progress: 84, label: 'Clean Water' },
    { goal: 'SDG 7', progress: 88, label: 'Affordable Energy' },
    { goal: 'SDG 11', progress: 81, label: 'Sustainable Cities' },
    { goal: 'SDG 13', progress: 90, label: 'Climate Action' },
    { goal: 'SDG 15', progress: 86, label: 'Life on Land' }
  ],
  agent: [
    { id: 'T-204', task: 'Schedule leakage inspection', owner: 'Officer Kavita', status: 'Scheduled', priority: 'High' },
    { id: 'T-205', task: 'Notify waste collectors', owner: 'Ops Desk', status: 'In progress', priority: 'Medium' },
    { id: 'T-206', task: 'Issue solar maintenance ticket', owner: 'Field Team', status: 'Queued', priority: 'Low' }
  ],
  whatIf: {
    treeImpact: { aqi: 41, carbon: 2810, temperature: 29.4 },
    solarImpact: { savings: 418, carbon: 2720, cost: 162000 },
    rainfallImpact: { shortage: '12%', groundwater: '7% below baseline' }
  }
};

const iconForCategory = (category) => {
  if (category === 'City') return <Landmark className="w-4 h-4 text-eco-400" />;
  if (category === 'Society') return <Building2 className="w-4 h-4 text-cyan-400" />;
  if (category === 'School') return <School className="w-4 h-4 text-orange-400" />;
  return <BriefcaseBusiness className="w-4 h-4 text-blue-400" />;
};

export default function EnterpriseOS({ apiBase }) {
  const [overview, setOverview] = useState(fallbackOverview);
  const [loading, setLoading] = useState(true);
  const [treeIncrease, setTreeIncrease] = useState(20);
  const [solarIncrease, setSolarIncrease] = useState(30);
  const [rainfallDrop, setRainfallDrop] = useState(18);
  const [simResult, setSimResult] = useState(fallbackOverview.whatIf);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [overviewRes, complianceRes, leaderboardRes, coachRes, sdgRes, agentRes] = await Promise.all([
          fetch(`${apiBase}/enterprise/overview`),
          fetch(`${apiBase}/enterprise/compliance`),
          fetch(`${apiBase}/enterprise/leaderboard`),
          fetch(`${apiBase}/enterprise/coach`),
          fetch(`${apiBase}/enterprise/sdg`),
          fetch(`${apiBase}/enterprise/agent`)
        ]);

        const overviewData = overviewRes.ok ? await overviewRes.json() : fallbackOverview;
        const complianceData = complianceRes.ok ? await complianceRes.json() : fallbackOverview.compliance;
        const leaderboardData = leaderboardRes.ok ? await leaderboardRes.json() : fallbackOverview.leaderboard;
        const coachData = coachRes.ok ? await coachRes.json() : fallbackOverview.coach;
        const sdgData = sdgRes.ok ? await sdgRes.json() : fallbackOverview.sdg;
        const agentData = agentRes.ok ? await agentRes.json() : fallbackOverview.agent;

        setOverview({
          executive: overviewData.executive || fallbackOverview.executive,
          compliance: complianceData,
          twin: overviewData.twin || fallbackOverview.twin,
          leaderboard: leaderboardData,
          coach: coachData,
          sdg: sdgData,
          agent: agentData,
          whatIf: overviewData.whatIf || fallbackOverview.whatIf
        });
        setSimResult(overviewData.whatIf || fallbackOverview.whatIf);
      } catch (error) {
        console.warn('Enterprise dashboard fallback active', error);
        setOverview(fallbackOverview);
        setSimResult(fallbackOverview.whatIf);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [apiBase]);

  const leaderboardData = useMemo(() => overview.leaderboard?.map((item, index) => ({ ...item, rank: index + 1 })), [overview]);

  const runWhatIf = async () => {
    try {
      const res = await fetch(`${apiBase}/enterprise/whatif`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ treeIncrease, solarIncrease, rainfallDrop })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
      }
    } catch (error) {
      console.warn('What-if simulator fallback', error);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-eco-500/20 bg-eco-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-eco-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Enterprise control center
            </div>
            <h2 className="mt-3 text-2xl font-extrabold text-white">Smart City Sustainability Operating System</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Monitor compliance, simulate interventions, and orchestrate civic operations from one premium command layer.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-slate-950/50 p-3 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">AI confidence</div>
              <div className="text-lg font-bold text-white">{overview.executive?.aiConfidence || 96}%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Fines collected</div>
              <div className="text-lg font-bold text-eco-400">₹{(overview.executive?.finesCollected || 1240000).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Sustainability Index', value: `${overview.executive?.sustainabilityIndex || 88}%`, icon: <TrendingUp className="w-5 h-5" />, tone: 'text-eco-400' },
          { label: 'Compliance Score', value: `${overview.executive?.complianceScore || 91}%`, icon: <ShieldCheck className="w-5 h-5" />, tone: 'text-blue-400' },
          { label: 'Inspections', value: `${overview.executive?.inspectionsScheduled || 36}`, icon: <MapPinned className="w-5 h-5" />, tone: 'text-cyan-400' },
          { label: 'Repeat Offenders', value: `${overview.compliance?.repeatOffenders || 6}`, icon: <AlertTriangle className="w-5 h-5" />, tone: 'text-orange-400' }
        ].map((card, index) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="glass-panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">{card.label}</div>
                <div className={`mt-2 text-2xl font-extrabold ${card.tone}`}>{card.value}</div>
              </div>
              <div className={`rounded-xl bg-slate-900/70 p-2 ${card.tone}`}>{card.icon}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-white">Compliance & fine management</h3>
              <p className="mt-1 text-sm text-slate-400">AI flags waste dumping, leakage, theft, pollution, and emissions with auto-fine routing.</p>
            </div>
            <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
              {overview.compliance?.pendingCases || 18} pending
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Open cases</div>
              <div className="mt-2 text-xl font-bold text-white">{overview.compliance?.totalViolations || 42}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Resolved</div>
              <div className="mt-2 text-xl font-bold text-eco-400">{overview.compliance?.resolvedCases || 24}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Fine pool</div>
              <div className="mt-2 text-xl font-bold text-blue-400">₹{(overview.compliance?.fines || 1240000).toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {[
              { id: 'V-1042', type: 'Illegal dumping', officer: 'Officer Nisha', status: 'Pending', amount: '₹50k', confidence: '97%' },
              { id: 'V-1043', type: 'Water leakage', officer: 'Officer Rohit', status: 'Escalated', amount: '₹25k', confidence: '95%' },
              { id: 'V-1044', type: 'Pollution breach', officer: 'Officer Meera', status: 'Resolved', amount: '₹75k', confidence: '98%' }
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/50 px-3 py-3 text-sm">
                <div>
                  <div className="font-semibold text-white">{item.id}</div>
                  <div className="text-xs text-slate-400">{item.type} • {item.officer}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-eco-400">{item.amount}</div>
                  <div className="text-[11px] text-slate-500">{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-extrabold text-white">Digital twin layer</h3>
          </div>
          <p className="mt-1 text-sm text-slate-400">Animated city telemetry for buildings, roads, trees, pollution, pipelines, grids, waste, and solar assets.</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { label: 'Buildings', value: overview.twin?.buildings || 184, icon: <Building2 className="w-4 h-4" />, tone: 'text-blue-400' },
              { label: 'Roads', value: overview.twin?.roads || 312, icon: <Route className="w-4 h-4" />, tone: 'text-cyan-400' },
              { label: 'Trees', value: overview.twin?.trees || 8250, icon: <Trees className="w-4 h-4" />, tone: 'text-eco-400' },
              { label: 'Solar sites', value: overview.twin?.solar || 28, icon: <BatteryCharging className="w-4 h-4" />, tone: 'text-orange-400' }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
                <div className={`mb-2 ${item.tone}`}>{item.icon}</div>
                <div className="text-lg font-bold text-white">{item.value}</div>
                <div className="text-xs text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/5 bg-gradient-to-br from-eco-500/10 via-slate-950/60 to-blue-500/10 p-4">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Live city pulse</span>
              <span className="text-eco-400">{overview.twin?.grid || 93}% grid health</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-900">
              <div className="h-2 rounded-full bg-gradient-to-r from-eco-500 to-cyan-400" style={{ width: `${overview.twin?.grid || 93}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-full bg-slate-900/80 px-2 py-1">Pollution {overview.twin?.pollution || 37}</span>
              <span className="rounded-full bg-slate-900/80 px-2 py-1">Leaks {overview.twin?.leaks || 4}</span>
              <span className="rounded-full bg-slate-900/80 px-2 py-1">Waste {overview.twin?.waste || 6}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-white">What-if simulator</h3>
              <p className="mt-1 text-sm text-slate-400">Model policy interventions before they hit the field.</p>
            </div>
            <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
              Live forecast
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {[
              { label: 'Tree increase (%)', value: treeIncrease, setValue: setTreeIncrease, min: 0, max: 40 },
              { label: 'Solar increase (%)', value: solarIncrease, setValue: setSolarIncrease, min: 0, max: 50 },
              { label: 'Rainfall drop (%)', value: rainfallDrop, setValue: setRainfallDrop, min: 0, max: 30 }
            ].map((slider) => (
              <label key={slider.label} className="block text-sm text-slate-300">
                <div className="mb-2 flex items-center justify-between">
                  <span>{slider.label}</span>
                  <span className="text-eco-400">{slider.value}%</span>
                </div>
                <input type="range" min={slider.min} max={slider.max} value={slider.value} onChange={(e) => slider.setValue(Number(e.target.value))} className="w-full accent-eco-500" />
              </label>
            ))}
          </div>

          <button onClick={runWhatIf} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-eco-500/15 px-3 py-2 text-sm font-semibold text-eco-300 transition hover:bg-eco-500/25">
            <Sparkles className="w-4 h-4" /> Generate scenario forecast
          </button>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">AQI</div>
              <div className="mt-2 text-xl font-bold text-white">{simResult.treeImpact?.aqi || 41}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Carbon</div>
              <div className="mt-2 text-xl font-bold text-orange-400">{simResult.treeImpact?.carbon?.toLocaleString() || '2,810'} kg</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Water stress</div>
              <div className="mt-2 text-xl font-bold text-cyan-400">{simResult.rainfallImpact?.shortage || '12%'}</div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-white">Community leaderboard</h3>
              <p className="mt-1 text-sm text-slate-400">Rank cities, districts, societies, schools, and businesses by sustainability performance.</p>
            </div>
            <div className="rounded-full border border-eco-500/20 bg-eco-500/10 px-3 py-1 text-xs font-semibold text-eco-400">
              Top 5
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {leaderboardData?.map((item) => (
              <div key={`${item.name}-${item.type}`} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/50 px-3 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-slate-900 p-2">{iconForCategory(item.type)}</div>
                  <div>
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.type}</div>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div className="font-semibold text-eco-400">{item.sustainability}%</div>
                  <div>Water {item.water}% • Trees {item.trees}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-extrabold text-white">Personal eco coach</h3>
          </div>
          <div className="mt-5 grid gap-3">
            {overview.coach?.map((person) => (
              <div key={person.citizen} className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{person.citizen}</div>
                    <div className="text-xs text-slate-500">{person.badge}</div>
                  </div>
                  <div className="rounded-full bg-eco-500/10 px-3 py-1 text-xs font-semibold text-eco-400">Eco score {person.ecoScore}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-full bg-slate-900/80 px-2 py-1">Weekly {person.weeklyTrend}</span>
                  <span className="rounded-full bg-slate-900/80 px-2 py-1">Footprint {person.carbonFootprint}</span>
                </div>
                <div className="mt-3 text-sm text-slate-300">{person.recommendation}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-white">SDG tracker</h3>
              <p className="mt-1 text-sm text-slate-400">Unified progress across water, energy, cities, climate, and ecosystems.</p>
            </div>
            <div className="rounded-full border border-eco-500/20 bg-eco-500/10 px-3 py-1 text-xs font-semibold text-eco-400">Live</div>
          </div>

          <div className="mt-5 space-y-4">
            {overview.sdg?.map((item) => (
              <div key={item.goal}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">{item.goal}</span>
                  <span className="text-eco-400">{item.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-900">
                  <div className="h-2 rounded-full bg-gradient-to-r from-eco-500 to-cyan-400" style={{ width: `${item.progress}%` }} />
                </div>
                <div className="mt-1 text-xs text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-extrabold text-white">Autonomous AI agent actions</h3>
        </div>
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-3">
          {overview.agent?.map((task) => (
            <div key={task.id} className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">{task.id}</div>
                <div className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400">{task.priority}</div>
              </div>
              <div className="mt-2 text-sm text-slate-300">{task.task}</div>
              <div className="mt-3 text-xs text-slate-500">Owner: {task.owner}</div>
              <div className="mt-2 inline-flex items-center gap-2 text-sm text-eco-400">
                <ArrowRight className="w-4 h-4" /> {task.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-white">AI planning insights</h3>
            <p className="mt-1 text-sm text-slate-400">Executive-grade recommendations tied to the current city telemetry.</p>
          </div>
          <div className="rounded-full border border-eco-500/20 bg-eco-500/10 px-3 py-1 text-xs font-semibold text-eco-400">Enterprise-ready</div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            'Deploy tree belts around the eastern industrial corridor.',
            'Shift peak grid demand with battery optimization at the civic core.',
            'Pre-empt water shortages with leakage isolation and demand throttling.',
            'Send public transparency updates to citizens and officers.'
          ].map((insight, index) => (
            <div key={insight} className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 text-sm text-slate-300">
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Action {index + 1}</div>
              <div className="mt-2">{insight}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
