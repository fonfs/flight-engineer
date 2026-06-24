'use client';

import React, { useState, useEffect } from 'react';
import { parseAndNormalizeSimBrief } from '@classic-flight-engineer/simbrief-adapter';
import { FlightContext } from '@classic-flight-engineer/aviation-domain';

interface DashboardPageProps {
  flightData: {
    flightContext: FlightContext;
    warnings: string[];
    raw: any;
  } | null;
}

export default function DashboardPage({ flightData }: DashboardPageProps) {
  const flightContext = flightData?.flightContext;
  const dataRevision = flightData ? 'v1.0.0 (IN-MEMORY DATA)' : 'NO FLIGHT DATA LOADED';

  if (!flightContext) {
    return (
      <main className="space-y-6 max-w-6xl">
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-extrabold tracking-wider font-mono text-cyan-400">FLIGHT STATUS MONITOR</h1>
          <p className="text-sm text-slate-400 mt-1">No flight operational plan has been loaded yet.</p>
        </header>
      </main>
    );
  }

  return (
    <main className="space-y-6 max-w-6xl">
      <header className="border-b border-slate-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wider font-mono text-cyan-400">FLIGHT STATUS MONITOR</h1>
          <p className="text-sm text-slate-400 mt-1">Overview of currently loaded operation.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded text-right font-mono text-xs">
          <span className="text-slate-500 block">DATA PACKAGE REVISION</span>
          <span className="text-amber-400 font-bold">{dataRevision}</span>
        </div>
      </header>

      {/* Grid containing flight specs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-panel glow-cyan">
          <h3 className="text-sm font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">✈ FLIGHT IDENTITY</h3>
          <div className="space-y-2 font-mono text-sm pt-2">
            <div className="flex justify-between"><span className="text-slate-500">Callsign:</span><span>{flightContext.callsign}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Flight No:</span><span>{flightContext.flightNumber}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Routing:</span><span>{flightContext.origin} → {flightContext.destination}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Aircraft:</span><span>{flightContext.aircraftVariant}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Engine:</span><span>{flightContext.engineVariant}</span></div>
          </div>
        </div>

        <div className="card-panel glow-cyan">
          <h3 className="text-sm font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">⚖ LOAD PROFILE</h3>
          <div className="space-y-2 font-mono text-sm pt-2">
            <div className="flex justify-between"><span className="text-slate-500">Zero Fuel Wt:</span><span>{flightContext.zeroFuelWeight} kg</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Takeoff Wt:</span><span>{flightContext.takeoffWeight} kg</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Landing Wt:</span><span>{flightContext.landingWeight} kg</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Payload Wt:</span><span>{flightContext.payload} kg</span></div>
          </div>
        </div>

        <div className="card-panel glow-cyan">
          <h3 className="text-sm font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">⛽ FUEL QUANTITY</h3>
          <div className="space-y-2 font-mono text-sm pt-2">
            <div className="flex justify-between"><span className="text-slate-500">Block Fuel:</span><span>{flightContext.blockFuel} kg</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Trip Burn:</span><span>{flightContext.tripFuel} kg</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Reserve Fuel:</span><span>{flightContext.reserveFuel} kg</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Taxi Out/In:</span><span>{flightContext.taxiFuel} kg</span></div>
          </div>
        </div>
      </section>

      {/* Warnings & Tools status card */}
      <section className="card-panel">
        <h3 className="text-sm font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">SYSTEM WARNINGS & CHECK STATUS</h3>
        <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded flex items-start gap-4">
          <span className="text-2xl text-amber-500 font-mono">⚠️</span>
          <div className="font-mono text-xs text-amber-400 space-y-1">
            <span className="font-bold block">DEMONSTRATION MODE ACTIVE</span>
            <span>Performance calculations utilize uncertified demonstration data. Extrapolation is blocked across all math interpolations.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
