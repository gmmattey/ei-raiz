export class ErroAutenticacao extends Error {
  constructor(
    public readonly codigo: string,
    public readonly status: number,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ErroAutenticacao";
  }
}
