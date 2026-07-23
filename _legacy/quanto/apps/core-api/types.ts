export type Bindings = {
  DB: D1Database
  BRAPI_TOKEN: string
  BRAPI_BASE_URL: string
  JWT_SECRET: string
  AI?: Ai
}

export type Variables = {
  userId: number
}
