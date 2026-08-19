import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'sepia';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (localStorage.getItem('theme') as Theme) || 'dark',

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  cycleTheme: () => {
    const themes: Theme[] = ['light', 'dark', 'sepia'];
    const current = themes.indexOf(get().theme);
    const next = themes[(current + 1) % themes.length];
    get().setTheme(next);
  }
}));

// Apply theme on load
const theme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', theme);
