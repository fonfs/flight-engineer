import { FlightContext } from '@classic-flight-engineer/aviation-domain';

interface PerfilPageProps {
  flightData: {
    flightContext: FlightContext;
    warnings: string[];
    raw: any;
  } | null;
}

export default function PerfilPage({ flightData }: PerfilPageProps) {
  return (
    <main className="space-y-6 max-w-4xl">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider font-mono text-cyan-400">FLIGHT VERTICAL PROFILE</h1>
        <p className="text-sm text-slate-400 mt-1">Calculated vertical trajectory with climb, cruise steps, and descent sectors.</p>
      </header>

      <section className="card-panel glow-cyan">
        <h3 className="text-sm font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">VERTICAL FLIGHTPATH DIAGRAM</h3>
        
        <div className="pt-4 flex justify-center">
          <svg viewBox="0 0 600 220" className="w-full max-w-2xl bg-black/40 border border-slate-800 rounded">
            {/* Grid Lines */}
            <line x1="50" y1="30" x2="550" y2="30" stroke="#1f2937" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="50" y1="100" x2="550" y2="100" stroke="#1f2937" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="50" y1="170" x2="550" y2="170" stroke="#1f2937" strokeWidth="1" />

            {/* Profile Path Line */}
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3"
              points="50,170 120,50 480,50 550,170"
            />

            {/* TOC & TOD dots */}
            <circle cx="120" cy="50" r="5" fill="#10b981" />
            <circle cx="480" cy="50" r="5" fill="#f59e0b" />

            {/* Labels */}
            <text x="50" y="190" fill="#9ca3af" fontSize="10" fontFamily="monospace" textAnchor="middle">SBGL (DEP)</text>
            <text x="120" y="35" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle">TOC (FL330)</text>
            <text x="480" y="35" fill="#f59e0b" fontSize="10" fontFamily="monospace" textAnchor="middle">TOD</text>
            <text x="550" y="190" fill="#9ca3af" fontSize="10" fontFamily="monospace" textAnchor="middle">KJFK (ARR)</text>
          </svg>
        </div>
      </section>
    </main>
  );
}
