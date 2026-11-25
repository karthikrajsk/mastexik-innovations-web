import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommonMultiSearchableSelectOption {
  id?: number | string;
  label: string;
  value: string;
  activeFlag?: boolean;
}

interface CommonMultiSearchableSelectProps {
  options?: CommonMultiSearchableSelectOption[];
  value?: string[] | string;
  onValueChange?: (values: string[]) => void;
  onChange?: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  error?: boolean | string;
  disabled?: boolean;
}

export const CommonMultiSearchableSelect = forwardRef<HTMLButtonElement, CommonMultiSearchableSelectProps>(
  ({
    options = [],
    value,
    onValueChange,
    onChange,
    placeholder = "Select Department(s)",
    className = "",
    error = false,
    disabled = false,
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});
    const [isPositionCalculated, setIsPositionCalculated] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);

    const selectedValues = useMemo<string[]>(() => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string" && value.trim()) {
        return value.split(",").map((s) => s.trim()).filter(Boolean);
      }
      return [];
    }, [value]);

    const updatePosition = useCallback(() => {
      if (!isOpen || !triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 300;

      const dropdownWidth = Math.max(rect.width, 240);
      let left = rect.left;

      if (left + dropdownWidth > window.innerWidth) {
        left = Math.max(10, window.innerWidth - dropdownWidth - 10);
      }

      const styles: React.CSSProperties = {
        position: 'fixed',
        minWidth: Math.max(rect.width, 240),
        maxWidth: Math.max(rect.width, 380),
        left: left,
        zIndex: 99999,
        transition: 'none',
      };

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        styles.bottom = window.innerHeight - rect.top + 4;
        styles.top = 'auto';
      } else {
        styles.top = rect.bottom + 4;
        styles.bottom = 'auto';
      }

      setDropdownStyles(styles);
      setIsPositionCalculated(true);
    }, [isOpen]);

    useEffect(() => {
      if (isOpen) {
        setIsPositionCalculated(false);
        updatePosition();
        const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
        return () => clearTimeout(timer);
      } else {
        setSearchTerm("");
        setIsPositionCalculated(false);
      }
    }, [isOpen, updatePosition]);

    useEffect(() => {
      if (!isOpen) return;
      const handleScrollResize = () => updatePosition();
      window.addEventListener('scroll', handleScrollResize, true);
      window.addEventListener('resize', handleScrollResize);
      return () => {
        window.removeEventListener('scroll', handleScrollResize, true);
        window.removeEventListener('resize', handleScrollResize);
      };
    }, [isOpen, updatePosition]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, []);

    const filteredOptions = useMemo(() => {
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [options, searchTerm]);

    const handleToggle = (optValue: string) => {
      let updated: string[] = [];

      if (optValue === "All") {
        if (selectedValues.includes("All")) {
          updated = [];
        } else {
          updated = ["All"];
        }
      } else {
        const withoutAll = selectedValues.filter((v) => v !== "All");
        if (withoutAll.includes(optValue)) {
          updated = withoutAll.filter((v) => v !== optValue);
        } else {
          updated = [...withoutAll, optValue];
        }

        const realOptions = options.filter((o) => o.value !== "All");
        if (realOptions.length > 0 && updated.length === realOptions.length) {
          updated = ["All"];
        }
      }

      if (updated.length === 0) {
        updated = ["All"];
      }

      if (onValueChange) onValueChange(updated);
      if (onChange) onChange(updated);
    };

    const displayLabel = useMemo(() => {
      if (selectedValues.length === 0 || selectedValues.includes("All")) {
        return "All";
      }
      return selectedValues.join(", ");
    }, [selectedValues]);

    const dropdownContent = (
      <div
        ref={dropdownRef}
        style={dropdownStyles}
        className="rounded-md border border-input bg-white text-popover-foreground shadow-xl overflow-hidden pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b px-3 py-2 bg-gray-50">
          <Search className="h-4 w-4 opacity-50 mr-2 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search departments..."
            className="flex-1 text-sm bg-transparent min-w-0 border-2 border-gray-400 rounded-md px-2 py-1 outline-none focus:border-blue-500"
          />
        </div>

        <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected =
                option.value === "All"
                  ? selectedValues.includes("All") || selectedValues.length === 0
                  : selectedValues.includes(option.value);

              return (
                <div
                  key={option.value}
                  onClick={() => handleToggle(option.value)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer select-none rounded-sm px-3 py-2 text-sm hover:bg-gray-100 transition-colors",
                    isSelected && "bg-gray-100 font-medium"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary pointer-events-none"
                  />
                  <span className="flex-1 text-gray-800">{option.label}</span>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-gray-500">No departments found</div>
          )}
        </div>
      </div>
    );

    return (
      <div className={cn("relative w-full min-w-0", className)}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "grid grid-cols-[minmax(0,1fr),auto] h-auto min-h-9 w-full items-center gap-2 rounded-md border-2 border-gray-400 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 min-w-0 max-w-full text-left",
            error && "border-red-500",
            isOpen && "ring-1 ring-ring outline-none"
          )}
        >
          <span className="truncate">{displayLabel || placeholder}</span>
          <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isOpen && "rotate-180")} />
        </button>

        {isOpen && isPositionCalculated && createPortal(dropdownContent, document.body)}
      </div>
    );
  }
);

CommonMultiSearchableSelect.displayName = "CommonMultiSearchableSelect";
export default CommonMultiSearchableSelect;
