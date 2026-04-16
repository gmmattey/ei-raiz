import React from 'react';

export const SimulationResultBlock = ({ title, value, unit, description, trend }) => {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[#EFE7DC] bg-[#FDFCFB] p-6 transition-all hover:bg-white">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40">
        {title}
      </p>
      <div className="flex items-baseline gap-1">
        <h5 className="font-['Sora'] text-2xl font-bold text-[#0B1218]">
          {value}
        </h5>
        {unit && (
          <span className="text-sm font-bold text-[#0B1218]/40">
            {unit}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-2 text-[11px] leading-relaxed text-[#0B1218]/60">
          {description}
        </p>
      )}
      {trend && (
        <div className={`mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${
          trend.isPositive ? 'text-[#6FCF97]' : 'text-[#E85C5C]'
        }`}>
          {trend.label}
        </div>
      )}
    </div>
  );
};

export default SimulationResultBlock;
