#!/usr/bin/env node
/**
 * Sincronização de patrimônio externo (imóveis, veículos) via API admin.
 *
 * Sincroniza dados de imóveis e veículos de posicoes_financeiras para perfil_contexto_financeiro
 * através do endpoint /api/admin/patrimonio/sincronizar-externo.
 *
 * Uso:
 *   EI_ADMIN_TOKEN=<jwt> node utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs [--usuario-id=uuid] [--dry-run]
 *
 * Exemplos:
 *   # Sincronizar apenas um usuário (preview)
 *   EI_ADMIN_TOKEN=<jwt> node utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs --usuario-id=4a858baf-fd89-42a8-84f2-d45c7489b2a3 --dry-run
 *
 *   # Sincronizar apenas um usuário (apply)
 *   EI_ADMIN_TOKEN=<jwt> node utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs --usuario-id=4a858baf-fd89-42a8-84f2-d45c7489b2a3
 *
 *   # Sincronizar todos os usuários (dry-run)
 *   EI_ADMIN_TOKEN=<jwt> node utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs --dry-run
 *
 *   # Sincronizar todos os usuários (apply)
 *   EI_ADMIN_TOKEN=<jwt> node utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs
 */

const API_BASE_URL = process.env.EI_API_URL || "https://ei-api-gateway.giammattey-luiz.workers.dev";
const ADMIN_TOKEN = process.env.EI_ADMIN_TOKEN;

const args = process.argv.slice(2);
const usuarioIdParam = args.find(a => a.startsWith('--usuario-id='))?.split('=')[1];
const isDryRun = args.includes('--dry-run');

if (!ADMIN_TOKEN) {
  console.error("[erro] EI_ADMIN_TOKEN não definido.");
  console.error("Uso: EI_ADMIN_TOKEN=<seu_jwt> node utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs");
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

function agora() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

async function main() {
  try {
    console.log(`[${agora()}] Sincronização de Patrimônio Externo`);
    console.log(`[${agora()}] Alvo: ${API_BASE_URL}`);
    console.log(`[${agora()}] Modo: ${isDryRun ? 'DRY-RUN' : 'APPLY'}`);
    console.log(`[${agora()}] Token: ${ADMIN_TOKEN.slice(0, 20)}...`);

    if (usuarioIdParam) {
      console.log(`[${agora()}] Usuário: ${usuarioIdParam}`);
    } else {
      console.log(`[${agora()}] Escopo: TODOS os usuários com bens`);
    }

    console.log(`\n[${agora()}] Chamando /api/admin/patrimonio/sincronizar-externo...`);

    const resultado = await chamar("/api/admin/patrimonio/sincronizar-externo", {
      method: "POST",
      body: JSON.stringify({
        usuarioId: usuarioIdParam ?? undefined,
        dryRun: isDryRun,
      }),
    });

    console.log(`\n[${agora()}] Resultado:`);
    console.log(`  Modo: ${resultado.modo}`);
    console.log(`  Usuários a processar: ${resultado.usuariosAProcessar}`);
    console.log(`  Sincronizados (novos): ${resultado.sincronizados}`);
    console.log(`  Atualizados: ${resultado.atualizados}`);
    console.log(`  Erros: ${resultado.erros.length}`);

    if (resultado.erros.length > 0) {
      console.log(`\n[${agora()}] Detalhes dos erros:`);
      for (const { usuarioId, erro } of resultado.erros) {
        console.log(`  - ${usuarioId}: ${erro}`);
      }
    }

    console.log(`\n[${agora()}] Concluído ${isDryRun ? '(DRY-RUN - nenhum dado foi alterado)' : '(dados sincronizados)'}`);
  } catch (err) {
    console.error(`[${agora()}] Erro:`, err?.message ?? err);
    process.exit(1);
  }
}

main();
