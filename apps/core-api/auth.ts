import type { Hono } from 'hono'
import type { Bindings, Variables } from './types'

type CoreApiApp = Hono<{ Bindings: Bindings; Variables: Variables }>

type AuthDeps = {
  hashPassword: (password: string) => Promise<string>
  verifyPassword: (password: string, stored: string) => Promise<boolean>
  signToken: (
    userId: number,
    email: string,
    secret: string,
    ttlSeconds?: number,
  ) => Promise<{ token: string; expiresAt: string }>
  verifyToken: (token: string, secret: string) => Promise<{ userId: number; email: string } | null>
}

const PUBLIC_PATHS = ['/api/health', '/api/funds/search', '/api/auth/register', '/api/auth/login', '/api/auth/recover']

function getJwtSecret(env: Bindings): string | null {
  const secret = env.JWT_SECRET?.trim()
  return secret ? secret : null
}

async function hasColumn(db: D1Database, tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all<{
      name: string
    }>()
    return result.results.some((row) => row.name === columnName)
  } catch {
    return false
  }
}

export function registerAuthRoutes(app: CoreApiApp, deps: AuthDeps) {
  const { hashPassword, verifyPassword, signToken } = deps

  app.post('/api/auth/register', async (c) => {
    const db = c.env.DB
    const jwtSecret = getJwtSecret(c.env)
    let body: Record<string, unknown>
    try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON body' }, 400) }

    if (!jwtSecret) {
      return c.json({ error: 'JWT_SECRET não configurado no ambiente' }, 500)
    }

    const supportsRecoveryFields = (await hasColumn(db, 'users', 'cpf')) && (await hasColumn(db, 'users', 'birth_date'))
    if (!supportsRecoveryFields) {
      return c.json({ error: 'Cadastro temporariamente indisponível enquanto a base é atualizada para campos de recuperação' }, 503)
    }

    const email = (body.email as string)?.trim().toLowerCase()
    const password = body.password as string
    const name = (body.name as string)?.trim() || null
    const cpf = body.cpf ? (body.cpf as string).replace(/\D/g, '') || null : null
    const birth_date = (body.birth_date as string) || null

    if (!email || !email.includes('@')) return c.json({ error: 'Email inválido' }, 400)
    if (!password || password.length < 6) return c.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, 400)
    if (!cpf || cpf.length !== 11) return c.json({ error: 'CPF obrigatório (necessário para recuperar a senha)' }, 400)
    if (!birth_date) return c.json({ error: 'Data de nascimento obrigatória (necessária para recuperar a senha)' }, 400)

    try {
      const existing = await db
        .prepare('SELECT id, password_hash FROM users WHERE email = ?')
        .bind(email)
        .first<{ id: number; password_hash: string | null }>()

      if (existing?.password_hash) {
        return c.json({ error: 'Email já cadastrado' }, 409)
      }

      const passwordHash = await hashPassword(password)
      let userId: number

      if (existing) {
        await db.prepare('UPDATE users SET password_hash = ?, name = COALESCE(?, name), cpf = COALESCE(?, cpf), birth_date = COALESCE(?, birth_date) WHERE id = ?')
          .bind(passwordHash, name, cpf, birth_date, existing.id).run()
        userId = existing.id
      } else {
        const row = await db
          .prepare('INSERT INTO users (email, password_hash, name, cpf, birth_date) VALUES (?, ?, ?, ?, ?) RETURNING id')
          .bind(email, passwordHash, name, cpf, birth_date)
          .first<{ id: number }>()
        if (!row) throw new Error('Insert failed')
        userId = row.id
      }

      const { token, expiresAt } = await signToken(userId, email, jwtSecret)
      return c.json({ token, expiresAt, user: { id: userId, email, name } }, 201)
    } catch (err) {
      console.error('POST /api/auth/register', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.post('/api/auth/login', async (c) => {
    const db = c.env.DB
    const jwtSecret = getJwtSecret(c.env)
    let body: Record<string, unknown>
    try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON body' }, 400) }

    if (!jwtSecret) {
      return c.json({ error: 'JWT_SECRET não configurado no ambiente' }, 500)
    }

    const email = (body.email as string)?.trim().toLowerCase()
    const password = body.password as string

    if (!email || !password) return c.json({ error: 'Email e senha obrigatórios' }, 400)

    try {
      const user = await db
        .prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?')
        .bind(email)
        .first<{ id: number; email: string; name: string | null; password_hash: string | null }>()

      if (!user?.password_hash) {
        return c.json({ error: 'Email ou senha incorretos' }, 401)
      }

      const valid = await verifyPassword(password, user.password_hash)
      if (!valid) {
        return c.json({ error: 'Email ou senha incorretos' }, 401)
      }

      const { token, expiresAt } = await signToken(user.id, user.email, jwtSecret)
      return c.json({ token, expiresAt, user: { id: user.id, email: user.email, name: user.name } })
    } catch (err) {
      console.error('POST /api/auth/login', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  app.post('/api/auth/recover', async (c) => {
    const db = c.env.DB
    let body: Record<string, unknown>
    try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON body' }, 400) }

    const supportsRecoveryFields = (await hasColumn(db, 'users', 'cpf')) && (await hasColumn(db, 'users', 'birth_date'))
    if (!supportsRecoveryFields) {
      return c.json({ error: 'Recuperação temporariamente indisponível enquanto a base é atualizada' }, 503)
    }

    const email = (body.email as string)?.trim().toLowerCase()
    const cpfRaw = body.cpf as string | undefined
    const birth_date = (body.birth_date as string) || ''
    const new_password = body.new_password as string

    if (!email || !email.includes('@')) return c.json({ error: 'Dados incorretos' }, 400)
    const cpf = cpfRaw ? cpfRaw.replace(/\D/g, '') : ''
    if (cpf.length !== 11) return c.json({ error: 'Dados incorretos' }, 400)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) return c.json({ error: 'Dados incorretos' }, 400)
    if (!new_password || new_password.length < 6) return c.json({ error: 'Dados incorretos' }, 400)

    try {
      const user = await db
        .prepare('SELECT id, cpf, birth_date FROM users WHERE email = ?')
        .bind(email)
        .first<{ id: number; cpf: string | null; birth_date: string | null }>()

      if (!user) return c.json({ error: 'Dados incorretos' }, 400)

      const storedCpf = user.cpf ? user.cpf.replace(/\D/g, '') : ''
      if (storedCpf !== cpf || user.birth_date !== birth_date) {
        return c.json({ error: 'Dados incorretos' }, 400)
      }

      const passwordHash = await hashPassword(new_password)
      await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .bind(passwordHash, user.id).run()

      return c.json({ ok: true })
    } catch (err) {
      console.error('POST /api/auth/recover', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })
}

export function registerAuthMiddleware(app: CoreApiApp, deps: Pick<AuthDeps, 'verifyToken'>) {
  const { verifyToken } = deps

  app.use('/api/*', async (c, next) => {
    if (PUBLIC_PATHS.includes(c.req.path)) return next()

    const jwtSecret = getJwtSecret(c.env)
    if (!jwtSecret) {
      return c.json({ error: 'JWT_SECRET não configurado no ambiente' }, 500)
    }

    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Token ausente' }, 401)
    }

    const token = authHeader.slice(7)
    const payload = await verifyToken(token, jwtSecret)
    if (!payload) {
      return c.json({ error: 'Token inválido ou expirado' }, 401)
    }

    c.set('userId', payload.userId)
    return next()
  })
}
