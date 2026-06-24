'use client';

import React, { useState } from 'react';
import { calculateISA } from '@classic-flight-engineer/performance-engine';
import { asFeet, asCelsius } from '@classic-flight-engineer/aviation-domain';

export default function ClimbPlannerPage() {
  const [initAlt, setInitAlt] = useState(1000);
  const [finalAlt, setFinalAlt] = useState(31000);
  const [weight, setWeight] = useState(650000);
  const [tempOAT, setTempOAT] = useState(15);
  const [climbRate, setClimbRate] = useState(1500); // ft/min
  const [fuelBurnFlow, setFuelBurnFlow] = useState(24000); // lbs/hour

  // Math engine logic calculating climb time, fuel and distance
  // Time = (FinalAlt - InitAlt) / ClimbRate (minutes)
  // Fuel = Time (hours) * FuelBurnFlow
  // Distance = Time (min) * (average speed / 60)
  const climbAltDelta = finalAlt - initAlt;
  const climbTimeMin = climbAltDelta > 0 ? climbAltDelta / climbRate : 0;
  const climbFuelLbs = (climbTimeMin / 60) * fuelBurnFlow;
  
  // Calculate average TAS in climb (rough estimate for demo using sound speed at mid-altitude)
  const midAlt = initAlt + (climbAltDelta / 2);
  const isaMid = calculateISA(asFeet(midAlt), asCelsius(tempOAT));
  // Average ground speed ~ 320 knots
  const climbDistanceNm = (climbTimeMin / 60) * 320;

  return (
    <main className="space-y-6 max-w-5xl">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider font-mono text-cyan-400">CLIMB PERFORMANCE PLANNER</h1>
        <p className="text-sm text-slate-400 mt-1">Calculate climb segments, target rates, and fuel parameters.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-panel">
          <h3 className="text-sm font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">CLIMB SEGMENTS</h3>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label htmlFor="input-init-alt">Initial Altitude (ft)</label>
              <input
                id="input-init-alt"
                type="number"
                className="w-full"
                value={initAlt}
                onChange={(e) => setInitAlt(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="input-final-alt">Final Altitude (ft)</label>
              <input
                id="input-final-alt"
                type="number"
                className="w-full"
                value={finalAlt}
                onChange={(e) => setFinalAlt(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="input-wt">A/C Weight (lbs)</label>
              <input
                id="input-wt"
                type="number"
                className="w-full"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="input-temp-oat">Runway Temp (°C)</label>
              <input
                id="input-temp-oat"
                type="number"
                className="w-full"
                value={tempOAT}
                onChange={(e) => setTempOAT(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="input-rate">Climb Rate (ft/min)</label>
              <input
                id="input-rate"
                type="number"
                className="w-full"
                value={climbRate}
                onChange={(e) => setClimbRate(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="input-flow">Avg Fuel Flow (lbs/hr)</label>
              <input
                id="input-flow"
                type="number"
                className="w-full"
                value={fuelBurnFlow}
                onChange={(e) => setFuelBurnFlow(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="card-panel glow-cyan flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">CALCULATED OUTPUTS</h3>
            <div className="space-y-3 font-mono text-sm pt-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Time to Climb:</span>
                <span className="text-lg font-bold">{climbTimeMin.toFixed(1)} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Climb Fuel Burn:</span>
                <span className="text-lg font-bold text-emerald-400">{climbFuelLbs.toFixed(0)} lbs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Climb Distance:</span>
                <span className="text-lg font-bold">{climbDistanceNm.toFixed(1)} NM</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-xs">
                <span className="text-slate-500">Mid-Altitude ISA Temp:</span>
                <span>{isaMid.standardTempC.toFixed(1)} °C</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-amber-950/20 border border-amber-800/40 rounded text-[10px] font-mono text-amber-400">
            <span>* calculations are using demo engine version v1.0.0</span>
          </div>
        </div>
      </div>
    </main>
  );
}
