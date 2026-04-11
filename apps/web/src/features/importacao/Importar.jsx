import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, conteudoApi, importacaoApi, telemetriaApi } from '../../cliente-api';
import { baixarTemplateImportacaoCsv } from '../../utils/importacaoTemplate';
import { useConteudoApp } from '../../hooks/useConteudoApp';
import {
  UploadCloud,
  ArrowRight,
  X,
  Landmark,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from 'lucide-react';

const mapearErroUpload = (erro) => {
  if (!(erro instanceof ApiError)) return 'Falha ao processar arquivo. Tente novamente.';

  switch (erro.code) {
    case 'ARQUIVO_TIPO_INVALIDO':
      return 'Arquivo inválido. Envie um CSV.';
    case 'ARQUIVO_FORA_PADRAO':
      return 'Arquivo fora do padrão esperado. Baixe o template e tente novamente.';
    case 'API_INDISPONIVEL':
      return 'API indisponível no momento. Tente novamente em instantes.';
    default:
      return 'Não foi possível processar a importação. Revise o arquivo e tente novamente.';
  }
};

const statusLabel = {
  ok: 'Válido',
  conflito: 'Conflito',
  erro: 'Erro',
};

const statusClasse = {
  ok: 'text-[#6FCF97] bg-[#6FCF97]/10',
  conflito: 'text-[#F2C94C] bg-[#F2C94C]/10',
  erro: 'text-[#E85C5C] bg-[#E85C5C]/10',
};

const sugerirAcao = (item) => {
  const texto = (item.observacao || '').toLowerCase();
  if (item.status === 'conflito') return 'Se for posição nova, ajuste ticker/plataforma para diferenciar; se for o mesmo ativo, mantenha ignorado.';
  if (texto.includes('ticker não reconhecido')) return 'Corrija para um ticker válido (ex.: PETR4, VALE3).';
  if (texto.includes('valor inválido')) return 'Revise o campo valor com número maior que zero e ponto para casas decimais.';
  if (texto.includes('data inválida')) return 'Use data no formato AAAA-MM-DD.';
  if (texto.includes('categoria inválida')) return 'Use apenas: acao, fundo, previdencia ou renda_fixa.';
  if (texto.includes('identificação canônica inválida') || texto.includes('chave de identificação')) return 'Informe ticker/CNPJ/ISIN válido para permitir conciliação automática.';
  return 'Revise a linha no CSV e reimporte para validar novamente.';
};

const columnsEsperadas = 'data,ticker,nome,categoria,plataforma,quantidade,valor';

export default function Importar() {
  const navigate = useNavigate();
  const { texto } = useConteudoApp();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [erroUpload, setErroUpload] = useState('');
  const [preview, setPreview] = useState(null);
  const [isConfirmando, setIsConfirmando] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [corretoras, setCorretoras] = useState([]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const lista = await conteudoApi.obterCorretorasSuportadas();
        if (ativo) setCorretoras(lista);
      } catch {
        if (ativo) setCorretoras([]);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const iniciarUpload = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErroUpload('Formato inválido: envie um arquivo .csv.');
      return;
    }

    setErroUpload('');
    setSelectedFileName(file.name);
    setStep('processing');

    try {
      await telemetriaApi.registrarEventoTelemetria('import_started', { arquivo: file.name });
      const conteudo = await file.text();
      const resposta = await importacaoApi.uploadExtrato({
        nomeArquivo: file.name,
        conteudo,
        tipoArquivo: 'csv',
      });
      setPreview(resposta);
      await telemetriaApi.registrarEventoTelemetria('import_reviewed', {
        importacaoId: resposta.importacaoId,
        validos: resposta.resumo?.validos ?? 0,
        conflitos: resposta.resumo?.conflitos ?? 0,
        erros: resposta.resumo?.erros ?? 0,
      });
      setStep('review');
    } catch (error) {
      setErroUpload(mapearErroUpload(error));
      setStep('upload');
    }
  };

  const itensVisiveis = preview?.itens ?? [];
  const itensValidos = itensVisiveis.filter((item) => item.status === 'ok');
  const itensConflito = itensVisiveis.filter((item) => item.status === 'conflito');
  const itensErro = itensVisiveis.filter((item) => item.status === 'erro');

  const confirmarImportacao = async () => {
    if (!preview || isConfirmando) return;

    setIsConfirmando(true);
    setConfirmError('');

    try {
      await importacaoApi.confirmarImportacao(preview.importacaoId, itensValidos.map((item) => item.linha));
      await telemetriaApi.registrarEventoTelemetria('import_confirmed', {
        importacaoId: preview.importacaoId,
        itensValidos: itensValidos.length,
      });
      localStorage.setItem('hasSeenPreInsight', 'true');
      navigate('/home', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) setConfirmError('Não foi possível confirmar agora. Revise os itens e tente novamente.');
      else setConfirmError('Falha ao confirmar importação.');
    } finally {
      setIsConfirmando(false);
    }
  };

  return (
    <div className="w-full bg-white font-['Inter'] text-[#0B1218] animate-in fade-in duration-500">
      <div className="w-full max-w-[896px]">
        <div className="mb-10 flex items-center justify-center gap-4 text-[11px] font-bold uppercase tracking-widest text-[#0B1218]/40">
          <span className={step === 'upload' ? 'text-[#F56A2A]' : ''}>1 Upload</span>
          <span>•</span>
          <span className={step === 'review' || step === 'processing' ? 'text-[#F56A2A]' : ''}>2 Revisão</span>
          <span>•</span>
          <span className={step === 'review' && preview ? 'text-[#F56A2A]' : ''}>3 Confirmação</span>
        </div>

        <div className="text-center mb-16">
          <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-4">{texto("importacao.upload.titulo", "Atualizar Carteira")}</h1>
          <p className="text-[#0B1218]/40 text-sm font-medium">{texto("importacao.upload.descricao", "Envie seu CSV e valide linha por linha antes de confirmar.")}</p>
        </div>

        {step === 'upload' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => iniciarUpload(event.target.files?.[0])}
            />

            <div
              className={`border-2 border-dashed p-16 rounded-sm text-center cursor-pointer transition-colors bg-[#FAFAFA] group ${isDragging ? 'border-[#F56A2A]' : 'border-[#EFE7DC] hover:border-[#F56A2A]'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                iniciarUpload(event.dataTransfer.files?.[0]);
              }}
            >
              <UploadCloud size={48} className="mx-auto mb-6 text-[#0B1218]/10 group-hover:text-[#F56A2A] transition-colors" />
              <h3 className="font-['Sora'] text-lg font-bold mb-2">Arraste o CSV aqui ou clique para selecionar</h3>
              <p className="text-xs text-[#0B1218]/40 font-medium">Formato aceito agora: CSV no padrão do template</p>
              <button className="mt-8 bg-[#0B1218] text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all">
                Selecionar arquivo
              </button>
              {selectedFileName && <p className="mt-4 text-xs font-semibold text-[#0B1218]/60">{selectedFileName}</p>}
              {erroUpload && <p className="mt-3 text-xs font-semibold text-[#E85C5C]">{erroUpload}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-[#EFE7DC] rounded-sm flex items-start gap-4">
                <FileSpreadsheet className="text-[#F56A2A] shrink-0" size={24} />
                <div>
                  <h4 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-2">Template Oficial</h4>
                  <p className="text-[11px] text-[#0B1218]/60 leading-relaxed mb-3">Use o CSV padrão para evitar erro de estrutura.</p>
                  <p className="text-[10px] text-[#0B1218]/40 mb-4">Cabeçalho esperado: {columnsEsperadas}</p>
                  <button
                    type="button"
                    onClick={baixarTemplateImportacaoCsv}
                    className="text-[10px] font-bold text-[#F56A2A] hover:underline uppercase tracking-widest"
                  >
                    Baixar Template
                  </button>
                </div>
              </div>

              <div className="p-6 border border-[#EFE7DC] rounded-sm flex items-start gap-4 bg-[#FAFAFA]">
                <Landmark className="text-[#0B1218]/20 shrink-0" size={24} />
                <div>
                  <h4 className="font-['Sora'] text-xs font-bold uppercase tracking-widest mb-2">{texto("importacao.corretoras.titulo", "Integrações bancárias")}</h4>
                  <p className="text-[11px] text-[#0B1218]/60 leading-relaxed">{texto("importacao.corretoras.descricao", "Fluxo atual da plataforma: importação por CSV com revisão linha a linha antes de confirmar.")}</p>
                  {corretoras.length > 0 && (
                    <ul className="mt-3 space-y-1 text-[11px] text-[#0B1218]/70">
                      {corretoras.map((corretora) => (
                        <li key={corretora.codigo}>
                          <span className="font-semibold">{corretora.nome}</span> · {corretora.status} · {corretora.mensagemAjuda}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-24 text-center animate-in zoom-in-95 duration-500">
            <Loader2 size={48} className="mx-auto mb-8 text-[#F56A2A] animate-spin" />
            <h2 className="font-['Sora'] text-2xl font-bold mb-4 tracking-tight uppercase">Validando seu arquivo...</h2>
            <p className="text-sm text-[#0B1218]/40 font-medium max-w-xs mx-auto">
              Estamos separando itens válidos, conflitos e erros de preenchimento.
            </p>
          </div>
        )}

        {step === 'review' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <ResumoStatus icon={<CheckCircle2 size={16} />} label="Válidos" valor={preview?.validos ?? 0} classe="text-[#6FCF97]" />
              <ResumoStatus icon={<AlertTriangle size={16} />} label="Conflitos" valor={preview?.conflitos ?? 0} classe="text-[#F2C94C]" />
              <ResumoStatus icon={<Clock3 size={16} />} label="Erros" valor={preview?.erros ?? 0} classe="text-[#E85C5C]" />
            </div>

            <div className="bg-[#FAFAFA] border border-[#EFE7DC] rounded-sm overflow-hidden mb-6 fade-in-up">
              <div className="p-6 border-b border-[#EFE7DC] flex justify-between items-center gap-4 flex-wrap">
                <h3 className="font-['Sora'] text-xs font-bold uppercase tracking-widest">Revisão da Importação</h3>
                <button
                  onClick={() => setStep('upload')}
                  className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/60 hover:text-[#0B1218] transition-colors"
                >
                  <RefreshCw size={12} /> Reenviar arquivo
                </button>
              </div>

              <div className="divide-y divide-[#EFE7DC]/50 max-h-[400px] overflow-y-auto custom-scrollbar-minimal">
                {itensVisiveis.map((item) => (
                  <div key={`${item.linha}-${item.ticker}`} className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 hover:bg-white transition-colors">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-['Sora'] text-sm font-bold text-[#0B1218]">Linha {item.linha} · {item.ticker || 'SEM TICKER'}</p>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest ${statusClasse[item.status] || 'text-[#0B1218]/60 bg-[#EFE7DC]'}`}>
                          {statusLabel[item.status] ?? item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#0B1218]/70">{item.nome || 'Sem nome'} · {item.categoria} · {item.plataforma || 'Sem plataforma'}</p>
                      {item.observacao && <p className="text-[11px] text-[#E85C5C] mt-1 font-medium">{item.observacao}</p>}
                      {item.status !== 'ok' && (
                        <p className="text-[11px] text-[#0B1218]/70 mt-1 italic">
                          Sugestão: {sugerirAcao(item)}
                        </p>
                      )}
                    </div>
                    <p className="font-['Sora'] text-sm font-bold">R$ {Number(item.valor || 0).toFixed(2)}</p>
                  </div>
                ))}

                {itensVisiveis.length === 0 && <p className="p-8 text-center text-sm text-[#0B1218]/50">Nenhum item encontrado para revisão.</p>}
              </div>
            </div>

            {(itensConflito.length > 0 || itensErro.length > 0) && (
              <div className="mb-6 p-4 border border-[#EFE7DC] bg-white rounded-sm text-xs text-[#0B1218]/70 leading-relaxed">
                {itensConflito.length > 0 && <p>Conflitos: ativo já existe na carteira. Revise a linha e reimporte se necessário.</p>}
                {itensErro.length > 0 && <p className="mt-2">Erros: ajuste as linhas marcadas no CSV (ticker, valor, data, categoria) e reenvie o arquivo.</p>}
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={() => setStep('upload')} className="flex-1 py-4 border border-[#EFE7DC] text-[10px] font-bold uppercase tracking-widest hover:bg-[#FAFAFA] transition-all">
                Voltar
              </button>
              <button
                onClick={confirmarImportacao}
                disabled={itensValidos.length === 0 || isConfirmando}
                className="flex-[2] py-4 bg-[#0B1218] disabled:opacity-40 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-3"
              >
                {isConfirmando ? 'Confirmando...' : 'Confirmar itens válidos'} <ArrowRight size={14} />
              </button>
            </div>

            {confirmError && <p className="mt-3 text-xs font-semibold text-[#E85C5C]">{confirmError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

const ResumoStatus = ({ icon, label, valor, classe }) => (
  <div className="border border-[#EFE7DC] rounded-sm p-4 bg-white">
    <p className="text-[10px] uppercase tracking-widest font-bold text-[#0B1218]/40">{label}</p>
    <div className={`mt-2 flex items-center gap-2 ${classe}`}>
      {icon}
      <p className="font-['Sora'] text-2xl font-bold">{valor}</p>
    </div>
  </div>
);
