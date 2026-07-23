/**
 * Test script to validate provider cascade and error handling
 * Tests each provider's connectivity without requiring running server
 */

import dotenv from 'dotenv';
dotenv.config();

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const testProfile = { idade: 35, renda_mensal: 5000, patrimonio: 50000 };
const testPortfolio = { acoes: 20000, renda_fixa: 15000, caixa: 15000 };

async function testProvider(name: string, test: () => Promise<any>) {
  try {
    console.log(`\n🔍 Testando ${name}...`);
    const startTime = Date.now();
    const result = await test();
    const latency = Date.now() - startTime;
    console.log(`✅ ${name}: Conectado (${latency}ms)`);
    return { success: true, provider: name, latency };
  } catch (error: any) {
    console.log(`❌ ${name}: ${error.message}`);
    return { success: false, provider: name, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testando Cascade de Provedores IA\n');
  console.log('📋 Credenciais configuradas:');
  console.log(`  • Cloudflare: ${CLOUDFLARE_ACCOUNT_ID ? '✓' : '✗'}`);
  console.log(`  • OpenAI: ${OPENAI_API_KEY ? '✓' : '✗'}`);
  console.log(`  • Gemini: ${GEMINI_API_KEY ? '✓' : '✗'}`);
  console.log(`  • Anthropic: ${ANTHROPIC_API_KEY ? '✓' : '✗'}`);

  const results = [];

  // Test Cloudflare
  results.push(
    await testProvider('Cloudflare AI', async () => {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "Você é um assistente." },
              { role: "user", content: "Olá" }
            ]
          })
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
  );

  // Test OpenAI
  results.push(
    await testProvider('OpenAI', async () => {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
  );

  // Test Gemini
  results.push(
    await testProvider('Google Gemini', async () => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
        { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok && response.status !== 400) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
  );

  // Test Anthropic
  results.push(
    await testProvider('Anthropic Claude', async () => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ model: 'claude-3-opus-20240229', max_tokens: 1, messages: [] })
      });
      if (!response.ok && response.status !== 400) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
  );

  console.log('\n\n📊 Resultado do Cascade:');
  console.log('─'.repeat(50));

  const successCount = results.filter(r => r.success).length;
  for (const result of results) {
    const icon = result.success ? '✅' : '❌';
    const status = result.success ? `${result.latency}ms` : result.error;
    console.log(`${icon} ${result.provider.padEnd(20)} ${status}`);
  }

  console.log('─'.repeat(50));
  console.log(`\n✨ Provedores funcionando: ${successCount}/${results.length}`);

  if (successCount === 0) {
    console.log('\n⚠️ NENHUM provedor está respondendo.');
    console.log('Ações necessárias:');
    console.log('1. Verifique as credenciais em .env');
    console.log('2. Confirme que as chaves API estão válidas');
    console.log('3. Verifique conectividade com internet');
    console.log('4. Estude a documentação de cada provedor');
  } else if (successCount === 1) {
    console.log('\n✅ Sistema funcionará em MODO DEGRADADO (1 provedor disponível)');
  } else {
    console.log(`\n✅ Sistema funcionará com REDUNDÂNCIA (${successCount} provedores disponíveis)`);
  }
}

runTests();
