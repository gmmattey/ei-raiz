// Contratos do domínio auth — shape 1:1 com a API.

export interface RegistrarEntrada {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
}

export interface EntrarEntrada {
  email: string;
  senha: string;
}

export interface SessaoSaida {
  usuarioId: string;
  email: string;
  nome: string;
  ehAdmin: boolean;
  criadoEm: string;
}

export interface RecuperarIniciarEntrada {
  email: string;
}

export interface RecuperarConfirmarEntrada {
  email: string;
  pin: string;
}

export interface RecuperarRedefinirEntrada {
  email: string;
  pin: string;
  novaSenha: string;
}

export interface TokenSaida {
  token: string;
  expiraEm: string;
}
