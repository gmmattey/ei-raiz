// Namespaces canônicos (6 domínios públicos + admin + telemetria).
export * as authApi from "./auth";
export * as usuarioApi from "./usuario";
export * as perfilApi from "./perfil";
export * as patrimonioApi from "./patrimonio";
export * as mercadoApi from "./mercado";
export * as decisoesApi from "./decisoes";
export * as adminApi from "./admin";
export * as telemetriaApi from "./telemetria";

// Catálogo FIPE (provedor externo específico, mantido isolado).
export * as fipeApi from "./fipe";

export { ApiError } from "./http";
export {
  clearSession,
  consumirMotivoSaidaSessao,
  getAuthToken,
  getStoredUser,
  marcarSessaoExpirada,
  saveSession,
} from "./authStorage";
