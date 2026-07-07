import React from 'react';

export default function FontesPage() {
  const references = [
    {
      doc: 'Boeing 747-200 AOM (Airplane Operations Manual)',
      section: 'Section 4 - Climb, Cruise, and Descent Performance Charts',
      status: 'STUB DATA APPLIED (DEMONSTRATION ONLY)',
      revision: 'v1.0.0-demo-initial'
    },
    {
      doc: 'Pratt & Whitney JT9D Engine Operating Specifications',
      section: 'Table 2 - Max Takeoff / Continuous Thrust EPR Targets',
      status: 'STUB DATA APPLIED (DEMONSTRATION ONLY)',
      revision: 'v1.0.0-demo-initial'
    }
  ];

  return (
    <main className="space-y-6 max-w-4xl">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">DATA REVISIONS & SOURCES</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Audit logs of aviation charts and calculation matrices.</p>
      </header>

      <div className="space-y-6">
        <div className="card-panel border-amber-200 bg-amber-50/60 shadow-[0_2px_12px_rgba(217,119,6,0.02)]">
          <h3 className="text-sm font-bold text-amber-800 font-sans border-b border-amber-200/60 pb-2 uppercase tracking-wide">⚠️ SYSTEM DATA POLICY</h3>
          <p className="text-xs text-amber-900 leading-relaxed pt-2">
            No performance coefficients or thresholds inside this engine are approximated or guessed. Real flight planner engines require verified FCOM publications. Currently active profiles are utilizing demonstration stubs marked as non-operational.
          </p>
        </div>

        {references.map((r, idx) => (
          <div key={idx} className="card-panel">
            <h4 className="text-base font-bold text-indigo-600 font-sans">{r.doc}</h4>
            <div className="space-y-2 font-mono text-sm pt-2 text-slate-800">
              <div className="flex justify-between"><span className="text-slate-500 font-sans">Target Section:</span><span className="font-bold text-slate-900">{r.section}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-sans">Revision Code:</span><span className="font-bold text-slate-900">{r.revision}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-sans">Audit Status:</span><span className="text-amber-600 font-bold font-mono">{r.status}</span></div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
