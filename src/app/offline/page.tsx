import React from 'react';

export default function OfflinePage() {
  return (
    <main className="p-8 max-w-md mx-auto text-center space-y-4 font-mono">
      <h1 className="text-2xl font-bold text-red-500">[SINAL PERDIDO]</h1>
      <p className="text-slate-400">Você está desconectado da rede. Verifique seu status de conexão de rede ou continue usando as ferramentas offline armazenadas em cache.</p>
      <a href="/" className="inline-block px-4 py-2 border border-cyan-500 text-cyan-400 rounded hover:bg-cyan-950">RECONECTAR</a>
    </main>
  );
}
