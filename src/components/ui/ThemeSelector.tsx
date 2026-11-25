import { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const themes = [
  { id: 'default', name: 'Mastexik', color: '#082A59' },
  { id: 'green', name: 'Teal', color: '#008F8C' },
  { id: 'purple', name: 'Deep Blue', color: '#123B70' },
  { id: 'orange', name: 'Gold', color: '#C99A4A' },
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
        className="p-2 rounded-md text-white/80 hover:bg-white/10 hover:text-white flex items-center transition-colors"
        aria-label="Change theme"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className={`absolute mt-2 w-48 bg-white rounded-md shadow-xl border border-[#D8E1EA] z-50 py-1 ${alignOutside ? 'left-full ml-2' : 'right-0'}`}>
          <div className="px-4 py-2 text-sm text-[#536A81] border-b border-[#EDF2F6]">Select Theme</div>
          {themes.map((t) => (
            <button
              key={t.id}
              className="flex items-center w-full px-4 py-2 text-sm text-left text-[#102F50] hover:bg-[#E9F3F8]"
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