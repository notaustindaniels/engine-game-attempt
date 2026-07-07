import { createContext, useContext, type ReactNode } from 'react';
import type { ResolvedTheme } from './types.ts';

const ThemeContext = createContext<ResolvedTheme | null>(null);

export function ThemeProvider(props: {
  theme: ResolvedTheme;
  children: ReactNode;
}) {
  return (
    <ThemeContext.Provider value={props.theme}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ResolvedTheme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return theme;
}
