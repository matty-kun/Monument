"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  id: string;
  name: string;
  image_url?: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  selectedValues: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  dropDirection?: 'up' | 'down';
}

export default function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  dropDirection = "up",
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((opt) =>
    selectedValues.includes(opt.name)
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative border-none" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
      >
        {selectedOptions.length > 0 ? (
          <div className="flex items-center gap-2 overflow-hidden">
            {selectedOptions.map((option, index) => (
              <Fragment key={option.id}>
                <div className="flex items-center gap-1.5 shrink-0">
                  {option.image_url ? (
                    <Image
                      src={option.image_url}
                      alt={option.name}
                      width={20}
                      height={20}
                      className="w-5 h-5 object-cover rounded-full shadow-sm"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-monument-primary/10 dark:bg-violet-900/40 rounded-full flex items-center justify-center text-[8px] font-black text-monument-primary">{option.name.substring(0, 2)}</div>
                  )}
                  <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase truncate max-w-[80px]">{option.name}</span>
                </div>
                {index < selectedOptions.length - 1 && <span className="font-black text-monument-primary italic text-[10px]">vs</span>}
              </Fragment>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 text-xs font-bold">{placeholder}</span>
        )}
        <span className="text-gray-400 text-[10px]">▼</span>
      </button>

      <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: dropDirection === 'up' ? 10 : -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: dropDirection === 'up' ? 10 : -10, scale: 0.95 }}
          className={`absolute z-[999] w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[1.5rem] shadow-2xl max-h-60 overflow-y-auto custom-scrollbar p-2 ${dropDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          {options.map((option) => (
            <label key={option.id} className="flex items-center px-4 py-2 hover:bg-monument-primary/5 dark:hover:bg-violet-900/20 rounded-xl cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.name)}
                onChange={() => onChange(option.name)}
                className="mr-3 h-4 w-4 rounded-md border-gray-200 text-monument-primary focus:ring-monument-primary/20 dark:bg-gray-700 dark:border-gray-600"
              />
              <div className="flex items-center gap-3">
                {option.image_url ? (
                  <Image src={option.image_url} alt={option.name} width={24} height={24} className="w-6 h-6 object-cover rounded-full shadow-sm" />
                ) : (
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-[10px] font-black text-gray-400 dark:text-gray-500">{option.name.substring(0, 2)}</div>
                )}
                <span className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight">{option.name}</span>
              </div>
            </label>
          ))}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}