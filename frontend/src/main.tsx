import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastProvider } from './components/ToastProvider';
import { LanguageProvider } from './components/LanguageProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </LanguageProvider>
  </React.StrictMode>
);
