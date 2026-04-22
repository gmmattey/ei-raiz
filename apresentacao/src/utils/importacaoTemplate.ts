import type { CellObject, WorkBook, WorkSheet } from "xlsx";

// ─── Lazy loader — xlsx (~300KB) só carrega quando a função for chamada ──────

// biome-ignore lint/suspicious/noExplicitAny: variável de runtime carregada dinamicamente
let XLSX: typeof import("xlsx") = null as any;

async function loadXLSX(): Promise<void> {
  if (!XLSX) {
    XLSX = await import("xlsx");
  }
}

// ─── Paleta Esquilo (Opção 2 · Dashboard Cards) ──────────────────────────────
const COR_LARANJA = "F56A2A";
const COR_LARANJA_SUAVE = "FFF3EC";
const COR_ESCURO = "0B1218";
const COR_ESCURO_SUAVE = "1A242E";
const COR_BRANCO = "FFFFFF";
const COR_ZEBRA = "F7F3ED";
const COR_CREME = "FAF6F0";
const COR_TEXTO_MUTED = "7A8490";
const COR_VERDE = "6FCF97";

// ─── Listas (cue visual + potencial data-validation) ─────────────────────────
const LISTA_CORRETORAS = [
  "XP Investimentos", "BTG Pactual", "NuInvest", "Itaú", "Rico",
  "Clear", "Bradesco", "Santander", "Banco do Brasil", "Genial", "Toro", "Outra",
];
const LISTA_TIPO_FUNDO = [
  "FII", "Multimercado", "Ações", "Renda Fixa", "Previdência PGBL", "Previdência VGBL", "Cambial", "ETF", "Outro",
];
const LISTA_INDEXADOR = ["CDI", "IPCA", "SELIC", "PRE", "IGPM"];
const LISTA_TIPO_RF = ["CDB", "LCI", "LCA", "Tesouro", "Debênture", "LC", "CRI", "CRA", "Outro"];
const LISTA_TIPO_PREVIDENCIA = ["PGBL", "VGBL"];
const LISTA_TIPO_IMOVEL = ["Residencial", "Comercial", "Terreno", "Rural", "Outros"];
const LISTA_FINALIDADE_IMOVEL = ["Moradia", "Aluguel", "Lazer", "Outros"];
const LISTA_TIPO_VEICULO = ["Carro", "Moto", "Caminhão", "Outro"];

// ─── Estilos — sem bordas; gridlines ocultas no nível da sheet ──────────────

function hero(): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: COR_ESCURO }, patternType: "solid" },
    font: { color: { rgb: COR_BRANCO }, sz: 11, name: "Inter" },
    alignment: { horizontal: "left", vertical: "center" },
  };
}

function heroLabel(): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: COR_ESCURO }, patternType: "solid" },
    font: { bold: true, color: { rgb: COR_LARANJA }, sz: 10, name: "Inter" },
    alignment: { horizontal: "left", vertical: "center" },
  };
}

function heroTitulo(): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: COR_ESCURO }, patternType: "solid" },
    font: { bold: true, color: { rgb: COR_BRANCO }, sz: 20, name: "Sora" },
    alignment: { horizontal: "left", vertical: "center" },
  };
}

function heroSub(): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: COR_ESCURO }, patternType: "solid" },
    font: { color: { rgb: "C8CDD3" }, sz: 10, name: "Inter" },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
  };
}

function stepNum(): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: COR_LARANJA_SUAVE }, patternType: "solid" },
    font: { bold: true, color: { rgb: COR_LARANJA }, sz: 18, name: "Sora" },
    alignment: { horizontal: "center", vertical: "center" },
  };
}

function stepTitulo(): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" },
    font: { bold: true, color: { rgb: COR_ESCURO }, sz: 11, name: "Sora" },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
  };
}

function stepTexto(): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" },
    font: { color: { rgb: COR_TEXTO_MUTED }, sz: 10, name: "Inter" },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
  };
}

function tabelaHeader(obrigatorio = false): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: obrigatorio ? COR_LARANJA : COR_ESCURO }, patternType: "solid" },
    font: { bold: true, color: { rgb: COR_BRANCO }, sz: 10, name: "Inter" },
    alignment: { horizontal: "left", vertical: "center", wrapText: true, indent: 1 },
  };
}

function celulaDado(par = false): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: par ? COR_ZEBRA : COR_BRANCO }, patternType: "solid" },
    font: { color: { rgb: COR_ESCURO }, sz: 11, name: "Inter" },
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
  };
}

function celulaDinheiro(par = false): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: par ? COR_ZEBRA : COR_BRANCO }, patternType: "solid" },
    font: { color: { rgb: COR_ESCURO }, sz: 11, name: "Inter" },
    alignment: { horizontal: "right", vertical: "center", indent: 1 },
    numFmt: '"R$" #,##0.00',
  };
}

function celulaData(par = false): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: par ? COR_ZEBRA : COR_BRANCO }, patternType: "solid" },
    font: { color: { rgb: COR_ESCURO }, sz: 11, name: "Inter" },
    alignment: { horizontal: "center", vertical: "center" },
  };
}

function pillTicker(par = false): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: par ? COR_ZEBRA : COR_BRANCO }, patternType: "solid" },
    font: { bold: true, color: { rgb: COR_LARANJA }, sz: 11, name: "Sora" },
    alignment: { horizontal: "center", vertical: "center" },
  };
}

function legendaHint(): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: COR_LARANJA_SUAVE }, patternType: "solid" },
    font: { italic: true, color: { rgb: COR_TEXTO_MUTED }, sz: 10, name: "Inter" },
    alignment: { horizontal: "left", vertical: "center", wrapText: true, indent: 1 },
  };
}

function rodapeLegenda(): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: COR_LARANJA_SUAVE }, patternType: "solid" },
    font: { color: { rgb: COR_ESCURO }, sz: 10, name: "Inter" },
    alignment: { horizontal: "left", vertical: "center", wrapText: true, indent: 1 },
  };
}

function placeholder(par = false): Record<string, unknown> {
  return {
    fill: { fgColor: { rgb: par ? COR_ZEBRA : COR_BRANCO }, patternType: "solid" },
    font: { color: { rgb: "BDC3CC" }, sz: 10, italic: true, name: "Inter" },
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
  };
}

// ─── Helpers de célula ───────────────────────────────────────────────────────

function cel(v: unknown, s?: Record<string, unknown>): CellObject {
  return { v, t: typeof v === "number" ? "n" : "s", s } as CellObject;
}

function celVazia(s?: Record<string, unknown>): CellObject {
  return { v: "", t: "s", s } as CellObject;
}

function merge(ws: WorkSheet, r1: number, c1: number, r2: number, c2: number): void {
  ws["!merges"] = ws["!merges"] ?? [];
  ws["!merges"].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

function setRowHeights(ws: WorkSheet, heights: Record<number, number>): void {
  const rows: Array<{ hpt?: number }> = [];
  for (const [idx, h] of Object.entries(heights)) {
    const i = Number(idx);
    while (rows.length <= i) rows.push({});
    rows[i] = { hpt: h };
  }
  ws["!rows"] = rows;
}

function ocultarGridlines(ws: WorkSheet): void {
  (ws as unknown as Record<string, unknown>)["!views"] = [
    { showGridLines: false },
  ];
}

// ─── Hero band — 4 linhas dark no topo de cada aba ───────────────────────────

function aplicarHero(
  ws: WorkSheet,
  colunasTotais: number,
  label: string,
  titulo: string,
  subtitulo: string,
): void {
  const totalCol = colunasTotais - 1;

  // Linha 0 — spacer dark
  for (let c = 0; c <= totalCol; c++) {
    ws[XLSX.utils.encode_cell({ r: 0, c })] = celVazia(hero());
  }
  // Linha 1 — label pequeno laranja
  ws[XLSX.utils.encode_cell({ r: 1, c: 0 })] = cel(label, heroLabel());
  for (let c = 1; c <= totalCol; c++) ws[XLSX.utils.encode_cell({ r: 1, c })] = celVazia(hero());
  merge(ws, 1, 0, 1, totalCol);

  // Linha 2 — título grande branco
  ws[XLSX.utils.encode_cell({ r: 2, c: 0 })] = cel(titulo, heroTitulo());
  for (let c = 1; c <= totalCol; c++) ws[XLSX.utils.encode_cell({ r: 2, c })] = celVazia(heroTitulo());
  merge(ws, 2, 0, 2, totalCol);

  // Linha 3 — subtítulo cinza claro
  ws[XLSX.utils.encode_cell({ r: 3, c: 0 })] = cel(subtitulo, heroSub());
  for (let c = 1; c <= totalCol; c++) ws[XLSX.utils.encode_cell({ r: 3, c })] = celVazia(heroSub());
  merge(ws, 3, 0, 3, totalCol);

  // Linha 4 — spacer dark + accent
  for (let c = 0; c <= totalCol; c++) ws[XLSX.utils.encode_cell({ r: 4, c })] = celVazia(hero());
}

// ─── Aba Guia — passo-a-passo com cards numerados ────────────────────────────

function criarAbaGuia(wb: WorkBook): void {
  const ws: WorkSheet = {};
  const cols = 4;

  aplicarHero(
    ws,
    cols,
    "ESQUILO\\WALLET · IMPORTAÇÃO DE PATRIMÔNIO",
    "Organize seu patrimônio em uma planilha só.",
    "Preencha apenas as abas que se aplicam ao seu caso. Campos com cabeçalho laranja são obrigatórios.",
  );

  // Espaçador branco
  for (let c = 0; c < cols; c++) ws[XLSX.utils.encode_cell({ r: 5, c })] = celVazia({ fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" } });

  // Subtítulo "Como preencher"
  ws[XLSX.utils.encode_cell({ r: 6, c: 0 })] = cel("PASSO A PASSO", {
    fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" },
    font: { bold: true, color: { rgb: COR_LARANJA }, sz: 10, name: "Inter" },
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
  });
  for (let c = 1; c < cols; c++) ws[XLSX.utils.encode_cell({ r: 6, c })] = celVazia({ fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" } });
  merge(ws, 6, 0, 6, cols - 1);

  // 4 step cards em 2 linhas × 2 colunas — na verdade 1 linha × 4 colunas na xlsx
  const passos = [
    { n: "01", t: "Escolha as abas", d: "Use só as que se aplicam ao seu caso. As demais podem ficar vazias." },
    { n: "02", t: "Preencha os obrigatórios", d: "Colunas com cabeçalho laranja não podem ficar em branco." },
    { n: "03", t: "Use as listas sugeridas", d: "A linha de legenda mostra as opções válidas para cada campo." },
    { n: "04", t: "Salve e envie", d: "Salve como .xlsx e faça upload na tela de importação." },
  ];

  const linhaPasso = 8;
  for (let i = 0; i < passos.length; i++) {
    const p = passos[i];
    ws[XLSX.utils.encode_cell({ r: linhaPasso, c: i })] = cel(p.n, stepNum());
    ws[XLSX.utils.encode_cell({ r: linhaPasso + 1, c: i })] = cel(p.t, stepTitulo());
    ws[XLSX.utils.encode_cell({ r: linhaPasso + 2, c: i })] = cel(p.d, stepTexto());
  }

  // Linha separadora (branco)
  for (let c = 0; c < cols; c++) ws[XLSX.utils.encode_cell({ r: 11, c })] = celVazia({ fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" } });

  // Seção — abas disponíveis
  ws[XLSX.utils.encode_cell({ r: 12, c: 0 })] = cel("ABAS DESTA PLANILHA", {
    fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" },
    font: { bold: true, color: { rgb: COR_LARANJA }, sz: 10, name: "Inter" },
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
  });
  for (let c = 1; c < cols; c++) ws[XLSX.utils.encode_cell({ r: 12, c })] = celVazia({ fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" } });
  merge(ws, 12, 0, 12, cols - 1);

  const abas = [
    { ico: "📈", nome: "Ações", desc: "Ativos listados na B3 — ações, ETFs e FIIs." },
    { ico: "🏦", nome: "Fundos", desc: "Fundos de investimento via CNPJ ou nome." },
    { ico: "📄", nome: "Renda Fixa", desc: "CDB, LCI, LCA, Tesouro, Debêntures, CRI/CRA." },
    { ico: "🏛️", nome: "Previdência", desc: "PGBL e VGBL (separados por razão fiscal)." },
    { ico: "🏠", nome: "Imóveis", desc: "Residencial, comercial, terrenos e rurais." },
    { ico: "🚗", nome: "Veículos", desc: "Carros, motos, caminhões — valor FIPE como referência." },
    { ico: "💰", nome: "Poupança", desc: "Saldos em caderneta — uma linha por banco." },
  ];
  let r = 14;
  for (const a of abas) {
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cel(a.ico, {
      fill: { fgColor: { rgb: COR_LARANJA_SUAVE }, patternType: "solid" },
      font: { sz: 14, name: "Inter" },
      alignment: { horizontal: "center", vertical: "center" },
    });
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = cel(a.nome, stepTitulo());
    ws[XLSX.utils.encode_cell({ r, c: 2 })] = cel(a.desc, stepTexto());
    ws[XLSX.utils.encode_cell({ r, c: 3 })] = celVazia({ fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" } });
    merge(ws, r, 2, r, 3);
    r++;
  }

  // Separador
  for (let c = 0; c < cols; c++) ws[XLSX.utils.encode_cell({ r, c })] = celVazia({ fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" } });
  r++;

  // Formato/Regras
  ws[XLSX.utils.encode_cell({ r, c: 0 })] = cel("REGRAS DE PREENCHIMENTO", {
    fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" },
    font: { bold: true, color: { rgb: COR_LARANJA }, sz: 10, name: "Inter" },
    alignment: { horizontal: "left", vertical: "center", indent: 1 },
  });
  for (let c = 1; c < cols; c++) ws[XLSX.utils.encode_cell({ r, c })] = celVazia({ fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" } });
  merge(ws, r, 0, r, cols - 1);
  r += 2;

  const regras = [
    ["Valores", "Em reais, sem prefixo R$ (ex.: 35000 ou 35000,00)."],
    ["Datas", "Formato AAAA-MM-DD (ex.: 2026-01-15)."],
    ["CNPJ", "Pode ser formatado (00.000.000/0001-00) ou só dígitos."],
    ["Participação", "Número de 0 a 100 (ex.: 50 para 50%)."],
    ["Duplicidade", "Itens já existentes aparecem como conflito no preview — você decide manter ou sobrescrever."],
  ];
  for (const [titulo, texto] of regras) {
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cel(titulo, stepTitulo());
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = cel(texto, stepTexto());
    ws[XLSX.utils.encode_cell({ r, c: 2 })] = celVazia({ fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" } });
    ws[XLSX.utils.encode_cell({ r, c: 3 })] = celVazia({ fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" } });
    merge(ws, r, 1, r, 3);
    r++;
  }

  // Suporte
  r += 1;
  for (let c = 0; c < cols; c++) ws[XLSX.utils.encode_cell({ r, c })] = celVazia({ fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" } });
  r++;
  ws[XLSX.utils.encode_cell({ r, c: 0 })] = cel("Precisa de ajuda? app.esquiloinvest.com.br/ajuda", rodapeLegenda());
  for (let c = 1; c < cols; c++) ws[XLSX.utils.encode_cell({ r, c })] = celVazia(rodapeLegenda());
  merge(ws, r, 0, r, cols - 1);

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r, c: cols - 1 } });
  ws["!cols"] = [{ wch: 10 }, { wch: 28 }, { wch: 48 }, { wch: 20 }];
  setRowHeights(ws, { 0: 12, 1: 18, 2: 36, 3: 20, 4: 10, 5: 16, 6: 24, 7: 8, 8: 32, 9: 22, 10: 32 });
  ocultarGridlines(ws);

  XLSX.utils.book_append_sheet(wb, ws, "📋 Guia");
}

// ─── Construtor genérico de aba de dados ─────────────────────────────────────

interface ColunaDef {
  label: string;
  hint: string;
  obrigatorio?: boolean;
  isPill?: boolean;
  isMoney?: boolean;
  isDate?: boolean;
  placeholder?: string;
  width?: number;
  lista?: string[];
}

function criarAbaDados(
  wb: WorkBook,
  opcoes: {
    nomeAba: string;
    heroLabel: string;
    heroTitulo: string;
    heroSub: string;
    colunas: ColunaDef[];
    exemplos: Array<Array<unknown>>;
    linhasVazias?: number;
  },
): void {
  const ws: WorkSheet = {};
  const cols = opcoes.colunas.length;

  aplicarHero(ws, cols, opcoes.heroLabel, opcoes.heroTitulo, opcoes.heroSub);

  // Linha 5 — espaçador branco
  for (let c = 0; c < cols; c++) ws[XLSX.utils.encode_cell({ r: 5, c })] = celVazia({ fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" } });

  // Linha 6 — cabeçalho da tabela (dark / orange)
  for (let c = 0; c < cols; c++) {
    const col = opcoes.colunas[c];
    const suffix = col.lista && col.lista.length > 0 ? "  ▾" : "";
    ws[XLSX.utils.encode_cell({ r: 6, c })] = cel(col.label + suffix, tabelaHeader(col.obrigatorio));
  }

  // Linha 7 — legenda com hint / valores de lista
  for (let c = 0; c < cols; c++) {
    const col = opcoes.colunas[c];
    const texto =
      col.lista && col.lista.length > 0
        ? `Ex.: ${col.lista.slice(0, 4).join(" · ")}${col.lista.length > 4 ? " · …" : ""}`
        : col.hint;
    ws[XLSX.utils.encode_cell({ r: 7, c })] = cel(texto, legendaHint());
  }

  // Linhas de exemplos
  let r = 8;
  for (let i = 0; i < opcoes.exemplos.length; i++, r++) {
    const par = i % 2 === 1;
    for (let c = 0; c < cols; c++) {
      const col = opcoes.colunas[c];
      const valor = opcoes.exemplos[i][c];
      let estilo: Record<string, unknown>;
      if (col.isPill) estilo = pillTicker(par);
      else if (col.isMoney) estilo = celulaDinheiro(par);
      else if (col.isDate) estilo = celulaData(par);
      else estilo = celulaDado(par);
      ws[XLSX.utils.encode_cell({ r, c })] = cel(
        valor === null || valor === undefined ? "" : valor,
        estilo,
      );
    }
  }

  // Linhas vazias para preenchimento (com placeholders)
  const totalVazias = opcoes.linhasVazias ?? 40;
  for (let i = 0; i < totalVazias; i++, r++) {
    const par = (r - 8) % 2 === 1;
    for (let c = 0; c < cols; c++) {
      const col = opcoes.colunas[c];
      // Placeholder apenas na primeira linha vazia; demais só zebra
      if (i === 0 && col.placeholder) {
        ws[XLSX.utils.encode_cell({ r, c })] = cel(col.placeholder, placeholder(par));
      } else if (col.isMoney) {
        ws[XLSX.utils.encode_cell({ r, c })] = celVazia(celulaDinheiro(par));
      } else if (col.isDate) {
        ws[XLSX.utils.encode_cell({ r, c })] = celVazia(celulaData(par));
      } else {
        ws[XLSX.utils.encode_cell({ r, c })] = celVazia(celulaDado(par));
      }
    }
  }

  // Rodapé com legenda
  for (let c = 0; c < cols; c++) ws[XLSX.utils.encode_cell({ r, c })] = celVazia({ fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" } });
  r++;
  ws[XLSX.utils.encode_cell({ r, c: 0 })] = cel(
    "Cabeçalho laranja = obrigatório   ·   ▾ = use um dos valores listados acima   ·   Valores em BRL   ·   Datas AAAA-MM-DD",
    rodapeLegenda(),
  );
  for (let c = 1; c < cols; c++) ws[XLSX.utils.encode_cell({ r, c })] = celVazia(rodapeLegenda());
  merge(ws, r, 0, r, cols - 1);

  // Data validations (alguns parsers respeitam; os que não, mostram só o hint)
  const dataValidations: Array<Record<string, unknown>> = [];
  for (let c = 0; c < cols; c++) {
    const col = opcoes.colunas[c];
    if (col.lista && col.lista.length > 0) {
      const startRow = 9; // 1-indexed, primeira linha de dados reais (excel row 9 = r idx 8)
      const endRow = 8 + opcoes.exemplos.length + totalVazias;
      const colLetter = XLSX.utils.encode_col(c);
      dataValidations.push({
        sqref: `${colLetter}${startRow}:${colLetter}${endRow}`,
        type: "list",
        formula1: `"${col.lista.join(",")}"`,
        allowBlank: true,
        showErrorMessage: true,
        errorTitle: "Valor fora da lista",
        error: "Use um dos valores listados na linha de legenda.",
      });
    }
  }
  if (dataValidations.length > 0) {
    (ws as unknown as Record<string, unknown>)["!dataValidation"] = dataValidations;
    (ws as unknown as Record<string, unknown>)["!dataValidations"] = dataValidations;
  }

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r, c: cols - 1 } });
  ws["!cols"] = opcoes.colunas.map((col) => ({ wch: col.width ?? 18 }));
  setRowHeights(ws, { 0: 12, 1: 18, 2: 32, 3: 20, 4: 10, 5: 14, 6: 28, 7: 22 });
  ocultarGridlines(ws);

  XLSX.utils.book_append_sheet(wb, ws, opcoes.nomeAba);
}

// ─── Abas específicas ────────────────────────────────────────────────────────

function criarAbaAcoes(wb: WorkBook): void {
  criarAbaDados(wb, {
    nomeAba: "📈 Ações",
    heroLabel: "ESQUILO\\WALLET · AÇÕES · ETFs · FIIs",
    heroTitulo: "Conte pra gente quais ações você tem.",
    heroSub:
      "Ativos listados na B3. Uma linha por ativo. Preencha ticker, quantidade e preço médio — o nome completamos para você no preview.",
    colunas: [
      { label: "Ticker",        hint: "Ex.: PETR4, MXRF11, VALE3",   obrigatorio: true, isPill: true, width: 14, placeholder: "digite o ticker" },
      { label: "Nome do ativo", hint: "Preenchido automaticamente",  width: 30, placeholder: "preenche sozinho" },
      { label: "Quantidade",    hint: "Cotas inteiras ou fracionárias", obrigatorio: true, width: 14, placeholder: "0" },
      { label: "Preço médio",   hint: "R$ por unidade",              isMoney: true, width: 16 },
      { label: "Valor total",   hint: "Alternativa ao preço médio",  isMoney: true, width: 16 },
      { label: "Data compra",   hint: "AAAA-MM-DD",                  isDate: true, width: 14 },
      { label: "Corretora",     hint: "Escolha da lista",            width: 22, lista: LISTA_CORRETORAS },
    ],
    exemplos: [
      ["PETR4",  "Petrobras PN",  100, 34.5, "",     "2026-01-15", "XP Investimentos"],
      ["MXRF11", "Maxi Renda FII", 50, "",    840.0, "2026-02-01", "BTG Pactual"],
      ["VALE3",  "Vale S.A.",      30, 68.2, "",     "2025-12-10", "NuInvest"],
    ],
  });
}

function criarAbaFundos(wb: WorkBook): void {
  criarAbaDados(wb, {
    nomeAba: "🏦 Fundos",
    heroLabel: "ESQUILO\\WALLET · FUNDOS DE INVESTIMENTO",
    heroTitulo: "Registre seus fundos de investimento.",
    heroSub:
      "Use o CNPJ quando possível — é o melhor identificador. Uma linha por fundo. Previdência tem aba própria.",
    colunas: [
      { label: "Nome do fundo", hint: "Nome completo do fundo",     obrigatorio: true, width: 34, placeholder: "digite o nome" },
      { label: "CNPJ",          hint: "00.000.000/0001-00",         width: 22, placeholder: "recomendado" },
      { label: "Tipo / classe", hint: "Escolha da lista",           width: 20, lista: LISTA_TIPO_FUNDO },
      { label: "Instituição",   hint: "Escolha da lista",           obrigatorio: true, width: 22, lista: LISTA_CORRETORAS },
      { label: "Valor aplicado",hint: "R$ total aplicado",          obrigatorio: true, isMoney: true, width: 18 },
      { label: "Data aplicação",hint: "AAAA-MM-DD",                 isDate: true, width: 14 },
    ],
    exemplos: [
      ["CSHG LOGÍSTICA FII",  "11.664.201/0001-77", "FII",         "BTG Pactual",      16805.0, "2026-01-20"],
      ["ITAÚ FLEXPREV PGBL",  "01.452.784/0001-01", "Previdência PGBL", "Itaú",          45000.0, "2024-03-01"],
      ["XP CRÉDITO PRIVADO",  "32.489.238/0001-48", "Renda Fixa",  "XP Investimentos", 22000.0, "2025-06-10"],
    ],
  });
}

function criarAbaRendaFixa(wb: WorkBook): void {
  criarAbaDados(wb, {
    nomeAba: "📄 Renda Fixa",
    heroLabel: "ESQUILO\\WALLET · RENDA FIXA",
    heroTitulo: "CDB, LCI, LCA, Tesouro, Debêntures.",
    heroSub:
      "Indexador + taxa + data de início são essenciais para marcar a mercado. Sem eles, tratamos como custo contábil.",
    colunas: [
      { label: "Nome do título", hint: "Nome que identifica",       obrigatorio: true, width: 32, placeholder: "ex.: CDB Banco Inter" },
      { label: "Instituição",    hint: "Escolha da lista",           obrigatorio: true, width: 22, lista: LISTA_CORRETORAS },
      { label: "Tipo",           hint: "Escolha da lista",           width: 16, lista: LISTA_TIPO_RF },
      { label: "Valor aplicado", hint: "R$ total aplicado",          obrigatorio: true, isMoney: true, width: 18 },
      { label: "Indexador",      hint: "Escolha da lista",           obrigatorio: true, width: 14, lista: LISTA_INDEXADOR },
      { label: "Taxa (%)",       hint: "110 CDI · IPCA+6,5 · …",    obrigatorio: true, width: 12 },
      { label: "Data início",    hint: "AAAA-MM-DD",                 obrigatorio: true, isDate: true, width: 14 },
      { label: "Vencimento",     hint: "AAAA-MM-DD (opcional)",      isDate: true, width: 14 },
    ],
    exemplos: [
      ["CDB Banco Inter",       "Genial",          "CDB",       10000.0, "CDI",  110,  "2025-03-10", "2027-03-10"],
      ["Tesouro IPCA+ 2035",    "XP Investimentos","Tesouro",   25000.0, "IPCA", 6.5,  "2024-07-01", "2035-05-15"],
      ["LCI Bradesco",          "Bradesco",        "LCI",       15000.0, "CDI",  95,   "2025-01-05", "2027-01-05"],
    ],
  });
}

function criarAbaPrevidencia(wb: WorkBook): void {
  criarAbaDados(wb, {
    nomeAba: "🏛️ Previdência",
    heroLabel: "ESQUILO\\WALLET · PREVIDÊNCIA",
    heroTitulo: "PGBL e VGBL — parentes de renda fixa.",
    heroSub:
      "Separamos da Renda Fixa por razão fiscal. Indexador + taxa + data de início continuam obrigatórios.",
    colunas: [
      { label: "Nome do plano", hint: "Nome do plano/fundo",     obrigatorio: true, width: 30, placeholder: "ex.: Itaú Flexprev" },
      { label: "Instituição",   hint: "Escolha da lista",         obrigatorio: true, width: 22, lista: LISTA_CORRETORAS },
      { label: "Tipo",          hint: "PGBL ou VGBL",            obrigatorio: true, width: 12, lista: LISTA_TIPO_PREVIDENCIA },
      { label: "Valor aplicado",hint: "R$ total aplicado",       obrigatorio: true, isMoney: true, width: 18 },
      { label: "Indexador",     hint: "Escolha da lista",         obrigatorio: true, width: 14, lista: LISTA_INDEXADOR },
      { label: "Taxa (%)",      hint: "100 CDI · IPCA+5,5 · …", obrigatorio: true, width: 12 },
      { label: "Data início",   hint: "AAAA-MM-DD",              obrigatorio: true, isDate: true, width: 14 },
      { label: "Vencimento",    hint: "Em branco se sem prazo",   isDate: true, width: 14 },
    ],
    exemplos: [
      ["Itaú Flexprev PGBL", "Itaú", "PGBL", 45000.0, "CDI",  100, "2024-03-01", ""],
      ["XP Seguros VGBL",    "XP Investimentos", "VGBL", 30000.0, "IPCA", 5.5, "2023-06-15", ""],
    ],
  });
}

function criarAbaImoveis(wb: WorkBook): void {
  criarAbaDados(wb, {
    nomeAba: "🏠 Imóveis",
    heroLabel: "ESQUILO\\WALLET · IMÓVEIS",
    heroTitulo: "Residenciais, comerciais, terrenos e rurais.",
    heroSub:
      "Valor estimado = valor de mercado atual. Se financiado, preencha também o saldo devedor.",
    colunas: [
      { label: "Descrição",      hint: "Nome ou endereço curto",          obrigatorio: true, width: 34, placeholder: "ex.: Ap SP - Pinheiros" },
      { label: "Tipo",           hint: "Escolha da lista",                 obrigatorio: true, width: 18, lista: LISTA_TIPO_IMOVEL },
      { label: "Valor estimado", hint: "R$ — valor de mercado",            obrigatorio: true, isMoney: true, width: 20 },
      { label: "Saldo devedor",  hint: "R$ — se financiado",               isMoney: true, width: 18 },
      { label: "Finalidade",     hint: "Escolha da lista",                 width: 18, lista: LISTA_FINALIDADE_IMOVEL },
      { label: "Participação %", hint: "0–100 (100 se único dono)",        width: 16 },
    ],
    exemplos: [
      ["Apartamento SP - Pinheiros", "Residencial", 850000.0, 120000.0, "Moradia",  100],
      ["Sala Comercial - Centro RJ", "Comercial",   320000.0, 0,        "Aluguel",  50],
      ["Terreno - Campinas",         "Terreno",     180000.0, "",       "Outros",   100],
    ],
  });
}

function criarAbaVeiculos(wb: WorkBook): void {
  criarAbaDados(wb, {
    nomeAba: "🚗 Veículos",
    heroLabel: "ESQUILO\\WALLET · VEÍCULOS",
    heroTitulo: "Carros, motos, caminhões.",
    heroSub:
      "Use o valor de tabela FIPE como referência de mercado. Consulte em fipe.org.br.",
    colunas: [
      { label: "Tipo",         hint: "Escolha da lista",   obrigatorio: true, width: 14, lista: LISTA_TIPO_VEICULO },
      { label: "Montadora",    hint: "Ex.: Toyota",        obrigatorio: true, width: 18, placeholder: "ex.: Toyota" },
      { label: "Modelo",       hint: "Ex.: Corolla XEi",   obrigatorio: true, width: 22, placeholder: "ex.: Corolla XEi" },
      { label: "Ano",          hint: "Ano do modelo",      obrigatorio: true, width: 10, placeholder: "2024" },
      { label: "Valor FIPE",   hint: "R$ — referência",    obrigatorio: true, isMoney: true, width: 20 },
      { label: "Saldo devedor",hint: "R$ — se financiado", isMoney: true, width: 18 },
    ],
    exemplos: [
      ["Carro", "Toyota", "Corolla XEi", 2023, 118000.0, 45000.0],
      ["Moto",  "Honda",  "CB 500F",     2022, 32000.0,  0],
    ],
  });
}

function criarAbaPoupanca(wb: WorkBook): void {
  criarAbaDados(wb, {
    nomeAba: "💰 Poupança",
    heroLabel: "ESQUILO\\WALLET · POUPANÇA",
    heroTitulo: "Saldos em caderneta.",
    heroSub:
      "Uma linha por banco / conta. Inclui poupança em bancos digitais.",
    colunas: [
      { label: "Instituição",     hint: "Escolha da lista",               obrigatorio: true, width: 24, lista: LISTA_CORRETORAS },
      { label: "Valor atual",     hint: "R$ — saldo atual",                obrigatorio: true, isMoney: true, width: 18 },
      { label: "Titularidade",    hint: "Ex.: Conta conjunta · opcional",  width: 30, placeholder: "opcional" },
    ],
    exemplos: [
      ["Bradesco", 8500.0, "Conta individual"],
      ["Itaú",     1200.0, ""],
      ["Santander",3800.0, "Conta conjunta"],
    ],
  });
}

// ─── Geração e download ─────────────────────────────────────────────────────

export async function gerarTemplateXlsx(): Promise<ArrayBuffer> {
  await loadXLSX();

  const wb = XLSX.utils.book_new();

  criarAbaGuia(wb);
  criarAbaAcoes(wb);
  criarAbaFundos(wb);
  criarAbaRendaFixa(wb);
  criarAbaPrevidencia(wb);
  criarAbaImoveis(wb);
  criarAbaVeiculos(wb);
  criarAbaPoupanca(wb);

  return XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
}

export async function baixarTemplateXlsx(): Promise<void> {
  const buffer = await gerarTemplateXlsx();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "esquilo-wallet-importacao-patrimonio.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Mantém compatibilidade com import legado
export function baixarTemplateImportacaoCsv(): void {
  const TEMPLATE_CONTENT = [
    "data,ticker,nome,categoria,plataforma,quantidade,valor",
    "2026-01-15,PETR4,PETROBRAS PN,acao,XP Investimentos,100,3450.00",
    "2026-01-20,HGLG11,CSHG LOGISTICA,fundo,BTG Pactual,10,1680.50",
  ].join("\n");

  const blob = new Blob([`\uFEFF${TEMPLATE_CONTENT}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "template-importacao-esquilo-legado.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
