export interface FundSearchResult {
  cnpj: string
  name: string
  manager: string
  class_: string
  classAnbima: string
  benchmark: string
  aum: number | null
}

export interface FundSearchResponse {
  results: FundSearchResult[]
}
