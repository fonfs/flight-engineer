'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../components/AppContext';
import { 
  Calculator, 
  Wind, 
  Thermometer, 
  Scale, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Zap,
  ArrowRight
} from 'lucide-react';
import { 
  asFeet, 
  asCelsius, 
  asPounds, 
  asHectopascals, 
  asKnots,
  lbsToKg,
  kgToLbs,
  asKilograms
} from '@classic-flight-engineer/unit-system';
import { calculateTakeoffPerformance, TakeoffPerformanceResult } from '@classic-flight-engineer/performance-engine';

export default function TakeoffCalculatorPage() {
  const { flightData } = useApp();

  // Inputs React State
  const [elevation, setElevation] = useState<number>(0);
  const [qnh, setQnh] = useState<number>(1013);
  const [oat, setOat] = useState<number>(15);
  const [weightInput, setWeightInput] = useState<number>(660000); // lbs
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kgs'>('lbs');
  const [runwayInput, setRunwayInput] = useState<number>(9491); // ft
  const [runwayUnit, setRunwayUnit] = useState<'ft' | 'm'>('ft');
  
  const [windComponent, setWindComponent] = useState<number>(0); // positive = headwind, negative = tailwind
  const [flaps, setFlaps] = useState<10 | 20>(10);
  const [packsOff3, setPacksOff3] = useState<boolean>(false);
  const [runwayDry, setRunwayDry] = useState<boolean>(true);
  const [melCdlPenalty, setMelCdlPenalty] = useState<boolean>(false);
  const [windshearProb, setWindshearProb] = useState<boolean>(false);
  const [runwaySlope, setRunwaySlope] = useState<number>(0);

  // Calculation Results
  const [results, setResults] = useState<TakeoffPerformanceResult | null>(null);

  // Helper to parse QNH from METAR
  const parseQnhFromMetar = (metar: string): number | null => {
    if (!metar) return null;
    const matchAlt = metar.match(/(?:\s|^)A(\d{4})(?:\s|$)/);
    if (matchAlt) {
      const inhg = Number(matchAlt[1]) / 100;
      return Math.round(inhg * 33.8639);
    }
    const matchQnh = metar.match(/(?:\s|^)Q(\d{4})(?:\s|$)/);
    if (matchQnh) {
      return Number(matchQnh[1]);
    }
    return null;
  };

  // Helper to parse Temp from METAR
  const parseTempFromMetar = (metar: string): number | null => {
    if (!metar) return null;
    const match = metar.match(/(?:\s|^)(M?\d{2})\/(M?\d{2})?(?:\s|$)/);
    if (match) {
      let tempStr = match[1];
      if (tempStr.startsWith('M')) {
        return -Number(tempStr.substring(1));
      }
      return Number(tempStr);
    }
    return null;
  };

  // Helper to parse wind from METAR
  const parseWindFromMetar = (metar: string): { headwind: number; tailwind: number } => {
    if (!metar) return { headwind: 0, tailwind: 0 };
    const rwyMatch = flightData?.raw?.origin?.plan_rwy || '';
    const rwyHeading = rwyMatch ? parseInt(rwyMatch.replace(/[^0-9]/g, '')) * 10 : 0;
    
    const windMatch = metar.match(/(?:\s|^)(\d{3}|VRB)(\d{2,3})(?:G\d{2,3})?KT(?:\s|$)/);
    if (windMatch && rwyHeading) {
      const windDirStr = windMatch[1];
      const windSpd = parseInt(windMatch[2]);
      if (windDirStr === 'VRB') {
        return { headwind: 0, tailwind: 0 };
      }
      const windDir = parseInt(windDirStr);
      const angleRad = ((windDir - rwyHeading) * Math.PI) / 180;
      const headwind = windSpd * Math.cos(angleRad);
      if (headwind >= 0) {
        return { headwind: Math.round(headwind), tailwind: 0 };
      } else {
        return { headwind: 0, tailwind: Math.round(Math.abs(headwind)) };
      }
    }
    return { headwind: 0, tailwind: 0 };
  };

  // Auto-import SimBrief active plan details
  const importActiveFlightData = () => {
    if (!flightData || !flightData.raw) return;
    const raw = flightData.raw;
    
    // 1. Elevation
    if (raw.origin?.elevation) {
      setElevation(Number(raw.origin.elevation));
    }

    // 2. Metar weather
    if (raw.origin?.metar) {
      const parsedTemp = parseTempFromMetar(raw.origin.metar);
      if (parsedTemp !== null) setOat(parsedTemp);

      const parsedQnh = parseQnhFromMetar(raw.origin.metar);
      if (parsedQnh !== null) setQnh(parsedQnh);

      const { headwind, tailwind } = parseWindFromMetar(raw.origin.metar);
      if (headwind > 0) {
        setWindComponent(headwind);
      } else if (tailwind > 0) {
        setWindComponent(-tailwind);
      } else {
        setWindComponent(0);
      }
    }

    // 3. Weight
    const simbriefUnits = raw.params?.units || 'lbs';
    const estTow = Number(raw.weights?.est_tow || 0);
    if (estTow > 0) {
      if (simbriefUnits === 'kgs') {
        setWeightInput(estTow);
        setWeightUnit('kgs');
      } else {
        setWeightInput(estTow);
        setWeightUnit('lbs');
      }
    }

    // 4. Runway Length
    if (raw.origin?.rwy_length) {
      setRunwayInput(Number(raw.origin.rwy_length));
      setRunwayUnit('ft');
    }
  };

  // Trigger calculations whenever inputs change
  useEffect(() => {
    // Convert weight input to Pounds
    const weightLbs = weightUnit === 'kgs' 
      ? Number(kgToLbs(asKilograms(weightInput))) 
      : weightInput;

    // Convert runway input to Feet
    const runwayFt = runwayUnit === 'm' 
      ? runwayInput * 3.28084 
      : runwayInput;

    // Wind components
    const headwind = windComponent > 0 ? windComponent : 0;
    const tailwind = windComponent < 0 ? Math.abs(windComponent) : 0;

    try {
      const res = calculateTakeoffPerformance(
        asFeet(elevation),
        asHectopascals(qnh),
        asCelsius(oat),
        asPounds(weightLbs),
        asFeet(runwayFt),
        flaps,
        packsOff3,
        runwayDry,
        asKnots(headwind),
        asKnots(tailwind),
        melCdlPenalty,
        windshearProb,
        runwaySlope
      );
      setResults(res);
    } catch (e) {
      console.error(e);
      setResults(null);
    }
  }, [
    elevation, qnh, oat, weightInput, weightUnit, runwayInput, runwayUnit,
    windComponent, flaps, packsOff3, runwayDry, melCdlPenalty, windshearProb, runwaySlope
  ]);

  return (
    <div className="space-y-6 w-full">
      <header className="pb-2 flex items-center justify-between border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80 shadow-sm shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans uppercase">
              Takeoff Performance
            </h1>
            <p className="text-slate-500 font-medium text-xs mt-0.5">Boeing 747-200 JT9D-7A Takeoff Derate (Assumed OAT) and V-speeds QRH Calculator.</p>
          </div>
        </div>
        {flightData && (
          <button
            onClick={importActiveFlightData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-650 hover:bg-indigo-100 transition-colors rounded-xl text-xs font-bold shadow-sm animate-fade-in"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            Sync active SimBrief plan
          </button>
        )}
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* INPUTS COLUMN */}
        <section className="lg:col-span-5 space-y-6">
          <div className="card-panel">
            <h2 className="text-sm font-bold text-indigo-600 font-sans border-b border-slate-100 pb-2 uppercase tracking-wide flex items-center gap-2">
              ⚙️ Aircraft & Environment
            </h2>

            <div className="space-y-3">
              {/* Takeoff Weight */}
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Takeoff Weight</label>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5 focus-within:ring-1 focus-within:ring-indigo-500">
                  <input
                    type="number"
                    value={weightInput}
                    onChange={(e) => setWeightInput(Number(e.target.value))}
                    className="w-full border-none bg-transparent py-1.5 px-3 text-sm focus:outline-none font-bold"
                  />
                  <div className="inline-flex rounded-md border border-slate-150 p-0.5 bg-white">
                    <button
                      type="button"
                      onClick={() => {
                        if (weightUnit === 'kgs') {
                          setWeightInput(Math.round(weightInput * 2.20462));
                          setWeightUnit('lbs');
                        }
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${weightUnit === 'lbs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      lbs
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (weightUnit === 'lbs') {
                          setWeightInput(Math.round(weightInput / 2.20462));
                          setWeightUnit('kgs');
                        }
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${weightUnit === 'kgs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      kgs
                    </button>
                  </div>
                </div>
              </div>

              {/* Elevation & QNH */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-el" className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Airport Elevation (ft)</label>
                  <input
                    id="input-el"
                    type="number"
                    value={elevation}
                    onChange={(e) => setElevation(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="input-qnh" className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">QNH (hPa)</label>
                  <input
                    id="input-qnh"
                    type="number"
                    value={qnh}
                    onChange={(e) => setQnh(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* OAT & Wind Component */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-oat" className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Outside Air Temp (°C)</label>
                  <input
                    id="input-oat"
                    type="number"
                    value={oat}
                    onChange={(e) => setOat(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="input-wind" className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Wind (+Hdw / -Tlw)</label>
                  <div className="relative">
                    <input
                      id="input-wind"
                      type="number"
                      value={windComponent}
                      onChange={(e) => setWindComponent(Number(e.target.value))}
                      className="w-full pr-8 font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">KT</span>
                  </div>
                </div>
              </div>

              {/* Runway Length */}
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Available Runway</label>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5 focus-within:ring-1 focus-within:ring-indigo-500">
                  <input
                    type="number"
                    value={runwayInput}
                    onChange={(e) => setRunwayInput(Number(e.target.value))}
                    className="w-full border-none bg-transparent py-1.5 px-3 text-sm focus:outline-none font-bold"
                  />
                  <div className="inline-flex rounded-md border border-slate-150 p-0.5 bg-white">
                    <button
                      type="button"
                      onClick={() => {
                        if (runwayUnit === 'm') {
                          setRunwayInput(Math.round(runwayInput * 3.28084));
                          setRunwayUnit('ft');
                        }
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${runwayUnit === 'ft' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      ft
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (runwayUnit === 'ft') {
                          setRunwayInput(Math.round(runwayInput / 3.28084));
                          setRunwayUnit('m');
                        }
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${runwayUnit === 'm' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      m
                    </button>
                  </div>
                </div>
              </div>

              {/* Runway Slope */}
              <div>
                <label htmlFor="input-slope" className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Runway Slope (%)</label>
                <input
                  id="input-slope"
                  type="number"
                  step="0.1"
                  value={runwaySlope}
                  onChange={(e) => setRunwaySlope(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Flaps & Configuration */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Takeoff Flaps</span>
                  <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setFlaps(10)}
                      className={`flex-1 py-1 text-center font-extrabold rounded-md text-xs transition-all ${flaps === 10 ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Flaps 10
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlaps(20)}
                      className={`flex-1 py-1 text-center font-extrabold rounded-md text-xs transition-all ${flaps === 20 ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Flaps 20
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-1">Packs Configuration</span>
                  <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setPacksOff3(false)}
                      className={`flex-1 py-1 text-center font-extrabold rounded-md text-xs transition-all ${!packsOff3 ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setPacksOff3(true)}
                      className={`flex-1 py-1 text-center font-extrabold rounded-md text-xs transition-all ${packsOff3 ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      3 Packs OFF
                    </button>
                  </div>
                </div>
              </div>

              {/* Toggles Panel */}
              <div className="pt-2 space-y-2 border-t border-slate-100 mt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Dry Runway (Grooved considered dry)</span>
                  <input
                    type="checkbox"
                    checked={runwayDry}
                    onChange={(e) => setRunwayDry(e.target.checked)}
                    className="w-4 h-4 text-indigo-650 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">MEL / CDL Weight Penalties applied</span>
                  <input
                    type="checkbox"
                    checked={melCdlPenalty}
                    onChange={(e) => setMelCdlPenalty(e.target.checked)}
                    className="w-4 h-4 text-indigo-650 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Probability of Windshear exists</span>
                  <input
                    type="checkbox"
                    checked={windshearProb}
                    onChange={(e) => setWindshearProb(e.target.checked)}
                    className="w-4 h-4 text-indigo-650 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RESULTS COLUMN */}
        <section className="lg:col-span-7 space-y-6">
          
          {results ? (
            <>
              {/* ALLOWED STATE HEADER */}
              <div className={`card-panel border-l-4 ${results.DERATE_ALLOWED ? 'border-l-emerald-500 bg-emerald-50/40 text-emerald-800' : 'border-l-red-500 bg-red-50/40 text-red-800'}`}>
                <div className="flex items-start gap-4">
                  {results.DERATE_ALLOWED ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      {results.DERATE_ALLOWED ? "Reduced Thrust Takeoff Allowed" : "Reduced Takeoff Thrust RESTRICTED"}
                    </h3>
                    <p className="text-xs font-semibold leading-relaxed">
                      {results.DERATE_ALLOWED 
                        ? "Derated takeoff performance can be safely executed using assumed OAT method."
                        : "Standard takeoff thrust (MAX EPR) is mandatory due to following QRH constraints:"}
                    </p>
                    {results.RESTRICTION_REASONS.length > 0 && (
                      <ul className="list-disc pl-5 mt-2 text-xs font-medium space-y-1 font-mono">
                        {results.RESTRICTION_REASONS.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* THRUST TARGET CARD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* EPR ASSUMED TEMP CARD */}
                <div className="card-panel flex flex-col justify-between items-center text-center">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase mb-1">Assumed Temperature</div>
                  <div className="my-2">
                    <span className="text-4xl font-black text-indigo-650 font-mono">
                      {results.DERATE_ALLOWED ? `${results.ASSUMED_TEMP_C}°C` : '—'}
                    </span>
                    {results.DERATE_ALLOWED && (
                      <span className="text-xs text-slate-500 font-bold block mt-0.5">
                        {results.ASSUMED_TEMP_F}°F
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Assumed OAT for derating</div>
                </div>

                {/* REDUCED TAKE-OFF EPR */}
                <div className="card-panel flex flex-col justify-between items-center text-center">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase mb-1">Reduced Takeoff EPR</div>
                  <div className="my-2">
                    <span className="text-4xl font-black text-indigo-600 font-mono">
                      {results.DERATE_ALLOWED ? results.REDUCED_EPR : (results.MAX_EPR || '—')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Set Engine Pressure Ratio</div>
                </div>

                {/* MAX TAKEOFF EPR */}
                <div className="card-panel flex flex-col justify-between items-center text-center">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase mb-1">Max Takeoff EPR</div>
                  <div className="my-2">
                    <span className="text-4xl font-black text-slate-700 font-mono">
                      {results.MAX_EPR || '—'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Full thrust limit (Standard OAT)</div>
                </div>

              </div>

              {/* V-SPEED CARD */}
              <div className="card-panel border-indigo-150 bg-slate-50 relative overflow-hidden">
                <h3 className="text-xs font-bold uppercase tracking-wide text-indigo-650 border-b border-slate-200 pb-2 mb-4 flex items-center gap-1.5">
                  ⚡ Takeoff Speedcard (Assumed OAT V-speeds)
                </h3>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase block font-sans">Decision Speed</span>
                    <span className="text-5xl font-black font-mono tracking-tight text-slate-800 block my-1">V₁</span>
                    <span className="text-base font-extrabold font-mono text-indigo-600">{results.V1} KT</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase block font-sans">Rotation Speed</span>
                    <span className="text-5xl font-black font-mono tracking-tight text-slate-800 block my-1">VR</span>
                    <span className="text-base font-extrabold font-mono text-indigo-600">{results.VR} KT</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase block font-sans">Safety Speed</span>
                    <span className="text-5xl font-black font-mono tracking-tight text-slate-800 block my-1">V₂</span>
                    <span className="text-base font-extrabold font-mono text-indigo-600">{results.V2} KT</span>
                  </div>
                </div>
              </div>

              {/* DETAILED RESULTS & WEIGHT MARGINS */}
              <div className="card-panel space-y-4">
                <h3 className="text-sm font-bold text-indigo-650 border-b border-slate-100 pb-2 uppercase tracking-wide">
                  📉 Performance Limits & Margins
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  
                  {/* Left Column values */}
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-slate-100/50 pb-1.5">
                      <span className="text-slate-500 font-semibold">Pressure Altitude:</span>
                      <span className="font-bold text-slate-800 font-mono">{results.PA_ft.toLocaleString()} ft</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100/50 pb-1.5">
                      <span className="text-slate-500 font-semibold">Target Climb EPR:</span>
                      <span className="font-bold text-slate-800 font-mono">{results.CLIMB_EPR}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100/50 pb-1.5">
                      <span className="text-slate-500 font-semibold">Thrust Reduction Ratio:</span>
                      <span className="font-bold text-indigo-650 font-mono">{Math.round((1 - results.THRUST_RATIO) * 100)}%</span>
                    </div>
                  </div>

                  {/* Right Column values */}
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-slate-100/50 pb-1.5">
                      <span className="text-slate-500 font-semibold">Climb-Limited Weight:</span>
                      <span className="font-bold text-slate-800 font-mono">{results.CLIMB_LIMIT_WEIGHT.toLocaleString()} k lbs</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100/50 pb-1.5">
                      <span className="text-slate-500 font-semibold">Runway-Limited Weight:</span>
                      <span className="font-bold text-slate-800 font-mono">{results.RUNWAY_LIMIT_WEIGHT.toLocaleString()} k lbs</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100/50 pb-1.5">
                      <span className="text-slate-500 font-semibold">Takeoff Weight Margin:</span>
                      <span className={`font-black font-mono ${results.WEIGHT_MARGIN_K_LBS >= 0 ? 'text-emerald-600' : 'text-red-650'}`}>
                        {results.WEIGHT_MARGIN_K_LBS >= 0 ? '+' : ''}{results.WEIGHT_MARGIN_K_LBS.toLocaleString()} k lbs
                      </span>
                    </div>
                  </div>

                </div>

                {/* Runway distance comparison bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] font-extrabold uppercase text-slate-400 mb-1.5">
                    <span>Takeoff Distance (Required vs Available)</span>
                    <span className="font-mono text-slate-600">{results.DIST_REQUIRED_M}m / {results.RUNWAY_AVAILABLE_M}m</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-200 overflow-hidden relative shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${results.DIST_REQUIRED_M > results.RUNWAY_AVAILABLE_M ? 'bg-red-500' : results.DIST_REQUIRED_M > results.RUNWAY_AVAILABLE_M * 0.85 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                      style={{ width: `${Math.min(100, (results.DIST_REQUIRED_M / results.RUNWAY_AVAILABLE_M) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono mt-1">
                    <span>{results.DIST_REQUIRED_FT.toLocaleString()} ft required</span>
                    <span>{results.RUNWAY_AVAILABLE_FT.toLocaleString()} ft available</span>
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="card-panel text-center text-slate-400 py-12">
              <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-sm">Enter inputs to calculate takeoff performance parameters.</p>
            </div>
          )}

        </section>

      </div>
    </div>
  );
}
