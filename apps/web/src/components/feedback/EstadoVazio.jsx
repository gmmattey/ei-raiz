import React from 'react';
import { assetPath } from '../../utils/assetPath';

export default function EstadoVazio({ titulo, descricao, acaoTexto, onAcao }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center fade-in-up">
      <img
        src={assetPath('/assets/logo/simbolo-padrao.svg')}
        alt="Esquilo"
        className="h-16 w-16 mb-6 opacity-80"
      />
      <h3 className="font-['Sora'] text-xl font-bold text-[var(--text-primary)] mb-2">
        {titulo}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-8 leading-relaxed">
        {descricao}
      </p>
      {acaoTexto && onAcao && (
        <button
          onClick={onAcao}
          className="rounded-sm bg-[var(--accent)] px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-[#D95B22]"
        >
          {acaoTexto}
        </button>
      )}
    </div>
  );
}
