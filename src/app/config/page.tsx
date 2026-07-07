'use client';

import React, { useState } from 'react';

import { useApp } from '../../components/AppContext';

export default function ConfigPage() {
  const { prefUnits, setPrefUnits, themeMode, setThemeMode } = useApp();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    try {
      setStatus({ type: 'success', message: 'Settings applied to the current in-memory session!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Unexpected error while saving settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6 max-w-4xl">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">USER SETTINGS</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Configure your default units, client credentials, and display themes.</p>
      </header>

      <div className="card-panel max-w-2xl">
        <h3 className="text-sm font-bold text-indigo-600 font-sans border-b border-slate-100 pb-2 uppercase tracking-wide">PREFERENCES</h3>
        
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
              <option value="glass-dark">Standard Light Mode</option>
              <option value="high-contrast">High Contrast (Technical)</option>
            </select>
          </div>

          {status && (
            <div
              className={`p-3 rounded-xl text-sm font-sans font-medium border ${
                status.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              [{status.type.toUpperCase()}] {status.message}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-100 text-white font-extrabold py-2.5 px-4 rounded-xl font-sans tracking-wide transition-all shadow-md cursor-pointer uppercase h-[46px]"
          >
            {saving ? 'SAVING...' : 'SAVE PREFERENCES'}
          </button>
        </div>
      </div>
    </main>
  );
}
