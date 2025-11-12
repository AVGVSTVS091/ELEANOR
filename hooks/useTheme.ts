import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme as Theme) || 'system';
    }
    return 'system';
  });
  
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  const applyTheme = useCallback((currentTheme: Theme) => {
    const root = window.document.documentElement;
    const isDark =
      currentTheme === 'dark' ||
      (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setEffectiveTheme(isDark ? 'dark' : 'light');
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);


  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);


  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value = useMemo(() => ({ theme, setTheme, effectiveTheme }), [theme, effectiveTheme]);

  return React.createElement(ThemeContext.Provider, { value }, children);
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};