// import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
// import { createPortal } from "react-dom";
// import { ChevronDown, Search, X } from "lucide-react";
// import { cn } from "@/lib/utils";

// export interface CommonSearchableSelectOption {
//   id?: number | string;
//   label: string;
//   value: string;
// }

// interface CommonSearchableSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
//   options?: CommonSearchableSelectOption[];
//   error?: boolean | string;
//   onValueChange?: (value: string) => void;
//   onChange?: (value: any) => void; // Allow both string (for direct setters) and Event (for RHF)
//   placeholder?: string;
// }

// export const CommonSearchableSelect = forwardRef<HTMLSelectElement, CommonSearchableSelectProps>(
//   ({ options: propsOptions, value, onChange, onValueChange, placeholder = "Select an option", className = "", error = false, disabled = false, children, ...props }, ref) => {
//     const [isOpen, setIsOpen] = useState(false);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [activeIndex, setActiveIndex] = useState(-1);
//     const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});
//     const dropdownRef = useRef<HTMLDivElement>(null);
//     const triggerRef = useRef<HTMLButtonElement>(null);
//     const searchInputRef = useRef<HTMLInputElement>(null);
//     const selectRef = useRef<HTMLSelectElement>(null);
//     const optionsListRef = useRef<HTMLDivElement>(null);

//     // Expose the select element via ref for react-hook-form
//     useImperativeHandle(ref, () => selectRef.current as HTMLSelectElement);

//     // Update dropdown position when opened
//     useEffect(() => {
//       if (isOpen && triggerRef.current) {
//         const rect = triggerRef.current.getBoundingClientRect();
//         const spaceBelow = window.innerHeight - rect.bottom;
//         const spaceAbove = rect.top;
//         const dropdownHeight = 350; // Max height approximately

//         const dropdownWidth = Math.max(rect.width, 400);
//         let left = rect.left;
        
//         // Prevent dropdown from going off-screen to the right
//         if (left + dropdownWidth > window.innerWidth) {
//           left = Math.max(0, window.innerWidth - dropdownWidth - 10);
//         }

//         const styles: React.CSSProperties = {
//           position: 'fixed',
//           minWidth: rect.width,
//           maxWidth: dropdownWidth,
//           left: left,
//           zIndex: 9999,
//         };

//         if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
//           styles.bottom = window.innerHeight - rect.top + 4;
//         } else {
//           styles.top = rect.bottom + 4;
//         }

//         setDropdownStyles(styles);
//         setActiveIndex(-1);
//       }
//     }, [isOpen]);

//     // Update position on scroll or resize when open
//     useEffect(() => {
//       if (!isOpen) return;

//       const updatePosition = () => {
//         if (triggerRef.current) {
//           const rect = triggerRef.current.getBoundingClientRect();
//           const dropdownWidth = Math.max(rect.width, 400);
//           let left = rect.left;
          
//           if (left + dropdownWidth > window.innerWidth) {
//             left = Math.max(0, window.innerWidth - dropdownWidth - 10);
//           }

//           setDropdownStyles(prev => ({
//             ...prev,
//             left: left,
//             top: prev.bottom ? undefined : rect.bottom + 4,
//             bottom: prev.bottom ? window.innerHeight - rect.top + 4 : undefined,
//             minWidth: rect.width,
//             maxWidth: dropdownWidth,
//           }));
//         }
//       };

//       window.addEventListener('scroll', updatePosition, true);
//       window.addEventListener('resize', updatePosition);

//       return () => {
//         window.removeEventListener('scroll', updatePosition, true);
//         window.removeEventListener('resize', updatePosition);
//       };
//     }, [isOpen]);

//     // Extract options from props or children
//     const { options, extractedPlaceholder } = React.useMemo(() => {
//       if (propsOptions) return { options: propsOptions, extractedPlaceholder: undefined };

//       const extracted: CommonSearchableSelectOption[] = [];
//       let placeholderText: string | undefined = undefined;

//       const processOption = (child: React.ReactElement<any>) => {
//         const { value, children: label } = child.props;
//         const effectiveValue = value !== undefined ? String(value) : String(label || "");
        
//         if (effectiveValue === "" && label) {
//           placeholderText = String(label);
//         } else {
//           extracted.push({
//             id: effectiveValue,
//             value: effectiveValue,
//             label: String(label || ""),
//           });
//         }
//       };

//       React.Children.forEach(children, (child) => {
//         if (React.isValidElement(child)) {
//           const element = child as React.ReactElement<any>;
//           if (element.type === "option") {
//             processOption(element);
//           } else if (element.props && element.props.children) {
//             React.Children.forEach(element.props.children, (subChild) => {
//               if (React.isValidElement(subChild) && (subChild as React.ReactElement<any>).type === "option") {
//                 processOption(subChild as React.ReactElement<any>);
//               }
//             });
//           }
//         }
//       });
//       return { options: extracted, extractedPlaceholder: placeholderText };
//     }, [propsOptions, children]);

//     const finalPlaceholder = placeholder || extractedPlaceholder || "Select an option";
//     const hasError = Boolean(error);
//     const errorMessage = typeof error === "string" ? error : undefined;
//     const errorBaseName = props.name ? String(props.name) : "common-searchable-select";
//     const sanitizedErrorName = errorBaseName.replace(/[^a-zA-Z0-9_-]/g, "-");
//     const errorId = errorMessage ? `${sanitizedErrorName}-error` : undefined;

//     // Filter options based on search term
//     const filteredOptions = options.filter((option) =>
//       option.label.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     // Sync internal select value
//     const internalValue = (value !== undefined && value !== null) ? String(value) : (selectRef.current?.value || "");

//     // Get selected option label
//     const selectedOption = options.find((opt) => String(opt.value) === internalValue);
//     const selectedLabel = selectedOption ? selectedOption.label : "";

//     // Keyboard navigation
//     useEffect(() => {
//       if (!isOpen) return;

//       const handleKeyDown = (e: KeyboardEvent) => {
//         if (e.key === "ArrowDown") {
//           e.preventDefault();
//           setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
//         } else if (e.key === "ArrowUp") {
//           e.preventDefault();
//           setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
//         } else if (e.key === "Enter") {
//           if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
//             e.preventDefault();
//             handleSelect(filteredOptions[activeIndex].value);
//           }
//         } else if (e.key === "Escape") {
//           setIsOpen(false);
//           setSearchTerm("");
//         }
//       };

//       window.addEventListener("keydown", handleKeyDown);
//       return () => window.removeEventListener("keydown", handleKeyDown);
//     }, [isOpen, activeIndex, filteredOptions]);

//     // Scroll active item into view
//     useEffect(() => {
//       if (activeIndex >= 0 && optionsListRef.current) {
//         const activeItem = optionsListRef.current.children[activeIndex] as HTMLElement;
//         if (activeItem) {
//           activeItem.scrollIntoView({ block: "nearest" });
//         }
//       }
//     }, [activeIndex]);

//     // Close dropdown when clicking outside
//     useEffect(() => {
//       const handleClickOutside = (event: MouseEvent | TouchEvent) => {
//         if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
//             triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
//           setIsOpen(false);
//           setSearchTerm("");
//         }
//       };

//       document.addEventListener("mousedown", handleClickOutside);
//       document.addEventListener("touchstart", handleClickOutside);
//       return () => {
//         document.removeEventListener("mousedown", handleClickOutside);
//         document.removeEventListener("touchstart", handleClickOutside);
//       };
//     }, []);

//     // Focus search input when dropdown opens
//     useEffect(() => {
//       if (isOpen && searchInputRef.current) {
//         setTimeout(() => searchInputRef.current?.focus(), 0);
//       }
//     }, [isOpen]);

//     // Force re-render once after mount to sync with native select value if uncontrolled
//     const [, forceUpdate] = useState({});
//     useEffect(() => {
//       if (value === undefined) {
//         forceUpdate({});
//       }
//     }, []);

//     const handleSelect = (optionValue: string) => {
//       // 1. Sync native select for native events
//       if (selectRef.current) {
//         selectRef.current.value = optionValue;
        
//         // Dispatch native change event - this is crucial for react-hook-form
//         const nativeEvent = new Event("change", { bubbles: true });
//         selectRef.current.dispatchEvent(nativeEvent);
//       }

//       // 2. Call onValueChange with the raw value (preferred for simple state setters)
//       if (onValueChange) {
//         onValueChange(optionValue);
//       }
      
//       // 3. Call onChange
//       if (onChange && typeof onChange === 'function') {
//         const fieldName = (props as any).name || selectRef.current?.name || "";
        
//         // Construct a robust synthetic event that looks like a native ChangeEvent
//         const syntheticEvent = {
//           target: {
//             name: fieldName,
//             value: optionValue,
//           },
//           currentTarget: {
//             name: fieldName,
//             value: optionValue,
//           },
//           persist: () => {},
//           preventDefault: () => {},
//           stopPropagation: () => {},
//           type: 'change'
//         };

//         // If it looks like a react-hook-form handler (or any handler expecting an event),
//         // we pass the synthetic event. 
//         const isRHF = !!(props as any).name;
        
//         if (isRHF) {
//           onChange(syntheticEvent as any);
//         } else {
//           onChange(optionValue);
//         }
//       }
      
//       setIsOpen(false);
//       setSearchTerm("");
//     };

//     const handleClear = (e: React.MouseEvent) => {
//       e.stopPropagation();
//       handleSelect("");
//     };

//     return (
//       <div className={cn("relative w-full min-w-0", className)}>
//         {/* Hidden native select for form submission and accessibility */}
//         <select
//           ref={selectRef}
//           {...(value !== undefined ? { value: String(value) } : { defaultValue: "" })}
//           className="sr-only"
//           disabled={disabled}
//           aria-invalid={hasError}
//           aria-describedby={errorId}
//           onChange={(e) => {
//             if (onChange) onChange(e);
//           }}
//           {...props}
//         >
//           <option value="">{finalPlaceholder}</option>
//           {options.map((opt) => (
//             <option key={opt.id || opt.value} value={opt.value}>
//               {opt.label}
//             </option>
//           ))}
//         </select>

//         <div className="flex flex-col gap-1">
//           {/* Custom Trigger Button */}
//           <button
//             ref={triggerRef}
//             type="button"
//             onClick={() => !disabled && setIsOpen(!isOpen)}
//             disabled={disabled}
//             aria-invalid={hasError}
//             aria-describedby={errorId}
//             className={cn(
//               "grid grid-cols-[minmax(0,1fr),auto] h-auto min-h-9 w-full items-center gap-2 rounded-md border border-input px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-w-0 max-w-full",
//               error && "border-red-500",
//               isOpen && "ring-1 ring-ring outline-none"
//             )}
//           >
//             <span className={cn("text-left break-words whitespace-normal min-w-0 w-full", !selectedLabel && "text-muted-foreground")}>
//               {selectedLabel || finalPlaceholder}
//             </span>
//             <div className="flex items-center gap-1 shrink-0">
//               {internalValue && !disabled && !props.required && (
//                 <X
//                   className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
//                   onMouseDown={(e) => {
//                     e.stopPropagation();
//                     handleClear(e);
//                   }}
//                 />
//               )}
//               <ChevronDown
//                 className={cn(
//                   "h-4 w-4 opacity-50 transition-transform",
//                   isOpen && "transform rotate-180"
//                 )}
//               />
//             </div>
//           </button>
//           {errorMessage && (
//             <p id={errorId} className="text-xs text-left text-red-600 break-words">
//               {errorMessage}
//             </p>
//           )}
//         </div>

//         {/* Dropdown Content */}
//         {isOpen && createPortal(
//           <div 
//             ref={dropdownRef}
//             style={dropdownStyles}
//             className={cn(
//               "rounded-md border border-input bg-white text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 overflow-hidden"
//             )}
//             onMouseDown={(e) => e.stopPropagation()}
//             onWheel={(e) => e.stopPropagation()}
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Search Input */}
//             <div 
//               className="flex items-center border-b px-3 py-2 bg-gray-50"
//               onMouseDown={(e) => e.stopPropagation()}
//               onWheel={(e) => e.stopPropagation()}
//               onClick={(e) => e.stopPropagation()}
//             >
//               <Search className="h-4 w-4 opacity-50 mr-2" />
//               <input
//                 ref={searchInputRef}
//                 type="text"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 placeholder="Search..."
//                 className="flex-1 outline-none text-sm bg-transparent"
//                 onMouseDown={(e) => e.stopPropagation()}
//               />
//               {searchTerm && (
//                 <X
//                   className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
//                   onMouseDown={(e) => {
//                     e.stopPropagation();
//                     setSearchTerm("");
//                   }}
//                 />
//               )}
//             </div>

//             {/* Options List */}
//             <div 
//               ref={optionsListRef}
//               className="max-h-80 overflow-y-auto p-1 custom-scrollbar"
//               onMouseDown={(e) => e.stopPropagation()}
//               onWheel={(e) => e.stopPropagation()}
//               onClick={(e) => e.stopPropagation()}
//             >
//               {filteredOptions.length > 0 ? (
//                 filteredOptions.map((option, index) => (
//                   <div
//                     key={option.id || option.value}
//                     onMouseDown={(e) => {
//                       e.preventDefault();
//                       e.stopPropagation();
//                       handleSelect(option.value);
//                     }}
//                     onMouseEnter={() => setActiveIndex(index)}
//                     className={cn(
//                       "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-gray-100 hover:text-gray-900 transition-colors break-words whitespace-normal",
//                       (internalValue === String(option.value) || activeIndex === index) && "bg-gray-100 text-gray-900",
//                       internalValue === String(option.value) && "bg-gray-200 font-medium"
//                     )}
//                   >
//                     {option.label}
//                   </div>
//                 ))
//               ) : (
//                 <div className="px-3 py-10 text-center">
//                   <div className="flex flex-col items-center justify-center space-y-2">
//                     <div className="rounded-full bg-gray-100 p-3">
//                       <Search className="h-6 w-6 text-gray-400" />
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-gray-900">No records found</p>
//                       <p className="text-xs text-gray-500">
//                         {searchTerm ? "Try adjusting your search" : "No data available in the list"}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>,
//           document.body
//         )}
//       </div>
//     );
//   }
// );

// CommonSearchableSelect.displayName = "CommonSearchableSelect";

// export default CommonSearchableSelect;

// import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
// import { createPortal } from "react-dom";
// import { ChevronDown, Search, X } from "lucide-react";
// import { cn } from "@/lib/utils";

// export interface CommonSearchableSelectOption {
//   id?: number | string;
//   label: string;
//   value: string;
// }

// interface CommonSearchableSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
//   options?: CommonSearchableSelectOption[];
//   error?: boolean | string;
//   onValueChange?: (value: string) => void;
//   onChange?: (value: any) => void; // Allow both string (for direct setters) and Event (for RHF)
//   placeholder?: string;
// }

// export const CommonSearchableSelect = forwardRef<HTMLSelectElement, CommonSearchableSelectProps>(
//   ({ options: propsOptions, value, onChange, onValueChange, placeholder = "Select an option", className = "", error = false, disabled = false, children, ...props }, ref) => {
//     const [isOpen, setIsOpen] = useState(false);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});
//     const dropdownRef = useRef<HTMLDivElement>(null);
//     const triggerRef = useRef<HTMLButtonElement>(null);
//     const searchInputRef = useRef<HTMLInputElement>(null);
//     const selectRef = useRef<HTMLSelectElement>(null);

//     // Expose the select element via ref for react-hook-form
//     useImperativeHandle(ref, () => selectRef.current as HTMLSelectElement);

//     // Update dropdown position when opened
//     useEffect(() => {
//       if (isOpen && triggerRef.current) {
//         const rect = triggerRef.current.getBoundingClientRect();
//         const spaceBelow = window.innerHeight - rect.bottom;
//         const spaceAbove = rect.top;
//         const dropdownHeight = 350; // Max height approximately

//         const dropdownWidth = Math.max(rect.width, 400);
//         let left = rect.left;
        
//         // Prevent dropdown from going off-screen to the right
//         if (left + dropdownWidth > window.innerWidth) {
//           left = Math.max(0, window.innerWidth - dropdownWidth - 10);
//         }

//         const styles: React.CSSProperties = {
//           position: 'fixed',
//           minWidth: rect.width,
//           maxWidth: dropdownWidth,
//           left: left,
//           zIndex: 9999,
//         };

//         if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
//           styles.bottom = window.innerHeight - rect.top + 4;
//         } else {
//           styles.top = rect.bottom + 4;
//         }

//         setDropdownStyles(styles);
//       }
//     }, [isOpen]);

//     // Update position on scroll or resize when open
//     useEffect(() => {
//       if (!isOpen) return;

//       const updatePosition = () => {
//         if (triggerRef.current) {
//           const rect = triggerRef.current.getBoundingClientRect();
//           const dropdownWidth = Math.max(rect.width, 400);
//           let left = rect.left;
          
//           if (left + dropdownWidth > window.innerWidth) {
//             left = Math.max(0, window.innerWidth - dropdownWidth - 10);
//           }

//           setDropdownStyles(prev => ({
//             ...prev,
//             left: left,
//             top: prev.bottom ? undefined : rect.bottom + 4,
//             bottom: prev.bottom ? window.innerHeight - rect.top + 4 : undefined,
//             minWidth: rect.width,
//             maxWidth: dropdownWidth,
//           }));
//         }
//       };

//       window.addEventListener('scroll', updatePosition, true);
//       window.addEventListener('resize', updatePosition);

//       return () => {
//         window.removeEventListener('scroll', updatePosition, true);
//         window.removeEventListener('resize', updatePosition);
//       };
//     }, [isOpen]);

//     // Extract options from props or children
//     const { options, extractedPlaceholder } = React.useMemo(() => {
//       if (propsOptions) return { options: propsOptions, extractedPlaceholder: undefined };

//       const extracted: CommonSearchableSelectOption[] = [];
//       let placeholderText: string | undefined = undefined;

//       const processOption = (child: React.ReactElement<any>) => {
//         const { value, children: label } = child.props;
//         const effectiveValue = value !== undefined ? String(value) : String(label || "");
        
//         if (effectiveValue === "" && label) {
//           placeholderText = String(label);
//         } else {
//           extracted.push({
//             id: effectiveValue,
//             value: effectiveValue,
//             label: String(label || ""),
//           });
//         }
//       };

//       React.Children.forEach(children, (child) => {
//         if (React.isValidElement(child)) {
//           const element = child as React.ReactElement<any>;
//           if (element.type === "option") {
//             processOption(element);
//           } else if (element.props && element.props.children) {
//             React.Children.forEach(element.props.children, (subChild) => {
//               if (React.isValidElement(subChild) && (subChild as React.ReactElement<any>).type === "option") {
//                 processOption(subChild as React.ReactElement<any>);
//               }
//             });
//           }
//         }
//       });
//       return { options: extracted, extractedPlaceholder: placeholderText };
//     }, [propsOptions, children]);

//     const finalPlaceholder = placeholder || extractedPlaceholder || "Select an option";
//     const hasError = Boolean(error);
//     const errorMessage = typeof error === "string" ? error : undefined;
//     const errorBaseName = props.name ? String(props.name) : "common-searchable-select";
//     const sanitizedErrorName = errorBaseName.replace(/[^a-zA-Z0-9_-]/g, "-");
//     const errorId = errorMessage ? `${sanitizedErrorName}-error` : undefined;

//     // Filter options based on search term
//     const filteredOptions = options.filter((option) =>
//       option.label.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     // Sync internal select value
//     const internalValue = (value !== undefined && value !== null) ? String(value) : (selectRef.current?.value || "");

//     // Get selected option label
//     const selectedOption = options.find((opt) => String(opt.value) === internalValue);
//     const selectedLabel = selectedOption ? selectedOption.label : "";

//     // Close dropdown when clicking outside
//     useEffect(() => {
//       const handleClickOutside = (event: MouseEvent | TouchEvent) => {
//         if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//           setIsOpen(false);
//           setSearchTerm("");
//         }
//       };

//       document.addEventListener("mousedown", handleClickOutside);
//       document.addEventListener("touchstart", handleClickOutside);
//       return () => {
//         document.removeEventListener("mousedown", handleClickOutside);
//         document.removeEventListener("touchstart", handleClickOutside);
//       };
//     }, []);

//     // Focus search input when dropdown opens
//     useEffect(() => {
//       if (isOpen && searchInputRef.current) {
//         setTimeout(() => searchInputRef.current?.focus(), 0);
//       }
//     }, [isOpen]);

//     // Force re-render once after mount to sync with native select value if uncontrolled
//     const [, forceUpdate] = useState({});
//     useEffect(() => {
//       if (value === undefined) {
//         forceUpdate({});
//       }
//     }, []);

//     const handleSelect = (optionValue: string) => {
//       // 1. Sync native select for native events
//       if (selectRef.current) {
//         selectRef.current.value = optionValue;
        
//         // Dispatch native change event - this is crucial for react-hook-form
//         const nativeEvent = new Event("change", { bubbles: true });
//         selectRef.current.dispatchEvent(nativeEvent);
//       }

//       // 2. Call onValueChange with the raw value (preferred for simple state setters)
//       if (onValueChange) {
//         onValueChange(optionValue);
//       }
      
//       // 3. Call onChange
//       if (onChange && typeof onChange === 'function') {
//         const fieldName = (props as any).name || selectRef.current?.name || "";
        
//         // Construct a robust synthetic event that looks like a native ChangeEvent
//         const syntheticEvent = {
//           target: {
//             name: fieldName,
//             value: optionValue,
//           },
//           currentTarget: {
//             name: fieldName,
//             value: optionValue,
//           },
//           persist: () => {},
//           preventDefault: () => {},
//           stopPropagation: () => {},
//           type: 'change'
//         };

//         // If it looks like a react-hook-form handler (or any handler expecting an event),
//         // we pass the synthetic event. 
//         // We also pass the raw value as the first argument if it's likely a simple state setter.
//         // A simple heuristic: if it's RHF, it usually expects an event.
//         const isRHF = !!(props as any).name;
        
//         // To be safe and support both, we can check the function signature or just provide what's expected.
//         // Most custom onChange in this project expect the value directly.
//         if (isRHF) {
//           // If RHF, we MUST pass the event for it to work correctly with register()
//           // However, if the user provided their own onChange on top of register, 
//           // they might expect the value.
//           onChange(syntheticEvent as any);
//         } else {
//           onChange(optionValue);
//         }
//       }
      
//       setIsOpen(false);
//       setSearchTerm("");
//     };

//     const handleClear = (e: React.MouseEvent) => {
//       e.stopPropagation();
//       handleSelect("");
//     };

//     return (
//       <div className={cn("relative w-full min-w-0", className)}>
//         {/* Hidden native select for form submission and accessibility */}
//         <select
//           ref={selectRef}
//           {...(value !== undefined ? { value: String(value) } : { defaultValue: "" })}
//           className="sr-only"
//           disabled={disabled}
//           aria-invalid={hasError}
//           aria-describedby={errorId}
//           onChange={(e) => {
//             if (onChange) onChange(e);
//           }}
//           {...props}
//         >
//           <option value="">{finalPlaceholder}</option>
//           {options.map((opt) => (
//             <option key={opt.id || opt.value} value={opt.value}>
//               {opt.label}
//             </option>
//           ))}
//         </select>

//         <div className="flex flex-col gap-1">
//           {/* Custom Trigger Button */}
//           <button
//             ref={triggerRef}
//             type="button"
//             onClick={() => !disabled && setIsOpen(!isOpen)}
//             disabled={disabled}
//             aria-invalid={hasError}
//             aria-describedby={errorId}
//             className={cn(
//               "grid grid-cols-[minmax(0,1fr),auto] h-auto min-h-9 w-full items-center gap-2 rounded-md border border-input px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-w-0 max-w-full",
//               error && "border-red-500",
//               isOpen && "ring-1 ring-ring outline-none"
//             )}
//           >
//             <span className={cn("text-left break-words whitespace-normal min-w-0 w-full", !selectedLabel && "text-muted-foreground")}>
//               {selectedLabel || finalPlaceholder}
//             </span>
//             <div className="flex items-center gap-1 shrink-0">
//               {internalValue && !disabled && !props.required && (
//                 <X
//                   className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
//                   onMouseDown={(e) => {
//                     e.stopPropagation();
//                     handleClear(e);
//                   }}
//                 />
//               )}
//               <ChevronDown
//                 className={cn(
//                   "h-4 w-4 opacity-50 transition-transform",
//                   isOpen && "transform rotate-180"
//                 )}
//               />
//             </div>
//           </button>
//           {errorMessage && (
//             <p id={errorId} className="text-xs text-left text-red-600 break-words">
//               {errorMessage}
//             </p>
//           )}
//         </div>

//         {/* Dropdown Content */}
//         {isOpen && createPortal(
//           <div 
//             ref={dropdownRef}
//             style={dropdownStyles}
//             className={cn(
//               "rounded-md border border-input bg-white text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 overflow-hidden"
//             )}
//             onMouseDown={(e) => e.stopPropagation()}
//             onWheel={(e) => e.stopPropagation()}
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Search Input */}
//             <div 
//               className="flex items-center border-b px-3 py-2 bg-gray-50"
//               onMouseDown={(e) => e.stopPropagation()}
//               onWheel={(e) => e.stopPropagation()}
//               onClick={(e) => e.stopPropagation()}
//             >
//               <Search className="h-4 w-4 opacity-50 mr-2" />
//               <input
//                 ref={searchInputRef}
//                 type="text"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 placeholder="Search..."
//                 className="flex-1 outline-none text-sm bg-transparent"
//                 onMouseDown={(e) => e.stopPropagation()}
//               />
//               {searchTerm && (
//                 <X
//                   className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
//                   onMouseDown={(e) => {
//                     e.stopPropagation();
//                     setSearchTerm("");
//                   }}
//                 />
//               )}
//             </div>

//             {/* Options List */}
//             <div 
//               className="max-h-80 overflow-y-auto p-1 custom-scrollbar"
//               onMouseDown={(e) => e.stopPropagation()}
//               onWheel={(e) => e.stopPropagation()}
//               onClick={(e) => e.stopPropagation()}
//             >
//               {filteredOptions.length > 0 ? (
//                 filteredOptions.map((option) => (
//                   <div
//                     key={option.id || option.value}
//                     onMouseDown={(e) => {
//                       e.preventDefault();
//                       e.stopPropagation();
//                       handleSelect(option.value);
//                     }}
//                     className={cn(
//                       "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-gray-100 hover:text-gray-900 transition-colors break-words whitespace-normal",
//                       internalValue === String(option.value) && "bg-gray-200 text-gray-900 font-medium"
//                     )}
//                   >
//                     {option.label}
//                   </div>
//                 ))
//               ) : (
//                 <div className="px-3 py-10 text-center">
//                   <div className="flex flex-col items-center justify-center space-y-2">
//                     <div className="rounded-full bg-gray-100 p-3">
//                       <Search className="h-6 w-6 text-gray-400" />
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-gray-900">No records found</p>
//                       <p className="text-xs text-gray-500">
//                         {searchTerm ? "Try adjusting your search" : "No data available in the list"}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>,
//           document.body
//         )}
//       </div>
//     );
//   }
// );

// CommonSearchableSelect.displayName = "CommonSearchableSelect";



// export default CommonSearchableSelect;
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommonSearchableSelectOption {
  id?: number | string;
  label: string;
  value: string;
  activeFlag?: boolean;
}

const sortOptionsAlphabetically = (items: CommonSearchableSelectOption[]) => {
  return [...items].sort((a, b) =>
    String(a.label ?? '').localeCompare(String(b.label ?? ''), undefined, { sensitivity: 'base' })
  );
};

interface CommonSearchableSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options?: CommonSearchableSelectOption[];
  error?: boolean | string;
  onValueChange?: (value: string) => void;
  onChange?: (value: any) => void;
  placeholder?: string;
  filterActive?: boolean;
  disablePortal?: boolean;
}

export const CommonSearchableSelect = forwardRef<HTMLSelectElement, CommonSearchableSelectProps>(
  ({ options: propsOptions, value, onChange, onValueChange, placeholder = "Select an option", className = "", error = false, disabled = false, children, filterActive = false, disablePortal = false, id, "aria-labelledby": ariaLabelledBy, "aria-label": ariaLabel, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});
    const [isPositionCalculated, setIsPositionCalculated] = useState(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const valueSyncFrameRef = useRef<number | null>(null);
    const valueSyncRef = useRef("");
    const [, forceRender] = useState(0);
    // Expose the select element via ref for react-hook-form
    useImperativeHandle(ref, () => selectRef.current as HTMLSelectElement);

    const applyActiveFilter = useCallback((items: CommonSearchableSelectOption[]) => {
      if (!filterActive) return items;
      return items.filter((option) => option.activeFlag ?? true);
    }, [filterActive]);

    useEffect(() => {
      if (value === undefined) {
        forceRender((prev) => prev + 1);
      }
    }, []);

    useEffect(() => {
      let isActive = true;
      const syncValue = () => {
        if (!isActive) return;
        const nodeValue = selectRef.current?.value || "";
        if (valueSyncRef.current !== nodeValue) {
          valueSyncRef.current = nodeValue;
          forceRender((prev) => prev + 1);
        }
        valueSyncFrameRef.current = requestAnimationFrame(syncValue);
      };
      valueSyncFrameRef.current = requestAnimationFrame(syncValue);
      return () => {
        isActive = false;
        if (valueSyncFrameRef.current) {
          cancelAnimationFrame(valueSyncFrameRef.current);
        }
      };
    }, []);

    // Optimized position update using requestAnimationFrame
    const updatePosition = useCallback(() => {
      if (!isOpen || !triggerRef.current) return;

      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 350; // Max height approximately

        const dropdownWidth = Math.max(rect.width, 220);
        let left = rect.left;
        
        // Prevent dropdown from going off-screen to the right
        if (left + dropdownWidth > window.innerWidth) {
          left = Math.max(10, window.innerWidth - dropdownWidth - 10);
        }

        const styles: React.CSSProperties = {
          position: 'fixed',
          minWidth: Math.max(rect.width, 220),
          maxWidth: Math.max(rect.width, 350),
          left: left,
          zIndex: 99999,
          transition: 'none', // Prevent transitions during position calculation
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
      });
    }, [isOpen]);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen) {
        if (disablePortal) {
          const timer = setTimeout(() => {
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          }, 50);
          return () => clearTimeout(timer);
        } else {
          setIsPositionCalculated(false);
          updatePosition();
          
          // Small delay to ensure smooth opening
          const timer = setTimeout(() => {
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          }, 50);

          return () => clearTimeout(timer);
        }
      } else {
        setSearchTerm("");
        setIsPositionCalculated(false);
      }
    }, [isOpen, updatePosition, disablePortal]);

    // Native event listener to shield dropdown interactions from Radix UI Dialog document listeners
    useEffect(() => {
      if (disablePortal) return;

      const dropdownElement = dropdownRef.current;
      if (!isOpen || !dropdownElement) return;

      const stopNativePropagation = (e: Event) => {
        e.stopPropagation();
      };

      const events = ["pointerdown", "mousedown", "focusin", "wheel"];
      
      events.forEach((eventName) => {
        dropdownElement.addEventListener(eventName, stopNativePropagation, { capture: false });
      });

      return () => {
        events.forEach((eventName) => {
          dropdownElement.removeEventListener(eventName, stopNativePropagation, { capture: false });
        });
      };
    }, [isOpen, disablePortal]);

    // Update position on scroll or resize when open (with throttling)
    useEffect(() => {
      if (!isOpen) return;

      // Throttled scroll/resize handler
      let ticking = false;
      
      const handleScrollResize = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            updatePosition();
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', handleScrollResize, true);
      window.addEventListener('resize', handleScrollResize);

      return () => {
        window.removeEventListener('scroll', handleScrollResize, true);
        window.removeEventListener('resize', handleScrollResize);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }, [isOpen, updatePosition]);

    // Extract options from props or children
    const { options, extractedPlaceholder } = React.useMemo(() => {
      if (propsOptions) {
        return { options: sortOptionsAlphabetically(applyActiveFilter(propsOptions)), extractedPlaceholder: undefined };
      }

      const extracted: CommonSearchableSelectOption[] = [];
      let placeholderText: string | undefined = undefined;

      const processOption = (child: React.ReactElement<any>) => {
        const { value, children: label } = child.props;
        const effectiveValue = value !== undefined ? String(value) : String(label || "");
        
        if (effectiveValue === "" && label) {
          placeholderText = String(label);
        } else {
          extracted.push({
            id: effectiveValue,
            value: effectiveValue,
            label: String(label || ""),
          });
        }
      };

      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const element = child as React.ReactElement<any>;
          if (element.type === "option") {
            processOption(element);
          } else if (element.props && element.props.children) {
            React.Children.forEach(element.props.children, (subChild) => {
              if (React.isValidElement(subChild) && (subChild as React.ReactElement<any>).type === "option") {
                processOption(subChild as React.ReactElement<any>);
              }
            });
          }
        }
      });
      return { options: sortOptionsAlphabetically(applyActiveFilter(extracted)), extractedPlaceholder: placeholderText };
    }, [propsOptions, children, applyActiveFilter]);

    const finalPlaceholder = placeholder || extractedPlaceholder || "Select an option";
    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;
    const errorBaseName = props.name ? String(props.name) : "common-searchable-select";
    const sanitizedErrorName = errorBaseName.replace(/[^a-zA-Z0-9_-]/g, "-");
    const errorId = errorMessage ? `${sanitizedErrorName}-error` : undefined;

    // Filter options based on search term
    const filteredOptions = React.useMemo(() => 
      options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      ), [options, searchTerm]
    );

    // Sync internal select value
    const internalValue = (value !== undefined && value !== null) ? String(value) : (selectRef.current?.value || "");

    // Get selected option label
    const selectedOption = React.useMemo(() => 
      options.find((opt) => String(opt.value) === internalValue), 
      [options, internalValue]
    );
    const selectedLabel = selectedOption ? selectedOption.label : "";

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
            triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
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

    // Handle keyboard navigation
    // const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    //   if (disabled) return;

    //   switch (e.key) {
    //     case 'Enter':
    //     case 'Space':
    //       if (!isOpen) {
    //         e.preventDefault();
    //         setIsOpen(true);
    //       }
    //       break;
    //     case 'Escape':
    //       if (isOpen) {
    //         e.preventDefault();
    //         setIsOpen(false);
    //         triggerRef.current?.focus();
    //       }
    //       break;
    //     case 'Tab':
    //       if (isOpen) {
    //         e.preventDefault();
    //         // Focus management for tab within dropdown
    //         if (e.shiftKey && document.activeElement === searchInputRef.current) {
    //           // If shift+tab on search, close dropdown and focus trigger
    //           setIsOpen(false);
    //           triggerRef.current?.focus();
    //         } else if (!e.shiftKey && document.activeElement === dropdownRef.current?.lastElementChild) {
    //           // If tab on last element, close dropdown
    //           setIsOpen(false);
    //         }
    //       }
    //       break;
    //     case 'ArrowDown':
    //       if (isOpen) {
    //         e.preventDefault();
    //         // Focus first option if nothing focused
    //         const options = dropdownRef.current?.querySelectorAll('[role="option"]');
    //         if (options && options.length > 0) {
    //           (options[0] as HTMLElement).focus();
    //         }
    //       }
    //       break;
    //     case 'ArrowUp':
    //       if (isOpen) {
    //         e.preventDefault();
    //         // Focus search input if arrow up from first option
    //         if (document.activeElement?.getAttribute('role') === 'option') {
    //           searchInputRef.current?.focus();
    //         }
    //       }
    //       break;
    //   }
    // }, [disabled, isOpen]);
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (disabled) return;

  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } 
      // If already open and an option is focused, let the option handle selection
      else if (document.activeElement?.getAttribute('role') === 'option') {
        return;
      }
      break;

    case 'ArrowDown':
      e.preventDefault();
      if (!isOpen) {
        // ← This is the main fix: Open dropdown on ArrowDown
        setIsOpen(true);
      } else {
        // If already open, focus first option
        const firstOption = dropdownRef.current?.querySelector('[role="option"]') as HTMLElement;
        if (firstOption) {
          firstOption.focus();
        }
      }
      break;

    case 'ArrowUp':
      e.preventDefault();
      if (isOpen) {
        // Focus search input when pressing ArrowUp (good UX)
        searchInputRef.current?.focus();
      }
      break;

    case 'Escape':
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
      break;

    case 'Tab':
      if (isOpen) {
        // Optional: close on Tab for cleaner behavior
        setIsOpen(false);
      }
      break;
  }
}, [disabled, isOpen]);
//     const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
//   if (disabled) return;

//   switch (e.key) {
//     case 'Enter':
//     case 'Space':
//       if (!isOpen) {
//         e.preventDefault();
//         setIsOpen(true);
//       } else if (isOpen && document.activeElement?.getAttribute('role') === 'option') {
//         // If an option is focused and Enter/Space is pressed, let the option handle it
//         return;
//       }
//       break;
//     case 'Escape':
//       if (isOpen) {
//         e.preventDefault();
//         setIsOpen(false);
//         triggerRef.current?.focus();
//       }
//       break;
//     case 'Tab':
//       if (isOpen) {
//         e.preventDefault();
//         // Focus management for tab within dropdown
//         if (e.shiftKey) {
//           // If shift+tab, close dropdown and focus trigger
//           setIsOpen(false);
//           triggerRef.current?.focus();
//         } else {
//           // If tab on last element, close dropdown
//           setIsOpen(false);
//         }
//       }
//       break;
//     case 'ArrowDown':
//       if (isOpen) {
//         e.preventDefault();
//         // Only focus first option if search input or trigger is focused
//         if (document.activeElement === triggerRef.current || document.activeElement === searchInputRef.current) {
//           const firstOption = dropdownRef.current?.querySelector('[role="option"]');
//           if (firstOption) {
//             (firstOption as HTMLElement).focus();
//           }
//         }
//       }
//       break;
//     case 'ArrowUp':
//       if (isOpen) {
//         e.preventDefault();
//         // Focus search input if trigger is focused
//         if (document.activeElement === triggerRef.current) {
//           searchInputRef.current?.focus();
//         }
//       }
//       break;
//   }
// }, [disabled, isOpen]);

    const handleSelect = (optionValue: string) => {
      // Sync native select
      if (selectRef.current) {
        selectRef.current.value = optionValue;
        
        // Dispatch native change event
        const nativeEvent = new Event("change", { bubbles: true });
        selectRef.current.dispatchEvent(nativeEvent);
      }

      // Call onValueChange
      if (onValueChange) {
        onValueChange(optionValue);
      }
      
      // Call onChange
      if (onChange && typeof onChange === 'function') {
        const fieldName = (props as any).name || selectRef.current?.name || "";
        
        const syntheticEvent = {
          target: {
            name: fieldName,
            value: optionValue,
          },
          currentTarget: {
            name: fieldName,
            value: optionValue,
          },
          persist: () => {},
          preventDefault: () => {},
          stopPropagation: () => {},
          type: 'change'
        };

        const isRHF = !!(props as any).name;
        
        if (isRHF) {
          onChange(syntheticEvent as any);
        } else {
          onChange(optionValue);
        }
      }
      
      setIsOpen(false);
      triggerRef.current?.focus(); // Return focus to trigger
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleSelect("");
    };

    const dropdownContent = (
      <div 
        ref={dropdownRef}
        id={`${props.name}-dropdown`}
        role="listbox"
        style={disablePortal ? {
          position: 'absolute',
          top: '100%',
          left: 0,
          width: '100%',
          zIndex: 9999,
          marginTop: '4px',
        } : dropdownStyles}
        className={cn(
          "rounded-md border border-input bg-white text-popover-foreground shadow-xl overflow-hidden pointer-events-auto"
        )}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div 
          className="flex items-center border-b px-3 py-2 bg-gray-50"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Search className="h-4 w-4 opacity-50 mr-2 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="flex-1 text-sm bg-transparent min-w-0 border-2 border-gray-400 rounded-md px-2 py-1 outline-none focus:border-blue-500"
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Escape') {
                setIsOpen(false);
                triggerRef.current?.focus();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const firstOption = dropdownRef.current?.querySelector('[role="option"]');
                if (firstOption) {
                  (firstOption as HTMLElement).focus();
                }
              } else if (e.key === 'Enter' && filteredOptions.length > 0) {
                e.preventDefault();
                handleSelect(filteredOptions[0].value);
              }
            }}
          />
        </div>

        {/* Options List */}
        <div 
          className="max-h-80 overflow-y-auto p-1 custom-scrollbar"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.id || option.value}
                role="option"
                aria-selected={internalValue === String(option.value)}
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(option.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(option.value);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    e.stopPropagation();
                    const nextOption = e.currentTarget.nextElementSibling;
                    if (nextOption && nextOption.getAttribute('role') === 'option') {
                      (nextOption as HTMLElement).focus();
                    } else {
                      // Loop back to search input
                      searchInputRef.current?.focus();
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    e.stopPropagation();
                    const prevOption = e.currentTarget.previousElementSibling;
                    if (prevOption && prevOption.getAttribute('role') === 'option') {
                      (prevOption as HTMLElement).focus();
                    } else {
                      // If no previous option, go back to search input
                      searchInputRef.current?.focus();
                    }
                  }
                }}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-gray-100 hover:text-gray-900 transition-colors break-words whitespace-normal focus:bg-gray-100 focus:text-gray-900",
                  internalValue === String(option.value) && "bg-gray-200 text-gray-900 font-medium"
                )}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-10 text-center">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="rounded-full bg-gray-100 p-3">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">No records found</p>
                  <p className="text-xs text-gray-500">
                    {searchTerm ? "Try adjusting your search" : "No data available in the list"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );

    return (
      <div 
        ref={containerRef}
        className={cn("relative w-full min-w-0", className)}
        onKeyDown={handleKeyDown}
      >
        {/* Hidden native select - moved to be last for better tab order */}
        <select
          ref={selectRef}
          {...(value !== undefined ? { value: String(value) } : { defaultValue: "" })}
          className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={errorId}
          onChange={(e) => {
            if (onChange) onChange(e);
          }}
          tabIndex={-1} // Remove from tab order
          {...props}
        >
          <option value="">{finalPlaceholder}</option>
          {options.map((opt) => (
            <option key={opt.id || opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex flex-col gap-1">
          {/* Custom Trigger Button */}
          <button
            ref={triggerRef}
            id={id}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-labelledby={ariaLabelledBy}
            aria-label={ariaLabel}
            aria-invalid={hasError}
            aria-describedby={errorId}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? `${props.name}-dropdown` : undefined}
            className={cn(
              "grid grid-cols-[minmax(0,1fr),auto] h-auto min-h-9 w-full items-center gap-2 rounded-md border-2 border-gray-400 px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-700 disabled:border-gray-400 min-w-0 max-w-full",
              error && "border-red-500",
              isOpen && "ring-1 ring-ring outline-none"
            )}
          >
            <span className={cn("text-left break-words whitespace-normal min-w-0 w-full", !selectedLabel && !disabled && "text-muted-foreground", disabled && "text-gray-700")}>
              {selectedLabel || finalPlaceholder}
            </span>
            <div className="flex items-center gap-0 shrink-0">
              <ChevronDown
                className={cn(
                  "h-4 w-4 opacity-50 transition-transform duration-200",
                  isOpen && "transform rotate-180"
                )}
              />
            </div>
          </button>
          {errorMessage && (
            <p id={errorId} className="text-xs text-left text-red-600 break-words">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Dropdown Content */}
        {isOpen && (disablePortal ? dropdownContent : (isPositionCalculated && createPortal(
          dropdownContent,
          document.body
        )))}
      </div>
    );
  }
);

CommonSearchableSelect.displayName = "CommonSearchableSelect";

export default CommonSearchableSelect;