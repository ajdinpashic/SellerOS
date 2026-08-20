import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex h-11 w-11 items-center justify-center rounded-lg text-content-secondary transition-colors hover:bg-surface-2 hover:text-content md:h-8 md:w-8 md:rounded"
      title={theme === 'light' ? 'Dark mode' : 'Light mode'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 md:h-3.5 md:w-3.5" />
      ) : (
        <Sun className="h-5 w-5 md:h-3.5 md:w-3.5" />
      )}
    </button>
  );
}
