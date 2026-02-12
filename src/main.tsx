import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Critical Error: Root element "#root" not found in index.html');
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Critical Error during App initialization:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin: 20px;">
        <h1 style="font-size: 1.5rem; margin-bottom: 10px;">Application Error</h1>
        <p>There was an error starting the application. This is often caused by missing environment variables or a runtime crash.</p>
        <p>Please check your <code>.env</code> file or the browser console for details.</p>
        <pre style="white-space: pre-wrap; margin-top: 10px; font-size: 0.8rem; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px;">${error}</pre>
      </div>
    `;
  }
}

