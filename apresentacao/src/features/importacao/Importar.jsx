import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, importacaoApi, telemetriaApi } from '../../cliente-api';
import { invalidarCacheUsuario } from '../../utils/cache';
import { baixarTemplateXlsx } from '../../utils/importacaoTemplate';
import { parseXlsx } from '../../utils/importacaoParser';
import {
  UploadCloud,
  ArrowRight,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Info,
  ShieldCheck,
  HelpCircle,
  Layers,
} from 'lucide-react';

// ─── Constantes ───────────────────────────────────────────────────────────────

const LABEL_ABA = {
  acoes: 'Ações',
  fundos: 'Fundos',
  imoveis: 'Imóveis',
  veiculos: 'Veículos',
  poupanca: 'Poupança',
};

const STATUS_LABEL = { ok: 'Válido', conflito: 'Conflito', erro: 'Erro' };
const STATUS_COR = {
  ok: { text: 'text-[#6FCF97]', bg: 'bg-[#6FCF97]/10', border: 'border-[#6FCF97]/30' },
  conflito: { text: 'text-[#F2C94C]', bg: 'bg-[#F2C94C]/10', border: 'border-[#F2C94C]/30' },
  erro: { text: 'text-[#E85C5C]', bg: 'bg-[#E85C5C]/10', border: 'border-[#E85C5C]/30' },
};

const SUGESTAO_ERRO = (item) => {
  const obs = (item.observacao || '').toLowerCase();
  if (item.status === 'conflito') return 'Já existe na sua carteira. Ignore ou remova manualmente antes de reimportar.';
  if (obs.includes('ticker') && obs.includes('ação')) return 'Verifique o ticker (ex.: PETR4, VALE3). Maiúsculas, sem espaço.';
  if (obs.includes('valor')) return 'Informe um valor positivo. Use ponto ou vírgula como decimal.';
  if (obs.includes('data')) return 'Use o formato AAAA-MM-DD (ex.: 2026-01-15).';
  if (obs.includes('quantidade')) return 'Informe a quantidade como número positivo.';
  if (obs.includes('nome')) return 'Nome/descrição é obrigatório.';
  if (obs.includes('instituição')) return 'Informe o banco ou instituição.';
  if (obs.includes('montadora') || obs.includes('modelo')) return 'Montadora e modelo são obrigatórios.';
  if (obs.includes('tipo')) return 'Tipo inválido. Consulte a aba Guia.';
  return 'Revise os campos obrigatórios da linha.';
};

const mapearErro = (erro) => {
  if (!(erro instanceof ApiError)) {
    return erro?.message?.includes('XLSX') ? erro.message : 'Falha ao processar. Tente novamente.';
  }
  switch (erro.code) {
    case 'ARQUIVO_TIPO_INVALIDO': return 'Formato inválido. Envie .xlsx ou .csv.';
    case 'ARQUIVO_FORA_PADRAO': return erro.message || 'Fora do padrão. Baixe o template.';
    case 'API_INDISPONIVEL': return 'API indisponível. Tente em instantes.';
    default: return 'Não foi possível processar. Revise o arquivo.';
  }
};

const formatMoney = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

// ─── Componente principal ────────────────────────────────────────────────────

export default function Importar({ embedded = false }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [erroUpload, setErroUpload] = useState('');
  const [preview, setPreview] = useState(null);
  const [isConfirmando, setIsConfirmando] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [expandidos, setExpandidos] = useState({});
  const [filtroAba, setFiltroAba] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const iniciarUpload = async (file) => {
    if (!file) return;
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    if (!isXlsx && !isCsv) {
      setErroUpload('Formato inválido. Envie .xlsx (recomendado) ou .csv.');
      return;
    }
    setErroUpload('');
    setSelectedFile(file);
    setStep('processing');
    try {
      await telemetriaApi.registrarEventoTelemetria('import_started', { arquivo: file.name, tipo: isXlsx ? 'xlsx' : 'csv' });
      let resposta;
      if (isXlsx) {
        const resultado = await parseXlsx(file);
        if (resultado.itens.length === 0) {
          setErroUpload('Nenhum item encontrado. Preencha pelo menos uma aba do template.');
          setStep('upload');
          return;
        }
        resposta = await importacaoApi.uploadExtrato({
          nomeArquivo: file.name,
          tipoArquivo: 'xlsx',
          itens: resultado.itens,
        });
      } else {
        const conteudo = await file.text();
        resposta = await importacaoApi.uploadExtrato({
          nomeArquivo: file.name,
          conteudo,
          tipoArquivo: 'csv',
        });
      }
      setPreview(resposta);
      await telemetriaApi.registrarEventoTelemetria('import_reviewed', {
        importacaoId: resposta.importacaoId,
        validos: resposta.validos ?? 0,
        conflitos: resposta.conflitos ?? 0,
        erros: resposta.erros ?? 0,
      });
      setStep('review');
    } catch (error) {
      setErroUpload(mapearErro(error));
      setStep('upload');
    }
  };

  const confirmarImportacao = async () => {
    if (!preview || isConfirmando) return;
    setIsConfirmando(true);
    setConfirmError('');
    try {
      const linhasValidas = (preview.itens ?? [])
        .filter((item) => item.status === 'ok')
        .map((item) => item.linha);
      await importacaoApi.confirmarImportacao(preview.importacaoId, linhasValidas);
      await telemetriaApi.registrarEventoTelemetria('import_confirmed', {
        importacaoId: preview.importacaoId,
        itensValidos: linhasValidas.length,
      });
      invalidarCacheUsuario();
      localStorage.setItem('hasSeenPreInsight', 'true');
      navigate('/home', {
        replace: true,
        state: {
          showSuccessImport: true,
          importedItems: linhasValidas.length,
          importacaoId: preview.importacaoId,
        },
      });
    } catch (error) {
      setConfirmError(error instanceof ApiError ? 'Não foi possível confirmar agora.' : 'Falha ao confirmar.');
    } finally {
      setIsConfirmando(false);
    }
  };

  const todosItens = preview?.itens ?? [];
  const itensValidos = todosItens.filter((i) => i.status === 'ok');
  const itensConflito = todosItens.filter((i) => i.status === 'conflito');
  const itensErro = todosItens.filter((i) => i.status === 'erro');
  const abasUnicas = [...new Set(todosItens.map((i) => i.abaOrigem))].filter(Boolean);
  const itensFiltrados = todosItens.filter((item) => {
    const okAba = filtroAba === 'todos' || item.abaOrigem === filtroAba;
    const okStatus = filtroStatus === 'todos' || item.status === filtroStatus;
    return okAba && okStatus;
  });

  const toggleExpandido = (linha) => setExpandidos((prev) => ({ ...prev, [linha]: !prev[linha] }));

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    iniciarUpload(e.dataTransfer.files?.[0]);
  };

  // ─── UPLOAD ─────────────────────────────────────────────────────────────────

  if (step === 'upload') {
    return (
      <div className="w-full animate-in fade-in duration-500">
        {/* Hero header */}
        <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F56A2A] mb-3">Passo 1 de 3 · Upload</p>
            <h1 className="font-['Sora'] text-[44px] leading-[1.1] font-bold tracking-tight text-[var(--text-primary)] mb-3">
              Importe seu patrimônio
            </h1>
            <p className="text-base text-[var(--text-secondary)] max-w-2xl">
              Carregue o arquivo com seus investimentos, imóveis, veículos e poupança. Você revisará tudo antes de confirmar.
            </p>
          </div>
          <button
            type="button"
            onClick={baixarTemplateXlsx}
            className="inline-flex items-center gap-2 border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[#F56A2A] hover:text-[#F56A2A] px-5 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all text-[var(--text-primary)]"
          >
            <Download size={14} /> Baixar template .xlsx
          </button>
        </div>

        {/* Dropzone - horizontal, largura total */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(e) => iniciarUpload(e.target.files?.[0])}
        />

        <div
          className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${
            isDragging
              ? 'border-[#F56A2A] bg-[#F56A2A]/5'
              : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[#F56A2A] hover:bg-[#F56A2A]/5'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="flex items-center gap-8 p-12">
            <div className={`h-20 w-20 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
              isDragging ? 'bg-[#F56A2A] text-white' : 'bg-[#F56A2A]/10 text-[#F56A2A]'
            }`}>
              <UploadCloud size={36} />
            </div>
            <div className="flex-1">
              <h3 className="font-['Sora'] text-2xl font-bold text-[var(--text-primary)] mb-1">
                {isDragging ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Aceita <span className="font-semibold text-[var(--text-primary)]">.xlsx</span> (recomendado) e <span className="font-semibold text-[var(--text-primary)]">.csv</span> · até 10 MB
              </p>
              {selectedFile && (
                <p className="mt-3 text-sm font-semibold text-[#6FCF97] flex items-center gap-2">
                  <CheckCircle2 size={16} /> {selectedFile.name}
                </p>
              )}
            </div>
            <button
              type="button"
              className="shrink-0 bg-[#0B1218] text-white px-7 py-3.5 text-[11px] font-bold uppercase tracking-widest hover:bg-[#1a2530] transition-all rounded-xl"
            >
              Selecionar arquivo
            </button>
          </div>
        </div>

        {erroUpload && (
          <div className="flex items-start gap-3 p-4 border border-[#E85C5C]/30 bg-[#E85C5C]/5 rounded-xl mt-4">
            <XCircle size={16} className="text-[#E85C5C] shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-[#E85C5C]">{erroUpload}</p>
          </div>
        )}

        {/* Info cards - 3 colunas horizontais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          <div className="border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-[#F56A2A]/10 flex items-center justify-center mb-4">
              <Layers size={18} className="text-[#F56A2A]" />
            </div>
            <h4 className="font-['Sora'] text-sm font-bold text-[var(--text-primary)] mb-2">
              O que posso importar?
            </h4>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              Ações, ETFs e FIIs da B3. Fundos de investimento e previdência. Imóveis, veículos e poupança.
            </p>
          </div>
          <div className="border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-[#F56A2A]/10 flex items-center justify-center mb-4">
              <FileSpreadsheet size={18} className="text-[#F56A2A]" />
            </div>
            <h4 className="font-['Sora'] text-sm font-bold text-[var(--text-primary)] mb-2">
              Como preencher?
            </h4>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              Baixe o template .xlsx — ele tem uma aba por tipo de ativo, com colunas, exemplos e a aba Guia.
            </p>
          </div>
          <div className="border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-[#F56A2A]/10 flex items-center justify-center mb-4">
              <ShieldCheck size={18} className="text-[#F56A2A]" />
            </div>
            <h4 className="font-['Sora'] text-sm font-bold text-[var(--text-primary)] mb-2">
              Nada é confirmado direto
            </h4>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              Depois do upload, você revisa linha por linha. Conflitos e erros ficam marcados. Só o que estiver válido é importado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── PROCESSING ─────────────────────────────────────────────────────────────

  if (step === 'processing') {
    return (
      <div className="w-full flex flex-col items-center justify-center py-32 animate-in fade-in duration-500">
        <Loader2 size={48} className="text-[#F56A2A] animate-spin mb-6" />
        <h2 className="font-['Sora'] text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Validando seu arquivo...
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Identificando itens válidos, conflitos e erros.
        </p>
      </div>
    );
  }

  // ─── REVIEW ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Hero header */}
      <div className="flex items-end justify-between flex-wrap gap-6 mb-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F56A2A] mb-3">Passo 2 de 3 · Revisão</p>
          <h1 className="font-['Sora'] text-[36px] leading-[1.1] font-bold tracking-tight text-[var(--text-primary)] mb-2">
            Confira antes de confirmar
          </h1>
          <p className="text-base text-[var(--text-secondary)]">
            {preview.totalLinhas} {preview.totalLinhas === 1 ? 'item encontrado' : 'itens encontrados'} em {abasUnicas.length} {abasUnicas.length === 1 ? 'categoria' : 'categorias'} · apenas os válidos serão importados
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStep('upload')}
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <RefreshCw size={12} /> Reenviar arquivo
        </button>
      </div>

      {/* Stats horizontais compactos */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-[#6FCF97]/30 bg-[#6FCF97]/5 rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#6FCF97]/15 flex items-center justify-center">
            <CheckCircle2 size={22} className="text-[#6FCF97]" />
          </div>
          <div>
            <p className="font-['Sora'] text-3xl font-bold text-[var(--text-primary)] leading-none">{itensValidos.length}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#6FCF97] mt-1">Válidos · serão importados</p>
          </div>
        </div>
        <div className="border border-[#F2C94C]/30 bg-[#F2C94C]/5 rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#F2C94C]/15 flex items-center justify-center">
            <AlertTriangle size={22} className="text-[#F2C94C]" />
          </div>
          <div>
            <p className="font-['Sora'] text-3xl font-bold text-[var(--text-primary)] leading-none">{itensConflito.length}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#F2C94C] mt-1">Conflitos · ignorados</p>
          </div>
        </div>
        <div className="border border-[#E85C5C]/30 bg-[#E85C5C]/5 rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#E85C5C]/15 flex items-center justify-center">
            <XCircle size={22} className="text-[#E85C5C]" />
          </div>
          <div>
            <p className="font-['Sora'] text-3xl font-bold text-[var(--text-primary)] leading-none">{itensErro.length}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#E85C5C] mt-1">Erros · revise o arquivo</p>
          </div>
        </div>
      </div>

      {/* Tabela de dados */}
      <div className="border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl overflow-hidden mb-6">
        {/* Toolbar de filtros */}
        <div className="flex items-center gap-4 p-4 border-b border-[var(--border-color)] flex-wrap">
          <div className="flex gap-1">
            {['todos', 'ok', 'conflito', 'erro'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFiltroStatus(s)}
                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                  filtroStatus === s
                    ? 'bg-[#0B1218] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {s === 'todos' ? `Todos (${todosItens.length})` :
                 s === 'ok' ? `Válidos (${itensValidos.length})` :
                 s === 'conflito' ? `Conflitos (${itensConflito.length})` :
                 `Erros (${itensErro.length})`}
              </button>
            ))}
          </div>
          {abasUnicas.length > 1 && (
            <>
              <div className="w-px h-5 bg-[var(--border-color)]" />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setFiltroAba('todos')}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    filtroAba === 'todos' ? 'bg-[#F56A2A] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  Todas as categorias
                </button>
                {abasUnicas.map((aba) => (
                  <button
                    key={aba}
                    type="button"
                    onClick={() => setFiltroAba(aba)}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                      filtroAba === aba ? 'bg-[#F56A2A] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    {LABEL_ABA[aba] ?? aba}
                  </button>
                ))}
              </div>
            </>
          )}
          <p className="ml-auto text-[11px] text-[var(--text-secondary)] font-medium">
            {itensFiltrados.length} {itensFiltrados.length === 1 ? 'item' : 'itens'}
          </p>
        </div>

        {/* Cabeçalho de colunas */}
        <div className="grid grid-cols-[40px_2fr_1fr_1fr_120px_40px] gap-4 px-5 py-3 bg-[var(--bg-secondary)] text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          <span></span>
          <span>Item</span>
          <span>Categoria</span>
          <span>Detalhe</span>
          <span className="text-right">Valor</span>
          <span></span>
        </div>

        {/* Lista */}
        <div className="divide-y divide-[var(--border-color)]">
          {itensFiltrados.map((item) => {
            const cor = STATUS_COR[item.status];
            const expandido = !!expandidos[item.linha];
            return (
              <div key={`${item.linha}-${item.ticker ?? item.nome}`}>
                <button
                  type="button"
                  onClick={() => item.status !== 'ok' && toggleExpandido(item.linha)}
                  className={`w-full grid grid-cols-[40px_2fr_1fr_1fr_120px_40px] gap-4 px-5 py-4 items-center text-left transition-colors ${
                    item.status === 'ok' ? 'cursor-default' : 'cursor-pointer hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <div>
                    {item.status === 'ok' && <CheckCircle2 size={16} className="text-[#6FCF97]" />}
                    {item.status === 'conflito' && <AlertTriangle size={16} className="text-[#F2C94C]" />}
                    {item.status === 'erro' && <XCircle size={16} className="text-[#E85C5C]" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-['Sora'] text-sm font-bold text-[var(--text-primary)] truncate">
                        {item.ticker || item.nome || 'Sem identificação'}
                      </p>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${cor.text} ${cor.bg} border ${cor.border}`}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </div>
                    {item.ticker && item.nome && item.ticker !== item.nome && (
                      <p className="text-[12px] text-[var(--text-secondary)] truncate">{item.nome}</p>
                    )}
                  </div>
                  <div className="text-[12px] text-[var(--text-secondary)] truncate">
                    {LABEL_ABA[item.abaOrigem] ?? item.abaOrigem}
                  </div>
                  <div className="text-[12px] text-[var(--text-secondary)] truncate">
                    {item.plataforma || item.categoria || '—'}
                  </div>
                  <div className="font-['Sora'] text-sm font-bold text-[var(--text-primary)] text-right">
                    {formatMoney(item.valor)}
                  </div>
                  <div className="text-right">
                    {item.status !== 'ok' && (
                      <span className="text-[var(--text-secondary)] text-xs">{expandido ? '−' : '+'}</span>
                    )}
                  </div>
                </button>
                {expandido && item.status !== 'ok' && (
                  <div className="px-5 pb-4 pl-[68px]">
                    <div className={`border ${cor.border} ${cor.bg} rounded-lg p-3 flex items-start gap-2`}>
                      <Info size={14} className={`${cor.text} shrink-0 mt-0.5`} />
                      <div className="flex-1">
                        {item.observacao && (
                          <p className={`text-[12px] ${cor.text} font-semibold mb-1`}>{item.observacao}</p>
                        )}
                        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                          <strong className="text-[var(--text-primary)]">Como resolver:</strong> {SUGESTAO_ERRO(item)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {itensFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HelpCircle size={32} className="text-[var(--text-secondary)] opacity-30 mb-3" />
              <p className="text-sm text-[var(--text-secondary)] font-medium">Nenhum item para este filtro.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer com ações */}
      {confirmError && (
        <div className="flex items-center gap-3 p-4 border border-[#E85C5C]/30 bg-[#E85C5C]/5 rounded-xl mb-4">
          <XCircle size={16} className="text-[#E85C5C] shrink-0" />
          <p className="text-sm font-medium text-[#E85C5C]">{confirmError}</p>
        </div>
      )}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          {itensValidos.length > 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[#6FCF97]">{itensValidos.length} {itensValidos.length === 1 ? 'item' : 'itens'}</strong> {itensValidos.length === 1 ? 'será adicionado' : 'serão adicionados'} à sua carteira.
            </p>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              Nenhum item válido para importar.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep('upload')}
            className="px-6 py-3 border border-[var(--border-color)] text-[11px] font-bold uppercase tracking-widest hover:bg-[var(--bg-secondary)] transition-all rounded-xl text-[var(--text-primary)]"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={confirmarImportacao}
            disabled={itensValidos.length === 0 || isConfirmando}
            className="px-8 py-3 bg-[#F56A2A] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#d95e25] transition-all flex items-center gap-2 rounded-xl"
          >
            {isConfirmando ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Confirmando...
              </>
            ) : (
              <>
                Confirmar importação <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
