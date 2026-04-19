import React from 'react';

export const ScoreSemiCircle = ({ score = 0, maxScore = 1000, label = '', ocultarValores = false }) => {
  const percentage = Math.min((score / maxScore) * 100, 100);
  const circleColor = percentage < 30 ? '#E85C5C' : percentage < 50 ? '#B8880A' : percentage < 70 ? '#0B1218' : '#1A7A45';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-full max-w-xs">
        {/* Background semicircle */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(11, 18, 24, 0.1)"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Progress semicircle */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={circleColor}
          strokeWidth="12"
          strokeDasharray={`${(Math.PI * 80 * percentage) / 100} ${Math.PI * 80}`}
          strokeLinecap="round"
          className="transition-all duration-500"
        />

        {/* Score text */}
        <text
          x="100"
          y="70"
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-['Sora'] text-3xl font-bold fill-[#0B1218]"
        >
          {ocultarValores ? '••' : Math.round(score)}
        </text>

        {/* Label */}
        {label && (
          <text
            x="100"
            y="95"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-semibold fill-[#0B1218]/60"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
};
