"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerDropdownProps {
  value: string; // "HH:mm" 24h format
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function TimePickerDropdown({ value, onChange, disabled = false }: TimePickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempAmpm, setTempAmpm] = useState<'AM' | 'PM'>(() => {
    if (!value) return 'AM';
    const hour = parseInt(value.split(':')[0]);
    return hour >= 12 ? 'PM' : 'AM';
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const hour = parseInt(value.split(':')[0]);
      setTempAmpm(hour >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  const times = useMemo(() => {
    const list = [];
    for (let h = 1; h <= 12; h++) {
      for (let m = 0; m < 60; m += 30) {
        list.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    const parts = list.splice(22, 2); 
    return [...parts, ...list];
  }, []);

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

  const handleTimeSelect = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    let hour24 = h;
    if (tempAmpm === 'PM' && h < 12) hour24 += 12;
    if (tempAmpm === 'AM' && h === 12) hour24 = 0;
    
    const value24 = `${hour24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    onChange(value24);
    setIsOpen(false);
  };

  const currentDisplayTime = useMemo(() => {
    if (!value) return 'Select time';
    const [h24, m] = value.split(':');
    const hour = parseInt(h24);
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h12.toString().padStart(2, '0')}:${m} ${ampm}`;
  }, [value]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`input flex items-center justify-between ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-monument-primary" />
          <span className="text-gray-900 dark:text-gray-200 font-bold">
            {currentDisplayTime}
          </span>
        </div>
        <span className="text-gray-400">▼</span>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[70] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col p-4">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-2xl p-1 gap-1 mb-4 w-fit mx-auto">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTempAmpm('AM'); }}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${tempAmpm === 'AM' ? 'bg-monument-primary text-white shadow-lg' : 'text-gray-300 dark:text-gray-500 hover:text-gray-600'}`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTempAmpm('PM'); }}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${tempAmpm === 'PM' ? 'bg-monument-primary text-white shadow-lg' : 'text-gray-300 dark:text-gray-500 hover:text-gray-600'}`}
            >
              PM
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto custom-scrollbar px-2">
            <div className="grid grid-cols-1 gap-1">
              {times.map((t) => {
                const [h, m] = t.split(':').map(Number);
                let h24 = h;
                if (tempAmpm === 'PM' && h < 12) h24 += 12;
                if (tempAmpm === 'AM' && h === 12) h24 = 0;
                const v24 = `${h24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                const isSelected = value === v24;

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTimeSelect(t)}
                    className={`py-2 px-4 text-left text-sm font-bold rounded-xl transition-all ${isSelected ? 'text-monument-primary bg-blue-50 dark:bg-blue-900/30' : 'text-gray-300 dark:text-gray-500 hover:text-monument-primary hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
