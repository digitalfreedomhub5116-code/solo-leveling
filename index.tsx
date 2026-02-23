
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import GlobalErrorBoundary from './components/GlobalErrorBoundary'; // Import the boundary

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// System Boot Sequence Log
console.log("%c REFORGE SYSTEM v2.0 ", "background: #000; color: #00d2ff; font-weight: bold; padding: 6px; border: 2px solid #00d2ff; border-radius: 4px; font-size: 14px;");
console.log("%c [SYSTEM] Core Modules Loaded.", "color: #10b981; font-family: monospace;");
console.log("%c [SYSTEM] Shadow Protocol Active.", "color: #a855f7; font-family: monospace;");

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
        <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
