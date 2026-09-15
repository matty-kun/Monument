"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';

interface Option {
  id: string;
  name: string;
  icon?: React.ReactNode;
  image_url?: string;
}

interface GroupedOption {
  label: string;
  options: Option[];
}

export interface SingleSelectDropdownProps {
  options: (Option | GroupedOption)[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  dropDirection?: 'up' | 'down';
}

function SingleSelectDropdown({ options, selectedValue, onChange, placeholder = 'Select an option', disabled = false, dropDirection = 'up' }: SingleSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allOptions = options.flatMap(opt => 'label' in opt ? opt.options : opt);
  const selectedOption = allOptions.find(opt => opt.id === selectedValue);

  // Removed handleClickOutside since we're using a modal overlay

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerSearchTerm = searchTerm.toLowerCase();

    return options.reduce<(Option | GroupedOption)[]>((acc, option) => {
      if ('label' in option) {
        const filteredSubOptions = option.options.filter(opt => opt.name.toLowerCase().includes(lowerSearchTerm));
        if (filteredSubOptions.length > 0) {
          acc.push({ ...option, options: filteredSubOptions });
        }
      } else {
        if (option.name.toLowerCase().includes(lowerSearchTerm)) {
          acc.push(option);
        }
      }
      return acc;
    }, []);
  }, [options, searchTerm]);

  return (
    <div className="relative">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full py-3 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {selectedOption ? (
          <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
            {selectedOption.icon ? (
              <span className="text-xl w-6 h-6 flex items-center justify-center shrink-0">{selectedOption.icon}</span>
            ) : selectedOption.image_url ? (
              <Image src={selectedOption.image_url} alt={selectedOption.name} width={24} height={24} className="w-6 h-6 object-cover rounded-full shrink-0" priority />
            ) : null}
            <span className="text-gray-900 dark:text-gray-200 truncate block">{selectedOption.name}</span>
          </div>
        ) : <span className="text-gray-500 dark:text-gray-400 truncate block uppercase text-[10px] tracking-widest">{placeholder}</span>}
      </div>
      {isOpen && !disabled && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#1c1c1e] shrink-0">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-monument-primary transition-all"
                    ref={searchInputRef}
                />
            </div>
            <div className="overflow-y-auto custom-scrollbar w-full flex-grow py-2">
          {filteredOptions.length === 0 ? (
             <div className="p-4 text-center text-sm text-gray-500">No results found</div>
          ) : (
            filteredOptions.map((option, index) => {
              if ('label' in option) {
                return (
                  <div key={option.label}>
                    <div className="px-4 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-white dark:bg-[#1c1c1e] shadow-sm sticky top-0 z-10">{option.label}</div>
                    {option.options.map(subOption => (
                      <div
                        key={subOption.id}
                        onClick={() => handleSelect(subOption.id)}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        {subOption.icon ? <span className="text-xl w-6 h-6 flex items-center justify-center ">{subOption.icon}</span> : <div className="w-6 h-6" />}
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{subOption.name}</span>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div
                  key={option.id + '-' + index}
                  onClick={() => handleSelect(option.id)}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  {option.icon ? <span className="text-xl w-6 h-6 flex items-center justify-center">{option.icon}</span> : option.image_url ? <Image src={option.image_url} alt={option.name} width={24} height={24} className="w-6 h-6 object-cover rounded-full" priority /> : null}
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{option.name}</span>
                </div>
              );
            })
          )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SingleSelectDropdown;