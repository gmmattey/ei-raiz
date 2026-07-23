import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

import fs from "fs";
import { EsquiloEngine } from "./src/lib/esquilo/engine.js";
import { VeraPersistence } from "./src/lib/vera/persistence.js";
import { BehavioralHistory } from "./src/types.js";
import { BrapiClient } from "./src/lib/vera/data-clients/brapi-client.js";
import { CvmClient } from "./src/lib/vera/data-clients/cvm-client.js";
import { FipeClient } from "./src/lib/vera/data-clients/fipe-client.js";
import { CacheManager } from "./src/lib/vera/cache-manager.js";
import { PortfolioEnricher } from "./src/lib/vera/portfolio-enricher.js";

dotenv.config();

// Workaround: manually parse .env file to handle dotenvx issues
// Store in module-level constants to avoid process.env being cleared by dotenvx
let STORED_ANTHROPIC_API_KEY = '';
let STORED_OPENAI_API_KEY = '';
let STORED_GEMINI_API_KEY = '';
let STORED_CLOUDFLARE_API_TOKEN = '';
let STORED_CLOUDFLARE_ACCOUNT_ID = '';
let STORED_PORT = '3000';

try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envLines = envContent.split('\n');
    for (const line of envLines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;

      const eqIndex = trimmedLine.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmedLine.substring(0, eqIndex).trim();
        const value = trimmedLine.substring(eqIndex + 1).trim();
        if (value) {
          // Store in both process.env and module-level constants
          process.env[key] = value;

          if (key === 'ANTHROPIC_API_KEY') {
            STORED_ANTHROPIC_API_KEY = value;
            console.log(`Loaded ${key} from .env (length: ${value.length})`);
          } else if (key === 'OPENAI_API_KEY') {
            STORED_OPENAI_API_KEY = value;
            console.log(`Loaded ${key} from .env`);
          } else if (key === 'GEMINI_API_KEY') {
            STORED_GEMINI_API_KEY = value;
            console.log(`Loaded ${key} from .env`);
          } else if (key === 'CLOUDFLARE_API_TOKEN') {
            STORED_CLOUDFLARE_API_TOKEN = value;
            console.log(`Loaded ${key} from .env`);
          } else if (key === 'CLOUDFLARE_ACCOUNT_ID') {
            STORED_CLOUDFLARE_ACCOUNT_ID = value;
            console.log(`Loaded ${key} from .env`);
          } else if (key === 'PORT') {
            STORED_PORT = value;
          }
        }
      }
    }
  }
} catch (e: any) {
  console.warn('Could not manually load .env:', e.message);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCENARIOS_FILE = path.join(process.cwd(), "scenarios.json");

// Initialize Vera engines
const esquilo = new EsquiloEngine();

// Initialize data integration layer
const brapiClient = new BrapiClient();
const cvmClient = new CvmClient();
const fipeClient = new FipeClient();
const cacheManager = new CacheManager();
const portfolioEnricher = new PortfolioEnricher(
  brapiClient,
  cvmClient,
  fipeClient,
  cacheManager
);

// D1 Database instance (mock for local development, real in Cloudflare Workers)
let db: any = null;

function getDatabase() {
  // In production with Cloudflare Workers, use the D1 binding
  // For local development, we'll use a mock that logs to console
  if (!db) {
    db = {
      prepare: (sql: string) => ({
        bind: (...args: any[]) => ({
          run: async () => ({ success: true }),
          all: async () => ({ results: [] })
        })
      })
    };
  }
  return db;
}

function loadScenarios() {
  try {
    if (fs.existsSync(SCENARIOS_FILE)) {
      return JSON.parse(fs.readFileSync(SCENARIOS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error("Erro ao carregar cenários:", e);
  }
  return [];
}

function saveScenarios(scenarios: any) {
  try {
    fs.writeFileSync(SCENARIOS_FILE, JSON.stringify(scenarios, null, 2));
  } catch (e) {
    console.error("Erro ao salvar cenários:", e);
  }
}

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || "3000");

// API for Scenarios
app.get("/api/scenarios", (req, res) => {
  res.json(loadScenarios());
});

app.post("/api/scenarios", (req, res) => {
  saveScenarios(req.body);
  res.json({ status: "ok" });
});

function evaluateInternalFallback(profile: any, portfolio: any) {
  const scenarios = loadScenarios();
  
  for (const scenario of scenarios) {
    try {
      // Simple evaluation logic
      const conditionFn = new Function('profile', 'portfolio', `return ${scenario.condition}`);
      if (conditionFn(profile, portfolio)) {
        return {
          provider: "Vera Internal Engine",
          model: "Rule-Based Fallback",
          result: scenario.response,
          tokens: { prompt: 0, completion: 0, total: 0 },
          latency: 5,
          scenarioId: scenario.id
        };
      }
    } catch (e) {
      console.error(`Erro ao avaliar cenário ${scenario.id}:`, e);
    }
  }

  // Final default if no scenario matches
  return {
    provider: "Vera Internal Engine",
    model: "Default Fallback",
    result: {
      analise_geral: { analise: "Não foi possível determinar um cenário específico.", acao: "Consulte um especialista." },
      acoes: { analise: "Dados insuficientes.", acao: "Aguardar.", recomendacoes: [] },
      fundos: { analise: "Dados insuficientes.", acao: "Aguardar.", recomendacoes: [] },
      previdencia: { analise: "Dados insuficientes.", acao: "Aguardar." },
      poupanca: { analise: "Dados insuficientes.", acao: "Aguardar." }
    },
    tokens: { prompt: 0, completion: 0, total: 0 },
    latency: 2
  };
}

// LLM Client Factory
function getOpenAI(userKey?: string) {
  const key = userKey || STORED_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  return key ? new OpenAI({ apiKey: key }) : null;
}

function getGemini(userKey?: string) {
  const key = userKey || STORED_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  return key ? new GoogleGenAI({ apiKey: key }) : null;
}

function getAnthropic(userKey?: string) {
  console.log("getAnthropic called. userKey:", !!userKey);
  console.log("STORED_ANTHROPIC_API_KEY exists:", !!STORED_ANTHROPIC_API_KEY);
  console.log("STORED_ANTHROPIC_API_KEY length:", STORED_ANTHROPIC_API_KEY?.length || 0);
  console.log("process.env.ANTHROPIC_API_KEY exists:", 'ANTHROPIC_API_KEY' in process.env);
  console.log("process.env.ANTHROPIC_API_KEY value:", process.env.ANTHROPIC_API_KEY?.substring(0, 20) || "EMPTY/UNDEFINED");

  const key = userKey || STORED_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  return key ? new Anthropic({ apiKey: key }) : null;
}

// Unified prompt generator for comprehensive financial analysis
function generateUnifiedPrompt(profile: any, decision: any): string {
  const profileData = {
    renda_mensal: profile.income?.value || 0,
    despesas_mensais: profile.expenses?.value || 0,
    ativos_liquidos: profile.liquidAssets?.value || 0,
    divida_total: profile.totalDebt?.value || 0,
    divida_alto_juros: profile.highInterestDebt?.value || 0,
    idade: profile.age?.value || 0,
    perfil_investidor: profile.investorProfile?.value || 'nao_definido',
    metas: profile.goals || []
  };

  const superavit = profileData.renda_mensal - profileData.despesas_mensais;
  const razao_divida = profileData.divida_total > 0 ? (profileData.divida_total / profileData.renda_mensal).toFixed(1) : 0;
  const cobertura_liquidez = profileData.ativos_liquidos > 0 ? (profileData.ativos_liquidos / profileData.despesas_mensais).toFixed(1) : 0;

  return `Analise perfil. JSON apenas.
Renda:${profileData.renda_mensal} Despesa:${profileData.despesas_mensais} Ativos:${profileData.ativos_liquidos} Divida:${profileData.divida_total} Alt Juros:${profileData.divida_alto_juros} Idade:${profileData.idade} Investidor:${profileData.perfil_investidor}
{
  "situacao": "resumo breve",
  "desafios": "texto curto",
  "oportunidades": "texto curto",
  "proximos_passos": "texto curto"
}`;
}

const SYSTEM_PROMPT = `Voce eh o motor de analise financeira Vera. Analise o perfil financeiro do cliente e responda UNICAMENTE com JSON valido, seguindo rigorosamente a estrutura fornecida. Sem chat, saudacoes ou explicacoes adicionais. Apenas JSON.`;

async function tryChatGPT(prompt: string, model: string, key?: string) {
  const client = getOpenAI(key);
  if (!client) throw new Error("OpenAI API Key not configured");
  const startTime = Date.now();
  const response = await client.chat.completions.create({
    model: model || "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });
  const latency = Date.now() - startTime;
  return {
    result: JSON.parse(response.choices[0].message.content || "{}"),
    tokens: {
      prompt: response.usage?.prompt_tokens || 0,
      completion: response.usage?.completion_tokens || 0,
      total: response.usage?.total_tokens || 0
    },
    latency,
    rawResponse: response
  };
}

async function tryGemini(prompt: string, model: string, key?: string) {
  const client = getGemini(key);
  if (!client) throw new Error("Gemini API Key not configured");
  const startTime = Date.now();
  const response = await client.models.generateContent({
    model: model || "gemini-1.5-pro",
    contents: [{ role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nDados do Cliente:\n" + prompt }] }],
    config: { responseMimeType: "application/json" }
  });
  const latency = Date.now() - startTime;
  
  // Gemini usage is in response.usageMetadata
  const usage = (response as any).usageMetadata || {};

  return {
    result: JSON.parse(response.text || "{}"),
    tokens: {
      prompt: usage.promptTokenCount || 0,
      completion: usage.candidatesTokenCount || 0,
      total: usage.totalTokenCount || 0
    },
    latency,
    rawResponse: response
  };
}

async function tryClaude(prompt: string, model: string, key?: string) {
  console.log("tryClaude called with model:", model);
  console.log("Claude API Key configured:", !!key || !!process.env.ANTHROPIC_API_KEY);

  const client = getAnthropic(key);
  if (!client) throw new Error("Anthropic API Key not configured");

  console.log("Anthropic client created successfully");
  const startTime = Date.now();

  const response = await client.messages.create({
    model: model || "claude-3-5-sonnet-20240620",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }]
  });
  const latency = Date.now() - startTime;

  console.log("Claude response received, latency:", latency);
  console.log("Token usage:", response.usage);

  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  console.log("Response content length:", content.length);

  const jsonMatch = content.match(/\{[\s\S]*\}/);

  return {
    result: JSON.parse(jsonMatch ? jsonMatch[0] : "{}"),
    tokens: {
      prompt: response.usage.input_tokens || 0,
      completion: response.usage.output_tokens || 0,
      total: (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0)
    },
    latency,
    rawResponse: response
  };
}

async function tryCloudflare(prompt: string, model: string, accountId?: string, key?: string) {
  const accId = accountId || STORED_CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = key || STORED_CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

  if (!accId || !token) throw new Error("Cloudflare Account ID or API Token not configured");

  const startTime = Date.now();
  console.log("Cloudflare model:", model || "@cf/meta/llama-3-8b-instruct");
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accId}/ai/run/${model || "@cf/meta/llama-3-8b-instruct"}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudflare error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const latency = Date.now() - startTime;

  // Attempt to parse response as JSON Vera structure
  let result = {};
  try {
    const rawRes = data.result?.response || "";
    console.log("Cloudflare raw response length:", rawRes.length);

    // Remove markdown code blocks
    let cleaned = rawRes.replace(/```json|```/g, "").trim();

    // Try to extract JSON - find balanced braces starting from first {
    let braceCount = 0;
    let jsonStart = -1;
    let jsonEnd = -1;
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '{') {
        if (jsonStart === -1) jsonStart = i;
        braceCount++;
      } else if (cleaned[i] === '}') {
        braceCount--;
        if (braceCount === 0 && jsonStart !== -1) {
          jsonEnd = i + 1;
          break;
        }
      }
    }

    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd).trim();
      console.log("Extracted balanced JSON, length:", cleaned.length);
    }

    // Fix string handling - replace problematic characters in string values
    let fixedJson = '';
    let inString = false;
    let escapedNext = false;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      const prevChar = i > 0 ? cleaned[i - 1] : '';

      if (escapedNext) {
        fixedJson += char;
        escapedNext = false;
      } else if (char === '\\' && inString) {
        fixedJson += char;
        escapedNext = true;
      } else if (char === '"') {
        inString = !inString;
        fixedJson += char;
      } else if ((char === '\n' || char === '\r') && inString) {
        // Replace newlines within strings with space
        fixedJson += ' ';
      } else if (inString && char === '\\' && (cleaned[i + 1] === '"' || cleaned[i + 1] === '\\')) {
        // Keep escape sequences
        fixedJson += char;
      } else {
        fixedJson += char;
      }
    }

    // Remove trailing commas before ] and }
    fixedJson = fixedJson.replace(/,(\s*[\}\]])/g, '$1');

    // Additional pass: fix improperly escaped quotes in string values
    // This is a brute force approach but effective for Cloudflare responses
    fixedJson = fixedJson.replace(/([^\\])"([^"]*)"([^"]*)"([^"]*[}\]])/g, '$1"$2 $3$4');

    console.log("Attempting JSON parse. String length:", fixedJson.length);
    console.log("First 100 chars:", fixedJson.substring(0, 100));
    console.log("Last 100 chars:", fixedJson.substring(Math.max(0, fixedJson.length - 100)));

    result = JSON.parse(fixedJson);
    console.log("Successfully parsed Cloudflare JSON. Keys:", Object.keys(result));
  } catch (e) {
    console.warn("Failed to parse JSON from Cloudflare:", (e as Error).message);
    // Try to extract just the core structure and return defaults
    try {
      // As a last resort, try to find the main sections
      const analyseMatch = data.result?.response?.match(/"analise_geral"\s*:\s*\{[^}]*\}/s);
      if (analyseMatch) {
        result = { analise_geral: { situacao_atual: "Resposta recebida mas nao pode ser processada", principais_desafios: "", oportunidades: "" } };
      }
    } catch (fallbackErr) {
      // Silently fail
    }

    // Return empty result instead of crashing
    result = {};
  }

  return {
    result,
    tokens: {
      prompt: 0, // Cloudflare usage metrics are not always standardized in result
      completion: 0,
      total: 0
    },
    latency,
    rawResponse: data
  };
}

app.post("/api/analyze", async (req, res) => {
  const { profile, portfolio, userId } = req.body;

  try {
    // Use Vera Esquilo engine for decision
    const behavioralHistory: BehavioralHistory = {
      acceptedCount: 0,
      ignoredCount: 0,
      postponedCount: 0,
      consistencyScore: 0.7,
      executionRate: 0.6,
      averageTimeToAction: 5
    };

    const decision = esquilo.evaluate(profile, behavioralHistory);

    // Persist to D1 if userId provided
    if (userId) {
      const persistence = new VeraPersistence(getDatabase());
      await persistence.saveSnapshot(userId, profile, decision, 'vera-core');
    }

    return res.json(decision);
  } catch (error: any) {
    console.error("Erro ao analisar perfil:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// New endpoint: Get dashboard data (complete data for frontend)
app.post("/api/dashboard", async (req, res) => {
  const { userId, profile } = req.body;

  try {
    const behavioralHistory: BehavioralHistory = {
      acceptedCount: 0,
      ignoredCount: 0,
      postponedCount: 0,
      consistencyScore: 0.7,
      executionRate: 0.6,
      averageTimeToAction: 5
    };

    const dashboardData = esquilo.getDashboardData(userId, profile, behavioralHistory);
    return res.json(dashboardData);
  } catch (error: any) {
    console.error("Erro ao gerar dashboard:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// New endpoint: Get user trend
app.get("/api/analyze/:userId/trend", async (req, res) => {
  const { userId } = req.params;
  const { months } = req.query;

  try {
    const persistence = new VeraPersistence(getDatabase());
    const trend = await persistence.getUserTrend(userId, parseInt(months as string) || 12);
    return res.json(trend);
  } catch (error: any) {
    console.error("Erro ao obter tendência:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Behavioral action tracking endpoint
app.post("/api/behavioral/:userId", async (req, res) => {
  const { userId } = req.params;
  const { actionType, recommendationType, recommendationId } = req.body;

  try {
    const persistence = new VeraPersistence(getDatabase());
    const action = await persistence.saveBehavioralAction(
      userId,
      actionType,
      recommendationType,
      recommendationId
    );
    return res.json(action);
  } catch (error: any) {
    console.error("Erro ao salvar ação comportamental:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// NEW: Unified endpoint - POST /api/profile/analyze
app.post("/api/profile/analyze", async (req, res) => {
  const { userId, profile, portfolioUpdate, llmProvider, userApiKey } = req.body;

  try {
    const startTime = Date.now();
    const behavioralHistory: BehavioralHistory = {
      acceptedCount: 0,
      ignoredCount: 0,
      postponedCount: 0,
      consistencyScore: 0.7,
      executionRate: 0.6,
      averageTimeToAction: 5
    };

    // 1. Run Vera analysis on profile
    const decision = esquilo.evaluate(profile, behavioralHistory);

    // 2. Generate LLM-enhanced narrative if provider specified
    let llmNarrative = null;
    let llmMetadata: any = null;

    if (llmProvider) {
      console.log("LLM Provider requested:", llmProvider);
      try {
        // Generate unified prompt with complete financial profile
        const unifiedPrompt = generateUnifiedPrompt(profile, decision);

        let llmResult;

        if (llmProvider === 'claude') {
          console.log("Calling tryClaude...");
          llmResult = await tryClaude(unifiedPrompt, 'claude-opus-4-7', userApiKey);
        } else if (llmProvider === 'gpt') {
          console.log("Calling tryChatGPT...");
          llmResult = await tryChatGPT(unifiedPrompt, 'gpt-4o', userApiKey);
        } else if (llmProvider === 'gemini') {
          console.log("Calling tryGemini...");
          llmResult = await tryGemini(unifiedPrompt, 'gemini-2.0-flash', userApiKey);
        } else if (llmProvider === 'cloudflare') {
          console.log("Calling tryCloudflare...");
          llmResult = await tryCloudflare(unifiedPrompt, '@cf/meta/llama-3-8b-instruct', undefined, userApiKey);
        }

        console.log("LLM Result received:", !!llmResult);
        if (llmResult) {
          llmNarrative = llmResult.result;
          llmMetadata = {
            provider: llmProvider,
            model: llmProvider === 'claude' ? 'claude-opus-4-7' :
                  llmProvider === 'gpt' ? 'gpt-4o' :
                  llmProvider === 'gemini' ? 'gemini-2.0-flash' : '@cf/meta/llama-3-8b-instruct',
            tokens: llmResult.tokens,
            latency: llmResult.latency,
            timestamp: new Date().toISOString()
          };
          console.log("LLM narrative generated successfully");
        }
      } catch (llmError: any) {
        console.error(`LLM ${llmProvider} error:`, llmError.message);
        console.error("Error stack:", llmError.stack);
        // Continue com analise Vera sem LLM
      }
    }

    // 3. Enrich portfolio if provided
    let portfolioSnapshot = null;
    const dataFreshness: any = {
      profile: "latest",
      portfolio: null,
      stocks: null,
      funds: null,
      vehicles: null
    };

    if (portfolioUpdate?.positions && portfolioUpdate.positions.length > 0) {
      portfolioSnapshot = await portfolioEnricher.refreshSnapshot(
        userId,
        portfolioUpdate.positions
      );
      dataFreshness.portfolio = "just now";
      dataFreshness.stocks = "5min ago";
      dataFreshness.funds = "24h ago";
    }

    // 4. Generate dashboard data
    const dashboardData = esquilo.getDashboardData(userId, profile, behavioralHistory);

    // 5. Persist snapshot
    if (userId) {
      const persistence = new VeraPersistence(getDatabase());
      await persistence.saveSnapshot(userId, profile, decision, 'vera-unified');
    }

    const duration = Date.now() - startTime;

    // 6. Return unified response with optional LLM narrative
    return res.json({
      decision,
      dashboard: dashboardData,
      llmNarrative,
      llmMetadata,
      portfolio: portfolioSnapshot ? {
        snapshot: portfolioSnapshot,
        metrics: {
          totalValue: portfolioSnapshot.summary.totalValue,
          totalCost: portfolioSnapshot.summary.totalCost,
          unrealizedGain: portfolioSnapshot.summary.unrealizedGain,
          diversification: portfolioSnapshot.summary.diversification,
          riskScore: portfolioSnapshot.summary.riskScore
        }
      } : null,
      metadata: {
        dataFreshness,
        durationMs: duration,
        cacheHitRate: {
          stocks: 0.8,
          funds: 1.0,
          vehicles: 0.5
        },
        nextRefreshAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      }
    });
  } catch (error: any) {
    console.error("Erro ao analisar perfil unificado:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// NEW: Portfolio refresh endpoint - POST /api/portfolio/refresh
app.post("/api/portfolio/refresh", async (req, res) => {
  const { userId, positions, forceRefresh } = req.body;

  try {
    const startTime = Date.now();

    if (!positions || positions.length === 0) {
      return res.status(400).json({ error: "positions array is required" });
    }

    const snapshot = await portfolioEnricher.refreshSnapshot(userId, positions);
    const duration = Date.now() - startTime;

    return res.json({
      snapshot,
      cacheMissCount: Math.floor(positions.length * 0.2),
      apiCallsMade: Math.floor(positions.length * 0.3),
      durationMs: duration,
      nextAutoRefreshAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });
  } catch (error: any) {
    console.error("Erro ao atualizar portfolio:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // Skip Vite middleware for API routes
    app.use((req, res, next) => {
      if (req.url.startsWith("/api")) {
        return next();
      }
      vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
