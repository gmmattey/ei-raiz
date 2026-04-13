import React from 'react';

const toneStyles = {
  critical: 'border-l-4 border-red-500 bg-red-50',
  warning: 'border-l-4 border-yellow-500 bg-yellow-50',
  positive: 'border-l-4 border-green-500 bg-green-50',
  neutral: 'border-l-4 border-gray-300 bg-white',
};

const badgeTypeStyles = {
  critical: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  positive: 'bg-green-100 text-green-800',
  neutral: 'bg-gray-100 text-gray-700',
  info: 'bg-blue-100 text-blue-800',
};

/**
 * VeraCard — Renders frontend_payload from Vera without any business logic.
 *
 * Props:
 * - payload: VeraFrontendPayload from Vera (complete with title, body, cta, badges, tone)
 * - onAction: callback when CTA is clicked (action name, payload data)
 *
 * This component is purely presentational. It does NOT:
 * - interpret decision_type
 * - assemble text
 * - decide CTA
 * - calculate severity or tone
 *
 * It simply renders what Vera prepared.
 */
export function VeraCard({ payload, onAction }) {
  if (!payload) return null;

  const { title, body, supporting_text, cta, badges, tone } = payload;

  const toneClass = toneStyles[tone] || toneStyles.neutral;

  return (
    <div className={`rounded-lg p-4 shadow-sm ${toneClass}`}>
      {/* Badges */}
      {badges && badges.length > 0 && (
        <div className="flex gap-2 mb-3">
          {badges.map((badge, idx) => (
            <span
              key={idx}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeTypeStyles[badge.type] || badgeTypeStyles.neutral}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h3 className="font-semibold text-sm text-gray-900 mb-1">{title}</h3>

      {/* Body */}
      <p className="text-sm text-gray-700 leading-relaxed">{body}</p>

      {/* Supporting text */}
      {supporting_text && (
        <p className="text-xs text-gray-500 mt-2">{supporting_text}</p>
      )}

      {/* CTA Button */}
      {cta && (
        <button
          onClick={() => onAction?.(cta.action, cta.payload)}
          className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {cta.label}
          <span className="ml-1">→</span>
        </button>
      )}
    </div>
  );
}
