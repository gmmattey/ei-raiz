#!/usr/bin/env node
/**
 * Rollout pós-deploy: reconstrução do histórico mensal de todos os usuários.
 *
 * Orquestra as três rotas admin idempotentes:
 *   GET  /api/admin/historico/reconstruir/status
 *   POST /api/admin/historico/reconstruir/enfileirar-todos
 *   POST /api/admin/historico/reconstruir/processar-todos  (em loop)
 *
 * Deve ser rodado após cada deploy que altere fórmulas de rentabilidade
 * por família (A..E), para que o histórico reflita o novo cálculo.
 *
 * ─── Uso ────────────────────────────────────────────────────────────────────
 *
 *   EI_ADMIN_TOKEN=<jwt> node utilitarios/scripts/reconstruir-historico-todos.mjs
 *
 * ─── Variáveis de ambiente ──────────────────────────────────────────────────
 *
 *   EI_ADMIN_TOKEN   (obrigatório) JWT de admin válido
 *   EI_API_URL       (opcional)    default https://ei-api.esquiloinvest.workers.dev
 *   EI_TAMANHO_LOTE  (opcional)    meses por usuário por ciclo (1..12, default 6)
 *   EI_MAX_CICLOS    (opcional)    teto de ciclos do processar-todos (default 200)
 */

const API_BASE_URL = process.env.EI_API_URL || "https://ei-api.esquiloinvest.workers.dev";
const ADMIN_TOKEN = process.env.EI_ADMIN_TOKEN;
const TAMANHO_LOTE = Number(process.env.EI_TAMANHO_LOTE ?? 6);
const MAX_CICLOS = Number(process.env.EI_MAX_CICLOS ?? 200);

if (!ADMIN_TOKEN) {
  console.error("[erro] EI_ADMIN_TOKEN não definido.");
  process.exit(1);
}
if (!Number.isInteger(TAMANHO_LOTE) || TAMANHO_LOTE < 1 || TAMANHO_LOTE > 12) {
  console.error("[erro] EI_TAMANHO_LOTE deve ser inteiro entre 1 e 12.");
  process.exit(1);
}

const headersJson = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${ADMIN_TOKEN}`,
};

async function chamar(path, init = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...headersJson, ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.ok === false) {
    throw new Error(
      `${init.method ?? "GET"} ${path} falhou (${res.status}): ${JSON.stringify(body)}`,
    );
  }
  return body?.dados ?? body;
}

async function status() {
  return chamar("/api/admin/historico/reconstruir/status", { method: "GET" });
}

async function enfileirarTodos() {
  return chamar("/api/admin/historico/reconstruir/enfileirar-todos", { method: "POST" });
}

async function processarLote() {
  return chamar("/api/admin/historico/reconstruir/processar-todos", {
    method: "POST",
    body: JSON.stringify({ tamanhoLote: TAMANHO_LOTE }),
  });
}

function agora() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

async function main() {
  console.log(`[${agora()}] alvo: ${API_BASE_URL}`);

  const inicial = await status();
  console.log(
    `[${agora()}] status inicial — totais=${JSON.stringify(inicial.totais)} ` +
      `usuáriosComAtivos=${inicial.usuariosComAtivos} faltamEnfileirar=${inicial.faltamEnfileirar}`,
  );

  if (inicial.faltamEnfileirar > 0) {
    const res = await enfileirarTodos();
    console.log(
      `[${agora()}] enfileirados=${res.enfileirados}/${res.totalCandidatos}` +
        (res.erros?.length ? ` erros=${res.erros.length}` : ""),
    );
    for (const err of res.erros ?? []) {
      console.warn(`  - ${err.usuarioId}: ${err.mensagem}`);
    }
  } else {
    console.log(`[${agora()}] nada a enfileirar`);
  }

  for (let ciclo = 1; ciclo <= MAX_CICLOS; ciclo += 1) {
    const res = await processarLote();
    const st = await status();
    const pendentes = (st.totais.pendente ?? 0) + (st.totais.processando ?? 0);
    console.log(
      `[${agora()}] ciclo ${ciclo} — processados=${res.processados} ` +
        `concluídosAgora=${res.concluidosAgora} pendentesRestantes=${pendentes}` +
        (res.erros?.length ? ` errosCiclo=${res.erros.length}` : ""),
    );
    for (const err of res.erros ?? []) {
      console.warn(`  - ${err.usuarioId}: ${err.mensagem}`);
    }
    if (pendentes === 0) {
      console.log(`[${agora()}] rollout concluído em ${ciclo} ciclo(s)`);
      break;
    }
    if (ciclo === MAX_CICLOS) {
      console.error(
        `[${agora()}] atingido MAX_CICLOS=${MAX_CICLOS} com ${pendentes} pendentes — reexecute o script`,
      );
      process.exit(2);
    }
  }

  const final = await status();
  console.log(`[${agora()}] status final — totais=${JSON.stringify(final.totais)}`);
  if ((final.totais.erro ?? 0) > 0) {
    console.warn(
      `[${agora()}] atenção: ${final.totais.erro} usuário(s) em status 'erro' — investigue na fila_reconstrucao_carteira`,
    );
    process.exit(3);
  }
}

main().catch((err) => {
  console.error(`[${agora()}] falha:`, err?.message ?? err);
  process.exit(1);
});
