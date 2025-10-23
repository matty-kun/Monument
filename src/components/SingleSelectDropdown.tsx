"use client";

import React, { useState, useRef, useEffect } from 'react';
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
}

function SingleSelectDropdown({ options, selectedValue, onChange, placeholder = 'Select an option', disabled = false }: SingleSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`input flex items-center justify-between ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
        disabled={disabled}
      >
        {selectedOption ? (
          <div className="flex items-center gap-2">
            {selectedOption.icon ? (
              <span className="text-xl w-6 h-6 flex items-center justify-center">{selectedOption.icon}</span>
            ) : selectedOption.image_url ? (
              <Image src={selectedOption.image_url} alt={selectedOption.name} width={24} height={24} className="w-6 h-6 object-cover rounded-full" priority />
            ) : null}
            <span className="ml-1 text-gray-900 dark:text-gray-200">{selectedOption.name}</span>
          </div>
        ) : <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>}
        <span className="text-gray-400">▼</span>
      </button>
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => {
            if ('label' in option) {
              return (
                <div key={option.label}>
                  <div className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">{option.label}</div>
                  {option.options.map(subOption => (
                    <div
                      key={subOption.id}
                      onClick={() => handleSelect(subOption.id)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer pl-6"
                    >
                      {subOption.icon ? <span className="text-xl w-6 h-6 flex items-center justify-center ">{subOption.icon}</span> : <div className="w-6 h-6" />}
                      <span className="ml-1 text-gray-900 dark:text-gray-200">{subOption.name}</span>
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
              >
                {option.icon ? <span className="text-xl w-6 h-6 flex items-center justify-center">{option.icon}</span> : option.image_url ? <Image src={option.image_url} alt={option.name} width={24} height={24} className="w-6 h-6 object-cover rounded-full" priority /> : null}
                <span className="ml-1 text-gray-900 dark:text-gray-200">{option.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SingleSelectDropdown;