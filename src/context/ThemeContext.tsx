import React, { createContext, useContext, useState } from 'react';
import { DARK, LIGHT, Colors } from '../data/tokens';

interface ThemeCtx {
  colors: Colors;
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  colors: DARK,
  isDark: true,
  toggle: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  return (
    <ThemeContext.Provider value={{ colors: isDark ? DARK : LIGHT, isDark, toggle: () => setIsDark(v => !v) }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
