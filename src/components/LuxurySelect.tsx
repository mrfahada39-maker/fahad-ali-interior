'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface LuxurySelectOption {
  value: string;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
}

interface LuxurySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: LuxurySelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  menuClassName?: string;
}

export default function LuxurySelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  icon,
  className = '',
  menuClassName = '',
}: LuxurySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative inline-block text-left select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9.5 px-3.5 bg-[#FCFAF7] border rounded-xl flex items-center justify-between gap-2.5 text-xs font-black text-[#221814] cursor-pointer transition-all shadow-2xs hover:bg-white hover:border-[#B88E4B] active:scale-[0.98] ${
          isOpen ? 'border-[#B88E4B] ring-2 ring-[#B88E4B]/20 bg-white shadow-xs' : 'border-[#E7DDD0]'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-[#8C6239] shrink-0">{icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`text-[#8C6239] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#B88E4B]' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-50 mt-1.5 min-w-[210px] max-h-[290px] overflow-y-auto rounded-[18px] bg-white/98 backdrop-blur-md border-2 border-[#E2D5C5] p-1.5 shadow-[0_12px_36px_rgba(44,30,24,0.14)] ${menuClassName}`}
            style={{ right: 0 }}
          >
            {/* Top Luxury Accent line */}
            <div className="h-[2.5px] w-12 bg-gradient-to-r from-[#D4AF37] to-[#B88E4B] rounded-full mx-auto mb-1 opacity-70" />

            <div className="space-y-0.5">
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2.5 transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#B88E4B] via-[#A68254] to-[#8C6944] text-white font-black shadow-xs'
                        : 'text-[#221814] font-bold hover:bg-[#FAF5EE] hover:text-[#8C6239]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {option.icon && (
                        <span className={`shrink-0 ${isSelected ? 'text-white' : 'text-[#8C6239]'}`}>
                          {option.icon}
                        </span>
                      )}
                      <span className="truncate">{option.label}</span>
                    </div>

                    {isSelected && (
                      <Check size={14} className="text-white shrink-0 stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
