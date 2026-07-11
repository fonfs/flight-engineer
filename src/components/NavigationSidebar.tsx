'use client';

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plane, 
  Cloud, 
  TrendingUp, 
  LineChart, 
  Thermometer, 
  Scale, 
  Wrench, 
  BookOpen, 
  Settings,
  Calculator
} from 'lucide-react';

interface SidebarItem {
  label: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function NavigationSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const items: SidebarItem[] = [
    { label: 'Home', route: '/', icon: Plane },
    { label: 'SimBrief Import', route: '/import', icon: Cloud },
    { label: 'Takeoff Calculator', route: '/takeoff-calculator', icon: Calculator },
    { label: 'Climb Planner', route: '/subida', icon: TrendingUp },
    { label: 'Vertical Profile', route: '/perfil', icon: LineChart },
    { label: 'Atmosphere (ISA)', route: '/atmosfera', icon: Thermometer },
    { label: 'Unit Converter', route: '/conversor', icon: Scale },
    { label: 'Aircraft & Engines', route: '/aeronaves', icon: Wrench },
    { label: 'Sources & Revisions', route: '/fontes', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col h-screen shrink-0 border-r border-slate-200/80">
      <div className="px-5 py-5 flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Flight Engineer Logo"
          className="w-9 h-9 shrink-0"
        />
        <div className="text-sm font-extrabold tracking-tight text-slate-900 font-sans leading-tight">
          Flight Engineer
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 py-4 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.route;
          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-50/80 text-indigo-600 font-bold shadow-sm shadow-indigo-500/5'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
