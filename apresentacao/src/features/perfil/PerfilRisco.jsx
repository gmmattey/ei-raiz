import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RefreshCcw, Info, X, AlertCircle, Sparkles } from 'lucide-react';
import { perfilApi, patrimonioApi } from '../../cliente-api';

const PERFIS = {
  conservador: {
    titulo: 'Esquilo Conservador',
    descricao: 'Seu perfil prioriza preservação de capital e previsibilidade sobre ganhos maiores.',
    alvos: { renda_fixa: 70, fundo: 15, acao: 10, previdencia: 5 },
  },
  moderado: {
    titulo: 'Esquilo Moderado',
    descricao: 'Seu perfil busca o equilíbrio entre proteção de poder de compra e crescimento real de longo prazo.',
    alvos: { renda_fixa: 40, fundo: 20, acao: 30, previdencia: 10 },
  },
  arrojado: {
    titulo: 'Esquilo Arrojado',
    descricao: 'Seu perfil aceita volatilidade maior em troca de potencial de retorno acima da média no longo prazo.',
    alvos: { renda_fixa: 20, fundo: 15, acao: 55, previdencia: 10 },
  },
};

const CLASSES = [
  { key: 'renda_fixa',  label: 'Renda Fixa',  cor: 'bg-[#6FCF97]' },
  { key: 'acao',        label: 'Ações',       cor: 'bg-[#F56A2A]' },
  { key: 'fundo',       label: 'FIIs',        cor: 'bg-[#3B82F6]' },
  { key: 'previdencia', label: 'Previdência', cor: 'bg-[#F2C94C]' },
];

const ExplainerTooltip = ({ title, content, onClose }) => (
  <div className="absolute right-0 z-[100] mt-2 w-72 bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 rounded-xl animate-in fade-in zoom-in-95 duration-200">
    <div className="flex justify-between items-start mb-3">
      <h4 className="font-['Sora'] text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight">{title}</h4>
      <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[#E85C5C] transition-colors cursor-pointer">
        <X size={14} />
      </button>
    </div>
    <p className="text-[12px] leading-relaxed text-[var(--text-secondary)] font-medium">{content}</p>
  </div>
);

const InfoTrigger = ({ title, text }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1 text-[var(--text-muted)] hover:text-[#F56A2A] transition-colors cursor-pointer"
      >
        <Info size={14} />
      </button>
      {isOpen && <ExplainerTooltip title={title} content={text} onClose={() => setIsOpen(false)} />}
    </div>
  );
};

const AllocationBar = ({ label, current, target, cor }) => {
  const diff = current - target;
  const forte = Math.abs(diff) > 5;
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">{label}</span>
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Alvo: {target}%</span>
      </div>
      <div className="h-4 w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full overflow-hidden relative">
        <div
          className={`h-full ${cor} transition-all duration-1000`}
          style={{ width: `${Math.min(100, current)}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[var(--text-primary)] opacity-30"
          style={{ left: `${target}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-bold text-[var(--text-muted)]">Atual: {current.toFixed(1)}%</span>
        <span className={`text-[9px] font-bold ${forte ? 'text-[#E85C5C]' : 'text-[#6FCF97]'}`}>
          {diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
        </span>
      </div>
    </div>
  );
};

const EstadoVazio = ({ titulo, texto, cta, onCta }) => (
  <div className="w-full rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] p-12 text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F56A2A]/10 text-[#F56A2A] mb-4">
      <Sparkles size={20} />
    </div>
    <h3 className="font-['Sora'] text-xl font-bold text-[var(--text-primary)] mb-2">{titulo}</h3>
    <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">{texto}</p>
    {cta && (
      <button
        onClick={onCta}
        className="inline-flex items-center gap-2 bg-[#F56A2A] px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-white rounded-lg hover:bg-[#d95a20] transition-all"
      >
        {cta}
      </button>
    )}
  </div>
);

export default function PerfilRisco() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const [p, r] = await Promise.all([perfilApi.obterPerfil(), patrimonioApi.obterResumo()]);
        if (!ativo) return;
        setPerfil(p);
        setResumo(r);
      } catch (e) {
        if (ativo) setErro(e?.message ?? 'Falha ao carregar perfil.');
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  if (carregando) {
    return (
      <div className="w-full font-['Inter'] text-[var(--text-primary)]">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-[var(--bg-secondary)] rounded" />
          <div className="h-48 bg-[var(--bg-secondary)] rounded-xl" />
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="w-full font-['Inter'] text-[var(--text-primary)]">
        <EstadoVazio titulo="Não foi possível carregar" texto={erro} />
      </div>
    );
  }

  const tolerancia = perfil?.toleranciaRisco;
  if (!tolerancia) {
    return (
      <div className="w-full font-['Inter'] text-[var(--text-primary)]">
        <EstadoVazio
          titulo="Descubra seu perfil de risco"
          texto="Responda o teste de suitability para saber seu perfil Esquilo e ver a alocação alvo ideal pra você."
          cta="Fazer teste de perfil"
          onCta={() => navigate('/perfil')}
        />
      </div>
    );
  }

  const cfg = PERFIS[tolerancia];
  const temAtivos = (resumo?.quantidadeItens ?? 0) > 0;

  const atuais = {};
  for (const a of resumo?.alocacao ?? []) {
    const k = a.tipo in cfg.alvos ? a.tipo : null;
    if (k) atuais[k] = (atuais[k] ?? 0) + (a.pesoPct ?? 0);
  }

  let desalinhamento = 0;
  for (const { key } of CLASSES) {
    const alvo = cfg.alvos[key] ?? 0;
    const atual = atuais[key] ?? 0;
    desalinhamento += Math.abs(atual - alvo);
  }
  desalinhamento = desalinhamento / 2;

  const classeMaiorDesvio = CLASSES
    .map(({ key, label }) => ({ label, diff: (atuais[key] ?? 0) - (cfg.alvos[key] ?? 0) }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0];

  return (
    <div className="w-full font-['Inter'] text-[var(--text-primary)] animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-20 items-start">

        <aside className="space-y-12">
          <div>
            <div className="flex items-center gap-3 text-[#F56A2A] mb-4">
              <ShieldCheck size={20} />
              <span className="text-xs font-bold uppercase tracking-[0.3em]">Suitability Ativo</span>
            </div>
            <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-4">{cfg.titulo}</h1>
            <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed mb-8">
              {cfg.descricao}
            </p>
            <button
              onClick={() => navigate('/perfil')}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[#F56A2A] transition-all"
            >
              <RefreshCcw size={14} /> Refazer Teste de Perfil
            </button>
          </div>

          {temAtivos && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 text-[var(--text-primary)] rounded-xl">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">Diagnóstico de Desvio</h4>
              <p className="text-xs leading-relaxed mb-8">
                Sua carteira hoje está{' '}
                <span className={`${desalinhamento > 10 ? 'text-[#E85C5C]' : 'text-[#6FCF97]'} font-bold`}>
                  {desalinhamento.toFixed(1)}% {desalinhamento > 10 ? 'desalinhada' : 'alinhada'}
                </span>{' '}
                com o perfil {tolerancia}.
                {desalinhamento > 10 && classeMaiorDesvio && (
                  <>
                    {' '}O maior desvio está em <span className="font-bold">{classeMaiorDesvio.label}</span>.
                  </>
                )}
              </p>
              <button
                onClick={() => navigate('/carteira')}
                className="w-full bg-[#F56A2A] py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#d95a20] transition-all rounded-lg text-white"
              >
                Ver Sua Carteira
              </button>
            </div>
          )}
        </aside>

        <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">
          <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-primary)]">
            <h3 className="font-['Sora'] text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Alocação Alvo vs Atual</h3>
            <InfoTrigger
              title="Cálculo de Reequilíbrio"
              text="O Alvo é definido pelo seu perfil de suitability. O Atual é calculado sobre o valor dos itens cadastrados na sua carteira."
            />
          </div>

          <div className="p-10">
            {!temAtivos ? (
              <EstadoVazio
                titulo="Sem ativos na carteira ainda"
                texto="Adicione seus primeiros ativos pra começarmos a comparar sua alocação atual com a alvo do seu perfil."
                cta="Ir para carteira"
                onCta={() => navigate('/carteira')}
              />
            ) : (
              CLASSES.map(({ key, label, cor }) => (
                <AllocationBar
                  key={key}
                  label={label}
                  current={atuais[key] ?? 0}
                  target={cfg.alvos[key] ?? 0}
                  cor={cor}
                />
              ))
            )}
          </div>

          {temAtivos && desalinhamento > 10 && classeMaiorDesvio && (
            <div className="p-8 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-[#E85C5C] shrink-0" size={20} />
                <div>
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#E85C5C] mb-1">Atenção Necessária</h5>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                    {classeMaiorDesvio.diff > 0 ? (
                      <>O excesso em <span className="font-bold">{classeMaiorDesvio.label}</span> ({classeMaiorDesvio.diff.toFixed(1)}% acima do alvo) aumenta a volatilidade da sua carteira. Considere direcionar os próximos aportes para as outras classes até atingir o equilíbrio.</>
                    ) : (
                      <>Sua carteira está {Math.abs(classeMaiorDesvio.diff).toFixed(1)}% abaixo do alvo em <span className="font-bold">{classeMaiorDesvio.label}</span>. Considere reforçar essa classe nos próximos aportes.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
