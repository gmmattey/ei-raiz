/**
 * Script de teste para validar integração Cloudflare AI
 * Cloudflare AI é agora o PRIMEIRO provedor na ordem de tentativa
 * Uso: npx tsx test-cloudflare.ts
 */

import dotenv from 'dotenv';
dotenv.config();

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.error('❌ Erro: CLOUDFLARE_ACCOUNT_ID ou CLOUDFLARE_API_TOKEN não configurado');
  console.error('Verifique o arquivo .env');
  process.exit(1);
}

const SYSTEM_PROMPT = `
Você é o motor de decisão financeira "Vera". Sua tarefa é analisar o perfil e a carteira de investimentos de um cliente e fornecer recomendações estruturadas.
Você deve responder APENAS em formato JSON, seguindo rigorosamente a estrutura abaixo.
Não use chat, não dê saudações, apenas o JSON.

Estrutura do JSON:
{
  "analise_geral": { "analise": "string", "acao": "string" },
  "acoes": { "analise": "string", "acao": "string", "recomendacoes": [{ "ativo": "string", "tipo": "compra|venda|troca", "justificativa": "string" }] },
  "fundos": { "analise": "string", "acao": "string", "recomendacoes": [{ "ativo": "string", "tipo": "compra|venda|troca", "justificativa": "string" }] },
  "previdencia": { "analise": "string", "acao": "string" },
  "poupanca": { "analise": "string", "acao": "string" }
}
`;

const testProfile = {
  idade: 35,
  renda_mensal: 5000,
  patrimonio_liquido: 50000,
  horizonte: '10 anos',
  perfil_risco: 'moderado'
};

const testPortfolio = {
  acoes: 20000,
  renda_fixa: 15000,
  caixa: 15000,
  imoveis: 100000
};

async function testCloudflare() {
  console.log('🚀 Testando integração Cloudflare AI...\n');
  console.log('📋 Perfil:', JSON.stringify(testProfile, null, 2));
  console.log('\n📊 Carteira:', JSON.stringify(testPortfolio, null, 2));

  const prompt = `Perfil: ${JSON.stringify(testProfile)}\nCarteira: ${JSON.stringify(testPortfolio)}`;
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`;

  console.log(`\n⏳ Chamando API Cloudflare...\n`);

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ]
      })
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    console.log(`✅ Sucesso! (${latency}ms)\n`);

    if (data.success === false) {
      console.error('❌ API retornou erro:', data.errors);
      process.exit(1);
    }

    // Parse resposta
    const rawResponse = data.result?.response || '';
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned || '{}');

    console.log('📄 Análise Geral:');
    console.log(`   • ${result.analise_geral?.analise || 'N/A'}`);
    console.log(`   • Ação: ${result.analise_geral?.acao || 'N/A'}\n`);

    if (result.acoes?.recomendacoes?.length > 0) {
      console.log('📈 Recomendações de Ações:');
      result.acoes.recomendacoes.forEach((rec: any) => {
        console.log(`   • ${rec.ativo} (${rec.tipo}): ${rec.justificativa}`);
      });
      console.log();
    }

    if (result.fundos?.recomendacoes?.length > 0) {
      console.log('💼 Recomendações de Fundos:');
      result.fundos.recomendacoes.forEach((rec: any) => {
        console.log(`   • ${rec.ativo} (${rec.tipo}): ${rec.justificativa}`);
      });
      console.log();
    }

    console.log('📊 Previdência:', result.previdencia?.acao || 'N/A');
    console.log('💰 Poupança:', result.poupanca?.acao || 'N/A');

    console.log(`\n⏱️  Latência: ${latency}ms`);
    console.log(`✨ Cloudflare AI funcionando corretamente!`);

  } catch (error: any) {
    console.error(`❌ Erro ao chamar API: ${error.message}\n`);
    console.error('Dicas:');
    console.error('1. Verifique se CLOUDFLARE_ACCOUNT_ID está correto');
    console.error('2. Verifique se CLOUDFLARE_API_TOKEN está válido e não expirou');
    console.error('3. Verifique conectividade com https://api.cloudflare.com');
    process.exit(1);
  }
}

testCloudflare();
