export interface HistoryPoint {
  month: string
  total: number
  invested: number
  gain: number
  gainPct: number
}

export type PortfolioHistory = HistoryPoint[]

export interface CreateSnapshotResponse {
  month: string
  total: number
  invested: number
  created: boolean
}
