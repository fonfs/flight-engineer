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
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider font-mono text-cyan-400">AIRCRAFT & ENGINES CONFIG</h1>
        <p className="text-sm text-slate-400 mt-1">Configured airframe models, variants, and engine types.</p>
      </header>

      <div className="space-y-6">
        {models.map((m, idx) => (
          <div key={idx} className="card-panel">
            <h3 className="text-lg font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">{m.variant}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Max Takeoff Weight:</span><span>{m.mtow}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Max Landing Weight:</span><span>{m.mlw}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Max Payload Weight:</span><span>{m.payload}</span></div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 block font-mono">SUPPORTED ENGINE CONFIGURATIONS</span>
                <ul className="list-disc pl-5 font-mono text-sm text-slate-300 space-y-1">
                  {m.engines.map((e, eIdx) => (
                    <li key={eIdx}>{e}</li>
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
