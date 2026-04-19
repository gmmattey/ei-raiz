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
  ChevronDown,
  ChevronUp,
  Info,
  Building2,
  House,
  Car,
  PiggyBank,
  CandlestickChart,
} from 'lucide-react';

// ─── Constantes de marca ──────────────────────────────────────────────────────

const LABEL_ABA = {
  acoes: 'Ações',
  fundos: 'Fundos',
  imoveis: 'Imóveis',
  veiculos: 'Veículos',
  poupanca: 'Poupança',
};

const STATUS_LABEL = { ok: 'Válido', conflito: 'Conflito', erro: 'Erro' };
const STATUS_CLASSE = {
  ok: 'text-[#6FCF97] bg-[#6FCF97]/10 border border-[#6FCF97]/30',
  conflito: 'text-[#F2C94C] bg-[#F2C94C]/10 border border-[#F2C94C]/30',
  erro: 'text-[#E85C5C] bg-[#E85C5C]/10 border border-[#E85C5C]/30',
};

const SUGESTAO_ERRO = (item) => {
  const obs = (item.observacao || '').toLowerCase();
  if (item.status === 'conflito') return 'Este item já existe na sua carteira. Você pode ignorá-lo agora ou removê-lo manualmente antes de reimportar.';
  if (obs.includes('ticker') && obs.includes('ação')) return 'Verifique se o ticker está correto (ex.: PETR4, VALE3). Letras maiúsculas, sem espaço.';
  if (obs.includes('valor')) return 'Informe um valor positivo. Use ponto ou vírgula como separador decimal.';
  if (obs.includes('data')) return 'Use o formato AAAA-MM-DD (ex.: 2026-01-15).';
  if (obs.includes('quantidade')) return 'Informe a quantidade como número positivo.';
  if (obs.includes('nome')) return 'O campo nome/descrição é obrigatório para este tipo.';
  if (obs.includes('instituição')) return 'Informe o nome do banco ou instituição.';
  if (obs.includes('montadora') || obs.includes('modelo')) return 'Montadora e modelo são campos obrigatórios para veículos.';
  if (obs.includes('tipo')) return 'Informe o tipo corretamente. Consulte a aba Guia do template.';
  return 'Revise os campos obrigatórios desta linha no arquivo e reimporte.';
};

// ─── Erros de upload ──────────────────────────────────────────────────────────

const mapearErro = (erro) => {
  if (!(erro instanceof ApiError)) {
    return erro?.message?.includes('XLSX') ? erro.message : 'Falha ao processar o arquivo. Tente novamente.';
  }
  switch (erro.code) {
    case 'ARQUIVO_TIPO_INVALIDO': return 'Formato inválido. Envie um arquivo .xlsx ou .csv.';
    case 'ARQUIVO_FORA_PADRAO': return erro.message || 'Arquivo fora do padrão. Baixe o template e tente novamente.';
    case 'API_INDISPONIVEL': return 'API indisponível. Tente novamente em instantes.';
    default: return 'Não foi possível processar a importação. Revise o arquivo e tente novamente.';
  }
};

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function StepIndicator({ step }) {
  const passos = ['Upload', 'Revisão', 'Confirmação'];
  const ativo = { upload: 0, processing: 1, review: 1, success: 2 }[step] ?? 0;
  return (
    <div className="flex items-center gap-3 justify-center mb-12 max-w-2xl mx-auto">
      {passos.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                i < ativo ? 'bg-[#6FCF97] text-white' :
                i === ativo ? 'bg-[#F56A2A] text-white' :
                'bg-[#EFE7DC] text-[#0B1218]/40'
              }`}
            >
              {i < ativo ? '✓' : i + 1}
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${i === ativo ? 'text-[#F56A2A]' : 'text-[#0B1218]/30'}`}>
              {label}
            </span>
          </div>
          {i < passos.length - 1 && <div className="w-8 h-px bg-[#EFE7DC]" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function ResumoCard({ icon, label, valor, cor }) {
  return (
    <div className="border border-[#EFE7DC] rounded-xl p-5 bg-white flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest font-bold text-[#0B1218]/40">{label}</p>
      <div className={`flex items-center gap-2 ${cor}`}>
        {icon}
        <p className="font-['Sora'] text-3xl font-bold">{valor}</p>
      </div>
    </div>
  );
}

function ItemReview({ item, expandido, onToggle }) {
  const valorFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.valor || 0));

  return (
    <div className={`border-b border-[#EFE7DC]/50 last:border-0 transition-colors ${item.status === 'ok' ? 'hover:bg-white/60' : 'hover:bg-white'}`}>
      <button
        type="button"
        className="w-full p-4 text-left flex items-start gap-3"
        onClick={onToggle}
      >
        <div className="mt-0.5 shrink-0">
          {item.status === 'ok' && <CheckCircle2 size={16} className="text-[#6FCF97]" />}
          {item.status === 'conflito' && <AlertTriangle size={16} className="text-[#F2C94C]" />}
          {item.status === 'erro' && <XCircle size={16} className="text-[#E85C5C]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-['Sora'] text-sm font-bold text-[#0B1218]">
              {item.ticker || item.nome || 'Item sem identificação'}
            </p>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${STATUS_CLASSE[item.status]}`}>
              {STATUS_LABEL[item.status]}
            </span>
            <span className="text-[10px] text-[#0B1218]/40 font-medium">
              {LABEL_ABA[item.abaOrigem] ?? item.abaOrigem}
            </span>
          </div>
          <p className="text-[11px] text-[#0B1218]/60">
            {[item.nome !== item.ticker && item.nome, item.plataforma].filter(Boolean).join(' · ') || item.categoria}
          </p>
          {item.observacao && (
            <p className="text-[11px] text-[#E85C5C] mt-1 font-medium">{item.observacao}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <p className="font-['Sora'] text-sm font-bold text-[#0B1218]">{valorFmt}</p>
          {item.status !== 'ok' && (
            expandido ? <ChevronUp size={14} className="text-[#0B1218]/40" /> : <ChevronDown size={14} className="text-[#0B1218]/40" />
          )}
        </div>
      </button>

      {expandido && item.status !== 'ok' && (
        <div className="px-4 pb-4 ml-7">
          <div className="bg-[#FAFAFA] border border-[#EFE7DC] rounded-xl p-3">
            <p className="text-[11px] text-[#0B1218]/70 leading-relaxed">
              <strong className="font-semibold">Como resolver:</strong> {SUGESTAO_ERRO(item)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

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

  // ─── Upload e parse ─────────────────────────────────────────────────────────

  const iniciarUpload = async (file) => {
    if (!file) return;

    const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
    const isCsv = file.name.toLowerCase().endsWith('.csv');

    if (!isXlsx && !isCsv) {
      setErroUpload('Formato inválido. Envie um arquivo .xlsx (recomendado) ou .csv.');
      return;
    }

    setErroUpload('');
    setSelectedFile(file);
    setStep('processing');

    try {
      await telemetriaApi.registrarEventoTelemetria('import_started', { arquivo: file.name, tipo: isXlsx ? 'xlsx' : 'csv' });

      let resposta;

      if (isXlsx) {
        // Parse no frontend, envia JSON estruturado
        const resultado = await parseXlsx(file);

        if (resultado.itens.length === 0) {
          setErroUpload('Nenhum item encontrado no arquivo. Verifique se preencheu pelo menos uma aba do template.');
          setStep('upload');
          return;
        }

        resposta = await importacaoApi.uploadExtrato({
          nomeArquivo: file.name,
          tipoArquivo: 'xlsx',
          itens: resultado.itens,
        });
      } else {
        // CSV legado
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

  // ─── Confirmação ────────────────────────────────────────────────────────────

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
          importacaoId: preview.importacaoId
        } 
      });
    } catch (error) {
      setConfirmError(error instanceof ApiError ? 'Não foi possível confirmar agora. Tente novamente.' : 'Falha ao confirmar importação.');
    } finally {
      setIsConfirmando(false);
    }
  };

  // ─── Helpers de filtragem ────────────────────────────────────────────────────

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

  const toggleExpandido = (linha) => {
    setExpandidos((prev) => ({ ...prev, [linha]: !prev[linha] }));
  };

  // ─── Drag & Drop ────────────────────────────────────────────────────────────

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    iniciarUpload(e.dataTransfer.files?.[0]);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={`w-full ${embedded ? 'bg-transparent text-[#0B1218]' : 'bg-white text-[#0B1218] animate-in fade-in duration-500'} font-['Inter']`}>
      <div className={`w-full ${embedded ? '' : 'max-w-[896px]'}`}>
        <StepIndicator step={step} />

        {/* ── UPLOAD ── */}
        {step === 'upload' && (
          <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-3">
                Importar Patrimônio
              </h1>
              <p className="text-[#0B1218]/50 text-sm font-medium max-w-md mx-auto">
                Baixe o template, preencha com seus dados e faça o upload. Você revisará tudo antes de confirmar.
              </p>
            </div>

            {/* Template CTA */}
            <div className="border border-[#F56A2A]/30 bg-[#F56A2A]/5 rounded-xl p-6 flex items-start gap-5">
              <div className="w-10 h-10 bg-[#F56A2A] rounded-xl flex items-center justify-center shrink-0">
                <FileSpreadsheet size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-['Sora'] text-sm font-bold mb-1">
                  Template oficial · XLSX com múltiplas abas
                </h3>
                <p className="text-[11px] text-[#0B1218]/60 leading-relaxed mb-1">
                  Abas incluídas: <span className="font-semibold">Guia · Ações · Fundos · Imóveis · Veículos · Poupança</span>
                </p>
                <p className="text-[11px] text-[#0B1218]/50 leading-relaxed mb-4">
                  Cada aba contém campos específicos para aquele tipo de ativo, com exemplos e instruções visíveis.
                </p>
                <button
                  type="button"
                  onClick={baixarTemplateXlsx}
                  className="inline-flex items-center gap-2 bg-[#F56A2A] text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#d95e25] transition-all rounded-xl"
                >
                  <Download size={12} /> Baixar Template .xlsx
                </button>
              </div>
            </div>

            {/* Drop zone */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => iniciarUpload(e.target.files?.[0])}
            />

            <div
              className={`border-2 border-dashed p-16 rounded-xl text-center cursor-pointer transition-all bg-[#FAFAFA] group ${
                isDragging ? 'border-[#F56A2A] bg-[#F56A2A]/5' : 'border-[#EFE7DC] hover:border-[#F56A2A] hover:bg-[#F56A2A]/3'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <UploadCloud
                size={48}
                className={`mx-auto mb-6 transition-colors ${isDragging ? 'text-[#F56A2A]' : 'text-[#0B1218]/10 group-hover:text-[#F56A2A]'}`}
              />
              <h3 className="font-['Sora'] text-lg font-bold mb-2">
                {isDragging ? 'Solte o arquivo aqui' : 'Arraste o arquivo ou clique para selecionar'}
              </h3>
              <p className="text-xs text-[#0B1218]/40 font-medium mb-6">
                Formatos aceitos: <strong>.xlsx</strong> (recomendado) · <span className="text-[#0B1218]/30">.csv (legado)</span>
              </p>
              <button
                type="button"
                className="bg-[#0B1218] text-white px-8 py-3.5 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all rounded-xl"
              >
                Selecionar arquivo
              </button>
              {selectedFile && (
                <p className="mt-4 text-xs font-semibold text-[#0B1218]/60">{selectedFile.name}</p>
              )}
            </div>

            {erroUpload && (
              <div className="flex items-start gap-3 p-4 border border-[#E85C5C]/30 bg-[#E85C5C]/5 rounded-xl">
                <XCircle size={16} className="text-[#E85C5C] shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-[#E85C5C]">{erroUpload}</p>
              </div>
            )}

            {/* Tipos suportados */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { icon: <CandlestickChart size={18} />, label: 'Ações', desc: 'B3 / ETFs / FIIs' },
                { icon: <Building2 size={18} />, label: 'Fundos', desc: 'Previdência / RF' },
                { icon: <House size={18} />, label: 'Imóveis', desc: 'Residencial / Comercial' },
                { icon: <Car size={18} />, label: 'Veículos', desc: 'FIPE / Financiado' },
                { icon: <PiggyBank size={18} />, label: 'Poupança', desc: 'Por instituição' },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="border border-[#EFE7DC] rounded-xl p-4 text-center">
                  <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F56A2A]/10 text-[#F56A2A]">
                    {icon}
                  </div>
                  <p className="font-['Sora'] text-xs font-bold text-[#0B1218]">{label}</p>
                  <p className="text-[10px] text-[#0B1218]/40 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === 'processing' && (
          <div className="py-32 text-center animate-in zoom-in-95 duration-500">
            <div className="relative inline-flex items-center justify-center mb-8">
              <Loader2 size={48} className="text-[#F56A2A] animate-spin" />
            </div>
            <h2 className="font-['Sora'] text-2xl font-bold mb-3 tracking-tight">
              Validando seu arquivo...
            </h2>
            <p className="text-sm text-[#0B1218]/40 font-medium max-w-xs mx-auto">
              Identificando itens válidos, conflitos e erros de preenchimento.
            </p>
          </div>
        )}

        {/* ── REVIEW ── */}
        {step === 'review' && preview && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
            <div className="text-center mb-2">
              <h1 className="font-['Sora'] text-3xl font-bold tracking-tight mb-2">
                Revisão da Importação
              </h1>
              <p className="text-sm text-[#0B1218]/50">
                {preview.totalLinhas} {preview.totalLinhas === 1 ? 'item encontrado' : 'itens encontrados'} · confirme os válidos abaixo
              </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <ResumoCard
                icon={<CheckCircle2 size={18} />}
                label="Válidos"
                valor={preview.validos ?? 0}
                cor="text-[#6FCF97]"
              />
              <ResumoCard
                icon={<AlertTriangle size={18} />}
                label="Conflitos"
                valor={preview.conflitos ?? 0}
                cor="text-[#F2C94C]"
              />
              <ResumoCard
                icon={<XCircle size={18} />}
                label="Erros"
                valor={preview.erros ?? 0}
                cor="text-[#E85C5C]"
              />
            </div>

            {/* Info banner */}
            {(itensConflito.length > 0 || itensErro.length > 0) && (
              <div className="flex items-start gap-3 p-4 border border-[#EFE7DC] bg-[#FAFAFA] rounded-xl">
                <Info size={14} className="text-[#0B1218]/40 shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#0B1218]/60 leading-relaxed">
                  {itensConflito.length > 0 && (
                    <span>
                      <strong>{itensConflito.length} conflito{itensConflito.length > 1 ? 's' : ''}</strong>: ativo já existente.
                      {' '}
                    </span>
                  )}
                  {itensErro.length > 0 && (
                    <span>
                      <strong>{itensErro.length} erro{itensErro.length > 1 ? 's' : ''}</strong>: corrija no arquivo e reimporte para incluir.
                    </span>
                  )}
                  {' '}Apenas os itens <span className="text-[#6FCF97] font-semibold">válidos</span> serão importados.
                </p>
              </div>
            )}

            {/* Filtros */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1">
                {['todos', 'ok', 'conflito', 'erro'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFiltroStatus(s)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                      filtroStatus === s
                        ? 'bg-[#0B1218] text-white'
                        : 'bg-[#FAFAFA] border border-[#EFE7DC] text-[#0B1218]/50 hover:border-[#0B1218]/30'
                    }`}
                  >
                    {s === 'todos' ? 'Todos' : STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
              {abasUnicas.length > 1 && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setFiltroAba('todos')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all ${filtroAba === 'todos' ? 'bg-[#F56A2A] text-white' : 'bg-[#FAFAFA] border border-[#EFE7DC] text-[#0B1218]/50'}`}
                  >
                    Todas as abas
                  </button>
                  {abasUnicas.map((aba) => (
                    <button
                      key={aba}
                      type="button"
                      onClick={() => setFiltroAba(aba)}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all ${filtroAba === aba ? 'bg-[#F56A2A] text-white' : 'bg-[#FAFAFA] border border-[#EFE7DC] text-[#0B1218]/50'}`}
                    >
                      {LABEL_ABA[aba] ?? aba}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="ml-auto inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/50 hover:text-[#0B1218] transition-colors"
              >
                <RefreshCw size={12} /> Reenviar arquivo
              </button>
            </div>

            {/* Lista de itens */}
            <div className="border border-[#EFE7DC] rounded-xl overflow-hidden bg-[#FAFAFA]">
              <div className="max-h-[480px] overflow-y-auto divide-y divide-[#EFE7DC]/50">
                {itensFiltrados.map((item) => (
                  <ItemReview
                    key={`${item.linha}-${item.ticker ?? item.nome}`}
                    item={item}
                    expandido={!!expandidos[item.linha]}
                    onToggle={() => toggleExpandido(item.linha)}
                  />
                ))}
                {itensFiltrados.length === 0 && (
                  <p className="p-10 text-center text-sm text-[#0B1218]/40 font-medium">
                    Nenhum item para este filtro.
                  </p>
                )}
              </div>
            </div>

            {/* Contagem final */}
            {itensValidos.length > 0 && (
              <div className="flex items-center gap-3 p-4 border border-[#6FCF97]/30 bg-[#6FCF97]/5 rounded-xl">
                <CheckCircle2 size={14} className="text-[#6FCF97] shrink-0" />
                <p className="text-[11px] text-[#0B1218]/70 font-medium">
                  <strong>{itensValidos.length} {itensValidos.length === 1 ? 'item será importado' : 'itens serão importados'}</strong> para a sua carteira.
                  {itensConflito.length > 0 && ` ${itensConflito.length} conflito${itensConflito.length > 1 ? 's' : ''} ignorado${itensConflito.length > 1 ? 's' : ''}.`}
                  {itensErro.length > 0 && ` ${itensErro.length} erro${itensErro.length > 1 ? 's' : ''} ignorado${itensErro.length > 1 ? 's' : ''}.`}
                </p>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="flex-1 py-4 border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest hover:bg-[#FAFAFA] transition-all rounded-xl"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={confirmarImportacao}
                disabled={itensValidos.length === 0 || isConfirmando}
                className="flex-[2] py-4 bg-[#0B1218] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-3 rounded-xl"
              >
                {isConfirmando ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Confirmando...
                  </>
                ) : (
                  <>
                    Confirmar {itensValidos.length} {itensValidos.length === 1 ? 'item' : 'itens'} válidos
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

            {confirmError && (
              <div className="flex items-center gap-3 p-4 border border-[#E85C5C]/30 bg-[#E85C5C]/5 rounded-xl">
                <XCircle size={14} className="text-[#E85C5C] shrink-0" />
                <p className="text-sm font-medium text-[#E85C5C]">{confirmError}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
