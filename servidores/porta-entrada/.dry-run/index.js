var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  __name(assertIs, "assertIs");
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  __name(assertNever, "assertNever");
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  __name(joinValues, "joinValues");
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);

// ../../node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var ZodError = class _ZodError extends Error {
  static {
    __name(this, "ZodError");
  }
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = /* @__PURE__ */ __name((error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }, "processError");
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// src/infra/http.ts
var erro = /* @__PURE__ */ __name((codigo, mensagem, status = 400, detalhes) => ({ ok: false, status, codigo, mensagem, detalhes }), "erro");
var sucesso = /* @__PURE__ */ __name((dados) => ({ ok: true, dados }), "sucesso");
async function lerJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
__name(lerJson, "lerJson");
var metodoNaoPermitido = /* @__PURE__ */ __name((metodo) => erro("metodo_nao_permitido", `M\xE9todo ${metodo} n\xE3o permitido`, 405), "metodoNaoPermitido");
var naoEncontrado = /* @__PURE__ */ __name(() => erro("nao_encontrado", "Recurso n\xE3o encontrado", 404), "naoEncontrado");

// src/infra/cripto.ts
var ITERACOES = 12e4;
var SALT_BYTES = 16;
var HASH_BYTES = 32;
var ITERACOES_FALLBACK = 2e4;
function b64encBytes(bytes) {
  const btoa = globalThis.btoa;
  if (btoa) return btoa(String.fromCharCode(...bytes));
  const Buf = globalThis.Buffer;
  if (Buf) return Buf.from(bytes).toString("base64");
  throw new Error("BASE64_ENCODE_UNAVAILABLE");
}
__name(b64encBytes, "b64encBytes");
function b64decBytes(v) {
  const atob = globalThis.atob;
  if (atob) return Uint8Array.from(atob(v), (c) => c.charCodeAt(0));
  const Buf = globalThis.Buffer;
  if (Buf) return new Uint8Array(Buf.from(v, "base64"));
  throw new Error("BASE64_DECODE_UNAVAILABLE");
}
__name(b64decBytes, "b64decBytes");
function b64encStr(v) {
  const btoa = globalThis.btoa;
  if (btoa) return btoa(v);
  const Buf = globalThis.Buffer;
  if (Buf) return Buf.from(v, "binary").toString("base64");
  throw new Error("BASE64_ENCODE_UNAVAILABLE");
}
__name(b64encStr, "b64encStr");
function b64decStr(v) {
  const atob = globalThis.atob;
  if (atob) return atob(v);
  const Buf = globalThis.Buffer;
  if (Buf) return Buf.from(v, "base64").toString("binary");
  throw new Error("BASE64_DECODE_UNAVAILABLE");
}
__name(b64decStr, "b64decStr");
var b64url = /* @__PURE__ */ __name((v) => b64encStr(v).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""), "b64url");
var b64urlBytes = /* @__PURE__ */ __name((b) => b64encBytes(b).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""), "b64urlBytes");
var b64urlDec = /* @__PURE__ */ __name((v) => b64decStr(v.replace(/-/g, "+").replace(/_/g, "/")), "b64urlDec");
var b64urlDecBytes = /* @__PURE__ */ __name((v) => b64decBytes(v.replace(/-/g, "+").replace(/_/g, "/")), "b64urlDecBytes");
var toAB = /* @__PURE__ */ __name((b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), "toAB");
async function derivar(senha, salt, iteracoes) {
  const enc = new TextEncoder();
  try {
    const key = await crypto.subtle.importKey("raw", enc.encode(senha), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: toAB(salt), iterations: iteracoes },
      key,
      HASH_BYTES * 8
    );
    return new Uint8Array(bits);
  } catch {
    const ef = Math.max(1, Math.min(iteracoes, ITERACOES_FALLBACK));
    let atual = new Uint8Array([...salt, ...enc.encode(senha)]);
    for (let i = 0; i < ef; i += 1) {
      const d = await crypto.subtle.digest("SHA-256", atual);
      atual = new Uint8Array([...new Uint8Array(d), ...salt]);
    }
    return atual.slice(0, HASH_BYTES);
  }
}
__name(derivar, "derivar");
async function gerarHashSenha(senha) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derivar(senha, salt, ITERACOES);
  return `${ITERACOES}:${b64encBytes(salt)}:${b64encBytes(hash)}`;
}
__name(gerarHashSenha, "gerarHashSenha");
async function validarSenha(senha, hash) {
  const [it, sB, hB] = hash.split(":");
  const iteracoes = Number.parseInt(it, 10);
  if (!iteracoes || !sB || !hB) return false;
  const salt = b64decBytes(sB);
  const esperado = b64decBytes(hB);
  const atual = await derivar(senha, salt, iteracoes);
  if (atual.length !== esperado.length) return false;
  let diff = 0;
  for (let i = 0; i < atual.length; i += 1) diff |= atual[i] ^ esperado[i];
  return diff === 0;
}
__name(validarSenha, "validarSenha");
async function emitirToken(dados, segredo, validadeSegundos = 60 * 60 * 8) {
  const iat = Math.floor(Date.now() / 1e3);
  const payload = { sub: dados.usuarioId, email: dados.email, iat, exp: iat + validadeSegundos };
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${body}`));
  return {
    token: `${header}.${body}.${b64urlBytes(new Uint8Array(sig))}`,
    expiraEm: new Date(payload.exp * 1e3).toISOString()
  };
}
__name(emitirToken, "emitirToken");
async function validarToken(token, segredo) {
  const [header, body, sig] = token.split(".");
  if (!header || !body || !sig) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("HMAC", key, toAB(b64urlDecBytes(sig)), enc.encode(`${header}.${body}`));
  if (!ok) return null;
  const payload = JSON.parse(b64urlDec(body));
  const agora2 = Math.floor(Date.now() / 1e3);
  if (!payload.sub || !payload.email || payload.exp <= agora2) return null;
  return { usuarioId: payload.sub, email: payload.email };
}
__name(validarToken, "validarToken");
var gerarPin = /* @__PURE__ */ __name(() => {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1e6;
  return n.toString().padStart(6, "0");
}, "gerarPin");

// src/infra/bd.ts
var criarBd = /* @__PURE__ */ __name((env) => ({
  async consultar(sql, ...valores) {
    const stmt = env.DB.prepare(sql).bind(...valores);
    const { results } = await stmt.all();
    return results ?? [];
  },
  async primeiro(sql, ...valores) {
    const stmt = env.DB.prepare(sql).bind(...valores);
    return await stmt.first() ?? null;
  },
  async executar(sql, ...valores) {
    const stmt = env.DB.prepare(sql).bind(...valores);
    const resp = await stmt.run();
    return {
      sucesso: resp.success,
      linhasAfetadas: resp.meta?.changes ?? 0
    };
  },
  async emLote(operacoes) {
    if (operacoes.length === 0) return;
    const stmts = operacoes.map(({ sql, valores }) => env.DB.prepare(sql).bind(...valores));
    await env.DB.batch(stmts);
  }
}), "criarBd");
var agora = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString(), "agora");
var gerarId = /* @__PURE__ */ __name(() => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}, "gerarId");

// src/dominios/auth/auth.repositorio.ts
var repositorioAuth = /* @__PURE__ */ __name((bd) => ({
  async buscarUsuarioPorEmail(email) {
    return bd.primeiro(
      `SELECT id, nome, cpf, email, senha_hash, criado_em, atualizado_em
         FROM usuarios WHERE email = ? LIMIT 1`,
      email.toLowerCase()
    );
  },
  async buscarUsuarioPorId(id) {
    return bd.primeiro(
      `SELECT id, nome, cpf, email, senha_hash, criado_em, atualizado_em
         FROM usuarios WHERE id = ? LIMIT 1`,
      id
    );
  },
  async buscarUsuarioPorCpf(cpf) {
    return bd.primeiro(
      `SELECT id, nome, cpf, email, senha_hash, criado_em, atualizado_em
         FROM usuarios WHERE cpf = ? LIMIT 1`,
      cpf
    );
  },
  async inserirUsuario(linha) {
    await bd.executar(
      `INSERT INTO usuarios (id, nome, cpf, email, senha_hash)
       VALUES (?, ?, ?, ?, ?)`,
      linha.id,
      linha.nome,
      linha.cpf,
      linha.email.toLowerCase(),
      linha.senha_hash
    );
  },
  async atualizarSenha(usuarioId, senhaHash) {
    await bd.executar(
      `UPDATE usuarios SET senha_hash = ?, atualizado_em = datetime('now') WHERE id = ?`,
      senhaHash,
      usuarioId
    );
  },
  async ehAdmin(email) {
    const l = await bd.primeiro(
      `SELECT email FROM admin_usuarios WHERE email = ? LIMIT 1`,
      email.toLowerCase()
    );
    return l != null;
  },
  async inserirRecuperacao(linha) {
    await bd.executar(
      `INSERT INTO recuperacoes_acesso (id, usuario_id, pin_hash, expira_em) VALUES (?, ?, ?, ?)`,
      linha.id,
      linha.usuario_id,
      linha.pin_hash,
      linha.expira_em
    );
  },
  async buscarRecuperacoesValidas(usuarioId) {
    return bd.consultar(
      `SELECT id, usuario_id, pin_hash, expira_em, usado_em, criado_em
         FROM recuperacoes_acesso
         WHERE usuario_id = ? AND usado_em IS NULL AND expira_em > datetime('now')
         ORDER BY criado_em DESC`,
      usuarioId
    );
  },
  async marcarRecuperacaoUsada(id) {
    await bd.executar(
      `UPDATE recuperacoes_acesso SET usado_em = datetime('now') WHERE id = ?`,
      id
    );
  }
}), "repositorioAuth");

// src/dominios/auth/auth.servico.ts
var TAMANHO_SENHA_MIN = 8;
var VALIDADE_PIN_MINUTOS = 15;
var limparEmail = /* @__PURE__ */ __name((e) => e.trim().toLowerCase(), "limparEmail");
var limparCpf = /* @__PURE__ */ __name((c) => c.replace(/\D/g, ""), "limparCpf");
async function encontrarRecuperacaoPelo(pin, linhas) {
  for (const linha of linhas) {
    if (await validarSenha(pin, linha.pin_hash)) return linha;
  }
  return null;
}
__name(encontrarRecuperacaoPelo, "encontrarRecuperacaoPelo");
var servicoAuth = /* @__PURE__ */ __name((bd, env) => {
  const repo = repositorioAuth(bd);
  return {
    async registrar(e) {
      if (!e.nome || !e.email || !e.senha || !e.cpf) return erro("dados_incompletos", "Informe nome, CPF, email e senha", 400);
      if (e.senha.length < TAMANHO_SENHA_MIN) return erro("senha_curta", "Senha deve ter ao menos 8 caracteres", 400);
      const email = limparEmail(e.email);
      const cpf = limparCpf(e.cpf);
      if (cpf.length !== 11) return erro("cpf_invalido", "CPF inv\xE1lido", 400);
      if (await repo.buscarUsuarioPorEmail(email)) return erro("email_em_uso", "Email j\xE1 cadastrado", 409);
      if (await repo.buscarUsuarioPorCpf(cpf)) return erro("cpf_em_uso", "CPF j\xE1 cadastrado", 409);
      const id = gerarId();
      const senhaHash = await gerarHashSenha(e.senha);
      await repo.inserirUsuario({ id, nome: e.nome.trim(), cpf, email, senha_hash: senhaHash });
      const token = await emitirToken({ usuarioId: id, email }, env.JWT_SECRET);
      return sucesso(token);
    },
    async entrar(e) {
      if (!e.email || !e.senha) return erro("credenciais_invalidas", "Email ou senha inv\xE1lidos", 401);
      const usuario = await repo.buscarUsuarioPorEmail(limparEmail(e.email));
      if (!usuario) return erro("credenciais_invalidas", "Email ou senha inv\xE1lidos", 401);
      const valida = await validarSenha(e.senha, usuario.senha_hash);
      if (!valida) return erro("credenciais_invalidas", "Email ou senha inv\xE1lidos", 401);
      const token = await emitirToken({ usuarioId: usuario.id, email: usuario.email }, env.JWT_SECRET);
      return sucesso(token);
    },
    async sessao(usuarioId) {
      const u = await repo.buscarUsuarioPorId(usuarioId);
      if (!u) return erro("sessao_invalida", "Sess\xE3o inv\xE1lida", 401);
      const ehAdmin = await repo.ehAdmin(u.email);
      return sucesso({
        usuarioId: u.id,
        email: u.email,
        nome: u.nome,
        ehAdmin,
        criadoEm: u.criado_em
      });
    },
    async recuperarIniciar(e) {
      const u = await repo.buscarUsuarioPorEmail(limparEmail(e.email));
      if (!u) return sucesso({ enviado: true });
      const pin = gerarPin();
      const pinHash = await gerarHashSenha(pin);
      const expira = new Date(Date.now() + VALIDADE_PIN_MINUTOS * 6e4).toISOString();
      await repo.inserirRecuperacao({ id: gerarId(), usuario_id: u.id, pin_hash: pinHash, expira_em: expira });
      return sucesso({ enviado: true });
    },
    async recuperarConfirmar(e) {
      const u = await repo.buscarUsuarioPorEmail(limparEmail(e.email));
      if (!u) return erro("pin_invalido", "PIN inv\xE1lido ou expirado", 400);
      const linhas = await repo.buscarRecuperacoesValidas(u.id);
      const linha = await encontrarRecuperacaoPelo(e.pin, linhas);
      if (!linha) return erro("pin_invalido", "PIN inv\xE1lido ou expirado", 400);
      return sucesso({ valido: true });
    },
    async recuperarRedefinir(e) {
      if (!e.novaSenha || e.novaSenha.length < TAMANHO_SENHA_MIN) {
        return erro("senha_curta", "Senha deve ter ao menos 8 caracteres", 400);
      }
      const u = await repo.buscarUsuarioPorEmail(limparEmail(e.email));
      if (!u) return erro("pin_invalido", "PIN inv\xE1lido ou expirado", 400);
      const linhas = await repo.buscarRecuperacoesValidas(u.id);
      const linha = await encontrarRecuperacaoPelo(e.pin, linhas);
      if (!linha) return erro("pin_invalido", "PIN inv\xE1lido ou expirado", 400);
      const novo = await gerarHashSenha(e.novaSenha);
      await repo.atualizarSenha(u.id, novo);
      await repo.marcarRecuperacaoUsada(linha.id);
      const token = await emitirToken({ usuarioId: u.id, email: u.email }, env.JWT_SECRET);
      return sucesso(token);
    }
  };
}, "servicoAuth");

// src/dominios/auth/auth.rotas.ts
async function rotearAuth(caminho, request, env, sessao) {
  const bd = criarBd(env);
  const servico = servicoAuth(bd, env);
  const metodo = request.method.toUpperCase();
  if (caminho === "/api/auth/registrar" && metodo === "POST") {
    return servico.registrar(await lerJson(request));
  }
  if (caminho === "/api/auth/entrar" && metodo === "POST") {
    return servico.entrar(await lerJson(request));
  }
  if (caminho === "/api/auth/sair" && metodo === "POST") {
    return sucesso({ saiu: true });
  }
  if (caminho === "/api/auth/sessao" && metodo === "GET") {
    if (!sessao) return erro("nao_autenticado", "Sess\xE3o n\xE3o encontrada", 401);
    return servico.sessao(sessao.usuarioId);
  }
  if (caminho === "/api/auth/recuperar/iniciar" && metodo === "POST") {
    return servico.recuperarIniciar(await lerJson(request));
  }
  if (caminho === "/api/auth/recuperar/confirmar" && metodo === "POST") {
    return servico.recuperarConfirmar(await lerJson(request));
  }
  if (caminho === "/api/auth/recuperar/redefinir" && metodo === "POST") {
    return servico.recuperarRedefinir(await lerJson(request));
  }
  if (caminho.startsWith("/api/auth/")) {
    return metodo === "OPTIONS" ? sucesso({}) : naoEncontrado();
  }
  return metodoNaoPermitido(metodo);
}
__name(rotearAuth, "rotearAuth");

// src/dominios/usuario/usuario.repositorio.ts
var repositorioUsuario = /* @__PURE__ */ __name((bd) => ({
  async buscar(usuarioId) {
    return bd.primeiro(
      `SELECT id, nome, cpf, email, criado_em, atualizado_em FROM usuarios WHERE id = ? LIMIT 1`,
      usuarioId
    );
  },
  async atualizar(usuarioId, campos) {
    const partes = [];
    const vals = [];
    if (campos.nome !== void 0) {
      partes.push("nome = ?");
      vals.push(campos.nome);
    }
    if (campos.email !== void 0) {
      partes.push("email = ?");
      vals.push(campos.email.toLowerCase());
    }
    if (partes.length === 0) return;
    partes.push("atualizado_em = datetime('now')");
    vals.push(usuarioId);
    await bd.executar(`UPDATE usuarios SET ${partes.join(", ")} WHERE id = ?`, ...vals);
  },
  async listarPreferencias(usuarioId) {
    return bd.consultar(
      `SELECT chave, valor_json, atualizado_em FROM usuario_preferencias WHERE usuario_id = ?`,
      usuarioId
    );
  },
  async salvarPreferencia(usuarioId, chave, valorJson) {
    await bd.executar(
      `INSERT INTO usuario_preferencias (usuario_id, chave, valor_json, atualizado_em)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(usuario_id, chave) DO UPDATE SET valor_json = excluded.valor_json, atualizado_em = datetime('now')`,
      usuarioId,
      chave,
      valorJson
    );
  },
  async listarPlataformas(usuarioId) {
    return bd.consultar(
      `SELECT up.id, up.corretora_id, c.nome AS corretora_nome, up.status, up.vinculado_em
         FROM usuario_plataformas up
         JOIN corretoras c ON c.id = up.corretora_id
        WHERE up.usuario_id = ?`,
      usuarioId
    );
  }
}), "repositorioUsuario");

// src/dominios/usuario/usuario.servico.ts
var servicoUsuario = /* @__PURE__ */ __name((bd) => {
  const repo = repositorioUsuario(bd);
  return {
    async obter(usuarioId) {
      const u = await repo.buscar(usuarioId);
      if (!u) return erro("usuario_nao_encontrado", "Usu\xE1rio n\xE3o encontrado", 404);
      return sucesso({
        id: u.id,
        nome: u.nome,
        cpf: u.cpf,
        email: u.email,
        criadoEm: u.criado_em,
        atualizadoEm: u.atualizado_em
      });
    },
    async atualizar(usuarioId, e) {
      await repo.atualizar(usuarioId, { nome: e.nome, email: e.email });
      return this.obter(usuarioId);
    },
    async obterPreferencias(usuarioId) {
      const linhas = await repo.listarPreferencias(usuarioId);
      const itens = linhas.map((l) => ({
        chave: l.chave,
        valor: (() => {
          try {
            return JSON.parse(l.valor_json);
          } catch {
            return null;
          }
        })(),
        atualizadoEm: l.atualizado_em
      }));
      return sucesso({ itens });
    },
    async atualizarPreferencias(usuarioId, e) {
      for (const item of e.itens) {
        await repo.salvarPreferencia(usuarioId, item.chave, JSON.stringify(item.valor ?? null));
      }
      return this.obterPreferencias(usuarioId);
    },
    async listarPlataformas(usuarioId) {
      const linhas = await repo.listarPlataformas(usuarioId);
      return sucesso({
        itens: linhas.map((l) => ({
          id: l.id,
          corretoraId: l.corretora_id,
          corretoraNome: l.corretora_nome,
          status: l.status === "desconectada" ? "inativa" : l.status,
          vinculadaEm: l.vinculado_em
        }))
      });
    }
  };
}, "servicoUsuario");

// src/dominios/usuario/usuario.rotas.ts
async function rotearUsuario(caminho, request, env, sessao) {
  if (!sessao) return erro("nao_autenticado", "Sess\xE3o n\xE3o encontrada", 401);
  const servico = servicoUsuario(criarBd(env));
  const metodo = request.method.toUpperCase();
  if (caminho === "/api/usuario" && metodo === "GET") return servico.obter(sessao.usuarioId);
  if (caminho === "/api/usuario" && metodo === "PATCH") {
    return servico.atualizar(sessao.usuarioId, await lerJson(request));
  }
  if (caminho === "/api/usuario/preferencias" && metodo === "GET") return servico.obterPreferencias(sessao.usuarioId);
  if (caminho === "/api/usuario/preferencias" && metodo === "PATCH") {
    return servico.atualizarPreferencias(sessao.usuarioId, await lerJson(request));
  }
  if (caminho === "/api/usuario/plataformas" && metodo === "GET") return servico.listarPlataformas(sessao.usuarioId);
  return caminho.startsWith("/api/usuario") ? naoEncontrado() : metodoNaoPermitido(metodo);
}
__name(rotearUsuario, "rotearUsuario");

// src/dominios/perfil/perfil.repositorio.ts
var repositorioPerfil = /* @__PURE__ */ __name((bd) => ({
  async buscar(usuarioId) {
    return bd.primeiro(
      `SELECT usuario_id, renda_mensal_brl, aporte_mensal_brl, horizonte_meses,
              tolerancia_risco, objetivos_json, atualizado_em
         FROM perfis_financeiros WHERE usuario_id = ? LIMIT 1`,
      usuarioId
    );
  },
  async salvar(linha) {
    await bd.executar(
      `INSERT INTO perfis_financeiros
         (usuario_id, renda_mensal_brl, aporte_mensal_brl, horizonte_meses,
          tolerancia_risco, objetivos_json, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(usuario_id) DO UPDATE SET
         renda_mensal_brl = excluded.renda_mensal_brl,
         aporte_mensal_brl = excluded.aporte_mensal_brl,
         horizonte_meses = excluded.horizonte_meses,
         tolerancia_risco = excluded.tolerancia_risco,
         objetivos_json = excluded.objetivos_json,
         atualizado_em = datetime('now')`,
      linha.usuario_id,
      linha.renda_mensal_brl,
      linha.aporte_mensal_brl,
      linha.horizonte_meses,
      linha.tolerancia_risco,
      linha.objetivos_json
    );
  }
}), "repositorioPerfil");

// src/dominios/perfil/perfil.servico.ts
var perfilVazio = /* @__PURE__ */ __name((usuarioId) => ({
  usuario_id: usuarioId,
  renda_mensal_brl: null,
  aporte_mensal_brl: null,
  horizonte_meses: null,
  tolerancia_risco: null,
  objetivos_json: "[]",
  atualizado_em: (/* @__PURE__ */ new Date()).toISOString()
}), "perfilVazio");
var montarSaida = /* @__PURE__ */ __name((l) => ({
  usuarioId: l.usuario_id,
  rendaMensalBrl: l.renda_mensal_brl,
  aporteMensalBrl: l.aporte_mensal_brl,
  horizonteMeses: l.horizonte_meses,
  toleranciaRisco: l.tolerancia_risco,
  objetivos: (() => {
    try {
      return JSON.parse(l.objetivos_json);
    } catch {
      return [];
    }
  })(),
  atualizadoEm: l.atualizado_em
}), "montarSaida");
var servicoPerfil = /* @__PURE__ */ __name((bd) => {
  const repo = repositorioPerfil(bd);
  return {
    async obter(usuarioId) {
      const linha = await repo.buscar(usuarioId) ?? perfilVazio(usuarioId);
      return sucesso(montarSaida(linha));
    },
    async salvar(usuarioId, e) {
      const atual = await repo.buscar(usuarioId) ?? perfilVazio(usuarioId);
      const mescla = {
        usuario_id: usuarioId,
        renda_mensal_brl: e.rendaMensalBrl ?? atual.renda_mensal_brl,
        aporte_mensal_brl: e.aporteMensalBrl ?? atual.aporte_mensal_brl,
        horizonte_meses: e.horizonteMeses ?? atual.horizonte_meses,
        tolerancia_risco: e.toleranciaRisco ?? atual.tolerancia_risco,
        objetivos_json: e.objetivos ? JSON.stringify(e.objetivos) : atual.objetivos_json,
        atualizado_em: (/* @__PURE__ */ new Date()).toISOString()
      };
      await repo.salvar(mescla);
      return this.obter(usuarioId);
    }
  };
}, "servicoPerfil");

// src/dominios/perfil/perfil.rotas.ts
async function rotearPerfil(caminho, request, env, sessao) {
  if (!sessao) return erro("nao_autenticado", "Sess\xE3o n\xE3o encontrada", 401);
  const servico = servicoPerfil(criarBd(env));
  const metodo = request.method.toUpperCase();
  if (caminho === "/api/perfil" && metodo === "GET") return servico.obter(sessao.usuarioId);
  if (caminho === "/api/perfil" && metodo === "PUT") {
    return servico.salvar(sessao.usuarioId, await lerJson(request));
  }
  return caminho.startsWith("/api/perfil") ? naoEncontrado() : metodoNaoPermitido(metodo);
}
__name(rotearPerfil, "rotearPerfil");

// src/dominios/mercado/mercado.repositorio.ts
var repositorioMercado = /* @__PURE__ */ __name((bd) => ({
  async buscarAtivoPorId(id) {
    return bd.primeiro(`SELECT * FROM ativos WHERE id = ? LIMIT 1`, id);
  },
  async buscarAtivoPorTicker(ticker) {
    return bd.primeiro(`SELECT * FROM ativos WHERE ticker = ? LIMIT 1`, ticker.toUpperCase());
  },
  async buscarAtivoPorCnpj(cnpj) {
    return bd.primeiro(`SELECT * FROM ativos WHERE cnpj = ? LIMIT 1`, cnpj.replace(/\D/g, ""));
  },
  async buscarAtivosPorTexto(termo, tipo, limite) {
    const t = `%${termo.toLowerCase()}%`;
    const tNumerico = termo.replace(/[^0-9]/g, "");
    const tCnpj = tNumerico.length > 0 ? `%${tNumerico}%` : "__nunca__";
    if (tipo) {
      return bd.consultar(
        `SELECT * FROM ativos
          WHERE tipo = ? AND (lower(nome) LIKE ? OR lower(ticker) LIKE ? OR cnpj LIKE ?)
          ORDER BY ticker, nome LIMIT ?`,
        tipo,
        t,
        t,
        tCnpj,
        limite
      );
    }
    return bd.consultar(
      `SELECT * FROM ativos
        WHERE (lower(nome) LIKE ? OR lower(ticker) LIKE ? OR cnpj LIKE ?)
        ORDER BY ticker, nome LIMIT ?`,
      t,
      t,
      tCnpj,
      limite
    );
  },
  async buscarCotacao(ativoId, fonte) {
    return bd.primeiro(
      `SELECT * FROM ativos_cotacoes_cache WHERE ativo_id = ? AND fonte = ? LIMIT 1`,
      ativoId,
      fonte
    );
  },
  async buscarFundoCvm(cnpj) {
    return bd.primeiro(
      `SELECT * FROM fundos_cvm WHERE cnpj = ? LIMIT 1`,
      cnpj.replace(/\D/g, "")
    );
  },
  async ultimaCota(cnpj) {
    return bd.primeiro(
      `SELECT cnpj, data, valor_cota, patrimonio_liquido_brl
         FROM fundos_cvm_cotas WHERE cnpj = ? ORDER BY data DESC LIMIT 1`,
      cnpj.replace(/\D/g, "")
    );
  }
}), "repositorioMercado");

// src/dominios/mercado/mercado.servico.ts
var LIMITE_PADRAO = 20;
var LIMITE_MAXIMO = 100;
var paraAtivoSaida = /* @__PURE__ */ __name((l) => ({
  id: l.id,
  ticker: l.ticker,
  cnpj: l.cnpj,
  isin: l.isin,
  nome: l.nome,
  tipo: l.tipo,
  classe: l.classe,
  subclasse: l.subclasse,
  moeda: l.moeda,
  indexador: l.indexador,
  taxaPct: l.taxa_pct,
  dataInicio: l.data_inicio,
  dataVencimento: l.data_vencimento,
  atualizadoEm: l.atualizado_em
}), "paraAtivoSaida");
var paraCotacao = /* @__PURE__ */ __name((l, ticker) => ({
  ativoId: l.ativo_id,
  ticker,
  fonte: l.fonte,
  precoBrl: l.preco_brl,
  cotadoEm: l.cotado_em,
  expiraEm: l.expira_em
}), "paraCotacao");
var paraFundoCvm = /* @__PURE__ */ __name((f, ultima) => ({
  cnpj: f.cnpj,
  nome: f.nome,
  classe: f.classe,
  situacao: f.situacao,
  ultimaCota: ultima,
  atualizadoEm: f.atualizado_em
}), "paraFundoCvm");
var servicoMercado = /* @__PURE__ */ __name((bd) => {
  const repo = repositorioMercado(bd);
  return {
    async buscar(e) {
      if (!e.q || e.q.trim().length < 1) return sucesso({ itens: [], total: 0 });
      const limite = Math.min(e.limite ?? LIMITE_PADRAO, LIMITE_MAXIMO);
      const linhas = await repo.buscarAtivosPorTexto(e.q.trim(), e.tipo ?? null, limite);
      const itens = linhas.map(paraAtivoSaida);
      return sucesso({ itens, total: itens.length });
    },
    async obterPorTicker(ticker) {
      const ativo = await repo.buscarAtivoPorTicker(ticker);
      if (!ativo) return erro("ativo_nao_encontrado", "Ativo n\xE3o encontrado", 404);
      const cot = await repo.buscarCotacao(ativo.id, "brapi");
      return sucesso({
        ativo: paraAtivoSaida(ativo),
        cotacao: cot ? paraCotacao(cot, ativo.ticker) : null
      });
    },
    async historico(ticker) {
      return sucesso({ ticker: ticker.toUpperCase(), periodo: "1a", itens: [] });
    },
    async obterFundo(cnpj) {
      const f = await repo.buscarFundoCvm(cnpj);
      if (!f) return erro("fundo_nao_encontrado", "Fundo CVM n\xE3o encontrado", 404);
      const u = await repo.ultimaCota(cnpj);
      return sucesso(paraFundoCvm(
        f,
        u ? { data: u.data, valorCota: u.valor_cota, patrimonioLiquidoBrl: u.patrimonio_liquido_brl } : null
      ));
    }
  };
}, "servicoMercado");

// src/dominios/mercado/mercado.rotas.ts
async function rotearMercado(caminho, request, env, _sessao) {
  const servico = servicoMercado(criarBd(env));
  const metodo = request.method.toUpperCase();
  const url = new URL(request.url);
  if (caminho === "/api/mercado/ativos" && metodo === "GET") {
    const q = url.searchParams.get("q") ?? "";
    const tipo = url.searchParams.get("tipo") ?? void 0;
    const limite = Number.parseInt(url.searchParams.get("limite") ?? "20", 10);
    return servico.buscar({ q, tipo, limite });
  }
  const mAtivo = caminho.match(/^\/api\/mercado\/ativos\/([^/]+)$/);
  if (mAtivo && metodo === "GET") return servico.obterPorTicker(mAtivo[1]);
  const mHist = caminho.match(/^\/api\/mercado\/ativos\/([^/]+)\/historico$/);
  if (mHist && metodo === "GET") return servico.historico(mHist[1]);
  const mFundo = caminho.match(/^\/api\/mercado\/fundos-cvm\/([^/]+)$/);
  if (mFundo && metodo === "GET") return servico.obterFundo(mFundo[1]);
  if (caminho.startsWith("/api/mercado/")) return naoEncontrado();
  return metodoNaoPermitido(metodo);
}
__name(rotearMercado, "rotearMercado");

// src/dominios/patrimonio/calculos/alocacao.ts
function calcularAlocacao(itens) {
  const total = itens.reduce((s, i) => s + (Number.isFinite(i.valorBrl) ? i.valorBrl : 0), 0);
  if (total <= 0) return itens.map((i) => ({ ...i, pesoPct: 0 }));
  return itens.map((i) => ({
    classe: i.classe,
    subclasse: i.subclasse,
    valorBrl: i.valorBrl,
    pesoPct: i.valorBrl / total * 100
  }));
}
__name(calcularAlocacao, "calcularAlocacao");

// src/dominios/patrimonio/patrimonio.repositorio.ts
var repositorioPatrimonio = /* @__PURE__ */ __name((bd) => ({
  async resumo(usuarioId) {
    return bd.primeiro(
      `SELECT * FROM vw_patrimonio_resumo WHERE usuario_id = ? LIMIT 1`,
      usuarioId
    );
  },
  async posicoes(usuarioId) {
    return bd.consultar(
      `SELECT * FROM vw_patrimonio_posicoes WHERE usuario_id = ? ORDER BY valor_atual_brl DESC, nome`,
      usuarioId
    );
  },
  async alocacao(usuarioId) {
    return bd.consultar(
      `SELECT usuario_id, tipo, classe, subclasse, quantidade_itens, valor_total_brl
         FROM vw_patrimonio_alocacao WHERE usuario_id = ?`,
      usuarioId
    );
  },
  async evolucao(usuarioId, limiteMeses = 24) {
    return bd.consultar(
      `SELECT usuario_id, ano_mes, patrimonio_bruto_brl, patrimonio_liquido_brl,
              divida_brl, aporte_mes_brl, rentabilidade_mes_pct, eh_confiavel
         FROM vw_patrimonio_evolucao_mensal
         WHERE usuario_id = ?
         ORDER BY ano_mes DESC LIMIT ?`,
      usuarioId,
      limiteMeses
    );
  },
  async buscarItemDetalhe(usuarioId, id) {
    return bd.primeiro(
      `SELECT * FROM vw_patrimonio_posicoes WHERE usuario_id = ? AND item_id = ? LIMIT 1`,
      usuarioId,
      id
    );
  },
  async buscarItemBruto(usuarioId, id) {
    return bd.primeiro(
      `SELECT * FROM patrimonio_itens WHERE usuario_id = ? AND id = ? LIMIT 1`,
      usuarioId,
      id
    );
  },
  async inserirItem(id, usuarioId, ativoId, tipo, origem, nome, quantidade, precoMedioBrl, valorAtualBrl, moeda, dadosJson) {
    await bd.executar(
      `INSERT INTO patrimonio_itens
         (id, usuario_id, ativo_id, tipo, origem, nome, quantidade, preco_medio_brl, valor_atual_brl, moeda, dados_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      usuarioId,
      ativoId,
      tipo,
      origem,
      nome,
      quantidade,
      precoMedioBrl,
      valorAtualBrl,
      moeda,
      dadosJson
    );
  },
  async atualizarItem(id, usuarioId, campos) {
    const partes = [];
    const vals = [];
    const set = /* @__PURE__ */ __name((col, v) => {
      partes.push(`${col} = ?`);
      vals.push(v);
    }, "set");
    if (campos.tipo !== void 0) set("tipo", campos.tipo);
    if (campos.nome !== void 0) set("nome", campos.nome);
    if (campos.quantidade !== void 0) set("quantidade", campos.quantidade);
    if (campos.precoMedioBrl !== void 0) set("preco_medio_brl", campos.precoMedioBrl);
    if (campos.valorAtualBrl !== void 0) set("valor_atual_brl", campos.valorAtualBrl);
    if (campos.moeda !== void 0) set("moeda", campos.moeda);
    if (campos.estaAtivo !== void 0) set("esta_ativo", campos.estaAtivo ? 1 : 0);
    if (campos.dadosJson !== void 0) set("dados_json", campos.dadosJson);
    if (partes.length === 0) return;
    partes.push("atualizado_em = datetime('now')");
    vals.push(id, usuarioId);
    await bd.executar(
      `UPDATE patrimonio_itens SET ${partes.join(", ")} WHERE id = ? AND usuario_id = ?`,
      ...vals
    );
  },
  async removerItem(id, usuarioId) {
    await bd.executar(`DELETE FROM patrimonio_itens WHERE id = ? AND usuario_id = ?`, id, usuarioId);
  },
  async listarAportes(usuarioId, limite = 200) {
    return bd.consultar(
      `SELECT id, usuario_id, item_id, tipo, valor_brl, data, descricao, origem, criado_em
         FROM patrimonio_aportes WHERE usuario_id = ? ORDER BY data DESC, criado_em DESC LIMIT ?`,
      usuarioId,
      limite
    );
  },
  async inserirAporte(id, usuarioId, itemId, tipo, valorBrl, data, descricao, origem) {
    await bd.executar(
      `INSERT INTO patrimonio_aportes
         (id, usuario_id, item_id, tipo, valor_brl, data, descricao, origem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      usuarioId,
      itemId,
      tipo,
      valorBrl,
      data,
      descricao,
      origem
    );
  },
  async removerAporte(id, usuarioId) {
    await bd.executar(`DELETE FROM patrimonio_aportes WHERE id = ? AND usuario_id = ?`, id, usuarioId);
  },
  async scoreAtual(usuarioId) {
    return bd.primeiro(
      `SELECT * FROM vw_patrimonio_score_atual WHERE usuario_id = ? LIMIT 1`,
      usuarioId
    );
  },
  async scoreHistorico(usuarioId, limite = 24) {
    return bd.consultar(
      `SELECT usuario_id, ano_mes, calculado_em, score_total, faixa
         FROM vw_patrimonio_score_historico WHERE usuario_id = ?
         ORDER BY ano_mes DESC LIMIT ?`,
      usuarioId,
      limite
    );
  },
  async inserirImportacao(id, usuarioId, origem) {
    await bd.executar(
      `INSERT INTO importacoes (id, usuario_id, origem, status) VALUES (?, ?, ?, 'pendente')`,
      id,
      usuarioId,
      origem
    );
  },
  async inserirItemImportacao(id, importacaoId, linha, tipo, dadosJson) {
    await bd.executar(
      `INSERT INTO importacao_itens (id, importacao_id, linha, tipo, dados_json) VALUES (?, ?, ?, ?, ?)`,
      id,
      importacaoId,
      linha,
      tipo,
      dadosJson
    );
  },
  async buscarImportacao(id, usuarioId) {
    return bd.primeiro(
      `SELECT id, usuario_id, origem, status, iniciado_em, concluido_em
         FROM importacoes WHERE id = ? AND usuario_id = ? LIMIT 1`,
      id,
      usuarioId
    );
  }
}), "repositorioPatrimonio");

// src/dominios/patrimonio/patrimonio.servico.ts
var paraItemSaida = /* @__PURE__ */ __name((l, totalBrl) => {
  const valor = l.valor_atual_brl ?? 0;
  const peso = totalBrl > 0 ? valor / totalBrl * 100 : null;
  return {
    id: l.item_id,
    usuarioId: l.usuario_id,
    ativoId: l.ativo_id,
    tipo: l.tipo,
    origem: l.origem,
    nome: l.nome,
    ticker: l.ticker,
    cnpj: l.cnpj,
    classeAtivo: l.classe,
    subclasseAtivo: l.subclasse,
    quantidade: l.quantidade,
    precoMedioBrl: l.preco_medio_brl,
    precoAtualBrl: l.preco_atual_brl,
    valorAtualBrl: l.valor_atual_brl,
    rentabilidadePct: l.rentabilidade_pct,
    pesoPct: peso,
    moeda: "BRL",
    criadoEm: l.criado_em,
    atualizadoEm: l.atualizado_em
  };
}, "paraItemSaida");
var paraAporteSaida = /* @__PURE__ */ __name((l) => ({
  id: l.id,
  usuarioId: l.usuario_id,
  itemId: l.item_id,
  tipo: l.tipo,
  valorBrl: l.valor_brl,
  data: l.data,
  descricao: l.descricao,
  origem: l.origem,
  criadoEm: l.criado_em
}), "paraAporteSaida");
var paraEvolucaoSaida = /* @__PURE__ */ __name((l) => ({
  anoMes: l.ano_mes,
  patrimonioBrutoBrl: l.patrimonio_bruto_brl,
  patrimonioLiquidoBrl: l.patrimonio_liquido_brl,
  dividaBrl: l.divida_brl,
  aporteMesBrl: l.aporte_mes_brl,
  rentabilidadeMesPct: l.rentabilidade_mes_pct,
  ehConfiavel: l.eh_confiavel === 1
}), "paraEvolucaoSaida");
var paraAlocacaoSaida = /* @__PURE__ */ __name((linhas) => {
  const base = linhas.map((l) => ({
    tipo: l.tipo,
    classe: l.classe,
    subclasse: l.subclasse,
    quantidadeItens: l.quantidade_itens,
    valorBrl: l.valor_total_brl
  }));
  const calculado = calcularAlocacao(base.map((b) => ({ classe: b.tipo, subclasse: b.subclasse, valorBrl: b.valorBrl })));
  return base.map((b, i) => ({ ...b, pesoPct: calculado[i].pesoPct }));
}, "paraAlocacaoSaida");
var servicoPatrimonio = /* @__PURE__ */ __name((bd) => {
  const repo = repositorioPatrimonio(bd);
  return {
    async resumo(usuarioId) {
      const [resumoLinha, aloc, posicoes, evolucao] = await Promise.all([
        repo.resumo(usuarioId),
        repo.alocacao(usuarioId),
        repo.posicoes(usuarioId),
        repo.evolucao(usuarioId, 24)
      ]);
      const baseResumo = resumoLinha ?? {
        usuario_id: usuarioId,
        patrimonio_bruto_brl: 0,
        divida_brl: 0,
        patrimonio_liquido_brl: 0,
        quantidade_itens: 0,
        score_total: null,
        score_faixa: null,
        score_calculado_em: null,
        aporte_mes_brl: 0,
        rentabilidade_mes_pct: null
      };
      const totalBrl = posicoes.reduce((s, p) => s + (p.valor_atual_brl ?? 0), 0);
      const topN = [...posicoes].sort((a, b) => (b.valor_atual_brl ?? 0) - (a.valor_atual_brl ?? 0)).slice(0, 5).map((p) => paraItemSaida(p, totalBrl));
      return sucesso({
        patrimonioBrutoBrl: baseResumo.patrimonio_bruto_brl,
        patrimonioLiquidoBrl: baseResumo.patrimonio_liquido_brl,
        dividaBrl: baseResumo.divida_brl,
        quantidadeItens: baseResumo.quantidade_itens,
        aporteMesBrl: baseResumo.aporte_mes_brl ?? 0,
        rentabilidadeMesPct: baseResumo.rentabilidade_mes_pct,
        scoreTotal: baseResumo.score_total,
        scoreFaixa: baseResumo.score_faixa,
        scoreCalculadoEm: baseResumo.score_calculado_em,
        alocacao: paraAlocacaoSaida(aloc),
        evolucao: evolucao.map(paraEvolucaoSaida).reverse(),
        principaisAtivos: topN,
        atualizadoEm: (/* @__PURE__ */ new Date()).toISOString()
      });
    },
    async listarItens(usuarioId) {
      const posicoes = await repo.posicoes(usuarioId);
      const total = posicoes.reduce((s, p) => s + (p.valor_atual_brl ?? 0), 0);
      return sucesso({ itens: posicoes.map((p) => paraItemSaida(p, total)) });
    },
    async obterItem(usuarioId, id) {
      const posicoes = await repo.posicoes(usuarioId);
      const total = posicoes.reduce((s, p) => s + (p.valor_atual_brl ?? 0), 0);
      const alvo = posicoes.find((p) => p.item_id === id);
      if (!alvo) return erro("item_nao_encontrado", "Item de patrim\xF4nio n\xE3o encontrado", 404);
      return sucesso(paraItemSaida(alvo, total));
    },
    async criarItem(usuarioId, e) {
      if (!e.tipo || !e.nome) return erro("dados_incompletos", "Tipo e nome s\xE3o obrigat\xF3rios", 400);
      const id = gerarId();
      await repo.inserirItem(
        id,
        usuarioId,
        e.ativoId ?? null,
        e.tipo,
        "manual",
        e.nome,
        e.quantidade ?? null,
        e.precoMedioBrl ?? null,
        e.valorAtualBrl ?? null,
        e.moeda ?? "BRL",
        JSON.stringify(e.dadosJson ?? {})
      );
      return this.obterItem(usuarioId, id);
    },
    async atualizarItem(usuarioId, id, e) {
      const atual = await repo.buscarItemBruto(usuarioId, id);
      if (!atual) return erro("item_nao_encontrado", "Item de patrim\xF4nio n\xE3o encontrado", 404);
      await repo.atualizarItem(id, usuarioId, {
        ...e,
        dadosJson: e.dadosJson !== void 0 ? JSON.stringify(e.dadosJson) : void 0
      });
      return this.obterItem(usuarioId, id);
    },
    async removerItem(usuarioId, id) {
      const atual = await repo.buscarItemBruto(usuarioId, id);
      if (!atual) return erro("item_nao_encontrado", "Item de patrim\xF4nio n\xE3o encontrado", 404);
      await repo.removerItem(id, usuarioId);
      return sucesso({ removido: true });
    },
    async listarAportes(usuarioId) {
      const linhas = await repo.listarAportes(usuarioId);
      return sucesso({ itens: linhas.map(paraAporteSaida) });
    },
    async criarAporte(usuarioId, e) {
      if (!e.tipo || !e.valorBrl || !e.data) return erro("dados_incompletos", "tipo, valorBrl e data s\xE3o obrigat\xF3rios", 400);
      const id = gerarId();
      await repo.inserirAporte(
        id,
        usuarioId,
        e.itemId ?? null,
        e.tipo,
        e.valorBrl,
        e.data,
        e.descricao ?? null,
        "manual"
      );
      const linhas = await repo.listarAportes(usuarioId, 1);
      const recente = linhas.find((l) => l.id === id);
      if (!recente) return erro("aporte_nao_encontrado", "Aporte rec\xE9m-criado n\xE3o encontrado", 500);
      return sucesso(paraAporteSaida(recente));
    },
    async removerAporte(usuarioId, id) {
      await repo.removerAporte(id, usuarioId);
      return sucesso({ removido: true });
    },
    async historico(usuarioId) {
      const linhas = await repo.evolucao(usuarioId, 24);
      return sucesso({ itens: linhas.map(paraEvolucaoSaida).reverse() });
    },
    async score(usuarioId) {
      const [atual, historico] = await Promise.all([repo.scoreAtual(usuarioId), repo.scoreHistorico(usuarioId, 24)]);
      const pilares = (() => {
        if (!atual?.pilares_json) return [];
        try {
          const bruto = JSON.parse(atual.pilares_json);
          return Object.entries(bruto).map(([chave, v]) => ({
            chave,
            rotulo: v.rotulo ?? chave,
            valor: v.valor ?? 0,
            peso: v.peso ?? 0
          }));
        } catch {
          return [];
        }
      })();
      return sucesso({
        scoreTotal: atual?.score_total ?? null,
        faixa: atual?.faixa ?? null,
        pilares,
        historico: historico.map((h) => ({
          anoMes: h.ano_mes,
          score: h.score_total,
          faixa: h.faixa
        })).reverse(),
        calculadoEm: atual?.calculado_em ?? null
      });
    },
    async criarImportacao(usuarioId, e) {
      if (!e.origem || !Array.isArray(e.itens)) return erro("dados_incompletos", "origem e itens s\xE3o obrigat\xF3rios", 400);
      const id = gerarId();
      await repo.inserirImportacao(id, usuarioId, e.origem);
      for (const item of e.itens) {
        await repo.inserirItemImportacao(
          gerarId(),
          id,
          item.linha,
          item.tipo,
          JSON.stringify(item.dadosJson ?? {})
        );
      }
      return this.obterImportacao(usuarioId, id);
    },
    async obterImportacao(usuarioId, id) {
      const l = await repo.buscarImportacao(id, usuarioId);
      if (!l) return erro("importacao_nao_encontrada", "Importa\xE7\xE3o n\xE3o encontrada", 404);
      return sucesso({
        id: l.id,
        usuarioId: l.usuario_id,
        origem: l.origem,
        status: l.status,
        iniciadoEm: l.iniciado_em,
        concluidoEm: l.concluido_em
      });
    }
  };
}, "servicoPatrimonio");

// src/dominios/patrimonio/patrimonio.rotas.ts
async function rotearPatrimonio(caminho, request, env, sessao) {
  if (!sessao) return erro("nao_autenticado", "Sess\xE3o n\xE3o encontrada", 401);
  const servico = servicoPatrimonio(criarBd(env));
  const metodo = request.method.toUpperCase();
  if (caminho === "/api/patrimonio/resumo" && metodo === "GET") return servico.resumo(sessao.usuarioId);
  if (caminho === "/api/patrimonio/itens" && metodo === "GET") return servico.listarItens(sessao.usuarioId);
  if (caminho === "/api/patrimonio/itens" && metodo === "POST") {
    return servico.criarItem(sessao.usuarioId, await lerJson(request));
  }
  const mItem = caminho.match(/^\/api\/patrimonio\/itens\/([^/]+)$/);
  if (mItem) {
    const id = mItem[1];
    if (metodo === "GET") return servico.obterItem(sessao.usuarioId, id);
    if (metodo === "PATCH") return servico.atualizarItem(sessao.usuarioId, id, await lerJson(request));
    if (metodo === "DELETE") return servico.removerItem(sessao.usuarioId, id);
    return metodoNaoPermitido(metodo);
  }
  if (caminho === "/api/patrimonio/aportes" && metodo === "GET") return servico.listarAportes(sessao.usuarioId);
  if (caminho === "/api/patrimonio/aportes" && metodo === "POST") {
    return servico.criarAporte(sessao.usuarioId, await lerJson(request));
  }
  const mAporte = caminho.match(/^\/api\/patrimonio\/aportes\/([^/]+)$/);
  if (mAporte && metodo === "DELETE") return servico.removerAporte(sessao.usuarioId, mAporte[1]);
  if (caminho === "/api/patrimonio/historico" && metodo === "GET") return servico.historico(sessao.usuarioId);
  if (caminho === "/api/patrimonio/score" && metodo === "GET") return servico.score(sessao.usuarioId);
  if (caminho === "/api/patrimonio/importacoes" && metodo === "POST") {
    return servico.criarImportacao(sessao.usuarioId, await lerJson(request));
  }
  const mImp = caminho.match(/^\/api\/patrimonio\/importacoes\/([^/]+)$/);
  if (mImp && metodo === "GET") return servico.obterImportacao(sessao.usuarioId, mImp[1]);
  return caminho.startsWith("/api/patrimonio") ? naoEncontrado() : metodoNaoPermitido(metodo);
}
__name(rotearPatrimonio, "rotearPatrimonio");

// src/dominios/decisoes/decisoes.repositorio.ts
var repositorioDecisoes = /* @__PURE__ */ __name((bd) => ({
  async listar(usuarioId, limite = 50) {
    return bd.consultar(
      `SELECT id, usuario_id, tipo, premissas_json, resultado_json, criado_em
         FROM decisoes_simulacoes WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT ?`,
      usuarioId,
      limite
    );
  },
  async buscar(usuarioId, id) {
    return bd.primeiro(
      `SELECT id, usuario_id, tipo, premissas_json, resultado_json, criado_em
         FROM decisoes_simulacoes WHERE id = ? AND usuario_id = ? LIMIT 1`,
      id,
      usuarioId
    );
  },
  async inserir(id, usuarioId, tipo, premissasJson, resultadoJson) {
    await bd.executar(
      `INSERT INTO decisoes_simulacoes (id, usuario_id, tipo, premissas_json, resultado_json)
       VALUES (?, ?, ?, ?, ?)`,
      id,
      usuarioId,
      tipo,
      premissasJson,
      resultadoJson
    );
  }
}), "repositorioDecisoes");

// src/dominios/decisoes/decisoes.servico.ts
var paraSaida = /* @__PURE__ */ __name((l) => {
  const lerJson2 = /* @__PURE__ */ __name((s) => {
    try {
      return JSON.parse(s);
    } catch {
      return {};
    }
  }, "lerJson");
  return {
    id: l.id,
    usuarioId: l.usuario_id,
    tipo: l.tipo,
    premissasJson: lerJson2(l.premissas_json),
    resultadoJson: lerJson2(l.resultado_json),
    criadoEm: l.criado_em
  };
}, "paraSaida");
var servicoDecisoes = /* @__PURE__ */ __name((bd, env) => {
  const repo = repositorioDecisoes(bd);
  return {
    async listar(usuarioId) {
      const linhas = await repo.listar(usuarioId);
      return sucesso({ itens: linhas.map(paraSaida) });
    },
    async obter(usuarioId, id) {
      const l = await repo.buscar(usuarioId, id);
      if (!l) return erro("simulacao_nao_encontrada", "Simula\xE7\xE3o n\xE3o encontrada", 404);
      return sucesso(paraSaida(l));
    },
    async criar(usuarioId, e) {
      if (!e.tipo || !e.premissasJson) return erro("dados_incompletos", "tipo e premissas s\xE3o obrigat\xF3rios", 400);
      const id = gerarId();
      await repo.inserir(
        id,
        usuarioId,
        e.tipo,
        JSON.stringify(e.premissasJson),
        JSON.stringify(e.resultadoJson ?? {})
      );
      return this.obter(usuarioId, id);
    },
    async veraEnviarMensagem(usuarioId, e) {
      if (!e.mensagem?.trim()) return erro("mensagem_vazia", "Mensagem vazia", 400);
      const conversaId = e.conversaId ?? gerarId();
      const resposta = env.AI ? await (async () => {
        try {
          const r = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [
              { role: "system", content: "Voc\xEA \xE9 Vera, assistente financeira objetiva em PT-BR." },
              { role: "user", content: e.mensagem }
            ]
          });
          return r.response ?? "Sem resposta dispon\xEDvel no momento.";
        } catch {
          return "Sem resposta dispon\xEDvel no momento.";
        }
      })() : "Sem resposta dispon\xEDvel no momento.";
      return sucesso({
        conversaId,
        resposta,
        sugeridos: [],
        tokensEntrada: e.mensagem.length,
        tokensSaida: resposta.length,
        geradoEm: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  };
}, "servicoDecisoes");

// src/dominios/decisoes/decisoes.rotas.ts
async function rotearDecisoes(caminho, request, env, sessao) {
  if (!sessao) return erro("nao_autenticado", "Sess\xE3o n\xE3o encontrada", 401);
  const servico = servicoDecisoes(criarBd(env), env);
  const metodo = request.method.toUpperCase();
  if (caminho === "/api/decisoes/simulacoes" && metodo === "GET") return servico.listar(sessao.usuarioId);
  if (caminho === "/api/decisoes/simulacoes" && metodo === "POST") {
    return servico.criar(sessao.usuarioId, await lerJson(request));
  }
  const mSim = caminho.match(/^\/api\/decisoes\/simulacoes\/([^/]+)$/);
  if (mSim && metodo === "GET") return servico.obter(sessao.usuarioId, mSim[1]);
  if (caminho === "/api/decisoes/vera/mensagens" && metodo === "POST") {
    return servico.veraEnviarMensagem(sessao.usuarioId, await lerJson(request));
  }
  return caminho.startsWith("/api/decisoes") ? naoEncontrado() : metodoNaoPermitido(metodo);
}
__name(rotearDecisoes, "rotearDecisoes");

// src/dominios/admin/admin.repositorio.ts
var repositorioAdmin = /* @__PURE__ */ __name((bd) => ({
  async ehAdmin(email) {
    const l = await bd.primeiro(
      `SELECT email FROM admin_usuarios WHERE email = ? LIMIT 1`,
      email.toLowerCase()
    );
    return l != null;
  },
  async listarUsuarios(limite = 100) {
    return bd.consultar(
      `SELECT id, nome, email, cpf, criado_em FROM usuarios ORDER BY criado_em DESC LIMIT ?`,
      limite
    );
  },
  async auditoria(limite = 100) {
    return bd.consultar(
      `SELECT id, autor_email, acao, recurso, dados_json, ocorrido_em
         FROM admin_auditoria ORDER BY ocorrido_em DESC LIMIT ?`,
      limite
    );
  },
  async ingestoesCvm(limite = 20) {
    return bd.consultar(
      `SELECT * FROM vw_admin_ingestao_cvm ORDER BY iniciado_em DESC LIMIT ?`,
      limite
    );
  },
  async registrarAuditoria(id, autorEmail, acao, recurso, dadosJson) {
    await bd.executar(
      `INSERT INTO admin_auditoria (id, autor_email, acao, recurso, dados_json) VALUES (?, ?, ?, ?, ?)`,
      id,
      autorEmail,
      acao,
      recurso,
      dadosJson
    );
  }
}), "repositorioAdmin");

// src/dominios/admin/admin.servico.ts
var paraAuditoria = /* @__PURE__ */ __name((l) => ({
  id: l.id,
  autorEmail: l.autor_email,
  acao: l.acao,
  recurso: l.recurso,
  dadosJson: (() => {
    try {
      return JSON.parse(l.dados_json);
    } catch {
      return {};
    }
  })(),
  ocorridoEm: l.ocorrido_em
}), "paraAuditoria");
var paraIngestao = /* @__PURE__ */ __name((l) => ({
  id: l.id,
  modo: l.modo,
  status: l.status,
  iniciadoEm: l.iniciado_em,
  concluidoEm: l.concluido_em,
  duracaoSegundos: l.duracao_segundos,
  parametrosJson: (() => {
    try {
      return JSON.parse(l.parametros_json);
    } catch {
      return {};
    }
  })(),
  resultadoJson: (() => {
    try {
      return JSON.parse(l.resultado_json);
    } catch {
      return {};
    }
  })(),
  erro: l.erro
}), "paraIngestao");
var servicoAdmin = /* @__PURE__ */ __name((bd, env) => {
  const repo = repositorioAdmin(bd);
  const repoAuth = repositorioAuth(bd);
  return {
    async entrar(e) {
      const u = await repoAuth.buscarUsuarioPorEmail(e.email);
      if (!u) return erro("credenciais_invalidas", "Email ou senha inv\xE1lidos", 401);
      const valida = await validarSenha(e.senha, u.senha_hash);
      if (!valida) return erro("credenciais_invalidas", "Email ou senha inv\xE1lidos", 401);
      const ehAdmin = await repo.ehAdmin(u.email);
      if (!ehAdmin) return erro("sem_permissao", "Acesso administrativo negado", 403);
      const token = await emitirToken({ usuarioId: u.id, email: u.email }, env.JWT_SECRET);
      return sucesso(token);
    },
    async listarUsuarios(sessaoEmail) {
      if (!await repo.ehAdmin(sessaoEmail)) return erro("sem_permissao", "Acesso administrativo negado", 403);
      const linhas = await repo.listarUsuarios();
      return sucesso({
        itens: linhas.map((l) => ({
          id: l.id,
          nome: l.nome,
          email: l.email,
          cpf: l.cpf,
          criadoEm: l.criado_em
        }))
      });
    },
    async auditoria(sessaoEmail) {
      if (!await repo.ehAdmin(sessaoEmail)) return erro("sem_permissao", "Acesso administrativo negado", 403);
      const linhas = await repo.auditoria();
      return sucesso({ itens: linhas.map(paraAuditoria) });
    },
    async ingestoesCvm(sessaoEmail) {
      if (!await repo.ehAdmin(sessaoEmail)) return erro("sem_permissao", "Acesso administrativo negado", 403);
      const linhas = await repo.ingestoesCvm();
      return sucesso({ itens: linhas.map(paraIngestao) });
    }
  };
}, "servicoAdmin");

// src/dominios/admin/admin.rotas.ts
async function rotearAdmin(caminho, request, env, sessao) {
  const servico = servicoAdmin(criarBd(env), env);
  const metodo = request.method.toUpperCase();
  if (caminho === "/api/admin/entrar" && metodo === "POST") {
    return servico.entrar(await lerJson(request));
  }
  if (!sessao) return erro("nao_autenticado", "Sess\xE3o n\xE3o encontrada", 401);
  if (caminho === "/api/admin/usuarios" && metodo === "GET") return servico.listarUsuarios(sessao.email);
  if (caminho === "/api/admin/auditoria" && metodo === "GET") return servico.auditoria(sessao.email);
  if (caminho === "/api/admin/cvm" && metodo === "GET") return servico.ingestoesCvm(sessao.email);
  return caminho.startsWith("/api/admin") ? naoEncontrado() : metodoNaoPermitido(metodo);
}
__name(rotearAdmin, "rotearAdmin");

// src/dominios/telemetria/telemetria.rotas.ts
async function rotearTelemetria(caminho, request, env, sessao) {
  const metodo = request.method.toUpperCase();
  if (caminho === "/api/telemetria/eventos" && metodo === "POST") {
    const entrada = await lerJson(request);
    if (!entrada?.nome) return erro("nome_obrigatorio", "Nome do evento \xE9 obrigat\xF3rio", 400);
    const bd = criarBd(env);
    const id = gerarId();
    const dados = JSON.stringify(entrada.dadosJson ?? {});
    const ocorrido = entrada.ocorridoEm ?? (/* @__PURE__ */ new Date()).toISOString();
    await bd.executar(
      `INSERT INTO telemetria_eventos (id, usuario_id, evento, ocorrido_em, dados_json) VALUES (?, ?, ?, ?, ?)`,
      id,
      sessao?.usuarioId ?? null,
      entrada.nome,
      ocorrido,
      dados
    );
    const resp = { id, aceito: true };
    return sucesso(resp);
  }
  return caminho.startsWith("/api/telemetria") ? naoEncontrado() : metodoNaoPermitido(metodo);
}
__name(rotearTelemetria, "rotearTelemetria");

// src/aplicacao.ts
var ROTAS_PUBLICAS = /* @__PURE__ */ new Set([
  "/api/auth/registrar",
  "/api/auth/entrar",
  "/api/auth/sair",
  "/api/auth/recuperar/iniciar",
  "/api/auth/recuperar/confirmar",
  "/api/auth/recuperar/redefinir",
  "/api/admin/entrar",
  "/api/telemetria/eventos"
]);
var PREFIXOS_MERCADO_PUBLICO = ["/api/mercado/ativos", "/api/mercado/fundos-cvm"];
function ehRotaPublica(caminho) {
  if (ROTAS_PUBLICAS.has(caminho)) return true;
  if (PREFIXOS_MERCADO_PUBLICO.some((p) => caminho.startsWith(p))) return true;
  return false;
}
__name(ehRotaPublica, "ehRotaPublica");
async function resolverSessao(request, env) {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const [tipo, token] = auth.split(" ");
  if (!tipo || !token || tipo.toLowerCase() !== "bearer") return null;
  const payload = await validarToken(token, env.JWT_SECRET);
  if (!payload) return null;
  const u = await env.DB.prepare(`SELECT id, nome, email FROM usuarios WHERE id = ? LIMIT 1`).bind(payload.usuarioId).first();
  if (!u) return null;
  const adm = await env.DB.prepare(`SELECT email FROM admin_usuarios WHERE email = ? LIMIT 1`).bind(u.email).first();
  return {
    usuarioId: u.id,
    nome: u.nome,
    email: u.email,
    ehAdmin: adm != null
  };
}
__name(resolverSessao, "resolverSessao");
async function rotear(caminho, request, env, sessao) {
  if (caminho.startsWith("/api/auth/")) return rotearAuth(caminho, request, env, sessao);
  if (caminho.startsWith("/api/usuario")) return rotearUsuario(caminho, request, env, sessao);
  if (caminho.startsWith("/api/perfil")) return rotearPerfil(caminho, request, env, sessao);
  if (caminho.startsWith("/api/mercado/")) return rotearMercado(caminho, request, env, sessao);
  if (caminho.startsWith("/api/patrimonio")) return rotearPatrimonio(caminho, request, env, sessao);
  if (caminho.startsWith("/api/decisoes")) return rotearDecisoes(caminho, request, env, sessao);
  if (caminho.startsWith("/api/admin")) return rotearAdmin(caminho, request, env, sessao);
  if (caminho.startsWith("/api/telemetria")) return rotearTelemetria(caminho, request, env, sessao);
  return naoEncontrado();
}
__name(rotear, "rotear");

// src/jobs/mercado-atualizar.job.ts
async function atualizarMercadoJob(env) {
  const bd = criarBd(env);
  const ativos = await bd.consultar(
    `SELECT DISTINCT a.id, a.ticker, a.cnpj, a.tipo
       FROM ativos a
       INNER JOIN patrimonio_itens p ON p.ativo_id = a.id
      WHERE p.esta_ativo = 1`
  );
  if (ativos.length === 0) return;
  const timestamp = agora();
  const expira = new Date(Date.now() + 5 * 6e4).toISOString();
  for (const ativo of ativos) {
    const preco = await buscarPreco(ativo, env);
    if (preco == null) continue;
    await bd.executar(
      `INSERT INTO ativos_cotacoes_cache (ativo_id, fonte, cotado_em, preco_brl, expira_em, dados_json)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(ativo_id, fonte) DO UPDATE SET
         cotado_em = excluded.cotado_em,
         preco_brl = excluded.preco_brl,
         expira_em = excluded.expira_em,
         dados_json = excluded.dados_json`,
      ativo.id,
      fontePara(ativo.tipo),
      timestamp,
      preco,
      expira,
      JSON.stringify({ origem: "job", tipo: ativo.tipo })
    );
  }
}
__name(atualizarMercadoJob, "atualizarMercadoJob");
function fontePara(tipo) {
  if (tipo === "fundo") return "cvm";
  if (tipo === "acao" || tipo === "fii" || tipo === "etf") return "brapi";
  return "manual";
}
__name(fontePara, "fontePara");
async function buscarPreco(ativo, env) {
  if (ativo.ticker && (env.BRAPI_TOKEN || env.BRAPI_BASE_URL)) {
    const base = env.BRAPI_BASE_URL ?? "https://brapi.dev/api";
    const url = `${base}/quote/${encodeURIComponent(ativo.ticker)}?token=${env.BRAPI_TOKEN ?? ""}`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const dados = await resp.json();
      const preco = dados.results?.[0]?.regularMarketPrice;
      return typeof preco === "number" ? preco : null;
    } catch {
      return null;
    }
  }
  return null;
}
__name(buscarPreco, "buscarPreco");

// src/jobs/historico-mensal.job.ts
async function historicoMensalJob(env) {
  const bd = criarBd(env);
  const usuarios = await bd.consultar(`SELECT id FROM usuarios`);
  if (usuarios.length === 0) return;
  const anoMes = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  const timestamp = agora();
  for (const u of usuarios) {
    const resumo = await bd.primeiro(
      `SELECT patrimonio_bruto_brl, divida_brl, patrimonio_liquido_brl, aporte_mes_brl
         FROM vw_patrimonio_resumo WHERE usuario_id = ?`,
      u.id
    );
    if (!resumo) continue;
    await bd.executar(
      `INSERT INTO patrimonio_historico_mensal (
          usuario_id, ano_mes,
          patrimonio_bruto_brl, patrimonio_liquido_brl, divida_brl,
          aporte_mes_brl, rentabilidade_mes_pct, eh_confiavel,
          dados_json, atualizado_em
        ) VALUES (?, ?, ?, ?, ?, ?, NULL, 1, '{}', ?)
       ON CONFLICT(usuario_id, ano_mes) DO UPDATE SET
         patrimonio_bruto_brl = excluded.patrimonio_bruto_brl,
         patrimonio_liquido_brl = excluded.patrimonio_liquido_brl,
         divida_brl = excluded.divida_brl,
         aporte_mes_brl = excluded.aporte_mes_brl,
         atualizado_em = excluded.atualizado_em`,
      u.id,
      anoMes,
      resumo.patrimonio_bruto_brl ?? 0,
      resumo.patrimonio_liquido_brl ?? 0,
      resumo.divida_brl ?? 0,
      resumo.aporte_mes_brl ?? 0,
      timestamp
    );
  }
}
__name(historicoMensalJob, "historicoMensalJob");

// src/jobs/patrimonio-reconstruir.job.ts
async function patrimonioReconstruirJob(env) {
  const bd = criarBd(env);
  const fila = await bd.consultar(
    `SELECT id, usuario_id FROM patrimonio_fila_reconstrucao
      WHERE status = 'pendente' ORDER BY agendado_em ASC LIMIT 50`
  );
  if (fila.length === 0) return;
  const timestamp = agora();
  for (const tarefa of fila) {
    try {
      await bd.executar(
        `UPDATE patrimonio_fila_reconstrucao SET status = 'processando', iniciado_em = ? WHERE id = ?`,
        timestamp,
        tarefa.id
      );
      const itens = await bd.consultar(
        `SELECT p.id, p.quantidade, p.preco_medio_brl,
                (SELECT preco_brl FROM ativos_cotacoes_cache c WHERE c.ativo_id = p.ativo_id ORDER BY cotado_em DESC LIMIT 1) AS preco_atual_brl
           FROM patrimonio_itens p
          WHERE p.usuario_id = ? AND p.esta_ativo = 1`,
        tarefa.usuario_id
      );
      for (const item of itens) {
        const preco = item.preco_atual_brl ?? item.preco_medio_brl ?? 0;
        const quantidade = item.quantidade ?? 0;
        const valor = quantidade * preco;
        await bd.executar(
          `UPDATE patrimonio_itens SET valor_atual_brl = ?, atualizado_em = ? WHERE id = ?`,
          valor,
          timestamp,
          item.id
        );
      }
      await bd.executar(
        `UPDATE patrimonio_fila_reconstrucao SET status = 'concluido', processado_em = ? WHERE id = ?`,
        agora(),
        tarefa.id
      );
    } catch (erro2) {
      await bd.executar(
        `UPDATE patrimonio_fila_reconstrucao SET status = 'falhou', erro = ?, processado_em = ? WHERE id = ?`,
        String(erro2 instanceof Error ? erro2.message : erro2),
        agora(),
        tarefa.id
      );
    }
  }
}
__name(patrimonioReconstruirJob, "patrimonioReconstruirJob");

// src/index.ts
var PREFIXOS_VALIDOS = [
  "/api/auth/",
  "/api/usuario",
  "/api/perfil",
  "/api/mercado/",
  "/api/patrimonio",
  "/api/decisoes",
  "/api/admin",
  "/api/telemetria"
];
var cabecalhosCors = /* @__PURE__ */ __name(() => ({
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type"
}), "cabecalhosCors");
var responderJson = /* @__PURE__ */ __name((carga, status = 200) => new Response(JSON.stringify(carga), {
  status,
  headers: { ...cabecalhosCors(), "content-type": "application/json; charset=utf-8" }
}), "responderJson");
var extrairToken = /* @__PURE__ */ __name((request) => {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const [tipo, token] = auth.split(" ");
  if (!tipo || !token || tipo.toLowerCase() !== "bearer") return null;
  return token;
}, "extrairToken");
function prefixoValido(caminho) {
  return PREFIXOS_VALIDOS.some((p) => caminho === p.replace(/\/$/, "") || caminho.startsWith(p));
}
__name(prefixoValido, "prefixoValido");
var index_default = {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cabecalhosCors() });
    }
    if (!pathname.startsWith("/api/")) {
      return responderJson({ ok: false, erro: { codigo: "rota_invalida", mensagem: "Prefixo de rota inv\xE1lido" } }, 404);
    }
    if (!prefixoValido(pathname)) {
      return responderJson({ ok: false, erro: { codigo: "rota_invalida", mensagem: "Prefixo de rota inv\xE1lido" } }, 404);
    }
    try {
      const sessao = await resolverSessao(request, env);
      if (!ehRotaPublica(pathname) && !sessao) {
        if (!extrairToken(request)) {
          return responderJson({ ok: false, erro: { codigo: "nao_autenticado", mensagem: "Token ausente" } }, 401);
        }
        return responderJson({ ok: false, erro: { codigo: "nao_autenticado", mensagem: "Sess\xE3o inv\xE1lida" } }, 401);
      }
      const resultado = await rotear(pathname, request, env, sessao);
      if (!resultado.ok) {
        return responderJson(
          { ok: false, erro: { codigo: resultado.codigo, mensagem: resultado.mensagem, detalhes: resultado.detalhes } },
          resultado.status
        );
      }
      return responderJson({ ok: true, dados: resultado.dados }, 200);
    } catch (error) {
      if (error instanceof ZodError) {
        return responderJson(
          { ok: false, erro: { codigo: "validacao", mensagem: "Payload inv\xE1lido", detalhes: error.flatten() } },
          422
        );
      }
      console.error("erro_gateway", error);
      return responderJson({ ok: false, erro: { codigo: "erro_interno", mensagem: "Falha interna no gateway" } }, 500);
    } finally {
      void ctx;
    }
  },
  async scheduled(event, env, ctx) {
    if (event.cron === "0 3 * * *") {
      ctx.waitUntil(historicoMensalJob(env).catch(() => {
      }));
      return;
    }
    if (event.cron === "*/30 * * * *") {
      ctx.waitUntil(patrimonioReconstruirJob(env).catch(() => {
      }));
      return;
    }
    ctx.waitUntil(atualizarMercadoJob(env).catch(() => {
    }));
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
