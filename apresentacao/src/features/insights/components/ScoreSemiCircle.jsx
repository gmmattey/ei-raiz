import React from 'react';

export const ScoreSemiCircle = ({ score = 0, maxScore = 1000, label = '', ocultarValores = false }) => {
  const percentage = Math.min((score / maxScore) * 100, 100);
  const radius = 70;
  const circumference = Math.PI * radius; // Semicircle circumference
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  const circleColor = percentage < 30 ? '#E85C5C' : percentage < 50 ? '#B8880A' : percentage < 70 ? '#0B1218' : '#1A7A45';

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 120" className="w-full max-w-sm drop-shadow-sm">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={circleColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={circleColor} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Background semicircle track */}
        <path
          d={`M 30 100 A ${radius} ${radius} 0 0 1 170 100`}
          fill="none"
          stroke="rgba(11, 18, 24, 0.08)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Progress semicircle */}
        <path
          d={`M 30 100 A ${radius} ${radius} 0 0 1 170 100`}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />

        {/* Center score value */}
        <text
          x="100"
          y="65"
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-['Sora'] font-bold fill-[#0B1218]"
          style={{ fontSize: '48px', letterSpacing: '-1px' }}
        >
          {ocultarValores ? '••' : Math.round(score)}
        </text>

        {/* Max score label */}
        <text
          x="100"
          y="85"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-medium fill-[#0B1218]/60"
        >
          de {maxScore}
        </text>

        {/* Percentage indicator */}
        <text
          x="100"
          y="102"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-semibold fill-[#0B1218]/80"
        >
          {Math.round(percentage)}%
        </text>
      </svg>
    </div>
  );
};
