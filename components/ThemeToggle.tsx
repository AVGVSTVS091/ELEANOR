import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { SunIcon, MoonIcon } from './Icons';

const ThemeToggle: React.FC = () => {
  const { setTheme, effectiveTheme } = useTheme();

  const toggle = () => {
    setTheme(effectiveTheme === 'light' ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      aria-label="Toggle theme"
    >
      {effectiveTheme === 'light' ? (
        <MoonIcon className="w-5 h-5" />
      ) : (
        <SunIcon className="w-5 h-5" />
      )}
    </button>
  );
};

export default ThemeToggle;