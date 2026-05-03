import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('SW registered');

      // Detect updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // NEW UPDATE AVAILABLE

            console.log('New version available');

            // OPTION 1: auto reload (best for your case)
            window.location.reload();

            // OPTION 2: show UI prompt instead (more advanced)
          }
        });
      });
    }).catch((err) => console.log('SW error:', err));
  });
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
