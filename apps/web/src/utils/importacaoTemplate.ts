import type { CellObject, WorkBook, WorkSheet } from "xlsx";

// ─── Lazy loader — xlsx (~300KB) só carrega quando a função for chamada ────────

// biome-ignore lint/suspicious/noExplicitAny: variável de runtime carregada dinamicamente
let XLSX: typeof import("xlsx") = null as any;

async function loadXLSX(): Promise<void> {
  if (!XLSX) {
    XLSX = await import("xlsx");
  }
}

// ─── Paleta Esquilo ───────────────────────────────────────────────────────────
const COR_LARANJA = "F56A2A";
const COR_ESCURO = "0B1218";
const COR_BORDA = "EFE7DC";
const COR_FUNDO_CINZA = "FAFAFA";
const COR_VERDE = "6FCF97";
const COR_AMARELO = "F2C94C";
const COR_VERMELHO = "E85C5C";
const COR_BRANCO = "FFFFFF";

// ─── Helpers de estilo ───────────────────────────────────────────────────────

function estiloCabecalho(corFundo = COR_ESCURO): Record<string, unknown> {
  return {
    font: { bold: true, color: { rgb: COR_BRANCO }, sz: 10, name: "Inter" },
    fill: { fgColor: { rgb: corFundo }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: bordaFina(),
  };
}

function estiloObrigatorio(): Record<string, unknown> {
  return {
    font: { bold: true, color: { rgb: COR_ESCURO }, sz: 10, name: "Inter" },
    fill: { fgColor: { rgb: "FFF3EC" }, patternType: "solid" },
    alignment: { horizontal: "left", vertical: "center" },
    border: { ...bordaFina(), left: { style: "thick", color: { rgb: COR_LARANJA } } },
  };
}

function estiloOpcional(): Record<string, unknown> {
  return {
    font: { color: { rgb: "666666" }, sz: 10, name: "Inter" },
    fill: { fgColor: { rgb: COR_FUNDO_CINZA }, patternType: "solid" },
    alignment: { horizontal: "left", vertical: "center" },
    border: bordaFina(),
  };
}

function estiloExemplo(): Record<string, unknown> {
  return {
    font: { color: { rgb: "888888" }, sz: 10, name: "Inter", italic: true },
    fill: { fgColor: { rgb: COR_BRANCO }, patternType: "solid" },
    alignment: { horizontal: "left", vertical: "center" },
    border: bordaFina(),
  };
}

function estiloTitulo(): Record<string, unknown> {
  return {
    font: { bold: true, sz: 16, color: { rgb: COR_LARANJA }, name: "Sora" },
    alignment: { horizontal: "left", vertical: "center" },
  };
}

function estiloSubtitulo(): Record<string, unknown> {
  return {
    font: { bold: true, sz: 11, color: { rgb: COR_ESCURO }, name: "Inter" },
    alignment: { horizontal: "left", vertical: "center" },
  };
}

function estiloTexto(): Record<string, unknown> {
  return {
    font: { sz: 10, color: { rgb: "444444" }, name: "Inter" },
    alignment: { horizontal: "left", vertical: "top", wrapText: true },
  };
}

function estiloDestaque(cor: string): Record<string, unknown> {
  return {
    font: { bold: true, sz: 10, color: { rgb: COR_BRANCO }, name: "Inter" },
    fill: { fgColor: { rgb: cor }, patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center" },
  };
}

function bordaFina() {
  const b = { style: "thin" as const, color: { rgb: COR_BORDA } };
  return { top: b, bottom: b, left: b, right: b };
}

function cel(v: unknown, s?): CellObject {
  return { v, t: typeof v === "number" ? "n" : "s", s } as CellObject;
}

function celVazia(s?): CellObject {
  return { v: "", t: "s", s } as CellObject;
}

// ─── Aba Guia / Instruções ────────────────────────────────────────────────────

function criarAbaGuia(wb: WorkBook): void {
  const ws: WorkSheet = {};

  const linhas: [number, number, unknown, Record<string, unknown>?][] = [
    [0, 0, "🐿 Esquilo Invest", estiloTitulo()],
    [1, 0, "Modelo de Importação de Patrimônio · v2", estiloSubtitulo()],
    [2, 0, ""],
    [3, 0, "COMO USAR ESTE ARQUIVO", estiloDestaque(COR_LARANJA)],
    [4, 0, ""],
    [5, 0, "Este arquivo possui 5 abas de preenchimento, uma para cada tipo de patrimônio suportado.", estiloTexto()],
    [6, 0, "Preencha apenas as abas que se aplicam à sua situação. As demais podem ficar vazias.", estiloTexto()],
    [7, 0, "Não altere os cabeçalhos das colunas — isso quebrará a importação.", estiloTexto()],
    [8, 0, "Após preencher, salve o arquivo como .xlsx e faça o upload na plataforma Esquilo.", estiloTexto()],
    [9, 0, ""],
    [10, 0, "ABAS DISPONÍVEIS", estiloDestaque(COR_ESCURO)],
    [11, 0, ""],
    [12, 0, "📈  Ações", estiloSubtitulo()],
    [13, 0, "Para ações listadas na B3 (ex.: PETR4, VALE3, MXRF11). Inclui ETFs e FIIs.", estiloTexto()],
    [14, 0, ""],
    [15, 0, "🏦  Fundos", estiloSubtitulo()],
    [16, 0, "Para fundos de investimento, previdência e renda fixa. Pode usar CNPJ ou nome do fundo.", estiloTexto()],
    [17, 0, ""],
    [18, 0, "🏠  Imóveis", estiloSubtitulo()],
    [19, 0, "Para imóveis residenciais, comerciais, terrenos e rurais.", estiloTexto()],
    [20, 0, ""],
    [21, 0, "🚗  Veículos", estiloSubtitulo()],
    [22, 0, "Para carros, motos, caminhões e outros veículos. Use o valor de tabela FIPE como referência.", estiloTexto()],
    [23, 0, ""],
    [24, 0, "💰  Poupança", estiloSubtitulo()],
    [25, 0, "Para saldos em poupança. Uma linha por banco/conta.", estiloTexto()],
    [26, 0, ""],
    [27, 0, "LEGENDA DOS CAMPOS", estiloDestaque(COR_LARANJA)],
    [28, 0, ""],
    [29, 0, "Campo obrigatório", estiloObrigatorio()],
    [30, 0, "Campo opcional", estiloOpcional()],
    [31, 0, ""],
    [32, 0, "FORMATAÇÃO", estiloDestaque(COR_ESCURO)],
    [33, 0, ""],
    [34, 0, "Valores monetários: use números sem R$ (ex.: 35000.00 ou 35000,00)", estiloTexto()],
    [35, 0, "Datas: use o formato AAAA-MM-DD (ex.: 2026-01-15)", estiloTexto()],
    [36, 0, "CNPJ: pode ser formatado (00.000.000/0001-00) ou apenas dígitos (00000000000100)", estiloTexto()],
    [37, 0, "Percentual de participação: de 0 a 100 (ex.: 50 para 50%)", estiloTexto()],
    [38, 0, ""],
    [39, 0, "TRATAMENTO DE DUPLICIDADE", estiloDestaque(COR_ESCURO)],
    [40, 0, ""],
    [41, 0, "Se um item já existir na sua carteira, ele será marcado como 'conflito' no preview.", estiloTexto()],
    [42, 0, "Você pode optar por ignorá-lo ou sobrescrevê-lo antes de confirmar.", estiloTexto()],
    [43, 0, ""],
    [44, 0, "Critério de identificação por tipo:", estiloSubtitulo()],
    [45, 0, "  • Ação: ticker (ex.: PETR4)", estiloTexto()],
    [46, 0, "  • Fundo: CNPJ (preferencial) ou nome do fundo", estiloTexto()],
    [47, 0, "  • Imóvel: nome/descrição", estiloTexto()],
    [48, 0, "  • Veículo: montadora + modelo + ano", estiloTexto()],
    [49, 0, "  • Poupança: instituição financeira", estiloTexto()],
    [50, 0, ""],
    [51, 0, "SUPORTE", estiloDestaque(COR_LARANJA)],
    [52, 0, ""],
    [53, 0, "Em caso de dúvida, acesse app.esquiloinvest.com.br/ajuda", estiloTexto()],
  ];

  for (const [r, c, v, s] of linhas) {
    const addr = XLSX.utils.encode_cell({ r, c });
    ws[addr] = cel(v, s);
  }

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 53, c: 3 } });
  ws["!cols"] = [{ wch: 80 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
  ws["!rows"] = [{ hpt: 28 }, { hpt: 20 }];

  XLSX.utils.book_append_sheet(wb, ws, "📋 Guia");
}

// ─── Aba Ações ────────────────────────────────────────────────────────────────

function criarAbaAcoes(wb: WorkBook): void {
  const ws: WorkSheet = {};

  // Header instrucional
  ws[XLSX.utils.encode_cell({ r: 0, c: 0 })] = cel(
    "📈 AÇÕES — Ativos listados na B3 (ações, ETFs, FIIs)",
    estiloDestaque(COR_LARANJA),
  );
  ws[XLSX.utils.encode_cell({ r: 1, c: 0 })] = cel(
    "Preencha uma linha por ativo. Campos obrigatórios: Ticker, Quantidade, Preço Médio OU Valor Total.",
    estiloTexto(),
  );
  ws[XLSX.utils.encode_cell({ r: 2, c: 0 })] = celVazia();

  // Cabeçalhos — linha 3 (índice 3)
  const cabecalhos = [
    { label: "Ticker *", obrigatorio: true },
    { label: "Nome do Ativo", obrigatorio: false },
    { label: "Quantidade *", obrigatorio: true },
    { label: "Preço Médio (R$)", obrigatorio: false },
    { label: "Valor Total (R$)", obrigatorio: false },
    { label: "Data da Compra", obrigatorio: false },
    { label: "Corretora / Plataforma", obrigatorio: false },
  ];

  for (let c = 0; c < cabecalhos.length; c++) {
    const { label, obrigatorio } = cabecalhos[c];
    ws[XLSX.utils.encode_cell({ r: 3, c })] = cel(
      label,
      estiloCabecalho(obrigatorio ? COR_LARANJA : COR_ESCURO),
    );
  }

  // Linha de legenda (tipos de dado)
  const legendas = ["Texto (ex.: PETR4)", "Texto livre", "Número inteiro ou decimal", "R$ por unidade", "R$ total investido", "AAAA-MM-DD", "Texto livre"];
  for (let c = 0; c < legendas.length; c++) {
    ws[XLSX.utils.encode_cell({ r: 4, c })] = cel(legendas[c], estiloOpcional());
  }

  // Exemplos (linhas 5 e 6)
  const exemplos = [
    ["PETR4", "PETROBRAS PN", 100, 34.50, "", "2026-01-15", "XP Investimentos"],
    ["MXRF11", "MAXI RENDA FII", 50, "", 840.00, "2026-02-01", "BTG Pactual"],
    ["VALE3", "VALE S.A.", 30, 68.20, "", "2025-12-10", "NuInvest"],
  ];

  for (let i = 0; i < exemplos.length; i++) {
    for (let c = 0; c < exemplos[i].length; c++) {
      ws[XLSX.utils.encode_cell({ r: 5 + i, c })] = cel(exemplos[i][c] || "", estiloExemplo());
    }
  }

  // Linhas de preenchimento (8–57)
  for (let r = 8; r < 58; r++) {
    for (let c = 0; c < cabecalhos.length; c++) {
      ws[XLSX.utils.encode_cell({ r, c })] = celVazia(c < 3 ? estiloObrigatorio() : estiloOpcional());
    }
  }

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 57, c: 6 } });
  ws["!cols"] = [{ wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 24 }];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "📈 Ações");
}

// ─── Aba Fundos ───────────────────────────────────────────────────────────────

function criarAbaFundos(wb: WorkBook): void {
  const ws: WorkSheet = {};

  ws[XLSX.utils.encode_cell({ r: 0, c: 0 })] = cel(
    "🏦 FUNDOS — Fundos de investimento, previdência e renda fixa",
    estiloDestaque(COR_LARANJA),
  );
  ws[XLSX.utils.encode_cell({ r: 1, c: 0 })] = cel(
    "Preencha uma linha por fundo. Use o CNPJ quando disponível para melhor identificação.",
    estiloTexto(),
  );
  ws[XLSX.utils.encode_cell({ r: 2, c: 0 })] = celVazia();

  const cabecalhos = [
    { label: "Nome do Fundo *", obrigatorio: true },
    { label: "CNPJ (recomendado)", obrigatorio: false },
    { label: "Tipo / Classe", obrigatorio: false },
    { label: "Instituição / Plataforma *", obrigatorio: true },
    { label: "Valor Aplicado (R$) *", obrigatorio: true },
    { label: "Data da Aplicação", obrigatorio: false },
  ];

  for (let c = 0; c < cabecalhos.length; c++) {
    const { label, obrigatorio } = cabecalhos[c];
    ws[XLSX.utils.encode_cell({ r: 3, c })] = cel(label, estiloCabecalho(obrigatorio ? COR_LARANJA : COR_ESCURO));
  }

  const legendas = ["Nome completo do fundo", "00.000.000/0001-00", "Multimercado, Renda Fixa, Previdência...", "Banco / corretora", "R$ total aplicado", "AAAA-MM-DD"];
  for (let c = 0; c < legendas.length; c++) {
    ws[XLSX.utils.encode_cell({ r: 4, c })] = cel(legendas[c], estiloOpcional());
  }

  const exemplos = [
    ["CSHG LOGÍSTICA FII", "11.664.201/0001-77", "FII", "BTG Pactual", 16805.00, "2026-01-20"],
    ["ITAÚ FLEXPREV PGBL", "01.452.784/0001-01", "Previdência", "Itaú", 45000.00, "2024-03-01"],
    ["XP CRÉDITO PRIVADO", "32.489.238/0001-48", "Renda Fixa", "XP Investimentos", 22000.00, "2025-06-10"],
  ];

  for (let i = 0; i < exemplos.length; i++) {
    for (let c = 0; c < exemplos[i].length; c++) {
      ws[XLSX.utils.encode_cell({ r: 5 + i, c })] = cel(exemplos[i][c] || "", estiloExemplo());
    }
  }

  for (let r = 8; r < 58; r++) {
    for (let c = 0; c < cabecalhos.length; c++) {
      ws[XLSX.utils.encode_cell({ r, c })] = celVazia(
        [0, 3, 4].includes(c) ? estiloObrigatorio() : estiloOpcional(),
      );
    }
  }

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 57, c: 5 } });
  ws["!cols"] = [{ wch: 36 }, { wch: 22 }, { wch: 20 }, { wch: 24 }, { wch: 18 }, { wch: 14 }];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "🏦 Fundos");
}

// ─── Aba Imóveis ──────────────────────────────────────────────────────────────

function criarAbaImoveis(wb: WorkBook): void {
  const ws: WorkSheet = {};

  ws[XLSX.utils.encode_cell({ r: 0, c: 0 })] = cel(
    "🏠 IMÓVEIS — Residenciais, comerciais, terrenos e rurais",
    estiloDestaque(COR_LARANJA),
  );
  ws[XLSX.utils.encode_cell({ r: 1, c: 0 })] = cel(
    "Preencha uma linha por imóvel. Tipos aceitos: Residencial, Comercial, Terreno, Rural, Outros.",
    estiloTexto(),
  );
  ws[XLSX.utils.encode_cell({ r: 2, c: 0 })] = celVazia();

  const cabecalhos = [
    { label: "Descrição / Nome *", obrigatorio: true },
    { label: "Tipo *", obrigatorio: true },
    { label: "Valor Estimado (R$) *", obrigatorio: true },
    { label: "Saldo Devedor (R$)", obrigatorio: false },
    { label: "Finalidade", obrigatorio: false },
    { label: "Participação (%)", obrigatorio: false },
  ];

  for (let c = 0; c < cabecalhos.length; c++) {
    const { label, obrigatorio } = cabecalhos[c];
    ws[XLSX.utils.encode_cell({ r: 3, c })] = cel(label, estiloCabecalho(obrigatorio ? COR_LARANJA : COR_ESCURO));
  }

  const legendas = ["Nome ou endereço", "Residencial / Comercial / Terreno / Rural / Outros", "Valor de mercado atual (R$)", "Se financiado (R$)", "Moradia / Aluguel / Lazer / Outros", "0–100 (deixe 100 se for único proprietário)"];
  for (let c = 0; c < legendas.length; c++) {
    ws[XLSX.utils.encode_cell({ r: 4, c })] = cel(legendas[c], estiloOpcional());
  }

  const exemplos = [
    ["Apartamento SP - Pinheiros", "Residencial", 850000.00, 120000.00, "Moradia", 100],
    ["Sala Comercial - Centro RJ", "Comercial", 320000.00, 0, "Aluguel", 50],
    ["Terreno - Campinas", "Terreno", 180000.00, "", "Outros", 100],
  ];

  for (let i = 0; i < exemplos.length; i++) {
    for (let c = 0; c < exemplos[i].length; c++) {
      ws[XLSX.utils.encode_cell({ r: 5 + i, c })] = cel(exemplos[i][c] === "" ? "" : exemplos[i][c], estiloExemplo());
    }
  }

  for (let r = 8; r < 58; r++) {
    for (let c = 0; c < cabecalhos.length; c++) {
      ws[XLSX.utils.encode_cell({ r, c })] = celVazia(c < 3 ? estiloObrigatorio() : estiloOpcional());
    }
  }

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 57, c: 5 } });
  ws["!cols"] = [{ wch: 34 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 16 }];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "🏠 Imóveis");
}

// ─── Aba Veículos ─────────────────────────────────────────────────────────────

function criarAbaVeiculos(wb: WorkBook): void {
  const ws: WorkSheet = {};

  ws[XLSX.utils.encode_cell({ r: 0, c: 0 })] = cel(
    "🚗 VEÍCULOS — Carros, motos, caminhões e outros",
    estiloDestaque(COR_LARANJA),
  );
  ws[XLSX.utils.encode_cell({ r: 1, c: 0 })] = cel(
    "Preencha uma linha por veículo. Use o valor de tabela FIPE como referência de mercado.",
    estiloTexto(),
  );
  ws[XLSX.utils.encode_cell({ r: 2, c: 0 })] = celVazia();

  const cabecalhos = [
    { label: "Tipo *", obrigatorio: true },
    { label: "Montadora *", obrigatorio: true },
    { label: "Modelo *", obrigatorio: true },
    { label: "Ano do Modelo *", obrigatorio: true },
    { label: "Valor FIPE / Referência (R$) *", obrigatorio: true },
    { label: "Saldo Devedor (R$)", obrigatorio: false },
  ];

  for (let c = 0; c < cabecalhos.length; c++) {
    const { label, obrigatorio } = cabecalhos[c];
    ws[XLSX.utils.encode_cell({ r: 3, c })] = cel(label, estiloCabecalho(obrigatorio ? COR_LARANJA : COR_ESCURO));
  }

  const legendas = ["Carro / Moto / Caminhão / Outro", "Ex.: Toyota", "Ex.: Corolla", "Ano (ex.: 2023)", "Consulte fipe.org.br (R$)", "Se financiado (R$)"];
  for (let c = 0; c < legendas.length; c++) {
    ws[XLSX.utils.encode_cell({ r: 4, c })] = cel(legendas[c], estiloOpcional());
  }

  const exemplos = [
    ["Carro", "Toyota", "Corolla XEi", 2023, 118000.00, 45000.00],
    ["Moto", "Honda", "CB 500F", 2022, 32000.00, 0],
  ];

  for (let i = 0; i < exemplos.length; i++) {
    for (let c = 0; c < exemplos[i].length; c++) {
      ws[XLSX.utils.encode_cell({ r: 5 + i, c })] = cel(exemplos[i][c], estiloExemplo());
    }
  }

  for (let r = 7; r < 57; r++) {
    for (let c = 0; c < cabecalhos.length; c++) {
      ws[XLSX.utils.encode_cell({ r, c })] = celVazia(c < 5 ? estiloObrigatorio() : estiloOpcional());
    }
  }

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 56, c: 5 } });
  ws["!cols"] = [{ wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 24 }, { wch: 18 }];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "🚗 Veículos");
}

// ─── Aba Poupança ─────────────────────────────────────────────────────────────

function criarAbaPoupanca(wb: WorkBook): void {
  const ws: WorkSheet = {};

  ws[XLSX.utils.encode_cell({ r: 0, c: 0 })] = cel(
    "💰 POUPANÇA — Saldos em caderneta de poupança",
    estiloDestaque(COR_LARANJA),
  );
  ws[XLSX.utils.encode_cell({ r: 1, c: 0 })] = cel(
    "Preencha uma linha por banco / conta poupança. Inclui poupança em bancos digitais.",
    estiloTexto(),
  );
  ws[XLSX.utils.encode_cell({ r: 2, c: 0 })] = celVazia();

  const cabecalhos = [
    { label: "Instituição *", obrigatorio: true },
    { label: "Valor Atual (R$) *", obrigatorio: true },
    { label: "Titularidade / Observação", obrigatorio: false },
  ];

  for (let c = 0; c < cabecalhos.length; c++) {
    const { label, obrigatorio } = cabecalhos[c];
    ws[XLSX.utils.encode_cell({ r: 3, c })] = cel(label, estiloCabecalho(obrigatorio ? COR_LARANJA : COR_ESCURO));
  }

  const legendas = ["Nome do banco / instituição", "Saldo atual (R$)", "Ex.: Conta conjunta, Conta filho"];
  for (let c = 0; c < legendas.length; c++) {
    ws[XLSX.utils.encode_cell({ r: 4, c })] = cel(legendas[c], estiloOpcional());
  }

  const exemplos = [
    ["Caixa Econômica Federal", 8500.00, "Conta individual"],
    ["Nubank", 1200.00, ""],
    ["Bradesco", 3800.00, "Conta conjunta"],
  ];

  for (let i = 0; i < exemplos.length; i++) {
    for (let c = 0; c < exemplos[i].length; c++) {
      ws[XLSX.utils.encode_cell({ r: 5 + i, c })] = cel(exemplos[i][c], estiloExemplo());
    }
  }

  for (let r = 8; r < 58; r++) {
    for (let c = 0; c < cabecalhos.length; c++) {
      ws[XLSX.utils.encode_cell({ r, c })] = celVazia(c < 2 ? estiloObrigatorio() : estiloOpcional());
    }
  }

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 57, c: 2 } });
  ws["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 30 }];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "💰 Poupança");
}

// ─── Geração e download do template ──────────────────────────────────────────

export async function gerarTemplateXlsx(): Promise<ArrayBuffer> {
  await loadXLSX();

  const wb = XLSX.utils.book_new();

  criarAbaGuia(wb);
  criarAbaAcoes(wb);
  criarAbaFundos(wb);
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
  link.download = "esquilo-invest-importacao-patrimonio.xlsx";
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
