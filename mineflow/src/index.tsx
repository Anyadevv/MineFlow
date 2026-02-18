import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './badge-animations.css';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './LanguageContext';

import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);