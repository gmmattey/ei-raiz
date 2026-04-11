import type { CategoriaAtivo } from "@ei/contratos";

export type IdentidadeAtivoCanonica = {
  tickerCanonico: string | null;
  nomeCanonico: string;
  cnpjFundo: string | null;
  isin: string | null;
  identificadorCanonico: string;
  aliases: string[];
};

type EntradaIdentidade = {
  ticker: string;
  nome: string;
  categoria: CategoriaAtivo;
  // CNPJ explícito (opcional, sobrescreve extração por regex do nome/ticker)
  cnpj?: string;
};

const limparEspacos = (value: string): string => value.replace(/\s+/g, " ").trim();
const normalizarTicker = (value: string): string => limparEspacos(value).toUpperCase().replace(/[^A-Z0-9.]/g, "");
const normalizarNome = (value: string): string => limparEspacos(value).toUpperCase();
const slug = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

const extrairCnpj = (value: string): string | null => {
  const match = value.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
  if (!match) return null;
  const digits = match[0].replace(/\D/g, "");
  return digits.length === 14 ? digits : null;
};

const extrairIsin = (value: string): string | null => {
  const match = value.toUpperCase().match(/\b[A-Z]{2}[A-Z0-9]{9}\d\b/);
  return match?.[0] ?? null;
};

export function normalizarIdentidadeAtivo(input: EntradaIdentidade): IdentidadeAtivoCanonica {
  const tickerCanonico = normalizarTicker(input.ticker) || null;
  const nomeCanonico = normalizarNome(input.nome) || "ATIVO_SEM_NOME";
  const baseBusca = `${input.ticker} ${input.nome}`.toUpperCase();
  const cnpjFundo = (input.cnpj?.replace(/\D/g, "") || null) ?? extrairCnpj(baseBusca);
  const isin = extrairIsin(baseBusca);

  let identificadorCanonico: string;
  if (input.categoria === "fundo") {
    identificadorCanonico = cnpjFundo
      ? `fundo:cnpj:${cnpjFundo}`
      : isin
        ? `fundo:isin:${isin}`
        : tickerCanonico
          ? `fundo:ticker:${tickerCanonico}`
          : `fundo:nome:${slug(nomeCanonico)}`;
  } else if (input.categoria === "acao") {
    identificadorCanonico = isin
      ? `bolsa:isin:${isin}`
      : tickerCanonico
        ? `bolsa:ticker:${tickerCanonico}`
        : `bolsa:nome:${slug(nomeCanonico)}`;
  } else {
    identificadorCanonico = isin
      ? `${input.categoria}:isin:${isin}`
      : cnpjFundo
        ? `${input.categoria}:cnpj:${cnpjFundo}`
        : tickerCanonico
          ? `${input.categoria}:ticker:${tickerCanonico}`
          : `${input.categoria}:nome:${slug(nomeCanonico)}`;
  }

  const aliases = Array.from(
    new Set(
      [input.ticker, tickerCanonico, input.nome, nomeCanonico, cnpjFundo, isin]
        .filter((item): item is string => Boolean(item && item.trim().length > 0))
        .map((item) => limparEspacos(item).toUpperCase()),
    ),
  );

  return {
    tickerCanonico,
    nomeCanonico,
    cnpjFundo,
    isin,
    identificadorCanonico,
    aliases,
  };
}
