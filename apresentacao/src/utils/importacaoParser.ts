import type { WorkSheet } from "xlsx";

type AbaImportacao = "acoes" | "fundos" | "previdencia" | "renda_fixa" | "poupanca" | "imoveis" | "veiculos";
type IndexadorRendaFixa = string;
type ItemAcaoBruto = Record<string, unknown>;
type ItemFundoBruto = Record<string, unknown>;
type ItemImovelBruto = Record<string, unknown>;
type ItemPatrimonioBruto = Record<string, unknown>;
type ItemPoupancaBruto = Record<string, unknown>;
type ItemPrevidenciaBruto = Record<string, unknown>;
type ItemRendaFixaBruto = Record<string, unknown>;
type ItemVeiculoBruto = Record<string, unknown>;

// ─── Lazy loader — xlsx (~300KB) só carrega quando o parse for chamado ────────

// biome-ignore lint/suspicious/noExplicitAny: variável de runtime carregada dinamicamente
let XLSX: typeof import("xlsx") = null as any;

async function loadXLSX(): Promise<void> {
  if (!XLSX) {
    XLSX = await import("xlsx");
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toStr(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function toNum(v: unknown): number {
  if (v == null || v === "") return 0;
  const s = String(v).replace(/[R$\s]/g, "").replace(",", ".");
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function toInt(v: unknown): number {
  return Math.round(toNum(v));
}

function toDate(v: unknown): string | undefined {
  if (!v) return undefined;
  // Pode vir como número serial do Excel (dias desde 1900-01-01)
  if (typeof v === "number") {
    try {
      const d = XLSX.SSF.parse_date_code(v);
      if (d) {
        const mm = String(d.m).padStart(2, "0");
        const dd = String(d.d).padStart(2, "0");
        return `${d.y}-${mm}-${dd}`;
      }
    } catch {
      return undefined;
    }
  }
  const s = toStr(v);
  if (!s) return undefined;
  // Já está no formato AAAA-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Tenta DD/MM/AAAA
  const ddmmyyyy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  return undefined;
}

// ─── Mapeamento de nome de aba para tipo ─────────────────────────────────────

const ABA_MAP: Record<string, AbaImportacao> = {
  "ações": "acoes",
  "acoes": "acoes",
  "acão": "acoes",
  "acao": "acoes",
  "📈 ações": "acoes",
  "fundos": "fundos",
  "fundo": "fundos",
  "🏦 fundos": "fundos",
  "renda fixa": "renda_fixa",
  "renda_fixa": "renda_fixa",
  "rendafixa": "renda_fixa",
  "📄 renda fixa": "renda_fixa",
  "previdência": "previdencia",
  "previdencia": "previdencia",
  "🏛️ previdência": "previdencia",
  "imóveis": "imoveis",
  "imoveis": "imoveis",
  "imóvel": "imoveis",
  "imovel": "imoveis",
  "🏠 imóveis": "imoveis",
  "veículos": "veiculos",
  "veiculos": "veiculos",
  "veículo": "veiculos",
  "veiculo": "veiculos",
  "🚗 veículos": "veiculos",
  "poupança": "poupanca",
  "poupanca": "poupanca",
  "💰 poupança": "poupanca",
};

function identificarAba(nomeAba: string): AbaImportacao | null {
  const chave = nomeAba.toLowerCase().trim();
  return ABA_MAP[chave] ?? null;
}

// ─── Parsers por tipo ─────────────────────────────────────────────────────────

function parseAcoes(rows: Record<string, unknown>[], abaNome: string): ItemAcaoBruto[] {
  return rows
    .filter((row) => toStr(row["Ticker *"] || row["ticker"] || row["TICKER"]))
    .map((row, i) => {
      const ticker = toStr(row["Ticker *"] || row["ticker"] || row["TICKER"] || "").toUpperCase();
      const quantidade = toNum(row["Quantidade *"] || row["quantidade"] || row["QUANTIDADE"]);
      const precoMedio = toNum(row["Preço Médio (R$)"] || row["Preço Médio"] || row["preco_medio"] || row["preco médio"] || 0);
      const valorTotal = toNum(row["Valor Total (R$)"] || row["Valor Total"] || row["valor_total"] || row["valor total"] || 0);
      const nome = toStr(row["Nome do Ativo"] || row["nome"] || row["NOME"] || "");
      const plataforma = toStr(row["Corretora / Plataforma"] || row["plataforma"] || row["corretora"] || "");
      const dataCompra = toDate(row["Data da Compra"] || row["data"] || row["data_compra"]);

      return {
        aba: "acoes" as const,
        linha: i + 1,
        ticker,
        nome: nome || ticker,
        quantidade,
        precoMedio: precoMedio || undefined,
        valorTotal: valorTotal || undefined,
        dataCompra,
        plataforma: plataforma || undefined,
      };
    })
    .filter((item) => item.ticker);
}

function parseFundos(rows: Record<string, unknown>[], abaNome: string): ItemFundoBruto[] {
  return rows
    .filter((row) => toStr(row["Nome do Fundo *"] || row["nome"] || row["NOME"]))
    .map((row, i) => {
      const nome = toStr(row["Nome do Fundo *"] || row["nome"] || row["NOME"]);
      const cnpj = toStr(row["CNPJ (recomendado)"] || row["cnpj"] || row["CNPJ"] || "");
      const tipo = toStr(row["Tipo / Classe"] || row["tipo"] || row["classe"] || "");
      const instituicao = toStr(row["Instituição / Plataforma *"] || row["instituicao"] || row["plataforma"] || "");
      const valorAplicado = toNum(row["Valor Aplicado (R$) *"] || row["valor"] || row["valor_aplicado"] || 0);
      const dataAplicacao = toDate(row["Data da Aplicação"] || row["data"] || row["data_aplicacao"]);

      return {
        aba: "fundos" as const,
        linha: i + 1,
        nome,
        cnpj: cnpj || undefined,
        tipo: tipo || undefined,
        instituicao,
        valorAplicado,
        dataAplicacao,
      };
    })
    .filter((item) => item.nome);
}

function normalizarIndexador(v: unknown): IndexadorRendaFixa | null {
  const s = toStr(v).toUpperCase().replace(/[^A-Z]/g, "");
  if (!s) return null;
  if (s.startsWith("CDI")) return "CDI";
  if (s.startsWith("IPCA")) return "IPCA";
  if (s.startsWith("SELIC")) return "SELIC";
  if (s.startsWith("IGPM")) return "IGPM";
  if (s.includes("PRE") || s.includes("PREFIX")) return "PRE";
  return null;
}

function parseRendaFixaOuPrevidencia<T extends "renda_fixa" | "previdencia">(
  rows: Record<string, unknown>[],
  aba: T,
): (T extends "renda_fixa" ? ItemRendaFixaBruto : ItemPrevidenciaBruto)[] {
  return rows
    .filter((row) => toStr(row["Nome *"] || row["Nome do Título *"] || row["Nome"] || row["nome"]))
    .map((row, i) => {
      const nome = toStr(row["Nome *"] || row["Nome do Título *"] || row["Nome"] || row["nome"]);
      const instituicao = toStr(
        row["Instituição *"] || row["Instituição / Emissor *"] || row["instituicao"] || "",
      );
      const tipo = toStr(row["Tipo"] || row["Tipo / Classe"] || row["tipo"] || "");
      const valorAplicado = toNum(
        row["Valor Aplicado (R$) *"] || row["Valor Aplicado"] || row["valor_aplicado"] || row["valor"] || 0,
      );
      const indexadorRaw = row["Indexador *"] || row["Indexador"] || row["indexador"];
      const indexador = normalizarIndexador(indexadorRaw);
      const taxa = toNum(row["Taxa (%)"] || row["Taxa *"] || row["Taxa"] || row["taxa"] || 0);
      const dataInicio = toDate(
        row["Data Início *"] || row["Data de Início"] || row["data_inicio"] || row["data_aplicacao"],
      );
      const vencimento = toDate(row["Vencimento"] || row["vencimento"] || row["data_vencimento"]);

      return {
        aba,
        linha: i + 1,
        nome,
        instituicao,
        tipo: tipo || undefined,
        valorAplicado,
        indexador: (indexador ?? "") as IndexadorRendaFixa,
        taxa,
        dataInicio: dataInicio ?? "",
        vencimento: vencimento || undefined,
      } as unknown as T extends "renda_fixa" ? ItemRendaFixaBruto : ItemPrevidenciaBruto;
    })
    .filter((item) => Boolean(item.nome));
}

function parseImoveis(rows: Record<string, unknown>[]): ItemImovelBruto[] {
  return rows
    .filter((row) => toStr(row["Descrição / Nome *"] || row["descricao"] || row["nome"]))
    .map((row, i) => {
      const descricao = toStr(row["Descrição / Nome *"] || row["descricao"] || row["nome"]);
      const tipo = toStr(row["Tipo *"] || row["tipo"] || "");
      const valorEstimado = toNum(row["Valor Estimado (R$) *"] || row["valor"] || row["valor_estimado"] || 0);
      const saldoDevedor = toNum(row["Saldo Devedor (R$)"] || row["saldo_devedor"] || 0);
      const finalidade = toStr(row["Finalidade"] || row["finalidade"] || "");
      const participacao = toNum(row["Participação (%)"] || row["participacao"] || 100);

      return {
        aba: "imoveis" as const,
        linha: i + 1,
        descricao,
        tipo,
        valorEstimado,
        saldoDevedor: saldoDevedor > 0 ? saldoDevedor : undefined,
        finalidade: finalidade || undefined,
        participacaoPercentual: participacao || 100,
      };
    })
    .filter((item) => item.descricao);
}

function parseVeiculos(rows: Record<string, unknown>[]): ItemVeiculoBruto[] {
  return rows
    .filter((row) => toStr(row["Montadora *"] || row["montadora"]))
    .map((row, i) => {
      const tipo = toStr(row["Tipo *"] || row["tipo"] || "Carro");
      const montadora = toStr(row["Montadora *"] || row["montadora"] || "");
      const modelo = toStr(row["Modelo *"] || row["modelo"] || "");
      const anoModelo = toInt(row["Ano do Modelo *"] || row["ano_modelo"] || row["ano"] || 0);
      const valorReferencia = toNum(row["Valor FIPE / Referência (R$) *"] || row["valor"] || row["valor_fipe"] || 0);
      const saldoDevedor = toNum(row["Saldo Devedor (R$)"] || row["saldo_devedor"] || 0);

      return {
        aba: "veiculos" as const,
        linha: i + 1,
        tipo,
        montadora,
        modelo,
        anoModelo,
        valorReferencia,
        saldoDevedor: saldoDevedor > 0 ? saldoDevedor : undefined,
      };
    })
    .filter((item) => item.montadora && item.modelo);
}

function parsePoupanca(rows: Record<string, unknown>[]): ItemPoupancaBruto[] {
  return rows
    .filter((row) => toStr(row["Instituição *"] || row["instituicao"]))
    .map((row, i) => {
      const instituicao = toStr(row["Instituição *"] || row["instituicao"] || "");
      const valorAtual = toNum(row["Valor Atual (R$) *"] || row["valor"] || row["valor_atual"] || 0);
      const titularidade = toStr(row["Titularidade / Observação"] || row["titularidade"] || "");

      return {
        aba: "poupanca" as const,
        linha: i + 1,
        instituicao,
        valorAtual,
        titularidade: titularidade || undefined,
      };
    })
    .filter((item) => item.instituicao);
}

// ─── Resultado do parse ───────────────────────────────────────────────────────

export type ResultadoParseXlsx = {
  itens: ItemPatrimonioBruto[];
  abasEncontradas: AbaImportacao[];
  abasDesconhecidas: string[];
  totalPorAba: Partial<Record<AbaImportacao, number>>;
};

// ─── Parser principal ─────────────────────────────────────────────────────────

export async function parseXlsx(arquivo: File): Promise<ResultadoParseXlsx> {
  await loadXLSX();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "array", cellStyles: true, cellDates: false });

        const itens: ItemPatrimonioBruto[] = [];
        const abasEncontradas: AbaImportacao[] = [];
        const abasDesconhecidas: string[] = [];
        const totalPorAba: Partial<Record<AbaImportacao, number>> = {};

        for (const nomeAba of wb.SheetNames) {
          // Pula a aba de guia
          if (nomeAba.toLowerCase().includes("guia") || nomeAba.toLowerCase().includes("instrução")) {
            continue;
          }

          const tipo = identificarAba(nomeAba);
          if (!tipo) {
            abasDesconhecidas.push(nomeAba);
            continue;
          }

          const ws = wb.Sheets[nomeAba];

          // Identifica linha do cabeçalho (procura linha com "Ticker", "Nome", "Instituição" etc.)
          const headerRow = encontrarLinhaHeader(ws);
          if (headerRow === -1) continue;

          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
            defval: "",
            range: headerRow,
          });

          // Remove linhas de legenda (segunda linha após header, normalmente com textos descritivos)
          const rowsFiltered = rows.filter((row) => {
            const vals = Object.values(row);
            const hasValue = vals.some((v) => {
              const s = toStr(v);
              return s && !s.includes("ex.:") && !s.includes("Ex.:") && !s.includes("Texto") && !s.includes("R$");
            });
            return hasValue;
          });

          let parsed: ItemPatrimonioBruto[] = [];
          switch (tipo) {
            case "acoes":
              parsed = parseAcoes(rowsFiltered, nomeAba);
              break;
            case "fundos":
              parsed = parseFundos(rowsFiltered, nomeAba);
              break;
            case "renda_fixa":
              parsed = parseRendaFixaOuPrevidencia(rowsFiltered, "renda_fixa");
              break;
            case "previdencia":
              parsed = parseRendaFixaOuPrevidencia(rowsFiltered, "previdencia");
              break;
            case "imoveis":
              parsed = parseImoveis(rowsFiltered);
              break;
            case "veiculos":
              parsed = parseVeiculos(rowsFiltered);
              break;
            case "poupanca":
              parsed = parsePoupanca(rowsFiltered);
              break;
          }

          if (parsed.length > 0) {
            // Renumera linhas globalmente para evitar colisão
            const offset = itens.length;
            for (const item of parsed as Array<{ linha: number }>) {
              item.linha = offset + item.linha;
            }
            itens.push(...parsed);
            abasEncontradas.push(tipo);
            totalPorAba[tipo] = parsed.length;
          }
        }

        resolve({ itens, abasEncontradas, abasDesconhecidas, totalPorAba });
      } catch (err) {
        reject(new Error(`Erro ao ler o arquivo XLSX: ${err instanceof Error ? err.message : String(err)}`));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo"));
    reader.readAsArrayBuffer(arquivo);
  });
}

// Localiza a linha de cabeçalho real (ignora as linhas de título/instrução no topo)
function encontrarLinhaHeader(ws: WorkSheet): number {
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1:A1");
  for (let r = range.s.r; r <= Math.min(range.e.r, 10); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      const val = toStr(cell.v).toLowerCase();
      if (
        val.includes("ticker") ||
        val.includes("nome do fundo") ||
        val.includes("nome do ativo") ||
        val.includes("nome do título") ||
        val.includes("indexador") ||
        val.includes("descrição") ||
        val.includes("montadora") ||
        val.includes("instituição")
      ) {
        return r;
      }
    }
  }
  return -1;
}
