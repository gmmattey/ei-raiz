/**
 * Formata uma string ISO 8601 em linguagem humana PT-BR.
 * Nunca expõe formato ISO ao usuário.
 *
 * Exemplos:
 *   hoje        → "Hoje às 14h32"
 *   ontem       → "Ontem às 09h15"
 *   esta semana → "Terça-feira às 11h00"
 *   mais antigo → "12 de mar. de 2025"
 */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "";

  const data = new Date(iso);
  if (isNaN(data.getTime())) return "";

  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const alvo = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const diffDias = Math.round((hoje.getTime() - alvo.getTime()) / 86400000);

  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");

  if (diffDias === 0) return `Hoje às ${hora}`;
  if (diffDias === 1) return `Ontem às ${hora}`;
  if (diffDias < 7) {
    const diaSemana = data.toLocaleDateString("pt-BR", { weekday: "long" });
    const diaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
    return `${diaCapitalizado} às ${hora}`;
  }

  return data.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Formata apenas a hora de uma string ISO, sem a data.
 * Ex: "14h32"
 */
export function formatarHora(iso: string | null | undefined): string {
  if (!iso) return "";
  const data = new Date(iso);
  if (isNaN(data.getTime())) return "";
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
}
