import React from 'react';

export default function OfflinePage() {
  return (
    <main className="p-8 max-w-md mx-auto text-center space-y-4 font-mono">
      <h1 className="text-2xl font-bold text-red-500">[SIGNAL LOST]</h1>
      <p className="text-slate-400">You are disconnected from the network. Check your network connection status or continue using the cached offline tools.</p>
      <a href="/" className="inline-block px-4 py-2 border border-cyan-500 text-cyan-400 rounded hover:bg-cyan-950">RECONNECT</a>
    </main>
  );
}
