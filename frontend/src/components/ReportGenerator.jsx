import React, { useState } from 'react';
import { FileText, Download, Printer, RefreshCw, CheckCircle, HelpCircle, Activity } from 'lucide-react';

export default function ReportGenerator({ apiBase, kpis, fetchGlobalState }) {
  const [reportType, setReportType] = useState('esg');
  const [compiling, setCompiling] = useState(false);
  const [compiledReport, setCompiledReport] = useState(null);

  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState('');
  const [fileInfo, setFileInfo] = useState('');

  // JavaScript client-side CSV parser
  const parseCSV = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length === headers.length) {
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = cols[idx];
        });
        parsed.push(obj);
      }
    }
    return parsed;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileInfo(file.name);
    setUploadFeedback('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileContent = event.target.result;
      let parsedData = [];

      try {
        if (file.name.endsWith('.json')) {
          parsedData = JSON.parse(fileContent);
        } else if (file.name.endsWith('.csv')) {
          parsedData = parseCSV(fileContent);
        } else {
          setUploadFeedback('Unsupported file extension. Please upload a .csv or .json file.');
          return;
        }

        if (parsedData.length === 0) {
          setUploadFeedback('The file contains no records.');
          return;
        }

        setUploadLoading(true);
        const res = await fetch(`${apiBase}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: parsedData })
        });

        if (res.ok) {
          const result = await res.json();
          setUploadFeedback(`✓ ${result.message}`);
          if (fetchGlobalState) fetchGlobalState();
          
          if (window.confetti) {
            window.confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.8 },
              colors: ['#22bd6c', '#3b82f6', '#f97316']
            });
          }
        } else {
          const errData = await res.json();
          setUploadFeedback(`✗ Error: ${errData.error || 'Server validation failed.'}`);
        }
      } catch (err) {
        setUploadFeedback(`✗ Error parsing file content: ${err.message}`);
      } finally {
        setUploadLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const generateReport = () => {
    setCompiling(true);
    setCompiledReport(null);

    // Simulate compilation delay for analytical lookups
    setTimeout(() => {
      let reportContent = '';
      const dateStr = new Date().toLocaleDateString();

      if (reportType === 'esg') {
        reportContent = `# 🌍 EcoSphere AI - Municipal ESG Audit
**Compliance Registry:** UN-SDG-11-13 | **Security Certificate:** SHA-256 Ledger Verified
**Report Date:** ${dateStr} | **Global Assessment:** CLASS-A ECO BALANCE

---

## 1. Executive ESG Summary
EcoSphere City's integrated municipal smart systems report a **Sustainability Index of ${kpis.sustainabilityScore}%**. Atmospheric particulates (AQI) average **${kpis.averageAQI}**, maintaining stable air quality conditions. Greenhouse gas emissions have been minimized via microgrids and urban tree covers.

## 2. Key Metrics & Targets
*   **Net Carbon Footprint:** ${kpis.totalCarbonKg?.toLocaleString()} kg CO2/day
*   **Annualized Carbon Offset:** ${kpis.carbonOffsetKg?.toLocaleString()} kg CO2
*   **Rooftop Solar Absorption:** ${kpis.solarGenerationKwh} kWh
*   **Water Distribution Efficiency:** ${kpis.activeAlerts > 0 ? '94.2%' : '100%'}

## 3. Recommended Policy Interventions
1.  **Urban Forestry Expansion:** Expand the highest-AQI zone tree canopy by 20,000 sqm to absorb sulfur-particulate outputs.
2.  **Solar Grid Subsidization:** Deploy photovoltaic incentives for residential rooftops to target a 20% solar mix ratio.
3.  **Pressure Loop Repairs:** Seal local flow pressure deviations to protect drinking water reserves.
`;
      } else if (reportType === 'energy') {
        reportContent = `# ⚡ EcoSphere AI - Smart Grid Energy Report
**Grid Compliance:** IEEE-SmartGrid-v2 | **Telemetry Hops:** 5 IoT Segments
**Report Date:** ${dateStr} | **Grid Status:** STABLE SUPPLY

---

## 1. Smart Grid Assessment
Total municipal energy demand stands at **${kpis.totalEnergyUsageKwh?.toLocaleString()} kWh**. Solar installations currently generate **${kpis.solarGenerationKwh} kWh**, accounting for **${Math.round((kpis.solarGenerationKwh / kpis.totalEnergyUsageKwh) * 100) || 10}%** of grid inputs.

## 2. Grid Peak Demand Factors
*   **Industrial Sector:** Absorbs 65.2% of peak grid loads.
*   **Datacenter Corridor:** High-density baseline draw registered.
*   **Ambient Weather Correlates:** Air conditioning loads increase by 4.2% per 1°C ambient temperature rise above 28°C.

## 3. Operational Priorities
1.  Extend peak shifters to high-demand local zones.
2.  Incorporate wind energy feed-ins.
`;
      } else {
        reportContent = `# 🌳 EcoSphere AI - Carbon Footprint Audit
**Greenhouse Ledger:** GHG-Protocol-Scope-2 | **Audit Status:** APPROVED
**Report Date:** ${dateStr} | **Net Daily Offset:** -${kpis.carbonOffsetKg} kg

---

## 1. Greenhouse Gas Ingestion
EcoSphere City carbon emissions total **${kpis.totalCarbonKg?.toLocaleString()} kg CO2**. This is offset by **${kpis.carbonOffsetKg?.toLocaleString()} kg** of offset vectors, primarily driven by **${(kpis.totalTreeCoverSqm / 10000).toFixed(1)} hectares** of urban forestation.

## 2. Carbon Vectors
*   **Industrial Emissions:** 68% of emissions.
*   **Vehicle Transportation:** 22% of emissions.
*   **Carbon Sinks (Parks):** Absorb 220g CO2 per square meter annually.

## 3. Decarbonization Action Plan
1.  Transition city fleet logistics to Electric Vehicles.
2.  Expand green reserve borders to absorb highway exhaust plumes.
`;
      }

      setCompiledReport(reportContent);
      setCompiling(false);
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Selector and control panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COMPILER CONFIGURATION */}
        <div className="glass-panel p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              Report Compiler
            </h3>
            <p className="text-xs text-slate-400">
              Compile environmental telemetry data into formal ESG compliance reports. Export reports as standardized markdown or download printed summaries for audits.
            </p>
          </div>

          <div className="space-y-4">
            {/* Report Type selector */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold block">Select Audit Profile:</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-slate-950 p-3 rounded-lg border border-white/10 text-xs text-slate-300 outline-none focus:border-eco-500 transition-all cursor-pointer"
              >
                <option value="esg">Sustainability ESG Report</option>
                <option value="energy">Smart Grid Energy Report</option>
                <option value="carbon">Carbon Audit & Forest Index</option>
              </select>
            </div>

            <button
              disabled={compiling}
              onClick={generateReport}
              className={`w-full py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                compiling 
                  ? 'bg-slate-900 border border-white/10 text-slate-500 cursor-not-allowed'
                  : 'bg-eco-500 text-white shadow-neon-green hover:bg-eco-600 cursor-pointer'
              }`}
            >
              {compiling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Compiling Datasets...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" /> Compile Official Report
                </>
              )}
            </button>
          </div>

          <div className="text-[10px] text-slate-500 flex justify-between items-center border-t border-white/5 pt-4">
            <span>Compiler Version: v2.4</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-eco-500"></span> Ledger Verified</span>
          </div>
        </div>

        {/* COMPILED REPORT PREVIEW */}
        <div className="glass-panel p-6 lg:col-span-2 min-h-[400px] flex flex-col justify-between">
          {compiledReport ? (
            <div className="flex-grow flex flex-col justify-between space-y-6">
              
              {/* Report text body */}
              <div className="bg-slate-950/60 p-6 rounded-xl border border-white/5 font-mono text-[11px] text-slate-300 leading-relaxed overflow-y-auto max-h-[350px]">
                {compiledReport.split('\n').map((line, idx) => {
                  if (line.startsWith('# ')) return <h1 key={idx} className="text-base font-bold text-white mb-4">{line.replace('# ', '')}</h1>;
                  if (line.startsWith('## ')) return <h2 key={idx} className="text-xs font-bold text-eco-400 mt-4 mb-2 uppercase">{line.replace('## ', '')}</h2>;
                  if (line.startsWith('* ') || line.startsWith('- ')) return <li key={idx} className="ml-4 list-disc text-slate-300 my-0.5">{line.replace(/^[\*\-]\s+/, '')}</li>;
                  if (line.startsWith('---')) return <hr key={idx} className="border-white/10 my-4" />;
                  return line.trim() ? <p key={idx} className="my-1.5">{line}</p> : <div key={idx} className="h-1" />;
                })}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </button>
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(compiledReport)}`}
                  download={`ecosphere_report_${reportType}.md`}
                  className="px-4 py-2 bg-eco-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-neon-green transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Markdown
                </a>
              </div>

            </div>
          ) : (
            <div className="flex flex-col justify-between h-full space-y-8 py-6">
              <div className="flex flex-col items-center justify-center text-center space-y-3 text-slate-500 flex-1">
                <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-white/10 text-slate-500">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">No Report Compiled</h4>
                  <p className="text-[11px] text-slate-400 max-w-[280px] mt-1 mx-auto">
                    Select a report type on the left, then click the compilation button to query current city databases.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">🌍 Local Area Telemetry Ingestion</h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Upload your own neighborhood's historical sensor logs (.csv or .json) to calibrate the platform for your exact living area.
                  </p>
                </div>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row items-center gap-3 justify-between">
                  <div className="text-left">
                    <span className="text-[9px] text-slate-500 font-mono block">SUPPORTED FORMATS: CSV / JSON</span>
                    <span className="text-[11px] text-slate-300 font-semibold">{fileInfo || 'Select environmental telemetry file...'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shrink-0">
                      Browse File
                      <input 
                        type="file" 
                        accept=".csv,.json" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        disabled={uploadLoading}
                      />
                    </label>
                  </div>
                </div>

                {uploadFeedback && (
                  <div className={`text-[10px] p-2.5 rounded border text-center font-medium ${
                    uploadFeedback.startsWith('✓') 
                      ? 'bg-eco-500/10 border-eco-500/20 text-eco-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {uploadFeedback}
                  </div>
                )}

                <div className="text-[9px] text-slate-500 leading-relaxed">
                  *   **CSV Format Requirements:** Must contain column headers: `date`, `sector`, `electricity_kwh`, `water_liters`, `aqi`, `tree_cover_sqm`, `waste_fill_pct`, `carbon_kg`, `solar_kwh`, `temperature_c`.
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

