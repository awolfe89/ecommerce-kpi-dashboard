import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { validateEnv } from './utils/validateEnv';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

// Validate environment variables before rendering
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error.message);
  document.body.innerHTML = `<div style="color: red; padding: 20px;">
    <h1>Configuration Error</h1>
    <p>${error.message}</p>
    <p>Please check your environment variables.</p>
  </div>`;
  throw error;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);