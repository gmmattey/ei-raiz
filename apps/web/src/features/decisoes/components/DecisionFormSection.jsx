import React from 'react';

export const DecisionFormSection = ({ title, description, children, icon: Icon }) => {
  return (
    <section className="rounded-sm border border-[#EFE7DC] bg-white p-6 md:p-8 shadow-sm">
      <div className="mb-6 flex items-start gap-4">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#F56A2A]/10 text-[#F56A2A]">
            <Icon size={20} />
          </div>
        )}
        <div>
          <h3 className="font-['Sora'] text-lg font-bold text-[#0B1218]">{title}</h3>
          {description && (
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#0B1218]/50 uppercase tracking-widest">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
};

export default DecisionFormSection;
