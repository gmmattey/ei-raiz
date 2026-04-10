import { z } from "zod";

const senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

export const registrarEntradaSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  cpf: z.string().trim().regex(/^\d{11}$/, "CPF inválido"),
  email: z.string().trim().email().max(180),
  senha: z
    .string()
    .regex(
      senhaForteRegex,
      "Senha fraca: use 8+ caracteres com maiúscula, minúscula, número e caractere especial",
    ),
});

export const entrarEntradaSchema = z.object({
  email: z.string().trim().email().max(180),
  senha: z.string().min(5).max(128),
});

export const authorizationHeaderSchema = z
  .string()
  .trim()
  .regex(/^Bearer\s+.+$/i, "Formato esperado: Bearer <token>");

export const verificarCadastroEntradaSchema = z.object({
  cpf: z.string().trim().regex(/^\d{11}$/, "CPF inválido"),
  email: z.string().trim().email().max(180),
});

export const recuperarSenhaPorEmailEntradaSchema = z.object({
  email: z.string().trim().email().max(180),
});

export const recuperarAcessoPorCpfEntradaSchema = z.object({
  cpf: z.string().trim().regex(/^\d{11}$/, "CPF inválido"),
});

export const redefinirSenhaEntradaSchema = z.object({
  token: z.string().trim().min(20).max(300),
  novaSenha: z
    .string()
    .regex(
      senhaForteRegex,
      "Senha fraca: use 8+ caracteres com maiúscula, minúscula, número e caractere especial",
    ),
});
