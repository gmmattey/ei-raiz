import React from 'react';
import { Calendar, ArrowRight, Trash2 } from 'lucide-react';

export const SavedSimulationCard = ({ title, type, date, recommendation, onClick, onDelete }) => {
  return (
    <div className="group relative flex flex-col gap-6 rounded-xl border border-[#EFE7DC] bg-white p-6 shadow-sm transition-all hover:border-[#F56A2A] hover:shadow-md md:flex-row md:items-center">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F56A2A]">
            {type}
          </span>
          <div className="flex items-center gap-1 text-[10px] font-medium text-[#0B1218]/40">
            <Calendar size={12} /> {date}
          </div>
        </div>
        <h4 className="font-['Sora'] text-lg font-bold text-[#0B1218]">{title}</h4>
        <p className="text-sm text-[#0B1218]/60">
          Recomendação: <span className="font-bold text-[#0B1218]">{recommendation}</span>
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#0B1218]/20 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={18} />
          </button>
        )}
        <button 
          onClick={onClick}
          className="flex items-center gap-2 rounded-xl bg-[#0B1218] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-[#111923]"
        >
          Ver detalhes <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default SavedSimulationCard;
