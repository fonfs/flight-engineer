import { BookOpen } from 'lucide-react';

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
    <div className="space-y-6 w-full">
      <header className="pb-2 flex items-center gap-3 border-b border-slate-200/60">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80 shadow-sm shrink-0">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans uppercase">
            Data Revisions & Sources
          </h1>
          <p className="text-slate-500 font-medium text-xs mt-0.5">Audit logs of aviation charts and calculation matrices.</p>
        </div>
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
    </div>
  );
}
