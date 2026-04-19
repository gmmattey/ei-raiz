/**
 * Planner do backfill mensal de cotas CVM.
 *
 * Responsabilidade única: dado o estado atual do banco (menor data_aquisicao
 * entre fundos relevantes + CNPJs com vinculo) e parâmetros opcionais,
 * devolver o intervalo [anoMesInicial, anoMesFinal] e a lista de CNPJs a
 * processar. Sem I/O de rede, testável em isolamento.
 */

export type PlannerInput = {
  hoje?: Date;                      // injetável p/ teste; default = new Date()
  menorDataAquisicao?: string | null; // "YYYY-MM-DD" vindo de ativos
  intervaloInicial?: string;        // "YYYY-MM" override
  intervaloFinal?: string;          // "YYYY-MM" override
  janelaPadraoMeses?: number;       // default 60
  margemMeses?: number;             // default 2 (recuar após menorDataAquisicao)
  cnpjsDisponiveis?: string[];      // vindos de ativos.cnpj_fundo
  cnpjsOverride?: string[];         // caller forneceu lista explícita
};

export type PlannerOutput = {
  intervaloInicial: string; // "YYYY-MM"
  intervaloFinal: string;   // "YYYY-MM"
  meses: string[];          // ordenados ASC
  totalMesesPrevistos: number;
  cnpjs: string[];          // normalizados, únicos
  origem: "override" | "data_aquisicao" | "janela_padrao";
};

const JANELA_PADRAO_DEFAULT = 60; // 5 anos
const MARGEM_DEFAULT = 2;          // meses de folga antes da data_aquisicao

export function normalizarCnpj14(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = String(raw).replace(/\D/g, "");
  return d.length === 14 ? d : null;
}

export function anoMesUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function subtrairMeses(anoMes: string, qtd: number): string {
  const [ano, mes] = anoMes.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1 - qtd, 1));
  return anoMesUtc(d);
}

export function compararAnoMes(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function gerarMesesEntre(inicio: string, fim: string): string[] {
  if (compararAnoMes(inicio, fim) > 0) return [];
  const [anoI, mesI] = inicio.split("-").map(Number);
  const [anoF, mesF] = fim.split("-").map(Number);
  const out: string[] = [];
  let y = anoI;
  let m = mesI;
  while (y < anoF || (y === anoF && m <= mesF)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

export function planejarBackfill(input: PlannerInput): PlannerOutput {
  const hoje = input.hoje ?? new Date();
  const mesAtual = anoMesUtc(hoje);

  // 1. Fim do intervalo — override ou mês atual.
  const fim = input.intervaloFinal ?? mesAtual;

  // 2. Início — ordem de prioridade:
  //    a) override explícito
  //    b) menor data_aquisicao - margem
  //    c) janela padrão a partir do fim
  let inicio: string;
  let origem: PlannerOutput["origem"];
  if (input.intervaloInicial) {
    inicio = input.intervaloInicial;
    origem = "override";
  } else if (input.menorDataAquisicao && /^\d{4}-\d{2}/.test(input.menorDataAquisicao)) {
    const base = input.menorDataAquisicao.slice(0, 7); // YYYY-MM
    inicio = subtrairMeses(base, input.margemMeses ?? MARGEM_DEFAULT);
    origem = "data_aquisicao";
  } else {
    const janela = input.janelaPadraoMeses ?? JANELA_PADRAO_DEFAULT;
    inicio = subtrairMeses(fim, janela - 1); // inclui o mês-fim
    origem = "janela_padrao";
  }

  // Garantir início <= fim.
  if (compararAnoMes(inicio, fim) > 0) inicio = fim;

  const meses = gerarMesesEntre(inicio, fim);

  // 3. CNPJs — override > ativos disponíveis.
  const fonte = input.cnpjsOverride ?? input.cnpjsDisponiveis ?? [];
  const cnpjs = Array.from(
    new Set(
      fonte.map((c) => normalizarCnpj14(c)).filter((c): c is string => Boolean(c)),
    ),
  );

  return {
    intervaloInicial: inicio,
    intervaloFinal: fim,
    meses,
    totalMesesPrevistos: meses.length,
    cnpjs,
    origem,
  };
}

/**
 * Dada uma lista de (cnpj, dataRef, vlQuota) de um mês, reduz para o último
 * dia útil disponível por CNPJ. Idempotente, determinístico.
 */
export function reduzirFechamentoMensalPorCnpj<
  T extends { cnpj: string; dataRef: string },
>(linhas: T[]): T[] {
  const melhorPorCnpj = new Map<string, T>();
  for (const linha of linhas) {
    const existente = melhorPorCnpj.get(linha.cnpj);
    if (!existente || compararAnoMes(linha.dataRef, existente.dataRef) > 0) {
      melhorPorCnpj.set(linha.cnpj, linha);
    }
  }
  return Array.from(melhorPorCnpj.values());
}
