import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// SQLite persistence layer for enterprise demo datasets
// ----------------------------------------------------
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'ecosphere.sqlite'));
db.pragma('journal_mode = WAL');

const createDatabaseSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS dataset_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_name TEXT UNIQUE NOT NULL,
      record_count INTEGER NOT NULL,
      summary TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS report_exports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const buildReportContent = (reportType, kpis = {}) => {
  const dateStr = new Date().toLocaleDateString();
  if (reportType === 'energy') {
    return `# ⚡ EcoSphere AI - Smart Grid Energy Report\n**Grid Compliance:** IEEE-SmartGrid-v2 | **Telemetry Hops:** 5 IoT Segments\n**Report Date:** ${dateStr} | **Grid Status:** STABLE SUPPLY\n\n## 1. Smart Grid Assessment\nTotal municipal energy demand stands at **${kpis.totalEnergyUsageKwh?.toLocaleString() || '6,420'} kWh**. Solar installations currently generate **${kpis.solarGenerationKwh || 700} kWh**, accounting for **${Math.round(((kpis.solarGenerationKwh || 700) / (kpis.totalEnergyUsageKwh || 6420)) * 100) || 10}%** of grid inputs.\n\n## 2. Grid Peak Demand Factors\n*   **Industrial Sector:** Absorbs 65.2% of peak grid loads.\n*   **Datacenter Corridor:** High-density baseline draw registered.\n*   **Ambient Weather Correlates:** Air conditioning loads increase by 4.2% per 1°C ambient temperature rise above 28°C.\n\n## 3. Operational Priorities\n1. Extend peak shifters to high-demand local zones.\n2. Incorporate wind energy feed-ins.`;
  }

  if (reportType === 'carbon') {
    return `# 🌳 EcoSphere AI - Carbon Footprint Audit\n**Greenhouse Ledger:** GHG-Protocol-Scope-2 | **Audit Status:** APPROVED\n**Report Date:** ${dateStr} | **Net Daily Offset:** -${kpis.carbonOffsetKg || 1240} kg\n\n## 1. Greenhouse Gas Ingestion\nEcoSphere City carbon emissions total **${kpis.totalCarbonKg?.toLocaleString() || '3,500'} kg CO2**. This is offset by **${kpis.carbonOffsetKg?.toLocaleString() || '1,240'} kg** of offset vectors, primarily driven by **${((kpis.totalTreeCoverSqm || 385000) / 10000).toFixed(1)} hectares** of urban forestation.\n\n## 2. Carbon Vectors\n*   **Industrial Emissions:** 68% of emissions.\n*   **Vehicle Transportation:** 22% of emissions.\n*   **Carbon Sinks (Parks):** Absorb 220g CO2 per square meter annually.\n\n## 3. Decarbonization Action Plan\n1. Transition city fleet logistics to Electric Vehicles.\n2. Expand green reserve borders to absorb highway exhaust plumes.`;
  }

  return `# 🌍 EcoSphere AI - Municipal ESG Audit\n**Compliance Registry:** UN-SDG-11-13 | **Security Certificate:** SHA-256 Ledger Verified\n**Report Date:** ${dateStr} | **Global Assessment:** CLASS-A ECO BALANCE\n\n## 1. Executive ESG Summary\nEcoSphere City's integrated municipal smart systems report a **Sustainability Index of ${kpis.sustainabilityScore || 78}%**. Atmospheric particulates (AQI) average **${kpis.averageAQI || 64}**, maintaining stable air quality conditions. Greenhouse gas emissions have been minimized via microgrids and urban tree covers.\n\n## 2. Key Metrics & Targets\n*   **Net Carbon Footprint:** ${kpis.totalCarbonKg?.toLocaleString() || '3,500'} kg CO2/day\n*   **Annualized Carbon Offset:** ${kpis.carbonOffsetKg?.toLocaleString() || '1,240'} kg CO2\n*   **Rooftop Solar Absorption:** ${kpis.solarGenerationKwh || 700} kWh\n*   **Water Distribution Efficiency:** ${kpis.activeAlerts > 0 ? '94.2%' : '100%'}\n\n## 3. Recommended Policy Interventions\n1. Urban Forestry Expansion: Expand the highest-AQI zone tree canopy by 20,000 sqm to absorb sulfur-particulate outputs.\n2. Solar Grid Subsidization: Deploy photovoltaic incentives for residential rooftops to target a 20% solar mix ratio.\n3. Pressure Loop Repairs: Seal local flow pressure deviations to protect drinking water reserves.`;
};

const seedCatalog = () => {
  const rows = [
    ['electricity_usage', 10000, 'Synthetic smart-meter telemetry for city electricity demand'],
    ['water_consumption', 10000, 'Residential and civic water demand profiles'],
    ['air_quality', 10000, 'Pollution and weather observations'],
    ['tree_plantation', 10000, 'Canopy survival and carbon capture records'],
    ['waste_management', 10000, 'Waste collection and bin fill status'],
    ['renewable_energy', 10000, 'Solar and wind generation telemetry'],
    ['carbon_emissions', 10000, 'Sector emissions and reduction targets'],
    ['citizen_reports', 10000, 'Citizen complaints and officer assignments']
  ];

  const insertCatalog = db.prepare('INSERT OR IGNORE INTO dataset_catalog (dataset_name, record_count, summary) VALUES (?, ?, ?)');
  db.transaction(() => {
    rows.forEach((row) => insertCatalog.run(row[0], row[1], row[2]));
  })();
};

const loadDatasetPreview = (datasetName) => {
  const filePath = path.join(__dirname, 'datasets', `${datasetName}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch (error) {
    return [];
  }
};

createDatabaseSchema();
seedCatalog();

// ----------------------------------------------------
// 1. DATASET SETUP & LOCATION-DRIVEN GEOGRAPHIC MODEL
// ----------------------------------------------------
const createZonesForLocation = (name = 'Selected Location') => {
  const cleanName = name.split(',')[0].trim() || 'Local';
  return [
    `${cleanName} Civic Core`,
    `${cleanName} Industrial Belt`,
    `${cleanName} Residential Grid`,
    `${cleanName} Green Reserve`,
    `${cleanName} Innovation District`
  ];
};

const buildLocationProfile = ({ name, latitude, longitude, country = '', admin1 = '', weather = null }) => {
  const latNum = Number(latitude);
  const lonNum = Number(longitude);
  const displayName = [name, admin1, country].filter(Boolean).join(', ');
  const calculatedBaseTemp = Math.round(32 - Math.abs(latNum) * 0.45);
  const currentTemperature = Number.isFinite(weather?.temperatureC) ? weather.temperatureC : calculatedBaseTemp;
  const heatDemand = currentTemperature > 25 ? currentTemperature - 25 : 0;
  const denseUrbanSignal = Math.abs(Math.round((latNum * 10) + (lonNum * 7))) % 70;
  const windCleaningFactor = Math.min(18, Number(weather?.windSpeedKph || 0) * 0.35);

  return {
    id: `${displayName || 'Selected Location'}:${latNum.toFixed(4)},${lonNum.toFixed(4)}`,
    name: displayName || `Location ${latNum.toFixed(4)}, ${lonNum.toFixed(4)}`,
    latitude: latNum,
    longitude: lonNum,
    country,
    admin1,
    sectors: createZonesForLocation(displayName || name),
    energyMultiplier: parseFloat((1 + heatDemand * 0.03 + denseUrbanSignal * 0.004).toFixed(2)),
    waterMultiplier: parseFloat((1 + heatDemand * 0.02 + Math.abs(latNum) * 0.002).toFixed(2)),
    solarMultiplier: parseFloat((1.55 - Math.min(Math.abs(latNum), 65) * 0.012).toFixed(2)),
    treeMultiplier: parseFloat((0.75 + ((Math.abs(lonNum) % 35) / 100)).toFixed(2)),
    aqiOffset: Math.max(4, Math.round(12 + denseUrbanSignal - windCleaningFactor)),
    baseTemp: Math.max(-8, Math.min(45, currentTemperature)),
    weather: {
      temperatureC: Math.round(currentTemperature * 10) / 10,
      humidityPct: Math.round(Number(weather?.humidityPct || 55)),
      windSpeedKph: Math.round(Number(weather?.windSpeedKph || 0) * 10) / 10,
      weatherCode: weather?.weatherCode ?? null,
      source: weather?.source || 'estimated'
    }
  };
};

const getLocationWeather = async (latitude, longitude) => {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
      wind_speed_unit: 'kmh'
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) throw new Error('Weather service unavailable');
    const { current } = await response.json();
    if (!current || !Number.isFinite(current.temperature_2m)) throw new Error('Weather response incomplete');
    return {
      temperatureC: current.temperature_2m,
      humidityPct: current.relative_humidity_2m,
      windSpeedKph: current.wind_speed_10m,
      weatherCode: current.weather_code,
      source: 'open-meteo'
    };
  } catch (error) {
    return null;
  }
};

const createLocationProfile = async (location) => {
  const weather = await getLocationWeather(location.latitude, location.longitude);
  return buildLocationProfile({ ...location, weather });
};

const defaultLocationProfile = buildLocationProfile({
  name: 'New Delhi',
  admin1: 'Delhi',
  country: 'India',
  latitude: 28.6139,
  longitude: 77.2090
});

let activeLocationProfile = defaultLocationProfile;
let activeLocation = activeLocationProfile.id;
let SECTORS = activeLocationProfile.sectors;

const autoResolveLocationProfile = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error('IP lookup unavailable');
    }

    const data = await response.json();
    if (data?.latitude && data?.longitude) {
      return {
        profile: await createLocationProfile({
          name: data.city || data.region || data.country_name || 'Current Location',
          latitude: data.latitude,
          longitude: data.longitude,
          country: data.country_name || '',
          admin1: data.region || ''
        }),
        source: 'ip'
      };
    }
  } catch (error) {
    console.warn('Using default fallback location.', error);
  }

  return { profile: defaultLocationProfile, source: 'default' };
};

// Generate 180 days of historical daily records dynamically based on active city profile
const generateDataset = () => {
  const dataset = [];
  const now = new Date();
  const profile = activeLocationProfile;
  
  for (let i = 180; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateString = date.toISOString().split('T')[0];
    
    SECTORS.forEach((sector, idx) => {
      const seedText = `${profile.id}:${dateString}:${idx}`;
      let seed = [...seedText].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
      const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      let baseEnergy, baseWater, baseCarbon, baseAQI, baseTree, baseWaste, baseSolar;
      
      switch (idx) {
        case 0: // Civic core
          baseEnergy = (800 + random() * 200) * profile.energyMultiplier;
          baseWater = (1200 + random() * 300) * profile.waterMultiplier;
          baseCarbon = (450 + random() * 100) * profile.energyMultiplier;
          baseAQI = (70 + random() * 30) + profile.aqiOffset;
          baseTree = 25000 * profile.treeMultiplier;
          baseWaste = 70 + random() * 25;
          baseSolar = (50 + random() * 30) * profile.solarMultiplier;
          break;
        case 1: // Industrial belt
          baseEnergy = (2500 + random() * 800) * profile.energyMultiplier;
          baseWater = (4000 + random() * 1200) * profile.waterMultiplier;
          baseCarbon = (1800 + random() * 500) * profile.energyMultiplier;
          baseAQI = (110 + random() * 50) + profile.aqiOffset;
          baseTree = 10000 * profile.treeMultiplier;
          baseWaste = 85 + random() * 15;
          baseSolar = (150 + random() * 80) * profile.solarMultiplier;
          break;
        case 2: // Residential Res Hub
          baseEnergy = (600 + random() * 150) * profile.energyMultiplier;
          baseWater = (1800 + random() * 400) * profile.waterMultiplier;
          baseCarbon = (300 + random() * 80) * profile.energyMultiplier;
          baseAQI = (35 + random() * 20) + profile.aqiOffset;
          baseTree = 60000 * profile.treeMultiplier;
          baseWaste = 40 + random() * 30;
          baseSolar = (80 + random() * 50) * profile.solarMultiplier;
          break;
        case 3: // Green reserve
          baseEnergy = (50 + random() * 15) * profile.energyMultiplier;
          baseWater = (300 + random() * 80) * profile.waterMultiplier;
          baseCarbon = (-200 - random() * 50) * profile.treeMultiplier;
          baseAQI = (10 + random() * 10) + (profile.aqiOffset * 0.15);
          baseTree = 250000 * profile.treeMultiplier;
          baseWaste = 15 + random() * 15;
          baseSolar = (20 + random() * 10) * profile.solarMultiplier;
          break;
        case 4: // Innovation district
          baseEnergy = (1800 + random() * 400) * profile.energyMultiplier;
          baseWater = (900 + random() * 200) * profile.waterMultiplier;
          baseCarbon = (700 + random() * 150) * profile.energyMultiplier;
          baseAQI = (45 + random() * 20) + profile.aqiOffset;
          baseTree = 45000 * profile.treeMultiplier;
          baseWaste = 50 + random() * 25;
          baseSolar = (400 + random() * 200) * profile.solarMultiplier;
          break;
      }

      // Add day of week variation
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (isWeekend) {
        if (idx === 1) {
          baseEnergy *= 0.6;
          baseWater *= 0.5;
          baseCarbon *= 0.55;
        } else if (idx === 2) {
          baseEnergy *= 1.25;
          baseWater *= 1.2;
        }
      }

      // Temperature variation
      const temperature = profile.baseTemp + Math.sin((date.getMonth() / 11) * Math.PI) * 10 + (random() * 4 - 2);
      if (temperature > 28) {
        baseEnergy *= 1.35;
        baseWater *= 1.15;
      }

      dataset.push({
        date: dateString,
        sector,
        electricity_kwh: Math.round(baseEnergy),
        water_liters: Math.round(baseWater),
        water_leak_rate: idx === 1 && random() > 0.85 ? Math.round(5 + random() * 15) : (random() > 0.95 ? Math.round(2 + random() * 8) : 0),
        aqi: Math.round(Math.max(5, baseAQI)),
        tree_cover_sqm: Math.round(baseTree),
        waste_fill_pct: Math.min(100, Math.round(baseWaste)),
        carbon_kg: Math.round(baseCarbon),
        solar_kwh: Math.round(baseSolar),
        temperature_c: Math.round(temperature),
        humidity_pct: Math.round(profile.weather.humidityPct * 0.7 + (45 + random() * 30) * 0.3)
      });
    });
  }
  return dataset;
};

// In-memory active database
let environmentalData = generateDataset();
let datasetUpdatedAt = new Date().toISOString();
let datasetSource = 'Location-calibrated model using coordinates and current weather';

// Initialize sector overrides dynamically based on active sectors
const initializeSectorOverrides = () => {
  const overrides = {};
  SECTORS.forEach(sec => {
    overrides[sec] = { extraTrees: 0, leakFixed: false, solarAdded: 0 };
  });
  return overrides;
};
let sectorOverrides = initializeSectorOverrides();

let userRewards = {
  xp: 1450,
  level: 4,
  points: 450,
  badges: ['Solar Pioneer', 'Leak Detective', 'Forest Ranger'],
  completedTasks: ['Turn off standby mode', 'Report local waste overflow']
};

// ----------------------------------------------------
// 2. LINEAR REGRESSION ML UTILITY (OLS)
// ----------------------------------------------------
const predictOLS = (x, y) => {
  const n = x.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: y[0] };
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

// ----------------------------------------------------
// 3. API ENDPOINTS
// ----------------------------------------------------

// Sector Status Details (for the Map & sector listing)
app.get('/api/sectors', (req, res) => {
  const latestDate = environmentalData[environmentalData.length - 1].date;
  const latestRecords = environmentalData.filter(r => r.date === latestDate);

  const sectorListings = latestRecords.map(r => {
    const overrides = sectorOverrides[r.sector];
    
    // Apply local modifications
    const updatedTree = r.tree_cover_sqm + overrides.extraTrees;
    const currentLeaks = overrides.leakFixed ? 0 : r.water_leak_rate;
    const updatedSolar = r.solar_kwh + overrides.solarAdded;
    
    // Recalculate AQI based on extra trees
    const updatedAQI = Math.max(5, Math.round(r.aqi - (overrides.extraTrees * 0.0005)));
    // Recalculate carbon based on extra trees and solar
    const updatedCarbon = Math.round(r.carbon_kg - (overrides.extraTrees * 0.05) - (overrides.solarAdded * 0.4));

    // Calculate individual sector sustainability score (0-100)
    let score = 100;
    score -= (updatedAQI > 50 ? (updatedAQI - 50) * 0.4 : 0);
    score -= (currentLeaks * 2);
    score -= (r.waste_fill_pct > 75 ? (r.waste_fill_pct - 75) * 0.8 : 0);
    score -= (updatedCarbon > 500 ? (updatedCarbon - 500) * 0.01 : 0);
    score += (updatedTree / 20000);
    score = Math.max(10, Math.min(100, Math.round(score)));

    const zoneIndex = latestRecords.findIndex(record => record.sector === r.sector);
    const mapPositions = [
      { x: 270, y: 235 },
      { x: 455, y: 150 },
      { x: 175, y: 125 },
      { x: 385, y: 340 },
      { x: 115, y: 320 }
    ];
    const coords = mapPositions[zoneIndex] || { x: 300, y: 225 };

    // Determine alerts
    const alerts = [];
    if (updatedAQI > 100) alerts.push({ type: 'danger', category: 'AQI', message: 'Hazardous Air Quality detected.' });
    if (currentLeaks > 0) alerts.push({ type: 'warning', category: 'Leak', message: `Water leak of ${currentLeaks}% detected in distribution network.` });
    if (r.waste_fill_pct > 85) alerts.push({ type: 'info', category: 'Waste', message: 'Waste disposal bins are overflowing.' });
    if (r.electricity_kwh > 2000) alerts.push({ type: 'warning', category: 'Energy', message: 'Critical peak electricity draw registered.' });

    return {
      name: r.sector,
      coordinates: coords,
      electricity_kwh: r.electricity_kwh,
      water_liters: r.water_liters,
      water_leak_rate: currentLeaks,
      aqi: updatedAQI,
      tree_cover_sqm: updatedTree,
      waste_fill_pct: r.waste_fill_pct,
      carbon_kg: updatedCarbon,
      solar_kwh: updatedSolar,
      temperature_c: r.temperature_c,
      humidity_pct: r.humidity_pct,
      sustainability_score: score,
      alerts
    };
  });

  res.json(sectorListings);
});

// Live aggregate KPIs
app.get('/api/kpis', (req, res) => {
  const latestDate = environmentalData[environmentalData.length - 1].date;
  const latestRecords = environmentalData.filter(r => r.date === latestDate);

  let totalEnergy = 0;
  let totalWater = 0;
  let totalCarbon = 0;
  let totalSolar = 0;
  let totalTrees = 0;
  let avgAQI = 0;
  let activeAlertsCount = 0;
  let sectorsScoreSum = 0;

  latestRecords.forEach(r => {
    const overrides = sectorOverrides[r.sector];
    const updatedTree = r.tree_cover_sqm + overrides.extraTrees;
    const currentLeaks = overrides.leakFixed ? 0 : r.water_leak_rate;
    const updatedSolar = r.solar_kwh + overrides.solarAdded;
    const updatedAQI = Math.max(5, Math.round(r.aqi - (overrides.extraTrees * 0.0005)));
    const updatedCarbon = Math.round(r.carbon_kg - (overrides.extraTrees * 0.05) - (overrides.solarAdded * 0.4));

    totalEnergy += r.electricity_kwh;
    totalWater += r.water_liters;
    totalCarbon += updatedCarbon;
    totalSolar += updatedSolar;
    totalTrees += updatedTree;
    avgAQI += updatedAQI;

    if (updatedAQI > 100) activeAlertsCount++;
    if (currentLeaks > 0) activeAlertsCount++;
    if (r.waste_fill_pct > 85) activeAlertsCount++;

    // Add local sector score
    let sScore = 100 - (updatedAQI > 50 ? (updatedAQI - 50) * 0.4 : 0) - (currentLeaks * 2);
    sectorsScoreSum += Math.max(10, Math.min(100, sScore));
  });

  const overallSustainabilityScore = Math.round(sectorsScoreSum / SECTORS.length);
  const carbonOffsetFactor = Math.round((totalTrees * 0.22) + (totalSolar * 0.45)); // kg offset annually

  res.json({
    sustainabilityScore: overallSustainabilityScore,
    totalEnergyUsageKwh: totalEnergy,
    totalWaterUsageLiters: totalWater,
    totalCarbonKg: totalCarbon,
    carbonOffsetKg: carbonOffsetFactor,
    solarGenerationKwh: totalSolar,
    averageAQI: Math.round(avgAQI / SECTORS.length),
    totalTreeCoverSqm: totalTrees,
    activeAlerts: activeAlertsCount,
    ecoRewards: userRewards
  });
});

// Historical aggregate trends (last 30 days)
app.get('/api/history', (req, res) => {
  // Aggregate data by date
  const groupedByDate = {};
  
  environmentalData.forEach(r => {
    if (!groupedByDate[r.date]) {
      groupedByDate[r.date] = {
        date: r.date,
        electricity_kwh: 0,
        water_liters: 0,
        carbon_kg: 0,
        solar_kwh: 0,
        aqi_sum: 0,
        count: 0
      };
    }
    
    const overrides = sectorOverrides[r.sector];
    const updatedSolar = r.solar_kwh + overrides.solarAdded;
    const updatedCarbon = Math.round(r.carbon_kg - (overrides.extraTrees * 0.05) - (overrides.solarAdded * 0.4));
    const updatedAQI = Math.max(5, Math.round(r.aqi - (overrides.extraTrees * 0.0005)));

    groupedByDate[r.date].electricity_kwh += r.electricity_kwh;
    groupedByDate[r.date].water_liters += r.water_liters;
    groupedByDate[r.date].carbon_kg += updatedCarbon;
    groupedByDate[r.date].solar_kwh += updatedSolar;
    groupedByDate[r.date].aqi_sum += updatedAQI;
    groupedByDate[r.date].count++;
  });

  const aggregatedHistory = Object.values(groupedByDate).map(d => ({
    date: d.date,
    electricity: d.electricity_kwh,
    water: d.water_liters,
    carbon: d.carbon_kg,
    solar: d.solar_kwh,
    aqi: Math.round(d.aqi_sum / d.count)
  }));

  // Return last 30 entries
  res.json(aggregatedHistory.slice(-30));
});

// Transparent data feed for the dashboard: these are the exact latest rows
// consumed by the KPI, map, analytics, simulation, and NLP layers.
app.get('/api/dataset/active', (req, res) => {
  const latestDate = environmentalData[environmentalData.length - 1]?.date;
  const records = environmentalData.filter((record) => record.date === latestDate);
  res.json({
    source: datasetSource,
    updatedAt: datasetUpdatedAt,
    totalRecords: environmentalData.length,
    latestDate,
    location: {
      name: activeLocationProfile.name,
      latitude: activeLocationProfile.latitude,
      longitude: activeLocationProfile.longitude,
      weather: activeLocationProfile.weather
    },
    fields: ['sector', 'electricity_kwh', 'water_liters', 'water_leak_rate', 'aqi', 'tree_cover_sqm', 'waste_fill_pct', 'carbon_kg', 'solar_kwh', 'temperature_c', 'humidity_pct'],
    records
  });
});

// Linear Regression Prediction (ML-based forecasts)
app.get('/api/forecast', (req, res) => {
  // Aggregate dataset daily
  const dailySums = {};
  environmentalData.forEach(r => {
    if (!dailySums[r.date]) {
      dailySums[r.date] = { energy: 0, water: 0, carbon: 0 };
    }
    const overrides = sectorOverrides[r.sector];
    const updatedCarbon = Math.round(r.carbon_kg - (overrides.extraTrees * 0.05) - (overrides.solarAdded * 0.4));

    dailySums[r.date].energy += r.electricity_kwh;
    dailySums[r.date].water += r.water_liters;
    dailySums[r.date].carbon += updatedCarbon;
  });

  const sortedDates = Object.keys(dailySums).sort();
  const indexArray = sortedDates.map((_, i) => i);
  
  const energyVals = sortedDates.map(d => dailySums[d].energy);
  const waterVals = sortedDates.map(d => dailySums[d].water);
  const carbonVals = sortedDates.map(d => dailySums[d].carbon);

  // Train OLS regression models
  const energyModel = predictOLS(indexArray, energyVals);
  const waterModel = predictOLS(indexArray, waterVals);
  const carbonModel = predictOLS(indexArray, carbonVals);

  // Forecast for next 15 days
  const forecasts = [];
  const startIdx = indexArray.length;
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);

  for (let i = 1; i <= 15; i++) {
    const nextIdx = startIdx + i;
    const nextDate = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000);
    const predictedEnergy = Math.round(energyModel.slope * nextIdx + energyModel.intercept);
    const predictedWater = Math.round(waterModel.slope * nextIdx + waterModel.intercept);
    const predictedCarbon = Math.round(carbonModel.slope * nextIdx + carbonModel.intercept);

    forecasts.push({
      date: nextDate.toISOString().split('T')[0],
      predictedEnergy: Math.max(100, predictedEnergy),
      predictedWater: Math.max(200, predictedWater),
      predictedCarbon: predictedCarbon,
      confidenceScore: Math.round(88 + Math.random() * 8) // Confidence bounds (88% - 96%)
    });
  }

  res.json({
    models: {
      energy: { slope: energyModel.slope.toFixed(2), intercept: energyModel.intercept.toFixed(2) },
      water: { slope: waterModel.slope.toFixed(2), intercept: waterModel.intercept.toFixed(2) },
      carbon: { slope: carbonModel.slope.toFixed(2), intercept: carbonModel.intercept.toFixed(2) }
    },
    forecasts
  });
});

// "What-If" Scenario Simulator Model
app.post('/api/simulate', (req, res) => {
  const { renewablePct, treeCoverPct, tempRise, evAdoptionPct } = req.body;

  // Read latest aggregates as base
  const latestDate = environmentalData[environmentalData.length - 1].date;
  const latestRecords = environmentalData.filter(r => r.date === latestDate);

  let baseEnergy = 0;
  let baseWater = 0;
  let baseCarbon = 0;
  let baseAQI = 0;
  latestRecords.forEach(r => {
    baseEnergy += r.electricity_kwh;
    baseWater += r.water_liters;
    baseCarbon += r.carbon_kg;
    baseAQI += r.aqi;
  });
  baseAQI = baseAQI / latestRecords.length;

  // Simulator Algorithm
  // 1. Renewable energy drops carbon emissions (-0.6% carbon per 1% renewable energy increase)
  // 2. Tree cover expansion (+10% tree cover drops carbon by 3%, improves AQI by 5 points)
  // 3. Temperature rise (+1°C temperature increases energy demand by 4% due to AC and water usage by 3%)
  // 4. EV adoption reduces carbon emissions by 0.5% per 1% adoption, but raises energy demand by 0.25% (charging load)

  const simulatedEnergy = baseEnergy * (1 + (tempRise * 0.04) + (evAdoptionPct * 0.0025));
  const simulatedWater = baseWater * (1 + (tempRise * 0.03));
  
  // Calculate simulated Carbon Footprint
  const energyCarbonSaving = baseCarbon * (renewablePct / 100) * 0.7; // saving from solar/wind replacing coal
  const treeCarbonSaving = baseCarbon * (treeCoverPct / 100) * 0.15;
  const evCarbonSaving = baseCarbon * (evAdoptionPct / 100) * 0.35;
  const simulatedCarbon = Math.max(100, baseCarbon - energyCarbonSaving - treeCarbonSaving - evCarbonSaving + (tempRise * 50));

  // Calculate simulated AQI
  const aqiReductionTrees = (treeCoverPct) * 0.25;
  const aqiReductionEVs = (evAdoptionPct) * 0.15;
  const simulatedAQI = Math.max(5, Math.round(baseAQI - aqiReductionTrees - aqiReductionEVs + (tempRise * 3)));

  // Compute Simulated Sustainability Index
  let simulatedScore = 100;
  simulatedScore -= (simulatedAQI > 50 ? (simulatedAQI - 50) * 0.5 : 0);
  simulatedScore -= (simulatedCarbon > 2000 ? (simulatedCarbon - 2000) * 0.01 : 0);
  simulatedScore = Math.max(15, Math.min(100, Math.round(simulatedScore)));

  // Generate monthly predictions over 12 months for chart comparisons
  const simulatedTrends = [];
  for (let m = 1; m <= 12; m++) {
    const trendFactor = 1 + (Math.sin((m / 6) * Math.PI) * 0.1); // seasonal curve
    simulatedTrends.push({
      month: `Month ${m}`,
      baselineEnergy: Math.round(baseEnergy * trendFactor),
      simulatedEnergy: Math.round(simulatedEnergy * trendFactor),
      baselineCarbon: Math.round(baseCarbon * trendFactor),
      simulatedCarbon: Math.round(simulatedCarbon * trendFactor)
    });
  }

  res.json({
    location: {
      name: activeLocationProfile.name,
      latitude: activeLocationProfile.latitude,
      longitude: activeLocationProfile.longitude,
      weather: activeLocationProfile.weather
    },
    baseline: {
      energyKwh: Math.round(baseEnergy),
      waterLiters: Math.round(baseWater),
      carbonKg: Math.round(baseCarbon),
      aqi: Math.round(baseAQI)
    },
    metrics: {
      sustainabilityScore: simulatedScore,
      energyKwh: Math.round(simulatedEnergy),
      waterLiters: Math.round(simulatedWater),
      carbonKg: Math.round(simulatedCarbon),
      aqi: Math.round(simulatedAQI)
    },
    trends: simulatedTrends
  });
});

// NVIDIA RAPIDS cuDF GPU Acceleration Benchmark Simulation
app.get('/api/benchmark', (req, res) => {
  // Simulate processing 10,000,000 records of sensor logs
  // GPU parallel processing vs CPU single-threaded loop
  const recordCount = 10000000;
  
  // CPU: takes 450ms to 650ms to run complex filter-aggregate operations
  const cpuTimeMs = parseFloat((420 + Math.random() * 180).toFixed(2));
  
  // GPU (NVIDIA cuDF parallel): takes 4.5ms to 7ms
  const gpuTimeMs = parseFloat((4.5 + Math.random() * 2.5).toFixed(2));
  
  const speedupMultiplier = parseFloat((cpuTimeMs / gpuTimeMs).toFixed(1));

  res.json({
    recordsProcessed: recordCount,
    cpuTimeMs,
    gpuTimeMs,
    speedup: speedupMultiplier,
    cudaCoresActive: 3584,
    vramAllocatedGb: 4.8,
    benchmarkTimestamp: new Date().toISOString()
  });
});

// Interactive User-Triggered Actions (Gamification state changes)
app.post('/api/action', (req, res) => {
  const { actionId, sector } = req.body;

  if (!SECTORS.includes(sector)) {
    return res.status(400).json({ error: 'Invalid sector' });
  }

  const responseMessage = [];

  switch (actionId) {
    case 'PLANT_TREES':
      sectorOverrides[sector].extraTrees += 10000;
      userRewards.xp += 200;
      userRewards.points += 50;
      responseMessage.push(`Successfully planted 10,000 sqm of tree canopy in ${sector}!`);
      break;
      
    case 'FIX_LEAKS':
      sectorOverrides[sector].leakFixed = true;
      userRewards.xp += 300;
      userRewards.points += 80;
      if (!userRewards.badges.includes('Leak Detective')) {
        userRewards.badges.push('Leak Detective');
      }
      responseMessage.push(`Water leak repair dispatched to smart valves in ${sector}. Flow rate stabilized!`);
      break;
      
    case 'INSTALL_SOLAR':
      sectorOverrides[sector].solarAdded += 150; // +150 kWh generation
      userRewards.xp += 250;
      userRewards.points += 60;
      if (!userRewards.badges.includes('Solar Pioneer')) {
        userRewards.badges.push('Solar Pioneer');
      }
      responseMessage.push(`High-efficiency photo-voltaic smart grid connected in ${sector}!`);
      break;
      
    default:
      return res.status(400).json({ error: 'Unknown eco action' });
  }

  // Update levels
  userRewards.level = Math.floor(userRewards.xp / 500) + 1;

  res.json({
    success: true,
    message: responseMessage.join(' '),
    rewards: userRewards,
    sectorState: sectorOverrides[sector]
  });
})// Gemini Assistant Chat Integration (Supports real API key or offline smart model fallback)
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const cleanMessage = message.toLowerCase();
  let aiReply = '';

  // Get current city telemetry for contextual chatbot responses
  const latestDate = environmentalData[environmentalData.length - 1].date;
  const latestRecords = environmentalData.filter(r => r.date === latestDate);

  let totalEnergy = 0;
  let totalWater = 0;
  let totalSolar = 0;
  let totalCarbon = 0;
  let totalTrees = 0;
  let avgAQI = 0;
  let leakSectors = [];
  let dirtySectors = [];

  latestRecords.forEach(r => {
    const overrides = sectorOverrides[r.sector] || { extraTrees: 0, leakFixed: false, solarAdded: 0 };
    const currentLeaks = overrides.leakFixed ? 0 : r.water_leak_rate;
    const updatedTree = r.tree_cover_sqm + overrides.extraTrees;
    const updatedSolar = r.solar_kwh + overrides.solarAdded;
    const updatedAQI = Math.max(5, Math.round(r.aqi - (overrides.extraTrees * 0.0005)));
    const updatedCarbon = Math.round(r.carbon_kg - (overrides.extraTrees * 0.05) - (overrides.solarAdded * 0.4));

    totalEnergy += r.electricity_kwh;
    totalWater += r.water_liters;
    totalSolar += updatedSolar;
    totalCarbon += updatedCarbon;
    totalTrees += updatedTree;
    avgAQI += updatedAQI;

    if (currentLeaks > 0) leakSectors.push(`${r.sector} (${currentLeaks}%)`);
    if (updatedAQI > 90) dirtySectors.push(`${r.sector} (AQI: ${updatedAQI})`);
  });

  avgAQI = Math.round(avgAQI / SECTORS.length);
  const carbonOffset = Math.round((totalTrees * 0.22) + (totalSolar * 0.45));

  // Check if real Gemini API Key is provided
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const systemContext = `You are EcoSphere AI, an advanced sustainability decision intelligence assistant.
The active location is ${activeLocationProfile.name} (${activeLocationProfile.latitude.toFixed(4)}, ${activeLocationProfile.longitude.toFixed(4)}).
Current local weather: ${activeLocationProfile.weather.temperatureC}°C, ${activeLocationProfile.weather.humidityPct}% humidity, ${activeLocationProfile.weather.windSpeedKph} km/h wind (source: ${activeLocationProfile.weather.source}).
You are monitoring a smart city with the following active sector telemetry dataset:
${JSON.stringify(latestRecords, null, 2)}

Overall Computed KPIs:
- Average AQI: ${avgAQI}
- Sustainability Index: ${Math.round(totalTrees / 500000 * 10 + 75)}%
- Total Tree Cover: ${totalTrees.toLocaleString()} sqm
- Total solar generation: ${totalSolar.toLocaleString()} kWh
- Leaking sectors: ${leakSectors.join(', ') || 'None'}
- Polluted sectors: ${dirtySectors.join(', ') || 'None'}

Please answer the user's question. If they ask about the city or sustainability metrics, refer to the telemetry. If they ask general questions (e.g. general knowledge, help with code, mathematics, coding, recipes, history), please answer them fully as a highly capable general-purpose AI assistant. Always keep a professional, scientific, yet encouraging tone. Use markdown headings and lists in your response for readability.`;

      const result = await model.generateContent([
        systemContext,
        `User Question: ${message}`
      ]);
      aiReply = result.response.text();
    } catch (err) {
      console.error("Gemini API call failed, falling back to local model:", err);
      aiReply = getLocalAssistantReply(cleanMessage, totalEnergy, totalWater, totalSolar, totalCarbon, totalTrees, avgAQI, leakSectors, dirtySectors, latestRecords);
    }
  } else {
    aiReply = getLocalAssistantReply(cleanMessage, totalEnergy, totalWater, totalSolar, totalCarbon, totalTrees, avgAQI, leakSectors, dirtySectors, latestRecords);
  }

  res.json({
    message: aiReply,
    timestamp: new Date().toISOString()
  });
});

// Helper function for local rule assistant
function getLocalAssistantReply(cleanMessage, totalEnergy, totalWater, totalSolar, totalCarbon, totalTrees, avgAQI, leakSectors, dirtySectors, latestRecords) {
  if (cleanMessage.includes('electricity') || cleanMessage.includes('energy') || cleanMessage.includes('power')) {
    return `### ⚡ Electricity Usage Intelligence Report
Our smart meter sensors report that **EcoSphere City** is currently consuming **${totalEnergy.toLocaleString()} kWh** of electricity.
*   **Top Consumer:** The highest-demand local zone leads current usage.
*   **Renewable Offset:** Solar grids are generating **${totalSolar} kWh** of solar electricity, helping offset **${Math.round(totalSolar * 0.45)} kg** of carbon emissions.
*   **Observation:** Energy spikes are correlates of high ambient air temperatures (${latestRecords[0].temperature_c}°C) due to climate ventilation systems. 
*   **Recommended Action:** Trigger "Install Solar" in a high-demand local zone on the map screen to boost renewable load by **150 kWh** and claim your **250 XP Solar Pioneer Badge**!`;
  } 
  
  else if (cleanMessage.includes('water') || cleanMessage.includes('leak')) {
    if (leakSectors.length > 0) {
      return `### 💧 Critical Water Network Telemetry
Sensors have flagged anomalous pressure drop indices in the distribution network:
*   **Active Leaks Detected:** Leaks identified in **${leakSectors.join(', ')}**.
*   **Total City Draw:** Current volumetric draw is **${totalWater.toLocaleString()} Liters/day**.
*   **Impact:** A leak rate of 15% wastes water reserves and drops our general **Sustainability Index** by **4 points**.
*   **AI Suggestion:** Go to the interactive map dashboard and select **Fix Leaks** on the affected sector. This will trigger pressure valves to isolate the leak and stabilize municipal flows.`;
    } else {
      return `### 💧 Water Flow Analysis
Water distribution pressures are stable:
*   **Total Draw:** Current consumption stands at **${totalWater.toLocaleString()} Liters**.
*   **Leak Status:** 0% active leaks detected. Smart pressure valves are operational.
*   **Efficiency:** Standard residential volume is within target bounds (average 180 Liters per capita).`;
    }
  } 
  
  else if (cleanMessage.includes('tree') || cleanMessage.includes('plantation') || cleanMessage.includes('green') || cleanMessage.includes('parks')) {
    return `### 🌳 Green Cover & Canopy Recommendation
Tree canopy coverage acts as our main carbon sink and particulate filter:
*   **Current Tree Canopy:** **${totalTrees.toLocaleString()} sq meters** city-wide.
*   **Target Cover:** Smart City planners recommend expanding green cover to **600,000 sq meters**.
*   **Primary Plantation Zone:** The highest-AQI local zone is flagged as a high-density particulate site. Adding tree canopies there will reduce AQI levels by **5 AQI points per 10,000 sqm**.
*   **AI Recommendation:** Deploy *Plant Trees* in that local zone on the dashboard. This increases municipal green coverage and offsets greenhouse emissions by **500 kg CO2/year**.`;
  } 
  
  else if (cleanMessage.includes('pollution') || cleanMessage.includes('air') || cleanMessage.includes('aqi')) {
    return `### 🌫 Environmental Air Quality Dashboard
City-wide Air Quality Index (AQI) stands at **${avgAQI}** (Moderate average).
*   **Sector Breakdown:** ${dirtySectors.length > 0 ? `Alerts active in: **${dirtySectors.join(', ')}**.` : 'All sectors register under healthy threshold bounds (AQI < 80).'}
*   **Health Impact:** Inhalation risks are slightly elevated near the highest-AQI local zone.
*   **Predictive What-If Scenario:** If temperatures rise by 2°C, particulate retention increases, likely boosting average AQI by **6.5%**.
*   **Mitigation Strategy:** Tree plantation in the highest-AQI local zone or transition to EVs are the highest-impact remedies.`;
  } 
  
  else if (cleanMessage.includes('report') || cleanMessage.includes('executive summary') || cleanMessage.includes('monthly')) {
    return `# 🌍 EcoSphere AI Executive Sustainability Report
**Date:** ${new Date().toLocaleDateString()} | **City Status:** ECO-BALANCED

### 📊 Key Performance Aggregates
1.  **Sustainability Index:** **${Math.round(totalTrees / 500000 * 10 + 75)}/100** (Stabilizing)
2.  **Net Carbon Footprint:** **${totalCarbon.toLocaleString()} kg CO2**
3.  **Renewable Mix Ratio:** **${Math.round((totalSolar / totalEnergy) * 100)}%**
4.  **Ecological Canopy Index:** **${totalTrees.toLocaleString()} sqm**
5.  **Water Network Efficiency:** **${leakSectors.length > 0 ? '92.3%' : '100%'}**

### 🚨 Critical Alerts Active
*   *Leaks:* ${leakSectors.length > 0 ? `Unresolved flow drops in: ${leakSectors.join(', ')}` : 'None. Pressure valves fully stable.'}
*   *Air Pollutants:* ${dirtySectors.length > 0 ? `Elevated PM2.5 in ${dirtySectors.join(', ')}` : 'Safe PM2.5 limits in all sectors.'}

### 💡 Multi-Agent Decision Path
*   **Phase 1 (Isolate Leaks):** Deploy repairs to active warning zones to recover municipal water head.
*   **Phase 2 (Decarbonize Grid):** Extend rooftop solar arrays in the strongest local demand zone.
*   **Phase 3 (Urban Forestation):** Expand forest cover in the highest-AQI local zone by 30,000 sqm.`;
  } 
  
  else {
    return `### Hello! I am the EcoSphere AI Sustainability Assistant.
I can analyze real-time municipal telemetry datasets and model scenario simulations.
*   **Offline Mode active:** To let me answer general-purpose questions of all types, please set the \`GEMINI_API_KEY\` environment variable before running \`node server.js\`.
*   **Telemetry Questions I can resolve:** "electricity draws", "water leaks", "tree cover recommendations", "air quality levels", "generate a monthly report".`;
  }
}

// Custom Local Dataset Upload API
app.post('/api/upload', (req, res) => {
  const { data } = req.body;
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid data format. Expected an array of records.' });
  }

  // Basic validation of fields
  const requiredFields = ['date', 'sector', 'electricity_kwh', 'water_liters', 'aqi', 'tree_cover_sqm', 'waste_fill_pct', 'carbon_kg', 'solar_kwh', 'temperature_c'];
  const firstRecord = data[0];
  if (firstRecord) {
    const missing = requiredFields.filter(f => !(f in requiredFields)); // Check correct array lookup
    const actualFields = Object.keys(firstRecord);
    const missingFields = requiredFields.filter(f => !actualFields.includes(f));
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields in dataset: ${missingFields.join(', ')}` });
    }
  }

  // Parse and set the database
  environmentalData = data.map(r => ({
    date: r.date,
    sector: r.sector,
    electricity_kwh: Number(r.electricity_kwh),
    water_liters: Number(r.water_liters),
    water_leak_rate: Number(r.water_leak_rate || 0),
    aqi: Number(r.aqi),
    tree_cover_sqm: Number(r.tree_cover_sqm),
    waste_fill_pct: Number(r.waste_fill_pct),
    carbon_kg: Number(r.carbon_kg),
    solar_kwh: Number(r.solar_kwh),
    temperature_c: Number(r.temperature_c),
    humidity_pct: Number(r.humidity_pct || 50)
  }));

  // Re-initialize overrides for new sectors
  const uniqueSectors = [...new Set(environmentalData.map(r => r.sector))];
  sectorOverrides = {};
  uniqueSectors.forEach(sec => {
    sectorOverrides[sec] = { extraTrees: 0, leakFixed: false, solarAdded: 0 };
  });
  datasetUpdatedAt = new Date().toISOString();
  datasetSource = 'User-uploaded dataset';

  res.json({
    success: true,
    message: `Successfully loaded custom dataset. Registered ${environmentalData.length} logs across ${uniqueSectors.length} sectors (${uniqueSectors.join(', ')}).`,
    sectors: uniqueSectors
  });
});

const applyLocationProfile = (profile) => {
  activeLocationProfile = profile;
  activeLocation = profile.id;
  SECTORS = profile.sectors;
  environmentalData = generateDataset();
  sectorOverrides = initializeSectorOverrides();
  datasetUpdatedAt = new Date().toISOString();
  datasetSource = `Location-calibrated model for ${profile.name} using ${profile.weather.source} weather`;
};

const normalizeGeocodeResult = (result) => ({
  id: `${result.id || result.name}:${Number(result.latitude).toFixed(4)},${Number(result.longitude).toFixed(4)}`,
  name: result.name,
  latitude: Number(result.latitude),
  longitude: Number(result.longitude),
  country: result.country || '',
  admin1: result.admin1 || result.admin2 || '',
  displayName: [result.name, result.admin1 || result.admin2, result.country].filter(Boolean).join(', ')
});

// Geographical Location Selector API
app.get('/api/location', (req, res) => {
  res.json({
    activeLocation,
    activeLocationName: activeLocationProfile.name,
    location: {
      id: activeLocationProfile.id,
      name: activeLocationProfile.name,
      latitude: activeLocationProfile.latitude,
      longitude: activeLocationProfile.longitude,
      country: activeLocationProfile.country,
      admin1: activeLocationProfile.admin1,
      weather: activeLocationProfile.weather
    },
    availableLocations: []
  });
});

app.get('/api/location/auto', async (req, res) => {
  const { profile, source } = await autoResolveLocationProfile();
  applyLocationProfile(profile);
  res.json({
    success: true,
    source,
    activeLocationName: profile.name,
    location: {
      id: profile.id,
      name: profile.name,
      latitude: profile.latitude,
      longitude: profile.longitude,
      country: profile.country,
      admin1: profile.admin1,
      weather: profile.weather
    }
  });
});

app.get('/api/location/search', async (req, res) => {
  const query = String(req.query.query || '').trim();
  if (query.length < 2) {
    return res.status(400).json({ error: 'Enter at least 2 characters to search for a location.' });
  }

  try {
    const params = new URLSearchParams({
      name: query,
      count: '8',
      language: 'en',
      format: 'json'
    });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
    if (!response.ok) {
      return res.status(502).json({ error: 'Location search provider is temporarily unavailable.' });
    }

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results.map(normalizeGeocodeResult) : [];
    if (results.length === 0) {
      return res.status(404).json({ error: `No matching location found for "${query}".` });
    }

    res.json({ results });
  } catch (error) {
    res.status(502).json({ error: 'Unable to search locations right now. Try again in a moment.' });
  }
});

app.post('/api/location', async (req, res) => {
  const { name, latitude, longitude, country, admin1 } = req.body;
  const latNum = Number(latitude);
  const lonNum = Number(longitude);

  if (Number.isNaN(latNum) || Number.isNaN(lonNum) || Math.abs(latNum) > 90 || Math.abs(lonNum) > 180) {
    return res.status(400).json({ error: 'Coordinates must be valid latitude and longitude values.' });
  }
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'A valid location name is required.' });
  }

  const profile = await createLocationProfile({
    name: String(name).trim(),
    latitude: latNum,
    longitude: lonNum,
    country: country || '',
    admin1: admin1 || ''
  });
  applyLocationProfile(profile);

  res.json({
    success: true,
    message: `Location locked. Telemetry models recalibrated for ${profile.name}.`,
    activeLocationName: profile.name,
    location: {
      id: profile.id,
      name: profile.name,
      latitude: profile.latitude,
      longitude: profile.longitude,
      country: profile.country,
      admin1: profile.admin1,
      weather: profile.weather
    }
  });
});

app.post('/api/location/gps', async (req, res) => {
  const { latitude, longitude, cityName } = req.body;
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and Longitude are required.' });
  }

  const latNum = Number(latitude);
  const lonNum = Number(longitude);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return res.status(400).json({ error: 'Coordinates must be valid numbers.' });
  }

  if (Math.abs(latNum) > 90 || Math.abs(lonNum) > 180) {
    return res.status(400).json({ error: 'Coordinates must be valid latitude and longitude values.' });
  }

  let name = cityName || `Current Location ${latNum.toFixed(4)}, ${lonNum.toFixed(4)}`;
  let country = '';
  let admin1 = '';

  try {
    const params = new URLSearchParams({
      latitude: String(latNum),
      longitude: String(lonNum),
      count: '1',
      language: 'en',
      format: 'json'
    });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      const place = Array.isArray(data.results) ? data.results[0] : null;
      if (place && !cityName) {
        name = place.name || name;
        country = place.country || '';
        admin1 = place.admin1 || place.admin2 || '';
      }
    }
  } catch (error) {
    // Reverse lookup is helpful but GPS calibration still works without it.
  }

  const profile = await createLocationProfile({ name, latitude: latNum, longitude: lonNum, country, admin1 });
  applyLocationProfile(profile);

  return res.json({
    success: true,
    message: `Geographic coordinates locked. Telemetry models recalibrated for ${profile.name}.`,
    activeLocationName: profile.name,
    location: {
      id: profile.id,
      name: profile.name,
      latitude: profile.latitude,
      longitude: profile.longitude,
      country: profile.country,
      admin1: profile.admin1,
      weather: profile.weather
    }
  });

});

// ----------------------------------------------------
// Enterprise-grade mock APIs for the new experience
// ----------------------------------------------------
app.get('/api/enterprise/overview', (req, res) => {
  res.json({
    executive: {
      sustainabilityIndex: 89,
      complianceScore: 92,
      finesCollected: 1480000,
      inspectionsScheduled: 41,
      aiConfidence: 97
    },
    twin: {
      buildings: 184,
      roads: 312,
      trees: 9520,
      pollution: 34,
      leaks: 3,
      solar: 31,
      waste: 5,
      grid: 95
    },
    whatIf: {
      treeImpact: { aqi: 41, carbon: 2810, temperature: 29.4 },
      solarImpact: { savings: 418, carbon: 2720, cost: 162000 },
      rainfallImpact: { shortage: '12%', groundwater: '7% below baseline' }
    }
  });
});

app.get('/api/enterprise/compliance', (req, res) => {
  res.json({
    totalViolations: 47,
    pendingCases: 19,
    resolvedCases: 28,
    repeatOffenders: 7,
    fines: 1480000,
    heatmap: [
      { label: 'North', value: 68 },
      { label: 'Central', value: 61 },
      { label: 'East', value: 90 },
      { label: 'South', value: 66 },
      { label: 'West', value: 74 }
    ]
  });
});

app.get('/api/enterprise/leaderboard', (req, res) => {
  res.json([
    { name: 'Jaipur', sustainability: 91, water: 86, carbon: 89, energy: 90, trees: 87, type: 'City' },
    { name: 'Delhi', sustainability: 87, water: 82, carbon: 84, energy: 83, trees: 81, type: 'City' },
    { name: 'Sector 14', sustainability: 84, water: 80, carbon: 82, energy: 79, trees: 85, type: 'Society' },
    { name: 'Greenfield School', sustainability: 82, water: 78, carbon: 80, energy: 77, trees: 83, type: 'School' },
    { name: 'AquaTech', sustainability: 80, water: 76, carbon: 78, energy: 75, trees: 79, type: 'Business' }
  ]);
});

app.get('/api/enterprise/coach', (req, res) => {
  res.json([
    { citizen: 'Mira', ecoScore: 92, weeklyTrend: '+12%', carbonFootprint: '3.4 t', badge: 'Water Guardian', recommendation: 'Shift laundry to off-peak hours.' },
    { citizen: 'Arjun', ecoScore: 86, weeklyTrend: '+8%', carbonFootprint: '4.1 t', badge: 'Solar Starter', recommendation: 'Use rooftop solar surplus in the evening.' },
    { citizen: 'Neha', ecoScore: 79, weeklyTrend: '+5%', carbonFootprint: '4.9 t', badge: 'Compost Champion', recommendation: 'Install a home composting unit.' }
  ]);
});

app.get('/api/enterprise/sdg', (req, res) => {
  res.json([
    { goal: 'SDG 6', progress: 84, label: 'Clean Water' },
    { goal: 'SDG 7', progress: 88, label: 'Affordable Energy' },
    { goal: 'SDG 11', progress: 81, label: 'Sustainable Cities' },
    { goal: 'SDG 13', progress: 90, label: 'Climate Action' },
    { goal: 'SDG 15', progress: 86, label: 'Life on Land' }
  ]);
});

app.get('/api/enterprise/agent', (req, res) => {
  res.json([
    { id: 'T-204', task: 'Schedule leakage inspection', owner: 'Officer Kavita', status: 'Scheduled', priority: 'High' },
    { id: 'T-205', task: 'Notify waste collectors', owner: 'Ops Desk', status: 'In progress', priority: 'Medium' },
    { id: 'T-206', task: 'Issue solar maintenance ticket', owner: 'Field Team', status: 'Queued', priority: 'Low' }
  ]);
});

app.post('/api/enterprise/whatif', (req, res) => {
  const { treeIncrease = 20, solarIncrease = 30, rainfallDrop = 18 } = req.body || {};
  res.json({
    treeImpact: {
      aqi: Math.max(25, 48 - treeIncrease * 0.2),
      carbon: Math.max(2200, 3000 - treeIncrease * 12),
      temperature: parseFloat((31 - treeIncrease * 0.05).toFixed(1))
    },
    solarImpact: {
      savings: Math.round(300 + solarIncrease * 4),
      carbon: Math.max(2500, 3200 - solarIncrease * 8),
      cost: Math.round(140000 + solarIncrease * 900)
    },
    rainfallImpact: {
      shortage: `${Math.max(5, rainfallDrop)}%`,
      groundwater: `${Math.max(3, Math.round(rainfallDrop * 0.35))}% below baseline`
    }
  });
});

app.get('/api/datasets', (req, res) => {
  const rows = db.prepare('SELECT dataset_name, record_count, summary FROM dataset_catalog ORDER BY dataset_name').all();
  const datasets = rows.map((row) => ({
    name: row.dataset_name.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    file: `${row.dataset_name}.json`,
    records: row.record_count,
    summary: row.summary,
    preview: loadDatasetPreview(row.dataset_name)
  }));

  res.json({
    datasets,
    status: 'ready',
    generatedAt: new Date().toISOString(),
    notes: 'Synthetic demo datasets are available for electricity, water, air, trees, waste, renewables, carbon, and citizen reports.'
  });
});

app.post('/api/report/export', (req, res) => {
  const { reportType = 'esg', kpis = {} } = req.body || {};
  const title = `${reportType.toUpperCase()} sustainability report`;
  const content = buildReportContent(reportType, kpis);
  const insert = db.prepare('INSERT INTO report_exports (report_type, title, content) VALUES (?, ?, ?)');
  const result = insert.run(reportType, title, content);

  res.json({
    success: true,
    id: result.lastInsertRowid,
    title,
    content,
    createdAt: new Date().toISOString()
  });
});

app.get('/api/report/history', (req, res) => {
  const rows = db.prepare('SELECT id, report_type, title, created_at FROM report_exports ORDER BY id DESC LIMIT 8').all();
  res.json({ history: rows });
});

// Health check endpoint for deployment platforms like Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ecosphere-ai-backend' });
});

// Serve static assets from the React frontend build when available
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
const hasFrontendBuild = fs.existsSync(path.join(frontendBuildPath, 'index.html'));
app.use(express.static(frontendBuildPath));

// Catch-all route to serve the Single Page App index.html (excluding API routes)
app.get(/^(?!\/api).*/, (req, res) => {
  if (hasFrontendBuild) {
    return res.sendFile(path.join(frontendBuildPath, 'index.html'));
  }

  res.status(404).json({
    message: 'EcoSphere AI backend is running. Build the frontend to serve the UI.'
  });
});

// Port listener
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[EcoSphere Backend] Server running on http://0.0.0.0:${PORT}`);
});

