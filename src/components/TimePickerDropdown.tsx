"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, X } from "lucide-react";

interface TimePickerDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  allowClear?: boolean;
}

const hours = Array.from({ length: 12 }, (_, index) => index + 1);
const minutes = ["00", "15", "30", "45"];

function parseTime(value: string) {
  if (!value) return { hour12: 9, minute: "00", ampm: "AM" as "AM" | "PM" };
  const [hourValue, minuteValue = "00"] = value.split(":").map(Number);
  const ampm: "AM" | "PM" = hourValue >= 12 ? "PM" : "AM";
  const hour12 = hourValue === 0 ? 12 : hourValue > 12 ? hourValue - 12 : hourValue;
  return {
    hour12,
    minute: String(minuteValue).padStart(2, "0"),
    ampm,
  };
}

function to24Hour(hour12: number, minute: string, ampm: "AM" | "PM") {
  let hour = hour12;
  if (ampm === "PM" && hour12 < 12) hour += 12;
  if (ampm === "AM" && hour12 === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function formatTime(value: string) {
  if (!value) return "Select time";
  const parsed = parseTime(value);
  return `${String(parsed.hour12).padStart(2, "0")}:${parsed.minute} ${parsed.ampm}`;
}

export default function TimePickerDropdown({ value, onChange, disabled = false, allowClear = false }: TimePickerDropdownProps) {
  const parsed = useMemo(() => parseTime(value), [value]);
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState(parsed.hour12);
  const [minute, setMinute] = useState(parsed.minute);
  const [ampm, setAmpm] = useState<"AM" | "PM">(parsed.ampm);

  function openPicker() {
    if (disabled) return;
    const current = parseTime(value);
    setHour(current.hour12);
    setMinute(current.minute);
    setAmpm(current.ampm);
    setIsOpen(true);
  }

  function applyTime() {
    onChange(to24Hour(hour, minute, ampm));
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
          <Clock className="h-4 w-4 shrink-0 text-monument-primary" />
          <span className={`truncate text-xs font-bold ${value ? "text-gray-900 dark:text-gray-200" : "text-gray-400"}`}>
            {formatTime(value)}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {allowClear && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
              }}
              className="text-gray-400 transition-colors hover:text-red-500"
            >
              <X size={12} />
            </span>
          )}
          <span className="text-gray-400 text-[10px]">▼</span>
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" className="absolute inset-0 cursor-default" aria-label="Close time picker" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#181818]"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-950 dark:text-white">Choose time</h2>
                  <p className="mt-0.5 text-[12px] text-gray-500 dark:text-white/45">{`${String(hour).padStart(2, "0")}:${minute} ${ampm}`}</p>
                </div>
                <button type="button" onClick={() => setIsOpen(false)} className="admin-icon-button" aria-label="Close time picker">
                  <X size={17} />
                </button>
              </div>

              <div className="p-5">
                <div className="mx-auto mb-5 flex h-48 w-48 items-center justify-center rounded-full border border-gray-200 bg-gray-50 shadow-inner dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="relative h-40 w-40 rounded-full">
                    {hours.map((item, index) => {
                      const angle = (index / 12) * 360 - 60;
                      const radius = 68;
                      const x = Math.cos((angle * Math.PI) / 180) * radius;
                      const y = Math.sin((angle * Math.PI) / 180) * radius;
                      const selected = hour === item;

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setHour(item)}
                          className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[13px] font-bold transition ${
                            selected
                              ? "bg-[#269a7a] text-white shadow-sm"
                              : "text-gray-600 hover:bg-[#20c997]/10 hover:text-[#007a5a] dark:text-white/60 dark:hover:text-[#33d6a6]"
                          }`}
                          style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                        >
                          {item}
                        </button>
                      );
                    })}
                    <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#269a7a]" />
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-4 gap-2">
                  {minutes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setMinute(item)}
                      className={`rounded-lg border px-3 py-2 text-[13px] font-bold transition ${
                        minute === item
                          ? "border-[#008060] bg-[#20c997]/10 text-[#007a5a] dark:border-[#20c997] dark:text-[#33d6a6]"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/10"
                      }`}
                    >
                      :{item}
                    </button>
                  ))}
                </div>

                <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
                  {(["AM", "PM"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setAmpm(item)}
                      className={`rounded-lg py-2 text-[12px] font-bold transition ${
                        ampm === item
                          ? "bg-white text-[#007a5a] shadow-sm dark:bg-[#269a7a] dark:text-white"
                          : "text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between gap-2 border-t border-gray-200 pt-4 dark:border-white/10">
                  {allowClear ? (
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
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={applyTime}
                    className="rounded-lg bg-[#269a7a] px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#1b7359]"
                  >
                    Set time
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
