'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';

interface LiquidCardGraphProps {
  color?: string;
  variant?: 'gold' | 'blue' | 'purple' | 'emerald' | 'amber';
  index?: number;
  value?: number | string;
  duration?: number;
}

export function LiquidCardGraph({
  color,
  variant,
  index = 0,
  value,
  duration = 1.5,
}: LiquidCardGraphProps) {
  const reactId = useId().replace(/:/g, '');

  const normalizedVariant = variant === 'amber' ? 'gold' : variant;

  // Auto-detect variant from color string if variant not explicitly provided
  const resolvedVariant: 'gold' | 'blue' | 'purple' | 'emerald' =
    normalizedVariant ||
    (color && (color.includes('B88E') || color.includes('amber') || color.includes('gold') || color.includes('yellow'))
      ? 'gold'
      : color && (color.includes('blue') || color.includes('sky'))
      ? 'blue'
      : color && (color.includes('purple') || color.includes('fuchsia'))
      ? 'purple'
      : color && (color.includes('emerald') || color.includes('green') || color.includes('teal'))
      ? 'emerald'
      : index === 0
      ? 'gold'
      : index === 1
      ? 'blue'
      : index === 2
      ? 'purple'
      : 'emerald');

  const palette = {
    gold: {
      from: 'rgba(184, 142, 75, 0.36)',
      mid: 'rgba(245, 158, 11, 0.20)',
      to: 'rgba(184, 142, 75, 0.01)',
      stroke: '#B88E4B',
      glow: 'rgba(184, 142, 75, 0.7)',
      dot: '#D97706',
      badge: '+18.4% ▲',
    },
    blue: {
      from: 'rgba(59, 130, 246, 0.36)',
      mid: 'rgba(37, 99, 235, 0.20)',
      to: 'rgba(59, 130, 246, 0.01)',
      stroke: '#3B82F6',
      glow: 'rgba(59, 130, 246, 0.7)',
      dot: '#2563EB',
      badge: '+24.2% ▲',
    },
    purple: {
      from: 'rgba(168, 85, 247, 0.36)',
      mid: 'rgba(147, 51, 234, 0.20)',
      to: 'rgba(168, 85, 247, 0.01)',
      stroke: '#A855F7',
      glow: 'rgba(168, 85, 247, 0.7)',
      dot: '#9333EA',
      badge: '+31.0% ▲',
    },
    emerald: {
      from: 'rgba(16, 185, 129, 0.36)',
      mid: 'rgba(5, 150, 105, 0.20)',
      to: 'rgba(16, 185, 129, 0.01)',
      stroke: '#10B981',
      glow: 'rgba(16, 185, 129, 0.7)',
      dot: '#059669',
      badge: '100% In-Stock',
    },
  }[resolvedVariant];

  const gradPrimary = `liquid-fill-primary-${reactId}`;
  const gradSecondary = `liquid-fill-secondary-${reactId}`;
  const filterGlow = `liquid-filter-glow-${reactId}`;

  return (
    <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 pointer-events-none overflow-hidden rounded-b-2xl sm:rounded-b-[22px] z-0 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
      <style>{`
        @keyframes liquidFlowLeft_${reactId} {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes liquidFlowRight_${reactId} {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes liquidBob_${reactId} {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>

      {/* Synchronized Surge Container: Liquid level dynamically rises up as number counts up */}
      <motion.div
        key={String(value ?? 'initial')}
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full relative"
      >
        {/* SVG Container holding dual undulating liquid graph waves */}
        <svg
          className="w-[200%] h-full absolute bottom-0 left-0"
          viewBox="0 0 800 120"
          preserveAspectRatio="none"
          style={{
            animation: `liquidFlowLeft_${reactId} 12s linear infinite`,
            willChange: 'transform',
          }}
        >
          <defs>
            <linearGradient id={gradPrimary} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.from} />
              <stop offset="45%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.to} />
            </linearGradient>

            <filter id={filterGlow} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor={palette.glow} />
            </filter>
          </defs>

          {/* Primary Liquid Wave Area (Seamless 2-Cycle Bézier Wave) */}
          <path
            d="
              M 0,65
              C 50,45 100,75 150,50
              C 200,25 250,60 300,38
              C 350,16 380,48 400,65
              C 450,45 500,75 550,50
              C 600,25 650,60 700,38
              C 750,16 780,48 800,65
              L 800,120 L 0,120 Z
            "
            fill={`url(#${gradPrimary})`}
          />

          {/* Liquid Trend Graph Line: Draws along the crest synchronously with number counting */}
          <motion.path
            d="
              M 0,65
              C 50,45 100,75 150,50
              C 200,25 250,60 300,38
              C 350,16 380,48 400,65
              C 450,45 500,75 550,50
              C 600,25 650,60 700,38
              C 750,16 780,48 800,65
            "
            fill="none"
            stroke={palette.stroke}
            strokeWidth="2.4"
            strokeLinecap="round"
            filter={`url(#${filterGlow})`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Glowing Graph Peak Indicator Dots with Pulse */}
          <circle cx="300" cy="38" r="3.5" fill="#FFFFFF" stroke={palette.dot} strokeWidth="2" filter={`url(#${filterGlow})`} />
          <circle cx="700" cy="38" r="3.5" fill="#FFFFFF" stroke={palette.dot} strokeWidth="2" filter={`url(#${filterGlow})`} />
        </svg>

        {/* Secondary Counter-Wave (Provides 3D liquid depth and fluid motion) */}
        <svg
          className="w-[200%] h-full absolute bottom-0 left-0 opacity-60"
          viewBox="0 0 800 120"
          preserveAspectRatio="none"
          style={{
            animation: `liquidFlowRight_${reactId} 18s linear infinite`,
            willChange: 'transform',
          }}
        >
          <defs>
            <linearGradient id={gradSecondary} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.mid} />
              <stop offset="70%" stopColor={palette.to} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          <path
            d="
              M 0,78
              C 60,88 120,55 180,70
              C 240,85 280,42 340,58
              C 380,70 395,80 400,78
              C 460,88 520,55 580,70
              C 640,85 680,42 740,58
              C 780,70 795,80 800,78
              L 800,120 L 0,120 Z
            "
            fill={`url(#${gradSecondary})`}
          />
        </svg>
      </motion.div>
    </div>
  );
}

export default LiquidCardGraph;
