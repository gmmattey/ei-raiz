export type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
};

export type TokenJWT = {
  token: string;
  tipo: "Bearer";
  expiraEm: string;
};

export type RegistrarEntrada = {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
};

export type RecuperarSenhaPorEmailEntrada = {
  email: string;
};

export type RecuperarSenhaPorEmailSaida = {
  solicitado: boolean;
  canal: "email";
  destinoMascara: string;
  observacao: string;
};

export type RecuperarAcessoPorCpfEntrada = {
  cpf: string;
};

export type RecuperarAcessoPorCpfSaida = {
  solicitado: boolean;
  canal: "email";
  destinoMascara: string;
  observacao: string;
};

export type RedefinirSenhaEntrada = {
  token: string;
  novaSenha: string;
};

export type RedefinirSenhaSaida = {
  redefinido: boolean;
};

export type VerificarCadastroEntrada = {
  cpf: string;
  email: string;
};

export type VerificarCadastroSaida = {
  cpfDisponivel: boolean;
  emailDisponivel: boolean;
};

export type RegistrarSaida = {
  usuario: UsuarioAutenticado;
  sessao: TokenJWT;
};

export type EntrarEntrada = {
  email: string;
  senha: string;
};

export type EntrarSaida = {
  usuario: UsuarioAutenticado;
  sessao: TokenJWT;
};

export type SessaoUsuarioSaida = {
  usuario: UsuarioAutenticado;
};

export interface ServicoAutenticacao {
  registrar(entrada: RegistrarEntrada): Promise<RegistrarSaida>;
  entrar(entrada: EntrarEntrada): Promise<EntrarSaida>;
  obterSessao(token: string): Promise<SessaoUsuarioSaida>;
  verificarCadastro(entrada: VerificarCadastroEntrada): Promise<VerificarCadastroSaida>;
  solicitarRecuperacaoPorEmail(entrada: RecuperarSenhaPorEmailEntrada): Promise<RecuperarSenhaPorEmailSaida>;
  solicitarRecuperacaoPorCpf(entrada: RecuperarAcessoPorCpfEntrada): Promise<RecuperarAcessoPorCpfSaida>;
  redefinirSenha(entrada: RedefinirSenhaEntrada): Promise<RedefinirSenhaSaida>;
}
