'use client';

import React, { useState } from 'react';
import { kgToLbs, lbsToKg, asKilograms, asPounds } from '@classic-flight-engineer/unit-system';

export default function ConversorPage() {
  const [lbsValue, setLbsValue] = useState(10000);
  const [kgValue, setKgValue] = useState(4536);

  const convertedKg = lbsToKg(asPounds(lbsValue)).toFixed(0);
  const convertedLbs = kgToLbs(asKilograms(kgValue)).toFixed(0);

  return (
    <main className="space-y-6 max-w-4xl">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">UNIT CONVERTER // WEIGHT SYSTEM</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Convert aviation weights between Pounds and Kilograms safely.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-panel">
          <h3 className="text-sm font-bold text-indigo-600 font-sans border-b border-slate-100 pb-2 uppercase tracking-wide">POUNDS TO KILOGRAMS</h3>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label htmlFor="input-lbs">Pounds (lbs)</label>
              <input
                id="input-lbs"
                type="number"
                className="w-full"
                value={lbsValue}
                onChange={(e) => setLbsValue(Number(e.target.value))}
              />
            </div>
            <div className="pt-2 font-sans text-sm">
              <span className="text-slate-500">Result:</span>
              <p className="text-2xl font-extrabold text-indigo-650 font-mono mt-1">{convertedKg} kgs</p>
            </div>
          </div>
        </div>

        <div className="card-panel">
          <h3 className="text-sm font-bold text-indigo-600 font-sans border-b border-slate-100 pb-2 uppercase tracking-wide">KILOGRAMS TO POUNDS</h3>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label htmlFor="input-kgs">Kilograms (kgs)</label>
              <input
                id="input-kgs"
                type="number"
                className="w-full"
                value={kgValue}
                onChange={(e) => setKgValue(Number(e.target.value))}
              />
            </div>
            <div className="pt-2 font-sans text-sm">
              <span className="text-slate-500">Result:</span>
              <p className="text-2xl font-extrabold text-indigo-650 font-mono mt-1">{convertedLbs} lbs</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
