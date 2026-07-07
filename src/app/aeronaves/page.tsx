import React from 'react';

export default function AeronavesPage() {
  const models = [
    {
      variant: 'Boeing 747-200B',
      payload: '170,000 lbs',
      mtow: '830,000 lbs',
      mlw: '564,000 lbs',
      engines: ['Pratt & Whitney JT9D-7A', 'General Electric CF6-50', 'Rolls-Royce RB211-524']
    },
    {
      variant: 'Boeing 747-200F (Freighter)',
      payload: '240,000 lbs',
      mtow: '830,000 lbs',
      mlw: '630,000 lbs',
      engines: ['Pratt & Whitney JT9D-7Q', 'General Electric CF6-50E2']
    }
  ];

  return (
    <main className="space-y-6 max-w-5xl">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">AIRCRAFT & ENGINES CONFIG</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Configured airframe models, variants, and engine types.</p>
      </header>

      <div className="space-y-6">
        {models.map((m, idx) => (
          <div key={idx} className="card-panel">
            <h3 className="text-base font-bold text-indigo-600 font-sans border-b border-slate-100 pb-2">{m.variant}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2 font-mono text-sm text-slate-800">
                <div className="flex justify-between"><span className="text-slate-500">Max Takeoff Weight:</span><span className="font-bold text-slate-950">{m.mtow}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Max Landing Weight:</span><span className="font-bold text-slate-950">{m.mlw}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Max Payload Weight:</span><span className="font-bold text-slate-950">{m.payload}</span></div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 block font-sans tracking-wider uppercase">SUPPORTED ENGINE CONFIGURATIONS</span>
                <ul className="list-disc pl-5 font-sans text-sm text-slate-700 space-y-1">
                  {m.engines.map((e, eIdx) => (
                    <li key={eIdx} className="font-medium">{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
