export const AI_ANALYSIS_CONTEXTS = ['portfolio', 'asset'] as const
export const AI_OBSERVATION_TONES = ['neutral', 'attention', 'positive'] as const

export type AiAnalysisContext = typeof AI_ANALYSIS_CONTEXTS[number]
export type AiObservationTone = typeof AI_OBSERVATION_TONES[number]

export interface AiAnalyzeInput {
  context: AiAnalysisContext
  asset_id?: number
}

export interface AiAnalysisObservation {
  tone: AiObservationTone
  text: string
}

export interface AiAnalysisResponse {
  observations: AiAnalysisObservation[]
  disclaimer: string
  generated_at?: string
}
