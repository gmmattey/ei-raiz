import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp, AlertCircle, CheckCircle2,
  UploadCloud, X, Search, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, Tooltip,
} from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ApiError, carteiraApi, insightsApi, perfilApi, configApi,
  historicoApi, getStoredUser,
} from '../../cliente-api';
import { cache } from '../../utils/cache';
import { useConteudoApp } from '../../hooks/useConteudoApp';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { useTheme } from '../../context/ThemeContext';
import { assetPath } from '../../utils/assetPath';
import Onboarding from '../onboarding/onboarding';
import PerfilUsuario from '../perfil/PerfilUsuario';
import Importar from '../importacao/Importar';
import Configuracoes from '../perfil/Configuracoes';

const HOME_CACHE_KEY = 'home_v1';
const HOME_CACHE_FRESCA_TTL = 60 * 1000;

const ALOCACAO_CONFIG = [
  { key: 'acao',        label: 'Ações',       cor: '#F56A2A' },
  { key: 'renda_fixa',  label: 'Renda Fixa',  cor: '#6FCF97' },
  { key: 'fundo',       label: 'FIIs',         cor: '#3B82F6' },
  { key: 'previdencia', label: 'Previdência',  cor: '#F2C94C' },
  { key: 'poupanca',    label: 'Poupança',     cor: '#A7B0BC' },
  { key: 'bens',        label: 'Bens',         cor: '#9B59B6' },
];

const QUICK_ACTIONS = [
  { label: 'Importar',     icon: 'importar',      path: '/importar' },
  { label: 'Carteira',     icon: 'carteira',      path: '/carteira' },
  { label: 'Decisões',     icon: 'score',         path: '/decisoes' },
  { label: 'Histórico',    icon: 'historico',     path: '/historico' },
  { label: 'Perfil',       icon: 'perfil',        path: '/perfil' },
  { label: 'Config.',      icon: 'configuracoes', path: '/configuracoes' },
];

const FILTROS_ALL = ['1M', '3M', '6M', '1A', 'Max'];
const FILTROS_MESES = { '1M': 1, '3M': 3, '6M': 6, '1A': 12 };

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
  }).format(Number(v || 0));

const fmtPct = (v) =>
  `${Number(v || 0) >= 0 ? '+' : ''}${Number(v || 0).toFixed(1)}%`;

/**
 * Mapeamento de tipos de ativo para nomes descritivos
 */
const TIPO_LABELS = {
  'acao': 'Ações',
  'fundo': 'Fundos',
  'renda_fixa': 'Renda Fixa',
  'previdencia': 'Previdência',
  'poupanca': 'Poupança',
  'cripto': 'Criptomoedas',
  'bens': 'Bens',
};

const getTipoLabel = (tipo) => TIPO_LABELS[tipo] || 'Outros';

/**
 * Converte avaliação (% vs benchmark) em classificação qualitativa
 * BOM: >= 5%, NEUTRO: -5% a 5%, RUIM: < -5%
 */
const getAvaliacaoLabel = (avaliacaoValor) => {
  if (avaliacaoValor === null || avaliacaoValor === undefined) return 'N/A';
  if (avaliacaoValor >= 5) return 'BOM';
  if (avaliacaoValor <= -5) return 'RUIM';
  return 'NEUTRO';
};

const getAvaliacaoCor = (avaliacaoValor) => {
  if (avaliacaoValor === null || avaliacaoValor === undefined) return 'text-[var(--text-muted)]';
  if (avaliacaoValor >= 5) return 'text-[#6FCF97]';
  if (avaliacaoValor <= -5) return 'text-[#E85C5C]';
  return 'text-[var(--text-muted)]';
};

/**
 * Retorna a URL do logo da instituição ou um placeholder com sigla
 * Mapeamento de instituições conhecidas para seus logos
 */
const getInstituicaoDisplay = (abrev) => {
  // Mapeamento de abreviaturas/nomes para URLs de logo
  const logoMap = {
    'XPL': 'https://via.placeholder.com/32?text=XPL',
    'BTG': 'https://via.placeholder.com/32?text=BTG',
    'ITAU': 'https://via.placeholder.com/32?text=ITU',
    'BBBR': 'https://via.placeholder.com/32?text=BB',
    'CAIXA': 'https://via.placeholder.com/32?text=CEF',
    'BRADESCO': 'https://via.placeholder.com/32?text=BRA',
    // Adicionar mais conforme necessário
  };

  // Retorna logo se existir, caso contrário retorna null (para placeholder)
  return logoMap[abrev] || null;
};

/**
 * Lê a rentabilidade acumulada desde a aquisição. Retorna null quando
 * `rentabilidadeConfiavel=false` — UI deve exibir "—" nesse caso, nunca 0.
 */
const rentabilidadeDesdeAquisicao = (obj) => {
  if (!obj || obj.rentabilidadeConfiavel === false) return null;
  const v = obj.rentabilidadeDesdeAquisicaoPct;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const formatMes = (anoMes) => {
  const [, mes] = (anoMes || '').split('-');
  return MESES_ABREV[parseInt(mes, 10) - 1] ?? anoMes;
};

const getSaudacao = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const getNomeExibicao = (nomeCompleto) => {
  const partes = String(nomeCompleto || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return 'investidor(a)';
  if (partes.length >= 2) return `${partes[0]} ${partes[1]}`;
  return partes[0];
};

export default function HomeLobby() {
  const { texto } = useConteudoApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { ocultarValores } = useModoVisualizacao();
  const { isDarkMode } = useTheme();

  const showSuccessImport       = location.state?.showSuccessImport;
  const importedItems           = location.state?.importedItems;
  const openQuickModalFromState = location.state?.openQuickModal;

  const [loading, setLoading]   = useState(() => {
    if (showSuccessImport) return true;
    return !cache.get(HOME_CACHE_KEY)?.resumo;
  });
  const [error, setError]       = useState('');
  const [resumo, setResumo]     = useState(() =>
    showSuccessImport ? null : (cache.get(HOME_CACHE_KEY)?.resumo ?? null));
  const [insights, setInsights] = useState(() =>
    showSuccessImport ? null : (cache.get(HOME_CACHE_KEY)?.insights ?? null));
  const [perfilIncompleto, setPerfilIncompleto] = useState(() =>
    showSuccessImport ? false : Boolean(cache.get(HOME_CACHE_KEY)?.perfilIncompleto));
  const [completudePerfil, setCompletudePerfil] = useState(() =>
    showSuccessImport ? 0 : Number(cache.get(HOME_CACHE_KEY)?.completudePerfil ?? 0));
  const [perfilDados, setPerfilDados] = useState(() =>
    showSuccessImport ? null : (cache.get(HOME_CACHE_KEY)?.perfilDados ?? null));
  const [ativos, setAtivos]       = useState(() =>
    showSuccessImport ? [] : (cache.get(HOME_CACHE_KEY)?.ativos ?? []));
  const [dashboard, setDashboard] = useState(() =>
    showSuccessImport ? null : (cache.get(HOME_CACHE_KEY)?.dashboard ?? null));
  const [historicoMensal, setHistoricoMensal] = useState(() =>
    showSuccessImport ? [] : (cache.get(HOME_CACHE_KEY)?.historicoMensal ?? []));
  const [benchmark, setBenchmark] = useState(() =>
    showSuccessImport ? null : (cache.get(HOME_CACHE_KEY)?.benchmark ?? null));
  const [usuario, setUsuario]     = useState(() => getStoredUser());

  const [filtroTempo, setFiltroTempo]   = useState('1A');
  const [showCDI, setShowCDI]           = useState(false);
  const [buscaAtivo, setBuscaAtivo]     = useState('');
  const [onboardingPopupOpen, setOnboardingPopupOpen] = useState(false);
  const [onboardingStep, setOnboardingStep]           = useState(2);
  const [ocultarBannerOnboarding, setOcultarBannerOnboarding] = useState(false);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickModalType, setQuickModalType] = useState(null);

  const salvarCache = (dados) => cache.set(HOME_CACHE_KEY, dados);

  useEffect(() => {
    if (!showSuccessImport) return;
    const timer = setTimeout(() => navigate('/home', { replace: true, state: {} }), 5000);
    return () => clearTimeout(timer);
  }, [showSuccessImport, navigate]);

  useEffect(() => {
    if (!openQuickModalFromState) return;
    if (['quick_importar', 'quick_perfil', 'quick_configurar'].includes(openQuickModalFromState)) {
      setQuickModalType(openQuickModalFromState);
      setQuickModalOpen(true);
      navigate('/home', { replace: true, state: {} });
    }
  }, [navigate, openQuickModalFromState]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setError('');
        setUsuario(getStoredUser());
        if (!showSuccessImport) {
          const dadosCache = cache.get(HOME_CACHE_KEY);
          if (ativo && dadosCache?.resumo) {
            // Renderizar imediatamente com cache existente
            setResumo(dadosCache.resumo);
            setInsights(dadosCache.insights ?? null);
            setPerfilDados(dadosCache.perfilDados ?? null);
            setAtivos(dadosCache.ativos ?? []);
            setDashboard(dadosCache.dashboard ?? null);
            setHistoricoMensal(dadosCache.historicoMensal ?? []);
            setBenchmark(dadosCache.benchmark ?? null);
            setPerfilIncompleto(Boolean(dadosCache.perfilIncompleto));
            setCompletudePerfil(Number(dadosCache.completudePerfil ?? 0));
            setLoading(false);
            // Recarregar em background se cache tiver mais de 60s (não bloqueia a UI)
            const cacheEstaFresco = Boolean(cache.get(HOME_CACHE_KEY, HOME_CACHE_FRESCA_TTL));
            if (!cacheEstaFresco) {
              setTimeout(() => { if (ativo) void recarregarHomeSemPiscada(); }, 0);
            }
            return;
          }
        }
        setLoading(true);
        const [dadosCarteira, dadosPerfil, dadosAtivos, dadosDashboard, dadosHistorico, dadosBenchmark] =
          await Promise.all([
            carteiraApi.obterResumoCarteiraComFallback(),
            perfilApi.obterPerfil().catch(() => null),
            carteiraApi.listarAtivosCarteira().catch(() => []),
            carteiraApi.obterDashboardPatrimonioComFallback().catch(() => null),
            historicoApi.listarHistoricoMensal(24).catch(() => ({ pontos: [] })),
            carteiraApi.obterBenchmarkCarteiraComFallback(24).catch(() => null),
          ]);
        if (!ativo) return;
        const pontos = [...(dadosHistorico?.pontos ?? [])].sort((a, b) => a.anoMes.localeCompare(b.anoMes));
        setResumo(dadosCarteira);
        setAtivos(dadosAtivos);
        setDashboard(dadosDashboard);
        setHistoricoMensal(pontos);
        setBenchmark(dadosBenchmark);
        cache.set('carteira_resumo', dadosCarteira);
        let perc = 0;
        if (dadosPerfil) {
          setPerfilDados(dadosPerfil);
          let pre = 0;
          if (dadosPerfil.objetivo)   pre++;
          if (dadosPerfil.horizonte)  pre++;
          if (dadosPerfil.perfilRisco) pre++;
          if (Number(dadosPerfil.rendaMensal) > 0) pre++;
          perc = Math.round((pre / 4) * 100);
          setCompletudePerfil(perc);
          setPerfilIncompleto(perc < 100);
        }
        setLoading(false);
        // Salvar cache parcial de carteira imediatamente (antes de insights)
        salvarCache({
          resumo: dadosCarteira, insights: null,
          perfilDados: dadosPerfil ?? null,
          ativos: dadosAtivos, dashboard: dadosDashboard,
          historicoMensal: pontos, benchmark: dadosBenchmark,
          perfilIncompleto: perc < 100, completudePerfil: perc,
        });
        try {
          const dadosInsights = await insightsApi.obterResumoComFallback();
          cache.set('insights_resumo', dadosInsights);
          if (ativo) {
            setInsights(dadosInsights);
            // Atualizar cache com insights completo
            salvarCache({
              resumo: dadosCarteira, insights: dadosInsights,
              perfilDados: dadosPerfil ?? null,
              ativos: dadosAtivos, dashboard: dadosDashboard,
              historicoMensal: pontos, benchmark: dadosBenchmark,
              perfilIncompleto: perc < 100, completudePerfil: perc,
            });
          }
        } catch (e) { console.error('Falha insights:', e); }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) { navigate('/', { replace: true }); return; }
        if (ativo) { setError('Falha ao carregar dados.'); setLoading(false); }
      }
    })();
    return () => { ativo = false; };
  }, [navigate, showSuccessImport]);

  const recarregarHomeSemPiscada = async () => {
    try {
      setError('');
      const TTL = 60 * 1000;
      const rC = cache.get('carteira_resumo', TTL);
      const iC = cache.get('insights_resumo', TTL);
      const dC = cache.get('carteira_dashboard', TTL);
      const hC = cache.get('historico_mensal_24', TTL);
      const bC = cache.get('benchmark_24m', TTL);
      const [dadosCarteira, dadosInsights, dadosPerfil, dadosAtivos, dadosDashboard, dadosHistorico, dadosBenchmark] =
        await Promise.all([
          rC ? Promise.resolve(rC) : carteiraApi.obterResumoCarteiraComFallback().then(r => { cache.set('carteira_resumo', r); return r; }),
          iC ? Promise.resolve(iC) : insightsApi.obterResumoComFallback().then(r => { cache.set('insights_resumo', r); return r; }),
          perfilApi.obterPerfil().catch(() => null),
          carteiraApi.listarAtivosCarteira().catch(() => []),
          dC ? Promise.resolve(dC) : carteiraApi.obterDashboardPatrimonioComFallback().catch(() => null).then(r => { if (r) cache.set('carteira_dashboard', r); return r; }),
          hC ? Promise.resolve(hC) : historicoApi.listarHistoricoMensal(24).catch(() => ({ pontos: [] })).then(r => { cache.set('historico_mensal_24', r); return r; }),
          bC ? Promise.resolve(bC) : carteiraApi.obterBenchmarkCarteiraComFallback(24).catch(() => null).then(r => { if (r) cache.set('benchmark_24m', r); return r; }),
        ]);
      const pontos = [...(dadosHistorico?.pontos ?? [])].sort((a, b) => a.anoMes.localeCompare(b.anoMes));
      setResumo(dadosCarteira);
      setInsights(dadosInsights);
      setAtivos(dadosAtivos);
      setDashboard(dadosDashboard);
      setHistoricoMensal(pontos);
      setBenchmark(dadosBenchmark);
      let proxC = 0, proxPI = true;
      if (dadosPerfil) {
        setPerfilDados(dadosPerfil);
        let pre = 0;
        if (dadosPerfil.objetivo) pre++;
        if (dadosPerfil.horizonte) pre++;
        if (dadosPerfil.perfilRisco) pre++;
        if (Number(dadosPerfil.rendaMensal) > 0) pre++;
        proxC = Math.round((pre / 4) * 100);
        proxPI = proxC < 100;
      } else { setPerfilDados(null); }
      setCompletudePerfil(proxC);
      setPerfilIncompleto(proxPI);
      salvarCache({
        resumo: dadosCarteira, insights: dadosInsights,
        perfilDados: dadosPerfil ?? null,
        ativos: dadosAtivos, dashboard: dadosDashboard,
        historicoMensal: pontos, benchmark: dadosBenchmark,
        perfilIncompleto: proxPI, completudePerfil: proxC,
      });
    } catch { setError('Falha ao atualizar dados.'); }
  };

  /* ─── Valores derivados ─── */
  const scoreUnificado   = insights?.scoreUnificado || insights?.score_unificado;
  const scoreExibicao    = scoreUnificado?.score ?? 0;
  const patrimonioInvest = Number(resumo?.valorInvestimentos ?? 0);
  const patrimonioLiquido = Number(resumo?.patrimonioLiquido ?? patrimonioInvest);
  const alertasCount     = insights?.diagnostico?.riscos?.length ?? 0;
  const primeiroAlerta   = insights?.diagnostico?.riscos?.[0];
  const bandLabel        = { critical:'Crítico', fragile:'Frágil', stable:'Estável', good:'Bom', strong:'Sólido' }[scoreUnificado?.band ?? ''] ?? '';

  const trilhaOnboarding = [
    { num:1, titulo:'Seu estilo', step:2, completo: Boolean(perfilDados?.objetivo && perfilDados?.perfilRisco) },
    { num:2, titulo:'Seus dados', step:3, completo: Boolean(Number(perfilDados?.rendaMensal) > 0) },
    { num:3, titulo:'Seus ativos', step:4, completo: Boolean(Number(perfilDados?.reservaCaixa) > 0 || Number(perfilDados?.aporteMensal) > 0) },
  ];
  const mostrarCardOnboarding = !trilhaOnboarding.every(i => i.completo) && !ocultarBannerOnboarding;

  /* Composição do patrimônio */
  const composicaoFrase = useMemo(() => {
    const dist = resumo?.distribuicaoPatrimonio ?? [];
    if (!dist.length) return null;
    return dist
      .filter(d => d.percentual > 0)
      .sort((a, b) => b.percentual - a.percentual)
      .map(d => `${d.label} ${Math.round(d.percentual)}%`)
      .join(' · ');
  }, [resumo]);

  /* Alocação */
  const alocacaoData = useMemo(() => {
    const totais = dashboard?.totais ?? {};
    return ALOCACAO_CONFIG
      .map(c => ({ ...c, value: Number(totais[c.key] ?? 0) }))
      .filter(c => c.value > 0);
  }, [dashboard]);
  const totalAlocacao = alocacaoData.reduce((acc, c) => acc + c.value, 0);

  /* Filtros disponíveis baseado em dados reais */
  const filtrosDisponiveis = useMemo(() => {
    const n = historicoMensal.length;
    return FILTROS_ALL.filter(f => {
      if (f === 'Max') return n > 0;
      return n >= FILTROS_MESES[f];
    });
  }, [historicoMensal]);

  /* Garante filtro válido */
  const filtroEfetivo = filtrosDisponiveis.includes(filtroTempo)
    ? filtroTempo
    : (filtrosDisponiveis[filtrosDisponiveis.length - 1] ?? 'Max');

  /* Histórico filtrado + CDI mesclado */
  /* benchmark.serie usa índice base-100 (ex: 108.5 = +8.5% acum.) — escala incompatível com R$ absoluto.
     Quando CDI está ON, troca para os dados do benchmark diretamente. */
  const isCdiMode = showCDI && Boolean(benchmark?.serie?.length);
  const dadosGrafico = useMemo(() => {
    if (isCdiMode) {
      const serie = [...benchmark.serie].sort((a, b) => a.data.localeCompare(b.data));
      const filtrada = filtroEfetivo === 'Max' ? serie : serie.slice(-FILTROS_MESES[filtroEfetivo]);
      return filtrada.map(p => ({ ...p, anoMes: p.data?.slice(0, 7) }));
    }
    if (!historicoMensal.length) return [];
    return filtroEfetivo === 'Max' ? historicoMensal : historicoMensal.slice(-FILTROS_MESES[filtroEfetivo]);
  }, [historicoMensal, filtroEfetivo, isCdiMode, benchmark]);

  /* Ativos filtrados */
  const ativosFiltrados = useMemo(() => {
    const busca = buscaAtivo.toLowerCase();
    const lista = busca
      ? ativos.filter(a => a.ticker?.toLowerCase().includes(busca) || a.nome?.toLowerCase().includes(busca))
      : [...ativos].sort((a, b) => b.valorAtual - a.valorAtual);
    return lista.slice(0, 5);
  }, [ativos, buscaAtivo]);

  /* Ativos com detalhes enriquecidos (TIPO, APORTE, AVALIAÇÃO, INSTITUIÇÃO) */
  const ativosComDetalhes = useMemo(() => {
    return ativosFiltrados.map(ativo => {
      // TIPO: determinar tipo do ativo
      const tipo = ativo.tipo || (ativo.categoria === 'fundo' ? 'fundo' : 'acao');
      const tipoLabel = getTipoLabel(tipo);

      // APORTE: valor inicial declarado pelo usuário (custoAquisicao = preço de compra/investimento inicial)
      const aporte = ativo.custoAquisicao || 0;

      // AVALIAÇÃO: comparação com benchmark
      // Para ações: rentabilidade vs IBOVESPA (usando rentabilidadeIbov)
      // Para fundos: rentabilidade vs CDI (usando rentabilidadeCdi)
      const benchmark = tipo === 'acao' ? 'IBOV' : 'CDI';
      const rentabilidadeBenchmark = tipo === 'acao'
        ? (ativo.rentabilidadeIbov || 0)
        : (ativo.rentabilidadeCdi || 0);
      const rentabilidadeAtivo = rentabilidadeDesdeAquisicao(ativo) || 0;
      const avaliacao = rentabilidadeAtivo - rentabilidadeBenchmark;

      // INSTITUIÇÃO: extrair de metadata ou usar CNPJ/placeholder
      const instituicao = ativo.instituicao || ativo.metadata?.instituicao;
      const instituicaoAbrev = instituicao
        ? instituicao.slice(0, 3).toUpperCase()
        : (ativo.cnpj ? ativo.cnpj.slice(0, 3).toUpperCase() : 'NI');

      return {
        ...ativo,
        tipo,
        tipoLabel,
        aporte,
        avaliacaoValor: avaliacao,
        avaliacaoQualitativa: getAvaliacaoLabel(avaliacao),
        avaliacaoCor: getAvaliacaoCor(avaliacao),
        benchmark,
        instituicaoAbrev,
      };
    });
  }, [ativosFiltrados]);

  /* Alertas laterais — oportunidades (riscos já foram ao KPI card) */
  const oportunidadesList = useMemo(() => {
    const acoes = insights?.diagnostico?.acoes ?? [];
    return acoes.slice(0, 2).map(a => ({ tipo: 'oportunidade', titulo: a.titulo, descricao: a.descricao }));
  }, [insights]);

  /* Loading skeleton */
  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="h-16 skeleton rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 skeleton rounded-xl" /><div className="h-56 skeleton rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="h-52 skeleton rounded-xl" /><div className="h-32 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--bg-primary)] font-['Inter'] text-[var(--text-primary)] space-y-6 selection:bg-[#F56A2A] selection:text-white">

      {/* Toast importação */}
      <AnimatePresence>
        {showSuccessImport && (
          <motion.div
            initial={{ opacity:0, y:-40, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-20, scale:0.95 }} transition={{ duration:0.4, ease:'easeOut' }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 pr-6 rounded-xl shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-[#6FCF97]/10 rounded-full">
              <CheckCircle2 size={24} className="text-[#6FCF97]" />
            </div>
            <div>
              <h3 className="font-['Sora'] text-sm font-bold">Importação Concluída</h3>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                {importedItems} {importedItems === 1 ? 'item importado' : 'itens importados'}. Score recalculado!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal onboarding */}
      {onboardingPopupOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#0B1218]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Onboarding embedded mode="profile" initialStep={onboardingStep}
            onClose={concluido => { setOnboardingPopupOpen(false); if (concluido) recarregarHomeSemPiscada(); }} />
        </div>
      )}

      {/* Modal quick */}
      {quickModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#0B1218]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-[1120px] h-[90dvh] overflow-hidden rounded-xl bg-white shadow-2xl">
            <button type="button" onClick={() => { setQuickModalOpen(false); setQuickModalType(null); }}
              className="absolute right-4 top-4 text-[#0B1218]/40 hover:text-[#0B1218]"><X size={20} /></button>
            <div className="h-full overflow-y-auto px-4 pb-4 pt-12 sm:px-6">
              {quickModalType === 'quick_perfil'     && <PerfilUsuario embedded />}
              {quickModalType === 'quick_importar'   && <Importar embedded />}
              {quickModalType === 'quick_configurar' && <Configuracoes embedded />}
            </div>
          </div>
        </div>
      )}

      {/* Banner onboarding */}
      {mostrarCardOnboarding && (
        <div className="border border-[#F56A2A]/30 bg-[#F56A2A]/5 px-5 py-4 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <p className="font-['Sora'] text-sm font-bold">Complete seu perfil</p>
              <div className="flex items-center gap-1.5">
                {trilhaOnboarding.map((item, idx) => (
                  <React.Fragment key={item.step}>
                    <button onClick={() => { setOnboardingStep(item.step); setOnboardingPopupOpen(true); }}
                      className={`flex items-center justify-center w-7 h-7 rounded-full border text-[10px] font-bold transition-colors ${
                        item.completo ? 'bg-[#F56A2A] border-[#F56A2A] text-white' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[#F56A2A]'
                      }`}>
                      {item.completo ? <CheckCircle2 size={12} /> : item.num}
                    </button>
                    {idx < trilhaOnboarding.length - 1 && <div className="h-px w-4 bg-[var(--border-color)]" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setOnboardingStep(2); setOnboardingPopupOpen(true); }}
                className="px-3 py-1.5 rounded-lg bg-[#F56A2A] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#d95a20] transition-colors">
                Completar
              </button>
              <button onClick={() => setOcultarBannerOnboarding(true)}
                className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                Depois
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saudação */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-['Sora'] text-base font-semibold text-[var(--text-primary)]">{getSaudacao()},</p>
          <h1 className="font-['Sora'] text-3xl font-bold leading-tight mt-0.5">
            <span className="text-[#F56A2A]">{getNomeExibicao(usuario?.nome)}</span>
            <span className="text-[var(--text-primary)]">.</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input type="text" value={buscaAtivo} onChange={e => setBuscaAtivo(e.target.value)}
              placeholder="Buscar ativo..."
              className="pl-8 pr-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[#F56A2A] w-52 placeholder:text-[var(--text-muted)] transition-colors" />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-[#E85C5C] font-medium">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Patrimônio total */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 lg:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
            {texto('home.kpi.patrimonio', 'Patrimônio total')}
          </p>
          <p className="font-['Sora'] text-2xl font-bold leading-tight">
            {ocultarValores ? '••••••••' : fmt(patrimonioLiquido)}
          </p>
          {(() => {
            const r = rentabilidadeDesdeAquisicao(resumo);
            if (r === null) return <p className="text-xs text-[var(--text-muted)] mt-1.5">—</p>;
            return (
              <p className={`text-xs font-semibold mt-1.5 ${r >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'}`}>
                {ocultarValores ? '••••' : fmtPct(r)}{' '}
                <span className="text-[var(--text-muted)] font-normal">desde aquisição</span>
              </p>
            );
          })()}
          {composicaoFrase && (
            <p className="text-[10px] text-[var(--text-muted)] mt-2 leading-snug">
              {composicaoFrase}
            </p>
          )}
        </div>

        {/* Investimentos */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Investimentos</p>
          <p className="font-['Sora'] text-2xl font-bold leading-tight">
            {ocultarValores ? '••••••••' : fmt(patrimonioInvest)}
          </p>
          {(() => {
            const r = rentabilidadeDesdeAquisicao(resumo);
            if (r === null) return <p className="text-xs text-[var(--text-muted)] mt-1.5">—</p>;
            return (
              <p className={`text-xs font-semibold mt-1.5 ${r >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'}`}>
                {ocultarValores ? '••••' : fmtPct(r)}{' '}
                <span className="text-[var(--text-muted)] font-normal">desde aquisição</span>
              </p>
            );
          })()}
        </div>

        {/* Score */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Score</p>
          <p className="font-['Sora'] text-2xl font-bold leading-tight">
            {ocultarValores ? '•••• / 1000' : `${scoreExibicao} / 1000`}
          </p>
          {bandLabel && (
            <p className={`text-xs font-semibold mt-1.5 ${
              scoreUnificado?.band === 'critical' ? 'text-[#E85C5C]' :
              scoreUnificado?.band === 'fragile'  ? 'text-[#F2C94C]' : 'text-[#6FCF97]'
            }`}>
              {bandLabel}{scoreUnificado?.band === 'good' && <span className="text-[var(--text-muted)] font-normal"> — acima de 88%</span>}
            </p>
          )}
        </div>

        {/* Alertas — com texto do primeiro alerta */}
        <button onClick={() => navigate('/insights')}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 text-left hover:border-[#F56A2A] transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Alertas</p>
          <p className="font-['Sora'] text-2xl font-bold leading-tight">{alertasCount}</p>
          <p className={`text-xs font-semibold mt-1.5 ${alertasCount > 0 ? 'text-[#E85C5C]' : 'text-[#6FCF97]'}`}>
            {alertasCount > 0 ? 'ações necessárias' : 'tudo em ordem'}
          </p>
          {primeiroAlerta && (
            <p className="text-[10px] text-[var(--text-muted)] mt-2 leading-snug line-clamp-2">
              {primeiroAlerta.titulo}
            </p>
          )}
        </button>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna esquerda (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Evolução patrimonial */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-['Sora'] text-sm font-bold">Evolução patrimonial</h3>
              <div className="flex items-center gap-2">
                {/* Toggle CDI */}
                <button onClick={() => setShowCDI(v => !v)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md border transition-colors ${
                    showCDI
                      ? 'border-[#6FCF97] bg-[#6FCF97]/15 text-[#6FCF97]'
                      : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[#6FCF97]'
                  }`}>
                  vs CDI
                </button>
                {/* Filtros de tempo */}
                <div className="flex gap-1">
                  {filtrosDisponiveis.map(f => (
                    <button key={f} onClick={() => setFiltroTempo(f)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${
                        filtroEfetivo === f ? 'bg-[#F56A2A] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={`h-48 ${ocultarValores ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
              {dadosGrafico.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosGrafico} margin={{ top:4, right:0, left:0, bottom:0 }}>
                    <defs>
                      <linearGradient id="gradPatrimonio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#F56A2A" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#F56A2A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="anoMes" tick={{ fontSize:10, fill:'var(--text-muted)' }} tickLine={false} axisLine={false}
                      tickFormatter={formatMes} interval="preserveStartEnd" />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v, name) => [
                        ocultarValores ? '••••••' : (
                          isCdiMode
                            ? `${Number(v - 100 || 0) >= 0 ? '+' : ''}${Number(v - 100 || 0).toFixed(2)}%`
                            : (name === 'totalAtual' ? fmt(v) : `${Number(v||0).toFixed(2)}%`)
                        ),
                        name === 'carteira' ? 'Carteira' : (name === 'cdi' ? 'CDI' : 'Patrimônio'),
                      ]}
                      labelFormatter={formatMes}
                      contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:8, fontSize:11 }}
                    />
                    <Area type="monotone" dataKey={isCdiMode ? 'carteira' : 'totalAtual'} stroke="#F56A2A" strokeWidth={2}
                      fill="url(#gradPatrimonio)" dot={false} isAnimationActive={false} />
                    {isCdiMode && (
                      <Line type="monotone" dataKey="cdi" stroke="#6FCF97" strokeWidth={1.5}
                        dot={false} strokeDasharray="4 2" isAnimationActive={false} connectNulls />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <TrendingUp size={24} className="text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-muted)]">Sem histórico disponível</p>
                  <button onClick={() => navigate('/importar')} className="text-xs font-semibold text-[#F56A2A] hover:underline">
                    Importar dados
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Principais Ativos */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-['Sora'] text-sm font-bold">Principais Ativos</h3>
              <button onClick={() => navigate('/carteira')} className="text-xs font-semibold text-[#F56A2A] hover:underline flex items-center gap-0.5">
                Ver tudo <ChevronRight size={12} />
              </button>
            </div>
            {ativosComDetalhes.length > 0 ? (
              <>
                {/* Grid responsivo com overflow horizontal */}
                <div className="overflow-x-auto -mx-5 px-5">
                  <div className="min-w-max md:min-w-full">
                    {/* Headers */}
                    <div className="hidden md:grid gap-2 px-2 mb-2" style={{ gridTemplateColumns: '1fr 96px 68px 52px 40px 96px 52px 80px' }}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Ativo</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-center">Valor Atual</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-center">% Rent.</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-center">% Cart.</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-center">Tipo</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-center">Aporte</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-center">Aval.</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-center">Inst.</span>
                    </div>

                    {/* Mobile headers */}
                    <div className="md:hidden grid gap-2 px-2 mb-2" style={{ gridTemplateColumns: '1fr 72px 60px 40px' }}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Ativo</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-center">Valor</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-center">Rent.</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-center">Inst.</span>
                    </div>

                    {/* Desktop rows */}
                    <div className="hidden md:block space-y-0.5">
                      {ativosComDetalhes.map(ativo => {
                        const pct = ativo.participacao > 1 ? ativo.participacao.toFixed(0) : (ativo.participacao * 100).toFixed(0);
                        const r = rentabilidadeDesdeAquisicao(ativo);
                        return (
                          <button key={ativo.id} onClick={() => navigate(`/ativo/${ativo.ticker}`)}
                            className="w-full grid gap-2 px-2 py-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-left"
                            style={{ gridTemplateColumns: '1fr 96px 68px 52px 40px 96px 52px 80px' }}>
                            {/* ATIVO */}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{ativo.nome}</p>
                              <p className="text-[11px] text-[var(--text-muted)] truncate">{ativo.ticker}</p>
                            </div>
                            {/* VALOR ATUAL */}
                            <p className="text-sm font-semibold text-center self-center whitespace-nowrap">
                              {ocultarValores ? '••••••' : fmt(ativo.valorAtual)}
                            </p>
                            {/* % RENTABILIDADE */}
                            {r === null ? (
                              <p className="text-sm font-semibold text-center self-center whitespace-nowrap text-[var(--text-muted)]">
                                {ocultarValores ? '••••' : '—'}
                              </p>
                            ) : (
                              <p className={`text-sm font-semibold text-center self-center whitespace-nowrap ${r >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'}`}>
                                {ocultarValores ? '••••' : fmtPct(r)}
                              </p>
                            )}
                            {/* % CARTEIRA */}
                            <p className="text-sm font-semibold text-center self-center whitespace-nowrap">
                              {ocultarValores ? '••%' : `${pct}%`}
                            </p>
                            {/* TIPO */}
                            <p className="text-xs text-center self-center whitespace-nowrap font-semibold text-[var(--text-muted)]">
                              {ativo.tipoLabel}
                            </p>
                            {/* APORTE */}
                            <p className="text-sm font-semibold text-center self-center whitespace-nowrap">
                              {ocultarValores ? '••••' : fmt(ativo.aporte)}
                            </p>
                            {/* AVALIAÇÃO */}
                            <p className={`text-xs font-semibold text-center self-center whitespace-nowrap ${ativo.avaliacaoCor}`}>
                              {ocultarValores ? '••' : ativo.avaliacaoQualitativa}
                            </p>
                            {/* INSTITUIÇÃO */}
                            <div className="flex items-center justify-center self-center">
                              {getInstituicaoDisplay(ativo.instituicaoAbrev) ? (
                                <img
                                  src={getInstituicaoDisplay(ativo.instituicaoAbrev)}
                                  alt={ativo.instituicaoAbrev}
                                  className="h-6 w-6 rounded object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-[var(--text-muted)] px-2 py-1 rounded bg-[var(--bg-secondary)]">
                                  {ativo.instituicaoAbrev}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Mobile rows */}
                    <div className="md:hidden space-y-0.5">
                      {ativosComDetalhes.map(ativo => {
                        const pct = ativo.participacao > 1 ? ativo.participacao.toFixed(0) : (ativo.participacao * 100).toFixed(0);
                        const r = rentabilidadeDesdeAquisicao(ativo);
                        return (
                          <button key={ativo.id} onClick={() => navigate(`/ativo/${ativo.ticker}`)}
                            className="w-full grid gap-2 px-2 py-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-left h-12"
                            style={{ gridTemplateColumns: '1fr 72px 60px 40px' }}>
                            {/* ATIVO */}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{ativo.ticker}</p>
                              <p className="text-[11px] text-[var(--text-muted)] truncate">{ativo.nome}</p>
                            </div>
                            {/* VALOR ATUAL */}
                            <p className="text-sm font-semibold text-center self-center whitespace-nowrap">
                              {ocultarValores ? '••••' : fmt(ativo.valorAtual)}
                            </p>
                            {/* % RENTABILIDADE */}
                            {r === null ? (
                              <p className="text-sm font-semibold text-center self-center whitespace-nowrap text-[var(--text-muted)]">
                                {ocultarValores ? '••' : '—'}
                              </p>
                            ) : (
                              <p className={`text-sm font-semibold text-center self-center whitespace-nowrap ${r >= 0 ? 'text-[#6FCF97]' : 'text-[#E85C5C]'}`}>
                                {ocultarValores ? '••' : fmtPct(r)}
                              </p>
                            )}
                            {/* INSTITUIÇÃO */}
                            <div className="flex items-center justify-center self-center">
                              <span className="text-xs font-semibold text-[var(--text-muted)] px-2 py-1 rounded bg-[var(--bg-secondary)]">
                                {ativo.instituicaoAbrev}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center space-y-3">
                <p className="text-sm text-[var(--text-muted)]">
                  {buscaAtivo ? `Nenhum ativo encontrado para "${buscaAtivo}"` : 'Nenhum ativo cadastrado'}
                </p>
                {!buscaAtivo && (
                  <div className="flex justify-center gap-3">
                    <button onClick={() => { setQuickModalType('quick_importar'); setQuickModalOpen(true); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F56A2A] text-white text-xs font-bold">
                      <UploadCloud size={14} /> Importar
                    </button>
                    <button onClick={() => navigate('/carteira')}
                      className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] hover:border-[#F56A2A] transition-colors">
                      Cadastrar manualmente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita (1/3) */}
        <div className="space-y-4">

          {/* Alocação */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h3 className="font-['Sora'] text-sm font-bold mb-4">Alocação</h3>
            {alocacaoData.length > 0 ? (
              <div className="space-y-3">
                {alocacaoData.map(item => {
                  const pct = totalAlocacao > 0 ? (item.value / totalAlocacao) * 100 : 0;
                  return (
                    <div key={item.key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.cor }} />
                          <span className="text-xs text-[var(--text-secondary)]">{item.label}</span>
                        </div>
                        <span className="text-xs font-bold">{ocultarValores ? '••%' : `${pct.toFixed(0)}%`}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--border-color)]">
                        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width:`${pct}%`, backgroundColor:item.cor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">Sem dados de alocação</p>
            )}
          </div>

          {/* Oportunidades (acoes do diagnostico) */}
          {oportunidadesList.length > 0 && (
            <div className="space-y-3">
              {oportunidadesList.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-[#6FCF97]/25 bg-[#6FCF97]/5 p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#6FCF97]">● Oportunidade</span>
                    <button onClick={() => navigate('/insights')} className="text-[10px] font-bold text-[#F56A2A] hover:underline flex-shrink-0">
                      Explorar →
                    </button>
                  </div>
                  <p className="text-xs font-semibold">{item.titulo}</p>
                  {item.descricao && <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">{item.descricao}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Acesso rápido */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Acesso rápido</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_ACTIONS.map(item => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[#F56A2A] hover:bg-[#F56A2A]/8 transition-all group">
                  <img src={assetPath(`/assets/icons/laranja/${item.icon}-premium.svg`)} alt={item.label}
                    className="h-5 w-5 opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={e => { e.currentTarget.src = assetPath(`/assets/icons/laranja/${item.icon}.svg`); }} />
                  <span className="text-[9px] font-bold text-[var(--text-secondary)] group-hover:text-[#F56A2A] text-center leading-tight transition-colors">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
