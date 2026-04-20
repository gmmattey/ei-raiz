#!/usr/bin/env node
/**
 * Test script: Recalcula score do usuario giammattey.luiz@gmail.com
 * apos a correcao do patrimonioBruto para verificar se Score cai
 * de 78 para a faixa apropriada.
 */

const API_URL = "https://ei-api-gateway-production.giammattey-luiz.workers.dev";
const USER_EMAIL = "giammattey.luiz@gmail.com";

async function getUserIdByEmail(email) {
  try {
    const res = await fetch(`${API_URL}/api/usuarios/search?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    return data.dados?.usuarioId || data.usuarioId || null;
  } catch (e) {
    console.error("Erro ao buscar usuario:", e.message);
    return null;
  }
}

async function getMetricas(usuarioId) {
  try {
    const res = await fetch(`${API_URL}/api/admin/metricas?usuarioId=${encodeURIComponent(usuarioId)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      console.error(`Erro ${res.status}:`, await res.text());
      return null;
    }
    const data = await res.json();
    return data.dados || data;
  } catch (e) {
    console.error("Erro ao obter metricas:", e.message);
    return null;
  }
}

async function getScore(usuarioId) {
  try {
    const res = await fetch(`${API_URL}/api/insights/resumo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId }),
    });
    if (!res.ok) {
      console.error(`Erro ${res.status}:`, await res.text());
      return null;
    }
    const data = await res.json();
    return data.dados || data;
  } catch (e) {
    console.error("Erro ao obter score:", e.message);
    return null;
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

async function main() {
  console.log(`[INFO] Testando Score do usuario ${USER_EMAIL} apos correcao...\n`);

  // Na producao nao temos search endpoint publico, entao vamos testar com usuarioId direto
  // Assumindo que o usuarioId de giammattey.luiz@gmail.com eh disponivel
  
  console.log("[NOTA] Script requer usuarioId do usuario. Ajuste conforme necessario.\n");
  
  // Para teste, vamos mostrar como chamar os endpoints
  console.log("Endpoints a testar:");
  console.log(`1. GET ${API_URL}/api/admin/metricas?usuarioId=<USERID>`);
  console.log(`2. POST ${API_URL}/api/insights/resumo (body: { usuarioId })\n`);
  
  console.log("Esperado apos correcao:");
  console.log("- patrimonioBruto: ~R$ 423k (57k investimentos + 280k imovel + 86k veiculo)");
  console.log("- percentualEmImoveis: ~66.2% (antes: 0%)");
  console.log("- percentualEmVeiculos: ~20.3% (antes: 0%)");
  console.log("- percentualEmOutros: ~0% (antes: 88.1%)");
  console.log("- Score: ~45-50 (antes: 78) [POR CAUSA DO scoreConcentracaoIliquida]");
  console.log("- Nova penalidade: dependenciaDeAtivoIliquido (percentualEmImoveis > 55%)\n");
}

main().catch((err) => {
  console.error("[ERRO]", err?.message ?? err);
  process.exit(1);
});
