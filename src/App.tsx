import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

import { AppProvider } from './components/AppContext';
import NavigationSidebar from './components/NavigationSidebar';

import DashboardClient from './app/DashboardClient';
import ImportPage from './app/import/page';
import ClimbPlannerPage from './app/subida/page';
import PerfilPage from './app/perfil/page';
import AtmosferaPage from './app/atmosfera/page';
import ConversorPage from './app/conversor/page';
import TakeoffCalculatorPage from './app/takeoff-calculator/page';
import AeronavesPage from './app/aeronaves/page';
import FontesPage from './app/fontes/page';
import ConfigPage from './app/config/page';
import OfflinePage from './app/offline/page';

function AppLayout() {
  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      <NavigationSidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardClient />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/subida" element={<ClimbPlannerPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
            <Route path="/atmosfera" element={<AtmosferaPage />} />
            <Route path="/conversor" element={<ConversorPage />} />
            <Route path="/takeoff-calculator" element={<TakeoffCalculatorPage />} />
            <Route path="/aeronaves" element={<AeronavesPage />} />
            <Route path="/fontes" element={<FontesPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/offline" element={<OfflinePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
