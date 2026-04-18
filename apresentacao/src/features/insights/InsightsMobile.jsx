import React, { useEffect, useState } from 'react';
import { insightsApi } from '../../cliente-api';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { assetPath } from '../../utils/assetPath';

export default function InsightsMobile() {
  const { ocultarValores } = useModoVisualizacao();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const dados = await insightsApi.obterResumo();
        if (!ativo) return;
        setResumo(dados);
        setErro('');
      } catch {
        if (ativo) setErro('Falha ao carregar os insights.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const score = resumo?.scoreUnificado?.score ?? resumo?.score_unificado?.score ?? 0;
  const risco = resumo?.riscoPrincipal?.titulo || 'Sem risco critico detectado';
  const acao = resumo?.acaoPrioritaria?.descricao || 'Continue acompanhando sua carteira e aportes.';
  const diagnostico = resumo?.diagnosticoFinal?.mensagem || resumo?.diagnostico?.resumo || 'Diagnostico indisponivel.';

  return (
    <section className="space-y-4 pb-4">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Insights</p>
        <h1 className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">Traducao da carteira</h1>
      </header>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={assetPath('/assets/icons/laranja/score-premium.svg')} alt="" className="h-5 w-5" />
            <p className="text-[12px] text-[var(--text-secondary)]">Score unificado</p>
          </div>
          <p className="text-[20px] font-bold text-[#F56A2A]">{ocultarValores ? '•••' : Math.round(score)}</p>
        </div>
      </article>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex items-start gap-2">
          <img src={assetPath('/assets/icons/laranja/alerta-premium.svg')} alt="" className="mt-1 h-4 w-4" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Risco principal</p>
            <p className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">{risco}</p>
          </div>
        </div>
      </article>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex items-start gap-2">
          <img src={assetPath('/assets/icons/laranja/tendencia-premium.svg')} alt="" className="mt-1 h-4 w-4" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Acao prioritaria</p>
            <p className="mt-1 text-[14px] text-[var(--text-primary)]">{acao}</p>
          </div>
        </div>
      </article>

      <article className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Diagnostico final</p>
        <p className="mt-2 text-[14px] leading-5 text-[var(--text-primary)]">{diagnostico}</p>
      </article>

      {loading && <p className="text-[12px] text-[var(--text-secondary)]">Carregando insights...</p>}
      {erro && <p className="text-[12px] text-[#E85C5C]">{erro}</p>}
    </section>
  );
}

