"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerDropdownProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function DatePickerDropdown({ value, onChange, disabled = false }: DatePickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + 'T00:00:00');
    return new Date();
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && !isOpen) {
      setViewDate(new Date(value + 'T00:00:00'));
    }
  }, [value, isOpen]);

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

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // Adjust for Monday start: 0(Sun) becomes 6, 1(Mon) becomes 0, etc.
    const adjustedFirstDay = (firstDayOfMonth + 6) % 7;
    
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
    
    const calendarDays = [];
    
    // Previous month padding
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      calendarDays.push({ day: prevMonthLastDate - i, month: month - 1, current: false });
    }
    
    // Current month
    for (let i = 1; i <= lastDateOfMonth; i++) {
      calendarDays.push({ day: i, month: month, current: true });
    }
    
    // Future month padding
    const remaining = 42 - calendarDays.length;
    for (let i = 1; i <= remaining; i++) {
        calendarDays.push({ day: i, month: month + 1, current: false });
    }
    
    return calendarDays;
  }, [viewDate]);

  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const year = viewDate.getFullYear();

  const handleDateSelect = (e: React.MouseEvent, d: number, m: number) => {
    e.preventDefault();
    e.stopPropagation();
    const newDate = new Date(viewDate.getFullYear(), m, d);
    const monthStr = (newDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = newDate.getDate().toString().padStart(2, '0');
    const isoString = `${newDate.getFullYear()}-${monthStr}-${dayStr}`;
    onChange(isoString);
  };

  const formattedDisplayDate = useMemo(() => {
     if (!value) return "Select date";
     try {
       const date = new Date(value + 'T00:00:00');
       if (isNaN(date.getTime())) return "Select date";
       return date.toLocaleDateString();
     } catch (e) {
       return "Select date";
     }
  }, [value]);

  const isToday = (day: number, month: number, year: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day: number, month: number, yearIdx: number) => {
    if (!value) return false;
    try {
      const date = new Date(value + 'T00:00:00');
      if (isNaN(date.getTime())) return false;
      const targetDate = new Date(viewDate.getFullYear(), month, day);
      return date.toDateString() === targetDate.toDateString();
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`input flex items-center justify-between ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-monument-primary" />
          <span className="text-gray-900 dark:text-gray-200 font-bold">
            {formattedDisplayDate}
          </span>
        </div>
        <span className="text-gray-400">▼</span>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[70] mt-1 w-[280px] sm:w-[320px] left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-4 sm:p-6 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              {monthName} {year}
            </h3>
            <div className="flex gap-4">
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 mb-4">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <span key={i} className="text-center text-xs font-black text-gray-400 uppercase">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-2 mb-8">
            {days.map((item, i) => {
              const currentYear = viewDate.getFullYear();
              // Calculate actual year for padding months
              let actMonth = item.month;
              let actYear = currentYear;
              if (actMonth < 0) { actMonth = 11; actYear--; }
              if (actMonth > 11) { actMonth = 0; actYear++; }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => handleDateSelect(e, item.day, item.month)}
                  className={`
                    relative flex items-center justify-center h-10 w-10 mx-auto rounded-full text-sm font-bold transition-all
                    ${!item.current ? 'text-gray-200 dark:text-gray-700 pointer-events-none' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
                    ${isSelected(item.day, item.month, item.month < 0 ? -1 : item.month > 11 ? 1 : 0) ? '!bg-monument-primary !text-white shadow-lg' : ''}
                    ${isToday(item.day, actMonth, actYear) && !isSelected(item.day, item.month, 0) ? 'border border-monument-primary/20' : ''}
                  `}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(""); setIsOpen(false); }}
              className="py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-sm font-black hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Remove
            </button>
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }}
              className="py-3 px-6 bg-monument-primary text-white rounded-full text-sm font-black shadow-lg hover:shadow-monument-primary/20 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
