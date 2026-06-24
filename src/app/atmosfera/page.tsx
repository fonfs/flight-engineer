'use client';

import React, { useState } from 'react';
import { calculateISA, speedOfSoundKnots } from '@classic-flight-engineer/performance-engine';
import { asFeet, asCelsius } from '@classic-flight-engineer/aviation-domain';

export default function AtmosferaPage() {
  const [altitude, setAltitude] = useState(30000);
  const [temperature, setTemperature] = useState(-45);

  const isaData = calculateISA(asFeet(altitude), asCelsius(temperature));
  const soundSpeed = speedOfSoundKnots(asCelsius(temperature));

  return (
    <main className="space-y-6 max-w-4xl">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider font-mono text-cyan-400">ATMOSPHERE CALCULATOR // ISA</h1>
        <p className="text-sm text-slate-400 mt-1">International Standard Atmosphere temperature, pressure, and sound speed ratios.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-panel">
          <h3 className="text-sm font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">INPUT PARAMETERS</h3>
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
          <h3 className="text-sm font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">ISA OUTPUTS</h3>
          <div className="space-y-3 font-mono text-sm pt-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Standard Temperature:</span>
              <span>{isaData.standardTempC.toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lapse Deviation (ISA Delta):</span>
              <span className={isaData.deltaTempC > 0 ? 'text-amber-400' : 'text-cyan-400'}>
                {isaData.deltaTempC > 0 ? `+${isaData.deltaTempC.toFixed(1)}` : isaData.deltaTempC.toFixed(1)} °C
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Atmospheric Pressure:</span>
              <span>{isaData.pressureHpa.toFixed(1)} hPa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Speed of Sound:</span>
              <span>{soundSpeed.toFixed(1)} kts</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
