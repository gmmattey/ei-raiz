import React, { useEffect, useState } from 'react';
import { historicoApi } from '../../cliente-api';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function HistoricoMobile() {
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const dados = await historicoApi.listarEventos(20);
        if (!ativo) return;
        setEventos(dados || []);
      } catch {
        if (ativo) setErro('Falha ao carregar historico.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <section className="space-y-4 pb-4">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Historico</p>
        <h1 className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">Linha do tempo</h1>
      </header>

      <div className="space-y-2">
        {eventos.map((evento, index) => (
          <article key={`${evento.dataEvento || 'data'}-${index}`} className="rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3">
            <p className="text-[12px] font-semibold text-[var(--text-primary)]">{evento.titulo || 'Evento'}</p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{evento.descricao || 'Sem descricao'}</p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)]">{evento.dataEvento ? new Date(evento.dataEvento).toLocaleDateString('pt-BR') : 'Sem data'}</span>
              <span className="font-bold text-[#F56A2A]">{formatCurrency(evento.impactoPatrimonio || 0)}</span>
            </div>
          </article>
        ))}
      </div>

      {!loading && eventos.length === 0 && <p className="text-[12px] text-[var(--text-secondary)]">Nenhum evento encontrado.</p>}
      {loading && <p className="text-[12px] text-[var(--text-secondary)]">Carregando historico...</p>}
      {erro && <p className="text-[12px] text-[#E85C5C]">{erro}</p>}
    </section>
  );
}

