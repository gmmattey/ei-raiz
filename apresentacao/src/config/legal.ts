// Identidade do controlador de dados (LGPD) — fonte única, consumida por Política de
// Privacidade, Termos de Uso e Suporte. Nenhum dado aqui é inventado: até que o Luiz aprove
// razão social/CPF-CNPJ/e-mail/nome fantasia, todas as constantes ficam `null` e as seções que
// dependem delas simplesmente não renderizam (mesmo padrão já usado em `platforms.ts` pra
// URL de loja e e-mail de suporte) — nunca um texto de placeholder entre colchetes.
//
// Ao aprovar os dados, configure as env vars abaixo (build de produção) — nenhum componente
// precisa mudar.

function readValue(raw: string | undefined): string | null {
  const trimmed = raw?.trim()
  return trimmed ? trimmed : null
}

/** Razão social ou nome completo do controlador responsável pelo tratamento de dados. */
export const CONTROLLER_NAME = readValue(import.meta.env.VITE_LEGAL_CONTROLLER_NAME as string | undefined)

/**
 * CPF ou CNPJ do controlador, conforme a estrutura legal realmente adotada — sem formatação
 * assumida (não sabemos se será CPF de pessoa física ou CNPJ até a decisão ser tomada).
 */
export const CONTROLLER_TAX_ID = readValue(import.meta.env.VITE_LEGAL_CONTROLLER_TAX_ID as string | undefined)

/** Nome fantasia/marca pública, se diferente da razão social — opcional. */
export const PUBLIC_BRAND_NAME = readValue(import.meta.env.VITE_LEGAL_PUBLIC_BRAND_NAME as string | undefined)

/** True só quando os dois dados obrigatórios do controlador (nome + CPF/CNPJ) existem. */
export const CONTROLLER_IDENTITY_CONFIGURADA = Boolean(CONTROLLER_NAME && CONTROLLER_TAX_ID)
