import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

/**
 * Reads initial theme from localStorage or system preference.
 */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';

  const stored = localStorage.getItem('signbridge-theme');
  if (stored === 'dark' || stored === 'light') return stored;

  // Fall back to system preference
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Apply data-theme attribute to <html> and persist
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('signbridge-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
