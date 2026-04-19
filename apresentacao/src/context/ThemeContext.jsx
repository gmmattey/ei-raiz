import React, { createContext, useContext, useState, useEffect } from 'react';
import { detectMobile } from '../hooks/useIsMobile';

const ThemeContext = createContext();

const getSystemPrefersDark = () => {
  try {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

const resolveInitialTheme = () => {
  if (typeof window === 'undefined') return false;
  const mobile = detectMobile();
  if (mobile) {
    // Mobile/PWA: sempre segue o sistema, ignora persistência
    return getSystemPrefersDark();
  }
  // Desktop: lê preferência salva, default dark
  const stored = localStorage.getItem('theme');
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  return true;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(resolveInitialTheme);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Só persiste no desktop. No mobile o estado é volátil por design.
    if (!detectMobile()) {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  // Mobile: escuta mudanças na preferência do sistema em tempo real
  useEffect(() => {
    if (!detectMobile()) return;
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setIsDarkMode(e.matches);
    try {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    } catch {
      mq.addListener(onChange);
      return () => mq.removeListener(onChange);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme: () => setIsDarkMode((prev) => !prev), setThemeMode: (mode) => setIsDarkMode(mode === 'dark') }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
