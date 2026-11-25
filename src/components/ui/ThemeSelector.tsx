import { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const themes = [
  { id: 'default', name: 'Blue', color: '#3b82f6' },
  { id: 'green', name: 'Green', color: '#22c55e' },
  { id: 'purple', name: 'Purple', color: '#a855f7' },
  { id: 'orange', name: 'Orange', color: '#f97316' },
];

export function ThemeSelector({ alignOutside = false }: { alignOutside?: boolean }) {
  const { theme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Apply theme class to body
    document.body.className = theme === 'default' ? '' : `theme-${theme}`;

    // Handle click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [theme]);

  const handleThemeChange = (themeId: string) => {
    setTheme(themeId as any);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-secondary-100 flex items-center"
        aria-label="Change theme"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className={`absolute mt-2 w-48 bg-white rounded-md shadow-lg z-50 py-1 ${alignOutside ? 'left-full ml-2' : 'right-0'}`}>
          <div className="px-4 py-2 text-sm text-secondary-500 border-b">Select Theme</div>
          {themes.map((t) => (
            <button
              key={t.id}
              className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-secondary-100"
              onClick={() => handleThemeChange(t.id)}
            >
              <span
                className="w-4 h-4 mr-2 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              {t.name}
              {theme === t.id && (
                <span className="ml-auto">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}