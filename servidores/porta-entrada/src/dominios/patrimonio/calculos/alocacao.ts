// Cálculo puro de alocação por classe/subclasse de ativo.

export interface ItemAlocacao {
  classe: string;
  subclasse: string | null;
  valorBrl: number;
}

export interface ResultadoAlocacao {
  classe: string;
  subclasse: string | null;
  valorBrl: number;
  pesoPct: number;
}

export function calcularAlocacao(itens: ItemAlocacao[]): ResultadoAlocacao[] {
  const total = itens.reduce((s, i) => s + (Number.isFinite(i.valorBrl) ? i.valorBrl : 0), 0);
  if (total <= 0) return itens.map((i) => ({ ...i, pesoPct: 0 }));
  return itens.map((i) => ({
    classe: i.classe,
    subclasse: i.subclasse,
    valorBrl: i.valorBrl,
    pesoPct: (i.valorBrl / total) * 100,
  }));
}
