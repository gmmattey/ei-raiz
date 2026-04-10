import type { ItemImportacaoBruto, ParserExtrato } from "./tipos";

const REQUIRED_COLUMNS = ["data", "ticker", "nome", "categoria", "plataforma", "quantidade", "valor"];

const decoder = new TextDecoder();

function splitLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}

function parseNumber(input: string): number {
  const normalized = input.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : Number.NaN;
}

export class ParserCsvGenerico implements ParserExtrato {
  nome = "csv-generico";

  detectar(arquivo: ArrayBuffer): boolean {
    const content = decoder.decode(arquivo).trim();
    if (!content) return false;
    const firstLine = content.split(/\r?\n/)[0] ?? "";
    const delimiter = firstLine.includes(";") ? ";" : ",";
    const header = splitLine(firstLine.toLowerCase(), delimiter).map((col) => col.trim());
    return REQUIRED_COLUMNS.every((col) => header.includes(col));
  }

  processar(arquivo: ArrayBuffer, contexto?: { plataformaPadrao?: string }): ItemImportacaoBruto[] {
    const content = decoder.decode(arquivo).trim();
    if (!content) return [];

    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const delimiter = (lines[0] ?? "").includes(";") ? ";" : ",";
    const header = splitLine(lines[0].toLowerCase(), delimiter);
    const index = {
      data: header.indexOf("data"),
      ticker: header.indexOf("ticker"),
      nome: header.indexOf("nome"),
      categoria: header.indexOf("categoria"),
      plataforma: header.indexOf("plataforma"),
      quantidade: header.indexOf("quantidade"),
      valor: header.indexOf("valor"),
    };

    const plataformaPadrao = contexto?.plataformaPadrao ?? "Importacao CSV";

    return lines.slice(1).map((line, i) => {
      const cols = splitLine(line, delimiter);
      return {
        linha: i + 1,
        dataOperacao: cols[index.data] ?? "",
        ticker: (cols[index.ticker] ?? "").toUpperCase(),
        nome: cols[index.nome] ?? "",
        categoria: (cols[index.categoria] ?? "").toLowerCase(),
        plataforma: cols[index.plataforma] || plataformaPadrao,
        quantidade: parseNumber(cols[index.quantidade] ?? ""),
        valor: parseNumber(cols[index.valor] ?? ""),
      };
    });
  }
}
