export interface MovimentoHistorico {
  item_id: string;
  item_tipo: string;
  tipo: string;
  valor_brl: number | null;
  data: string;
  criado_em: string;
}

export interface SnapshotReconstruido {
  anoMes: string;
  patrimonioBrutoBrl: number;
  patrimonioLiquidoBrl: number;
  dividaBrl: number;
  aporteMesBrl: number;
  ehConfiavel: boolean;
  dadosJson: string;
}

const mesSeguinte = (anoMes: string): string => {
  const [ano, mes] = anoMes.split('-').map(Number);
  return mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, '0')}`;
};

const mesesEntre = (primeiro: string, ultimoExclusivo: string): string[] => {
  const meses: string[] = [];
  for (let atual = primeiro; atual < ultimoExclusivo; atual = mesSeguinte(atual)) meses.push(atual);
  return meses;
};

const MAX_MESES_RECONSTRUIDOS = 24;

// Cada movimento registra o estado conhecido da posição naquele instante. Para
// cada fechamento mensal, usa-se o último evento de cada item, sem projetar
// valores para meses anteriores ao primeiro movimento.
export const reconstruirHistoricoDeMovimentos = (
  movimentos: MovimentoHistorico[],
  anoMesAtual: string,
  totalItens: number,
): SnapshotReconstruido[] => {
  if (movimentos.length === 0) return [];
  const ordenados = [...movimentos].sort((a, b) =>
    a.data.localeCompare(b.data) || a.criado_em.localeCompare(b.criado_em));
  const primeiroMes = ordenados[0].data.slice(0, 7);
  const itensComMovimento = new Set(ordenados.map((movimento) => movimento.item_id));
  const itensSemMovimento = Math.max(0, totalItens - itensComMovimento.size);
  const coberturaCompleta = itensSemMovimento === 0;

  // O endpoint já entrega 24 meses; limitar a reconstrução preserva a quota D1
  // quando houver importações muito antigas ou carteiras extensas.
  return mesesEntre(primeiroMes, anoMesAtual).slice(-MAX_MESES_RECONSTRUIDOS).map((anoMes) => {
    const limite = `${anoMes}-31`;
    const ultimoPorItem = new Map<string, MovimentoHistorico>();
    let aporteMesBrl = 0;
    for (const movimento of ordenados) {
      if (movimento.data > limite) break;
      ultimoPorItem.set(movimento.item_id, movimento);
      if (movimento.data.slice(0, 7) === anoMes && movimento.tipo === 'aporte') {
        aporteMesBrl += movimento.valor_brl ?? 0;
      }
    }

    let patrimonioBrutoBrl = 0;
    let dividaBrl = 0;
    let itensSemValor = 0;
    for (const movimento of ultimoPorItem.values()) {
      if (movimento.tipo === 'retirada') continue;
      if (movimento.valor_brl === null) {
        itensSemValor += 1;
        continue;
      }
      if (movimento.item_tipo === 'divida') dividaBrl += movimento.valor_brl;
      else patrimonioBrutoBrl += movimento.valor_brl;
    }
    const ehConfiavel = coberturaCompleta && itensSemValor === 0;
    return {
      anoMes,
      patrimonioBrutoBrl,
      patrimonioLiquidoBrl: patrimonioBrutoBrl - dividaBrl,
      dividaBrl,
      aporteMesBrl,
      ehConfiavel,
      dadosJson: JSON.stringify({
        fonte: 'movimentos',
        itensComMovimento: itensComMovimento.size,
        itensSemMovimento,
        itensSemValor,
      }),
    };
  });
};
