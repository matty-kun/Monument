"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import Image from "next/image";

export interface DropdownOption {
  id: string;
  name: string;
  image_url?: string;
}

interface MultiSelectDropdownProps {
  options: DropdownOption[];
  selectedValues: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter(opt => selectedValues.includes(opt.name));

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
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border rounded px-3 py-2 text-left bg-white flex items-center gap-2 min-h-[42px]"
      >
        {selectedOptions.length > 0 ? (
          <div className="flex items-center gap-2">
            {selectedOptions.map((option, index) => (
              <Fragment key={option.id}>
                {option.image_url ? (
                  <Image
                    src={option.image_url}
                    alt={option.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 object-cover rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{option.name.substring(0,2)}</div>
                )}
                {index < selectedOptions.length - 1 && <span className="font-bold text-gray-400">vs</span>}
              </Fragment>
            ))}
          </div>
        ) : placeholder}
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {option.image_url ? (
                <Image src={option.image_url} alt={option.name} width={24} height={24} className="w-6 h-6 object-cover rounded-full mr-3" />
              ) : (
                <div className="w-6 h-6 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-xs font-bold text-gray-500">
                  {option.name.substring(0, 2)}
                </div>
              )}
              <input
                type="checkbox"
                checked={selectedValues.includes(option.name)}
                onChange={() => onChange(option.name)}
                className="mr-3"
              />
              {option.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}