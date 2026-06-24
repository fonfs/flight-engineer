'use client';

import React, { useState } from 'react';
import { FlightContext } from '@classic-flight-engineer/aviation-domain';
import { parseAndNormalizeSimBrief } from '@classic-flight-engineer/simbrief-adapter';

import { useApp } from '../../components/AppContext';

const parseSimbriefDate = (rawGeneral: any, rawTimes: any) => {
  const val = rawTimes?.sched_out || rawGeneral?.sched_out || rawGeneral?.sched_out_date;
  if (!val) return { date: 'N/A', time: 'N/A' };
  
  let dateObj: Date;
  if (!isNaN(Number(val))) {
    dateObj = new Date(Number(val) * 1000);
  } else {
    dateObj = new Date(val);
  }
  
  if (isNaN(dateObj.getTime())) {
    return { date: String(val), time: 'N/A' };
  }
  
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[dateObj.getUTCMonth()];
  const year = String(dateObj.getUTCFullYear()).slice(-2);
  const dateStr = `${day} ${month} ${year}`;
  
  const hours = String(dateObj.getUTCHours()).padStart(2, '0');
  const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes} UTC`;
  
  return { date: dateStr, time: timeStr };
};

const parseSimbriefArrival = (rawGeneral: any, rawTimes: any) => {
  const val = rawTimes?.sched_in || rawGeneral?.sched_in || rawGeneral?.sched_in_date;
  if (!val) return 'N/A';
  
  let dateObj: Date;
  if (!isNaN(Number(val))) {
    dateObj = new Date(Number(val) * 1000);
  } else {
    dateObj = new Date(val);
  }
  
  if (isNaN(dateObj.getTime())) return String(val);
  
  const hours = String(dateObj.getUTCHours()).padStart(2, '0');
  const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes} UTC`;
};

const parseToMinutes = (val: any): number => {
  if (val === undefined || val === null) return 0;
  const str = String(val).trim();
  if (!str) return 0;
  if (str.includes(':')) {
    const parts = str.split(':');
    return Number(parts[0]) * 60 + Number(parts[1]);
  }
  const num = Number(str);
  if (isNaN(num)) return 0;
  if (num > 1440) {
    return Math.round(num / 60);
  }
  return num;
};

const getAirTime = (rawTimes: any) => {
  const sec = Number(rawTimes?.est_time_enroute || 0);
  if (sec > 1440) {
    const min = Math.round(sec / 60);
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  
  const blockMin = parseToMinutes(rawTimes?.est_block);
  const taxiOut = parseToMinutes(rawTimes?.taxi_out);
  const taxiIn = parseToMinutes(rawTimes?.taxi_in);
  const airMin = Math.max(0, blockMin - taxiOut - taxiIn);
  
  const h = Math.floor(airMin / 60);
  const m = airMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const getBlockTime = (rawTimes: any) => {
  const min = parseToMinutes(rawTimes?.est_block);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatAltitude = (alt: any) => {
  const num = Number(alt || 0);
  return num ? `${num.toLocaleString('en-US')} ft` : 'N/A';
};

const formatDistance = (dist: any) => {
  const num = Number(dist || 0);
  return num ? `${num.toLocaleString('en-US')} nm` : 'N/A';
};

const formatISADev = (dev: any) => {
  if (dev === undefined || dev === null || dev === '') return 'N/A';
  const num = Number(dev);
  if (isNaN(num)) return String(dev);
  if (num > 0) return `P${num}`;
  if (num < 0) return `M${Math.abs(num)}`;
  return 'P0';
};

const getAvgWind = (rawGeneral: any) => {
  const dir = rawGeneral?.avg_wind_dir;
  const spd = rawGeneral?.avg_wind_spd;
  if (dir !== undefined && spd !== undefined && dir !== '' && spd !== '') {
    return `${dir}° / ${spd} KT`;
  }
  return rawGeneral?.avg_wind || 'N/A';
};

const formatWindComp = (comp: any) => {
  if (comp === undefined || comp === null || comp === '') return 'N/A';
  const str = String(comp).trim();
  if (str.startsWith('P') || str.startsWith('M') || str.startsWith('H') || str.startsWith('T')) {
    return str;
  }
  const num = Number(str);
  if (isNaN(num)) return str;
  if (num > 0) return `P${num} KT`;
  if (num < 0) return `M${Math.abs(num)} KT`;
  return '0 KT';
};

const getOfpText = (raw: any): string => {
  if (!raw) return '';
  if (typeof raw.text === 'object' && raw.text !== null) {
    return raw.text.plan_out || raw.text.plan_html || '';
  }
  if (typeof raw.text === 'string') {
    return raw.text;
  }
  return raw.plan_text || raw.ofp_text || raw.text_plan || '';
};

export default function ImportPage() {
  const { flightData, setFlightData } = useApp();
  const [pilotId, setPilotId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ofpFilter, setOfpFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'performance' | 'flight' | 'route' | 'ofp' | 'raw'>('general');

  const [importedData, setImportedData] = useState<{
    flightContext: FlightContext;
    warnings: string[];
    raw: any;
  } | null>(flightData);

  const [lastImportTime, setLastImportTime] = useState<string | null>(null);

  const formatWeight = (val: any) => {
    const num = Number(val || 0);
    if (!num) return { kgs: '0 KG', lbs: '0 LB' };
    const isLbs = importedData?.raw?.params?.units?.toLowerCase() === 'lbs';
    if (isLbs) {
      return {
        lbs: num.toLocaleString('en-US') + ' LB',
        kgs: Math.round(num / 2.2046226218).toLocaleString('en-US') + ' KG'
      };
    } else {
      return {
        kgs: num.toLocaleString('en-US') + ' KG',
        lbs: Math.round(num * 2.2046226218).toLocaleString('en-US') + ' LB'
      };
    }
  };

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setImportedData(null);

    try {
      const query = `pilotId=${encodeURIComponent(pilotId)}`;
      const res = await fetch(`/api/simbrief?${query}`);
      const rawData = await res.json();

      if (!res.ok) {
        throw new Error(rawData.error || 'Erro desconhecido ao consultar SimBrief');
      }

      // Check SimBrief API fetch status
      const fetchStatus = rawData.fetch?.status;
      if (fetchStatus && fetchStatus !== 'OFP Found' && fetchStatus !== 'Success') {
        throw new Error(`SimBrief: ${fetchStatus}`);
      }

      // Client-side normalization
      const adapterResult = parseAndNormalizeSimBrief(rawData);

      const parsedData = {
        flightContext: adapterResult.flightContext,
        warnings: adapterResult.warnings,
        raw: rawData,
      };

      setImportedData(parsedData);
      setLastImportTime(new Date().toLocaleTimeString());

      // Auto-save immediately to memory context
      setFlightData(parsedData);
      setSuccess('Plano de voo importado e sincronizado com sucesso na memória!');

    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="border-b border-cyan-800/40 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider text-cyan-400 font-mono">
          IMPORTAÇÃO SIMBRIEF // PILOT INTERFACE
        </h1>
        <p className="text-slate-400 text-sm">Insira suas credenciais do SimBrief para sincronizar o último plano de voo operacional.</p>
      </header>

      {/* Input panel */}
      <section className="bg-slate-900/60 border border-slate-800 p-6 rounded-lg backdrop-blur-md">
        <form onSubmit={handleFetch} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 block font-mono">PILOT ID (NUMÉRICO)</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-slate-800 rounded px-3 py-2 text-cyan-300 font-mono outline-none focus:border-cyan-500"
              placeholder="Ex: 123456"
              value={pilotId}
              onChange={(e) => setPilotId(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !pilotId}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-black font-extrabold py-2 px-4 rounded font-mono transition-colors"
          >
            {loading ? 'SINCRONIZANDO...' : 'BUSCAR PLANO DE VOO'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-800/80 text-red-400 rounded text-sm font-mono">
            [FALHA] {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 rounded text-sm font-mono">
            [SUCESSO] {success}
          </div>
        )}
      </section>

      {/* Editor & Data panel */}
      {importedData && (
        <section className="w-full">
          {/* Beautiful HUD Dashboard */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
            {/* HUD Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 px-4 text-center font-bold transition-all border-b-2 hover:bg-slate-900 ${activeTab === 'general' ? 'border-cyan-400 text-cyan-400 bg-slate-900/40' : 'border-transparent text-slate-400'
                  }`}
              >
                📋 DADOS GERAIS
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('performance')}
                className={`flex-1 py-3 px-4 text-center font-bold transition-all border-b-2 hover:bg-slate-900 ${activeTab === 'performance' ? 'border-cyan-400 text-cyan-400 bg-slate-900/40' : 'border-transparent text-slate-400'
                  }`}
              >
                📊 PERFORMANCE & PESOS
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('flight')}
                className={`flex-1 py-3 px-4 text-center font-bold transition-all border-b-2 hover:bg-slate-900 ${activeTab === 'flight' ? 'border-cyan-400 text-cyan-400 bg-slate-900/40' : 'border-transparent text-slate-400'
                  }`}
              >
                ✈️ PLANO & SCHEDULE
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('route')}
                className={`flex-1 py-3 px-4 text-center font-bold transition-all border-b-2 hover:bg-slate-900 ${activeTab === 'route' ? 'border-cyan-400 text-cyan-400 bg-slate-900/40' : 'border-transparent text-slate-400'
                  }`}
              >
                🌍 NAVLOG & FIXES
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ofp')}
                className={`flex-1 py-3 px-4 text-center font-bold transition-all border-b-2 hover:bg-slate-900 ${activeTab === 'ofp' ? 'border-cyan-400 text-cyan-400 bg-slate-900/40' : 'border-transparent text-slate-400'
                  }`}
              >
                📝 OFP
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`flex-1 py-3 px-4 text-center font-bold transition-all border-b-2 hover:bg-slate-900 ${activeTab === 'raw' ? 'border-cyan-400 text-cyan-400 bg-slate-900/40' : 'border-transparent text-slate-400'
                  }`}
              >
                ⚙️ RAW JSON DATA
              </button>
            </div>

            {/* HUD Content Area */}
            <div className="p-6 flex-1 space-y-6">
              {importedData.warnings.length > 0 && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 text-amber-400 rounded text-xs font-mono">
                  <span className="font-bold block mb-1">⚠️ AVISOS DE ADAPTAÇÃO:</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {importedData.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'general' && (
                <div className="space-y-6 font-mono">
                  {/* Route Banner Visualizer */}
                  <div className="relative bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-emerald-950/40 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    {/* Route graphic */}
                    <div className="flex-1 w-full flex items-center justify-between relative px-4">
                      {/* Dash line connector */}
                      <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-800 pointer-events-none"></div>
                      
                      {/* Departure */}
                      <div className="relative z-10 flex flex-col items-center bg-slate-950 border border-slate-800 rounded-xl p-3 w-28 shadow-xl">
                        <span className="text-[9px] text-cyan-400 font-extrabold tracking-wider uppercase mb-0.5">DEP</span>
                        <span className="text-xl font-black text-slate-100">{importedData.raw?.origin?.icao_code || 'N/A'}</span>
                        <span className="text-[9px] text-slate-500 truncate max-w-[90px]">{importedData.raw?.origin?.iata_code || ''}</span>
                      </div>
                      
                      {/* Alternate */}
                      {importedData.raw?.alternate?.icao_code && (
                        <div className="relative z-10 flex flex-col items-center bg-slate-950/90 border border-amber-900/50 rounded-xl p-2 w-24 shadow-xl">
                          <span className="text-[8px] text-amber-500 font-extrabold tracking-wider uppercase mb-0.5">ALT</span>
                          <span className="text-sm font-bold text-slate-300">{importedData.raw?.alternate?.icao_code}</span>
                          <span className="text-[8px] text-slate-500 truncate max-w-[80px]">{importedData.raw?.alternate?.iata_code || ''}</span>
                        </div>
                      )}

                      {/* Arrival */}
                      <div className="relative z-10 flex flex-col items-center bg-slate-950 border border-slate-800 rounded-xl p-3 w-28 shadow-xl">
                        <span className="text-[9px] text-emerald-400 font-extrabold tracking-wider uppercase mb-0.5">ARR</span>
                        <span className="text-xl font-black text-slate-100">{importedData.raw?.destination?.icao_code || 'N/A'}</span>
                        <span className="text-[9px] text-slate-500 truncate max-w-[90px]">{importedData.raw?.destination?.iata_code || ''}</span>
                      </div>
                    </div>

                    {/* Flight Call Sign / Aircraft Info Badge */}
                    <div className="flex md:flex-col justify-between md:justify-center items-center md:items-end w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 shrink-0 gap-2">
                      <div className="text-left md:text-right">
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Flight Identity</span>
                        <span className="text-2xl font-black text-cyan-400 tracking-wider">{(importedData.raw?.general?.icao_airline || '') + (importedData.raw?.general?.flight_number || 'N/A')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Equipment</span>
                        <span className="text-sm font-bold text-slate-300">{importedData.raw?.aircraft?.name || importedData.raw?.aircraft?.icao_code || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Primary Stats (Spans 2 columns) */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-black/30 border border-slate-800/80 rounded-xl p-6 space-y-6">
                        <h4 className="text-xs font-bold text-cyan-400 font-mono tracking-wider border-b border-slate-850 pb-2 uppercase flex items-center gap-2">
                          <span>⏱️</span> Flight & Schedule Info
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Departure Date</span>
                            <span className="text-sm font-extrabold text-slate-200">{parseSimbriefDate(importedData.raw?.general, importedData.raw?.times).date}</span>
                          </div>
                          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Out / Off (UTC)</span>
                            <span className="text-sm font-extrabold text-cyan-400">{parseSimbriefDate(importedData.raw?.general, importedData.raw?.times).time}</span>
                          </div>
                          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">In / On (UTC)</span>
                            <span className="text-sm font-extrabold text-emerald-400">{parseSimbriefArrival(importedData.raw?.general, importedData.raw?.times)}</span>
                          </div>
                          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Airframe</span>
                            <span className="text-sm font-extrabold text-slate-200">{importedData.raw?.aircraft?.reg || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Progress Bar / Time stats */}
                          <div className="bg-slate-950/30 border border-slate-900 rounded-lg p-4 space-y-3">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Estimated Air vs Block Time</span>
                            <div className="flex justify-between items-end">
                              <div>
                                <span className="text-xs text-slate-500 block">AIR TIME</span>
                                <span className="text-xl font-bold text-slate-200">{getAirTime(importedData.raw?.times)}</span>
                              </div>
                              <div className="text-slate-700 font-black text-xl">&rarr;</div>
                              <div className="text-right">
                                <span className="text-xs text-slate-500 block">BLOCK TIME</span>
                                <span className="text-xl font-bold text-cyan-400">{getBlockTime(importedData.raw?.times)}</span>
                              </div>
                            </div>
                            {/* Visual bar */}
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                              <div className="bg-cyan-500 h-full rounded-full" style={{ width: '85%' }}></div>
                            </div>
                          </div>

                          {/* Route Stats */}
                          <div className="bg-slate-950/30 border border-slate-900 rounded-lg p-4 space-y-3">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Route Metrics</span>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-xs text-slate-400 block">Distance</span>
                                <span className="text-lg font-bold text-slate-200">{formatDistance(importedData.raw?.general?.route_distance)}</span>
                              </div>
                              <div>
                                <span className="text-xs text-slate-400 block">Initial Alt</span>
                                <span className="text-lg font-bold text-slate-200">{formatAltitude(importedData.raw?.general?.initial_altitude)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Weather & Atmospheric Stats */}
                      <div className="bg-black/30 border border-slate-800/80 rounded-xl p-6 space-y-4">
                        <h4 className="text-xs font-bold text-cyan-400 font-mono tracking-wider border-b border-slate-850 pb-2 uppercase flex items-center gap-2">
                          <span>🌍</span> Atmospheric & Cruise Wind Conditions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
                          <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-900 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Average Wind</span>
                            <span className="text-lg font-extrabold text-emerald-400 mt-2">{getAvgWind(importedData.raw?.general)}</span>
                            <span className="text-[9px] text-slate-500 mt-1">Direct average enroute wind</span>
                          </div>
                          <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-900 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Wind Component</span>
                            <span className={`text-lg font-extrabold mt-2 ${String(importedData.raw?.general?.avg_wind_comp || '').startsWith('P') || Number(importedData.raw?.general?.avg_wind_comp || 0) > 0 ? 'text-emerald-400' : 'text-amber-500'}`}>
                              {formatWindComp(importedData.raw?.general?.avg_wind_comp)}
                            </span>
                            <span className="text-[9px] text-slate-500 mt-1">Head/Tail component</span>
                          </div>
                          <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-900 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">ISA Temp Deviation</span>
                            <span className="text-lg font-extrabold text-cyan-400 mt-2">{formatISADev(importedData.raw?.general?.avg_temp_dev)}</span>
                            <span className="text-[9px] text-slate-500 mt-1">Average deviation from standard ISA</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Dispatch Metadata (Spans 1 column) */}
                    <div className="space-y-6">
                      <div className="bg-black/30 border border-slate-800/80 rounded-xl p-6 space-y-4 h-full">
                        <h4 className="text-xs font-bold text-cyan-400 font-mono tracking-wider border-b border-slate-850 pb-2 uppercase flex items-center gap-2">
                          <span>⚙️</span> Dispatch & Planning
                        </h4>
                        <div className="divide-y divide-slate-800/60 font-mono text-xs">
                          <div className="py-2.5 flex justify-between">
                            <span className="text-slate-500">AIRAC Cycle</span>
                            <span className="text-slate-200 font-bold">{importedData.raw?.params?.airac || importedData.raw?.general?.airac || 'N/A'}</span>
                          </div>
                          <div className="py-2.5 flex justify-between">
                            <span className="text-slate-500">OFP Layout</span>
                            <span className="text-slate-200 font-bold">{importedData.raw?.params?.ofp_layout || importedData.raw?.general?.ofp_layout || 'N/A'}</span>
                          </div>
                          <div className="py-2.5 flex justify-between">
                            <span className="text-slate-500">Cruise Profile</span>
                            <span className="text-slate-200 font-bold">{importedData.raw?.general?.cruise_profile || 'N/A'}</span>
                          </div>
                          <div className="py-2.5 flex justify-between">
                            <span className="text-slate-500">Release Number</span>
                            <span className="text-slate-200 font-bold">{importedData.raw?.params?.release || importedData.raw?.general?.release || importedData.raw?.general?.release_number || 'N/A'}</span>
                          </div>
                          <div className="py-2.5 flex justify-between">
                            <span className="text-slate-500">Units</span>
                            <span className="text-cyan-400 font-bold">{(importedData.raw?.params?.units || 'KGS').toUpperCase()}</span>
                          </div>
                          <div className="py-2.5 flex justify-between">
                            <span className="text-slate-500">Navlog Included</span>
                            <span className={`font-bold ${importedData.raw?.params?.navlog === '1' || importedData.raw?.params?.navlog === true || importedData.raw?.navlog ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {importedData.raw?.params?.navlog === '1' || importedData.raw?.params?.navlog === true || importedData.raw?.navlog ? 'YES' : 'NO'}
                            </span>
                          </div>
                          <div className="py-2.5 flex justify-between">
                            <span className="text-slate-500">ETOPS Planning</span>
                            <span className={`font-bold ${importedData.raw?.params?.etops === '1' || importedData.raw?.params?.etops === true ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {importedData.raw?.params?.etops === '1' || importedData.raw?.params?.etops === true ? 'YES' : 'NO'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ofp' && (
                <div className="space-y-4 font-mono text-xs flex flex-col flex-grow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-800/20 pb-4 gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-cyan-400 font-mono flex items-center gap-2">
                        📋 PLANO DE VOO OPERACIONAL (OFP)
                      </h3>
                      <p className="text-slate-500 text-[10px]">Visualização interativa do OFP oficial gerado pelo SimBrief.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Filtrar linhas..."
                        className="bg-black/40 border border-slate-800 rounded px-3 py-1 text-xs text-cyan-300 font-mono outline-none focus:border-cyan-500 w-48"
                        value={ofpFilter}
                        onChange={(e) => setOfpFilter(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(importedData.raw?.text?.plan_out || '');
                        }}
                        className="px-3 py-1 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 border border-cyan-800 rounded text-xs font-mono transition-all"
                      >
                        Copiar Tudo
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 max-h-[500px] overflow-y-auto font-mono text-xs leading-relaxed text-slate-300 scrollbar-thin">
                    {getOfpText(importedData.raw) ? (
                      getOfpText(importedData.raw)
                        .split('\n')
                        .map((line: string, index: number) => {
                          if (ofpFilter && !line.toLowerCase().includes(ofpFilter.toLowerCase())) {
                            return null;
                          }

                          let lineClass = "py-0.5 px-1 hover:bg-slate-900/50 rounded transition-colors whitespace-pre ";

                          if (line.startsWith('(') || line.includes('ATC FPL') || line.includes('FLIGHT PLAN')) {
                            lineClass += "text-cyan-400 font-bold ";
                          } else if (line.includes('FUEL') || line.includes('TAKEOFF') || line.includes('LANDING') || line.includes('EST BURNOUT')) {
                            lineClass += "text-emerald-400/90 ";
                          } else if (line.includes('CRZ') || line.includes('TOC') || line.includes('TOD') || line.includes('CLB')) {
                            lineClass += "text-amber-400/90 ";
                          }

                          return (
                            <div key={index} className={lineClass}>
                              <span className="text-slate-700 select-none mr-4 inline-block w-8 text-right">{index + 1}</span>
                              <span>{line}</span>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center py-8 text-slate-500 font-mono">
                        NENHUM TEXTO DE PLANO DE VOO OPERACIONAL (OFP) DISPONÍVEL.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-6 font-mono">
                  {/* Weights Section */}
                  <div className="bg-black/30 border border-slate-800/80 rounded-xl p-6 space-y-6">
                    <h4 className="text-xs font-bold text-cyan-400 font-mono tracking-wider border-b border-slate-850 pb-2 uppercase flex items-center gap-2">
                      <span>⚖️</span> Operational Weights & Limits
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* ZFW */}
                      <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-900 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Zero Fuel Weight</span>
                          <span className="text-[10px] text-amber-500 font-bold">MAX: {formatWeight(importedData.raw?.weights?.max_zfw).kgs}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xl font-bold text-cyan-300">{formatWeight(importedData.raw?.weights?.est_zfw).kgs}</span>
                          <span className="text-xs text-slate-400">/ {formatWeight(importedData.raw?.weights?.est_zfw).lbs}</span>
                        </div>
                        {/* ZFW progress bar */}
                        {Number(importedData.raw?.weights?.max_zfw) > 0 && (
                          <div className="space-y-1">
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, (Number(importedData.raw?.weights?.est_zfw) / Number(importedData.raw?.weights?.max_zfw)) * 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-500">
                              <span>0%</span>
                              <span>{Math.round((Number(importedData.raw?.weights?.est_zfw) / Number(importedData.raw?.weights?.max_zfw)) * 100)}% LIMIT</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* TOW */}
                      <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-900 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Takeoff Weight</span>
                          <span className="text-[10px] text-amber-500 font-bold">MAX: {formatWeight(importedData.raw?.weights?.max_tow).kgs}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xl font-bold text-cyan-300">{formatWeight(importedData.raw?.weights?.est_tow).kgs}</span>
                          <span className="text-xs text-slate-400">/ {formatWeight(importedData.raw?.weights?.est_tow).lbs}</span>
                        </div>
                        {/* TOW progress bar */}
                        {Number(importedData.raw?.weights?.max_tow) > 0 && (
                          <div className="space-y-1">
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (Number(importedData.raw?.weights?.est_tow) / Number(importedData.raw?.weights?.max_tow)) * 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-500">
                              <span>0%</span>
                              <span>{Math.round((Number(importedData.raw?.weights?.est_tow) / Number(importedData.raw?.weights?.max_tow)) * 100)}% LIMIT</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* LDW */}
                      <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-900 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Landing Weight</span>
                          <span className="text-[10px] text-amber-500 font-bold">MAX: {formatWeight(importedData.raw?.weights?.max_ldw).kgs}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xl font-bold text-cyan-300">{formatWeight(importedData.raw?.weights?.est_ldw).kgs}</span>
                          <span className="text-xs text-slate-400">/ {formatWeight(importedData.raw?.weights?.est_ldw).lbs}</span>
                        </div>
                        {/* LDW progress bar */}
                        {Number(importedData.raw?.weights?.max_ldw) > 0 && (
                          <div className="space-y-1">
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (Number(importedData.raw?.weights?.est_ldw) / Number(importedData.raw?.weights?.max_ldw)) * 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-500">
                              <span>0%</span>
                              <span>{Math.round((Number(importedData.raw?.weights?.est_ldw) / Number(importedData.raw?.weights?.max_ldw)) * 100)}% LIMIT</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payload, Cargo, Pax, Bags */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div className="bg-slate-950/30 p-3 rounded border border-slate-900 flex justify-between items-center">
                        <span className="text-slate-500">PAYLOAD:</span>
                        <span className="text-slate-200 font-bold">{formatWeight(importedData.raw?.weights?.payload).kgs}</span>
                      </div>
                      <div className="bg-slate-950/30 p-3 rounded border border-slate-900 flex justify-between items-center">
                        <span className="text-slate-500">CARGO:</span>
                        <span className="text-slate-200 font-bold">{formatWeight(importedData.raw?.weights?.cargo).kgs}</span>
                      </div>
                      <div className="bg-slate-950/30 p-3 rounded border border-slate-900 flex justify-between items-center">
                        <span className="text-slate-500">PASSENGERS:</span>
                        <span className="text-slate-200 font-bold">{importedData.raw?.weights?.pax_count || '0'}</span>
                      </div>
                      <div className="bg-slate-950/30 p-3 rounded border border-slate-900 flex justify-between items-center">
                        <span className="text-slate-500">BAG COUNT:</span>
                        <span className="text-slate-200 font-bold">{importedData.raw?.weights?.bag_count || '0'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fuel Section */}
                  <div className="bg-black/30 border border-slate-800/80 rounded-xl p-6 space-y-6">
                    <h4 className="text-xs font-bold text-emerald-400 font-mono tracking-wider border-b border-slate-850 pb-2 uppercase flex items-center gap-2">
                      <span>⚓</span> Fuel Planning & Allocation
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div className="bg-slate-950/40 border border-slate-900 p-3 rounded">
                        <span className="text-slate-500 block mb-1">TAXI FUEL</span>
                        <span className="text-slate-200 font-bold text-sm">{formatWeight(importedData.raw?.fuel?.taxi).kgs}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{formatWeight(importedData.raw?.fuel?.taxi).lbs}</span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-900 p-3 rounded">
                        <span className="text-slate-500 block mb-1">TRIP BURN</span>
                        <span className="text-emerald-400 font-bold text-sm">{formatWeight(importedData.raw?.fuel?.enroute_burn).kgs}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{formatWeight(importedData.raw?.fuel?.enroute_burn).lbs}</span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-900 p-3 rounded">
                        <span className="text-slate-500 block mb-1">CONTINGENCY</span>
                        <span className="text-slate-200 font-bold text-sm">{formatWeight(importedData.raw?.fuel?.contingency).kgs}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{formatWeight(importedData.raw?.fuel?.contingency).lbs}</span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-900 p-3 rounded">
                        <span className="text-slate-500 block mb-1">ALTERNATE BURN</span>
                        <span className="text-slate-200 font-bold text-sm">{formatWeight(importedData.raw?.fuel?.alternate_burn || importedData.raw?.fuel?.alternate).kgs}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{formatWeight(importedData.raw?.fuel?.alternate_burn || importedData.raw?.fuel?.alternate).lbs}</span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-900 p-3 rounded">
                        <span className="text-slate-500 block mb-1">EXTRA FUEL</span>
                        <span className="text-slate-200 font-bold text-sm">{formatWeight(importedData.raw?.fuel?.extra).kgs}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{formatWeight(importedData.raw?.fuel?.extra).lbs}</span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-900 p-3 rounded">
                        <span className="text-slate-500 block mb-1">MIN TAKEOFF</span>
                        <span className="text-slate-200 font-bold text-sm">{formatWeight(importedData.raw?.fuel?.min_takeoff || (Number(importedData.raw?.fuel?.plan_ramp || 0) - Number(importedData.raw?.fuel?.taxi || 0))).kgs}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{formatWeight(importedData.raw?.fuel?.min_takeoff || (Number(importedData.raw?.fuel?.plan_ramp || 0) - Number(importedData.raw?.fuel?.taxi || 0))).lbs}</span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-900 p-3 rounded">
                        <span className="text-slate-500 block mb-1">PLAN TAKEOFF</span>
                        <span className="text-slate-200 font-bold text-sm">{formatWeight(importedData.raw?.fuel?.plan_takeoff).kgs}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{formatWeight(importedData.raw?.fuel?.plan_takeoff).lbs}</span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-900 p-3 rounded">
                        <span className="text-slate-500 block mb-1">PLAN LANDING</span>
                        <span className="text-slate-200 font-bold text-sm">{formatWeight(importedData.raw?.fuel?.plan_landing).kgs}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{formatWeight(importedData.raw?.fuel?.plan_landing).lbs}</span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-900 p-3 rounded">
                        <span className="text-slate-500 block mb-1">AVG FUEL FLOW</span>
                        <span className="text-slate-200 font-bold text-sm">{Number(importedData.raw?.fuel?.avg_fuel_flow || 0).toLocaleString()} KGS/HR</span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-900 p-3 rounded">
                        <span className="text-slate-500 block mb-1">MAX TANKS CAP</span>
                        <span className="text-slate-200 font-bold text-sm">{formatWeight(importedData.raw?.fuel?.max_tanks).kgs}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{formatWeight(importedData.raw?.fuel?.max_tanks).lbs}</span>
                      </div>
                      <div className="bg-red-950/20 border border-red-900/40 p-3 rounded shadow-[0_0_8px_rgba(239,68,68,0.15)]">
                        <span className="text-red-400 block mb-1 font-bold">FINAL RESERVE</span>
                        <span className="text-red-500 font-extrabold text-sm">{formatWeight(importedData.raw?.fuel?.reserve).kgs}</span>
                        <span className="text-[10px] text-red-500/80 block mt-0.5">{formatWeight(importedData.raw?.fuel?.reserve).lbs}</span>
                      </div>
                      <div className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded">
                        <span className="text-emerald-300 block mb-1 font-extrabold">RAMP / BLOCK</span>
                        <span className="text-emerald-300 font-extrabold text-sm">{formatWeight(importedData.raw?.fuel?.plan_ramp).kgs}</span>
                        <span className="text-[10px] text-emerald-500/80 block mt-0.5">{formatWeight(importedData.raw?.fuel?.plan_ramp).lbs}</span>
                      </div>
                    </div>

                    {/* Fuel bar segments */}
                    {Number(importedData.raw?.fuel?.plan_ramp) > 0 && (
                      <div className="space-y-1">
                        <div className="flex h-3 rounded overflow-hidden bg-slate-950 border border-slate-800">
                          <div
                            className="bg-emerald-700"
                            style={{ width: `${Math.max(2, (Number(importedData.raw?.fuel?.enroute_burn) / Number(importedData.raw?.fuel?.plan_ramp)) * 100)}%` }}
                            title="Trip Burn"
                          />
                          <div
                            className="bg-emerald-500"
                            style={{ width: `${Math.max(2, (Number(importedData.raw?.fuel?.reserve) / Number(importedData.raw?.fuel?.plan_ramp)) * 100)}%` }}
                            title="Final Reserve"
                          />
                          <div
                            className="bg-emerald-400"
                            style={{ width: `${Math.max(2, (Number(importedData.raw?.fuel?.taxi) / Number(importedData.raw?.fuel?.plan_ramp)) * 100)}%` }}
                            title="Taxi"
                          />
                          <div
                            className="bg-teal-600"
                            style={{ width: `${Math.max(2, (Number(importedData.raw?.fuel?.contingency || 0) / Number(importedData.raw?.fuel?.plan_ramp)) * 100)}%` }}
                            title="Contingency"
                          />
                          <div
                            className="bg-amber-600"
                            style={{ width: `${Math.max(2, (Number(importedData.raw?.fuel?.alternate_burn || importedData.raw?.fuel?.alternate || 0) / Number(importedData.raw?.fuel?.plan_ramp)) * 100)}%` }}
                            title="Alternate"
                          />
                          <div
                            className="bg-blue-600"
                            style={{ width: `${Math.max(2, (Number(importedData.raw?.fuel?.extra || 0) / Number(importedData.raw?.fuel?.plan_ramp)) * 100)}%` }}
                            title="Extra"
                          />
                        </div>
                        <div className="flex flex-wrap justify-between text-[9px] text-slate-500 gap-x-4">
                          <span>█ TRIP BURN ({Math.round((Number(importedData.raw?.fuel?.enroute_burn) / Number(importedData.raw?.fuel?.plan_ramp)) * 100)}%)</span>
                          <span>█ RESERVA ({Math.round((Number(importedData.raw?.fuel?.reserve) / Number(importedData.raw?.fuel?.plan_ramp)) * 100)}%)</span>
                          <span>█ TAXI ({Math.round((Number(importedData.raw?.fuel?.taxi) / Number(importedData.raw?.fuel?.plan_ramp)) * 100)}%)</span>
                          <span>█ CONTINGÊNCIA ({Math.round((Number(importedData.raw?.fuel?.contingency || 0) / Number(importedData.raw?.fuel?.plan_ramp)) * 100)}%)</span>
                          <span>█ ALTERNADO ({Math.round((Number(importedData.raw?.fuel?.alternate_burn || importedData.raw?.fuel?.alternate || 0) / Number(importedData.raw?.fuel?.plan_ramp)) * 100)}%)</span>
                          <span>█ EXTRA ({Math.round((Number(importedData.raw?.fuel?.extra || 0) / Number(importedData.raw?.fuel?.plan_ramp)) * 100)}%)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'flight' && (
                <div className="space-y-6 font-mono text-xs">
                  {/* General Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20 border border-slate-800/60 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">NÚMERO DE VOO:</span>
                        <span className="text-slate-100 font-bold">{importedData.raw?.general?.flight_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">COMPANHIA / CALLSIGN:</span>
                        <span className="text-slate-100 font-bold">{importedData.raw?.general?.icao_airline || ''}{importedData.raw?.general?.flight_number}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">MODELO AERONAVE:</span>
                        <span className="text-slate-100 font-bold">{importedData.raw?.aircraft?.name || 'N/A'} ({importedData.raw?.aircraft?.icao_code})</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">MOTORES DETECTADOS:</span>
                        <span className="text-slate-100 font-bold">{importedData.raw?.aircraft?.engine_type || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">MATRÍCULA (REGISTRATION):</span>
                        <span className="text-cyan-400 font-bold">{importedData.raw?.aircraft?.reg || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">ROTA DE DISTÂNCIA:</span>
                        <span className="text-cyan-300 font-bold">{importedData.raw?.general?.route_distance ? `${importedData.raw.general.route_distance} NM` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">CRUISE FL (ALTITUDE):</span>
                        <span className="text-slate-100 font-bold">FL{Math.round(Number(importedData.raw?.general?.initial_altitude || 0) / 100)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">ORIGEM / ELEVAÇÃO:</span>
                        <span className="text-slate-100 font-bold">{importedData.raw?.origin?.icao_code} / {importedData.raw?.origin?.elevation} FT</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">DESTINO / ELEVAÇÃO:</span>
                        <span className="text-slate-100 font-bold">{importedData.raw?.destination?.icao_code} / {importedData.raw?.destination?.elevation} FT</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">ALTERNADO SUGERIDO:</span>
                        <span className="text-slate-100 font-bold">{importedData.raw?.alternate?.icao_code || 'NENHUM'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Weather HUD */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-1">🌍 METEOROLOGIA NA PARTIDA</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-amber-950/10 border border-amber-900/20 p-3 rounded flex justify-between items-center">
                        <span className="text-slate-500">TEMPERATURA:</span>
                        <span className="text-amber-400 font-bold text-sm">{importedData.raw?.weather?.departure_temp ? `${importedData.raw.weather.departure_temp}°C` : 'N/A'}</span>
                      </div>
                      <div className="bg-amber-950/10 border border-amber-900/20 p-3 rounded flex justify-between items-center">
                        <span className="text-slate-500">QNH (ALTIMETER):</span>
                        <span className="text-amber-400 font-bold text-sm">{importedData.raw?.weather?.departure_qnh ? `${importedData.raw.weather.departure_qnh} hPa` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Profile */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-cyan-400 border-b border-slate-800 pb-1">⏱️ CRONOGRAMA DE VOO (SCHEDULE)</h4>
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 border border-slate-800 p-4 rounded-lg text-center">
                      <div>
                        <span className="text-slate-500 block mb-1 text-[10px]">TAXI SAÍDA</span>
                        <span className="text-slate-200 font-bold text-sm">{importedData.raw?.times?.taxi_out || '0'} min</span>
                      </div>
                      <span className="text-slate-600">&rarr;</span>
                      <div>
                        <span className="text-slate-500 block mb-1 text-[10px]">SUBIDA</span>
                        <span className="text-slate-200 font-bold text-sm">{importedData.raw?.times?.climb || '0'} min</span>
                      </div>
                      <span className="text-slate-600">&rarr;</span>
                      <div>
                        <span className="text-slate-500 block mb-1 text-[10px]">CRUZEIRO</span>
                        <span className="text-slate-200 font-bold text-sm">{importedData.raw?.times?.cruise || '0'} min</span>
                      </div>
                      <span className="text-slate-600">&rarr;</span>
                      <div>
                        <span className="text-slate-500 block mb-1 text-[10px]">DESCIDA</span>
                        <span className="text-slate-200 font-bold text-sm">{importedData.raw?.times?.descent || '0'} min</span>
                      </div>
                      <span className="text-slate-600">&rarr;</span>
                      <div>
                        <span className="text-slate-500 block mb-1 text-[10px]">TAXI ENTRADA</span>
                        <span className="text-slate-200 font-bold text-sm">{importedData.raw?.times?.taxi_in || '0'} min</span>
                      </div>
                      <div className="border-l border-slate-800 pl-4 ml-2">
                        <span className="text-cyan-400 block mb-1 text-[10px] font-bold">TOTAL BLOCK</span>
                        <span className="text-cyan-400 font-bold text-sm">{importedData.raw?.times?.est_block ? `${Math.floor(Number(importedData.raw.times.est_block) / 60)}h ${Number(importedData.raw.times.est_block) % 60}m` : '0h 0m'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'route' && (
                <div className="space-y-6 font-mono text-xs">
                  {/* Route text */}
                  <div className="bg-black/30 border border-slate-800 p-3 rounded">
                    <span className="text-slate-500 block mb-1 text-[10px] font-bold">ROTA INTEGRAL DE VOO</span>
                    <span className="text-slate-100 text-sm leading-relaxed">{importedData.raw?.general?.route || 'N/A'}</span>
                  </div>

                  {/* Waypoints Table */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-cyan-400 border-b border-slate-800 pb-1">🧭 FIXOS DO NAVLOG (PLANEJAMENTO DE VENTO)</h4>
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-slate-800 rounded">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-950 text-slate-500 border-b border-slate-800 font-bold text-[10px]">
                            <th className="py-2 px-3">FIXO</th>
                            <th className="py-2 px-3">ALTITUDE (FL)</th>
                            <th className="py-2 px-3">VENTO (DIR/VEL)</th>
                            <th className="py-2 px-3">OAT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importedData.raw?.navlog?.fix?.map((fix: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-900 hover:bg-slate-900/40 text-slate-300">
                              <td className="py-2 px-3 font-bold text-cyan-300">{fix.ident}</td>
                              <td className="py-2 px-3">FL{fix.fl || '0'}</td>
                              <td className="py-2 px-3 text-emerald-400">
                                🡕 {fix.wind_dir}° / {fix.wind_spd} KT
                              </td>
                              <td className="py-2 px-3 text-amber-400/90">{fix.oat ? `${fix.oat}°C` : 'N/A'}</td>
                            </tr>
                          ))}
                          {(!importedData.raw?.navlog?.fix || importedData.raw.navlog.fix.length === 0) && (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-slate-500">Nenhum fixo carregado no navlog principal.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Alternate Waypoints Table */}
                  {importedData.raw?.alternate_navlog?.fix && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-cyan-400 border-b border-slate-800 pb-1">🧭 FIXOS DO NAVLOG DO ALTERNADO (alternate_navlog)</h4>
                      <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-slate-800 rounded">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-950 text-slate-500 border-b border-slate-800 font-bold text-[10px]">
                              <th className="py-2 px-3">FIXO</th>
                              <th className="py-2 px-3">ALTITUDE (FL)</th>
                              <th className="py-2 px-3">VENTO (DIR/VEL)</th>
                              <th className="py-2 px-3">OAT</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importedData.raw.alternate_navlog.fix.map((fix: any, idx: number) => (
                              <tr key={idx} className="border-b border-slate-900 hover:bg-slate-900/40 text-slate-300">
                                <td className="py-2 px-3 font-bold text-cyan-300">{fix.ident}</td>
                                <td className="py-2 px-3">FL{fix.fl || '0'}</td>
                                <td className="py-2 px-3 text-emerald-400">
                                  🡕 {fix.wind_dir}° / {fix.wind_spd} KT
                                </td>
                                <td className="py-2 px-3 text-amber-400/90">{fix.oat ? `${fix.oat}°C` : 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'raw' && (
                <div className="space-y-2 font-mono text-xs flex-1 flex flex-col">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">CONTEÚDO RAW JSON DE CONSULTA</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(importedData.raw, null, 2));
                      }}
                      className="px-2 py-1 bg-cyan-950/60 border border-cyan-800/40 rounded hover:bg-cyan-900 text-cyan-300 text-[10px] transition-colors"
                    >
                      Copiar JSON
                    </button>
                  </div>
                  <textarea
                    readOnly
                    className="w-full bg-slate-950 border border-slate-800 rounded p-4 font-mono text-xs leading-relaxed text-slate-400 resize-none h-[340px] focus:outline-none scrollbar-thin"
                    value={JSON.stringify(importedData.raw, null, 2)}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 bg-slate-950/50 p-4 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>PILOT ID SYNC: {pilotId || importedData.raw?.general?.pilot_id || 'N/A'}</span>
              <span>ÚLTIMA SINCRONIZAÇÃO: {lastImportTime}</span>
            </div>
          </div>
        </section>
      )}


    </main>
  );
}
