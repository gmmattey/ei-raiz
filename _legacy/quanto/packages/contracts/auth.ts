export interface AuthUser {
  id: number
  email: string
  name: string | null
}

export interface AuthLoginInput {
  email: string
  password: string
}

export interface AuthRegisterInput {
  email: string
  password: string
  name?: string | null
  cpf: string
  birth_date: string
}

export interface AuthRecoverInput {
  email: string
  cpf: string
  birth_date: string
  new_password: string
}

export interface AuthTokenResponse {
  token: string
  expiresAt: string
  user: AuthUser
}

export interface AuthSession {
  token: string
  expiresAt: string | null
  user: AuthUser | null
}
