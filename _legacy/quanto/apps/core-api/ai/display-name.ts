export async function generateDisplayName(
  ai: unknown,
  db: D1Database,
  assetId: number,
  rawName: string,
): Promise<void> {
  const prompt = `You are a financial asset name formatter for Brazilian investors.
Convert the raw fund/asset name to a short, friendly display name in Portuguese.
Rules: max 30 chars, keep the institution name if recognizable, remove legal suffixes (SA, LTDA, FI, FIA, FIC, etc).
Examples:
  "FI RF SIMPLES BANCO XP SA" → "XP Simples RF"
  "BTG PACTUAL TESOURO SELIC FI RF" → "BTG Tesouro Selic"
  "ITAÚ PERSONNALITÉ AÇÕES FIC FIA" → "Itaú Personnalité Ações"
  "CPLE3" → "CPLE3"

Raw name: ${rawName}
Display name:`

  const aiRunner = ai as {
    run: (model: string, opts: { messages: { role: string; content: string }[] }) => Promise<{ response?: string }>
  }

  const result = await aiRunner.run('@cf/meta/llama-3.2-1b-instruct', {
    messages: [{ role: 'user', content: prompt }],
  })

  const displayName = (result.response ?? '').trim().replace(/^["']|["']$/g, '').trim()
  if (displayName && displayName.length <= 60) {
    await db.prepare(`UPDATE assets SET display_name = ? WHERE id = ?`).bind(displayName, assetId).run()
  }
}
