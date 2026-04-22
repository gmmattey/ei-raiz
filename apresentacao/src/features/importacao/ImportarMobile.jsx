import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, UploadCloud, Loader2, CheckCircle2, XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { ApiError, patrimonioApi, telemetriaApi } from '../../cliente-api';
import { invalidarCacheUsuario } from '../../utils/cache';
import { baixarTemplateXlsx } from '../../utils/importacaoTemplate';
import { parseXlsx } from '../../utils/importacaoParser';

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

export default function ImportarMobile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [erro, setErro] = useState('');
  const [isConfirmando, setIsConfirmando] = useState(false);

  const iniciarUpload = async (file) => {
    if (!file) return;
    const nome = file.name.toLowerCase();
    const isXlsx = nome.endsWith('.xlsx');
    const isCsv = nome.endsWith('.csv');
    if (!isXlsx && !isCsv) {
      setErro('Formato inválido. Envie .xlsx (recomendado) ou .csv.');
      return;
    }
    setErro('');
    setSelectedFile(file);
    setStep('processing');
    try {
      await telemetriaApi.registrarEvento({
        nome: 'import_started',
        dadosJson: { arquivo: file.name, tipo: isXlsx ? 'xlsx' : 'csv' },
      }).catch(() => null);

      let itensBrutos = [];
      if (isXlsx) {
        const resultado = await parseXlsx(file);
        if (resultado.itens.length === 0) {
          setErro('Nenhum item encontrado. Preencha pelo menos uma aba do template.');
          setStep('upload');
          return;
        }
        itensBrutos = resultado.itens;
      } else {
        const conteudo = await file.text();
        itensBrutos = [{ nome: file.name, conteudoCsv: conteudo }];
      }

      const canonico = await patrimonioApi.criarImportacao({
        origem: file.name,
        itens: itensBrutos.map((item, idx) => ({ linha: idx + 1, tipo: 'desconhecido', dadosJson: item })),
      });

      setPreview({ importacaoId: canonico.id, totalItens: itensBrutos.length });
      await telemetriaApi.registrarEvento({
        nome: 'import_reviewed',
        dadosJson: { importacaoId: canonico.id, validos: itensBrutos.length, conflitos: 0, erros: 0 },
      }).catch(() => null);
      setStep('review');
    } catch (e) {
      setErro(mapearErro(e));
      setStep('upload');
    }
  };

  const confirmar = async () => {
    if (!preview || isConfirmando) return;
    setIsConfirmando(true);
    try {
      await patrimonioApi.obterImportacao(preview.importacaoId).catch(() => null);
      await telemetriaApi.registrarEvento({
        nome: 'import_confirmed',
        dadosJson: { importacaoId: preview.importacaoId, itensValidos: preview.totalItens },
      }).catch(() => null);
      invalidarCacheUsuario();
      localStorage.setItem('hasSeenPreInsight', 'true');
      navigate('/home', {
        replace: true,
        state: { showSuccessImport: true, importedItems: preview.totalItens, importacaoId: preview.importacaoId },
      });
    } catch {
      setErro('Falha ao confirmar. Tente novamente.');
    } finally {
      setIsConfirmando(false);
    }
  };

  if (step === 'processing') {
    return (
      <section className="flex flex-col items-center justify-center py-20 pb-4">
        <Loader2 size={40} className="text-[#F56A2A] animate-spin mb-4" />
        <p className="font-['Sora'] text-[16px] font-bold text-[var(--text-primary)] mb-1">Validando arquivo...</p>
        <p className="text-[12px] text-[var(--text-secondary)]">Identificando itens para importar.</p>
      </section>
    );
  }

  if (step === 'review' && preview) {
    return (
      <section className="space-y-4 pb-4">
        <h1 className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">Revisar</h1>
        <article className="rounded-[16px] border border-[#6FCF97]/30 bg-[#6FCF97]/5 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6FCF97]/15">
            <CheckCircle2 size={22} className="text-[#6FCF97]" />
          </div>
          <div>
            <p className="font-['Sora'] text-[28px] font-bold text-[var(--text-primary)] leading-none">{preview.totalItens}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6FCF97] mt-1">
              {preview.totalItens === 1 ? 'item pronto' : 'itens prontos'}
            </p>
          </div>
        </article>
        <p className="text-[12px] text-[var(--text-secondary)]">
          Arquivo: <strong className="text-[var(--text-primary)]">{selectedFile?.name}</strong>
        </p>
        {erro && (
          <div className="flex items-start gap-2 rounded-[12px] border border-[#E85C5C]/30 bg-[#E85C5C]/5 p-3">
            <XCircle size={14} className="text-[#E85C5C] shrink-0 mt-0.5" />
            <p className="text-[12px] font-medium text-[#E85C5C]">{erro}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setStep('upload'); setPreview(null); setSelectedFile(null); }}
            className="min-w-0 inline-flex items-center justify-center gap-1 rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-primary)]"
          >
            <RefreshCw size={12} /> Reenviar
          </button>
          <button
            onClick={confirmar}
            disabled={isConfirmando}
            className="min-w-0 inline-flex items-center justify-center gap-1 rounded-[14px] bg-[#F56A2A] py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
          >
            {isConfirmando ? <><Loader2 size={12} className="animate-spin" /> Confirmando</> : <>Confirmar <ArrowRight size={12} /></>}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 pb-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F56A2A] mb-1">Passo 1 de 2</p>
        <h1 className="font-['Sora'] text-[22px] font-bold text-[var(--text-primary)]">Importar dados</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Baixe o modelo, preencha com seus investimentos e envie o arquivo.
        </p>
      </div>

      <button
        type="button"
        onClick={baixarTemplateXlsx}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--text-primary)] active:opacity-80"
      >
        <Download size={14} /> Baixar modelo .xlsx
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={(e) => iniciarUpload(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex w-full flex-col items-center gap-3 rounded-[16px] border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center active:opacity-80"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#F56A2A]/10">
          <UploadCloud size={28} className="text-[#F56A2A]" />
        </div>
        <div>
          <p className="font-['Sora'] text-[14px] font-bold text-[var(--text-primary)]">Selecionar planilha</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Excel (.xlsx) ou CSV · até 10 MB</p>
        </div>
      </button>

      {erro && (
        <div className="flex items-start gap-2 rounded-[12px] border border-[#E85C5C]/30 bg-[#E85C5C]/5 p-3">
          <XCircle size={14} className="text-[#E85C5C] shrink-0 mt-0.5" />
          <p className="text-[12px] font-medium text-[#E85C5C]">{erro}</p>
        </div>
      )}

      <article className="rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">Dicas</p>
        <ul className="space-y-1.5 text-[12px] text-[var(--text-secondary)] leading-relaxed">
          <li>• Use o modelo .xlsx — ele tem abas para ações, fundos, imóveis e veículos.</li>
          <li>• Após o upload você revisa antes de confirmar.</li>
          <li>• Só os itens válidos entram na sua carteira.</li>
        </ul>
      </article>
    </section>
  );
}
