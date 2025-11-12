import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './hooks/useTheme';
import { LanguageProvider } from './hooks/useTranslation';
import { SettingsProvider } from './hooks/useSettings';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <SettingsProvider>
            <App />
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);