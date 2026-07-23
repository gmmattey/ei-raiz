import type { Env } from '../types/env';
import type { ExtractionResult, ExtractionEntry } from '../types/contracts';

const EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['document', 'entries', 'warnings', 'errors'],
  properties: {
    document: {
      type: 'object',
      additionalProperties: false,
      required: [
        'documentId',
        'fileName',
        'mimeType',
        'documentType',
        'importable',
        'parserMode',
        'providerUsed',
        'confidence'
      ],
      properties: {
        documentId: { type: 'string' },
        fileName: { type: 'string' },
        mimeType: { type: 'string' },
        documentType: { type: 'string' },
        importable: { type: 'boolean' },
        parserMode: { type: 'string' },
        providerUsed: { type: 'string' },
        confidence: { type: 'number' }
      }
    },
    entries: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'sourceKind',
          'code',
          'name',
          'quantity',
          'investedAmount',
          'currentAmount',
          'categoryLabel',
          'notes',
          'sourceTrace',
          'warnings'
        ],
        properties: {
          sourceKind: {
            type: 'string',
            enum: ['ACOES', 'FUNDOS', 'PREVIDENCIA']
          },
          code: { type: 'string' },
          name: { type: 'string' },
          quantity: { type: 'number' },
          investedAmount: { type: 'number' },
          currentAmount: { type: 'number' },
          categoryLabel: { type: 'string' },
          notes: { type: 'string' },
          sourceTrace: {
            type: 'object',
            additionalProperties: false,
            required: ['fieldMap'],
            properties: {
              fieldMap: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['source', 'confidence'],
                  properties: {
                    source: { type: 'string' },
                    confidence: { type: 'number' }
                  }
                }
              }
            }
          },
          warnings: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },
    warnings: {
      type: 'array',
      items: { type: 'string' }
    },
    errors: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

const GEMINI_INLINE_SAFE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf'
]);

const OPENAI_DIRECT_FILE_MIME = new Set([
  'application/pdf'
]);

export interface ExtractionRequest {
  fileName: string;
  mimeType: string;
  extractedText?: string;
  fileBase64?: string;
  documentId?: string;
}

export async function runExtraction(
  env: Env,
  input: ExtractionRequest
): Promise<ExtractionResult> {
  const documentId = input.documentId || `doc_${crypto.randomUUID()}`;

  const rule = tryRuleExtraction(documentId, input);
  if (rule && rule.document.confidence >= 0.9) {
    await persistAudit(env, documentId, 'rule', 'rule', input, rule);
    return rule;
  }

  const aiPrompt = buildExtractionPrompt(documentId, input);
  let openAiError = '';

  try {
    const openAiResult = await callOpenAI(env, input, aiPrompt);
    const validated = validateResult(documentId, input, openAiResult, 'openai');
    await persistAudit(env, documentId, 'rule,openai', 'openai', input, validated);
    return mergeRuleWarning(rule, validated);
  } catch (error) {
    openAiError = String(error);
  }

  const geminiResult = await callGemini(env, input, aiPrompt);
  const validatedGemini = validateResult(
    documentId,
    input,
    geminiResult,
    'gemini'
  );

  if (openAiError) {
    validatedGemini.warnings.unshift(
      `OpenAI fallback acionado por erro: ${openAiError}`
    );
  }

  await persistAudit(
    env,
    documentId,
    'rule,openai,gemini',
    'gemini',
    input,
    validatedGemini
  );

  return mergeRuleWarning(rule, validatedGemini);
}

function mergeRuleWarning(
  rule: ExtractionResult | null,
  result: ExtractionResult
): ExtractionResult {
  if (rule?.warnings?.length) {
    result.warnings = [...rule.warnings, ...result.warnings];
  }
  return result;
}

function tryRuleExtraction(
  documentId: string,
  input: ExtractionRequest
): ExtractionResult | null {
  const text = (input.extractedText || '').trim();
  if (!text) return null;

  const type = classifyDocument(text, input.fileName);
  const importable =
    type === 'portfolio_statement' || type === 'account_statement';

  const entries = parseRuleEntries(text);

  if (!entries.length) {
    return {
      document: {
        documentId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        documentType: type,
        importable,
        parserMode: 'rule',
        providerUsed: 'rule',
        confidence: importable ? 0.35 : 0.95
      },
      entries: [],
      warnings: ['Regra simples não encontrou linhas suficientes para preencher a carteira.'],
      errors: []
    };
  }

  return {
    document: {
      documentId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      documentType: type,
      importable,
      parserMode: 'rule',
      providerUsed: 'rule',
      confidence: 0.92
    },
    entries,
    warnings: [],
    errors: []
  };
}

function classifyDocument(text: string, fileName: string): string {
  const raw = `${fileName} ${text}`.toLowerCase();

  if (
    raw.includes('prospecto') ||
    raw.includes('lâmina') ||
    raw.includes('lamina') ||
    raw.includes('rentabilidade passada')
  ) {
    return 'product_prospectus';
  }

  if (
    raw.includes('posição') ||
    raw.includes('posicao') ||
    raw.includes('carteira') ||
    raw.includes('custódia') ||
    raw.includes('custodia') ||
    raw.includes('saldo em custódia')
  ) {
    return 'portfolio_statement';
  }

  if (raw.includes('extrato')) {
    return 'account_statement';
  }

  return 'unknown';
}

function parseRuleEntries(text: string): ExtractionEntry[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const results: ExtractionEntry[] = [];

  for (const line of lines) {
    const match = line.match(
      /^([A-Z]{4,6}\d{0,2})\s+(.+?)\s+(\d+[\d.,]*)\s+(\d+[\d.,]*)\s+(\d+[\d.,]*)$/
    );

    if (!match) continue;

    const code = match[1];
    const name = match[2].trim();
    const quantity = toNumber(match[3]);
    const averagePrice = toNumber(match[4]);
    const currentAmount = toNumber(match[5]);
    const investedAmount = quantity * averagePrice;
    const sourceKind = inferSourceKind(code, name);

    results.push({
      sourceKind,
      code,
      name,
      quantity,
      investedAmount,
      currentAmount,
      categoryLabel: mapCategory(sourceKind),
      notes: 'Extraído por regra simples',
      sourceTrace: {
        fieldMap: {
          sourceKind: { source: 'rule', confidence: 0.95 },
          code: { source: 'rule', confidence: 0.98 },
          name: { source: 'rule', confidence: 0.9 },
          quantity: { source: 'rule', confidence: 0.92 },
          investedAmount: { source: 'rule', confidence: 0.88 },
          currentAmount: { source: 'rule', confidence: 0.88 }
        }
      },
      warnings: []
    });
  }

  return results;
}

function buildExtractionPrompt(
  documentId: string,
  input: ExtractionRequest
): string {
  return [
    'Converta o documento em um JSON estritamente aderente ao schema.',
    'Classifique documentType e importable.',
    'Se for prospecto ou material de produto, marque importable=false e não invente posições do usuário.',
    'Cada campo deve voltar com sourceTrace.fieldMap usando source=ai quando inferido.',
    `documentId: ${documentId}`,
    `fileName: ${input.fileName}`,
    `mimeType: ${input.mimeType}`,
    input.extractedText
      ? `extractedText:\n${input.extractedText}`
      : 'Sem extractedText disponível.'
  ].join('\n\n');
}

async function callOpenAI(
  env: Env,
  input: ExtractionRequest,
  prompt: string
): Promise<any> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY ausente');
  }

  const content = buildOpenAIContent(input, prompt);

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-4.1-mini',
      input: [{ role: 'user', content }],
      text: {
        format: {
          type: 'json_schema',
          name: 'document_extraction_result',
          strict: true,
          schema: EXTRACTION_SCHEMA
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI HTTP ${response.status}: ${await response.text()}`);
  }

  const json = await response.json<any>();
  const text = json.output_text || extractOpenAIText(json);

  if (!text) {
    throw new Error('OpenAI sem output_text');
  }

  return JSON.parse(text);
}

function buildOpenAIContent(
  input: ExtractionRequest,
  prompt: string
): any[] {
  const content: any[] = [{ type: 'input_text', text: prompt }];

  if (input.fileBase64 && input.mimeType.startsWith('image/')) {
    content.push({
      type: 'input_image',
      image_url: `data:${input.mimeType};base64,${input.fileBase64}`
    });
    return content;
  }

  if (input.fileBase64 && OPENAI_DIRECT_FILE_MIME.has(input.mimeType)) {
    content.push({
      type: 'input_file',
      filename: input.fileName || 'document.pdf',
      file_data: input.fileBase64
    });
    return content;
  }

  if (input.extractedText) {
    return content;
  }

  throw new Error('OpenAI requer imagem, PDF ou extractedText nesta versão');
}

async function callGemini(
  env: Env,
  input: ExtractionRequest,
  prompt: string
): Promise<any> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY ausente');
  }

  const parts: any[] = [{ text: prompt }];

  if (input.fileBase64) {
    if (shouldUploadToGeminiFileApi(input)) {
      const fileUri = await uploadFileToGemini(env, input);
      parts.push({
        file_data: {
          mime_type: input.mimeType,
          file_uri: fileUri
        }
      });
    } else {
      parts.push({
        inline_data: {
          mime_type: input.mimeType,
          data: input.fileBase64
        }
      });
    }
  } else if (input.extractedText) {
    parts.push({ text: input.extractedText });
  } else {
    throw new Error('Gemini requer fileBase64 ou extractedText');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      env.GEMINI_MODEL || 'gemini-2.5-flash'
    )}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY || '')}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: 'Responda somente JSON válido e aderente ao schema.' }]
        },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: EXTRACTION_SCHEMA
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini HTTP ${response.status}: ${await response.text()}`);
  }

  const json = await response.json<any>();
  const text =
    json.candidates?.[0]?.content?.parts
      ?.map((part: any) => part.text || '')
      .join('') || '';

  if (!text) {
    throw new Error('Gemini sem texto estruturado');
  }

  return JSON.parse(text);
}

function shouldUploadToGeminiFileApi(input: ExtractionRequest): boolean {
  if (!input.fileBase64) return false;
  if (!GEMINI_INLINE_SAFE_MIME.has(input.mimeType)) return true;
  return estimatedBinarySize(input.fileBase64) > 18 * 1024 * 1024;
}

async function uploadFileToGemini(
  env: Env,
  input: ExtractionRequest
): Promise<string> {
  const bytes = base64ToUint8Array(input.fileBase64 || '');

  const startResponse = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(
      env.GEMINI_API_KEY || ''
    )}`,
    {
      method: 'POST',
      headers: {
        'x-goog-upload-protocol': 'resumable',
        'x-goog-upload-command': 'start',
        'x-goog-upload-header-content-length': String(bytes.byteLength),
        'x-goog-upload-header-content-type': input.mimeType,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        file: {
          display_name: input.fileName || 'document'
        }
      })
    }
  );

  if (!startResponse.ok) {
    throw new Error(
      `Gemini upload start HTTP ${startResponse.status}: ${await startResponse.text()}`
    );
  }

  const uploadUrl = startResponse.headers.get('x-goog-upload-url');
  if (!uploadUrl) {
    throw new Error('Gemini upload sem x-goog-upload-url');
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'content-length': String(bytes.byteLength),
      'x-goog-upload-offset': '0',
      'x-goog-upload-command': 'upload, finalize'
    },
    body: bytes
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Gemini upload finalize HTTP ${uploadResponse.status}: ${await uploadResponse.text()}`
    );
  }

  const uploadJson = await uploadResponse.json<any>();
  const fileUri = uploadJson?.file?.uri;

  if (!fileUri) {
    throw new Error('Gemini upload sem file.uri');
  }

  return String(fileUri);
}

function validateResult(
  documentId: string,
  input: ExtractionRequest,
  result: any,
  provider: 'openai' | 'gemini'
): ExtractionResult {
  const doc = result?.document || {};
  const entries = Array.isArray(result?.entries) ? result.entries : [];

  return {
    document: {
      documentId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      documentType: String(
        doc.documentType || classifyDocument(input.extractedText || '', input.fileName)
      ),
      importable: Boolean(doc.importable),
      parserMode: 'ai',
      providerUsed: provider,
      confidence: Math.max(0, Math.min(1, Number(doc.confidence || 0.6)))
    },
    entries: entries.map((entry: any) => ({
      sourceKind: normalizeSourceKind(entry.sourceKind),
      code: String(entry.code || ''),
      name: String(entry.name || ''),
      quantity: Number(entry.quantity || 0),
      investedAmount: Number(entry.investedAmount || 0),
      currentAmount: Number(entry.currentAmount || 0),
      categoryLabel: String(
        entry.categoryLabel || mapCategory(normalizeSourceKind(entry.sourceKind))
      ),
      notes: String(entry.notes || 'Extraído via IA'),
      sourceTrace: {
        fieldMap: normalizeFieldMap(entry.sourceTrace?.fieldMap)
      },
      warnings: Array.isArray(entry.warnings)
        ? entry.warnings.map(String)
        : []
    })),
    warnings: Array.isArray(result?.warnings)
      ? result.warnings.map(String)
      : [],
    errors: Array.isArray(result?.errors)
      ? result.errors.map(String)
      : []
  };
}

function normalizeFieldMap(
  fieldMap: Record<string, any> | undefined
): Record<string, { source: 'rule' | 'ai' | 'manual'; confidence: number }> {
  const output: Record<
    string,
    { source: 'rule' | 'ai' | 'manual'; confidence: number }
  > = {};

  for (const key of [
    'sourceKind',
    'code',
    'name',
    'quantity',
    'investedAmount',
    'currentAmount'
  ]) {
    const item = fieldMap?.[key] || {};
    output[key] = {
      source:
        item.source === 'rule' || item.source === 'manual'
          ? item.source
          : 'ai',
      confidence: Math.max(0, Math.min(1, Number(item.confidence || 0.65)))
    };
  }

  return output;
}

async function persistAudit(
  env: Env,
  documentId: string,
  attempted: string,
  used: string,
  requestPayload: ExtractionRequest,
  result: ExtractionResult
): Promise<void> {
  await env.AUDIT_DB.prepare(
    `INSERT INTO extraction_runs (
      id,
      document_id,
      provider_attempted,
      provider_used,
      request_json,
      normalized_json,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  )
    .bind(
      `run_${crypto.randomUUID()}`,
      documentId,
      attempted,
      used,
      JSON.stringify(requestPayload),
      JSON.stringify(result),
      result.errors.length ? 'completed_with_errors' : 'completed'
    )
    .run();
}

function extractOpenAIText(response: any): string {
  const outputs = response.output || [];

  for (const item of outputs) {
    const contents = item.content || [];
    for (const content of contents) {
      if (typeof content.text === 'string') return content.text;
    }
  }

  return '';
}

function inferSourceKind(
  code: string,
  name: string
): 'ACOES' | 'FUNDOS' | 'PREVIDENCIA' {
  const raw = `${code} ${name}`.toLowerCase();

  if (
    raw.includes('previd') ||
    raw.includes('vgbl') ||
    raw.includes('pgbl')
  ) {
    return 'PREVIDENCIA';
  }

  if (
    raw.includes('fundo') ||
    raw.includes('fic') ||
    raw.includes('fia') ||
    raw.includes('multimercado')
  ) {
    return 'FUNDOS';
  }

  return 'ACOES';
}

function normalizeSourceKind(
  value: unknown
): 'ACOES' | 'FUNDOS' | 'PREVIDENCIA' {
  const raw = String(value || '').toUpperCase();

  if (raw === 'FUNDOS') return 'FUNDOS';
  if (raw === 'PREVIDENCIA') return 'PREVIDENCIA';
  return 'ACOES';
}

function mapCategory(
  sourceKind: 'ACOES' | 'FUNDOS' | 'PREVIDENCIA'
): string {
  if (sourceKind === 'FUNDOS') return 'Fundos';
  if (sourceKind === 'PREVIDENCIA') return 'Previdência';
  return 'Ações';
}

function toNumber(value: string): number {
  const sanitized = value
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');

  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function estimatedBinarySize(base64: string): number {
  return Math.floor((base64.length * 3) / 4);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const normalized = base64.includes(',')
    ? base64.split(',').pop() || ''
    : base64;

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
"}}
