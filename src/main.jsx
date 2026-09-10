import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router/index.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      if (import.meta.env.DEV) console.log('SW registered');
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            if (import.meta.env.DEV) console.log('New version available');
            // In production, avoid auto-reload that kills booking flow - user can refresh manually
            // If needed, dispatch event for UI prompt. For Part 1, keep soft logging.
          }
        });
      });
    }).catch((err) => { if (import.meta.env.DEV) console.log('SW error:', err); });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
