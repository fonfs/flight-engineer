'use client';

import { useApp } from '../../components/AppContext';
import { LineChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PerfilPage() {
  const { flightData } = useApp();

  // Helper to extract fixes from raw SimBrief JSON data
  const getNavlogFixes = (raw: any): any[] => {
    if (!raw || !raw.navlog) return [];
    let list = raw.navlog;
    if (list.fix) {
      list = list.fix;
    }
    if (Array.isArray(list)) {
      if (list.length > 0 && Array.isArray(list[0])) {
        return list[0];
      }
      return list;
    }
    if (typeof list === 'object' && list !== null) {
      const values = Object.values(list);
      if (values.length > 0 && values.every((v: any) => v && typeof v === 'object')) {
        return values;
      }
      return [list];
    }
    return [];
  };

  const raw = flightData?.raw;
  const rawFixes = getNavlogFixes(raw);

  // Setup vertical path data points
  let points: { ident: string; fl: number; cumulativeDistance: number }[] = [];
  let totalDistance = 0;
  let maxFL = 330; // default minimum ceiling for scaling

  const originICAO = raw?.origin?.icao_code || flightData?.flightContext?.origin || 'SBGL';
  const destICAO = raw?.destination?.icao_code || flightData?.flightContext?.destination || 'KJFK';
  const depElevation = Number(raw?.origin?.elevation || flightData?.flightContext?.departureElevation || 0);
  const destElevation = Number(raw?.destination?.elevation || flightData?.flightContext?.destinationElevation || 0);

  if (rawFixes.length > 0) {
    // Start with departure airport
    points.push({
      ident: originICAO,
      fl: Math.round(depElevation / 100),
      cumulativeDistance: 0,
    });

    let cumulativeDist = 0;
    rawFixes.forEach((fix: any) => {
      const dist = Number(fix.distance || 0);
      cumulativeDist += dist;

      const flValue = fix.fl !== undefined && fix.fl !== null && fix.fl !== '' ? String(fix.fl) : '';
      const feetValue = fix.altitude_feet !== undefined && fix.altitude_feet !== null && fix.altitude_feet !== '' ? Number(fix.altitude_feet) : NaN;
      let fl = 0;
      if (!isNaN(feetValue) && feetValue > 0) {
        fl = Math.round(feetValue / 100);
      } else if (flValue !== '') {
        fl = Number(flValue);
      }

      if (fl > maxFL) {
        maxFL = fl;
      }

      // If the fix is the origin ICAO, don't duplicate it.
      if (fix.ident === originICAO && points.length === 1) {
        points[0].fl = fl;
        return;
      }

      points.push({
        ident: fix.ident || '?',
        fl,
        cumulativeDistance: cumulativeDist,
      });
    });

    totalDistance = cumulativeDist;

    // Check if the last fix is already the destination, if not, append it
    const lastFix = points[points.length - 1];
    if (lastFix.ident !== destICAO) {
      points.push({
        ident: destICAO,
        fl: Math.round(destElevation / 100),
        cumulativeDistance: totalDistance,
      });
    } else {
      lastFix.fl = Math.round(destElevation / 100);
    }
  }

  // SVG coordinate mapping configuration
  const xMin = 60;
  const xMax = 540;
  const yMin = 170; // ground level
  const yMax = 30;  // cruise ceiling

  const getX = (dist: number) => {
    if (totalDistance === 0) return xMin;
    return xMin + (dist / totalDistance) * (xMax - xMin);
  };

  const getY = (fl: number) => {
    if (maxFL === 0) return yMin;
    return yMin - (fl / maxFL) * (yMin - yMax);
  };

  // Compile enroute labels to draw
  const labelsToRender: { x: number; y: number; text: string; subText?: string; color: string; dotColor: string; key: string }[] = [];

  if (points.length > 0) {
    // Departure Label
    labelsToRender.push({
      x: getX(0),
      y: yMin,
      text: originICAO,
      subText: `(DEP)`,
      color: '#475569',
      dotColor: '#4f46e5',
      key: 'dep-label',
    });

    // Arrival Label
    labelsToRender.push({
      x: getX(totalDistance),
      y: yMin,
      text: destICAO,
      subText: `(ARR)`,
      color: '#475569',
      dotColor: '#4f46e5',
      key: 'arr-label',
    });

    // Intermediate Waypoints (TOC, TOD, Steps)
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i];
      const prev = points[i - 1];

      const isTOC = p.ident.toUpperCase().includes('TOC');
      const isTOD = p.ident.toUpperCase().includes('TOD');
      const isStep = p.fl !== prev.fl && prev.fl > 0 && p.fl > 0 && !isTOC && !isTOD;

      if (isTOC) {
        labelsToRender.push({
          x: getX(p.cumulativeDistance),
          y: getY(p.fl),
          text: `TOC`,
          subText: `(FL${p.fl})`,
          color: '#059669',
          dotColor: '#059669',
          key: `toc-${i}`,
        });
      } else if (isTOD) {
        labelsToRender.push({
          x: getX(p.cumulativeDistance),
          y: getY(p.fl),
          text: `TOD`,
          subText: `(FL${prev.fl})`,
          color: '#d97706',
          dotColor: '#d97706',
          key: `tod-${i}`,
        });
      } else if (isStep) {
        const stepType = p.fl > prev.fl ? '▲' : '▼';
        labelsToRender.push({
          x: getX(p.cumulativeDistance),
          y: getY(p.fl),
          text: `${p.ident}`,
          subText: `${stepType}FL${p.fl}`,
          color: '#4f46e5',
          dotColor: '#4f46e5',
          key: `step-${i}`,
        });
      }
    }
  }

  const fallbackPoints = [
    { ident: originICAO, fl: 0, cumulativeDistance: 0 },
    { ident: 'TOC', fl: 330, cumulativeDistance: 120 },
    { ident: 'TOD', fl: 330, cumulativeDistance: 480 },
    { ident: destICAO, fl: 0, cumulativeDistance: 550 }
  ];
  const chartData = points.length > 0 ? points : fallbackPoints;

  const getAltitudeColor = (fl: number): string => {
    const limit = maxFL + 20;
    const pct = limit > 0 ? fl / limit : 0;
    if (pct >= 0.95) return '#ff0000'; // Red
    if (pct >= 0.85) return '#ff00ff'; // Magenta
    if (pct >= 0.75) return '#7e57c2'; // Purple
    if (pct >= 0.65) return '#3f51b5'; // Indigo
    if (pct >= 0.50) return '#0050ff'; // Blue
    if (pct >= 0.35) return '#00ffcc'; // Cyan
    if (pct >= 0.20) return '#00ff00'; // Green
    if (pct >= 0.10) return '#ffff00'; // Yellow
    if (pct >= 0.02) return '#ffd27f'; // Orange/Yellow
    return '#ffffff'; // White
  };


  // ─── TOD Calculator logic ─────────────────────────────────────────────────
  // Find the TOD fix index in the navlog
  const todIndex = rawFixes.findIndex((f: any) =>
    String(f.ident || '').toUpperCase().includes('TOD')
  );
  const todFix = todIndex >= 0 ? rawFixes[todIndex] : null;

  // Altitude at TOD (feet). SimBrief provides altitude_feet directly.
  const todAltitudeFt = todFix
    ? (Number(todFix.altitude_feet || 0) || Number(todFix.fl || 0) * 100 || 0)
    : Number(raw?.general?.initial_altitude || 0);

  // Cumulative distance to TOD: SimBrief only has per-leg `distance`,
  // so we sum all leg distances from the start up to and including the TOD fix.
  const todCumulativeDist = (() => {
    if (todIndex < 0) return 0;
    let acc = 0;
    for (let i = 0; i <= todIndex; i++) {
      acc += Number(rawFixes[i].distance || 0);
    }
    return acc;
  })();

  // Distance TOD → destination = total route distance minus cumulative dist at TOD
  const todToDestNm = todCumulativeDist > 0
    ? Math.max(0, totalDistance - todCumulativeDist)
    : 0;

  // Elevation difference: TOD altitude → destination field elevation
  const destElevFt = Number(raw?.destination?.elevation || 0);
  const altitudeDiffFt = Math.max(0, todAltitudeFt - destElevFt);

  // Ground speed at TOD (from navlog) and near destination (last few fixes)
  const todGS = todFix ? Number(todFix.groundspeed || todFix.gs || 0) : 0;

  // Get ground speed near destination (last non-zero GS in navlog before dest)
  const gsAtDest = (() => {
    for (let i = rawFixes.length - 1; i >= 0; i--) {
      const gs = Number(rawFixes[i].groundspeed || rawFixes[i].gs || 0);
      if (gs > 0) return gs;
    }
    return 0;
  })();

  // Average GS during descent
  const avgGS = (todGS > 0 && gsAtDest > 0)
    ? Math.round((todGS + gsAtDest) / 2)
    : todGS > 0 ? todGS : gsAtDest;

  // Descent time in minutes: distance(nm) / speed(knots) * 60
  const descentTimeMin = avgGS > 0 && todToDestNm > 0
    ? (todToDestNm / avgGS) * 60
    : 0;

  // Required FPM = altitude_diff (ft) / descent time (min)
  const requiredFPM = descentTimeMin > 0
    ? Math.round(altitudeDiffFt / descentTimeMin)
    : 0;

  // Descent angle in degrees: atan(alt_diff_ft / dist_ft)
  // dist in nm → feet: 1 nm = 6076.115 ft
  const distFt = todToDestNm * 6076.115;
  const descentAngleDeg = distFt > 0
    ? (Math.atan(altitudeDiffFt / distFt) * (180 / Math.PI))
    : 0;

  // The "3-degree rule" standard for reference: FPM ≈ GS × 5 (at 3°)
  const stdFPM3deg = avgGS > 0 ? Math.round(avgGS * 5) : 0;

  return (
    <div className="space-y-6 w-full">
      <header className="pb-2 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80 shadow-sm shrink-0">
          <LineChart className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans uppercase">
            Flight Vertical Profile
          </h1>
          <p className="text-slate-500 font-medium text-xs mt-0.5">Calculated vertical trajectory with climb, cruise steps, and descent sectors.</p>
        </div>
      </header>

      <section className="card-panel glow-cyan">
        <h3 className="text-sm font-bold text-indigo-600 font-sans border-b border-slate-100 pb-2 uppercase tracking-wide">VERTICAL FLIGHTPATH DIAGRAM</h3>

        <div className="pt-4 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 10, left: -25, bottom: 20 }}
            >
              <defs>
                <linearGradient id="profileStrokeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#ff0000" /> {/* FL400+ Red */}
                  <stop offset="10%"  stopColor="#ff00ff" /> {/* FL370 Magenta */}
                  <stop offset="20%"  stopColor="#7e57c2" /> {/* FL330 Purple */}
                  <stop offset="30%"  stopColor="#3f51b5" /> {/* FL300 Indigo */}
                  <stop offset="45%"  stopColor="#0050ff" /> {/* FL250 Blue */}
                  <stop offset="60%"  stopColor="#00ffcc" /> {/* FL180 Cyan */}
                  <stop offset="75%"  stopColor="#00ff00" /> {/* FL100 Green */}
                  <stop offset="85%"  stopColor="#ffff00" /> {/* FL50 Yellow */}
                  <stop offset="95%"  stopColor="#ffd27f" /> {/* FL15 Orange/Yellow */}
                  <stop offset="100%" stopColor="#ffffff" /> {/* FL0 White */}
                </linearGradient>
                <linearGradient id="profileFillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="ident"
                tickLine={false}
                axisLine={false}
                stroke="#94a3b8"
                fontSize={9}
                dy={10}
              />
              <YAxis
                domain={[0, maxFL + 20]}
                tickLine={false}
                axisLine={false}
                stroke="#94a3b8"
                fontSize={9}
                tickFormatter={(val) => `FL${val}`}
                dx={5}
              />
              <Tooltip
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 shadow-lg rounded-xl p-3 text-xs font-mono space-y-1.5 border-collapse">
                        <div className="font-extrabold text-slate-800 border-b border-slate-100 pb-1">
                          {item.ident}
                        </div>
                        <div className="flex justify-between gap-4 text-slate-500">
                          <span>Altitude</span>
                          <span className="font-bold text-indigo-605">FL{item.fl}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-500">
                          <span>Distance</span>
                          <span className="font-bold text-slate-700">{item.cumulativeDistance} nm</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="fl"
                stroke="url(#profileStrokeGrad)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#profileFillGrad)"
                activeDot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy) return null;
                  const color = getAltitudeColor(payload?.fl || 0);
                  return (
                    <circle cx={cx} cy={cy} r={5.5} fill={color} stroke="#ffffff" strokeWidth={1.5} />
                  );
                }}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy) return null;
                  const color = getAltitudeColor(payload?.fl || 0);
                  return (
                    <circle cx={cx} cy={cy} r={3.5} fill={color} stroke="#ffffff" strokeWidth={1} />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ─── TOD Descent Rate Calculator ──────────────────────────────────── */}
      <section className="card-panel glow-cyan">
        <h3 className="text-sm font-bold text-indigo-600 font-sans border-b border-slate-100 pb-2 uppercase tracking-wide flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          TOD — Descent Rate Calculator
        </h3>

        {todToDestNm > 0 && altitudeDiffFt > 0 ? (
          <div className="pt-4 space-y-5">

            {/* Input parameters row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-sans">
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 space-y-1">
                <span className="text-[9px] text-amber-600 font-extrabold block uppercase tracking-wider">TOD Fix</span>
                <span className="text-sm font-extrabold text-slate-800">{todFix?.ident || '—'}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                <span className="text-[9px] text-slate-500 font-extrabold block uppercase tracking-wider">Cruise Altitude</span>
                <span className="text-sm font-extrabold text-slate-800">
                  FL{Math.round(todAltitudeFt / 100)} <span className="text-slate-400 font-medium text-[10px]">({todAltitudeFt.toLocaleString('en-US')} ft)</span>
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                <span className="text-[9px] text-slate-500 font-extrabold block uppercase tracking-wider">Dest. Elevation</span>
                <span className="text-sm font-extrabold text-slate-800">{destElevFt.toLocaleString('en-US')} ft</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                <span className="text-[9px] text-slate-500 font-extrabold block uppercase tracking-wider">TOD → Dest</span>
                <span className="text-sm font-extrabold text-slate-800">{todToDestNm.toFixed(1)} nm</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-1">
                <span className="text-[9px] text-indigo-600 font-extrabold block uppercase tracking-wider">Speed at TOD</span>
                <span className="text-sm font-extrabold text-slate-800">{todGS > 0 ? `${todGS} kt` : '—'}</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-1">
                <span className="text-[9px] text-indigo-600 font-extrabold block uppercase tracking-wider">Speed at Dest</span>
                <span className="text-sm font-extrabold text-slate-800">{gsAtDest > 0 ? `${gsAtDest} kt` : '—'}</span>
              </div>
            </div>

            {/* Results row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Required FPM — primary result */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex flex-col justify-between gap-2">
                <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider">Required Descent Rate</span>
                <div>
                  <span className="text-4xl font-black text-amber-700 tabular-nums">
                    {requiredFPM > 0 ? requiredFPM.toLocaleString('en-US') : '—'}
                  </span>
                  <span className="text-sm text-amber-500 font-semibold ml-1.5">ft/min</span>
                </div>
                <span className="text-[9px] text-amber-600/70">
                  Avg GS {avgGS > 0 ? `${avgGS} kt` : '—'} · {descentTimeMin > 0 ? `${descentTimeMin.toFixed(1)} min` : '—'} descent
                </span>
              </div>

              {/* Altitude difference */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between gap-2">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Altitude to Lose</span>
                <div>
                  <span className="text-4xl font-black text-slate-800 tabular-nums">
                    {altitudeDiffFt > 0 ? altitudeDiffFt.toLocaleString('en-US') : '—'}
                  </span>
                  <span className="text-sm text-slate-400 font-semibold ml-1.5">ft</span>
                </div>
                <span className="text-[9px] text-slate-400">FL{Math.round(todAltitudeFt / 100)} → {destElevFt} ft MSL</span>
              </div>

              {/* Descent angle + 3° reference */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between gap-2">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Descent Angle</span>
                <div>
                  <span className="text-4xl font-black text-indigo-600 tabular-nums">
                    {descentAngleDeg > 0 ? descentAngleDeg.toFixed(2) : '—'}
                  </span>
                  <span className="text-sm text-indigo-400 font-semibold ml-1.5">°</span>
                </div>
                {stdFPM3deg > 0 && (
                  <span className="text-[9px] text-slate-400">
                    3° ref: ~{stdFPM3deg.toLocaleString('en-US')} ft/min at {avgGS} kt
                  </span>
                )}
              </div>
            </div>

            {/* Visual deviation bar */}
            {requiredFPM > 0 && stdFPM3deg > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                  <span>Shallow</span>
                  <span className={`font-extrabold ${
                    Math.abs(requiredFPM - stdFPM3deg) < 100
                      ? 'text-emerald-600'
                      : requiredFPM > stdFPM3deg
                      ? 'text-red-500'
                      : 'text-amber-500'
                  }`}>
                    {requiredFPM > stdFPM3deg
                      ? `▲ ${(requiredFPM - stdFPM3deg).toLocaleString()} ft/min steeper than 3°`
                      : requiredFPM < stdFPM3deg
                      ? `▼ ${(stdFPM3deg - requiredFPM).toLocaleString()} ft/min shallower than 3°`
                      : '✓ On 3° glideslope'}
                  </span>
                  <span>Steep</span>
                </div>
                <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  {/* 3° reference marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-emerald-400 z-10"
                    style={{ left: '50%' }}
                  />
                  {/* Actual FPM indicator */}
                  <div
                    className={`absolute top-0 h-full w-1 rounded-full z-20 transition-all ${
                      Math.abs(requiredFPM - stdFPM3deg) < 100
                        ? 'bg-emerald-500'
                        : requiredFPM > stdFPM3deg
                        ? 'bg-red-500'
                        : 'bg-amber-400'
                    }`}
                    style={{
                      left: `${Math.min(98, Math.max(2, 50 + ((requiredFPM - stdFPM3deg) / stdFPM3deg) * 50))}%`
                    }}
                  />
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="pt-6 pb-2 text-center text-slate-400 text-xs font-sans space-y-1">
            <p className="font-semibold">TOD data not available</p>
            <p className="text-[10px]">Import a SimBrief OFP with navlog data to see TOD descent calculations.</p>
          </div>
        )}
      </section>
    </div>
  );
}
