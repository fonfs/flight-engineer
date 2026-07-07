'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../components/AppContext';

export default function DashboardClient() {
  const { flightData } = useApp();
  const flightContext = flightData?.flightContext;

  return (
    <main className="space-y-8 max-w-5xl mx-auto py-6 font-sans">
      {/* Hero Welcome Panel */}
      <div className="relative p-8 rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-indigo-100 text-indigo-600 bg-indigo-50 text-xs font-semibold py-1 px-3">
              <span className="w-1.5 h-1.5 mr-2 inline-block bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
              INTEGRATED FLIGHT ENGINEERING SYSTEM
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Classic Flight Engineer
          </h2>
          
          <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
            Precision digital panel designed for Boeing 747-200 flight simulation. Calculate speeds, climb gradients, ISA deviations and fuel burn without any data persistence or server-side logging.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link to="/import" className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all transform hover:-translate-y-0.5 shadow-sm shadow-indigo-500/10">
              🚀 Import Flight Plan
            </Link>
            <Link to="/subida" className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all transform hover:-translate-y-0.5">
              ↗ Plan Climb
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-slate-200 bg-white hover:shadow-md transition-all rounded-2xl p-6 relative">
          <div className="mb-4">
            <span className="text-3xl block mb-2">✈</span>
            <h3 className="text-base font-bold text-slate-900">Flight Monitoring</h3>
          </div>
          <div className="space-y-3">
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              {flightContext ? (
                <span className="text-emerald-600 font-bold font-mono">
                  Active: {flightContext.callsign} ({flightContext.origin} &rarr; {flightContext.destination})
                </span>
              ) : (
                "No flight loaded. Import a SimBrief plan to view weight and fuel profiles."
              )}
            </p>
            {flightContext && (
              <div>
                <Link to="/import" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                  View Details &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="border border-slate-200 bg-white hover:shadow-md transition-all rounded-2xl p-6 relative">
          <div className="mb-4">
            <span className="text-3xl block mb-2">📈</span>
            <h3 className="text-base font-bold text-slate-900">Vertical Profile</h3>
          </div>
          <div className="space-y-3">
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Generate real-time flight trajectory and altitude diagrams based on entered constraints and meteorology.
            </p>
            <div>
              <Link to="/perfil" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                Go to Profile &rarr;
              </Link>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 bg-white hover:shadow-md transition-all rounded-2xl p-6 relative">
          <div className="mb-4">
            <span className="text-3xl block mb-2">🌡</span>
            <h3 className="text-base font-bold text-slate-900">Atmospheric Calculations</h3>
          </div>
          <div className="space-y-3">
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Monitor the ISA standard atmosphere, true airspeeds and QNH pressures required for B742 operations.
            </p>
            <div>
              <Link to="/atmosfera" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                Calculate ISA &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
