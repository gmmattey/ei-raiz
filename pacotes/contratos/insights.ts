export type RiscoPrincipal = {
  codigo: string;
  titulo: string;
  descricao: string;
  severidade: "baixo" | "medio" | "alto";
};

export type AcaoPrioritaria = {
  codigo: string;
  titulo: string;
  descricao: string;
  impactoEsperado: string;
};

export type Diagnostico = {
  resumo: string;
  riscos: RiscoPrincipal[];
  acoes: AcaoPrioritaria[];
};

export type ScoreCarteira = {
  scoreAnterior?: number;
  variacao?: number;
  score: number;
  faixa: "critico" | "fragil" | "regular" | "bom" | "muito_bom";
  fatoresPositivos: Array<{ label: string; impacto: number }>;
  fatoresNegativos: Array<{ label: string; impacto: number }>;
  riscoPrincipal: string;
  acaoPrioritaria: string;
  blocos: {
    aderenciaPerfil: number;
    qualidadeCarteira: number;
    consistenciaAportes: number;
    adequacaoObjetivo: number;
    historicoMomentoVida: number;
  };
  atualizadoEm: string;
};

export interface ServicoInsights {
  calcularScore(usuarioId: string): Promise<ScoreCarteira>;
  gerarDiagnostico(usuarioId: string): Promise<Diagnostico>;
}
