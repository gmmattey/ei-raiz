import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDataSources } from "@/core/data/react";
import { ErrorState } from "@/components/system/SystemState";

export function ImportStartPage() {
  const ds = useDataSources();
  const nav = useNavigate();
  const [csvContent, setCsvContent] = React.useState("");
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const downloadTemplate = () => {
    const content = brandedTemplateContent();
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Esquilo_Invest_Template_V1.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function onStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await ds.imports.startImport({
        payload: {
          origin: "CUSTOM_TEMPLATE",
          csvContent: csvContent.trim() ? csvContent : defaultCustomTemplateCsv(),
          fileName,
          mimeType: "text/csv",
        },
      });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      nav(`/app/import/${encodeURIComponent(res.data.importId)}/preview`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opa, não conseguimos ler essa planilha agora. Que tal recarregar a página e tentar mais uma vez?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:py-20 animate-fluid-in">
      <header className="mb-14 text-center">
        <p className="text-[14px] font-bold uppercase tracking-[0.3em] text-brand-primary mb-3">Ecossistema de Dados</p>
        <h1 className="font-display font-bold text-[48px] md:text-[72px] text-text-primary tracking-tight leading-none mb-6">
          Traga sua carteira
        </h1>
        <p className="text-[18px] text-text-secondary max-w-xl mx-auto leading-relaxed font-medium">
          Escolha como quer alimentar a IA. Use nosso template exclusivo para uma análise profunda e sem erros.
        </p>
      </header>

      {error ? (
        <div className="mb-10">
           <ErrorState title="Oops! Algo deu errado" body={error ?? ""} ctaLabel="Entendi" ctaTarget="/app/import" />
        </div>
      ) : null}

      <div className="grid gap-12">
        
        {/* Step 1: Download */}
        <section className="bg-bg-secondary border border-border-default rounded-[40px] p-10 md:p-14 relative overflow-hidden group hover:shadow-xl transition-all">
           <div className="absolute -top-6 -left-6 w-16 h-16 bg-brand-primary text-white font-display font-bold text-[24px] rounded-full flex items-center justify-center shadow-2xl z-20 transition-transform group-hover:scale-110">1</div>
           <div className="flex flex-col md:flex-row md:items-center gap-12 relative z-10">
              <div className="flex-1">
                 <h2 className="font-display font-bold text-[32px] md:text-[42px] text-text-primary mb-4 tracking-tight">Baixe seu modelo</h2>
                 <p className="text-[17px] text-text-secondary leading-relaxed max-w-md font-medium opacity-80">
                    Use nosso template oficial CSV com as colunas pré-definidas para uma análise sem erros.
                 </p>
              </div>
              <Button 
                onClick={downloadTemplate} 
                className="h-20 px-12 font-bold bg-brand-primary text-white hover:bg-text-primary transition-all shadow-2xl shadow-brand-primary/20 flex items-center justify-center gap-4 rounded-3xl text-[18px] active:scale-95"
              >
                 <span className="text-[24px]">↓</span>
                 <span>Baixar Template CSV</span>
              </Button>
           </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           {/* Step 2: Fill */}
           <section className="bg-white border border-border-default rounded-[40px] p-10 relative group hover:border-brand-primary/30 transition-all">
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-bg-surface border-4 border-brand-primary text-brand-primary font-display font-bold text-[24px] rounded-full flex items-center justify-center shadow-xl z-20">2</div>
              <h3 className="font-display font-bold text-[28px] text-text-primary mb-6 tracking-tight">Preencha os dados</h3>
              <ul className="space-y-4 text-[16px] text-text-secondary font-medium">
                 <li className="flex items-center gap-3"><span className="text-brand-primary text-[20px]">✓</span> Mantenha o cabeçalho original</li>
                 <li className="flex items-center gap-3"><span className="text-brand-primary text-[20px]">✓</span> Use ponto para decimais (ex: 10.50)</li>
                 <li className="flex items-center gap-3"><span className="text-brand-primary text-[20px]">✓</span> Nome do ativo e ticker são obrigatórios</li>
              </ul>
           </section>

           {/* Step 3: Upload */}
           <section className="bg-text-primary border border-text-primary rounded-[40px] p-10 relative group shadow-2xl overflow-hidden">
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-brand-primary text-white font-display font-bold text-[24px] rounded-full flex items-center justify-center shadow-2xl z-20 transition-transform group-hover:rotate-12">3</div>
              <div className="relative z-10 h-full flex flex-col">
                 <h3 className="font-display font-bold text-[28px] text-white mb-6 tracking-tight">Envie sua carteira</h3>
                 <div className="flex-1 flex flex-col gap-6">
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-3xl p-6 cursor-pointer hover:bg-white/5 transition-all">
                       <span className="text-[32px] mb-3">📁</span>
                       <span className="text-[14px] text-white font-bold uppercase tracking-widest">{fileName ?? "Selecionar arquivo"}</span>
                       <input 
                         type="file" 
                         accept=".csv" 
                         className="hidden" 
                         onChange={(e: any) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             setFileName(file.name);
                             const reader = new FileReader();
                             reader.onload = (ev: any) => setCsvContent(ev.target?.result as string);
                             reader.readAsText(file);
                           }
                         }}
                       />
                    </label>
                    <Button 
                      disabled={!csvContent || loading} 
                      onClick={onStart}
                      className="h-16 w-full font-bold bg-white text-text-primary hover:bg-brand-primary hover:text-white transition-all rounded-2xl text-[16px] uppercase tracking-widest"
                    >
                       {loading ? "Processando..." : "Subir Minha Carteira"}
                    </Button>
                 </div>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}

function brandedTemplateContent() {
  const header = [
    "# ===========================================================",
    "#             ESQUILO INVEST - TEMPLATE V1.0                 ",
    "# ===========================================================",
    "# INSTRUÇÕES:",
    "# 1. Tipo: ACOES, FUNDOS, RENDA_FIXA ou OUTROS",
    "# 2. Codigo: Ex PETR4, ITSA4 (deixe vazio se não tiver)",
    "# 3. Nome: Nome amigável do ativo",
    "# 4. Valores: Use ponto para decimais (ex: 1250.50)",
    "# -----------------------------------------------------------",
    "",
  ].join("\n");
  
  return header + defaultCustomTemplateCsv();
}

function defaultCustomTemplateCsv() {
  return [
    "tipo,codigo,nome,quantidade,valor_investido,valor_atual,categoria,observacoes",
    "ACOES,PETR4,Petrobras PN,100,2850.00,3240.00,Ações,Exemplo",
    "FUNDOS,,Selection Multimercado,1,50000.00,52300.00,Fundos,Investimento Inicial",
    "RENDA_FIXA,,CDB Liquidez Diária,1,10000.00,10540.00,Liquidez,Reserva",
  ].join("\n");
}
