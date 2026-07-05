import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, CheckCircle, Zap, Trees, Droplet, Star, Award, ShieldAlert } from 'lucide-react';

export default function EcoGamification({ apiBase, kpis, fetchGlobalState }) {
  const rewards = kpis.ecoRewards || {
    xp: 1450,
    level: 3,
    points: 300,
    badges: ['Solar Pioneer'],
    completedTasks: []
  };

  const [loadingAction, setLoadingAction] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [zones, setZones] = useState([]);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await fetch(`${apiBase}/sectors`);
        if (res.ok) setZones(await res.json());
      } catch (e) {
        setZones([]);
      }
    };
    fetchZones();
  }, [apiBase, kpis.sustainabilityScore]);

  const zoneNames = zones.map(zone => zone.name);
  const targetZone = (index) => zoneNames[index] || zoneNames[0] || 'Selected Location Zone';

  // Local community leaderboard mock representation
  const leaderboard = (zones.length > 0 ? zones : [
    { name: 'Civic Core', sustainability_score: 88 },
    { name: 'Residential Grid', sustainability_score: 76 },
    { name: 'Innovation District', sustainability_score: 72 },
    { name: 'Green Reserve', sustainability_score: 69 },
    { name: 'Industrial Belt', sustainability_score: 58 }
  ])
    .slice()
    .sort((a, b) => (b.sustainability_score || 0) - (a.sustainability_score || 0))
    .slice(0, 5)
    .map((zone, index) => ({
      rank: index + 1,
      community: zone.name,
      score: zone.sustainability_score || 60,
      badges: Math.max(2, Math.round((zone.sustainability_score || 60) / 14)),
      color: index === 0 ? 'text-eco-400' : index === 1 ? 'text-cyan-400' : index === 2 ? 'text-blue-400' : index === 3 ? 'text-orange-400' : 'text-red-500'
    }));

  // Active Quests
  const quests = useMemo(() => [
    { id: 'FIX_LEAKS', title: 'Isolate Local Water Leak', xp: 300, points: 80, icon: <Droplet className="w-5 h-5 text-cyan-400" />, sector: targetZone(1), description: 'Smart flow sensors detected a volumetric pressure anomaly. Trigger leak isolation.', badge: 'Leak Detective' },
    { id: 'PLANT_TREES', title: 'Expand Urban Forest Canopy', xp: 200, points: 50, icon: <Trees className="w-5 h-5 text-eco-400" />, sector: targetZone(3), description: 'Plant 10,000 sqm of tree canopy to reduce local particulate load.', badge: 'Forest Ranger' },
    { id: 'INSTALL_SOLAR', title: 'Expand Solar Microgrid', xp: 250, points: 60, icon: <Zap className="w-5 h-5 text-blue-400" />, sector: targetZone(4), description: 'Connect high-efficiency PV arrays to the local energy node.', badge: 'Solar Pioneer' }
  ], [zoneNames.join('|')]);

  const handleQuestCompletion = async (questId, sector) => {
    setLoadingAction(questId);
    setSuccessMsg('');
    try {
      const res = await fetch(`${apiBase}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: questId, sector })
      });
      if (res.ok) {
        const result = await res.json();
        setSuccessMsg(result.message);
        fetchGlobalState();

        // Confetti effect
        if (window.confetti) {
          window.confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.8 }
          });
        }
      }
    } catch (e) {
      setSuccessMsg('Quest dispatch error. Verify node backend server logs.');
    } finally {
      setLoadingAction(null);
    }
  };

  const nextLevelXp = rewards.level * 500;
  const xpProgressPct = Math.min(100, Math.round((rewards.xp / nextLevelXp) * 100));

  return (
    <div className="space-y-6">
      {/* 1. GAMIFICATION PROFILE METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PROFILE CARD */}
        <div className="glass-panel p-6 flex flex-col justify-between items-center text-center">
          <div className="space-y-4">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Spinning progress outer ring */}
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="48" 
                  stroke="#22bd6c" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray="301" 
                  strokeDashoffset={301 - (301 * xpProgressPct) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Profile icon */}
              <div className="w-20 h-20 rounded-full bg-slate-950 flex flex-col items-center justify-center border border-white/10">
                <span className="text-3xl">🛡️</span>
                <span className="text-[10px] text-eco-400 font-bold uppercase tracking-wider mt-1">Level {rewards.level}</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">Eco-Guardian Sentinel</h3>
              <p className="text-xs text-slate-400 mt-1">Active Smart City Officer</p>
            </div>
          </div>

          <div className="w-full mt-6 space-y-2">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>XP: {rewards.xp} / {nextLevelXp}</span>
              <span>{xpProgressPct}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div className="bg-eco-500 h-1.5 rounded-full" style={{ width: `${xpProgressPct}%` }}></div>
            </div>
          </div>
        </div>

        {/* REWARDS STATS */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
            <Star className="w-4 h-4 text-orange-400" /> Account Rewards
          </h3>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Eco Tokens</span>
              <p className="text-3xl font-extrabold text-orange-400 mt-1 font-mono">{rewards.points}</p>
              <span className="text-[9px] text-slate-500">Redeemable Rewards</span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Badges Unlocked</span>
              <p className="text-3xl font-extrabold text-blue-400 mt-1 font-mono">{rewards.badges.length}</p>
              <span className="text-[9px] text-slate-500">ESG Certifications</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-white/5">
            🌳 **Eco Tip:** Fixing water leaks or planting urban tree cover registers immediate XP points on your account, unlocking premium ESG dashboard reports.
          </div>
        </div>

        {/* BADGES DRAWER */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
            <Award className="w-4 h-4 text-blue-400" /> Active Certifications
          </h3>

          <div className="grid grid-cols-3 gap-3 my-4">
            {/* Badge 1: Solar */}
            <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
              rewards.badges.includes('Solar Pioneer') 
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                : 'bg-slate-950/40 border-white/5 text-slate-600'
            }`}>
              <Zap className="w-8 h-8 mb-1" />
              <span className="text-[9px] font-bold">Solar Pioneer</span>
            </div>

            {/* Badge 2: Leak Detective */}
            <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
              rewards.badges.includes('Leak Detective') 
                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' 
                : 'bg-slate-950/40 border-white/5 text-slate-600'
            }`}>
              <Droplet className="w-8 h-8 mb-1" />
              <span className="text-[9px] font-bold">Leak Detective</span>
            </div>

            {/* Badge 3: Forest Ranger */}
            <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
              rewards.badges.includes('Forest Ranger') 
                ? 'bg-eco-500/10 border-eco-500/20 text-eco-400' 
                : 'bg-slate-950/40 border-white/5 text-slate-600'
            }`}>
              <Trees className="w-8 h-8 mb-1" />
              <span className="text-[9px] font-bold">Forest Ranger</span>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 text-center font-mono">
            Hover over a badge to verify verification ledger
          </div>
        </div>
      </div>

      {/* 2. LEADERBOARD AND QUESTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* QUEST LIST */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
            Active Community Challenges
          </h3>

          <div className="space-y-3">
            {quests.map(quest => {
              const isCompleted = rewards.badges.includes(quest.badge);
              return (
                <div 
                  key={quest.id}
                  className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex items-start justify-between gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-white/5">
                    {quest.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-white">{quest.title}</h4>
                      <span className="text-[10px] text-eco-400 font-bold bg-eco-500/10 px-2 py-0.5 rounded-full">
                        +{quest.xp} XP | +{quest.points} Tokens
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{quest.description}</p>
                    <span className="text-[9px] text-slate-500 font-mono block">Zone Target: {quest.sector}</span>
                  </div>

                  <button
                    disabled={loadingAction === quest.id || isCompleted}
                    onClick={() => handleQuestCompletion(quest.id, quest.sector)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-all ${
                      isCompleted 
                        ? 'bg-eco-500/10 border border-eco-500/20 text-eco-400 cursor-not-allowed'
                        : loadingAction === quest.id
                        ? 'bg-slate-900 border border-white/5 text-slate-500 animate-pulse'
                        : 'bg-slate-800 hover:bg-eco-500 hover:text-white text-slate-300 border border-white/10 hover:border-transparent cursor-pointer'
                    }`}
                  >
                    {isCompleted ? 'Quest Completed' : loadingAction === quest.id ? 'Dispatching...' : 'Accept Quest'}
                  </button>
                </div>
              );
            })}
          </div>

          {successMsg && (
            <div className="p-3 bg-eco-500/10 border border-eco-500/20 text-eco-400 rounded-lg text-xs text-center font-medium">
              {successMsg}
            </div>
          )}
        </div>

        {/* COMMUNITY LEADERBOARD */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
            <Trophy className="w-4 h-4 text-orange-400" /> Community Leaderboard
          </h3>

          <div className="divide-y divide-white/5 flex-grow my-4">
            {leaderboard.map(leader => (
              <div key={leader.rank} className="flex justify-between items-center py-2.5 text-xs">
                <div className="flex items-center gap-3">
                  <span className={`font-bold font-mono ${
                    leader.rank === 1 ? 'text-orange-400' :
                    leader.rank === 2 ? 'text-slate-400' :
                    leader.rank === 3 ? 'text-orange-500' : 'text-slate-500'
                  }`}>
                    #{leader.rank}
                  </span>
                  <div>
                    <h4 className="font-bold text-white">{leader.community}</h4>
                    <span className="text-[9px] text-slate-500 font-mono">{leader.badges} ESG badges</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-extrabold ${leader.color}`}>{leader.score}%</span>
                  <span className="text-[9px] text-slate-500 block">Sustainability</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[9.5px] text-slate-500 text-center font-mono uppercase tracking-widest border-t border-white/5 pt-3">
            Refreshes daily at 00:00 UTC
          </div>
        </div>

      </div>
    </div>
  );
}

