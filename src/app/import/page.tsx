'use client';

import React, { useState } from 'react';
import { FlightContext } from '@classic-flight-engineer/aviation-domain';
import { parseAndNormalizeSimBrief } from '@classic-flight-engineer/simbrief-adapter';

export default function ImportPage() {
  const [pilotId, setPilotId] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [importedData, setImportedData] = useState<{
    flightContext: FlightContext;
    warnings: string[];
    raw: any;
  } | null>(null);

  const [lastImportTime, setLastImportTime] = useState<string | null>(null);

  // Form editable states
  const [editableCallsign, setEditableCallsign] = useState('');
  const [editableRoute, setEditableRoute] = useState('');
  const [editableAltitude, setEditableAltitude] = useState(0);
  const [editableZfw, setEditableZfw] = useState(0);
  const [editableBlockFuel, setEditableBlockFuel] = useState(0);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setImportedData(null);

    try {
      const query = pilotId ? `pilotId=${encodeURIComponent(pilotId)}` : `username=${encodeURIComponent(username)}`;
      const res = await fetch(`/api/simbrief?${query}`);
      const rawData = await res.json();

      if (!res.ok) {
        throw new Error(rawData.error || 'Erro desconhecido ao consultar SimBrief');
      }

      // Check SimBrief API fetch status
      const fetchStatus = rawData.fetch?.status;
      if (fetchStatus && fetchStatus !== 'OFP Found' && fetchStatus !== 'Success') {
        throw new Error(`SimBrief: ${fetchStatus}`);
      }

      // Client-side normalization
      const adapterResult = parseAndNormalizeSimBrief(rawData);

      const parsedData = {
        flightContext: adapterResult.flightContext,
        warnings: adapterResult.warnings,
        raw: rawData,
      };

      setImportedData(parsedData);
      setLastImportTime(new Date().toLocaleTimeString());

      // Set form parameters
      setEditableCallsign(parsedData.flightContext.callsign);
      setEditableRoute(parsedData.flightContext.route);
      setEditableAltitude(parsedData.flightContext.plannedCruiseAltitude);
      setEditableZfw(parsedData.flightContext.zeroFuelWeight);
      setEditableBlockFuel(parsedData.flightContext.blockFuel);

    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!importedData) return;
    setError(null);
    setSuccess(null);

    const updatedContext: FlightContext = {
      ...importedData.flightContext,
      callsign: editableCallsign,
      route: editableRoute,
      plannedCruiseAltitude: editableAltitude as any,
      zeroFuelWeight: editableZfw as any,
      blockFuel: editableBlockFuel as any,
    };

    try {
      localStorage.setItem('activeFlight', JSON.stringify({
        flightContext: updatedContext,
        warnings: importedData.warnings,
        raw: importedData.raw,
      }));
      setSuccess('Plano de voo importado e salvo localmente com sucesso!');
    } catch {
      setError('Erro ao salvar o plano de voo no armazenamento local.');
    }
  };

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="border-b border-cyan-800/40 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider text-cyan-400 font-mono">
          IMPORTAÇÃO SIMBRIEF // PILOT INTERFACE
        </h1>
        <p className="text-slate-400 text-sm">Insira suas credenciais do SimBrief para sincronizar o último plano de voo operacional.</p>
      </header>

      {/* Input panel */}
      <section className="bg-slate-900/60 border border-slate-800 p-6 rounded-lg backdrop-blur-md">
        <form onSubmit={handleFetch} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 block font-mono">PILOT ID (NUMÉRICO)</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-slate-800 rounded px-3 py-2 text-cyan-300 font-mono outline-none focus:border-cyan-500"
              placeholder="Ex: 123456"
              value={pilotId}
              onChange={(e) => {
                setPilotId(e.target.value);
                setUsername('');
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 block font-mono">OU USERNAME DO SIMBRIEF</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-slate-800 rounded px-3 py-2 text-cyan-300 font-mono outline-none focus:border-cyan-500"
              placeholder="Ex: chupasseios"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setPilotId('');
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || (!pilotId && !username)}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-black font-extrabold py-2 px-4 rounded font-mono transition-colors"
          >
            {loading ? 'SINCRONIZANDO...' : 'BUSCAR PLANO DE VOO'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-800/80 text-red-400 rounded text-sm font-mono">
            [FALHA] {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 rounded text-sm font-mono">
            [SUCESSO] {success}
          </div>
        )}
      </section>

      {/* Editor & Data panel */}
      {importedData && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-bold text-cyan-400 font-mono border-b border-cyan-800/20 pb-2">
              REVISÃO MANUAL DE PARÂMETROS
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block font-mono">CALLSIGN</label>
                <input
                  type="text"
                  className="w-full bg-black/40 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono outline-none focus:border-cyan-500"
                  value={editableCallsign}
                  onChange={(e) => setEditableCallsign(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block font-mono">ALTITUDE CRUZEIRO PLANEJADA (FT)</label>
                <input
                  type="number"
                  className="w-full bg-black/40 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono outline-none focus:border-cyan-500"
                  value={editableAltitude}
                  onChange={(e) => setEditableAltitude(Number(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block font-mono">ZFW (KG)</label>
                  <input
                    type="number"
                    className="w-full bg-black/40 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono outline-none focus:border-cyan-500"
                    value={editableZfw}
                    onChange={(e) => setEditableZfw(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block font-mono">BLOCK FUEL (KG)</label>
                  <input
                    type="number"
                    className="w-full bg-black/40 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono outline-none focus:border-cyan-500"
                    value={editableBlockFuel}
                    onChange={(e) => setEditableBlockFuel(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block font-mono">ROTA</label>
                <textarea
                  rows={3}
                  className="w-full bg-black/40 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono outline-none focus:border-cyan-500 resize-none"
                  value={editableRoute}
                  onChange={(e) => setEditableRoute(e.target.value)}
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold py-2 px-4 rounded font-mono transition-colors"
              >
                SALVAR PLANO DE VOO
              </button>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-lg space-y-4">
            <div className="flex justify-between items-center border-b border-cyan-800/20 pb-2">
              <h3 className="text-lg font-bold text-cyan-400 font-mono">DADOS IMPORTADOS</h3>
              <span className="text-xs font-mono text-slate-500">ÚLTIMO SYNC: {lastImportTime}</span>
            </div>

            {importedData.warnings.length > 0 && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 text-amber-400 rounded text-xs font-mono space-y-1">
                <span className="font-bold block">[ALERTAS DE NORMALIZAÇÃO]</span>
                <ul className="list-disc pl-4 space-y-1">
                  {importedData.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2 font-mono text-sm max-h-[350px] overflow-y-auto">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Número do Voo:</span>
                <span>{importedData.flightContext.flightNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Callsign:</span>
                <span>{importedData.flightContext.callsign}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Rota Aeródromos:</span>
                <span>{importedData.flightContext.origin} &rarr; {importedData.flightContext.destination}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Aeronave / Variante:</span>
                <span>{importedData.flightContext.aircraftVariant}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Motor Variant:</span>
                <span>{importedData.flightContext.engineVariant}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Matrícula:</span>
                <span>{importedData.flightContext.registration}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {importedData && importedData.raw?.text?.plan_out && (
        <section className="bg-slate-900/60 border border-slate-800 p-6 rounded-lg space-y-4 backdrop-blur-md glow-cyan">
          <div className="flex justify-between items-center border-b border-cyan-800/20 pb-2">
            <h3 className="text-lg font-bold text-cyan-400 font-mono flex items-center gap-2">
              📋 PLANO DE VOO OPERACIONAL (OFP)
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(importedData.raw.text.plan_out);
              }}
              className="px-3 py-1 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 border border-cyan-800 rounded text-xs font-mono transition-all"
            >
              Copiar Texto
            </button>
          </div>
          <div className="bg-black/60 border border-slate-900 rounded-lg p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
            <pre className="text-xs text-emerald-400 font-mono leading-relaxed whitespace-pre font-medium selection:bg-emerald-950 selection:text-emerald-300">
              {importedData.raw.text.plan_out}
            </pre>
          </div>
        </section>
      )}
    </main>
  );
}
