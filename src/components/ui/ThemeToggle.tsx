import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../lib/theme/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      id="global-theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center gap-2 p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-150 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-600 ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-zinc-600 transition-transform duration-200 hover:-rotate-12" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-medium select-none">
          {isDark ? 'Light mode' : 'Dark mode'}
        </span>
      )}
    </button>
  );
}
