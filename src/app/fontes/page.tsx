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
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider font-mono text-cyan-400">DATA REVISIONS & SOURCES</h1>
        <p className="text-sm text-slate-400 mt-1">Audit logs of aviation charts and calculation matrices.</p>
      </header>

      <div className="space-y-6">
        <div className="card-panel border-amber-800/40 bg-amber-950/5">
          <h3 className="text-sm font-bold text-amber-400 font-mono border-b border-amber-800/20 pb-2">⚠️ SYSTEM DATA POLICY</h3>
          <p className="text-sm text-slate-300 font-mono leading-relaxed pt-2">
            No performance coefficients or thresholds inside this engine are approximated or guessed. Real flight planner engines require verified FCOM publications. Currently active profiles are utilizing demonstration stubs marked as non-operational.
          </p>
        </div>

        {references.map((r, idx) => (
          <div key={idx} className="card-panel">
            <h4 className="text-md font-bold text-slate-200 font-mono">{r.doc}</h4>
            <div className="space-y-2 font-mono text-sm pt-2">
              <div className="flex justify-between"><span className="text-slate-500">Target Section:</span><span>{r.section}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Revision Code:</span><span>{r.revision}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Audit Status:</span><span className="text-amber-500 font-bold">{r.status}</span></div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
