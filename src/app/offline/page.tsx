import React from 'react';

export default function OfflinePage() {
  return (
    <main className="p-10 max-w-lg mx-auto text-center space-y-6 bg-white border border-slate-200 rounded-2xl shadow-sm mt-10">
      <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-3xl font-bold border border-red-100 shadow-sm animate-pulse">
        ⚠️
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-red-600 tracking-tight">[SIGNAL LOST]</h1>
        <p className="text-slate-500 text-sm font-medium leading-relaxed">
          You are disconnected from the network. Check your network connection status or continue using the cached offline tools.
        </p>
      </div>
      <div>
        <a href="/" className="inline-block px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm tracking-wide rounded-xl transition-all shadow-sm">
          RECONNECT
        </a>
      </div>
    </main>
  );
}
