import React from 'react';

export const ScenarioComparisonCard = ({ title, items, isHighlighted, icon: Icon }) => {
  return (
    <div 
      className={`rounded-xl border p-8 shadow-sm transition-all hover:shadow-md ${
        isHighlighted 
          ? 'border-[#0B1218] bg-[#0B1218] text-white' 
          : 'border-[#EFE7DC] bg-white text-[#0B1218]'
      }`}
    >
      <div className="mb-6 flex items-center gap-4">
        {Icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            isHighlighted ? 'bg-white/10 text-[#F56A2A]' : 'bg-[#F56A2A]/10 text-[#F56A2A]'
          }`}>
            <Icon size={24} />
          </div>
        )}
        <h4 className="font-['Sora'] text-xl font-bold">{title}</h4>
      </div>

      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
              isHighlighted ? 'text-white/40' : 'text-[#0B1218]/40'
            }`}>
              {item.label}
            </p>
            <p className="font-['Sora'] text-2xl font-bold tracking-tight">
              {item.value}
            </p>
            {item.description && (
              <p className={`text-[11px] leading-relaxed ${
                isHighlighted ? 'text-white/60' : 'text-[#0B1218]/60'
              }`}>
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScenarioComparisonCard;
