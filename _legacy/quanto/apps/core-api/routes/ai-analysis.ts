import type { Hono } from 'hono'
import {
  AI_ANALYSIS_CONTEXTS,
  type AiAnalysisContext,
  type AiAnalysisResponse,
  type AiObservationTone,
} from '../../../packages/contracts/ai'
import type { Bindings, Variables } from '../types'

type AiAnalysisApp = Hono<{ Bindings: Bindings; Variables: Variables }>

export function registerAiAnalysisRoutes(app: AiAnalysisApp) {
  app.post('/api/ai/analyze', async (c) => {
    const userId = c.get('userId')
    const db = c.env.DB

    if (!c.env.AI) {
      return c.json({ error: 'AI service not available' }, 503)
    }

    let body: Record<string, unknown>
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    const context = body.context as AiAnalysisContext | undefined
    const assetId = body.asset_id as number | undefined

    if (!context || !AI_ANALYSIS_CONTEXTS.includes(context)) {
      return c.json({ error: "field 'context' must be 'portfolio' or 'asset'" }, 400)
    }
    if (context === 'asset' && (!assetId || !Number.isInteger(assetId) || assetId < 1)) {
      return c.json({ error: "field 'asset_id' is required for context 'asset'" }, 400)
    }

    try {
      let contextJson: string

      if (context === 'portfolio') {
        const summary = await db.prepare(
          `SELECT total_balance, total_invested FROM vw_portfolio_summary WHERE user_id = ?`,
        ).bind(userId).first<{ total_balance: number; total_invested: number }>()

        const byClass = await db.prepare(
          `SELECT class, total_balance FROM vw_allocation_by_class WHERE user_id = ? ORDER BY total_balance DESC`,
        ).bind(userId).all<{ class: string; total_balance: number }>()

        const byInst = await db.prepare(
          `SELECT institution, institution_name, total_balance FROM vw_allocation_by_institution WHERE user_id = ? ORDER BY total_balance DESC`,
        ).bind(userId).all<{ institution: string; institution_name: string | null; total_balance: number }>()

        const topAssets = await db.prepare(
          `SELECT a.name, a.class, a.institution,
             CASE WHEN a.ticker IS NOT NULL THEN a.qty * COALESCE(q.price, 0) ELSE COALESCE(a.manual_balance, 0) END AS balance
           FROM assets a
           LEFT JOIN quotes_cache q ON q.ticker = a.ticker
           WHERE a.user_id = ? AND a.status = 'active'
           ORDER BY balance DESC LIMIT 5`,
        ).bind(userId).all<{ name: string; class: string; institution: string; balance: number }>()

        const recentSnapshots = await db.prepare(
          `SELECT month, total FROM snapshots WHERE user_id = ? ORDER BY month DESC LIMIT 3`,
        ).bind(userId).all<{ month: string; total: number }>()

        const total = summary?.total_balance ?? 0
        contextJson = JSON.stringify({
          total,
          invested: summary?.total_invested ?? 0,
          gain: summary?.total_invested ? total - summary.total_invested : null,
          byClass: byClass.results,
          byInstitution: byInst.results,
          top5Assets: topAssets.results,
          recentSnapshots: recentSnapshots.results,
        })
      } else {
        const asset = await db.prepare(
          `SELECT a.*, q.price,
             CASE WHEN a.ticker IS NOT NULL THEN a.qty * COALESCE(q.price, 0) ELSE COALESCE(a.manual_balance, 0) END AS balance
           FROM assets a
           LEFT JOIN quotes_cache q ON q.ticker = a.ticker
           WHERE a.id = ? AND a.user_id = ? AND a.status != 'archived'`,
        ).bind(assetId, userId).first<Record<string, unknown>>()

        if (!asset) return c.json({ error: 'Asset not found' }, 404)

        const portfolioSummary = await db.prepare(
          `SELECT total_balance FROM vw_portfolio_summary WHERE user_id = ?`,
        ).bind(userId).first<{ total_balance: number }>()

        const balance = (asset.balance as number) ?? 0
        const portfolioTotal = portfolioSummary?.total_balance ?? 0

        contextJson = JSON.stringify({
          name: asset.name,
          class: asset.class,
          institution: asset.institution,
          ticker: asset.ticker ?? null,
          qty: asset.qty ?? null,
          price: asset.price ?? null,
          balance,
          invested: asset.invested ?? null,
          gain: asset.invested ? balance - (asset.invested as number) : null,
          assetPct: portfolioTotal > 0 ? (balance / portfolioTotal) * 100 : 0,
          portfolioTotal,
          balanceUpdatedAt: asset.balance_updated_at ?? null,
          quoteSource: asset.quote_source ?? null,
        })
      }

      const prompt = context === 'portfolio'
        ? `Você é um assistente de análise patrimonial para o app Quanto.
Analise os dados da carteira abaixo e gere de 3 a 5 observações factuais em português,
sem fazer recomendações de compra, venda ou rebalanceamento.
Foque em: concentração, diversificação, frescor dos dados, performance relativa.
Use linguagem direta, sem jargões. Máximo 2 linhas por observação.

Carteira:
${contextJson}

Responda SOMENTE em JSON com o campo "observations": array de objetos com "tone" (neutral/attention/positive) e "text".`
        : `Você é um assistente de análise patrimonial para o app Quanto.
Analise os dados do ativo abaixo e gere de 2 a 4 observações factuais em português,
sem fazer recomendações de compra, venda ou rebalanceamento.
Foque em: posição atual, concentração no portfólio, frescor dos dados.
Use linguagem direta, sem jargões. Máximo 2 linhas por observação.

Ativo:
${contextJson}

Responda SOMENTE em JSON com o campo "observations": array de objetos com "tone" (neutral/attention/positive) e "text".`

      const aiResponse = await (c.env.AI as unknown as {
        run: (model: string, opts: { messages: { role: string; content: string }[] }) => Promise<{ response?: string }>
      }).run('@cf/meta/llama-3.2-3b-instruct', {
        messages: [{ role: 'user', content: prompt }],
      })

      let observations: AiAnalysisResponse['observations'] = []
      try {
        const raw = aiResponse.response ?? ''
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (Array.isArray(parsed.observations)) {
            observations = parsed.observations.filter((item: unknown): item is { tone: AiObservationTone; text: string } => {
              if (!item || typeof item !== 'object') return false
              const tone = (item as { tone?: string }).tone
              const text = (item as { text?: string }).text
              return (tone === 'neutral' || tone === 'attention' || tone === 'positive') && typeof text === 'string'
            })
          }
        }
      } catch {
        observations = [{ tone: 'neutral', text: 'Não foi possível gerar observações no momento.' }]
      }

      const response: AiAnalysisResponse = {
        observations,
        disclaimer: 'Esta análise é gerada por inteligência artificial com fins informativos e não constitui recomendação de investimento. Consulte um assessor certificado (AAI/CNPI) antes de tomar decisões financeiras.',
        generated_at: new Date().toISOString(),
      }

      return c.json(response)
    } catch (err) {
      console.error('POST /api/ai/analyze', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })
}
