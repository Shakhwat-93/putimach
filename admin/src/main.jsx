import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { installStoragePolyfills } from './platform/storage';
import { isNativeApp } from './platform/runtime';

installStoragePolyfills();

if (isNativeApp()) {
  document.body.classList.add('native-app');
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

if ('caches' in window) {
  caches.keys().then((names) => {
    for (let name of names) {
      caches.delete(name);
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
