export class ErroImportacao extends Error {
  constructor(
    public readonly codigo: string,
    public readonly status: number,
    mensagem: string,
    public readonly detalhes?: unknown,
  ) {
    super(mensagem);
    this.name = "ErroImportacao";
  }
}

