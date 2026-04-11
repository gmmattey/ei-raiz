import React from "react";
import { Info } from "lucide-react";

export default function MetricCard({ label, value }) {
  return (
    <div className="bg-white border border-[#EFE7DC] p-6 rounded-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-[#0B1218]/40 uppercase tracking-widest">{label}</span>
        <Info size={12} className="text-[#0B1218]/20" />
      </div>
      <h3 className="font-['Sora'] text-2xl font-bold text-[#0B1218]">{value}</h3>
    </div>
  );
}
