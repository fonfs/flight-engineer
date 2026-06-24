'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavigationSidebar() {
  const pathname = usePathname();

  const navItemClass = (href: string) => {
    const baseClass = "w-full text-left block py-2 px-3 rounded font-mono text-sm transition-colors ";
    const isActive = pathname === href || (href === '/' && pathname === '/dashboard');
    if (isActive) {
      return baseClass + "bg-cyan-950/40 text-cyan-400 border-l-2 border-cyan-400";
    }
    return baseClass + "text-slate-300 hover:text-white hover:bg-slate-800";
  };

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div className="p-6 space-y-6">
        <div>
          <Link
            href="/"
            className="text-xl font-black tracking-wider text-cyan-400 font-mono flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
            CLASSIC FE
          </Link>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">FLIGHT ENGINEER PANEL</span>
        </div>

        <nav className="space-y-1">
          <Link href="/" className={navItemClass('/')}>
            ✈ Dashboard
          </Link>
          <Link href="/import" className={navItemClass('/import')}>
            ☁ Importar SimBrief
          </Link>
          <Link href="/subida" className={navItemClass('/subida')}>
            ↗ Planejador Subida
          </Link>
          <Link href="/perfil" className={navItemClass('/perfil')}>
            📈 Perfil Vertical
          </Link>
          <Link href="/atmosfera" className={navItemClass('/atmosfera')}>
            🌡 Atmosfera (ISA)
          </Link>
          <Link href="/conversor" className={navItemClass('/conversor')}>
            ⚖ Conversor Unidades
          </Link>
          <Link href="/aeronaves" className={navItemClass('/aeronaves')}>
            🛠 Aeronaves e Motores
          </Link>
          <Link href="/fontes" className={navItemClass('/fontes')}>
            📖 Fontes e Revisões
          </Link>
          <Link href="/config" className={navItemClass('/config')}>
            ⚙ Configurações
          </Link>
        </nav>
      </div>

      <div className="p-6 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
        <span>ENGINE VERSION: v1.0.0</span>
        <br />
        <span>STATUS: OFFLINE CACHE OK</span>
      </div>
    </aside>
  );
}
