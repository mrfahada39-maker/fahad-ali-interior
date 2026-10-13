'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.6,
  className = '',
}: AnimatedCounterProps) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!spanRef.current) return;
    const targetVal = Number(value) || 0;

    const controls = animate(0, targetVal, {
      duration,
      ease: 'easeOut',
      onUpdate: (currentNum) => {
        if (spanRef.current) {
          const formatted =
            decimals > 0
              ? currentNum.toFixed(decimals)
              : new Intl.NumberFormat('en-PK').format(Math.floor(currentNum));
          spanRef.current.textContent = `${prefix}${formatted}${suffix}`;
        }
      },
    });

    return () => {
      controls.stop();
    };
  }, [value, prefix, suffix, decimals, duration]);

  return <span ref={spanRef} className={className}>{prefix}0{suffix}</span>;
}
