'use client';

import React, { useState, useEffect } from 'react';

export default function ConfigPage() {
  const [prefUnits, setPrefUnits] = useState('lbs');
  const [themeMode, setThemeMode] = useState('glass-dark');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedUnits = localStorage.getItem('prefUnits');
    const savedTheme = localStorage.getItem('themeMode');
    if (savedUnits) setPrefUnits(savedUnits);
    if (savedTheme) setThemeMode(savedTheme);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    try {
      // Save to localStorage
      localStorage.setItem('prefUnits', prefUnits);
      localStorage.setItem('themeMode', themeMode);

      // Apply theme class to document element
      if (themeMode === 'high-contrast') {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }

      setStatus({ type: 'success', message: 'Configurações salvas localmente com sucesso!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Erro inesperado ao salvar as configurações.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6 max-w-4xl">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider font-mono text-cyan-400">USER SETTINGS</h1>
        <p className="text-sm text-slate-400 mt-1">Configure your default units, client credentials, and display themes.</p>
      </header>

      <div className="card-panel max-w-2xl">
        <h3 className="text-sm font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">PREFERENCES</h3>
        
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label htmlFor="select-units">Default Weight Unit</label>
            <select
              id="select-units"
              className="w-full"
              value={prefUnits}
              onChange={(e) => setPrefUnits(e.target.value)}
            >
              <option value="lbs">Pounds (lbs)</option>
              <option value="kgs">Kilograms (kgs)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="select-theme">Dashboard Visual Theme</label>
            <select
              id="select-theme"
              className="w-full"
              value={themeMode}
              onChange={(e) => setThemeMode(e.target.value)}
            >
              <option value="glass-dark">Standard HUD (Glass Dark)</option>
              <option value="high-contrast">High Contrast (Technical)</option>
            </select>
          </div>

          {status && (
            <div
              className={`p-3 rounded text-sm font-mono border ${
                status.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400'
                  : 'bg-red-950/60 border-red-800/80 text-red-400'
              }`}
            >
              [{status.type.toUpperCase()}] {status.message}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-black font-extrabold py-2 px-4 rounded font-mono transition-colors"
          >
            {saving ? 'SALVANDO...' : 'SAVE PREFERENCES'}
          </button>
        </div>
      </div>
    </main>
  );
}
