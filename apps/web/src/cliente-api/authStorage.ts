const TOKEN_KEY = "ei.token";
const USER_KEY = "ei.user";
const SESSION_EXIT_REASON_KEY = "ei.session.exit.reason";

export type SessaoArmazenada = {
  token: string;
  usuario: { id: string; nome: string; email: string };
};

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveSession(session: SessaoArmazenada): void {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.usuario));
  localStorage.setItem("isAuthenticated", "true");
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("isAuthenticated");
}

export function marcarSessaoExpirada(): void {
  localStorage.setItem(SESSION_EXIT_REASON_KEY, "expirada");
}

export function consumirMotivoSaidaSessao(): "expirada" | null {
  const motivo = localStorage.getItem(SESSION_EXIT_REASON_KEY);
  if (motivo === "expirada") {
    localStorage.removeItem(SESSION_EXIT_REASON_KEY);
    return "expirada";
  }
  return null;
}

export function getStoredUser(): SessaoArmazenada["usuario"] | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessaoArmazenada["usuario"];
    if (!parsed?.id || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}
