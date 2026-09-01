'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

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
    const obj = { val: 0 };

    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: targetVal,
        duration: duration,
        ease: 'power2.out',
        onUpdate: () => {
          if (spanRef.current) {
            const currentNum = obj.val;
            const formatted = decimals > 0 
              ? currentNum.toFixed(decimals)
              : new Intl.NumberFormat('en-PK').format(Math.floor(currentNum));
            spanRef.current.textContent = `${prefix}${formatted}${suffix}`;
          }
        },
      });
    }, spanRef);

    return () => ctx.revert();
  }, [value, prefix, suffix, decimals, duration]);

  return <span ref={spanRef} className={className}>{prefix}0{suffix}</span>;
}
