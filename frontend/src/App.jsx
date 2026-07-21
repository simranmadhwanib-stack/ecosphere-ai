import React, { useState, useEffect, useRef } from 'react';
import {
  Globe, LayoutDashboard, MessageSquare, Sliders, Cpu,
  Trophy, FileText, Award, Star, RefreshCw, MapPin, Search, Navigation, Loader2, ShieldCheck, Radar, Database
} from 'lucide-react';

import Overview from './components/Overview';
import GeminiAssistant from './components/GeminiAssistant';
import SimulationSuite from './components/SimulationSuite';
import RapidsBenchmark from './components/RapidsBenchmark';
import EcoGamification from './components/EcoGamification';
import AnalyticsModules from './components/AnalyticsModules';
import ReportGenerator from './components/ReportGenerator';
import EnterpriseOS from './components/EnterpriseOS';
import MapExperience from './components/MapExperience';
import ActiveDataset from './components/ActiveDataset';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? `http://${window.location.hostname}:5000/api` : '/api');

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [kpis, setKpis] = useState({
    sustainabilityScore: 78,
    totalEnergyUsageKwh: 6420,
    totalWaterUsageLiters: 8200,
    totalCarbonKg: 3500,
    carbonOffsetKg: 1240,
    solarGenerationKwh: 700,
    averageAQI: 64,
    totalTreeCoverSqm: 385000,
    activeAlerts: 2,
    ecoRewards: {
      xp: 1450,
      level: 4,
      points: 450,
      badges: ['Solar Pioneer', 'Leak Detective', 'Forest Ranger']
    }
  });

  const [connected, setConnected] = useState(false);
  const [polling, setPolling] = useState(false);
  const [activeLocationName, setActiveLocationName] = useState('Loading location...');
  const [activeLocation, setActiveLocation] = useState(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationNotice, setLocationNotice] = useState('');
  const [datasetCatalog, setDatasetCatalog] = useState([]);
  const autoLocationRequestedRef = useRef(false);

  const fetchGlobalState = async () => {
    setPolling(true);
    try {
      const res = await fetch(`${API_BASE}/kpis`);
      if (res.ok) {
        const data = await res.json();
        setKpis(data);
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch (e) {
      setConnected(false);
    } finally {
      setPolling(false);
    }
  };

  const fetchLocationInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/location`);
      if (res.ok) {
        const data = await res.json();
        setActiveLocationName(data.activeLocationName);
        setActiveLocation(data.location);
      }
    } catch (e) {
      console.error('Failed to load location parameters', e);
    }
  };

  const fetchDatasets = async () => {
    try {
      const res = await fetch(`${API_BASE}/datasets`);
      if (res.ok) {
        const data = await res.json();
        setDatasetCatalog(data.datasets || []);
      }
    } catch (e) {
      console.warn('Dataset catalog unavailable', e);
    }
  };

  const celebrateLocationChange = () => {
    if (window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#22bd6c', '#3b82f6', '#06b6d4']
      });
    }
  };

  const refreshAfterLocationChange = async () => {
    await fetchLocationInfo();
    await fetchGlobalState();
    celebrateLocationChange();
  };

  const submitDetectedLocation = async (latitude, longitude, cityName = '') => {
    setLocationLoading(true);
    setLocationError('');
    setLocationNotice('');
    try {
      const res = await fetch(`${API_BASE}/location/gps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude, cityName })
      });
      const data = await res.json();
      if (!res.ok) {
        setLocationError(data.error || 'Unable to calibrate this location.');
        return;
      }
      setLocationResults([]);
      setLocationQuery('');
      await refreshAfterLocationChange();
      setLocationNotice('Location updated using your device coordinates.');
    } catch (e) {
      setLocationError(`Connection failed: ${e.message}`);
    } finally {
      setLocationLoading(false);
    }
  };

  const tryBackendLocationFallback = async (fromAutoDetect = false) => {
    try {
      const res = await fetch(`${API_BASE}/location/auto`);
      if (!res.ok) {
        throw new Error('Auto location lookup failed');
      }
      const data = await res.json();
      if (data?.location) {
        setActiveLocationName(data.activeLocationName || data.location.name);
        setActiveLocation(data.location);
        setLocationError('');
        setLocationNotice(
          data.source === 'ip'
            ? 'Using an approximate network location. For precise results, allow browser location access.'
            : 'Using the default location. Search for your city or enable browser location access for a more accurate result.'
        );
        return true;
      }
    } catch (e) {
      console.warn('Backend auto location unavailable', e);
    }

    if (!fromAutoDetect) {
      setLocationError('Location could not be resolved automatically. Search for your city manually.');
    }
    return false;
  };

  const getLocationErrorMessage = (error) => {
    if (error?.code === 1) {
      return 'Location permission was denied. Allow location access for this site in your browser, then try again.';
    }
    if (error?.code === 2) {
      return 'Your device could not determine a location. Turn on system location services and check your network connection.';
    }
    if (error?.code === 3) {
      return 'Location detection timed out. Move to an area with better GPS or network coverage and try again.';
    }
    return error?.message || 'Your browser could not determine a location.';
  };

  const requestBrowserLocation = async (fromAutoDetect = false) => {
    setLocationError('');
    setLocationNotice('');
    setDetectingLocation(true);

    // Browser geolocation is only available on HTTPS pages (localhost is the
    // development exception). This is common when Vite is opened via a LAN IP.
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setDetectingLocation(false);
      const fallbackSucceeded = await tryBackendLocationFallback(fromAutoDetect);
      if (!fallbackSucceeded && !fromAutoDetect) {
        setLocationError('Location access requires HTTPS. Open the app at http://localhost:5173 on this computer, or serve it over HTTPS.');
      }
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const fallbackSucceeded = await tryBackendLocationFallback(fromAutoDetect);
      if (!fallbackSucceeded && !fromAutoDetect) {
        setLocationError('Geolocation is not supported by this browser. Search for your city manually.');
      }
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await submitDetectedLocation(position.coords.latitude, position.coords.longitude);
        setDetectingLocation(false);
      },
      async (error) => {
        setDetectingLocation(false);
        const fallbackSucceeded = await tryBackendLocationFallback(fromAutoDetect);
        if (!fallbackSucceeded) {
          setLocationError(`${getLocationErrorMessage(error)} Search for your city manually if the issue continues.`);
          setActiveLocationName('New Delhi, Delhi, India');
          setActiveLocation({ name: 'New Delhi', latitude: 28.6139, longitude: 77.2090, country: 'India', admin1: 'Delhi' });
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
  };

  const detectCurrentLocation = () => {
    requestBrowserLocation(false);
  };

  const handleLocationSearch = async (e) => {
    e.preventDefault();
    const query = locationQuery.trim();
    if (query.length < 2) {
      setLocationError('Enter at least 2 characters to search.');
      return;
    }

    setLocationLoading(true);
    setLocationError('');
    setLocationNotice('');
    setLocationResults([]);
    try {
      const res = await fetch(`${API_BASE}/location/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        setLocationError(data.error || 'No matching location found.');
        return;
      }
      setLocationResults(data.results || []);
    } catch (e) {
      setLocationError(`Location search failed: ${e.message}`);
    } finally {
      setLocationLoading(false);
    }
  };

  const selectLocation = async (location) => {
    setLocationLoading(true);
    setLocationError('');
    setLocationNotice('');
    try {
      const res = await fetch(`${API_BASE}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location)
      });
      const data = await res.json();
      if (!res.ok) {
        setLocationError(data.error || 'Unable to apply selected location.');
        return;
      }
      setLocationResults([]);
      setLocationQuery(location.displayName || location.name);
      await refreshAfterLocationChange();
      setLocationNotice('Location updated from your search selection.');
    } catch (e) {
      setLocationError(`Failed to change location: ${e.message}`);
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalState();
    fetchLocationInfo();
    fetchDatasets();

    if (!autoLocationRequestedRef.current) {
      autoLocationRequestedRef.current = true;
      requestBrowserLocation(true);
    }

    const interval = setInterval(fetchGlobalState, 6000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Dashboard Control', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'assistant', label: 'Gemini Assistant', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'analytics', label: 'Resource Modules', icon: <Globe className="w-4 h-4" /> },
    { id: 'data', label: 'Active Dataset', icon: <Database className="w-4 h-4" /> },
    { id: 'enterprise', label: 'Enterprise OS', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'map', label: 'Advanced Map', icon: <Radar className="w-4 h-4" /> },
    { id: 'simulator', label: 'Scenario Simulator', icon: <Sliders className="w-4 h-4" /> },
    { id: 'rapids', label: 'NVIDIA RAPIDS', icon: <Cpu className="w-4 h-4" /> },
    { id: 'gamification', label: 'Eco Rewards', icon: <Trophy className="w-4 h-4" /> },
    { id: 'reports', label: 'Report Generator', icon: <FileText className="w-4 h-4" /> }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-cyber-dark text-slate-200">
      <aside className="w-full lg:w-64 bg-slate-950/80 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between shrink-0 p-6 z-10 gap-6">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-eco-500/10 border border-eco-500/30 flex items-center justify-center text-eco-400 telemetry-dot">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-wide">EcoSphere AI</h1>
              <span className="text-[10px] font-mono text-eco-400 font-bold tracking-widest uppercase">Decision Hub</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-3 border ${
                  activeTab === tab.id
                    ? 'bg-eco-500/15 border-eco-500/30 text-white font-extrabold shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_15px_rgba(34,189,108,0.1)]'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/5 pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-white/10 text-slate-300 font-bold font-mono text-sm">
              EG
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1">
                Sentinel <Award className="w-3.5 h-3.5 text-eco-400" />
              </h4>
              <span className="text-[10px] text-slate-400">Level {kpis.ecoRewards?.level || 4} Eco-Guardian</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-eco-500' : 'bg-red-500 animate-pulse'}`}></span>
              <span>{connected ? 'Backend Live' : 'Backend Offline'}</span>
            </div>
            <button onClick={fetchGlobalState} disabled={polling} aria-label="Refresh KPIs">
              <RefreshCw className={`w-3.5 h-3.5 ${polling ? 'animate-spin' : 'hover:text-slate-300'}`} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
        <header className="grid grid-cols-1 xl:grid-cols-[minmax(220px,1fr)_minmax(420px,1.45fr)] gap-4 bg-slate-950/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="flex flex-col justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-white capitalize">{activeTab.replace('-', ' ')} Console</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-eco-400" />
                <span className="text-eco-400 font-bold">{activeLocationName}</span>
              </p>
              {activeLocation && (
                <div className="text-[10px] text-slate-500 font-mono mt-1 space-y-0.5">
                  <p>{Number(activeLocation.latitude).toFixed(4)}, {Number(activeLocation.longitude).toFixed(4)}</p>
                  {activeLocation.weather && (
                    <p className="text-cyan-300">
                      Live weather: {activeLocation.weather.temperatureC}°C · {activeLocation.weather.humidityPct}% humidity · {activeLocation.weather.windSpeedKph} km/h wind
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs bg-slate-900/60 p-2 rounded-xl border border-white/5 font-mono w-fit">
              <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-orange-400" /> {kpis.ecoRewards?.points || 0} Tokens</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Canopy: {(kpis.totalTreeCoverSqm / 1000).toFixed(1)}k sqm</span>
            </div>
          </div>

          <section className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-eco-400" /> Choose Your Location
                </h3>
                <p className="text-[11px] text-slate-400">Detect your position or search any city, state, or country.</p>
              </div>
              <button
                type="button"
                onClick={detectCurrentLocation}
                disabled={detectingLocation || locationLoading}
                className="px-3 py-2 bg-eco-500/15 hover:bg-eco-500 border border-eco-500/30 text-eco-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {detectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                Detect Current Location
              </button>
            </div>

            <form onSubmit={handleLocationSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-eco-500"
                  placeholder="Search city, state, or country..."
                />
              </div>
              <button
                type="submit"
                disabled={locationLoading}
                className="px-4 py-2 bg-blue-500/15 hover:bg-blue-500 border border-blue-500/30 text-blue-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {locationLoading && !detectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </form>

            {locationError && (
              <div className="text-[11px] bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg px-3 py-2">
                {locationError}
              </div>
            )}
            {locationNotice && (
              <div className="text-[11px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 rounded-lg px-3 py-2">
                {locationNotice}
              </div>
            )}

            {locationResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {locationResults.map(result => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => selectLocation(result)}
                    className="text-left bg-slate-950/60 hover:bg-slate-800 border border-white/5 hover:border-eco-500/30 rounded-lg p-3 transition-all"
                  >
                    <span className="block text-xs font-bold text-white">{result.displayName || result.name}</span>
                    <span className="block text-[10px] text-slate-500 font-mono mt-1">
                      {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" /> Live Dataset Catalog
                </h3>
                <p className="text-[11px] text-slate-400">Synthetic demo datasets are loaded and visible to the operating system.</p>
              </div>
              <span className="text-[10px] font-mono text-cyan-300">{datasetCatalog.length} datasets ready</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
              {datasetCatalog.slice(0, 8).map((dataset) => (
                <div key={dataset.file} className="rounded-lg border border-white/5 bg-slate-950/50 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{dataset.name}</span>
                    <span className="text-[10px] text-cyan-300 font-mono">{dataset.records?.toLocaleString()} rows</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{dataset.summary}</p>
                  {dataset.preview?.length > 0 ? (
                    <ul className="space-y-1 text-[10px] text-slate-500">
                      {dataset.preview.slice(0, 2).map((row, index) => (
                        <li key={`${dataset.file}-${index}`} className="truncate">
                          • {Object.entries(row).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(' • ')}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-slate-500">Preview samples are prepared for this dataset.</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </header>

        <div className="transition-all duration-300">
          {activeTab === 'overview' && (
            <Overview
              apiBase={API_BASE}
              kpis={kpis}
              setKpis={setKpis}
              fetchGlobalState={fetchGlobalState}
              activeLocationName={activeLocationName}
              activeLocation={activeLocation}
            />
          )}
          {activeTab === 'assistant' && <GeminiAssistant apiBase={API_BASE} />}
          {activeTab === 'analytics' && <AnalyticsModules apiBase={API_BASE} activeLocationName={activeLocationName} />}
          {activeTab === 'data' && <ActiveDataset apiBase={API_BASE} activeLocationName={activeLocationName} />}
          {activeTab === 'enterprise' && <EnterpriseOS apiBase={API_BASE} />}
          {activeTab === 'map' && <MapExperience apiBase={API_BASE} activeLocationName={activeLocationName} />}
          {activeTab === 'simulator' && <SimulationSuite apiBase={API_BASE} activeLocationName={activeLocationName} activeLocation={activeLocation} />}
          {activeTab === 'rapids' && <RapidsBenchmark apiBase={API_BASE} />}
          {activeTab === 'gamification' && (
            <EcoGamification apiBase={API_BASE} kpis={kpis} fetchGlobalState={fetchGlobalState} />
          )}
          {activeTab === 'reports' && <ReportGenerator apiBase={API_BASE} kpis={kpis} fetchGlobalState={fetchGlobalState} />}
        </div>
      </main>
    </div>
  );
}
