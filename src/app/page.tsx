'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../components/AppContext';

export default function DashboardPage() {
  const { flightData } = useApp();
  const flightContext = flightData?.flightContext;

  return (
    <main className="space-y-12 max-w-5xl mx-auto py-6">
      {/* Hero Welcome Panel */}
      <header className="relative bg-slate-900/40 border border-slate-800 p-8 rounded-2xl backdrop-blur-md overflow-hidden glow-cyan">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-800/40 rounded-full text-xs font-mono text-cyan-400">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
            SISTEMA INTEGRADO DE FLIGHT ENGINEERING
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black font-mono tracking-wider bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent leading-tight">
            CLASSIC FLIGHT ENGINEER
          </h1>
          
          <p className="text-slate-400 text-base md:text-lg font-sans leading-relaxed">
            Painel digital de precisão projetado para simulação de voo do Boeing 747-200. Calcule velocidades, gradientes de subida, desvios ISA e queima de combustível sem qualquer persistência ou registro de dados no servidor.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link 
              href="/import" 
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold rounded-lg font-mono transition-all transform hover:-translate-y-0.5 shadow-lg shadow-cyan-500/10"
            >
              🚀 IMPORTAR PLANO DE VOO
            </Link>
            <Link 
              href="/subida" 
              className="px-6 py-3 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 rounded-lg font-mono transition-all transform hover:-translate-y-0.5"
            >
              ↗ PLANEJAR SUBIDA
            </Link>
          </div>
        </div>
      </header>

      {/* Feature Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/20 border border-slate-800/80 p-6 rounded-xl hover:border-cyan-900/60 transition-all hover:bg-slate-900/40 group">
          <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform">✈</span>
          <h3 className="text-base font-bold font-mono text-cyan-400 mb-2">Monitoramento de Voo</h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            {flightContext ? (
              <span className="text-emerald-400 font-bold font-mono">
                Ativo: {flightContext.callsign} ({flightContext.origin} &rarr; {flightContext.destination})
              </span>
            ) : (
              "Nenhum voo carregado. Importe um plano do SimBrief para visualizar perfis de peso e combustível."
            )}
          </p>
          {flightContext && (
            <Link href="/import" className="inline-block mt-4 text-xs font-mono text-cyan-500 hover:text-cyan-400">
              Ver Detalhes &rarr;
            </Link>
          )}
        </div>

        <div className="bg-slate-900/20 border border-slate-800/80 p-6 rounded-xl hover:border-cyan-900/60 transition-all hover:bg-slate-900/40 group">
          <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform">📈</span>
          <h3 className="text-base font-bold font-mono text-cyan-400 mb-2">Perfil Vertical</h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            Gere diagramas de trajetória e altitude do voo em tempo real de acordo com as restrições inseridas e meteorologia.
          </p>
          <Link href="/perfil" className="inline-block mt-4 text-xs font-mono text-cyan-500 hover:text-cyan-400">
            Ir para Perfil &rarr;
          </Link>
        </div>

        <div className="bg-slate-900/20 border border-slate-800/80 p-6 rounded-xl hover:border-cyan-900/60 transition-all hover:bg-slate-900/40 group">
          <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform">🌡</span>
          <h3 className="text-base font-bold font-mono text-cyan-400 mb-2">Cálculos Atmosféricos</h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            Monitore a atmosfera padrão ISA, velocidades reais de ar e pressões QNH necessárias para a pilotagem do B742.
          </p>
          <Link href="/atmosfera" className="inline-block mt-4 text-xs font-mono text-cyan-500 hover:text-cyan-400">
            Calcular ISA &rarr;
          </Link>
        </div>
      </section>

      {/* Decorative Interactive Graphic */}
      <section className="bg-slate-950 border border-slate-900 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
        <span className="text-xs font-mono text-slate-600 block">SYSTEM STATUS: SESSION CACHE OK // NO SERVER LOGS RECORDED</span>
        <svg viewBox="0 0 400 120" className="w-full max-w-md opacity-25 hover:opacity-45 transition-opacity">
          <line x1="10" y1="60" x2="390" y2="60" stroke="#0891b2" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="200" cy="60" r="30" fill="none" stroke="#0891b2" strokeWidth="1.5" />
          <path d="M 120 60 L 150 40 L 250 80 L 280 60" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          <circle cx="120" cy="60" r="4" fill="#0891b2" />
          <circle cx="280" cy="60" r="4" fill="#f59e0b" />
        </svg>
      </section>
    </main>
  );
}
