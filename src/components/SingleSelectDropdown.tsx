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

function SingleSelectDropdown({ options, selectedValue, onChange, placeholder = 'Select an option', disabled = false, dropDirection = 'down' }: SingleSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allOptions = options.flatMap(opt => 'label' in opt ? opt.options : opt);
  const selectedOption = allOptions.find(opt => opt.id === selectedValue);

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
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`input flex items-center justify-between ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {selectedOption ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedOption.icon ? (
              <span className="text-xl w-6 h-6 flex items-center justify-center shrink-0">{selectedOption.icon}</span>
            ) : selectedOption.image_url ? (
              <Image src={selectedOption.image_url} alt={selectedOption.name} width={24} height={24} className="w-6 h-6 object-cover rounded-full shrink-0" priority />
            ) : null}
            <span className="ml-1 text-gray-900 dark:text-gray-200 truncate block">{selectedOption.name}</span>
          </div>
        ) : <span className="text-gray-500 dark:text-gray-400 truncate flex-1 block">{placeholder}</span>}
        <span className="text-gray-400 shrink-0 ml-2">▼</span>
      </div>
      {isOpen && !disabled && (
        <div className={`absolute z-[60] w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-72 ${dropDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-monument-primary"
                  onClick={(e) => e.stopPropagation()}
                  ref={searchInputRef}
              />
          </div>
          <div className="overflow-y-auto w-full flex-grow">
          {filteredOptions.length === 0 ? (
             <div className="p-4 text-center text-sm text-gray-500">No results found</div>
          ) : (
            filteredOptions.map((option, index) => {
              if ('label' in option) {
                return (
                  <div key={option.label}>
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 shadow-sm sticky top-0">{option.label}</div>
                    {option.options.map(subOption => (
                      <div
                        key={subOption.id}
                        onClick={() => handleSelect(subOption.id)}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer pl-6 transition-colors"
                      >
                        {subOption.icon ? <span className="text-xl w-6 h-6 flex items-center justify-center ">{subOption.icon}</span> : <div className="w-6 h-6" />}
                        <span className="ml-1 text-sm text-gray-900 dark:text-gray-200">{subOption.name}</span>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div
                  key={option.id + '-' + index}
                  onClick={() => handleSelect(option.id)}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  {option.icon ? <span className="text-xl w-6 h-6 flex items-center justify-center">{option.icon}</span> : option.image_url ? <Image src={option.image_url} alt={option.name} width={24} height={24} className="w-6 h-6 object-cover rounded-full" priority /> : null}
                  <span className="ml-1 text-sm text-gray-900 dark:text-gray-200">{option.name}</span>
                </div>
              );
            })
          )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SingleSelectDropdown;