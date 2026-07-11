'use client';

import React, { useState } from 'react';
import { calculateISA, speedOfSoundKnots } from '@classic-flight-engineer/performance-engine';
import { asFeet, asCelsius } from '@classic-flight-engineer/aviation-domain';

import { Thermometer } from 'lucide-react';

export default function AtmosferaPage() {
  const [altitude, setAltitude] = useState(30000);
  const [temperature, setTemperature] = useState(-45);

  const isaData = calculateISA(asFeet(altitude), asCelsius(temperature));
  const soundSpeed = speedOfSoundKnots(asCelsius(temperature));

  return (
    <div className="space-y-6 w-full">
      <header className="pb-2 flex items-center gap-3 border-b border-slate-200/60">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80 shadow-sm shrink-0">
          <Thermometer className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans uppercase">
            Atmosphere Calculator (ISA)
          </h1>
          <p className="text-slate-500 font-medium text-xs mt-0.5">International Standard Atmosphere temperature, pressure, and sound speed ratios.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-panel">
          <h3 className="text-sm font-bold text-indigo-600 font-sans border-b border-slate-100 pb-2 uppercase tracking-wide">INPUT PARAMETERS</h3>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label htmlFor="input-alt">Altitude (ft)</label>
              <input
                id="input-alt"
                type="number"
                className="w-full"
                value={altitude}
                onChange={(e) => setAltitude(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="input-temp">Outside Air Temp (°C)</label>
              <input
                id="input-temp"
                type="number"
                className="w-full"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="card-panel glow-cyan">
          <h3 className="text-sm font-bold text-indigo-600 font-sans border-b border-slate-100 pb-2 uppercase tracking-wide">ISA OUTPUTS</h3>
          <div className="space-y-3 font-mono text-sm pt-2">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Standard Temperature:</span>
              <span className="font-bold text-slate-900">{isaData.standardTempC.toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Lapse Deviation (ISA Delta):</span>
              <span className={`font-bold ${isaData.deltaTempC > 0 ? 'text-amber-600' : 'text-indigo-600'}`}>
                {isaData.deltaTempC > 0 ? `+${isaData.deltaTempC.toFixed(1)}` : isaData.deltaTempC.toFixed(1)} °C
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Atmospheric Pressure:</span>
              <span className="font-bold text-slate-900">{isaData.pressureHpa.toFixed(1)} hPa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Speed of Sound:</span>
              <span className="font-bold text-slate-900">{soundSpeed.toFixed(1)} kts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
