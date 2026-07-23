import type { AiAnalysisResponse as AnalysisResult } from '../packages/contracts/ai'
export type { AiAnalysisObservation as AnalysisObservation, AiAnalysisResponse as AnalysisResult } from '../packages/contracts/ai'

export async function generateDisplayName(ai: Ai, rawName: string): Promise<string | null> {
  try {
    const result = await (ai as any).run('@cf/meta/llama-3.2-1b-instruct', {
      prompt: 'Convert this Brazilian financial asset name to a short friendly Portuguese name (max 30 chars, no legal suffixes like SA/LTDA/FI). Raw name: ' + rawName + '\nShort name:',
      max_tokens: 40,
    })
    const text = (result?.response ?? result?.result?.response ?? '').trim().split('\n')[0].trim()
    return text.length > 0 && text.length <= 60 ? text : null
  } catch {
    return null
  }
}

export async function analyzeContext(ai: Ai, contextJson: string): Promise<AnalysisResult | null> {
  try {
    const result = await (ai as any).run('@cf/meta/llama-3.2-3b-instruct', {
      prompt: 'Analise a carteira de investimentos brasileira abaixo em 3-5 observacoes factuais em portugues. Nao faca recomendacoes. Foque em concentracao e diversificacao. Retorne JSON: {"observations":[{"tone":"neutral","text":"..."}]}\n\nCarteira: ' + contextJson + '\n\nJSON:',
      max_tokens: 600,
    })
    const text = (result?.response ?? result?.result?.response ?? '').trim()
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    return {
      observations: parsed.observations ?? [],
      disclaimer: 'Esta analise e gerada por inteligencia artificial com fins informativos e nao constitui recomendacao de investimento. Consulte um assessor certificado (AAI/CNPI) antes de tomar decisoes financeiras.',
    }
  } catch {
    return null
  }
}
