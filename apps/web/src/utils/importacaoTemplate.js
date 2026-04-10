const TEMPLATE_FILENAME = "template-importacao-esquilo.csv";

const TEMPLATE_CONTENT = [
  "data,ticker,nome,categoria,plataforma,quantidade,valor",
  "2026-01-15,PETR4,PETROBRAS PN,acao,XP Investimentos,100,3450.00",
  "2026-01-20,HGLG11,CSHG LOGISTICA,fundo,BTG Pactual,10,1680.50",
].join("\n");

export function baixarTemplateImportacaoCsv() {
  const blob = new Blob([`\uFEFF${TEMPLATE_CONTENT}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = TEMPLATE_FILENAME;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

