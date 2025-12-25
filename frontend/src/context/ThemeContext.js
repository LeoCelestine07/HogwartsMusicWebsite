import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultTheme = {
  primary_color: '#00d4d4',
  secondary_color: '#f97316',
  accent_color: '#14b8a6',
  hero_gradient_from: '#14b8a6',
  hero_gradient_to: '#0a1a1f',
  background_type: 'gradient',
  background_value: '#0a1a1f',
};

const ThemeContext = createContext({ theme: defaultTheme, refreshTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);

  const applyTheme = useCallback((settings) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    if (settings.primary_color) {
      root.style.setProperty('--accent-cyan', settings.primary_color);
    }
    if (settings.secondary_color) {
      root.style.setProperty('--accent-orange', settings.secondary_color);
    }
    if (settings.accent_color) {
      root.style.setProperty('--accent-teal', settings.accent_color);
    }
    
    // Background settings
    if (settings.background_type === 'solid' && settings.background_value) {
      root.style.setProperty('--bg-default', settings.background_value);
    }
  }, []);

  const fetchTheme = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/settings/site`);
      const settings = response.data;
      setTheme(prev => ({ ...prev, ...settings }));
      applyTheme(settings);
    } catch (error) {
      console.error('Error fetching theme:', error);
    }
  }, [applyTheme]);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const refreshTheme = useCallback(() => {
    fetchTheme();
  }, [fetchTheme]);

  return (
    <ThemeContext.Provider value={{ theme, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
