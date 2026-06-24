/// <reference types="vite/client" />
import ReactDOM from 'react-dom/client';
import App from './App';
import './app/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);

// Service Worker Registry Script
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(function() {});
    } else {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then(function(keys) {
          keys.forEach(function(key) {
            caches.delete(key);
          });
        });
      }
    }
  });
}
