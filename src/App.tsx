import React, { useState, useEffect } from 'react';
import DashboardPage from './app/page';
import ImportPage from './app/import/page';
import ClimbPlannerPage from './app/subida/page';
import PerfilPage from './app/perfil/page';
import AtmosferaPage from './app/atmosfera/page';
import ConversorPage from './app/conversor/page';
import AeronavesPage from './app/aeronaves/page';
import FontesPage from './app/fontes/page';
import ConfigPage from './app/config/page';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Load and apply visual theme & read initial page from URL path
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme === 'high-contrast') {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Determine initial page from URL path
    const path = window.location.pathname.replace(/^\//, '');
    const validPages = ['dashboard', 'import', 'subida', 'perfil', 'atmosfera', 'conversor', 'aeronaves', 'fontes', 'config'];
    if (path && validPages.includes(path)) {
      setCurrentPage(path);
    }
  }, []);

  const navigateTo = (page: string) => {
    setCurrentPage(page);
    window.history.pushState(null, '', page === 'dashboard' ? '/' : `/${page}`);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'import':
        return <ImportPage />;
      case 'subida':
        return <ClimbPlannerPage />;
      case 'perfil':
        return <PerfilPage />;
      case 'atmosfera':
        return <AtmosferaPage />;
      case 'conversor':
        return <ConversorPage />;
      case 'aeronaves':
        return <AeronavesPage />;
      case 'fontes':
        return <FontesPage />;
      case 'config':
        return <ConfigPage />;
      default:
        return <DashboardPage />;
    }
  };

  const navItemClass = (page: string) => {
    const baseClass = "w-full text-left block py-2 px-3 rounded font-mono text-sm transition-colors ";
    if (currentPage === page) {
      return baseClass + "bg-cyan-950/40 text-cyan-400 border-l-2 border-cyan-400";
    }
    return baseClass + "text-slate-300 hover:text-white hover:bg-slate-800";
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Navigation Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div className="p-6 space-y-6">
          <div>
            <button
              onClick={() => navigateTo('dashboard')}
              className="text-xl font-black tracking-wider text-cyan-400 font-mono flex items-center gap-2"
            >
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
              CLASSIC FE
            </button>
            <span className="text-[10px] text-slate-500 font-mono block mt-1">FLIGHT ENGINEER PANEL</span>
          </div>

          <nav className="space-y-1">
            <button onClick={() => navigateTo('dashboard')} className={navItemClass('dashboard')}>
              ✈ Dashboard
            </button>
            <button onClick={() => navigateTo('import')} className={navItemClass('import')}>
              ☁ Importar SimBrief
            </button>
            <button onClick={() => navigateTo('subida')} className={navItemClass('subida')}>
              ↗ Planejador Subida
            </button>
            <button onClick={() => navigateTo('perfil')} className={navItemClass('perfil')}>
              📈 Perfil Vertical
            </button>
            <button onClick={() => navigateTo('atmosfera')} className={navItemClass('atmosfera')}>
              🌡 Atmosfera (ISA)
            </button>
            <button onClick={() => navigateTo('conversor')} className={navItemClass('conversor')}>
              ⚖ Conversor Unidades
            </button>
            <button onClick={() => navigateTo('aeronaves')} className={navItemClass('aeronaves')}>
              🛠 Aeronaves e Motores
            </button>
            <button onClick={() => navigateTo('fontes')} className={navItemClass('fontes')}>
              📖 Fontes e Revisões
            </button>
            <button onClick={() => navigateTo('config')} className={navItemClass('config')}>
              ⚙ Configurações
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
          <span>ENGINE VERSION: v1.0.0</span>
          <br />
          <span>STATUS: OFFLINE CACHE OK</span>
        </div>
      </aside>

      {/* Content Workspace */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {renderPage()}
      </div>
    </div>
  );
}
