"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DatePickerDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseDate(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function DatePickerDropdown({ value, onChange, disabled = false }: DatePickerDropdownProps) {
  const selectedDate = parseDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const cells: { date: Date; current: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i -= 1) {
      cells.push({ date: new Date(year, month - 1, prevMonthDays - i), current: false });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: new Date(year, month, day), current: true });
    }

    while (cells.length % 7 !== 0 || cells.length < 35) {
      const nextDay = cells.length - firstDay - daysInMonth + 1;
      cells.push({ date: new Date(year, month + 1, nextDay), current: false });
    }

    return cells;
  }, [viewDate]);

  const displayDate = useMemo(() => {
    if (!selectedDate) return "Select date";
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(selectedDate);
  }, [selectedDate]);

  const monthTitle = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(viewDate);

  const selectedIso = selectedDate ? toIsoDate(selectedDate) : "";
  const todayIso = toIsoDate(new Date());

  function openPicker() {
    if (disabled) return;
    setViewDate(selectedDate || new Date());
    setIsOpen(true);
  }

  function selectDate(date: Date) {
    onChange(toIsoDate(date));
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        className={`input flex items-center justify-between text-left ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10"}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarIcon className="h-4 w-4 shrink-0 text-monument-primary" />
          <span className={`truncate text-xs font-bold ${selectedDate ? "text-gray-900 dark:text-gray-200" : "text-gray-400"}`}>
            {displayDate}
          </span>
        </span>
        <span className="text-gray-400 text-[10px]">▼</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" className="absolute inset-0 cursor-default" aria-label="Close calendar" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#181818]"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-950 dark:text-white">Choose date</h2>
                  <p className="mt-0.5 text-[12px] text-gray-500 dark:text-white/45">{displayDate}</p>
                </div>
                <button type="button" onClick={() => setIsOpen(false)} className="admin-icon-button" aria-label="Close calendar">
                  <X size={17} />
                </button>
              </div>

              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-[#008060] dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-[#33d6a6]"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="text-[14px] font-bold text-gray-950 dark:text-white">{monthTitle}</div>
                  <button
                    type="button"
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-[#008060] dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-[#33d6a6]"
                    aria-label="Next month"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day, index) => (
                    <div key={`${day}-${index}`} className="flex h-8 items-center justify-center text-[11px] font-bold text-gray-400">
                      {day}
                    </div>
                  ))}

                  {days.map(({ date, current }) => {
                    const iso = toIsoDate(date);
                    const selected = selectedIso === iso;
                    const today = todayIso === iso;

                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => selectDate(date)}
                        className={`flex h-10 items-center justify-center rounded-lg text-[13px] font-semibold transition ${
                          selected
                            ? "bg-[#269a7a] text-white shadow-sm"
                            : current
                              ? "text-gray-800 hover:bg-[#20c997]/10 hover:text-[#007a5a] dark:text-white/80 dark:hover:text-[#33d6a6]"
                              : "text-gray-300 hover:bg-gray-100 dark:text-white/20 dark:hover:bg-white/5"
                        } ${today && !selected ? "ring-1 ring-[#20c997]/40" : ""}`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex justify-between gap-2 border-t border-gray-200 pt-4 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setIsOpen(false);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => selectDate(new Date())}
                    className="rounded-lg bg-[#269a7a] px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#1b7359]"
                  >
                    Today
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
