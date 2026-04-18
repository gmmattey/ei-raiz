import React from "react";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
      <div>
        <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-2 text-[var(--text-primary)]">{title}</h1>
        {subtitle ? <p className="text-[var(--text-secondary)] text-sm font-medium">{subtitle}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
