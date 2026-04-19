var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../modulos-backend/autenticacao/src/repositorio.ts
var RepositorioAutenticacaoD1 = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "RepositorioAutenticacaoD1");
  }
  async buscarPorEmail(email) {
    const row = await this.db.prepare("SELECT id, nome, cpf, email, senha_hash, criado_em FROM usuarios WHERE email = ?").bind(email).first();
    if (!row) return null;
    return {
      id: row.id,
      nome: row.nome,
      cpf: row.cpf ?? "",
      email: row.email,
      senhaHash: row.senha_hash,
      criadoEm: row.criado_em
    };
  }
  async buscarPorCpf(cpf) {
    const row = await this.db.prepare("SELECT id, nome, cpf, email, senha_hash, criado_em FROM usuarios WHERE cpf = ?").bind(cpf).first();
    if (!row) return null;
    return {
      id: row.id,
      nome: row.nome,
      cpf: row.cpf ?? "",
      email: row.email,
      senhaHash: row.senha_hash,
      criadoEm: row.criado_em
    };
  }
  async buscarPorId(id) {
    const row = await this.db.prepare("SELECT id, nome, cpf, email, senha_hash, criado_em FROM usuarios WHERE id = ?").bind(id).first();
    if (!row) return null;
    return {
      id: row.id,
      nome: row.nome,
      cpf: row.cpf ?? "",
      email: row.email,
      senhaHash: row.senha_hash,
      criadoEm: row.criado_em
    };
  }
  async criarUsuario(input) {
    await this.db.prepare("INSERT INTO usuarios (id, nome, cpf, email, senha_hash) VALUES (?, ?, ?, ?, ?)").bind(input.id, input.nome, input.cpf, input.email, input.senhaHash).run();
    const usuario = await this.buscarPorId(input.id);
    if (!usuario) {
      throw new Error("Falha ao recuperar usu\xE1rio ap\xF3s cria\xE7\xE3o");
    }
    return usuario;
  }
  async criarTokenRecuperacao(input) {
    await this.db.prepare(
      "INSERT INTO recuperacoes_acesso (id, usuario_id, token_hash, destino_email, expira_em) VALUES (?, ?, ?, ?, ?)"
    ).bind(input.id, input.usuarioId, input.tokenHash, input.destinoEmail, input.expiraEm).run();
  }
  async buscarTokenRecuperacao(tokenHash) {
    const row = await this.db.prepare(
      "SELECT id, usuario_id, token_hash, destino_email, expira_em, usado_em FROM recuperacoes_acesso WHERE token_hash = ? LIMIT 1"
    ).bind(tokenHash).first();
    if (!row) return null;
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      tokenHash: row.token_hash,
      destinoEmail: row.destino_email,
      expiraEm: row.expira_em,
      usadoEm: row.usado_em
    };
  }
  async marcarTokenRecuperacaoComoUsado(id) {
    await this.db.prepare("UPDATE recuperacoes_acesso SET usado_em = datetime('now') WHERE id = ?").bind(id).run();
  }
  async atualizarSenha(usuarioId, senhaHash) {
    await this.db.prepare("UPDATE usuarios SET senha_hash = ? WHERE id = ?").bind(senhaHash, usuarioId).run();
  }
  async atualizarCadastroInterrompido(input) {
    await this.db.prepare("UPDATE usuarios SET nome = ?, email = ?, senha_hash = ? WHERE id = ?").bind(input.nome, input.email, input.senhaHash, input.usuarioId).run();
  }
  async removerUsuarioPorId(usuarioId) {
    await this.db.prepare("DELETE FROM usuarios WHERE id = ?").bind(usuarioId).run();
  }
  async removerTokensRecuperacaoPorUsuario(usuarioId) {
    await this.db.prepare("DELETE FROM recuperacoes_acesso WHERE usuario_id = ?").bind(usuarioId).run();
  }
};

// ../modulos-backend/autenticacao/src/erros.ts
var ErroAutenticacao = class extends Error {
  constructor(codigo, status, mensagem) {
    super(mensagem);
    this.codigo = codigo;
    this.status = status;
    this.name = "ErroAutenticacao";
  }
  static {
    __name(this, "ErroAutenticacao");
  }
};

// ../../node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

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
var getParsedType = /* @__PURE__ */ __name((data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
}, "getParsedType");

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
var quotelessJson = /* @__PURE__ */ __name((obj) => {
  const json2 = JSON.stringify(obj, null, 2);
  return json2.replace(/"([^"]+)":/g, "$1:");
}, "quotelessJson");
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

// ../../node_modules/zod/v3/locales/en.js
var errorMap = /* @__PURE__ */ __name((issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
}, "errorMap");
var en_default = errorMap;

// ../../node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
__name(setErrorMap, "setErrorMap");
function getErrorMap() {
  return overrideErrorMap;
}
__name(getErrorMap, "getErrorMap");

// ../../node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = /* @__PURE__ */ __name((params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
}, "makeIssue");
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
__name(addIssueToContext, "addIssueToContext");
var ParseStatus = class _ParseStatus {
  static {
    __name(this, "ParseStatus");
  }
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = /* @__PURE__ */ __name((value) => ({ status: "dirty", value }), "DIRTY");
var OK = /* @__PURE__ */ __name((value) => ({ status: "valid", value }), "OK");
var isAborted = /* @__PURE__ */ __name((x) => x.status === "aborted", "isAborted");
var isDirty = /* @__PURE__ */ __name((x) => x.status === "dirty", "isDirty");
var isValid = /* @__PURE__ */ __name((x) => x.status === "valid", "isValid");
var isAsync = /* @__PURE__ */ __name((x) => typeof Promise !== "undefined" && x instanceof Promise, "isAsync");

// ../../node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// ../../node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  static {
    __name(this, "ParseInputLazyPath");
  }
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = /* @__PURE__ */ __name((ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
}, "handleResult");
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = /* @__PURE__ */ __name((iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  }, "customMap");
  return { errorMap: customMap, description };
}
__name(processCreateParams, "processCreateParams");
var ZodType = class {
  static {
    __name(this, "ZodType");
  }
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = /* @__PURE__ */ __name((val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    }, "getIssueProperties");
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = /* @__PURE__ */ __name(() => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      }), "setError");
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: /* @__PURE__ */ __name((data) => this["~validate"](data), "validate")
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
__name(timeRegexSource, "timeRegexSource");
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
__name(timeRegex, "timeRegex");
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
__name(datetimeRegex, "datetimeRegex");
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidIP, "isValidIP");
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
__name(isValidJWT, "isValidJWT");
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidCidr, "isValidCidr");
var ZodString = class _ZodString extends ZodType {
  static {
    __name(this, "ZodString");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
__name(floatSafeRemainder, "floatSafeRemainder");
var ZodNumber = class _ZodNumber extends ZodType {
  static {
    __name(this, "ZodNumber");
  }
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  static {
    __name(this, "ZodBigInt");
  }
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  static {
    __name(this, "ZodBoolean");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  static {
    __name(this, "ZodDate");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  static {
    __name(this, "ZodSymbol");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  static {
    __name(this, "ZodUndefined");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  static {
    __name(this, "ZodNull");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  static {
    __name(this, "ZodAny");
  }
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  static {
    __name(this, "ZodUnknown");
  }
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  static {
    __name(this, "ZodNever");
  }
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  static {
    __name(this, "ZodVoid");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  static {
    __name(this, "ZodArray");
  }
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
__name(deepPartialify, "deepPartialify");
var ZodObject = class _ZodObject extends ZodType {
  static {
    __name(this, "ZodObject");
  }
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: /* @__PURE__ */ __name((issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }, "errorMap")
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => ({
        ...this._def.shape(),
        ...augmentation
      }), "shape")
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: /* @__PURE__ */ __name(() => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }), "shape"),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => shape, "shape")
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => shape, "shape")
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: /* @__PURE__ */ __name(() => shape, "shape"),
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: /* @__PURE__ */ __name(() => shape, "shape"),
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  static {
    __name(this, "ZodUnion");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    __name(handleResults, "handleResults");
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = /* @__PURE__ */ __name((type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
}, "getDiscriminator");
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  static {
    __name(this, "ZodDiscriminatedUnion");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
__name(mergeValues, "mergeValues");
var ZodIntersection = class extends ZodType {
  static {
    __name(this, "ZodIntersection");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = /* @__PURE__ */ __name((parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    }, "handleParsed");
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  static {
    __name(this, "ZodTuple");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  static {
    __name(this, "ZodRecord");
  }
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  static {
    __name(this, "ZodMap");
  }
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  static {
    __name(this, "ZodSet");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    __name(finalizeSet, "finalizeSet");
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  static {
    __name(this, "ZodFunction");
  }
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    __name(makeArgsIssue, "makeArgsIssue");
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    __name(makeReturnsIssue, "makeReturnsIssue");
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  static {
    __name(this, "ZodLazy");
  }
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  static {
    __name(this, "ZodLiteral");
  }
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
__name(createZodEnum, "createZodEnum");
var ZodEnum = class _ZodEnum extends ZodType {
  static {
    __name(this, "ZodEnum");
  }
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  static {
    __name(this, "ZodNativeEnum");
  }
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  static {
    __name(this, "ZodPromise");
  }
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  static {
    __name(this, "ZodEffects");
  }
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: /* @__PURE__ */ __name((arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      }, "addIssue"),
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = /* @__PURE__ */ __name((acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      }, "executeRefinement");
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  static {
    __name(this, "ZodOptional");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  static {
    __name(this, "ZodNullable");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  static {
    __name(this, "ZodDefault");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  static {
    __name(this, "ZodCatch");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  static {
    __name(this, "ZodNaN");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = /* @__PURE__ */ Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  static {
    __name(this, "ZodBranded");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  static {
    __name(this, "ZodPipeline");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = /* @__PURE__ */ __name(async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }, "handleAsync");
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  static {
    __name(this, "ZodReadonly");
  }
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = /* @__PURE__ */ __name((data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    }, "freeze");
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
__name(cleanParams, "cleanParams");
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
__name(custom, "custom");
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = /* @__PURE__ */ __name((cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params), "instanceOfType");
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = /* @__PURE__ */ __name(() => stringType().optional(), "ostring");
var onumber = /* @__PURE__ */ __name(() => numberType().optional(), "onumber");
var oboolean = /* @__PURE__ */ __name(() => booleanType().optional(), "oboolean");
var coerce = {
  string: /* @__PURE__ */ __name(((arg) => ZodString.create({ ...arg, coerce: true })), "string"),
  number: /* @__PURE__ */ __name(((arg) => ZodNumber.create({ ...arg, coerce: true })), "number"),
  boolean: /* @__PURE__ */ __name(((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })), "boolean"),
  bigint: /* @__PURE__ */ __name(((arg) => ZodBigInt.create({ ...arg, coerce: true })), "bigint"),
  date: /* @__PURE__ */ __name(((arg) => ZodDate.create({ ...arg, coerce: true })), "date")
};
var NEVER = INVALID;

// ../../bibliotecas/validacao/src/autenticacao.ts
var senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;
var registrarEntradaSchema = external_exports.object({
  nome: external_exports.string().trim().min(2).max(120),
  cpf: external_exports.string().trim().regex(/^\d{11}$/, "CPF inv\xE1lido"),
  email: external_exports.string().trim().email().max(180),
  senha: external_exports.string().regex(
    senhaForteRegex,
    "Senha fraca: use 8+ caracteres com mai\xFAscula, min\xFAscula, n\xFAmero e caractere especial"
  )
});
var entrarEntradaSchema = external_exports.object({
  email: external_exports.string().trim().email().max(180),
  senha: external_exports.string().min(5).max(128)
});
var authorizationHeaderSchema = external_exports.string().trim().regex(/^Bearer\s+.+$/i, "Formato esperado: Bearer <token>");
var verificarCadastroEntradaSchema = external_exports.object({
  cpf: external_exports.string().trim().regex(/^\d{11}$/, "CPF inv\xE1lido"),
  email: external_exports.string().trim().email().max(180)
});
var recuperarSenhaPorEmailEntradaSchema = external_exports.object({
  email: external_exports.string().trim().email().max(180)
});
var recuperarAcessoPorCpfEntradaSchema = external_exports.object({
  cpf: external_exports.string().trim().regex(/^\d{11}$/, "CPF inv\xE1lido")
});
var redefinirSenhaEntradaSchema = external_exports.object({
  token: external_exports.string().trim().min(20).max(300),
  novaSenha: external_exports.string().regex(
    senhaForteRegex,
    "Senha fraca: use 8+ caracteres com mai\xFAscula, min\xFAscula, n\xFAmero e caractere especial"
  )
});

// ../modulos-backend/autenticacao/src/jwt.ts
var encoder = new TextEncoder();
var encodeBase64 = /* @__PURE__ */ __name((value) => {
  const maybeBtoa = globalThis.btoa;
  if (typeof maybeBtoa === "function") {
    return maybeBtoa(value);
  }
  const maybeBuffer = globalThis.Buffer;
  if (maybeBuffer) {
    return maybeBuffer.from(value, "binary").toString("base64");
  }
  throw new Error("BASE64_ENCODE_UNAVAILABLE");
}, "encodeBase64");
var decodeBase64 = /* @__PURE__ */ __name((value) => {
  const maybeAtob = globalThis.atob;
  if (typeof maybeAtob === "function") {
    return maybeAtob(value);
  }
  const maybeBuffer = globalThis.Buffer;
  if (maybeBuffer) {
    return maybeBuffer.from(value, "base64").toString("binary");
  }
  throw new Error("BASE64_DECODE_UNAVAILABLE");
}, "decodeBase64");
var base64UrlEncode = /* @__PURE__ */ __name((value) => encodeBase64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""), "base64UrlEncode");
var base64UrlEncodeBytes = /* @__PURE__ */ __name((bytes) => encodeBase64(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""), "base64UrlEncodeBytes");
var base64UrlDecode = /* @__PURE__ */ __name((value) => decodeBase64(value.replace(/-/g, "+").replace(/_/g, "/")), "base64UrlDecode");
var base64UrlDecodeBytes = /* @__PURE__ */ __name((value) => Uint8Array.from(decodeBase64(value.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0)), "base64UrlDecodeBytes");
var toArrayBuffer = /* @__PURE__ */ __name((bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "toArrayBuffer");
async function gerarAssinatura(dados, segredo) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign"
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(dados));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}
__name(gerarAssinatura, "gerarAssinatura");
async function validarAssinatura(dados, assinatura, segredo) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, [
    "verify"
  ]);
  return crypto.subtle.verify("HMAC", key, toArrayBuffer(base64UrlDecodeBytes(assinatura)), encoder.encode(dados));
}
__name(validarAssinatura, "validarAssinatura");
async function emitirTokenAcesso(dados, segredo, validadeSegundos = 60 * 60 * 8) {
  const iat = Math.floor(Date.now() / 1e3);
  const payload = {
    sub: dados.usuarioId,
    email: dados.email,
    iat,
    exp: iat + validadeSegundos
  };
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const assinatura = await gerarAssinatura(`${header}.${body}`, segredo);
  return {
    token: `${header}.${body}.${assinatura}`,
    expiraEm: new Date(payload.exp * 1e3).toISOString()
  };
}
__name(emitirTokenAcesso, "emitirTokenAcesso");
async function validarTokenAcesso(token, segredo) {
  const [header, body, assinatura] = token.split(".");
  if (!header || !body || !assinatura) {
    throw new ErroAutenticacao("TOKEN_INVALIDO", 401, "Token inv\xE1lido");
  }
  const assinaturaValida = await validarAssinatura(`${header}.${body}`, assinatura, segredo);
  if (!assinaturaValida) {
    throw new ErroAutenticacao("TOKEN_INVALIDO", 401, "Token inv\xE1lido");
  }
  const payload = JSON.parse(base64UrlDecode(body));
  const agora = Math.floor(Date.now() / 1e3);
  if (!payload.sub || !payload.email || !payload.exp || payload.exp <= agora) {
    throw new ErroAutenticacao("TOKEN_EXPIRADO", 401, "Token expirado");
  }
  return { usuarioId: payload.sub, email: payload.email };
}
__name(validarTokenAcesso, "validarTokenAcesso");

// ../modulos-backend/autenticacao/src/senha.ts
var ITERACOES = 12e4;
var SALT_BYTES = 16;
var HASH_BYTES = 32;
var ITERACOES_FALLBACK = 2e4;
function base64Encode(bytes) {
  const maybeBtoa = globalThis.btoa;
  if (typeof maybeBtoa === "function") {
    return maybeBtoa(String.fromCharCode(...bytes));
  }
  const maybeBuffer = globalThis.Buffer;
  if (maybeBuffer) {
    return maybeBuffer.from(bytes).toString("base64");
  }
  throw new Error("BASE64_ENCODE_UNAVAILABLE");
}
__name(base64Encode, "base64Encode");
function base64Decode(value) {
  const maybeAtob = globalThis.atob;
  if (typeof maybeAtob === "function") {
    return Uint8Array.from(maybeAtob(value), (char) => char.charCodeAt(0));
  }
  const maybeBuffer = globalThis.Buffer;
  if (maybeBuffer) {
    return new Uint8Array(maybeBuffer.from(value, "base64"));
  }
  throw new Error("BASE64_DECODE_UNAVAILABLE");
}
__name(base64Decode, "base64Decode");
async function derivarHash(senha, salt, iteracoes) {
  const encoder2 = new TextEncoder();
  try {
    const key = await crypto.subtle.importKey("raw", encoder2.encode(senha), "PBKDF2", false, ["deriveBits"]);
    const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength);
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: saltBuffer,
        iterations: iteracoes
      },
      key,
      HASH_BYTES * 8
    );
    return new Uint8Array(bits);
  } catch {
    const efetivo = Math.max(1, Math.min(iteracoes, ITERACOES_FALLBACK));
    let atual = new Uint8Array([...salt, ...encoder2.encode(senha)]);
    for (let i = 0; i < efetivo; i += 1) {
      const digest = await crypto.subtle.digest("SHA-256", atual);
      atual = new Uint8Array([...new Uint8Array(digest), ...salt]);
    }
    return atual.slice(0, HASH_BYTES);
  }
}
__name(derivarHash, "derivarHash");
async function gerarHashSenha(senha) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derivarHash(senha, salt, ITERACOES);
  return `${ITERACOES}:${base64Encode(salt)}:${base64Encode(hash)}`;
}
__name(gerarHashSenha, "gerarHashSenha");
async function validarSenha(senha, senhaHash) {
  const [iteracoesBrutas, saltBruto, hashBruto] = senhaHash.split(":");
  const iteracoes = Number.parseInt(iteracoesBrutas, 10);
  if (!iteracoes || !saltBruto || !hashBruto) {
    throw new ErroAutenticacao("HASH_INVALIDO", 500, "Formato do hash inv\xE1lido");
  }
  const salt = base64Decode(saltBruto);
  const hashEsperado = base64Decode(hashBruto);
  const hashAtual = await derivarHash(senha, salt, iteracoes);
  if (hashAtual.length !== hashEsperado.length) return false;
  let diff = 0;
  for (let i = 0; i < hashAtual.length; i += 1) {
    diff |= hashAtual[i] ^ hashEsperado[i];
  }
  return diff === 0;
}
__name(validarSenha, "validarSenha");

// ../modulos-backend/autenticacao/src/servico.ts
var ServicoAutenticacaoPadrao = class {
  constructor(deps) {
    this.deps = deps;
    this.gerarId = deps.gerarId ?? (() => crypto.randomUUID());
    this.notificarRecuperacaoSenha = deps.notificarRecuperacaoSenha;
  }
  static {
    __name(this, "ServicoAutenticacaoPadrao");
  }
  gerarId;
  notificarRecuperacaoSenha;
  async registrar(entrada) {
    const input = registrarEntradaSchema.parse(entrada);
    const cpf = normalizarCpf(input.cpf);
    const [existenteCpf, existenteEmail] = await Promise.all([
      this.deps.repositorio.buscarPorCpf(cpf),
      this.deps.repositorio.buscarPorEmail(input.email.toLowerCase().trim())
    ]);
    if (existenteCpf) {
      const cadastroInterrompido = !existenteCpf.senhaHash;
      if (!cadastroInterrompido) {
        throw new ErroAutenticacao("CPF_JA_CADASTRADO", 409, "CPF j\xE1 cadastrado");
      }
      const criadoEmMs = new Date(existenteCpf.criadoEm).getTime();
      const expirado = Number.isFinite(criadoEmMs) ? Date.now() - criadoEmMs > 24 * 60 * 60 * 1e3 : false;
      const emailNormalizado = input.email.toLowerCase().trim();
      if (expirado) {
        await this.deps.repositorio.removerTokensRecuperacaoPorUsuario(existenteCpf.id);
        await this.deps.repositorio.removerUsuarioPorId(existenteCpf.id);
      } else {
        if (existenteCpf.email !== emailNormalizado) {
          throw new ErroAutenticacao(
            "CADASTRO_INTERROMPIDO_EMAIL_DIVERGENTE",
            409,
            "Cadastro interrompido encontrado para este CPF. Continue com o e-mail original."
          );
        }
        const senhaHashInterrompido = await gerarHashSenha(input.senha);
        await this.deps.repositorio.atualizarCadastroInterrompido({
          usuarioId: existenteCpf.id,
          nome: input.nome.trim(),
          email: emailNormalizado,
          senhaHash: senhaHashInterrompido
        });
        const usuarioAtualizado = await this.deps.repositorio.buscarPorId(existenteCpf.id);
        if (!usuarioAtualizado) {
          throw new ErroAutenticacao("ERRO_INTERNO_AUTENTICACAO", 500, "Falha ao atualizar cadastro interrompido");
        }
        const sessao2 = await emitirTokenAcesso(
          { usuarioId: usuarioAtualizado.id, email: usuarioAtualizado.email },
          this.deps.segredoJWT
        );
        return {
          usuario: mapUsuario(usuarioAtualizado),
          sessao: {
            token: sessao2.token,
            tipo: "Bearer",
            expiraEm: sessao2.expiraEm
          }
        };
      }
    }
    if (existenteEmail) {
      throw new ErroAutenticacao("EMAIL_JA_CADASTRADO", 409, "E-mail j\xE1 cadastrado");
    }
    const senhaHash = await gerarHashSenha(input.senha);
    const usuario = await this.deps.repositorio.criarUsuario({
      id: this.gerarId(),
      nome: input.nome.trim(),
      cpf,
      email: input.email.toLowerCase().trim(),
      senhaHash
    });
    const sessao = await emitirTokenAcesso(
      { usuarioId: usuario.id, email: usuario.email },
      this.deps.segredoJWT
    );
    return {
      usuario: mapUsuario(usuario),
      sessao: {
        token: sessao.token,
        tipo: "Bearer",
        expiraEm: sessao.expiraEm
      }
    };
  }
  async entrar(entrada) {
    const input = entrarEntradaSchema.parse(entrada);
    const usuario = await this.deps.repositorio.buscarPorEmail(input.email.toLowerCase().trim());
    if (!usuario) {
      throw new ErroAutenticacao("CREDENCIAIS_INVALIDAS", 401, "Credenciais inv\xE1lidas");
    }
    if (!usuario.senhaHash) {
      throw new ErroAutenticacao("CADASTRO_INCOMPLETO", 409, "Cadastro interrompido: redefina a senha para concluir");
    }
    const senhaValida = await validarSenha(input.senha, usuario.senhaHash);
    if (!senhaValida) {
      throw new ErroAutenticacao("CREDENCIAIS_INVALIDAS", 401, "Credenciais inv\xE1lidas");
    }
    const sessao = await emitirTokenAcesso(
      { usuarioId: usuario.id, email: usuario.email },
      this.deps.segredoJWT
    );
    return {
      usuario: mapUsuario(usuario),
      sessao: {
        token: sessao.token,
        tipo: "Bearer",
        expiraEm: sessao.expiraEm
      }
    };
  }
  async obterSessao(token) {
    const sessao = await validarTokenAcesso(token, this.deps.segredoJWT);
    const usuario = await this.deps.repositorio.buscarPorId(sessao.usuarioId);
    if (!usuario) {
      throw new ErroAutenticacao("SESSAO_INVALIDA", 401, "Sess\xE3o inv\xE1lida");
    }
    return { usuario: mapUsuario(usuario) };
  }
  async verificarCadastro(entrada) {
    const input = verificarCadastroEntradaSchema.parse(entrada);
    const cpf = normalizarCpf(input.cpf);
    const email = input.email.toLowerCase().trim();
    const [existenteCpf, existenteEmail] = await Promise.all([
      this.deps.repositorio.buscarPorCpf(cpf),
      this.deps.repositorio.buscarPorEmail(email)
    ]);
    const cadastroInterrompido = !!existenteCpf && !existenteCpf.senhaHash;
    const emailEhDaContaInterrompida = cadastroInterrompido && existenteCpf.email === email;
    return {
      cpfDisponivel: !existenteCpf || cadastroInterrompido,
      emailDisponivel: !existenteEmail || emailEhDaContaInterrompida,
      cadastroInterrompido,
      destinoMascara: cadastroInterrompido ? mascararEmail(existenteCpf.email) : void 0
    };
  }
  async solicitarRecuperacaoPorEmail(entrada) {
    const input = recuperarSenhaPorEmailEntradaSchema.parse(entrada);
    const email = input.email.toLowerCase().trim();
    const usuario = await this.deps.repositorio.buscarPorEmail(email);
    await this.criarRecuperacaoSeUsuarioExiste(usuario);
    return criarRespostaGenericaRecuperacao(usuario?.email ?? email);
  }
  async solicitarRecuperacaoPorCpf(entrada) {
    const input = recuperarAcessoPorCpfEntradaSchema.parse(entrada);
    const usuario = await this.deps.repositorio.buscarPorCpf(normalizarCpf(input.cpf));
    await this.criarRecuperacaoSeUsuarioExiste(usuario);
    return criarRespostaGenericaRecuperacao(usuario?.email);
  }
  async redefinirSenha(entrada) {
    const input = redefinirSenhaEntradaSchema.parse(entrada);
    const tokenHash = await gerarHashToken(input.token.trim());
    const token = await this.deps.repositorio.buscarTokenRecuperacao(tokenHash);
    if (!token) {
      throw new ErroAutenticacao("TOKEN_RECUPERACAO_INVALIDO", 400, "Token de recupera\xE7\xE3o inv\xE1lido");
    }
    if (token.usadoEm) {
      throw new ErroAutenticacao("TOKEN_RECUPERACAO_JA_UTILIZADO", 400, "Token de recupera\xE7\xE3o j\xE1 utilizado");
    }
    if (new Date(token.expiraEm).getTime() < Date.now()) {
      throw new ErroAutenticacao("TOKEN_RECUPERACAO_EXPIRADO", 400, "Token de recupera\xE7\xE3o expirado");
    }
    const novaSenhaHash = await gerarHashSenha(input.novaSenha);
    await this.deps.repositorio.atualizarSenha(token.usuarioId, novaSenhaHash);
    await this.deps.repositorio.marcarTokenRecuperacaoComoUsado(token.id);
    return { redefinido: true };
  }
  async criarRecuperacaoSeUsuarioExiste(usuario) {
    if (!usuario) return;
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const tokenHash = await gerarHashToken(token);
    const expiraEm = new Date(Date.now() + 1e3 * 60 * 30).toISOString();
    await this.deps.repositorio.criarTokenRecuperacao({
      id: crypto.randomUUID(),
      usuarioId: usuario.id,
      tokenHash,
      destinoEmail: usuario.email,
      expiraEm
    });
    if (this.notificarRecuperacaoSenha) {
      try {
        await this.notificarRecuperacaoSenha({ email: usuario.email, token, expiraEm });
      } catch {
      }
    }
  }
};
function mapUsuario(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    criadoEm: usuario.criadoEm
  };
}
__name(mapUsuario, "mapUsuario");
function normalizarCpf(cpf) {
  return cpf.replace(/\D/g, "");
}
__name(normalizarCpf, "normalizarCpf");
async function gerarHashToken(token) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(gerarHashToken, "gerarHashToken");
function mascararEmail(email) {
  const [local, dominio] = email.split("@");
  if (!local || !dominio) return "***";
  const primeiro = local.charAt(0);
  return `${primeiro}***@${dominio}`;
}
__name(mascararEmail, "mascararEmail");
function criarRespostaGenericaRecuperacao(email) {
  return {
    solicitado: true,
    canal: "email",
    destinoMascara: email ? mascararEmail(email) : "***@***",
    observacao: "Se existir conta vinculada, voc\xEA receber\xE1 instru\xE7\xF5es de recupera\xE7\xE3o no canal cadastrado."
  };
}
__name(criarRespostaGenericaRecuperacao, "criarRespostaGenericaRecuperacao");

// ../modulos-backend/importacao/src/parsers/csv-generico.ts
var REQUIRED_COLUMNS = ["data", "ticker", "nome", "categoria", "plataforma", "quantidade", "valor"];
var decoder = new TextDecoder();
function splitLine(line, delimiter) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}
__name(splitLine, "splitLine");
function parseNumber(input) {
  const sanitized = String(input ?? "").trim().replace(/\s+/g, "");
  if (!sanitized) return Number.NaN;
  const onlyNumeric = sanitized.replace(/[^\d,.-]/g, "");
  const lastComma = onlyNumeric.lastIndexOf(",");
  const lastDot = onlyNumeric.lastIndexOf(".");
  let normalized = onlyNumeric;
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      normalized = onlyNumeric.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = onlyNumeric.replace(/,/g, "");
    }
  } else if (lastComma > -1) {
    normalized = onlyNumeric.replace(",", ".");
  }
  normalized = normalized.replace(/(?!^)-/g, "");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : Number.NaN;
}
__name(parseNumber, "parseNumber");
var ParserCsvGenerico = class {
  static {
    __name(this, "ParserCsvGenerico");
  }
  nome = "csv-generico";
  detectar(arquivo) {
    const content = decoder.decode(arquivo).trim();
    if (!content) return false;
    const firstLine = content.split(/\r?\n/)[0] ?? "";
    const delimiter = firstLine.includes(";") ? ";" : ",";
    const header = splitLine(firstLine.toLowerCase(), delimiter).map((col) => col.trim());
    return REQUIRED_COLUMNS.every((col) => header.includes(col));
  }
  processar(arquivo, contexto) {
    const content = decoder.decode(arquivo).trim();
    if (!content) return [];
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const delimiter = (lines[0] ?? "").includes(";") ? ";" : ",";
    const header = splitLine(lines[0].toLowerCase(), delimiter);
    const index = {
      data: header.indexOf("data"),
      ticker: header.indexOf("ticker"),
      nome: header.indexOf("nome"),
      categoria: header.indexOf("categoria"),
      plataforma: header.indexOf("plataforma"),
      quantidade: header.indexOf("quantidade"),
      valor: header.indexOf("valor")
    };
    const plataformaPadrao = contexto?.plataformaPadrao ?? "Importacao CSV";
    return lines.slice(1).map((line, i) => {
      const cols = splitLine(line, delimiter);
      return {
        linha: i + 1,
        dataOperacao: cols[index.data] ?? "",
        ticker: (cols[index.ticker] ?? "").toUpperCase(),
        nome: cols[index.nome] ?? "",
        categoria: (cols[index.categoria] ?? "").toLowerCase(),
        plataforma: cols[index.plataforma] || plataformaPadrao,
        quantidade: parseNumber(cols[index.quantidade] ?? ""),
        valor: parseNumber(cols[index.valor] ?? "")
      };
    });
  }
};

// ../modulos-backend/importacao/src/erros.ts
var ErroImportacao = class extends Error {
  constructor(codigo, status, mensagem, detalhes) {
    super(mensagem);
    this.codigo = codigo;
    this.status = status;
    this.detalhes = detalhes;
    this.name = "ErroImportacao";
  }
  static {
    __name(this, "ErroImportacao");
  }
};

// ../modulos-backend/importacao/src/normalizacao-ativos.ts
var limparEspacos = /* @__PURE__ */ __name((value) => value.replace(/\s+/g, " ").trim(), "limparEspacos");
var normalizarTicker = /* @__PURE__ */ __name((value) => limparEspacos(value).toUpperCase().replace(/[^A-Z0-9.]/g, ""), "normalizarTicker");
var normalizarNome = /* @__PURE__ */ __name((value) => limparEspacos(value).toUpperCase(), "normalizarNome");
var slug = /* @__PURE__ */ __name((value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase(), "slug");
var extrairCnpj = /* @__PURE__ */ __name((value) => {
  const match = value.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
  if (!match) return null;
  const digits = match[0].replace(/\D/g, "");
  return digits.length === 14 ? digits : null;
}, "extrairCnpj");
var extrairIsin = /* @__PURE__ */ __name((value) => {
  const match = value.toUpperCase().match(/\b[A-Z]{2}[A-Z0-9]{9}\d\b/);
  return match?.[0] ?? null;
}, "extrairIsin");
function normalizarIdentidadeAtivo(input) {
  const tickerCanonico = normalizarTicker(input.ticker) || null;
  const nomeCanonico = normalizarNome(input.nome) || "ATIVO_SEM_NOME";
  const baseBusca = `${input.ticker} ${input.nome}`.toUpperCase();
  const cnpjFundo = (input.cnpj?.replace(/\D/g, "") || null) ?? extrairCnpj(baseBusca);
  const isin = extrairIsin(baseBusca);
  let identificadorCanonico;
  if (input.categoria === "fundo") {
    identificadorCanonico = cnpjFundo ? `fundo:cnpj:${cnpjFundo}` : isin ? `fundo:isin:${isin}` : tickerCanonico ? `fundo:ticker:${tickerCanonico}` : `fundo:nome:${slug(nomeCanonico)}`;
  } else if (input.categoria === "acao") {
    identificadorCanonico = isin ? `bolsa:isin:${isin}` : tickerCanonico ? `bolsa:ticker:${tickerCanonico}` : `bolsa:nome:${slug(nomeCanonico)}`;
  } else {
    identificadorCanonico = isin ? `${input.categoria}:isin:${isin}` : cnpjFundo ? `${input.categoria}:cnpj:${cnpjFundo}` : tickerCanonico ? `${input.categoria}:ticker:${tickerCanonico}` : `${input.categoria}:nome:${slug(nomeCanonico)}`;
  }
  const aliases = Array.from(
    new Set(
      [input.ticker, tickerCanonico, input.nome, nomeCanonico, cnpjFundo, isin].filter((item) => Boolean(item && item.trim().length > 0)).map((item) => limparEspacos(item).toUpperCase())
    )
  );
  return {
    tickerCanonico,
    nomeCanonico,
    cnpjFundo,
    isin,
    identificadorCanonico,
    aliases
  };
}
__name(normalizarIdentidadeAtivo, "normalizarIdentidadeAtivo");

// ../modulos-backend/importacao/src/repositorio.ts
var categoriaPatrimonio = /* @__PURE__ */ new Set(["imovel", "veiculo", "poupanca"]);
function metaPatrimonio(categoria) {
  switch (categoria) {
    case "imovel":
      return { liquidez: "baixa", risco: "baixo", categoriaPos: "patrim\xF4nio imobili\xE1rio" };
    case "veiculo":
      return { liquidez: "baixa", risco: "medio", categoriaPos: "bens m\xF3veis" };
    case "poupanca":
      return { liquidez: "imediata", risco: "baixo", categoriaPos: "reserva" };
    default:
      return { liquidez: "medio_prazo", risco: "medio", categoriaPos: "outros" };
  }
}
__name(metaPatrimonio, "metaPatrimonio");
var mapRowToItem = /* @__PURE__ */ __name((row) => {
  const linha = Number.parseInt(row.id.split("_").at(-1) ?? "0", 10);
  let aliases;
  if (row.aliases_json) {
    try {
      const parsed = JSON.parse(row.aliases_json);
      if (Array.isArray(parsed)) {
        aliases = parsed.filter((item) => typeof item === "string");
      }
    } catch {
      aliases = void 0;
    }
  }
  let metadados;
  if (row.metadata_json) {
    try {
      const parsed = JSON.parse(row.metadata_json);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        metadados = parsed;
      }
    } catch {
      metadados = void 0;
    }
  }
  return {
    linha,
    abaOrigem: row.aba_origem ?? "fundos",
    dataOperacao: row.data_operacao ?? "",
    ticker: row.ticker ?? void 0,
    nome: row.nome ?? "",
    categoria: row.categoria,
    plataforma: row.plataforma ?? void 0,
    quantidade: row.quantidade ?? void 0,
    valor: row.valor ?? 0,
    tickerCanonico: row.ticker_canonico ?? void 0,
    nomeCanonico: row.nome_canonico ?? void 0,
    identificadorCanonico: row.identificador_canonico ?? void 0,
    cnpjFundo: row.cnpj_fundo ?? void 0,
    isin: row.isin ?? void 0,
    aliases,
    metadados,
    status: row.status,
    observacao: row.observacao ?? void 0
  };
}, "mapRowToItem");
var RepositorioImportacaoD1 = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "RepositorioImportacaoD1");
  }
  async criarImportacao(registro) {
    await this.db.prepare(
      "INSERT INTO importacoes (id, usuario_id, arquivo_nome, status, total_linhas, conflitos, erros, validos) VALUES (?, ?, ?, 'pendente', 0, 0, 0, 0)"
    ).bind(registro.id, registro.usuarioId, registro.arquivoNome).run();
  }
  async salvarItens(importacaoId, itens) {
    const statements = itens.map(
      (item) => this.db.prepare(
        [
          "INSERT INTO itens_importacao",
          "(",
          "id, importacao_id, data_operacao, ticker, nome, categoria, plataforma, quantidade, valor,",
          "ticker_canonico, nome_canonico, identificador_canonico, cnpj_fundo, isin, aliases_json,",
          "metadata_json, aba_origem,",
          "status, observacao",
          ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ].join(" ")
      ).bind(
        `item_${importacaoId}_${item.linha}`,
        importacaoId,
        item.dataOperacao ?? null,
        item.ticker ?? null,
        item.nome,
        item.categoria,
        item.plataforma ?? null,
        item.quantidade ?? null,
        item.valor,
        item.tickerCanonico ?? null,
        item.nomeCanonico ?? null,
        item.identificadorCanonico ?? null,
        item.cnpjFundo ?? null,
        item.isin ?? null,
        item.aliases ? JSON.stringify(item.aliases) : null,
        item.metadados ? JSON.stringify(item.metadados) : null,
        item.abaOrigem ?? null,
        item.status,
        item.observacao ?? null
      )
    );
    if (statements.length > 0) {
      await this.db.batch(statements);
    }
  }
  async atualizarResumo(importacaoId, preview) {
    await this.db.prepare("UPDATE importacoes SET total_linhas = ?, conflitos = ?, erros = ?, validos = ? WHERE id = ?").bind(preview.totalLinhas, preview.conflitos, preview.erros, preview.validos, importacaoId).run();
  }
  async obterPreview(importacaoId) {
    const importacao = await this.db.prepare("SELECT id, total_linhas, conflitos, erros, validos FROM importacoes WHERE id = ?").bind(importacaoId).first();
    if (!importacao) return null;
    const itens = await this.listarItens(importacaoId);
    return {
      importacaoId: importacao.id,
      totalLinhas: importacao.total_linhas ?? itens.length,
      conflitos: importacao.conflitos ?? 0,
      erros: importacao.erros ?? 0,
      validos: importacao.validos ?? 0,
      itens
    };
  }
  async listarItens(importacaoId) {
    const result = await this.db.prepare(
      [
        "SELECT",
        "id, data_operacao, ticker, nome, categoria, plataforma, quantidade, valor,",
        "ticker_canonico, nome_canonico, identificador_canonico, cnpj_fundo, isin, aliases_json,",
        "metadata_json, aba_origem,",
        "status, observacao",
        "FROM itens_importacao",
        "WHERE importacao_id = ?",
        "ORDER BY id ASC"
      ].join(" ")
    ).bind(importacaoId).all();
    return (result.results ?? []).map(mapRowToItem);
  }
  async confirmarItens(importacaoId, usuarioId, itensValidos) {
    const itens = await this.listarItens(importacaoId);
    const selecionados = itens.filter((item) => item.status === "ok" && itensValidos.includes(item.linha));
    const ativosItems = selecionados.filter((item) => !categoriaPatrimonio.has(item.categoria));
    const patrimonioItems = selecionados.filter((item) => categoriaPatrimonio.has(item.categoria));
    const statements = [];
    for (const item of ativosItems) {
      const quantidade = Number(item.quantidade || 1);
      const valorTotal = Number(item.valor || 0);
      const precoMedioUnitario = quantidade > 0 ? valorTotal / quantidade : valorTotal;
      const ativoId = crypto.randomUUID();
      statements.push(
        this.db.prepare(
          [
            "INSERT INTO ativos",
            "(",
            "id, usuario_id, ticker, nome, categoria, plataforma, quantidade, preco_medio, valor_atual, participacao, retorno_12m,",
            "ticker_canonico, nome_canonico, identificador_canonico, cnpj_fundo, isin, aliases_json, data_cadastro, data_aquisicao",
            ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ].join(" ")
        ).bind(
          ativoId,
          usuarioId,
          item.ticker ?? null,
          item.nome || item.ticker || "Ativo",
          item.categoria,
          item.plataforma ?? null,
          quantidade,
          Number(precoMedioUnitario.toFixed(8)),
          Number(valorTotal.toFixed(2)),
          0,
          0,
          item.tickerCanonico ?? null,
          item.nomeCanonico ?? null,
          item.identificadorCanonico ?? null,
          item.cnpjFundo ?? null,
          item.isin ?? null,
          item.aliases ? JSON.stringify(item.aliases) : null,
          (/* @__PURE__ */ new Date()).toISOString(),
          item.dataOperacao || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
        )
      );
      if (valorTotal > 0) {
        statements.push(
          this.db.prepare(
            "INSERT INTO aportes (id, usuario_id, ativo_id, valor, data_aporte, origem, observacao, criado_em) VALUES (?, ?, ?, ?, ?, 'importacao', ?, ?)"
          ).bind(
            crypto.randomUUID(),
            usuarioId,
            ativoId,
            Number(valorTotal.toFixed(2)),
            item.dataOperacao || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
            item.nome || item.ticker || null,
            (/* @__PURE__ */ new Date()).toISOString()
          )
        );
      }
    }
    for (const item of patrimonioItems) {
      const meta = metaPatrimonio(item.categoria);
      const metadados = item.metadados ?? {};
      const valorAtual = Number(item.valor || 0);
      const custoAquisicao = valorAtual;
      statements.push(
        this.db.prepare(
          [
            "INSERT INTO posicoes_financeiras",
            "(id, usuario_id, tipo, nome, valor_atual, custo_aquisicao, liquidez, risco, categoria, metadata_json, ativo, criado_em, atualizado_em)",
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)"
          ].join(" ")
        ).bind(
          crypto.randomUUID(),
          usuarioId,
          item.categoria,
          // tipo: imovel | veiculo | poupanca
          item.nome,
          valorAtual,
          custoAquisicao,
          meta.liquidez,
          meta.risco,
          meta.categoriaPos,
          JSON.stringify(metadados),
          (/* @__PURE__ */ new Date()).toISOString(),
          (/* @__PURE__ */ new Date()).toISOString()
        )
      );
    }
    if (statements.length > 0) {
      await this.db.batch(statements);
    }
    await this.db.prepare("UPDATE importacoes SET status = 'confirmado' WHERE id = ?").bind(importacaoId).run();
    return { itensConfirmados: selecionados.length, itensIgnorados: itens.length - selecionados.length };
  }
};

// ../modulos-backend/importacao/src/servico.ts
var categoriasAtivo = /* @__PURE__ */ new Set(["acao", "fundo", "previdencia", "renda_fixa"]);
var regexTickerAcao = /^[A-Z]{4,5}\d{1,2}$/;
var regexTickerFundo = /^[A-Z0-9]{4,12}$/;
var colunasEsperadasCsv = ["data", "ticker", "nome", "categoria", "plataforma", "quantidade", "valor"];
var ServicoImportacaoPadrao = class {
  constructor(deps) {
    this.deps = deps;
  }
  static {
    __name(this, "ServicoImportacaoPadrao");
  }
  async gerarPreview(upload) {
    if (upload.tipoArquivo === "xlsx") {
      return this.gerarPreviewXlsx(upload);
    }
    return this.gerarPreviewCsv(upload);
  }
  // --------- CSV (legado) ---------
  async gerarPreviewCsv(upload) {
    const parser = this.encontrarParser(upload);
    const buffer = new TextEncoder().encode(upload.conteudo).buffer;
    const brutos = parser.processar(buffer);
    const itens = await Promise.all(
      brutos.map(
        (item) => this.validarItemAtivo(upload.usuarioId, {
          linha: item.linha,
          abaOrigem: mapCategoriaToAba(item.categoria),
          ticker: item.ticker,
          nome: item.nome,
          categoria: item.categoria,
          plataforma: item.plataforma,
          quantidade: item.quantidade,
          valor: item.valor,
          dataOperacao: item.dataOperacao,
          status: "ok"
        })
      )
    );
    return this.salvarERetornarPreview(upload.usuarioId, upload.nomeArquivo, itens);
  }
  // --------- XLSX (novo) ---------
  async gerarPreviewXlsx(upload) {
    const itens = await Promise.all(
      upload.itens.map((item, idx) => {
        const linha = item.linha ?? idx + 1;
        switch (item.aba) {
          case "acoes":
            return this.validarAcao(upload.usuarioId, item, linha);
          case "fundos":
            return this.validarFundo(upload.usuarioId, item, linha);
          case "imoveis":
            return this.validarImovel(upload.usuarioId, item, linha);
          case "veiculos":
            return this.validarVeiculo(upload.usuarioId, item, linha);
          case "poupanca":
            return this.validarPoupanca(upload.usuarioId, item, linha);
        }
      })
    );
    return this.salvarERetornarPreview(upload.usuarioId, upload.nomeArquivo, itens);
  }
  async salvarERetornarPreview(_usuarioId, nomeArquivo, itens) {
    const importacaoId = crypto.randomUUID();
    const preview = this.montarPreview(importacaoId, itens);
    await this.deps.repositorio.criarImportacao({
      id: importacaoId,
      usuarioId: _usuarioId,
      arquivoNome: nomeArquivo
    });
    await this.deps.repositorio.salvarItens(importacaoId, preview.itens);
    await this.deps.repositorio.atualizarResumo(importacaoId, preview);
    return preview;
  }
  async obterPreview(importacaoId) {
    const preview = await this.deps.repositorio.obterPreview(importacaoId);
    if (!preview) {
      throw new ErroImportacao("IMPORTACAO_NAO_ENCONTRADA", 404, "Importa\xE7\xE3o n\xE3o encontrada");
    }
    return preview;
  }
  async confirmarImportacao(importacaoId, itensValidos) {
    const preview = await this.obterPreview(importacaoId);
    const importacao = await this.deps.db.prepare("SELECT usuario_id FROM importacoes WHERE id = ?").bind(importacaoId).first();
    if (!importacao) throw new ErroImportacao("IMPORTACAO_NAO_ENCONTRADA", 404, "Importa\xE7\xE3o n\xE3o encontrada");
    const existentes = new Set(preview.itens.filter((i) => i.status === "ok").map((i) => i.linha));
    const linhasValidas = itensValidos.filter((linha) => existentes.has(linha));
    const resultado = await this.deps.repositorio.confirmarItens(importacaoId, importacao.usuario_id, linhasValidas);
    return {
      importacaoId,
      itensConfirmados: resultado.itensConfirmados,
      itensIgnorados: resultado.itensIgnorados
    };
  }
  // --------- Validações por tipo ---------
  async validarAcao(usuarioId, item, linha) {
    const base = {
      linha,
      abaOrigem: "acoes",
      categoria: "acao",
      ticker: (item.ticker ?? "").toUpperCase(),
      nome: item.nome ?? item.ticker ?? "",
      plataforma: item.plataforma ?? "Importa\xE7\xE3o",
      quantidade: Number(item.quantidade) || 0,
      valor: Number(item.precoMedio ?? 0) * Number(item.quantidade || 1) || Number(item.valorTotal ?? 0),
      dataOperacao: item.dataCompra,
      status: "ok"
    };
    if (!item.ticker?.trim()) {
      return { ...base, status: "erro", observacao: "ticker obrigat\xF3rio para a\xE7\xE3o" };
    }
    if (!Number.isFinite(base.valor) || base.valor <= 0) {
      return { ...base, status: "erro", observacao: "valor inv\xE1lido (pre\xE7o m\xE9dio ou valor total deve ser positivo)" };
    }
    return this.validarItemAtivo(usuarioId, base);
  }
  async validarFundo(usuarioId, item, linha) {
    const ticker = (item.nome ?? "").toUpperCase().replace(/\s+/g, "").slice(0, 12);
    const valor = Number(item.valorAplicado ?? 0);
    const base = {
      linha,
      abaOrigem: "fundos",
      categoria: "fundo",
      ticker,
      nome: item.nome ?? "",
      plataforma: item.instituicao ?? "Importa\xE7\xE3o",
      quantidade: 1,
      valor,
      dataOperacao: item.dataAplicacao,
      cnpjFundo: item.cnpj?.replace(/\D/g, ""),
      metadados: { tipo: item.tipo, cnpj: item.cnpj },
      status: "ok"
    };
    if (!item.nome?.trim()) {
      return { ...base, status: "erro", observacao: "nome do fundo obrigat\xF3rio" };
    }
    if (!item.instituicao?.trim()) {
      return { ...base, status: "erro", observacao: "institui\xE7\xE3o obrigat\xF3ria" };
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      return { ...base, status: "erro", observacao: "valor aplicado inv\xE1lido (deve ser positivo)" };
    }
    return this.validarItemAtivo(usuarioId, base);
  }
  async validarImovel(usuarioId, item, linha) {
    const valor = Number(item.valorEstimado ?? 0);
    const base = {
      linha,
      abaOrigem: "imoveis",
      categoria: "imovel",
      nome: item.descricao ?? "",
      valor,
      metadados: {
        tipo: item.tipo,
        saldoDevedor: item.saldoDevedor ?? 0,
        finalidade: item.finalidade,
        participacaoPercentual: item.participacaoPercentual ?? 100
      },
      status: "ok"
    };
    if (!item.descricao?.trim()) {
      return { ...base, status: "erro", observacao: "descri\xE7\xE3o do im\xF3vel obrigat\xF3ria" };
    }
    if (!item.tipo?.trim()) {
      return { ...base, status: "erro", observacao: "tipo do im\xF3vel obrigat\xF3rio" };
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      return { ...base, status: "erro", observacao: "valor estimado inv\xE1lido (deve ser positivo)" };
    }
    const conflito = await this.deps.db.prepare(
      "SELECT id FROM posicoes_financeiras WHERE usuario_id = ? AND tipo = 'imovel' AND nome = ? AND ativo = 1 LIMIT 1"
    ).bind(usuarioId, item.descricao.trim()).first();
    if (conflito) {
      return { ...base, status: "conflito", observacao: "im\xF3vel j\xE1 cadastrado com este nome" };
    }
    return base;
  }
  async validarVeiculo(usuarioId, item, linha) {
    const valor = Number(item.valorReferencia ?? 0);
    const ano = Number(item.anoModelo ?? 0);
    const nome = `${item.montadora ?? ""} ${item.modelo ?? ""} ${ano || ""}`.trim();
    const base = {
      linha,
      abaOrigem: "veiculos",
      categoria: "veiculo",
      nome,
      valor,
      metadados: {
        tipo: item.tipo,
        montadora: item.montadora,
        modelo: item.modelo,
        anoModelo: ano,
        saldoDevedor: item.saldoDevedor ?? 0
      },
      status: "ok"
    };
    if (!item.montadora?.trim() || !item.modelo?.trim()) {
      return { ...base, status: "erro", observacao: "montadora e modelo s\xE3o obrigat\xF3rios" };
    }
    if (!ano || ano < 1900 || ano > 2100) {
      return { ...base, status: "erro", observacao: "ano do modelo inv\xE1lido" };
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      return { ...base, status: "erro", observacao: "valor de refer\xEAncia inv\xE1lido (deve ser positivo)" };
    }
    const conflito = await this.deps.db.prepare(
      [
        "SELECT id FROM posicoes_financeiras",
        "WHERE usuario_id = ? AND tipo = 'veiculo' AND ativo = 1",
        "AND json_extract(metadata_json, '$.montadora') = ?",
        "AND json_extract(metadata_json, '$.modelo') = ?",
        "AND json_extract(metadata_json, '$.anoModelo') = ?",
        "LIMIT 1"
      ].join(" ")
    ).bind(usuarioId, item.montadora?.trim(), item.modelo?.trim(), ano).first();
    if (conflito) {
      return { ...base, status: "conflito", observacao: "ve\xEDculo j\xE1 cadastrado (mesma montadora, modelo e ano)" };
    }
    return base;
  }
  async validarPoupanca(usuarioId, item, linha) {
    const valor = Number(item.valorAtual ?? 0);
    const base = {
      linha,
      abaOrigem: "poupanca",
      categoria: "poupanca",
      nome: `Poupan\xE7a ${item.instituicao ?? ""}`.trim(),
      plataforma: item.instituicao,
      valor,
      metadados: {
        instituicao: item.instituicao,
        titularidade: item.titularidade
      },
      status: "ok"
    };
    if (!item.instituicao?.trim()) {
      return { ...base, status: "erro", observacao: "institui\xE7\xE3o obrigat\xF3ria" };
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      return { ...base, status: "erro", observacao: "valor atual inv\xE1lido (deve ser positivo)" };
    }
    const conflito = await this.deps.db.prepare(
      "SELECT id FROM posicoes_financeiras WHERE usuario_id = ? AND tipo = 'poupanca' AND ativo = 1 AND json_extract(metadata_json, '$.instituicao') = ? LIMIT 1"
    ).bind(usuarioId, item.instituicao.trim()).first();
    if (conflito) {
      return { ...base, status: "conflito", observacao: "poupan\xE7a j\xE1 cadastrada para esta institui\xE7\xE3o" };
    }
    return base;
  }
  // --------- Validação de ativos listados (ação/fundo/previdência/renda_fixa) ---------
  async validarItemAtivo(usuarioId, item) {
    const categoria = item.categoria;
    if (item.dataOperacao && Number.isNaN(Date.parse(item.dataOperacao))) {
      return { ...item, status: "erro", observacao: "data inv\xE1lida (use AAAA-MM-DD)" };
    }
    if (!Number.isFinite(item.valor) || item.valor <= 0) {
      return { ...item, status: "erro", observacao: "valor inv\xE1lido (deve ser maior que zero)" };
    }
    if (!categoriasAtivo.has(categoria)) {
      return { ...item, status: "erro", observacao: "categoria inv\xE1lida" };
    }
    const identidade = normalizarIdentidadeAtivo({
      ticker: item.ticker ?? "",
      nome: item.nome,
      categoria,
      cnpj: item.cnpjFundo
    });
    if (!identidade.identificadorCanonico) {
      return { ...item, status: "erro", observacao: "identifica\xE7\xE3o can\xF4nica inv\xE1lida" };
    }
    if (categoria === "acao" && (!identidade.tickerCanonico || !regexTickerAcao.test(identidade.tickerCanonico))) {
      return { ...item, status: "erro", observacao: "ticker n\xE3o reconhecido para a\xE7\xE3o (ex.: PETR4, VALE3)" };
    }
    if (categoria === "fundo" && !identidade.cnpjFundo && !identidade.isin && (!identidade.tickerCanonico || !regexTickerFundo.test(identidade.tickerCanonico))) {
      return { ...item, status: "erro", observacao: "ticker/CNPJ de fundo n\xE3o reconhecido" };
    }
    const conflito = await this.deps.db.prepare(
      [
        "SELECT id FROM ativos",
        "WHERE usuario_id = ?",
        "AND (",
        "  identificador_canonico = ?",
        "  OR ticker = ?",
        "  OR (? IS NOT NULL AND ticker_canonico = ?)",
        "  OR (? IS NOT NULL AND cnpj_fundo = ?)",
        "  OR (? IS NOT NULL AND isin = ?)",
        ")",
        "LIMIT 1"
      ].join(" ")
    ).bind(
      usuarioId,
      identidade.identificadorCanonico,
      item.ticker ?? "",
      identidade.tickerCanonico,
      identidade.tickerCanonico,
      identidade.cnpjFundo,
      identidade.cnpjFundo,
      identidade.isin,
      identidade.isin
    ).first();
    if (conflito) {
      return {
        ...item,
        tickerCanonico: identidade.tickerCanonico ?? void 0,
        nomeCanonico: identidade.nomeCanonico,
        identificadorCanonico: identidade.identificadorCanonico,
        cnpjFundo: identidade.cnpjFundo ?? void 0,
        isin: identidade.isin ?? void 0,
        aliases: identidade.aliases,
        status: "conflito",
        observacao: "ativo j\xE1 existe na carteira (conflito de identifica\xE7\xE3o)"
      };
    }
    return {
      ...item,
      tickerCanonico: identidade.tickerCanonico ?? void 0,
      nomeCanonico: identidade.nomeCanonico,
      identificadorCanonico: identidade.identificadorCanonico,
      cnpjFundo: identidade.cnpjFundo ?? void 0,
      isin: identidade.isin ?? void 0,
      aliases: identidade.aliases,
      status: "ok"
    };
  }
  // --------- Helpers CSV ---------
  encontrarParser(upload) {
    if ((upload.tipoArquivo ?? "").toLowerCase() !== "csv") {
      throw new ErroImportacao("ARQUIVO_TIPO_INVALIDO", 422, "Tipo de arquivo inv\xE1lido.");
    }
    const buffer = new TextEncoder().encode(upload.conteudo).buffer;
    const parser = this.deps.parsers.find((p) => p.detectar(buffer));
    if (!parser) {
      const cabecalhoEncontrado = extrairCabecalho(upload.conteudo);
      throw new ErroImportacao(
        "ARQUIVO_FORA_PADRAO",
        422,
        `Cabe\xE7alho encontrado: ${cabecalhoEncontrado || "(vazio)"}. Esperado: ${colunasEsperadasCsv.join(",")}`,
        { cabecalhoEncontrado, cabecalhoEsperado: colunasEsperadasCsv }
      );
    }
    return parser;
  }
  montarPreview(importacaoId, itens) {
    const validos = itens.filter((i) => i.status === "ok").length;
    const conflitos = itens.filter((i) => i.status === "conflito").length;
    const erros = itens.filter((i) => i.status === "erro").length;
    return { importacaoId, totalLinhas: itens.length, validos, conflitos, erros, itens };
  }
};
function mapCategoriaToAba(categoria) {
  if (categoria === "acao") return "acoes";
  if (categoria === "fundo") return "fundos";
  return "fundos";
}
__name(mapCategoriaToAba, "mapCategoriaToAba");
function extrairCabecalho(conteudo) {
  const primeiraLinha = conteudo.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  if (!primeiraLinha) return "";
  const delimitador = primeiraLinha.includes(";") ? ";" : ",";
  return primeiraLinha.split(delimitador).map((coluna) => coluna.trim().toLowerCase()).join(",");
}
__name(extrairCabecalho, "extrairCabecalho");

// src/server/utils/http.ts
var UpstreamHttpError = class extends Error {
  static {
    __name(this, "UpstreamHttpError");
  }
  status;
  source;
  constructor(message, status, source) {
    super(message);
    this.name = "UpstreamHttpError";
    this.status = status;
    this.source = source;
  }
};
var DEFAULT_RETRY_STATUSES = [502, 503, 504];
var sleep = /* @__PURE__ */ __name(async (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
}), "sleep");
async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
__name(fetchWithTimeout, "fetchWithTimeout");
async function httpJson(url, init, options) {
  const retryStatuses = options.retryOnStatuses ?? DEFAULT_RETRY_STATUSES;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, init, options.timeoutMs);
      if (!response.ok) {
        if (retryStatuses.includes(response.status) && attempt === 0) {
          await sleep(250);
          continue;
        }
        throw new UpstreamHttpError(`Upstream ${options.source} returned status ${response.status}`, response.status, options.source);
      }
      return await response.json();
    } catch (error) {
      const isTimeout = error instanceof Error && (error.name === "AbortError" || String(error.message).toLowerCase().includes("timeout"));
      const shouldRetry = attempt === 0 && isTimeout;
      if (shouldRetry) {
        await sleep(250);
        lastError = error;
        continue;
      }
      lastError = error;
      break;
    }
  }
  if (lastError instanceof UpstreamHttpError) throw lastError;
  if (lastError instanceof Error && (lastError.name === "AbortError" || String(lastError.message).toLowerCase().includes("timeout"))) {
    throw new UpstreamHttpError(`Timeout calling ${options.source}`, 408, options.source);
  }
  throw new UpstreamHttpError(`Failed to call ${options.source}`, 500, options.source);
}
__name(httpJson, "httpJson");

// src/server/providers/brapi.provider.ts
var BrapiProvider = class {
  static {
    __name(this, "BrapiProvider");
  }
  baseUrl;
  token;
  constructor(deps) {
    this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
    this.token = deps.token;
  }
  async fetchQuotes(tickers) {
    const unique = Array.from(new Set(tickers.map((item) => item.trim().toUpperCase()).filter(Boolean)));
    const path = `${this.baseUrl}/quote/${encodeURIComponent(unique.join(","))}?token=${encodeURIComponent(this.token)}`;
    const response = await httpJson(
      path,
      { method: "GET", headers: { Accept: "application/json" } },
      { timeoutMs: 8e3, source: "brapi" }
    );
    return response.results ?? [];
  }
  async fetchHistory(ticker, range, interval) {
    const path = `${this.baseUrl}/quote/${encodeURIComponent(ticker)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}&token=${encodeURIComponent(this.token)}`;
    const response = await httpJson(
      path,
      { method: "GET", headers: { Accept: "application/json" } },
      { timeoutMs: 8e3, source: "brapi" }
    );
    return (response.results ?? [])[0] ?? null;
  }
};

// src/server/providers/cvm.provider.ts
var tryFetchText = /* @__PURE__ */ __name(async (url, timeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/csv,application/octet-stream,text/plain,*/*",
        "User-Agent": "EsquiloInvest-MVP/1.0 (+https://esquiloinvest.local)"
      },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`cvm_status_${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}, "tryFetchText");
var yearMonth = /* @__PURE__ */ __name((date) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}, "yearMonth");
var CvmProvider = class {
  static {
    __name(this, "CvmProvider");
  }
  baseUrl;
  constructor(deps) {
    this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
  }
  async fetchCadastroFundsCsv() {
    const url = `${this.baseUrl}/dados/FI/CAD/DADOS/cad_fi.csv`;
    return tryFetchText(url, 15e3);
  }
  async fetchInformeDiarioLatestCsv() {
    const now = /* @__PURE__ */ new Date();
    const attempts = [0, 1, 2, 3].map((offset) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
      return `${this.baseUrl}/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_${yearMonth(d)}.csv`;
    });
    let lastError;
    for (const url of attempts) {
      try {
        return await tryFetchText(url, 15e3);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("cvm_upstream_error");
  }
  async checkUrl(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("timeout"), 1e4);
    try {
      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "EsquiloInvest-MVP/1.0 (+https://esquiloinvest.local)"
        },
        signal: controller.signal
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }
};

// src/server/utils/cnpj.ts
var normalizeCnpj = /* @__PURE__ */ __name((input) => input.replace(/\D+/g, ""), "normalizeCnpj");
var toSearchText = /* @__PURE__ */ __name((value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(), "toSearchText");
var matchesSearch = /* @__PURE__ */ __name((name, query) => toSearchText(name).includes(toSearchText(query)), "matchesSearch");

// src/server/mappers/cvm.mapper.ts
var toNumber = /* @__PURE__ */ __name((value) => {
  if (!value) return null;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}, "toNumber");
var toBool = /* @__PURE__ */ __name((value) => {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  if (v === "S" || v === "SIM" || v === "Y" || v === "1") return true;
  if (v === "N" || v === "NAO" || v === "N\xC3O" || v === "0") return false;
  return null;
}, "toBool");
var pickBestCadastro = /* @__PURE__ */ __name((items, cnpj) => {
  const normalized = normalizeCnpj(cnpj);
  const exact = items.find((item) => normalizeCnpj(item.CNPJ_FUNDO ?? "") === normalized);
  if (exact) return exact;
  return items[0] ?? null;
}, "pickBestCadastro");
var mapFundSearchItem = /* @__PURE__ */ __name((cadastro) => ({
  cnpj: normalizeCnpj(cadastro.CNPJ_FUNDO ?? ""),
  name: cadastro.DENOM_SOCIAL ?? "",
  status: cadastro.SIT ?? null,
  className: cadastro.CLASSE_ANBIMA ?? cadastro.DIRETOR ?? null
}), "mapFundSearchItem");
var mapFundDailyReport = /* @__PURE__ */ __name((cnpj, daily, fetchedAt) => ({
  source: "cvm",
  cnpj: normalizeCnpj(cnpj),
  date: (daily.DT_COMPTC ?? "").slice(0, 10),
  quotaValue: toNumber(daily.VL_QUOTA),
  netWorth: toNumber(daily.VL_PATRIM_LIQ),
  portfolioValue: toNumber(daily.VL_TOTAL),
  fundraising: toNumber(daily.CAPTC_DIA),
  redemption: toNumber(daily.RESG_DIA),
  shareholders: toNumber(daily.NR_COTST),
  fetchedAt
}), "mapFundDailyReport");
var mapFundSummary = /* @__PURE__ */ __name((cadastro, daily, fetchedAt) => ({
  source: "cvm",
  cnpj: normalizeCnpj(cadastro.CNPJ_FUNDO ?? ""),
  name: cadastro.DENOM_SOCIAL ?? "",
  status: cadastro.SIT ?? null,
  className: cadastro.CLASSE_ANBIMA ?? null,
  administrator: cadastro.ADMIN ?? cadastro.DENOM_SOCIAL_ADMIN ?? null,
  manager: cadastro.GESTOR ?? cadastro.DIRETOR ?? null,
  startDate: (cadastro.DT_INI_ATIV ?? "").slice(0, 10) || null,
  benchmark: cadastro.INDICADOR_DESEMPENHO ?? null,
  exclusive: toBool(cadastro.FUNDO_EXCLUSIVO),
  qualifiedInvestor: toBool(cadastro.CONDOM),
  professionalInvestor: toBool(cadastro.FUNDO_COTAS),
  openFund: toBool(cadastro.FUNDO_COTAS),
  latestQuotaDate: daily ? (daily.DT_COMPTC ?? "").slice(0, 10) : null,
  latestQuotaValue: daily ? toNumber(daily.VL_QUOTA) : null,
  latestNetWorth: daily ? toNumber(daily.VL_PATRIM_LIQ) : null,
  latestFundraising: daily ? toNumber(daily.CAPTC_DIA) : null,
  latestRedemption: daily ? toNumber(daily.RESG_DIA) : null,
  latestShareholders: daily ? toNumber(daily.NR_COTST) : null,
  fetchedAt
}), "mapFundSummary");

// src/server/utils/cache.ts
var readMemory = /* @__PURE__ */ new Map();
var nowIso = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString(), "nowIso");
var plusMsIso = /* @__PURE__ */ __name((ms) => new Date(Date.now() + ms).toISOString(), "plusMsIso");
var buildKey = /* @__PURE__ */ __name((source, key) => `${source}:${key}`, "buildKey");
var readCache = /* @__PURE__ */ __name(async (db, source, key) => {
  const composite = buildKey(source, key);
  const fromMem = readMemory.get(composite);
  if (fromMem && fromMem.expiraEm > nowIso()) return fromMem.payload;
  if (!db) return null;
  const row = await db.prepare("SELECT payload_json, expira_em FROM cotacoes_ativos_cache WHERE fonte = ? AND chave_ativo = ? LIMIT 1").bind(source, key).first();
  if (!row || !row.payload_json || row.expira_em <= nowIso()) return null;
  const payload = JSON.parse(row.payload_json);
  readMemory.set(composite, { payload, expiraEm: row.expira_em });
  return payload;
}, "readCache");
var writeCache = /* @__PURE__ */ __name(async (db, source, key, payload, ttlMs) => {
  const expiraEm = plusMsIso(ttlMs);
  const composite = buildKey(source, key);
  readMemory.set(composite, { payload, expiraEm });
  if (!db) return;
  const now = nowIso();
  await db.prepare(
    [
      "INSERT INTO cotacoes_ativos_cache (id, fonte, chave_ativo, payload_json, atualizado_em, expira_em)",
      "VALUES (?, ?, ?, ?, ?, ?)",
      "ON CONFLICT(fonte, chave_ativo) DO UPDATE SET",
      "payload_json = excluded.payload_json, atualizado_em = excluded.atualizado_em, expira_em = excluded.expira_em, erro = NULL"
    ].join(" ")
  ).bind(crypto.randomUUID(), source, key, JSON.stringify(payload), now, expiraEm).run();
}, "writeCache");

// src/server/utils/csv.ts
var parseCsv = /* @__PURE__ */ __name((content, delimiter = ";") => {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    const next = content[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      row.push(field);
      field = "";
      continue;
    }
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += ch;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}, "parseCsv");
var toObjects = /* @__PURE__ */ __name((rows) => {
  if (rows.length === 0) return [];
  const headers = rows[0].map((item) => item.trim());
  return rows.slice(1).map((cols) => {
    const item = {};
    headers.forEach((header, idx) => {
      item[header] = (cols[idx] ?? "").trim();
    });
    return item;
  });
}, "toObjects");

// src/server/services/fund-data.service.ts
var TTL_SEARCH_MS = 24 * 60 * 60 * 1e3;
var TTL_SUMMARY_MS = 12 * 60 * 60 * 1e3;
var TTL_DAILY_MS = 12 * 60 * 60 * 1e3;
var TTL_DOCUMENTS_MS = 24 * 60 * 60 * 1e3;
var FundDataService = class {
  static {
    __name(this, "FundDataService");
  }
  provider;
  db;
  constructor(deps) {
    this.provider = deps.provider;
    this.db = deps.db;
  }
  async loadBundle() {
    const cacheKey = "bundle:v1";
    const cached = await readCache(this.db, "cvm", cacheKey);
    if (cached) return cached;
    const [cadastroCsv, dailyCsv] = await Promise.all([this.provider.fetchCadastroFundsCsv(), this.provider.fetchInformeDiarioLatestCsv()]);
    const bundle = {
      cadastro: toObjects(parseCsv(cadastroCsv)),
      daily: toObjects(parseCsv(dailyCsv)),
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await writeCache(this.db, "cvm", cacheKey, bundle, TTL_DAILY_MS);
    return bundle;
  }
  async searchFunds(query) {
    const normalized = query.trim();
    const cacheKey = `search:${normalized.toLowerCase()}`;
    const cached = await readCache(this.db, "cvm", cacheKey);
    if (cached) return cached;
    const bundle = await this.loadBundle();
    const items = bundle.cadastro.filter((item) => normalized.length > 0 && matchesSearch(item.DENOM_SOCIAL ?? "", normalized)).slice(0, 50).map(mapFundSearchItem);
    const response = {
      query: normalized,
      items,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await writeCache(this.db, "cvm", cacheKey, response, TTL_SEARCH_MS);
    return response;
  }
  async getFundSummary(cnpj) {
    const normalized = normalizeCnpj(cnpj);
    const cacheKey = `summary:${normalized}`;
    const cached = await readCache(this.db, "cvm", cacheKey);
    if (cached) return cached;
    const bundle = await this.loadBundle();
    const cadastroCandidates = bundle.cadastro.filter((item) => normalizeCnpj(item.CNPJ_FUNDO ?? "") === normalized);
    const cadastro = pickBestCadastro(cadastroCandidates, normalized);
    if (!cadastro) return null;
    const daily = this.pickLatestDaily(bundle.daily, normalized);
    const summary = mapFundSummary(cadastro, daily, (/* @__PURE__ */ new Date()).toISOString());
    await writeCache(this.db, "cvm", cacheKey, summary, TTL_SUMMARY_MS);
    return summary;
  }
  async getFundDailyLatest(cnpj) {
    const normalized = normalizeCnpj(cnpj);
    const cacheKey = `daily-latest:${normalized}`;
    const cached = await readCache(this.db, "cvm", cacheKey);
    if (cached) return cached;
    const bundle = await this.loadBundle();
    const latest = this.pickLatestDaily(bundle.daily, normalized);
    if (!latest) return null;
    const report = mapFundDailyReport(normalized, latest, (/* @__PURE__ */ new Date()).toISOString());
    await writeCache(this.db, "cvm", cacheKey, report, TTL_DAILY_MS);
    return report;
  }
  async getFundDailyHistory(cnpj, limit) {
    const normalized = normalizeCnpj(cnpj);
    const bundle = await this.loadBundle();
    return bundle.daily.filter((item) => normalizeCnpj(item.CNPJ_FUNDO_CLASSE ?? item.CNPJ_FUNDO ?? "") === normalized).sort((a, b) => String(b.DT_COMPTC ?? "").localeCompare(String(a.DT_COMPTC ?? ""))).slice(0, limit).map((item) => mapFundDailyReport(normalized, item, (/* @__PURE__ */ new Date()).toISOString()));
  }
  async getFundDocuments(cnpj) {
    const normalized = normalizeCnpj(cnpj);
    const cacheKey = `documents:${normalized}`;
    const cached = await readCache(this.db, "cvm", cacheKey);
    if (cached) return cached;
    const bundle = await this.loadBundle();
    const cadastro = pickBestCadastro(bundle.cadastro.filter((item) => normalizeCnpj(item.CNPJ_FUNDO ?? "") === normalized), normalized);
    const fundName = cadastro?.DENOM_SOCIAL ?? null;
    const fetchedAt = (/* @__PURE__ */ new Date()).toISOString();
    const baseCvmUrl = "https://cvmweb.cvm.gov.br/swb/default.asp?sg_sistema=scw&sg_tipo_consulta=fundos";
    const candidateItems = [
      {
        cnpj: normalized,
        fundName,
        type: "report",
        title: "Consulta p\xFAblica do fundo na CVM",
        documentDate: null,
        referenceDate: null,
        source: "cvm",
        url: baseCvmUrl,
        fetchedAt
      },
      {
        cnpj: normalized,
        fundName,
        type: "fact_sheet",
        title: "L\xE2mina do fundo (se dispon\xEDvel na CVM)",
        documentDate: null,
        referenceDate: null,
        source: "cvm",
        url: "https://dados.cvm.gov.br/dados/FI/DOC/LAMINA/DADOS/",
        fetchedAt
      },
      {
        cnpj: normalized,
        fundName,
        type: "financial_statement",
        title: "Demonstra\xE7\xF5es financeiras de fundos (CVM)",
        documentDate: null,
        referenceDate: null,
        source: "cvm",
        url: "https://dados.cvm.gov.br/dados/FI/DOC/DFP/DADOS/",
        fetchedAt
      }
    ];
    const checks = await Promise.all(candidateItems.map((item) => item.url ? this.provider.checkUrl(item.url) : Promise.resolve(false)));
    const items = candidateItems.filter((_item, idx) => checks[idx]);
    const result = { cnpj: normalized, items, fetchedAt };
    await writeCache(this.db, "cvm", cacheKey, result, TTL_DOCUMENTS_MS);
    return result;
  }
  pickLatestDaily(items, cnpj) {
    const normalized = normalizeCnpj(cnpj);
    const filtered = items.filter((item) => normalizeCnpj(item.CNPJ_FUNDO_CLASSE ?? item.CNPJ_FUNDO ?? "") === normalized);
    if (filtered.length === 0) return null;
    return filtered.sort((a, b) => String(b.DT_COMPTC ?? "").localeCompare(String(a.DT_COMPTC ?? "")))[0];
  }
};

// src/server/mappers/brapi.mapper.ts
var asNumber = /* @__PURE__ */ __name((value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}, "asNumber");
var asString = /* @__PURE__ */ __name((value) => typeof value === "string" && value.trim() ? value.trim() : null, "asString");
var mapType2 = /* @__PURE__ */ __name((value) => {
  const normalized = (asString(value) ?? "").toLowerCase();
  if (normalized.includes("stock")) return "stock";
  if (normalized.includes("fii") || normalized.includes("fund")) return "fii";
  if (normalized.includes("etf")) return "etf";
  if (normalized.includes("bdr")) return "bdr";
  if (normalized.includes("index")) return "index";
  return "unknown";
}, "mapType");
var mapBrapiQuote = /* @__PURE__ */ __name((input, requestedTicker, fetchedAt) => {
  const item = input ?? {};
  return {
    source: "brapi",
    ticker: requestedTicker.toUpperCase(),
    name: asString(item.longName) ?? asString(item.shortName),
    type: mapType2(item.quoteType),
    currency: asString(item.currency),
    exchange: asString(item.exchange) ?? asString(item.exchangeName),
    price: asNumber(item.regularMarketPrice) ?? asNumber(item.price),
    change: asNumber(item.regularMarketChange),
    changePercent: asNumber(item.regularMarketChangePercent),
    previousClose: asNumber(item.regularMarketPreviousClose),
    open: asNumber(item.regularMarketOpen),
    high: asNumber(item.regularMarketDayHigh),
    low: asNumber(item.regularMarketDayLow),
    volume: asNumber(item.regularMarketVolume),
    marketCap: asNumber(item.marketCap),
    updatedAt: asString(item.regularMarketTime) ?? asString(item.updatedAt),
    fetchedAt
  };
}, "mapBrapiQuote");
var mapBrapiHistory = /* @__PURE__ */ __name((input, ticker, range, interval, fetchedAt) => {
  const item = input ?? {};
  const pointsRaw = Array.isArray(item.historicalDataPrice) ? item.historicalDataPrice : Array.isArray(item.historicalData) ? item.historicalData : [];
  const points = pointsRaw.map((point) => ({
    date: typeof point.date === "number" ? new Date(point.date * 1e3).toISOString().slice(0, 10) : asString(point.date) ?? "",
    open: asNumber(point.open),
    high: asNumber(point.high),
    low: asNumber(point.low),
    close: asNumber(point.close),
    volume: asNumber(point.volume)
  }));
  return {
    source: "brapi",
    ticker: ticker.toUpperCase(),
    range,
    interval,
    points: points.filter((point) => point.date.length > 0),
    fetchedAt
  };
}, "mapBrapiHistory");

// src/server/services/market-data.service.ts
var TTL_QUOTE_MS = 30 * 1e3;
var TTL_HISTORY_MS = 30 * 60 * 1e3;
var MarketDataService = class {
  static {
    __name(this, "MarketDataService");
  }
  provider;
  db;
  constructor(deps) {
    this.provider = deps.provider;
    this.db = deps.db;
  }
  async getQuote(ticker) {
    const cacheKey = `quote:${ticker.toUpperCase()}`;
    const cached = await readCache(this.db, "brapi", cacheKey);
    if (cached) return cached;
    const items = await this.provider.fetchQuotes([ticker]);
    const found = items.find((item) => String(item.symbol ?? "").toUpperCase() === ticker.toUpperCase()) ?? items[0];
    const mapped = mapBrapiQuote(found, ticker, (/* @__PURE__ */ new Date()).toISOString());
    await writeCache(this.db, "brapi", cacheKey, mapped, TTL_QUOTE_MS);
    return mapped;
  }
  async getQuotes(tickers) {
    const normalized = Array.from(new Set(tickers.map((item) => item.trim().toUpperCase()).filter(Boolean)));
    const cacheReads = await Promise.all(normalized.map((ticker) => readCache(this.db, "brapi", `quote:${ticker}`)));
    const fromCache = /* @__PURE__ */ new Map();
    cacheReads.forEach((item) => {
      if (item) fromCache.set(item.ticker, item);
    });
    const missing = normalized.filter((ticker) => !fromCache.has(ticker));
    if (missing.length > 0) {
      let mappedMissing = [];
      try {
        const fetchedAt = (/* @__PURE__ */ new Date()).toISOString();
        const raw = await this.provider.fetchQuotes(missing);
        mappedMissing = missing.map((ticker) => {
          const found = raw.find((item) => String(item.symbol ?? "").toUpperCase() === ticker);
          return mapBrapiQuote(found, ticker, fetchedAt);
        });
      } catch {
        mappedMissing = await Promise.all(
          missing.map(async (ticker) => {
            try {
              return await this.getQuote(ticker);
            } catch {
              return mapBrapiQuote(null, ticker, (/* @__PURE__ */ new Date()).toISOString());
            }
          })
        );
      }
      await Promise.all(mappedMissing.map((item) => writeCache(this.db, "brapi", `quote:${item.ticker}`, item, TTL_QUOTE_MS)));
      mappedMissing.forEach((item) => fromCache.set(item.ticker, item));
    }
    return normalized.map((ticker) => fromCache.get(ticker) ?? mapBrapiQuote(null, ticker, (/* @__PURE__ */ new Date()).toISOString()));
  }
  async getHistory(ticker, range, interval) {
    const cacheKey = `history:${ticker.toUpperCase()}:${range}:${interval}`;
    const cached = await readCache(this.db, "brapi", cacheKey);
    if (cached) return cached;
    const raw = await this.provider.fetchHistory(ticker, range, interval);
    const mapped = mapBrapiHistory(raw, ticker, range, interval, (/* @__PURE__ */ new Date()).toISOString());
    await writeCache(this.db, "brapi", cacheKey, mapped, TTL_HISTORY_MS);
    return mapped;
  }
};

// src/server/services/portfolio-analysis.service.ts
var DISCLAIMER = "Este sinal \xE9 automatizado e baseado em regras objetivas de pre\xE7o, hist\xF3rico e pre\xE7o m\xE9dio da posi\xE7\xE3o. N\xE3o constitui recomenda\xE7\xE3o financeira profissional.";
var toNum = /* @__PURE__ */ __name((value) => Number(value.toFixed(4)), "toNum");
var PortfolioAnalysisService = class {
  static {
    __name(this, "PortfolioAnalysisService");
  }
  market;
  googleFinance;
  constructor(deps) {
    this.market = deps.market;
    this.googleFinance = deps.googleFinance;
  }
  async analyzePosition(input) {
    const ticker = input.ticker.trim().toUpperCase();
    const quote = await this.market.getQuote(ticker);
    const history = await this.market.getHistory(ticker, "3mo", "1d");
    let source = "brapi";
    let currentPrice = quote.price;
    if (currentPrice === null && this.googleFinance) {
      const gf = await this.googleFinance.fetchQuote(ticker);
      if (gf?.price !== null && gf?.price !== void 0) {
        currentPrice = gf.price;
        source = "google_finance";
      }
    }
    const averagePrice = Number.isFinite(input.averagePrice) ? input.averagePrice : null;
    const quantity = Number.isFinite(input.quantity) ? input.quantity : null;
    const investedAmount = averagePrice !== null && quantity !== null ? toNum(averagePrice * quantity) : null;
    const marketValue = currentPrice !== null && quantity !== null ? toNum(currentPrice * quantity) : null;
    const profitLossValue = investedAmount !== null && marketValue !== null ? toNum(marketValue - investedAmount) : null;
    const profitLossPercent = currentPrice !== null && averagePrice !== null && averagePrice > 0 ? toNum((currentPrice - averagePrice) / averagePrice * 100) : null;
    const historicalTrend = this.computeTrend(history.points.map((point) => point.close).filter((v) => typeof v === "number"));
    const signalResult = this.computeSignal({
      currentPrice,
      averagePrice,
      profitLossPercent,
      historicalTrend
    });
    return {
      ticker,
      currentPrice,
      averagePrice,
      quantity,
      investedAmount,
      marketValue,
      profitLossValue,
      profitLossPercent,
      historicalTrend,
      signal: signalResult.signal,
      confidence: signalResult.confidence,
      rationale: signalResult.rationale,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      source,
      disclaimer: DISCLAIMER
    };
  }
  async analyzePositions(items) {
    return Promise.all(items.map((item) => this.analyzePosition(item)));
  }
  computeTrend(prices) {
    if (prices.length < 7) return "unknown";
    const window = prices.slice(-15);
    const first = window[0];
    const last = window[window.length - 1];
    if (!Number.isFinite(first) || !Number.isFinite(last) || first <= 0) return "unknown";
    const change = (last - first) / first * 100;
    if (change >= 2.5) return "up";
    if (change <= -2.5) return "down";
    return "sideways";
  }
  computeSignal(input) {
    const rationale = [];
    if (input.currentPrice === null || input.averagePrice === null || input.profitLossPercent === null) {
      return {
        signal: "hold",
        confidence: "low",
        rationale: ["Dados insuficientes de pre\xE7o ou posi\xE7\xE3o para emitir sinal forte."]
      };
    }
    if (input.profitLossPercent >= 12 && (input.historicalTrend === "down" || input.historicalTrend === "sideways")) {
      rationale.push("Lucro relevante acima de 12%.", "Tend\xEAncia recente perdeu for\xE7a ap\xF3s valoriza\xE7\xE3o.");
      return { signal: "sell", confidence: input.historicalTrend === "down" ? "high" : "medium", rationale };
    }
    if (input.profitLossPercent <= -6 && input.historicalTrend === "up") {
      rationale.push("Pre\xE7o atual abaixo do pre\xE7o m\xE9dio.", "Tend\xEAncia recente de recupera\xE7\xE3o.");
      return { signal: "buy", confidence: "medium", rationale };
    }
    if (input.historicalTrend === "up" && input.profitLossPercent < 4) {
      rationale.push("Tend\xEAncia de alta no hist\xF3rico curto.", "Gap para o pre\xE7o m\xE9dio ainda controlado.");
      return { signal: "buy", confidence: "low", rationale };
    }
    rationale.push("Sem gatilho claro de compra ou venda.", "Tend\xEAncia e resultado atual pedem acompanhamento.");
    return { signal: "hold", confidence: "medium", rationale };
  }
};

// src/server/providers/google-finance.provider.ts
var GoogleFinanceProvider = class {
  static {
    __name(this, "GoogleFinanceProvider");
  }
  async fetchQuote(_ticker) {
    return null;
  }
};

// src/server/providers/fipe.provider.ts
var toPrice = /* @__PURE__ */ __name((raw) => {
  if (!raw) return null;
  const normalized = raw.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}, "toPrice");
var FipeProvider = class {
  static {
    __name(this, "FipeProvider");
  }
  baseUrl;
  constructor(deps) {
    this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
  }
  async fetchBrands() {
    const data = await httpJson(
      `${this.baseUrl}/marcas`,
      { method: "GET", headers: { Accept: "application/json" } },
      { timeoutMs: 8e3, source: "fipe" }
    );
    return (data || []).map((item) => ({ code: String(item.codigo), label: item.nome }));
  }
  async fetchModels(brandCode) {
    const data = await httpJson(
      `${this.baseUrl}/marcas/${encodeURIComponent(brandCode)}/modelos`,
      { method: "GET", headers: { Accept: "application/json" } },
      { timeoutMs: 8e3, source: "fipe" }
    );
    return (data.modelos || []).map((item) => ({ code: String(item.codigo), label: item.nome }));
  }
  async fetchYears(brandCode, modelCode) {
    const data = await httpJson(
      `${this.baseUrl}/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos`,
      { method: "GET", headers: { Accept: "application/json" } },
      { timeoutMs: 8e3, source: "fipe" }
    );
    return (data || []).map((item) => ({ code: item.codigo, label: item.nome }));
  }
  async fetchPrice(brandCode, modelCode, yearCode) {
    const data = await httpJson(
      `${this.baseUrl}/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos/${encodeURIComponent(yearCode)}`,
      { method: "GET", headers: { Accept: "application/json" } },
      { timeoutMs: 8e3, source: "fipe" }
    );
    return {
      referencePrice: toPrice(data.Valor),
      referencePriceLabel: data.Valor ?? null,
      fipeCode: data.CodigoFipe ?? null,
      brand: data.Marca ?? null,
      model: data.Modelo ?? null,
      modelYear: typeof data.AnoModelo === "number" ? data.AnoModelo : null,
      fuel: data.Combustivel ?? null,
      source: "fipe",
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};

// src/server/services/fipe.service.ts
var TTL_FIPE_MS = 24 * 60 * 60 * 1e3;
var FipeService = class {
  static {
    __name(this, "FipeService");
  }
  provider;
  db;
  constructor(deps) {
    this.provider = deps.provider;
    this.db = deps.db;
  }
  async getBrands() {
    const key = "fipe:brands:carros";
    const cached = await readCache(this.db, "fipe", key);
    if (cached) return cached;
    const data = await this.provider.fetchBrands();
    await writeCache(this.db, "fipe", key, data, TTL_FIPE_MS);
    return data;
  }
  async getModels(brandCode) {
    const key = `fipe:models:carros:${brandCode}`;
    const cached = await readCache(this.db, "fipe", key);
    if (cached) return cached;
    const data = await this.provider.fetchModels(brandCode);
    await writeCache(this.db, "fipe", key, data, TTL_FIPE_MS);
    return data;
  }
  async getYears(brandCode, modelCode) {
    const key = `fipe:years:carros:${brandCode}:${modelCode}`;
    const cached = await readCache(this.db, "fipe", key);
    if (cached) return cached;
    const data = await this.provider.fetchYears(brandCode, modelCode);
    await writeCache(this.db, "fipe", key, data, TTL_FIPE_MS);
    return data;
  }
  async getPrice(brandCode, modelCode, yearCode) {
    const key = `fipe:price:carros:${brandCode}:${modelCode}:${yearCode}`;
    const cached = await readCache(this.db, "fipe", key);
    if (cached) return cached;
    const data = await this.provider.fetchPrice(brandCode, modelCode, yearCode);
    await writeCache(this.db, "fipe", key, data, TTL_FIPE_MS);
    return data;
  }
};

// src/server/routes/financial.routes.ts
var badRequest = /* @__PURE__ */ __name((message, details) => ({
  ok: false,
  status: 400,
  codigo: "BAD_REQUEST",
  mensagem: message,
  detalhes: details
}), "badRequest");
var mapApiError = /* @__PURE__ */ __name((code, message, source, details) => ({
  ok: false,
  status: code === "NOT_FOUND" ? 404 : code === "TIMEOUT" ? 504 : code === "RATE_LIMIT" ? 429 : 502,
  codigo: code,
  mensagem: message,
  detalhes: { source, details }
}), "mapApiError");
var fromUpstreamError = /* @__PURE__ */ __name((error) => error.status === 408 ? mapApiError("TIMEOUT", "Timeout no provedor externo", error.source, { status: error.status }) : error.status === 429 ? mapApiError("RATE_LIMIT", "Limite de requisi\xE7\xF5es no provedor externo", error.source, { status: error.status }) : mapApiError("UPSTREAM_ERROR", "Falha no provedor externo", error.source, { status: error.status }), "fromUpstreamError");
var getMarketService = /* @__PURE__ */ __name((env, token) => new MarketDataService({
  db: env.DB,
  provider: new BrapiProvider({
    token,
    baseUrl: env.BRAPI_BASE_URL?.trim() || "https://brapi.dev/api"
  })
}), "getMarketService");
var getFundService = /* @__PURE__ */ __name((env) => new FundDataService({
  db: env.DB,
  provider: new CvmProvider({
    baseUrl: env.CVM_BASE_URL?.trim() || "https://dados.cvm.gov.br"
  })
}), "getFundService");
var getFipeService = /* @__PURE__ */ __name((env) => new FipeService({
  db: env.DB,
  provider: new FipeProvider({
    baseUrl: env.FIPE_BASE_URL?.trim() || "https://parallelum.com.br/fipe/api/v1/carros"
  })
}), "getFipeService");
var parseJsonBody = /* @__PURE__ */ __name(async (request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
}, "parseJsonBody");
async function handleFinancialRoutes(pathname, request, env) {
  try {
    if (pathname.startsWith("/api/market/")) {
      const token = env.BRAPI_TOKEN?.trim();
      if (!token) return mapApiError("INTERNAL_ERROR", "BRAPI_TOKEN n\xE3o configurado no servidor", "internal");
      const market = getMarketService(env, token);
      if (pathname.startsWith("/api/market/quote/") && request.method === "GET") {
        const ticker = decodeURIComponent(pathname.replace("/api/market/quote/", "")).trim();
        if (!ticker) return badRequest("Ticker \xE9 obrigat\xF3rio");
        return { ok: true, dados: await market.getQuote(ticker) };
      }
      if (pathname === "/api/market/quotes" && request.method === "GET") {
        const url = new URL(request.url);
        const tickers = (url.searchParams.get("tickers") ?? "").split(",").map((item) => item.trim()).filter(Boolean);
        if (tickers.length === 0) return badRequest("Par\xE2metro tickers \xE9 obrigat\xF3rio");
        const items = await market.getQuotes(tickers);
        return { ok: true, dados: { items, fetchedAt: (/* @__PURE__ */ new Date()).toISOString() } };
      }
      if (pathname.startsWith("/api/market/history/") && request.method === "GET") {
        const ticker = decodeURIComponent(pathname.replace("/api/market/history/", "")).trim();
        if (!ticker) return badRequest("Ticker \xE9 obrigat\xF3rio");
        const url = new URL(request.url);
        const range = (url.searchParams.get("range") ?? "1mo").trim() || "1mo";
        const interval = (url.searchParams.get("interval") ?? "1d").trim() || "1d";
        return { ok: true, dados: await market.getHistory(ticker, range, interval) };
      }
    }
    if (pathname.startsWith("/api/funds/")) {
      const funds = getFundService(env);
      if (pathname === "/api/funds/search" && request.method === "GET") {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") ?? "").trim();
        if (!q) return badRequest("Par\xE2metro q \xE9 obrigat\xF3rio");
        return { ok: true, dados: await funds.searchFunds(q) };
      }
      if (pathname.endsWith("/daily-latest") && request.method === "GET") {
        const cnpj = normalizeCnpj(decodeURIComponent(pathname.replace("/api/funds/", "").replace("/daily-latest", "")));
        if (!cnpj) return badRequest("CNPJ inv\xE1lido");
        const report = await funds.getFundDailyLatest(cnpj);
        if (!report) return mapApiError("NOT_FOUND", "Fundo n\xE3o encontrado", "cvm");
        return { ok: true, dados: report };
      }
      if (pathname.endsWith("/daily-history") && request.method === "GET") {
        const cnpj = normalizeCnpj(decodeURIComponent(pathname.replace("/api/funds/", "").replace("/daily-history", "")));
        if (!cnpj) return badRequest("CNPJ inv\xE1lido");
        const url = new URL(request.url);
        const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "30", 10);
        const limit = Number.isNaN(limitRaw) ? 30 : Math.max(1, Math.min(365, limitRaw));
        const items = await funds.getFundDailyHistory(cnpj, limit);
        return { ok: true, dados: { cnpj, items, fetchedAt: (/* @__PURE__ */ new Date()).toISOString() } };
      }
      if (pathname.endsWith("/documents") && request.method === "GET") {
        const cnpj = normalizeCnpj(decodeURIComponent(pathname.replace("/api/funds/", "").replace("/documents", "")));
        if (!cnpj) return badRequest("CNPJ inv\xE1lido");
        const docs = await funds.getFundDocuments(cnpj);
        return { ok: true, dados: docs };
      }
      const isFundByCnpj = pathname.startsWith("/api/funds/") && pathname.split("/").length === 4;
      if (isFundByCnpj && request.method === "GET") {
        const cnpj = normalizeCnpj(decodeURIComponent(pathname.replace("/api/funds/", "")));
        if (!cnpj) return badRequest("CNPJ inv\xE1lido");
        const summary = await funds.getFundSummary(cnpj);
        if (!summary) return mapApiError("NOT_FOUND", "Fundo n\xE3o encontrado", "cvm");
        return { ok: true, dados: summary };
      }
    }
    if (pathname.startsWith("/api/portfolio/")) {
      const token = env.BRAPI_TOKEN?.trim();
      if (!token) return mapApiError("INTERNAL_ERROR", "BRAPI_TOKEN n\xE3o configurado no servidor", "internal");
      const analysisService = new PortfolioAnalysisService({
        market: getMarketService(env, token),
        googleFinance: new GoogleFinanceProvider()
      });
      if (pathname === "/api/portfolio/analyze-position" && request.method === "POST") {
        const body = await parseJsonBody(request);
        const ticker = String(body.ticker ?? "").trim();
        const quantity = Number(body.quantity ?? NaN);
        const averagePrice = Number(body.averagePrice ?? NaN);
        if (!ticker || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(averagePrice) || averagePrice <= 0) {
          return badRequest("Payload inv\xE1lido para an\xE1lise de posi\xE7\xE3o");
        }
        const totalInvested = quantity * averagePrice;
        const analysis = await analysisService.analyzePosition({ ticker, quantity, averagePrice, totalInvested });
        return { ok: true, dados: analysis };
      }
      if (pathname === "/api/portfolio/analyze-positions" && request.method === "POST") {
        const body = await parseJsonBody(request);
        const itemsRaw = Array.isArray(body.items) ? body.items : [];
        if (itemsRaw.length === 0) return badRequest("items \xE9 obrigat\xF3rio");
        const items = itemsRaw.map((item) => {
          const entry = item;
          const ticker = String(entry.ticker ?? "").trim();
          const quantity = Number(entry.quantity ?? NaN);
          const averagePrice = Number(entry.averagePrice ?? NaN);
          if (!ticker || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(averagePrice) || averagePrice <= 0) return null;
          return { ticker, quantity, averagePrice, totalInvested: quantity * averagePrice };
        }).filter((item) => item !== null);
        if (items.length === 0) return badRequest("Nenhum item v\xE1lido para an\xE1lise");
        const analyzed = await analysisService.analyzePositions(items);
        return { ok: true, dados: { items: analyzed, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } };
      }
    }
    if (pathname.startsWith("/api/fipe/")) {
      const fipe = getFipeService(env);
      if (pathname === "/api/fipe/car/brands" && request.method === "GET") {
        return { ok: true, dados: { items: await fipe.getBrands(), fetchedAt: (/* @__PURE__ */ new Date()).toISOString() } };
      }
      if (pathname.startsWith("/api/fipe/car/models/") && request.method === "GET") {
        const brandCode = decodeURIComponent(pathname.replace("/api/fipe/car/models/", "")).trim();
        if (!brandCode) return badRequest("brandCode \xE9 obrigat\xF3rio");
        return { ok: true, dados: { brandCode, items: await fipe.getModels(brandCode), fetchedAt: (/* @__PURE__ */ new Date()).toISOString() } };
      }
      if (pathname.startsWith("/api/fipe/car/years/") && request.method === "GET") {
        const parts = pathname.replace("/api/fipe/car/years/", "").split("/");
        const brandCode = decodeURIComponent(parts[0] ?? "").trim();
        const modelCode = decodeURIComponent(parts[1] ?? "").trim();
        if (!brandCode || !modelCode) return badRequest("brandCode/modelCode s\xE3o obrigat\xF3rios");
        return { ok: true, dados: { brandCode, modelCode, items: await fipe.getYears(brandCode, modelCode), fetchedAt: (/* @__PURE__ */ new Date()).toISOString() } };
      }
      if (pathname.startsWith("/api/fipe/car/price/") && request.method === "GET") {
        const parts = pathname.replace("/api/fipe/car/price/", "").split("/");
        const brandCode = decodeURIComponent(parts[0] ?? "").trim();
        const modelCode = decodeURIComponent(parts[1] ?? "").trim();
        const yearCode = decodeURIComponent(parts[2] ?? "").trim();
        if (!brandCode || !modelCode || !yearCode) return badRequest("brandCode/modelCode/yearCode s\xE3o obrigat\xF3rios");
        return { ok: true, dados: await fipe.getPrice(brandCode, modelCode, yearCode) };
      }
    }
  } catch (error) {
    if (error instanceof UpstreamHttpError) return fromUpstreamError(error);
    return mapApiError("INTERNAL_ERROR", "Erro interno na camada financeira", "internal", {
      message: error instanceof Error ? error.message : String(error)
    });
  }
  return null;
}
__name(handleFinancialRoutes, "handleFinancialRoutes");

// src/server/types/gateway.ts
var erro = /* @__PURE__ */ __name((codigo, mensagem, status = 400, detalhes) => ({ ok: false, status, codigo, mensagem, detalhes }), "erro");
var sucesso = /* @__PURE__ */ __name((dados) => ({ ok: true, dados }), "sucesso");
async function parseJsonBody2(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
__name(parseJsonBody2, "parseJsonBody");

// ../modulos-backend/historico/src/repositorio.ts
var RepositorioHistoricoD1 = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "RepositorioHistoricoD1");
  }
  async listarSnapshots(usuarioId, limite) {
    const result = await this.db.prepare(
      "SELECT id, usuario_id, data, valor_total, variacao_percentual FROM snapshots_patrimonio WHERE usuario_id = ? ORDER BY data DESC LIMIT ?"
    ).bind(usuarioId, limite).all();
    return (result.results ?? []).map((row) => ({
      id: row.id,
      usuarioId: row.usuario_id,
      data: row.data,
      valorTotal: row.valor_total ?? 0,
      variacaoPercentual: row.variacao_percentual ?? 0
    }));
  }
  async listarEventos(usuarioId, limite) {
    const importacoes = await this.db.prepare(
      "SELECT id, criado_em, arquivo_nome, validos FROM importacoes WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT ?"
    ).bind(usuarioId, limite).all();
    const eventosImportacao = (importacoes.results ?? []).map((item) => ({
      id: `evento_import_${item.id}`,
      usuarioId,
      data: item.criado_em,
      tipo: "importacao",
      descricao: `Importa\xE7\xE3o ${item.arquivo_nome ?? "manual"} com ${item.validos ?? 0} itens v\xE1lidos`
    }));
    const snapshots = await this.listarSnapshots(usuarioId, limite);
    const eventosSnapshot = snapshots.filter((item) => item.variacaoPercentual < 0).map((item) => ({
      id: `evento_alerta_${item.id}`,
      usuarioId,
      data: item.data,
      tipo: "alerta",
      descricao: `Varia\xE7\xE3o mensal negativa de ${item.variacaoPercentual.toFixed(2)}%`
    }));
    return [...eventosImportacao, ...eventosSnapshot].sort((a, b) => a.data < b.data ? 1 : -1).slice(0, limite);
  }
};

// ../modulos-backend/historico/src/servico.ts
var LIMITE_PADRAO = 12;
var ServicoHistoricoPadrao = class {
  constructor(repositorio) {
    this.repositorio = repositorio;
  }
  static {
    __name(this, "ServicoHistoricoPadrao");
  }
  listarSnapshots(usuarioId, limite = LIMITE_PADRAO) {
    return this.repositorio.listarSnapshots(usuarioId, limite);
  }
  listarEventos(usuarioId, limite = LIMITE_PADRAO) {
    return this.repositorio.listarEventos(usuarioId, limite);
  }
};

// ../modulos-backend/historico/src/historico-mensal.ts
var arredondarPercentual = /* @__PURE__ */ __name((valor) => Number(valor.toFixed(4)), "arredondarPercentual");
function calcularRetornosMensais(totalAtual, totalAtualMesAnterior, totalAtualPrimeiroMes) {
  const retornoMes = totalAtualMesAnterior && totalAtualMesAnterior > 0 ? (totalAtual - totalAtualMesAnterior) / totalAtualMesAnterior * 100 : 0;
  const retornoAcum = totalAtualPrimeiroMes && totalAtualPrimeiroMes > 0 ? (totalAtual - totalAtualPrimeiroMes) / totalAtualPrimeiroMes * 100 : 0;
  return {
    retornoMes: arredondarPercentual(retornoMes),
    retornoAcum: arredondarPercentual(retornoAcum)
  };
}
__name(calcularRetornosMensais, "calcularRetornosMensais");
var ServicoHistoricoMensalPadrao = class {
  constructor(repositorio) {
    this.repositorio = repositorio;
  }
  static {
    __name(this, "ServicoHistoricoMensalPadrao");
  }
  listarPontos(usuarioId, limite = 24) {
    return this.repositorio.listarPontos(usuarioId, limite);
  }
  obterMes(usuarioId, anoMes) {
    return this.repositorio.obterMes(usuarioId, anoMes);
  }
  async registrarFechamentoMensal(usuarioId, anoMes, payload, origem = "fechamento_mensal") {
    const [mesAnterior, primeiroMes] = await Promise.all([
      this.repositorio.obterMesAnterior(usuarioId, anoMes),
      this.repositorio.obterMesMaisAntigo(usuarioId)
    ]);
    const { retornoMes, retornoAcum } = calcularRetornosMensais(
      payload.patrimonioTotal,
      mesAnterior?.totalAtual ?? null,
      primeiroMes?.totalAtual ?? null
    );
    const totalInvestido = payload.ativos.reduce(
      (acc, a) => acc + Number(a.totalInvestido ?? 0),
      0
    );
    const dataFechamento = calcularUltimoDiaDoMes(anoMes);
    return this.repositorio.gravar(
      usuarioId,
      anoMes,
      dataFechamento,
      Number(totalInvestido.toFixed(2)),
      Number(payload.patrimonioTotal.toFixed(2)),
      retornoMes,
      retornoAcum,
      payload,
      origem
    );
  }
};
function calcularUltimoDiaDoMes(anoMes) {
  const [ano, mes] = anoMes.split("-").map(Number);
  if (!ano || !mes) {
    throw new Error(`anoMes inv\xE1lido: ${anoMes}`);
  }
  const ultimoDia = new Date(Date.UTC(ano, mes, 0, 23, 59, 59));
  return ultimoDia.toISOString();
}
__name(calcularUltimoDiaDoMes, "calcularUltimoDiaDoMes");
function extrairAnoMes(dataIso) {
  const d = new Date(dataIso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`data inv\xE1lida: ${dataIso}`);
  }
  const ano = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}
__name(extrairAnoMes, "extrairAnoMes");
function proximoAnoMes(anoMes) {
  const [ano, mes] = anoMes.split("-").map(Number);
  if (!ano || !mes) {
    throw new Error(`anoMes inv\xE1lido: ${anoMes}`);
  }
  const d = new Date(Date.UTC(ano, mes, 1));
  return extrairAnoMes(d.toISOString());
}
__name(proximoAnoMes, "proximoAnoMes");

// ../modulos-backend/historico/src/repositorio-historico-mensal.ts
var linhaParaPonto = /* @__PURE__ */ __name((row) => ({
  id: row.id,
  usuarioId: row.usuario_id,
  anoMes: row.ano_mes,
  dataFechamento: row.data_fechamento,
  totalInvestido: row.total_investido ?? 0,
  totalAtual: row.total_atual ?? 0,
  retornoMes: row.retorno_mes ?? 0,
  retornoAcum: row.retorno_acum ?? 0,
  origem: row.origem ?? "fechamento_mensal"
}), "linhaParaPonto");
var RepositorioHistoricoMensalD1 = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "RepositorioHistoricoMensalD1");
  }
  async listarPontos(usuarioId, limite) {
    const result = await this.db.prepare(
      [
        "SELECT id, usuario_id, ano_mes, data_fechamento, total_investido, total_atual,",
        "retorno_mes, retorno_acum, origem",
        "FROM historico_carteira_mensal",
        "WHERE usuario_id = ?",
        "ORDER BY ano_mes DESC",
        "LIMIT ?"
      ].join(" ")
    ).bind(usuarioId, limite).all();
    return (result.results ?? []).map(linhaParaPonto);
  }
  async obterMes(usuarioId, anoMes) {
    const row = await this.db.prepare(
      [
        "SELECT id, usuario_id, ano_mes, data_fechamento, total_investido, total_atual,",
        "retorno_mes, retorno_acum, origem, payload_json",
        "FROM historico_carteira_mensal",
        "WHERE usuario_id = ? AND ano_mes = ?"
      ].join(" ")
    ).bind(usuarioId, anoMes).first();
    if (!row) return null;
    const ponto = linhaParaPonto(row);
    const payload = row.payload_json ? JSON.parse(row.payload_json) : {
      ativos: [],
      patrimonioInvestimentos: 0,
      patrimonioBens: 0,
      patrimonioPoupanca: 0,
      patrimonioTotal: 0,
      distribuicaoPatrimonio: []
    };
    return { ...ponto, payload };
  }
  async obterMesAnterior(usuarioId, anoMes) {
    const row = await this.db.prepare(
      [
        "SELECT id, usuario_id, ano_mes, data_fechamento, total_investido, total_atual,",
        "retorno_mes, retorno_acum, origem",
        "FROM historico_carteira_mensal",
        "WHERE usuario_id = ? AND ano_mes < ?",
        "ORDER BY ano_mes DESC LIMIT 1"
      ].join(" ")
    ).bind(usuarioId, anoMes).first();
    return row ? linhaParaPonto(row) : null;
  }
  async obterMesMaisAntigo(usuarioId) {
    const row = await this.db.prepare(
      [
        "SELECT id, usuario_id, ano_mes, data_fechamento, total_investido, total_atual,",
        "retorno_mes, retorno_acum, origem",
        "FROM historico_carteira_mensal",
        "WHERE usuario_id = ?",
        "ORDER BY ano_mes ASC LIMIT 1"
      ].join(" ")
    ).bind(usuarioId).first();
    return row ? linhaParaPonto(row) : null;
  }
  async gravar(usuarioId, anoMes, dataFechamento, totalInvestido, totalAtual, retornoMes, retornoAcum, payload, origem) {
    const id = `hist_${usuarioId}_${anoMes}`;
    const agora = (/* @__PURE__ */ new Date()).toISOString();
    await this.db.prepare(
      [
        "INSERT INTO historico_carteira_mensal",
        "(id, usuario_id, ano_mes, data_fechamento, total_investido, total_atual,",
        " retorno_mes, retorno_acum, payload_json, origem, criado_em, atualizado_em)",
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        "ON CONFLICT(usuario_id, ano_mes) DO UPDATE SET",
        "data_fechamento = excluded.data_fechamento,",
        "total_investido = excluded.total_investido,",
        "total_atual = excluded.total_atual,",
        "retorno_mes = excluded.retorno_mes,",
        "retorno_acum = excluded.retorno_acum,",
        "payload_json = excluded.payload_json,",
        "origem = excluded.origem,",
        "atualizado_em = excluded.atualizado_em"
      ].join(" ")
    ).bind(
      id,
      usuarioId,
      anoMes,
      dataFechamento,
      totalInvestido,
      totalAtual,
      retornoMes,
      retornoAcum,
      JSON.stringify(payload),
      origem,
      agora,
      agora
    ).run();
    return {
      id,
      usuarioId,
      anoMes,
      dataFechamento,
      totalInvestido,
      totalAtual,
      retornoMes,
      retornoAcum,
      origem
    };
  }
};

// ../modulos-backend/historico/src/reconstrucao.ts
var TAMANHO_LOTE_PADRAO = 6;
function valorAtivoNoMes(ativo, anoMes, precosHistoricos, fechamentosFundos) {
  if (fechamentosFundos && ativo.cnpj) {
    const porMes = fechamentosFundos.get(ativo.cnpj);
    const cotaMes = porMes?.get(anoMes);
    if (typeof cotaMes === "number" && Number.isFinite(cotaMes) && cotaMes > 0) {
      const anoMesAquisicao = extrairAnoMes(ativo.dataAquisicao);
      const cotaRef = porMes?.get(anoMesAquisicao);
      if (typeof cotaRef === "number" && Number.isFinite(cotaRef) && cotaRef > 0) {
        const custoTotal = ativo.quantidade * ativo.precoMedio;
        return custoTotal * (cotaMes / cotaRef);
      }
      const mesesOrdenados = Array.from(porMes.keys()).sort();
      const cotaMaisAntiga = mesesOrdenados.length > 0 ? porMes.get(mesesOrdenados[0]) : null;
      if (typeof cotaMaisAntiga === "number" && cotaMaisAntiga > 0) {
        const custoTotal = ativo.quantidade * ativo.precoMedio;
        return custoTotal * (cotaMes / cotaMaisAntiga);
      }
    }
  }
  if (precosHistoricos && ativo.ticker) {
    const porMes = precosHistoricos.get(ativo.ticker.toUpperCase());
    const close = porMes?.get(anoMes);
    if (typeof close === "number" && Number.isFinite(close) && close > 0) {
      return ativo.quantidade * close;
    }
  }
  return ativo.quantidade * ativo.precoMedio;
}
__name(valorAtivoNoMes, "valorAtivoNoMes");
function montarPayloadMesHistorico(ativos, contexto, anoMes, precosHistoricos, fechamentosFundos) {
  const ativosNoMes = ativos.filter((a) => extrairAnoMes(a.dataAquisicao) <= anoMes);
  const patrimonioInvestimentos = ativosNoMes.reduce(
    (acc, a) => acc + valorAtivoNoMes(a, anoMes, precosHistoricos, fechamentosFundos),
    0
  );
  const patrimonioImoveis = contexto.imoveis.reduce(
    (acc, i) => acc + Math.max(0, Number(i.valorEstimado ?? 0) - Number(i.saldoFinanciamento ?? 0)),
    0
  );
  const patrimonioVeiculos = contexto.veiculos.reduce(
    (acc, v) => acc + Math.max(0, Number(v.valorEstimado ?? 0)),
    0
  );
  const patrimonioBens = patrimonioImoveis + patrimonioVeiculos;
  const patrimonioPoupanca = Number(contexto.poupanca ?? 0);
  const patrimonioTotal = patrimonioInvestimentos + patrimonioBens + patrimonioPoupanca;
  const distribuicaoBase = [
    { id: "investimentos", label: "Investimentos", valor: patrimonioInvestimentos },
    { id: "bens", label: "Bens", valor: patrimonioBens },
    { id: "poupanca", label: "Poupan\xE7a", valor: patrimonioPoupanca }
  ].filter((item) => item.valor > 0);
  const distribuicaoPatrimonio = distribuicaoBase.map((item) => ({
    ...item,
    percentual: patrimonioTotal > 0 ? Number((item.valor / patrimonioTotal * 100).toFixed(4)) : 0
  }));
  return {
    ativos: ativosNoMes.map((a) => {
      const valorAtivo = valorAtivoNoMes(a, anoMes, precosHistoricos, fechamentosFundos);
      const totalInvestido = a.quantidade * a.precoMedio;
      const retornoAcumulado = totalInvestido > 0 ? Number(((valorAtivo - totalInvestido) / totalInvestido * 100).toFixed(4)) : 0;
      return {
        id: a.id,
        ticker: a.ticker ?? null,
        nome: a.nome,
        categoria: a.categoria,
        valorAtual: Number(valorAtivo.toFixed(2)),
        totalInvestido: Number(totalInvestido.toFixed(2)),
        retornoAcumulado,
        participacao: patrimonioTotal > 0 ? Number((valorAtivo / patrimonioTotal * 100).toFixed(4)) : 0
      };
    }),
    patrimonioInvestimentos: Number(patrimonioInvestimentos.toFixed(2)),
    patrimonioBens: Number(patrimonioBens.toFixed(2)),
    patrimonioPoupanca: Number(patrimonioPoupanca.toFixed(2)),
    patrimonioTotal: Number(patrimonioTotal.toFixed(2)),
    distribuicaoPatrimonio
  };
}
__name(montarPayloadMesHistorico, "montarPayloadMesHistorico");
var ServicoReconstrucaoCarteiraPadrao = class {
  constructor(deps) {
    this.deps = deps;
  }
  static {
    __name(this, "ServicoReconstrucaoCarteiraPadrao");
  }
  /**
   * Busca cotações históricas mensais para todos os tickers únicos da carteira.
   * Falha silenciosa: provedor ausente ou erro retornam undefined → fallback v1.
   */
  async carregarPrecosHistoricos(ativos) {
    if (!this.deps.provedorHistorico) return void 0;
    const tickers = Array.from(
      new Set(
        ativos.map((a) => a.ticker?.trim().toUpperCase()).filter((t) => Boolean(t && t.length > 0))
      )
    );
    if (tickers.length === 0) return void 0;
    try {
      return await this.deps.provedorHistorico.obterPrecosHistoricosMensais(tickers);
    } catch {
      return void 0;
    }
  }
  /**
   * Busca fechamentos mensais CVM para todos os fundos (por CNPJ) únicos da
   * carteira. Janela: do mês mais antigo entre aquisições até o mês final da
   * reconstrução. Falha silenciosa: sem provedor ou erro → undefined.
   */
  async carregarFechamentosFundos(ativos, anoMesInicial, anoMesFinal) {
    if (!this.deps.provedorFundos) return void 0;
    const cnpjs = Array.from(
      new Set(
        ativos.filter((a) => a.categoria === "fundo").map((a) => a.cnpj?.replace(/\D/g, "")).filter((c) => Boolean(c && c.length === 14))
      )
    );
    if (cnpjs.length === 0) return void 0;
    try {
      return await this.deps.provedorFundos.obterFechamentosMensais(
        cnpjs,
        anoMesInicial,
        anoMesFinal
      );
    } catch {
      return void 0;
    }
  }
  async enfileirar(usuarioId) {
    const ativos = await this.deps.fonte.listarAtivos(usuarioId);
    if (ativos.length === 0) {
      return this.deps.fila.criar(
        usuarioId,
        extrairAnoMes((/* @__PURE__ */ new Date()).toISOString()),
        extrairAnoMes((/* @__PURE__ */ new Date()).toISOString())
      );
    }
    const dataMaisAntiga = ativos.map((a) => a.dataAquisicao).sort()[0];
    const anoMesInicial = extrairAnoMes(dataMaisAntiga);
    const anoMesFinal = extrairAnoMes((/* @__PURE__ */ new Date()).toISOString());
    return this.deps.fila.criar(usuarioId, anoMesInicial, anoMesFinal);
  }
  obterEstado(usuarioId) {
    return this.deps.fila.obter(usuarioId);
  }
  async processarProximoLote(usuarioId, tamanhoLote = TAMANHO_LOTE_PADRAO) {
    const estado = await this.deps.fila.obter(usuarioId);
    if (!estado) {
      throw new Error(`reconstrucao nao enfileirada para usuario ${usuarioId}`);
    }
    if (estado.status === "concluido") {
      return estado;
    }
    const marcado = await this.deps.fila.atualizar(usuarioId, {
      status: "processando",
      iniciadoEm: estado.iniciadoEm ?? (/* @__PURE__ */ new Date()).toISOString(),
      tentativas: estado.tentativas + 1
    });
    try {
      const [ativos, contexto] = await Promise.all([
        this.deps.fonte.listarAtivos(usuarioId),
        this.deps.fonte.obterContexto(usuarioId)
      ]);
      const cursorInicial = marcado.anoMesCursor ? proximoAnoMes(marcado.anoMesCursor) : marcado.anoMesInicial;
      if (!cursorInicial || !marcado.anoMesFinal) {
        return this.deps.fila.atualizar(usuarioId, {
          status: "concluido",
          concluidoEm: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      const [precosHistoricos, fechamentosFundos] = await Promise.all([
        this.carregarPrecosHistoricos(ativos),
        this.carregarFechamentosFundos(
          ativos,
          marcado.anoMesInicial ?? cursorInicial,
          marcado.anoMesFinal
        )
      ]);
      let mesesProcessados = marcado.mesesProcessados;
      let cursorParaGravar = cursorInicial;
      let ultimoGravado = marcado.anoMesCursor;
      for (let i = 0; i < tamanhoLote; i += 1) {
        if (cursorParaGravar > marcado.anoMesFinal) break;
        const payload = montarPayloadMesHistorico(
          ativos,
          contexto,
          cursorParaGravar,
          precosHistoricos,
          fechamentosFundos
        );
        const totalInvestido = payload.ativos.reduce(
          (acc, a) => acc + a.totalInvestido,
          0
        );
        const [mesAnterior, primeiroMes] = await Promise.all([
          this.deps.historicoMensal.obterMesAnterior(usuarioId, cursorParaGravar),
          this.deps.historicoMensal.obterMesMaisAntigo(usuarioId)
        ]);
        const retornoMes = mesAnterior && mesAnterior.totalAtual > 0 ? (payload.patrimonioTotal - mesAnterior.totalAtual) / mesAnterior.totalAtual * 100 : 0;
        const retornoAcum = primeiroMes && primeiroMes.totalAtual > 0 ? (payload.patrimonioTotal - primeiroMes.totalAtual) / primeiroMes.totalAtual * 100 : 0;
        await this.deps.historicoMensal.gravar(
          usuarioId,
          cursorParaGravar,
          calcularUltimoDiaDoMes(cursorParaGravar),
          Number(totalInvestido.toFixed(2)),
          Number(payload.patrimonioTotal.toFixed(2)),
          Number(retornoMes.toFixed(4)),
          Number(retornoAcum.toFixed(4)),
          payload,
          "reconstrucao"
        );
        ultimoGravado = cursorParaGravar;
        mesesProcessados += 1;
        cursorParaGravar = proximoAnoMes(cursorParaGravar);
      }
      const concluiu = ultimoGravado !== null && ultimoGravado >= marcado.anoMesFinal;
      const novoStatus = concluiu ? "concluido" : "pendente";
      return this.deps.fila.atualizar(usuarioId, {
        status: novoStatus,
        anoMesCursor: ultimoGravado,
        mesesProcessados,
        concluidoEm: concluiu ? (/* @__PURE__ */ new Date()).toISOString() : null
      });
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "erro desconhecido";
      return this.deps.fila.atualizar(usuarioId, {
        status: "erro",
        erroMensagem: mensagem
      });
    }
  }
};

// ../modulos-backend/historico/src/repositorio-reconstrucao.ts
var linhaParaEstado = /* @__PURE__ */ __name((row) => ({
  usuarioId: row.usuario_id,
  status: row.status ?? "pendente",
  anoMesInicial: row.ano_mes_inicial,
  anoMesCursor: row.ano_mes_cursor,
  anoMesFinal: row.ano_mes_final,
  mesesProcessados: row.meses_processados ?? 0,
  mesesTotais: row.meses_totais ?? 0,
  iniciadoEm: row.iniciado_em,
  concluidoEm: row.concluido_em,
  erroMensagem: row.erro_mensagem,
  tentativas: row.tentativas ?? 0,
  atualizadoEm: row.atualizado_em
}), "linhaParaEstado");
var calcularMesesTotais = /* @__PURE__ */ __name((inicial, final) => {
  const [ai, mi] = inicial.split("-").map(Number);
  const [af, mf] = final.split("-").map(Number);
  if (!ai || !mi || !af || !mf) return 0;
  return Math.max(0, (af - ai) * 12 + (mf - mi) + 1);
}, "calcularMesesTotais");
var RepositorioFilaReconstrucaoD1 = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "RepositorioFilaReconstrucaoD1");
  }
  async obter(usuarioId) {
    const row = await this.db.prepare("SELECT * FROM fila_reconstrucao_carteira WHERE usuario_id = ?").bind(usuarioId).first();
    return row ? linhaParaEstado(row) : null;
  }
  async criar(usuarioId, anoMesInicial, anoMesFinal) {
    const id = `recon_${usuarioId}`;
    const agora = (/* @__PURE__ */ new Date()).toISOString();
    const mesesTotais = calcularMesesTotais(anoMesInicial, anoMesFinal);
    await this.db.prepare(
      [
        "INSERT INTO fila_reconstrucao_carteira",
        "(id, usuario_id, status, ano_mes_inicial, ano_mes_cursor, ano_mes_final,",
        " meses_processados, meses_totais, tentativas, criado_em, atualizado_em)",
        "VALUES (?, ?, 'pendente', ?, NULL, ?, 0, ?, 0, ?, ?)",
        "ON CONFLICT(usuario_id) DO UPDATE SET",
        "status = 'pendente',",
        "ano_mes_inicial = excluded.ano_mes_inicial,",
        "ano_mes_cursor = NULL,",
        "ano_mes_final = excluded.ano_mes_final,",
        "meses_processados = 0,",
        "meses_totais = excluded.meses_totais,",
        "iniciado_em = NULL,",
        "concluido_em = NULL,",
        "erro_mensagem = NULL,",
        "tentativas = 0,",
        "atualizado_em = excluded.atualizado_em"
      ].join(" ")
    ).bind(id, usuarioId, anoMesInicial, anoMesFinal, mesesTotais, agora, agora).run();
    const estado = await this.obter(usuarioId);
    if (!estado) throw new Error("falha ao criar fila de reconstrucao");
    return estado;
  }
  async atualizar(usuarioId, patch) {
    const atual = await this.obter(usuarioId);
    if (!atual) throw new Error(`fila nao encontrada para usuario ${usuarioId}`);
    const merged = {
      ...atual,
      ...patch,
      atualizadoEm: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.db.prepare(
      [
        "UPDATE fila_reconstrucao_carteira SET",
        "status = ?,",
        "ano_mes_cursor = ?,",
        "meses_processados = ?,",
        "iniciado_em = ?,",
        "concluido_em = ?,",
        "erro_mensagem = ?,",
        "tentativas = ?,",
        "atualizado_em = ?",
        "WHERE usuario_id = ?"
      ].join(" ")
    ).bind(
      merged.status,
      merged.anoMesCursor,
      merged.mesesProcessados,
      merged.iniciadoEm,
      merged.concluidoEm,
      merged.erroMensagem,
      merged.tentativas,
      merged.atualizadoEm,
      usuarioId
    ).run();
    return merged;
  }
};

// ../modulos-backend/historico/src/fonte-dados-reconstrucao.ts
var FonteDadosReconstrucaoD1 = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "FonteDadosReconstrucaoD1");
  }
  async listarAtivos(usuarioId) {
    const result = await this.db.prepare(
      [
        "SELECT id, ticker, nome, categoria, quantidade, preco_medio,",
        "data_aquisicao, data_cadastro, cnpj_fundo",
        "FROM ativos",
        "WHERE usuario_id = ?"
      ].join(" ")
    ).bind(usuarioId).all();
    return (result.results ?? []).map((row) => {
      const data = row.data_aquisicao ?? row.data_cadastro;
      if (!data) return null;
      const cnpjDigitos = row.cnpj_fundo ? row.cnpj_fundo.replace(/\D/g, "") : null;
      return {
        id: row.id,
        ticker: row.ticker,
        nome: row.nome,
        categoria: row.categoria,
        quantidade: Number(row.quantidade ?? 0),
        precoMedio: Number(row.preco_medio ?? 0),
        dataAquisicao: data,
        cnpj: cnpjDigitos && cnpjDigitos.length === 14 ? cnpjDigitos : null
      };
    }).filter((a) => a !== null);
  }
  async obterContexto(usuarioId) {
    const row = await this.db.prepare(
      "SELECT contexto_json FROM perfil_contexto_financeiro WHERE usuario_id = ?"
    ).bind(usuarioId).first();
    if (!row?.contexto_json) {
      return { imoveis: [], veiculos: [], poupanca: 0 };
    }
    try {
      const parsed = JSON.parse(row.contexto_json);
      const externo = parsed.patrimonioExterno ?? {};
      return {
        imoveis: (externo.imoveis ?? []).map((i) => ({
          valorEstimado: Number(i.valorEstimado ?? 0),
          saldoFinanciamento: Number(i.saldoFinanciamento ?? 0)
        })),
        veiculos: (externo.veiculos ?? []).map((v) => ({
          valorEstimado: Number(v.valorEstimado ?? 0)
        })),
        poupanca: Number(externo.poupanca ?? externo.caixaDisponivel ?? 0)
      };
    } catch {
      return { imoveis: [], veiculos: [], poupanca: 0 };
    }
  }
};

// src/server/services/provedor-historico-cotacoes.ts
var RANGE_PADRAO = "10y";
var INTERVALO_PADRAO = "1mo";
var ProvedorHistoricoCotacoesBrapi = class {
  constructor(marketData) {
    this.marketData = marketData;
  }
  static {
    __name(this, "ProvedorHistoricoCotacoesBrapi");
  }
  async obterPrecosHistoricosMensais(tickers) {
    const mapa = /* @__PURE__ */ new Map();
    if (tickers.length === 0) return mapa;
    const normalizados = Array.from(
      new Set(
        tickers.map((t) => typeof t === "string" ? t.trim().toUpperCase() : "").filter((t) => t.length > 0)
      )
    );
    const resultados = await Promise.all(
      normalizados.map(async (ticker) => {
        try {
          const historico = await this.marketData.getHistory(
            ticker,
            RANGE_PADRAO,
            INTERVALO_PADRAO
          );
          return { ticker, pontos: historico.points };
        } catch {
          return { ticker, pontos: [] };
        }
      })
    );
    for (const { ticker, pontos } of resultados) {
      const porMes = /* @__PURE__ */ new Map();
      for (const ponto of pontos) {
        const anoMes = extrairAnoMes2(ponto.date);
        if (!anoMes) continue;
        if (typeof ponto.close === "number" && Number.isFinite(ponto.close) && ponto.close > 0) {
          porMes.set(anoMes, ponto.close);
        }
      }
      if (porMes.size > 0) {
        mapa.set(ticker, porMes);
      }
    }
    return mapa;
  }
};
function extrairAnoMes2(data) {
  if (typeof data !== "string" || data.length < 7) return null;
  const candidato = data.slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(candidato)) return null;
  return candidato;
}
__name(extrairAnoMes2, "extrairAnoMes");
function construirProvedorHistoricoCotacoes(env) {
  const token = env.BRAPI_TOKEN?.trim();
  if (!token) return void 0;
  const marketData = new MarketDataService({
    db: env.DB,
    provider: new BrapiProvider({
      token,
      baseUrl: env.BRAPI_BASE_URL?.trim() || "https://brapi.dev/api"
    })
  });
  return new ProvedorHistoricoCotacoesBrapi(marketData);
}
__name(construirProvedorHistoricoCotacoes, "construirProvedorHistoricoCotacoes");

// src/server/services/provedor-cotacao-fundos-cvm.ts
var CvmFundosProviderD1 = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "CvmFundosProviderD1");
  }
  async obterCotaMaisRecente(cnpj, ateData) {
    const cnpjLimpo = normalizarCnpj(cnpj);
    if (!cnpjLimpo) return null;
    const sql = ateData ? "SELECT cnpj, data_ref, vl_quota, vl_patrim_liq, nr_cotst FROM cotas_fundos_cvm WHERE cnpj = ? AND data_ref <= ? ORDER BY data_ref DESC LIMIT 1" : "SELECT cnpj, data_ref, vl_quota, vl_patrim_liq, nr_cotst FROM cotas_fundos_cvm WHERE cnpj = ? ORDER BY data_ref DESC LIMIT 1";
    const row = ateData ? await this.db.prepare(sql).bind(cnpjLimpo, ateData).first() : await this.db.prepare(sql).bind(cnpjLimpo).first();
    if (!row) return null;
    return mapearLinha(row);
  }
  async obterFechamentosMensais(cnpjs, anoMesInicial, anoMesFinal) {
    const resultado = /* @__PURE__ */ new Map();
    if (cnpjs.length === 0) return resultado;
    const cnpjsLimpos = Array.from(
      new Set(cnpjs.map(normalizarCnpj).filter((v) => Boolean(v)))
    );
    if (cnpjsLimpos.length === 0) return resultado;
    const placeholders = cnpjsLimpos.map(() => "?").join(",");
    const dataInicial = `${anoMesInicial}-01`;
    const dataFinal = ultimoDiaMes(anoMesFinal);
    const sql = `
      SELECT cnpj, substr(data_ref, 1, 7) AS ano_mes, data_ref, vl_quota
      FROM cotas_fundos_cvm
      WHERE cnpj IN (${placeholders})
        AND data_ref BETWEEN ? AND ?
      ORDER BY cnpj, data_ref DESC
    `;
    const bindings = [...cnpjsLimpos, dataInicial, dataFinal];
    const rs = await this.db.prepare(sql).bind(...bindings).all();
    const linhas = rs.results ?? [];
    for (const linha of linhas) {
      let porMes = resultado.get(linha.cnpj);
      if (!porMes) {
        porMes = /* @__PURE__ */ new Map();
        resultado.set(linha.cnpj, porMes);
      }
      if (!porMes.has(linha.ano_mes)) {
        porMes.set(linha.ano_mes, Number(linha.vl_quota));
      }
    }
    return resultado;
  }
};
function mapearLinha(row) {
  return {
    cnpj: row.cnpj,
    dataRef: row.data_ref,
    vlQuota: Number(row.vl_quota),
    vlPatrimLiq: row.vl_patrim_liq ?? null,
    nrCotst: row.nr_cotst ?? null
  };
}
__name(mapearLinha, "mapearLinha");
function normalizarCnpj(cnpj) {
  if (!cnpj) return null;
  const digitos = String(cnpj).replace(/\D/g, "");
  if (digitos.length !== 14) return null;
  return digitos;
}
__name(normalizarCnpj, "normalizarCnpj");
function ultimoDiaMes(anoMes) {
  const [ano, mes] = anoMes.split("-").map((v) => Number(v));
  const data = new Date(Date.UTC(ano, mes, 0));
  return data.toISOString().slice(0, 10);
}
__name(ultimoDiaMes, "ultimoDiaMes");
function construirCvmFundosProvider(env) {
  return new CvmFundosProviderD1(env.DB);
}
__name(construirCvmFundosProvider, "construirCvmFundosProvider");

// src/server/services/construir-servico-reconstrucao.ts
function construirServicoReconstrucao(env) {
  return new ServicoReconstrucaoCarteiraPadrao({
    fila: new RepositorioFilaReconstrucaoD1(env.DB),
    historicoMensal: new RepositorioHistoricoMensalD1(env.DB),
    fonte: new FonteDadosReconstrucaoD1(env.DB),
    provedorHistorico: construirProvedorHistoricoCotacoes(env),
    provedorFundos: construirCvmFundosProvider(env)
  });
}
__name(construirServicoReconstrucao, "construirServicoReconstrucao");

// src/server/services/email/password-reset.ts
function buildResetUrl(env, payload) {
  const base = (env.WEB_BASE_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  const url = new URL("/", base);
  url.searchParams.set("abrir", "login");
  url.searchParams.set("step", "forgotPassword");
  url.searchParams.set("email", payload.email);
  url.searchParams.set("token", payload.token);
  return url.toString();
}
__name(buildResetUrl, "buildResetUrl");
async function enviarViaResend(env, payload) {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) return;
  const from = env.EMAIL_FROM?.trim();
  if (!from) {
    throw new Error("EMAIL_FROM_NAO_CONFIGURADO");
  }
  const resetUrl = buildResetUrl(env, payload);
  const expiraEmIso = payload.expiraEm;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: payload.email,
      subject: "Esquilo Invest \u2014 Recuperacao de senha",
      html: [
        `<p>Recebemos uma solicitacao para redefinir sua senha no Esquilo Invest.</p>`,
        `<p><a href="${resetUrl}">Clique aqui para redefinir sua senha</a></p>`,
        `<p>Ou use este codigo no app: <b>${payload.token}</b></p>`,
        `<p>Expira em: ${expiraEmIso}</p>`,
        `<p>Se voce nao solicitou, ignore este e-mail.</p>`
      ].join("")
    })
  });
}
__name(enviarViaResend, "enviarViaResend");
async function enviarViaWebhook(env, payload) {
  const webhook = env.PASSWORD_RESET_WEBHOOK_URL?.trim();
  if (!webhook) return;
  await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "password_reset", ...payload })
  });
}
__name(enviarViaWebhook, "enviarViaWebhook");
async function notificarRecuperacaoSenha(env, payload) {
  if (env.RESEND_API_KEY?.trim()) {
    await enviarViaResend(env, payload);
    return;
  }
  if (env.PASSWORD_RESET_WEBHOOK_URL?.trim()) {
    await enviarViaWebhook(env, payload);
    return;
  }
  const resetUrl = buildResetUrl(env, payload);
  console.log("----------------------------------------------------------");
  console.log(`[DEV] Recuperacao de senha solicitada para: ${payload.email}`);
  console.log(`[DEV] Link: ${resetUrl}`);
  console.log(`[DEV] Token: ${payload.token}`);
  console.log(`[DEV] Expira em: ${payload.expiraEm}`);
  console.log("----------------------------------------------------------");
}
__name(notificarRecuperacaoSenha, "notificarRecuperacaoSenha");

// src/server/routes/auth.routes.ts
var TAMANHO_LOTE_AUTORECONSTRUCAO = 6;
async function autoReconstruirHistorico(env, usuarioId) {
  try {
    const servico = construirServicoReconstrucao(env);
    await servico.enfileirar(usuarioId);
    await servico.processarProximoLote(usuarioId, TAMANHO_LOTE_AUTORECONSTRUCAO);
  } catch {
  }
}
__name(autoReconstruirHistorico, "autoReconstruirHistorico");
var MASSA_TESTE_EI_RAIZ = {
  nome: "Teste EI Raiz",
  cpf: "12345678909",
  email: "teste.eiraiz+1@gmail.com",
  senha: "Teste@1234"
};
function buildAuthService(env) {
  return new ServicoAutenticacaoPadrao({
    repositorio: new RepositorioAutenticacaoD1(env.DB),
    segredoJWT: env.JWT_SECRET || "dev-secret",
    notificarRecuperacaoSenha: /* @__PURE__ */ __name(async ({ email, token, expiraEm }) => {
      await notificarRecuperacaoSenha(env, { email, token, expiraEm });
    }, "notificarRecuperacaoSenha")
  });
}
__name(buildAuthService, "buildAuthService");
async function resetMassaTesteEiRaiz(env) {
  const candidato = await env.DB.prepare("SELECT id FROM usuarios WHERE cpf = ? OR email = ? LIMIT 1").bind(MASSA_TESTE_EI_RAIZ.cpf, MASSA_TESTE_EI_RAIZ.email).first();
  if (candidato?.id) {
    const usuarioId2 = candidato.id;
    await env.DB.batch([
      env.DB.prepare("DELETE FROM telemetria_eventos WHERE usuario_id = ?").bind(usuarioId2),
      env.DB.prepare("DELETE FROM simulacoes WHERE usuario_id = ?").bind(usuarioId2),
      env.DB.prepare("DELETE FROM posicoes_financeiras WHERE usuario_id = ?").bind(usuarioId2),
      env.DB.prepare("DELETE FROM perfil_contexto_financeiro WHERE usuario_id = ?").bind(usuarioId2),
      env.DB.prepare("DELETE FROM recuperacoes_acesso WHERE usuario_id = ?").bind(usuarioId2),
      env.DB.prepare("DELETE FROM ativos WHERE usuario_id = ?").bind(usuarioId2),
      env.DB.prepare("DELETE FROM usuarios WHERE id = ?").bind(usuarioId2)
    ]);
  }
  const authService = buildAuthService(env);
  const { usuario } = await authService.registrar(MASSA_TESTE_EI_RAIZ);
  const usuarioId = usuario.id;
  const agora = (/* @__PURE__ */ new Date()).toISOString();
  const umAnoAtras = new Date(Date.now() - 365 * 24 * 60 * 60 * 1e3).toISOString();
  await env.DB.prepare("INSERT INTO perfil_contexto_financeiro (id, usuario_id, contexto_json, atualizado_em) VALUES (?, ?, ?, ?)").bind(
    `ctx_${usuarioId}`,
    usuarioId,
    JSON.stringify({ patrimonioExterno: { poupanca: 5e3, caixaDisponivel: 5e3, imoveis: [], veiculos: [] }, dividas: [] }),
    agora
  ).run();
  const ativos = [
    { id: `ativo_1_${usuarioId}`, ticker: "PETR4", nome: "Petrobras PN", categoria: "acao", plataforma: "Massa Teste", quantidade: 10, precoMedio: 30.5, valorAtual: 32 },
    { id: `ativo_2_${usuarioId}`, ticker: "VGIR11", nome: "Vanguard \xCDndice", categoria: "fundo", plataforma: "Massa Teste", quantidade: 5, precoMedio: 90, valorAtual: 92.5 },
    { id: `ativo_3_${usuarioId}`, ticker: "BBSE3", nome: "BB Seguridade", categoria: "acao", plataforma: "Massa Teste", quantidade: 20, precoMedio: 15, valorAtual: 15.8 }
  ];
  for (const ativo of ativos) {
    const valorAtual = ativo.quantidade * ativo.valorAtual;
    const participacao = valorAtual / (valorAtual + 462.5 + 5e3) * 100;
    const retorno12m = (ativo.valorAtual - ativo.precoMedio) / ativo.precoMedio * 100;
    await env.DB.prepare(
      "INSERT INTO ativos (id, usuario_id, ticker, nome, categoria, plataforma, quantidade, preco_medio, valor_atual, participacao, retorno_12m, data_cadastro, data_aquisicao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(ativo.id, usuarioId, ativo.ticker, ativo.nome, ativo.categoria, ativo.plataforma, ativo.quantidade, ativo.precoMedio, ativo.valorAtual, participacao, retorno12m, umAnoAtras, umAnoAtras).run();
  }
  return { resetado: true, email: MASSA_TESTE_EI_RAIZ.email, cpf: MASSA_TESTE_EI_RAIZ.cpf };
}
__name(resetMassaTesteEiRaiz, "resetMassaTesteEiRaiz");
async function handleAuthRoutes(pathname, request, env, sessao, ctx) {
  const authService = buildAuthService(env);
  if ((pathname === "/api/auth/registrar" || pathname === "/api/auth/registro") && request.method === "POST") {
    const body = await parseJsonBody2(request);
    return sucesso(await authService.registrar(body));
  }
  if ((pathname === "/api/auth/entrar" || pathname === "/api/auth/login") && request.method === "POST") {
    const body = await parseJsonBody2(request);
    const disparaReconstrucao = /* @__PURE__ */ __name((saida) => {
      const usuarioId = saida?.usuario?.id;
      if (!usuarioId || !ctx) return;
      ctx.waitUntil(autoReconstruirHistorico(env, usuarioId));
    }, "disparaReconstrucao");
    try {
      const saida = await authService.entrar(body);
      disparaReconstrucao(saida);
      return sucesso(saida);
    } catch (e) {
      if (body.email === MASSA_TESTE_EI_RAIZ.email && body.senha === MASSA_TESTE_EI_RAIZ.senha) {
        await resetMassaTesteEiRaiz(env);
        const saida = await authService.entrar(body);
        disparaReconstrucao(saida);
        return sucesso(saida);
      }
      throw e;
    }
  }
  if (pathname === "/api/auth/verificar-cadastro" && request.method === "POST") {
    const body = await parseJsonBody2(request);
    return sucesso(await authService.verificarCadastro(body));
  }
  if (pathname === "/api/auth/recuperar-senha" && request.method === "POST") {
    const body = await parseJsonBody2(request);
    return sucesso(await authService.solicitarRecuperacaoPorEmail(body));
  }
  if (pathname === "/api/auth/recuperar-acesso" && request.method === "POST") {
    const body = await parseJsonBody2(request);
    return sucesso(await authService.solicitarRecuperacaoPorCpf(body));
  }
  if (pathname === "/api/auth/redefinir-senha" && request.method === "POST") {
    const body = await parseJsonBody2(request);
    return sucesso(await authService.redefinirSenha(body));
  }
  if (pathname === "/api/auth/eu" && request.method === "GET") {
    if (!sessao) return { ok: false, status: 401, codigo: "NAO_AUTORIZADO", mensagem: "Token ausente" };
    return sucesso(sessao);
  }
  return null;
}
__name(handleAuthRoutes, "handleAuthRoutes");

// src/configuracao-produto.ts
var defaultMenus = [
  { chave: "home", label: "Home", path: "/home", ordem: 1, visivel: true },
  { chave: "dashboard", label: "Dashboard", path: "/dashboard", ordem: 2, visivel: true },
  { chave: "carteira", label: "Carteira", path: "/carteira", ordem: 3, visivel: true },
  { chave: "aportes", label: "Aportes", path: "/aportes", ordem: 4, visivel: true },
  { chave: "insights", label: "Insights", path: "/insights", ordem: 5, visivel: true },
  { chave: "historico", label: "Hist\xF3rico", path: "/historico", ordem: 6, visivel: true },
  { chave: "importar", label: "Importar", path: "/importar", ordem: 7, visivel: true },
  { chave: "quick_perfil", label: "Perfil", path: "/perfil", ordem: 101, visivel: true },
  { chave: "quick_importar", label: "Importar", path: "/importar", ordem: 102, visivel: true },
  { chave: "quick_acoes", label: "A\xE7\xF5es", path: "/carteira?categoria=acao", ordem: 103, visivel: true },
  { chave: "quick_fundos", label: "Fundos", path: "/carteira?categoria=fundo", ordem: 104, visivel: true },
  { chave: "quick_previdencia", label: "Previd\xEAncia", path: "/carteira?categoria=previdencia", ordem: 105, visivel: true },
  { chave: "quick_renda_fixa", label: "Renda Fixa", path: "/carteira?categoria=renda_fixa", ordem: 106, visivel: true },
  { chave: "quick_poupanca", label: "Poupan\xE7a", path: "/placeholder?modulo=poupanca", ordem: 107, visivel: true },
  { chave: "quick_bens", label: "Bens", path: "/placeholder?modulo=bens", ordem: 108, visivel: true },
  { chave: "quick_simuladores", label: "Simuladores", path: "/decisoes", ordem: 109, visivel: true },
  { chave: "quick_configurar", label: "Configurar", path: "/configuracoes", ordem: 110, visivel: true }
];
var defaultFlags = {
  insights_historico: true,
  telegram_alertas: false,
  score_unico_v1: true,
  landing_faq: true,
  landing_proposta: true,
  home_quick_actions: true,
  importacao_bloco_corretoras: true
};
var defaultScoreConfig = {
  pesos: {
    estrategiaCarteira: 35,
    comportamentoFinanceiro: 25,
    estruturaPatrimonial: 20,
    adequacaoMomentoVida: 20
  },
  thresholds: {
    criticoMax: 39,
    fragilMax: 59,
    regularMax: 74,
    bomMax: 89
  },
  penalidades: {
    perfilConservadorRvAlto: 10,
    perfilModeradoRvAlto: 6,
    perfilArrojadoRvBaixo: 4,
    horizonteCurtoAgressivo: 5,
    rendaBaixaVolatilidadeAlta: 4,
    maiorAtivoAlto: 6,
    concentracaoExtrema: 20,
    top3Concentrado: 5,
    classeUnica: 6,
    poucosAtivos: 4,
    semDefensivo: 4,
    objetivoPreservacaoRisco: 7,
    objetivoCrescimentoDefensivo: 5,
    objetivoRendaSemBase: 4,
    objetivoAposentadoriaSemConsistencia: 3,
    aportesInconsistentes: 6,
    evolucaoNegativa: 8,
    liquidezBaixa: 6,
    dinheiroParadoAlto: 4,
    dependenciaDeAtivoIliquido: 5,
    endividamentoAlto: 7
  },
  unifiedModel: {
    pillarWeights: {
      liquidity: 0.25,
      financial_health: 0.25,
      patrimonial_structure: 0.2,
      investment_behavior: 0.15,
      efficiency_evolution: 0.15
    },
    ranges: {
      criticalMax: 299,
      fragileMax: 499,
      stableMax: 699,
      goodMax: 849
    }
  }
};
var defaultBlocosConteudo = [
  { chave: "landing.hero.titulo", modulo: "landing", tipo: "texto", valor: "Sua carteira merece", visivel: true, ordem: 1, atualizadoEm: null },
  { chave: "landing.hero.titulo_destaque", modulo: "landing", tipo: "texto", valor: "consolida\xE7\xE3o e clareza.", visivel: true, ordem: 2, atualizadoEm: null },
  { chave: "landing.hero.subtitulo", modulo: "landing", tipo: "texto", valor: "Consolida\xE7\xE3o real, diagn\xF3stico claro e decis\xE3o orientada.", visivel: true, ordem: 3, atualizadoEm: null },
  { chave: "landing.hero.descricao", modulo: "landing", tipo: "texto", valor: "Centralize seus ativos, entenda concentra\xE7\xE3o e risco da carteira e receba uma orienta\xE7\xE3o objetiva do pr\xF3ximo passo.", visivel: true, ordem: 4, atualizadoEm: null },
  { chave: "landing.hero.cta_primario", modulo: "landing", tipo: "texto", valor: "Ver como funciona", visivel: true, ordem: 5, atualizadoEm: null },
  { chave: "landing.hero.cta_secundario", modulo: "landing", tipo: "texto", valor: "Saber mais sobre a gente", visivel: true, ordem: 6, atualizadoEm: null },
  { chave: "landing.como_funciona.titulo", modulo: "landing", tipo: "texto", valor: "Entenda como a gente te ajuda", visivel: true, ordem: 10, atualizadoEm: null },
  { chave: "landing.proposta.titulo", modulo: "landing", tipo: "texto", valor: "Acesso apenas leitura. Zero execu\xE7\xE3o.", visivel: true, ordem: 20, atualizadoEm: null },
  { chave: "landing.footer.cta_titulo", modulo: "landing", tipo: "texto", valor: "O diagn\xF3stico leva menos de 5 minutos.", visivel: true, ordem: 30, atualizadoEm: null },
  { chave: "landing.footer.cta_descricao", modulo: "landing", tipo: "texto", valor: "Crie sua conta, importe seu CSV e tenha uma leitura clara da sua carteira em minutos.", visivel: true, ordem: 31, atualizadoEm: null },
  { chave: "landing.footer.cta_botao", modulo: "landing", tipo: "texto", valor: "Acessar plataforma", visivel: true, ordem: 32, atualizadoEm: null },
  { chave: "home.cartao_principal.titulo", modulo: "home", tipo: "texto", valor: "Patrim\xF4nio Total", visivel: true, ordem: 100, atualizadoEm: null },
  { chave: "home.cartao_principal.sem_base", modulo: "home", tipo: "texto", valor: "Sua carteira ainda est\xE1 vazia. Importe um CSV em /importar para liberar Home, Carteira, Insights e Hist\xF3rico com dados reais.", visivel: true, ordem: 101, atualizadoEm: null },
  { chave: "home.quick_actions.titulo", modulo: "home", tipo: "texto", valor: "Acesso R\xE1pido", visivel: true, ordem: 102, atualizadoEm: null },
  { chave: "importacao.upload.titulo", modulo: "importacao", tipo: "texto", valor: "Atualizar Carteira", visivel: true, ordem: 200, atualizadoEm: null },
  { chave: "importacao.upload.descricao", modulo: "importacao", tipo: "texto", valor: "Envie seu CSV e valide linha por linha antes de confirmar.", visivel: true, ordem: 201, atualizadoEm: null },
  { chave: "importacao.corretoras.titulo", modulo: "importacao", tipo: "texto", valor: "Integra\xE7\xF5es banc\xE1rias", visivel: true, ordem: 202, atualizadoEm: null },
  { chave: "importacao.corretoras.descricao", modulo: "importacao", tipo: "texto", valor: "Fluxo atual da plataforma: importa\xE7\xE3o por CSV com revis\xE3o linha a linha antes de confirmar.", visivel: true, ordem: 203, atualizadoEm: null }
];
var defaultCorretoras = [
  { codigo: "xp", nome: "XP Investimentos", status: "ativo", mensagemAjuda: "Suportado via CSV padr\xE3o Esquilo.", atualizadoEm: null },
  { codigo: "rico", nome: "Rico", status: "ativo", mensagemAjuda: "Suportado via CSV padr\xE3o Esquilo.", atualizadoEm: null },
  { codigo: "itau", nome: "Ita\xFA", status: "beta", mensagemAjuda: "Suporte parcial, revisar preview antes de confirmar.", atualizadoEm: null },
  { codigo: "nubank", nome: "Nubank", status: "planejado", mensagemAjuda: "Mapeado para evolu\xE7\xE3o de integra\xE7\xE3o.", atualizadoEm: null }
];
var nowIso2 = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString(), "nowIso");
async function obterAppConfig(db, options) {
  let scoreRow = null;
  let flagsRows = [];
  let menusRows = [];
  try {
    const [score2, flags2, menus] = await Promise.all([
      db.prepare("SELECT valor_json FROM configuracoes_produto WHERE chave = ? LIMIT 1").bind("score.v1").first(),
      db.prepare("SELECT chave, habilitada FROM feature_flags").all(),
      db.prepare("SELECT chave, label, path, ordem, visivel FROM configuracoes_menu ORDER BY ordem ASC").all()
    ]);
    scoreRow = score2;
    flagsRows = flags2.results ?? [];
    menusRows = menus.results ?? [];
  } catch {
  }
  let score = defaultScoreConfig;
  if (scoreRow?.valor_json) {
    try {
      score = { ...defaultScoreConfig, ...JSON.parse(scoreRow.valor_json) };
    } catch {
      score = defaultScoreConfig;
    }
  }
  const flags = { ...defaultFlags };
  for (const item of flagsRows) flags[item.chave] = Boolean(item.habilitada);
  const menusBase = menusRows.length ? menusRows : defaultMenus;
  const menusOrdenados = menusBase.map((item) => ({
    chave: item.chave,
    label: item.label,
    path: item.path,
    ordem: item.ordem,
    visivel: Boolean(item.visivel)
  })).sort((a, b) => a.ordem - b.ordem);
  return {
    score,
    flags,
    menus: options?.incluirOcultos ? menusOrdenados : menusOrdenados.filter((item) => item.visivel)
  };
}
__name(obterAppConfig, "obterAppConfig");
async function obterConteudoApp(db, options) {
  let rows = [];
  try {
    const resultado = await db.prepare("SELECT chave, modulo, tipo, valor, visivel, ordem, atualizado_em FROM content_blocks ORDER BY modulo ASC, ordem ASC, chave ASC").all();
    rows = resultado.results ?? [];
  } catch {
    rows = [];
  }
  const blocos = (rows.length ? rows.map((item) => ({
    chave: item.chave,
    modulo: item.modulo,
    tipo: item.tipo || "texto",
    valor: item.valor,
    visivel: Boolean(item.visivel),
    ordem: item.ordem ?? 0,
    atualizadoEm: item.atualizado_em ?? null
  })) : defaultBlocosConteudo).filter((item) => options?.incluirOcultos || item.visivel).sort((a, b) => a.ordem - b.ordem || a.chave.localeCompare(b.chave));
  const mapa = {};
  for (const bloco of blocos) mapa[bloco.chave] = bloco.valor;
  return { blocos, mapa };
}
__name(obterConteudoApp, "obterConteudoApp");
async function atualizarConteudoApp(db, blocos, autorEmail) {
  try {
    const statements = blocos.map(
      (bloco) => db.prepare(
        [
          "INSERT INTO content_blocks (chave, modulo, tipo, valor, visivel, ordem, atualizado_em)",
          "VALUES (?, ?, ?, ?, ?, ?, ?)",
          "ON CONFLICT(chave) DO UPDATE SET",
          "modulo = excluded.modulo,",
          "tipo = excluded.tipo,",
          "valor = excluded.valor,",
          "visivel = excluded.visivel,",
          "ordem = excluded.ordem,",
          "atualizado_em = excluded.atualizado_em"
        ].join(" ")
      ).bind(bloco.chave, bloco.modulo, bloco.tipo, bloco.valor, bloco.visivel ? 1 : 0, bloco.ordem, nowIso2())
    );
    if (statements.length) await db.batch(statements);
    await registrarAuditoriaAdmin(db, "conteudo.atualizar", "content_blocks", { total: blocos.length }, autorEmail);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}
__name(atualizarConteudoApp, "atualizarConteudoApp");
async function obterCorretorasSuportadas(db) {
  let rows = [];
  try {
    const resultado = await db.prepare("SELECT codigo, nome, status, mensagem_ajuda, atualizado_em FROM corretoras_suportadas ORDER BY nome ASC").all();
    rows = resultado.results ?? [];
  } catch {
    rows = [];
  }
  return (rows.length ? rows.map((item) => ({
    codigo: item.codigo,
    nome: item.nome,
    status: item.status,
    mensagemAjuda: item.mensagem_ajuda,
    atualizadoEm: item.atualizado_em ?? null
  })) : defaultCorretoras).sort((a, b) => a.nome.localeCompare(b.nome));
}
__name(obterCorretorasSuportadas, "obterCorretorasSuportadas");
async function atualizarCorretorasSuportadas(db, corretoras, autorEmail) {
  try {
    const statements = corretoras.map(
      (corretora) => db.prepare(
        [
          "INSERT INTO corretoras_suportadas (id, codigo, nome, status, mensagem_ajuda, atualizado_em)",
          "VALUES (?, ?, ?, ?, ?, ?)",
          "ON CONFLICT(codigo) DO UPDATE SET",
          "nome = excluded.nome, status = excluded.status, mensagem_ajuda = excluded.mensagem_ajuda, atualizado_em = excluded.atualizado_em"
        ].join(" ")
      ).bind(crypto.randomUUID(), corretora.codigo, corretora.nome, corretora.status, corretora.mensagemAjuda, nowIso2())
    );
    if (statements.length) await db.batch(statements);
    await registrarAuditoriaAdmin(db, "corretoras.atualizar", "corretoras_suportadas", { total: corretoras.length }, autorEmail);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}
__name(atualizarCorretorasSuportadas, "atualizarCorretorasSuportadas");
async function listarAdmins(db) {
  try {
    const resultado = await db.prepare("SELECT email, ativo, concedido_por, atualizado_em FROM admin_usuarios ORDER BY email ASC").all();
    const rows = resultado.results ?? [];
    return rows.map((item) => ({
      email: item.email,
      ativo: Boolean(item.ativo),
      concedidoPor: item.concedido_por ?? null,
      atualizadoEm: item.atualizado_em ?? null
    }));
  } catch {
    return [];
  }
}
__name(listarAdmins, "listarAdmins");
async function definirAdmin(db, email, ativo, concedidoPor) {
  try {
    await db.prepare(
      [
        "INSERT INTO admin_usuarios (email, ativo, concedido_por, atualizado_em)",
        "VALUES (?, ?, ?, ?)",
        "ON CONFLICT(email) DO UPDATE SET",
        "ativo = excluded.ativo, concedido_por = excluded.concedido_por, atualizado_em = excluded.atualizado_em"
      ].join(" ")
    ).bind(email.toLowerCase(), ativo ? 1 : 0, concedidoPor.toLowerCase(), nowIso2()).run();
    await registrarAuditoriaAdmin(db, "admin.alterar", "admin_usuarios", { email, ativo }, concedidoPor);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}
__name(definirAdmin, "definirAdmin");
async function usuarioEhAdmin(db, email, options) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;
  if (options?.adminTokenEnv && options.adminTokenHeader && options.adminTokenHeader === options.adminTokenEnv) return true;
  const adminsEnv = (options?.adminEmailsEnv ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (adminsEnv.includes(normalizedEmail)) return true;
  try {
    const row = await db.prepare("SELECT ativo FROM admin_usuarios WHERE email = ? LIMIT 1").bind(normalizedEmail).first();
    if (row) return Boolean(row.ativo);
    const total = await db.prepare("SELECT COUNT(*) AS total FROM admin_usuarios").first();
    const semAdmins = (total?.total ?? 0) === 0;
    if (semAdmins) {
      await definirAdmin(db, normalizedEmail, true, normalizedEmail);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
__name(usuarioEhAdmin, "usuarioEhAdmin");
async function obterLogsAuditoriaAdmin(db, limite = 50) {
  try {
    const resultado = await db.prepare("SELECT id, acao, alvo, payload_json, autor_email, criado_em FROM admin_auditoria ORDER BY criado_em DESC LIMIT ?").bind(Math.max(1, Math.min(200, limite))).all();
    return (resultado.results ?? []).map((item) => ({
      id: item.id,
      acao: item.acao,
      alvo: item.alvo,
      payloadJson: item.payload_json,
      autorEmail: item.autor_email,
      criadoEm: item.criado_em
    }));
  } catch {
    return [];
  }
}
__name(obterLogsAuditoriaAdmin, "obterLogsAuditoriaAdmin");
async function atualizarScoreConfig(db, valor, autorEmail) {
  try {
    await db.prepare(
      [
        "INSERT INTO configuracoes_produto (chave, tipo, valor_json, atualizado_em)",
        "VALUES ('score.v1', 'json', ?, ?)",
        "ON CONFLICT(chave) DO UPDATE SET valor_json = excluded.valor_json, atualizado_em = excluded.atualizado_em"
      ].join(" ")
    ).bind(JSON.stringify(valor), nowIso2()).run();
    if (autorEmail) await registrarAuditoriaAdmin(db, "score.atualizar", "configuracoes_produto", { chave: "score.v1" }, autorEmail);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}
__name(atualizarScoreConfig, "atualizarScoreConfig");
async function atualizarFeatureFlags(db, flags, autorEmail) {
  try {
    const statements = Object.entries(flags).map(
      ([chave, habilitada]) => db.prepare(
        [
          "INSERT INTO feature_flags (chave, habilitada, rollout_percentual, atualizado_em)",
          "VALUES (?, ?, 100, ?)",
          "ON CONFLICT(chave) DO UPDATE SET habilitada = excluded.habilitada, atualizado_em = excluded.atualizado_em"
        ].join(" ")
      ).bind(chave, habilitada ? 1 : 0, nowIso2())
    );
    if (statements.length) await db.batch(statements);
    if (autorEmail) await registrarAuditoriaAdmin(db, "flags.atualizar", "feature_flags", { total: Object.keys(flags).length }, autorEmail);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}
__name(atualizarFeatureFlags, "atualizarFeatureFlags");
async function atualizarMenus(db, menus, autorEmail) {
  try {
    const statements = menus.map(
      (menu) => db.prepare(
        [
          "INSERT INTO configuracoes_menu (id, chave, label, path, ordem, visivel, atualizado_em)",
          "VALUES (?, ?, ?, ?, ?, ?, ?)",
          "ON CONFLICT(chave) DO UPDATE SET",
          "label = excluded.label, path = excluded.path, ordem = excluded.ordem, visivel = excluded.visivel, atualizado_em = excluded.atualizado_em"
        ].join(" ")
      ).bind(crypto.randomUUID(), menu.chave, menu.label, menu.path, menu.ordem, menu.visivel ? 1 : 0, nowIso2())
    );
    if (statements.length) await db.batch(statements);
    if (autorEmail) await registrarAuditoriaAdmin(db, "menus.atualizar", "configuracoes_menu", { total: menus.length }, autorEmail);
  } catch {
    throw new Error("MODULO_ADM_NAO_DISPONIVEL");
  }
}
__name(atualizarMenus, "atualizarMenus");
async function registrarAuditoriaAdmin(db, acao, alvo, payload, autorEmail) {
  try {
    await db.prepare("INSERT INTO admin_auditoria (id, acao, alvo, payload_json, autor_email, criado_em) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), acao, alvo, JSON.stringify(payload), autorEmail.toLowerCase(), nowIso2()).run();
  } catch {
  }
}
__name(registrarAuditoriaAdmin, "registrarAuditoriaAdmin");

// src/server/routes/app.routes.ts
async function handleAppRoutes(pathname, request, env, sessao) {
  if (pathname === "/api/app/content" && request.method === "GET") {
    return sucesso(await obterConteudoApp(env.DB));
  }
  if (pathname === "/api/app/corretoras" && request.method === "GET") {
    return sucesso(await obterCorretorasSuportadas(env.DB));
  }
  if (pathname === "/api/app/simulacoes/parametros" && request.method === "GET") {
    const rows = await env.DB.prepare("SELECT chave, valor_json, descricao, ativo, atualizado_em FROM simulacoes_parametros WHERE ativo = 1 ORDER BY chave ASC").all();
    return sucesso(
      (rows.results ?? []).map((row) => ({
        chave: row.chave,
        valor: row.valor_json ? JSON.parse(row.valor_json) : {},
        descricao: row.descricao ?? "",
        ativo: row.ativo === 1,
        atualizadoEm: row.atualizado_em
      }))
    );
  }
  if (pathname === "/api/app/config" && request.method === "GET") {
    if (!sessao) return null;
    return sucesso(await obterAppConfig(env.DB));
  }
  return null;
}
__name(handleAppRoutes, "handleAppRoutes");

// ../modulos-backend/perfil/src/repositorio.ts
var RepositorioPerfilD1 = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "RepositorioPerfilD1");
  }
  async obterPerfil(usuarioId) {
    const row = await this.db.prepare(
      "SELECT id, usuario_id, renda_mensal, gasto_mensal, aporte_mensal, reserva_caixa, horizonte, perfil_risco, objetivo, frequencia_aporte, experiencia_investimentos, tolerancia_risco_real, maturidade FROM perfil_financeiro WHERE usuario_id = ?"
    ).bind(usuarioId).first();
    if (!row) return null;
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      rendaMensal: row.renda_mensal ?? 0,
      gastoMensal: row.gasto_mensal ?? 0,
      aporteMensal: row.aporte_mensal ?? 0,
      reservaCaixa: row.reserva_caixa ?? 0,
      horizonte: row.horizonte ?? "",
      perfilRisco: row.perfil_risco ?? "",
      objetivo: row.objetivo ?? "",
      frequenciaAporte: row.frequencia_aporte ?? "",
      experienciaInvestimentos: row.experiencia_investimentos ?? "",
      toleranciaRiscoReal: row.tolerancia_risco_real ?? "",
      maturidade: row.maturidade ?? 1
    };
  }
  async salvarPerfil(input) {
    const id = input.id ?? `perf_${input.usuarioId}`;
    const existente = await this.obterPerfil(input.usuarioId);
    if (existente) {
      await this.db.prepare(
        "UPDATE perfil_financeiro SET renda_mensal = ?, gasto_mensal = ?, aporte_mensal = ?, reserva_caixa = ?, horizonte = ?, perfil_risco = ?, objetivo = ?, frequencia_aporte = ?, experiencia_investimentos = ?, tolerancia_risco_real = ?, maturidade = ? WHERE usuario_id = ?"
      ).bind(
        input.rendaMensal,
        input.gastoMensal ?? 0,
        input.aporteMensal,
        input.reservaCaixa ?? 0,
        input.horizonte,
        input.perfilRisco,
        input.objetivo,
        input.frequenciaAporte ?? "",
        input.experienciaInvestimentos ?? "",
        input.toleranciaRiscoReal ?? "",
        input.maturidade,
        input.usuarioId
      ).run();
    } else {
      await this.db.prepare(
        "INSERT INTO perfil_financeiro (id, usuario_id, renda_mensal, gasto_mensal, aporte_mensal, reserva_caixa, horizonte, perfil_risco, objetivo, frequencia_aporte, experiencia_investimentos, tolerancia_risco_real, maturidade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        id,
        input.usuarioId,
        input.rendaMensal,
        input.gastoMensal ?? 0,
        input.aporteMensal,
        input.reservaCaixa ?? 0,
        input.horizonte,
        input.perfilRisco,
        input.objetivo,
        input.frequenciaAporte ?? "",
        input.experienciaInvestimentos ?? "",
        input.toleranciaRiscoReal ?? "",
        input.maturidade
      ).run();
    }
    const atualizado = await this.obterPerfil(input.usuarioId);
    if (!atualizado) throw new Error("Falha ao salvar perfil");
    return atualizado;
  }
  async obterContextoFinanceiro(usuarioId) {
    const row = await this.db.prepare("SELECT contexto_json, atualizado_em FROM perfil_contexto_financeiro WHERE usuario_id = ? LIMIT 1").bind(usuarioId).first();
    if (!row?.contexto_json) return null;
    try {
      const parsed = JSON.parse(row.contexto_json);
      return {
        ...parsed,
        usuarioId,
        atualizadoEm: row.atualizado_em,
        patrimonioExterno: {
          imoveis: parsed.patrimonioExterno?.imoveis ?? [],
          veiculos: parsed.patrimonioExterno?.veiculos ?? [],
          poupanca: parsed.patrimonioExterno?.poupanca ?? parsed.patrimonioExterno?.caixaDisponivel ?? 0,
          caixaDisponivel: parsed.patrimonioExterno?.caixaDisponivel ?? 0
        },
        dividas: parsed.dividas ?? []
      };
    } catch {
      return null;
    }
  }
  async salvarContextoFinanceiro(contexto) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const payload = {
      ...contexto,
      patrimonioExterno: {
        imoveis: contexto.patrimonioExterno?.imoveis ?? [],
        veiculos: contexto.patrimonioExterno?.veiculos ?? [],
        poupanca: contexto.patrimonioExterno?.poupanca ?? contexto.patrimonioExterno?.caixaDisponivel ?? 0,
        caixaDisponivel: contexto.patrimonioExterno?.caixaDisponivel ?? 0
      },
      dividas: contexto.dividas ?? [],
      atualizadoEm: now
    };
    await this.db.prepare(
      [
        "INSERT INTO perfil_contexto_financeiro (id, usuario_id, contexto_json, atualizado_em)",
        "VALUES (?, ?, ?, ?)",
        "ON CONFLICT(usuario_id) DO UPDATE SET contexto_json = excluded.contexto_json, atualizado_em = excluded.atualizado_em"
      ].join(" ")
    ).bind(crypto.randomUUID(), contexto.usuarioId, JSON.stringify(payload), now).run();
    return payload;
  }
  async listarPlataformas(usuarioId) {
    const result = await this.db.prepare(
      "SELECT id, usuario_id, nome, ultimo_import, status FROM plataformas_vinculadas WHERE usuario_id = ? ORDER BY nome ASC"
    ).bind(usuarioId).all();
    return (result.results ?? []).map((row) => ({
      id: row.id,
      usuarioId: row.usuario_id,
      nome: row.nome,
      ultimoImport: row.ultimo_import,
      status: row.status ?? "ativo"
    }));
  }
};

// ../modulos-backend/perfil/src/servico.ts
var ServicoPerfilPadrao = class {
  constructor(repositorio) {
    this.repositorio = repositorio;
  }
  static {
    __name(this, "ServicoPerfilPadrao");
  }
  obterPerfil(usuarioId) {
    return this.repositorio.obterPerfil(usuarioId);
  }
  salvarPerfil(perfil) {
    return this.repositorio.salvarPerfil(perfil);
  }
  obterContextoFinanceiro(usuarioId) {
    return this.repositorio.obterContextoFinanceiro(usuarioId);
  }
  salvarContextoFinanceiro(contexto) {
    return this.repositorio.salvarContextoFinanceiro(contexto);
  }
  listarPlataformas(usuarioId) {
    return this.repositorio.listarPlataformas(usuarioId);
  }
};

// ../modulos-backend/insights/src/repositorio.ts
var RepositorioInsightsD1 = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "RepositorioInsightsD1");
  }
  async obterContextoPatrimonial(usuarioId) {
    const row = await this.db.prepare("SELECT contexto_json FROM perfil_contexto_financeiro WHERE usuario_id = ? LIMIT 1").bind(usuarioId).first();
    if (!row?.contexto_json) return { imoveis: 0, veiculos: 0, caixa: 0, dividas: 0 };
    try {
      const parsed = JSON.parse(row.contexto_json);
      const imoveisBruto = (parsed.patrimonioExterno?.imoveis ?? []).reduce((acc, item) => acc + Number(item.valorEstimado ?? 0), 0);
      const saldoImoveis = (parsed.patrimonioExterno?.imoveis ?? []).reduce((acc, item) => acc + Number(item.saldoFinanciamento ?? 0), 0);
      const veiculos = (parsed.patrimonioExterno?.veiculos ?? []).reduce((acc, item) => acc + Number(item.valorEstimado ?? 0), 0);
      const caixa = Number(parsed.patrimonioExterno?.caixaDisponivel ?? 0);
      const dividas = (parsed.dividas ?? []).reduce((acc, item) => acc + Number(item.saldoDevedor ?? 0), 0);
      return {
        imoveis: Math.max(0, imoveisBruto - saldoImoveis),
        veiculos: Math.max(0, veiculos),
        caixa: Math.max(0, caixa),
        dividas: Math.max(0, dividas + Math.max(0, saldoImoveis))
      };
    } catch {
      return { imoveis: 0, veiculos: 0, caixa: 0, dividas: 0 };
    }
  }
  async obterPerfil(usuarioId) {
    const [row, contextoRow] = await Promise.all([
      this.db.prepare(
        "SELECT id, usuario_id, renda_mensal, aporte_mensal, horizonte, perfil_risco, objetivo, maturidade FROM perfil_financeiro WHERE usuario_id = ?"
      ).bind(usuarioId).first(),
      this.db.prepare("SELECT contexto_json FROM perfil_contexto_financeiro WHERE usuario_id = ? LIMIT 1").bind(usuarioId).first().catch(() => null)
    ]);
    if (!row) return null;
    let faixaEtaria;
    if (contextoRow?.contexto_json) {
      try {
        const ctx = JSON.parse(contextoRow.contexto_json);
        faixaEtaria = ctx.faixaEtaria;
      } catch {
      }
    }
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      rendaMensal: row.renda_mensal ?? 0,
      aporteMensal: row.aporte_mensal ?? 0,
      horizonte: row.horizonte ?? "",
      perfilRisco: row.perfil_risco ?? "",
      objetivo: row.objetivo ?? "",
      maturidade: row.maturidade ?? 1,
      faixaEtaria
    };
  }
  async obterMetricasCarteira(usuarioId) {
    const [ativos, posicoesRaw, perfil, contextoPatrimonial] = await Promise.all([
      this.db.prepare(
        "SELECT ticker, categoria, valor_atual, participacao FROM ativos WHERE usuario_id = ? ORDER BY valor_atual DESC"
      ).bind(usuarioId).all(),
      (async () => {
        try {
          return await this.db.prepare("SELECT tipo, valor_atual, liquidez FROM posicoes_financeiras WHERE usuario_id = ? AND ativo = 1").bind(usuarioId).all();
        } catch {
          return { results: [] };
        }
      })(),
      this.obterPerfil(usuarioId),
      this.obterContextoPatrimonial(usuarioId)
    ]);
    const linhas = ativos.results ?? [];
    const patrimonioTotal = linhas.reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const quantidadeAtivos = linhas.length;
    const categorias = new Set(linhas.map((item) => item.categoria));
    const quantidadeCategorias = categorias.size;
    const linhasComParticipacao = linhas.map((item) => {
      const valor = Number(item.valor_atual ?? 0);
      const participacaoCalculada = patrimonioTotal > 0 ? valor / patrimonioTotal * 100 : 0;
      return { ...item, participacaoCalculada };
    });
    const maiorParticipacao = linhasComParticipacao.reduce((max, item) => Math.max(max, item.participacaoCalculada), 0);
    const top3Participacao = linhasComParticipacao.slice(0, 3).reduce((acc, item) => acc + item.participacaoCalculada, 0);
    const valorRendaVariavel = linhas.filter((item) => item.categoria === "acao").reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const valorDefensivo = linhas.filter((item) => item.categoria === "renda_fixa" || item.categoria === "previdencia").reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const valorRendaFixa = linhas.filter((item) => item.categoria === "renda_fixa").reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const ETF_INTERNACIONAIS = /* @__PURE__ */ new Set([
      "IVVB11",
      "BNDX11",
      "XINA11",
      "HBHB11",
      "NASD11",
      "HASH11",
      "WRLD11",
      "SPXI11",
      "GOLD11",
      "ACWI11",
      "EURP11",
      "USDR11",
      "SMAL11"
    ]);
    const ehInternacional = /* @__PURE__ */ __name((ticker) => {
      if (!ticker) return false;
      const t = ticker.toUpperCase().trim();
      if (ETF_INTERNACIONAIS.has(t)) return true;
      if (/^[A-Z]{4}3[45]$/.test(t)) return true;
      return false;
    }, "ehInternacional");
    const valorInternacional = linhas.filter((item) => ehInternacional(item.ticker)).reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    let hist = [];
    try {
      const snapshots = await this.db.prepare(
        "SELECT data, valor_total FROM snapshots_patrimonio WHERE usuario_id = ? ORDER BY data DESC LIMIT 12"
      ).bind(usuarioId).all();
      hist = snapshots.results ?? [];
    } catch {
      hist = [];
    }
    const atual = hist[0]?.valor_total ?? patrimonioTotal;
    const seisMeses = hist[5]?.valor_total ?? atual;
    const dozeMeses = hist[11]?.valor_total ?? atual;
    const evolucaoPatrimonio6m = seisMeses > 0 ? (atual - seisMeses) / seisMeses * 100 : 0;
    const evolucaoPatrimonio12m = dozeMeses > 0 ? (atual - dozeMeses) / dozeMeses * 100 : 0;
    const idadeCarteiraMeses = hist.length;
    let mesesComAporteReais = null;
    try {
      const aportes = await this.db.prepare(
        "SELECT DISTINCT substr(data_aporte, 1, 7) AS mes FROM aportes WHERE usuario_id = ? AND date(data_aporte) >= date('now', '-6 months')"
      ).bind(usuarioId).all();
      const linhas2 = aportes.results ?? [];
      if (linhas2.length > 0) mesesComAporteReais = linhas2.length;
    } catch {
      mesesComAporteReais = null;
    }
    const mesesComAporteIndireto = hist.slice(0, 6).filter((item, index) => {
      const anterior = hist[index + 1];
      if (!anterior) return false;
      return (item.valor_total ?? 0) > (anterior.valor_total ?? 0);
    }).length;
    const mesesComAporteUltimos6m = mesesComAporteReais ?? mesesComAporteIndireto;
    const fonteMesesComAporte = mesesComAporteReais !== null ? "real" : "indireto";
    const posicoesRows = posicoesRaw.results ?? [];
    const valorPosicoes = posicoesRows.reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const caixaPerfil = Number(perfil?.reservaCaixa ?? 0);
    const investimentos = patrimonioTotal;
    const imoveis = contextoPatrimonial.imoveis;
    const veiculos = contextoPatrimonial.veiculos;
    const caixaContexto = contextoPatrimonial.caixa;
    const caixaPosicoes = posicoesRows.filter((item) => item.tipo === "caixa" || item.tipo === "poupanca" || item.tipo === "cofrinho").reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const caixa = Math.max(caixaContexto, caixaPosicoes, caixaPerfil);
    const outros = Math.max(0, valorPosicoes - caixaPosicoes);
    const ativosLiquidos = investimentos + caixa;
    const ativosIliquidos = imoveis + veiculos;
    const passivoTotal = contextoPatrimonial.dividas;
    const patrimonioBruto = investimentos + imoveis + veiculos + caixa + outros;
    const patrimonioLiquido = patrimonioBruto - passivoTotal;
    const patrimonioComPosicoes = Math.max(0, patrimonioBruto);
    const valorLiquidezImediata = posicoesRows.filter((item) => item.liquidez === "imediata").reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const valorDinheiroParado = posicoesRows.filter((item) => item.tipo === "caixa" || item.tipo === "poupanca" || item.tipo === "cofrinho").reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const valorIliquido = posicoesRows.filter((item) => item.tipo === "imovel" || item.tipo === "veiculo" || item.liquidez === "baixa").reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const valorDivida = posicoesRows.filter((item) => item.tipo === "divida").reduce((acc, item) => acc + Math.abs(item.valor_atual ?? 0), 0);
    return {
      patrimonioTotal,
      patrimonioBruto,
      patrimonioLiquido,
      ativosLiquidos,
      ativosIliquidos,
      passivoTotal,
      quantidadeAtivos,
      quantidadeCategorias,
      maiorParticipacao,
      top3Participacao,
      percentualRendaVariavel: patrimonioTotal > 0 ? valorRendaVariavel / patrimonioTotal * 100 : 0,
      percentualRendaFixa: patrimonioTotal > 0 ? valorRendaFixa / patrimonioTotal * 100 : 0,
      percentualDefensivo: patrimonioTotal > 0 ? valorDefensivo / patrimonioTotal * 100 : 0,
      percentualInternacional: patrimonioTotal > 0 ? valorInternacional / patrimonioTotal * 100 : 0,
      evolucaoPatrimonio6m,
      evolucaoPatrimonio12m,
      idadeCarteiraMeses,
      mesesComAporteUltimos6m,
      fonteMesesComAporte,
      percentualLiquidezImediata: patrimonioComPosicoes > 0 ? valorLiquidezImediata / patrimonioComPosicoes * 100 : 0,
      percentualDinheiroParado: patrimonioComPosicoes > 0 ? valorDinheiroParado / patrimonioComPosicoes * 100 : 0,
      percentualIliquido: patrimonioComPosicoes > 0 ? valorIliquido / patrimonioComPosicoes * 100 : 0,
      percentualDividaSobrePatrimonio: patrimonioComPosicoes > 0 ? valorDivida / patrimonioComPosicoes * 100 : 0,
      percentualEmImoveis: patrimonioBruto > 0 ? imoveis / patrimonioBruto * 100 : 0,
      percentualEmVeiculos: patrimonioBruto > 0 ? veiculos / patrimonioBruto * 100 : 0,
      percentualEmInvestimentos: patrimonioBruto > 0 ? investimentos / patrimonioBruto * 100 : 0,
      percentualEmCaixa: patrimonioBruto > 0 ? caixa / patrimonioBruto * 100 : 0,
      percentualEmOutros: patrimonioBruto > 0 ? outros / patrimonioBruto * 100 : 0
    };
  }
  async obterConfiguracaoScore() {
    let row = null;
    try {
      row = await this.db.prepare("SELECT valor_json FROM configuracoes_produto WHERE chave = 'score.v1' LIMIT 1").first();
    } catch {
      return null;
    }
    if (!row?.valor_json) return null;
    try {
      const parsed = JSON.parse(row.valor_json);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  }
  async obterUltimoSnapshotScore(usuarioId) {
    let row = null;
    try {
      row = await this.db.prepare("SELECT score, criado_em FROM snapshots_score WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 1").bind(usuarioId).first();
    } catch {
      return null;
    }
    if (!row) return null;
    return {
      score: row.score ?? 0,
      criadoEm: row.criado_em
    };
  }
  async obterImpactoDecisoesRecentes(usuarioId) {
    let deltas = [];
    try {
      const rows = await this.db.prepare("SELECT delta_score FROM simulacoes WHERE usuario_id = ? AND status = 'salva' ORDER BY atualizado_em DESC LIMIT 5").bind(usuarioId).all();
      deltas = (rows.results ?? []).map((row) => row.delta_score).filter((value) => typeof value === "number" && Number.isFinite(value));
    } catch {
      return { quantidade: 0, deltaMedio: 0, deltaTotal: 0 };
    }
    if (deltas.length === 0) {
      return { quantidade: 0, deltaMedio: 0, deltaTotal: 0 };
    }
    const deltaTotal = deltas.reduce((acc, item) => acc + item, 0);
    return {
      quantidade: deltas.length,
      deltaTotal,
      deltaMedio: deltaTotal / deltas.length
    };
  }
  async salvarSnapshotScore(usuarioId, payload) {
    try {
      await this.db.prepare(
        [
          "INSERT INTO snapshots_score",
          "(id, usuario_id, score, faixa, risco_principal, acao_prioritaria, blocos_json, fatores_positivos_json, fatores_negativos_json, criado_em)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ].join(" ")
      ).bind(
        crypto.randomUUID(),
        usuarioId,
        payload.score,
        payload.faixa,
        payload.riscoPrincipal,
        payload.acaoPrioritaria,
        JSON.stringify(payload.pilares),
        JSON.stringify(payload.fatoresPositivos),
        JSON.stringify(payload.fatoresNegativos),
        (/* @__PURE__ */ new Date()).toISOString()
      ).run();
    } catch {
    }
  }
};

// ../modulos-backend/insights/src/servico.ts
var clamp = /* @__PURE__ */ __name((min, max, value) => Math.max(min, Math.min(max, value)), "clamp");
var arred = /* @__PURE__ */ __name((value) => Math.round(value), "arred");
var defaultScoreConfig2 = {
  pesos: {
    estrategiaCarteira: 35,
    comportamentoFinanceiro: 25,
    estruturaPatrimonial: 20,
    adequacaoMomentoVida: 20
  },
  thresholds: {
    criticoMax: 39,
    fragilMax: 59,
    regularMax: 74,
    bomMax: 89
  },
  penalidades: {
    perfilConservadorRvAlto: 10,
    perfilModeradoRvAlto: 6,
    perfilArrojadoRvBaixo: 4,
    horizonteCurtoAgressivo: 5,
    rendaBaixaVolatilidadeAlta: 4,
    maiorAtivoAlto: 6,
    concentracaoExtrema: 20,
    top3Concentrado: 5,
    classeUnica: 6,
    poucosAtivos: 4,
    semDefensivo: 4,
    objetivoPreservacaoRisco: 7,
    objetivoCrescimentoDefensivo: 5,
    objetivoRendaSemBase: 4,
    objetivoAposentadoriaSemConsistencia: 3,
    aportesInconsistentes: 6,
    evolucaoNegativa: 8,
    liquidezBaixa: 6,
    dinheiroParadoAlto: 4,
    dependenciaDeAtivoIliquido: 5,
    endividamentoAlto: 7,
    idadeMaduraRiscoAgressivo: 8,
    idadeJovemSubaproveitada: 4,
    idadePreAposentadoriaDefensiva: 5
  }
};
var proprietaryWeights = {
  liquidez: 24,
  patrimonioLiquido: 18,
  diversificacao: 14,
  concentracaoIliquida: 12,
  endividamento: 20,
  reservaFinanceira: 8,
  investimentos: 4
};
var mapFaixa = /* @__PURE__ */ __name((score, thresholds) => {
  if (score <= thresholds.criticoMax) return "critico";
  if (score <= thresholds.fragilMax) return "fragil";
  if (score <= thresholds.regularMax) return "regular";
  if (score <= thresholds.bomMax) return "bom";
  return "muito_bom";
}, "mapFaixa");
var mapClassificacao = /* @__PURE__ */ __name((score, thresholds) => {
  if (score <= thresholds.criticoMax) return "critico";
  if (score <= thresholds.fragilMax) return "baixo";
  if (score <= thresholds.regularMax) return "ok";
  if (score <= thresholds.bomMax) return "bom";
  return "excelente";
}, "mapClassificacao");
var ServicoInsightsPadrao = class {
  constructor(repositorio) {
    this.repositorio = repositorio;
  }
  static {
    __name(this, "ServicoInsightsPadrao");
  }
  async gerarResumo(usuarioId) {
    const [configRaw, perfil, metricas, ultimo, impactoDecisoesRecentes] = await Promise.all([
      this.repositorio.obterConfiguracaoScore(),
      this.repositorio.obterPerfil(usuarioId),
      this.repositorio.obterMetricasCarteira(usuarioId),
      this.repositorio.obterUltimoSnapshotScore(usuarioId),
      this.repositorio.obterImpactoDecisoesRecentes(usuarioId)
    ]);
    const config = this.montarConfiguracaoScore(configRaw);
    const penalidadesAplicadas = this.calcularPenalidades(metricas, perfil, config);
    const pilares = this.calcularPilares(config, penalidadesAplicadas);
    const scoreBase = arred(
      pilares.estrategiaCarteira + pilares.comportamentoFinanceiro + pilares.estruturaPatrimonial + pilares.adequacaoMomentoVida
    );
    const ajusteProprietario = this.calcularAjusteProprietario(metricas);
    const scoreValor = clamp(0, 100, scoreBase + ajusteProprietario);
    const faixa = mapFaixa(scoreValor, config.thresholds);
    const classificacao = mapClassificacao(scoreValor, config.thresholds);
    const retorno = arred(metricas.evolucaoPatrimonio12m * 100) / 100;
    const atualizadoEm = (/* @__PURE__ */ new Date()).toISOString();
    const fatoresPositivos = this.calcularFatoresPositivos(metricas, perfil).slice(0, 5);
    const fatoresNegativos = [...penalidadesAplicadas].map((item) => ({ label: item.descricao, impacto: -item.peso })).sort((a, b) => a.impacto - b.impacto).slice(0, 5);
    const penalidadePrincipal = [...penalidadesAplicadas].sort((a, b) => b.peso - a.peso)[0] ?? null;
    const insightPrincipal = this.traduzirPenalidade(penalidadePrincipal);
    const riscoCodigo = this.codigoRiscoPorPenalidade(penalidadePrincipal?.tipo);
    const acaoCodigo = this.codigoAcaoPorRisco(riscoCodigo);
    const scoreAnterior = ultimo?.score;
    const variacao = typeof scoreAnterior === "number" ? scoreValor - scoreAnterior : void 0;
    const scoreDetalhado = {
      scoreAnterior,
      variacao,
      score: scoreValor,
      faixa,
      fatoresPositivos,
      fatoresNegativos,
      riscoPrincipal: riscoCodigo,
      acaoPrioritaria: acaoCodigo,
      pilares,
      atualizadoEm
    };
    await this.repositorio.salvarSnapshotScore(usuarioId, {
      score: scoreDetalhado.score,
      faixa: scoreDetalhado.faixa,
      riscoPrincipal: scoreDetalhado.riscoPrincipal,
      acaoPrioritaria: scoreDetalhado.acaoPrioritaria,
      pilares: scoreDetalhado.pilares,
      fatoresPositivos: scoreDetalhado.fatoresPositivos,
      fatoresNegativos: scoreDetalhado.fatoresNegativos
    });
    const riscoPrincipal = {
      codigo: riscoCodigo,
      titulo: this.tituloRisco(riscoCodigo),
      descricao: this.descricaoRisco(riscoCodigo),
      severidade: faixa === "critico" || faixa === "fragil" ? "alto" : faixa === "regular" ? "medio" : "baixo"
    };
    const pontosRecuperaveis = penalidadePrincipal?.peso ?? 0;
    const acaoPrioritaria = {
      codigo: acaoCodigo,
      titulo: this.tituloAcao(acaoCodigo),
      descricao: insightPrincipal.acao,
      impactoEsperado: pontosRecuperaveis > 0 ? `Resolver isso pode recuperar at\xE9 ${pontosRecuperaveis} pontos no seu score (de ${scoreValor}/100 para at\xE9 ${Math.min(100, scoreValor + pontosRecuperaveis)}/100).` : `Melhora esperada na classifica\xE7\xE3o atual: ${classificacao}.`
    };
    const diagnostico = this.gerarDiagnosticoFinal(scoreValor, retorno, insightPrincipal, impactoDecisoesRecentes, config.thresholds);
    const diagnosticoLegado = {
      resumo: diagnostico.mensagem,
      riscos: [riscoPrincipal],
      acoes: [acaoPrioritaria]
    };
    return {
      score: scoreValor,
      classificacao,
      retorno,
      diagnostico,
      scoreDetalhado,
      diagnosticoLegado,
      riscoPrincipal,
      acaoPrioritaria,
      penalidadesAplicadas,
      impactoDecisoesRecentes,
      patrimonioConsolidado: {
        patrimonioBruto: metricas.patrimonioBruto,
        patrimonioLiquido: metricas.patrimonioLiquido,
        ativosLiquidos: metricas.ativosLiquidos,
        ativosIliquidos: metricas.ativosIliquidos,
        passivoTotal: metricas.passivoTotal,
        distribuicao: {
          imoveis: metricas.percentualEmImoveis,
          veiculos: metricas.percentualEmVeiculos,
          investimentos: metricas.percentualEmInvestimentos,
          caixa: metricas.percentualEmCaixa,
          outros: metricas.percentualEmOutros
        }
      },
      pesosProprietarios: { ...proprietaryWeights }
    };
  }
  async calcularScore(usuarioId) {
    const resumo = await this.gerarResumo(usuarioId);
    return resumo.scoreDetalhado;
  }
  async gerarDiagnostico(usuarioId) {
    const resumo = await this.gerarResumo(usuarioId);
    return resumo.diagnosticoLegado;
  }
  montarConfiguracaoScore(raw) {
    if (!raw) return defaultScoreConfig2;
    const pesos = this.mergeNumerico(defaultScoreConfig2.pesos, raw.pesos);
    const thresholds = this.mergeNumerico(defaultScoreConfig2.thresholds, raw.thresholds);
    const penalidades = this.mergeNumerico(defaultScoreConfig2.penalidades, raw.penalidades);
    return { pesos, thresholds, penalidades };
  }
  mergeNumerico(base, value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return base;
    const parcial = value;
    const out = { ...base };
    for (const key of Object.keys(base)) {
      const candidate = parcial[key];
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        out[key] = candidate;
      }
    }
    return out;
  }
  calcularPenalidades(metricas, perfil, config) {
    const penalidades = [];
    const perfilRisco = (perfil?.perfilRisco ?? "").toLowerCase();
    const objetivo = (perfil?.objetivo ?? "").toLowerCase();
    const horizonte = (perfil?.horizonte ?? "").toLowerCase();
    const rendaMensal = perfil?.rendaMensal ?? 0;
    const rv = metricas.percentualRendaVariavel;
    const rf = metricas.percentualRendaFixa;
    const add = /* @__PURE__ */ __name((tipo, descricao, pilar) => {
      penalidades.push({
        tipo,
        peso: config.penalidades[tipo],
        descricao,
        pilar
      });
    }, "add");
    if (perfilRisco.includes("conservador") && rv > 30) {
      add("perfilConservadorRvAlto", "Perfil conservador com exposi\xE7\xE3o elevada a renda vari\xE1vel.", "estrategiaCarteira");
    }
    if (perfilRisco.includes("moderado") && rv > 60) {
      add("perfilModeradoRvAlto", "Perfil moderado com exposi\xE7\xE3o agressiva acima do esperado.", "estrategiaCarteira");
    }
    if (perfilRisco.includes("arrojado") && rv < 20) {
      add("perfilArrojadoRvBaixo", "Perfil arrojado com baixa exposi\xE7\xE3o a ativos de crescimento.", "estrategiaCarteira");
    }
    if (horizonte.includes("curto") && rv > 50) {
      add("horizonteCurtoAgressivo", "Horizonte curto com risco elevado na carteira.", "adequacaoMomentoVida");
    }
    if (rendaMensal > 0 && rendaMensal < 5e3 && metricas.maiorParticipacao > 35 && rv > 50) {
      add("rendaBaixaVolatilidadeAlta", "Volatilidade da carteira incompat\xEDvel com faixa de renda atual.", "adequacaoMomentoVida");
    }
    if (metricas.maiorParticipacao > 80) {
      add("concentracaoExtrema", "Um \xFAnico ativo concentra mais de 80% do patrim\xF4nio.", "estrategiaCarteira");
    } else if (metricas.maiorParticipacao > 25) {
      add("maiorAtivoAlto", "Carteira concentrada no maior ativo acima de 25%.", "estrategiaCarteira");
    }
    if (metricas.top3Participacao > 60) {
      add("top3Concentrado", "Top 3 ativos concentram risco estrutural da carteira.", "estrategiaCarteira");
    }
    if (metricas.quantidadeCategorias <= 1) {
      add("classeUnica", "Apenas uma classe de ativos na carteira.", "estrategiaCarteira");
    }
    if (metricas.quantidadeAtivos < 4) {
      add("poucosAtivos", "Quantidade de ativos insuficiente para diversifica\xE7\xE3o m\xEDnima.", "estrategiaCarteira");
    }
    if (!perfilRisco.includes("arrojado") && metricas.percentualDefensivo <= 0) {
      add("semDefensivo", "Carteira sem componente defensivo para o perfil atual.", "estrategiaCarteira");
    }
    if (objetivo.includes("preserva") && rv > 50) {
      add("objetivoPreservacaoRisco", "Objetivo de preserva\xE7\xE3o com risco acima do esperado.", "adequacaoMomentoVida");
    }
    if (objetivo.includes("crescimento") && rf > 90 && horizonte.includes("longo")) {
      add("objetivoCrescimentoDefensivo", "Objetivo de crescimento com carteira excessivamente defensiva.", "adequacaoMomentoVida");
    }
    if (objetivo.includes("renda") && rf < 20) {
      add("objetivoRendaSemBase", "Objetivo de renda com base fraca em ativos geradores de renda.", "adequacaoMomentoVida");
    }
    const fonteAporte = metricas.fonteMesesComAporte ?? "indireto";
    if (objetivo.includes("aposentadoria") && metricas.mesesComAporteUltimos6m >= 3 && metricas.mesesComAporteUltimos6m < 4) {
      const label = fonteAporte === "real" ? "Objetivo de longo prazo com aportes recentes inconsistentes." : "Objetivo de longo prazo com evolu\xE7\xE3o patrimonial recente inst\xE1vel.";
      add("objetivoAposentadoriaSemConsistencia", label, "comportamentoFinanceiro");
    }
    if (metricas.mesesComAporteUltimos6m < 3) {
      const label = fonteAporte === "real" ? "Poucos aportes registrados nos \xFAltimos 6 meses." : "Poucos meses com crescimento patrimonial nos \xFAltimos 6 meses (sinal indireto de ritmo financeiro).";
      add("aportesInconsistentes", label, "comportamentoFinanceiro");
    }
    if (metricas.evolucaoPatrimonio12m < 0) {
      add("evolucaoNegativa", "Patrim\xF4nio em evolu\xE7\xE3o negativa no horizonte de 12 meses.", "comportamentoFinanceiro");
    }
    if (metricas.percentualLiquidezImediata < 10) {
      add("liquidezBaixa", "Liquidez imediata abaixo do m\xEDnimo recomendado.", "estruturaPatrimonial");
    }
    if (metricas.percentualDinheiroParado > 25) {
      add("dinheiroParadoAlto", "Excesso de dinheiro parado em caixa/poupan\xE7a.", "estruturaPatrimonial");
    }
    if (metricas.percentualIliquido > 60) {
      add("dependenciaDeAtivoIliquido", "Depend\xEAncia elevada de ativos il\xEDquidos.", "estruturaPatrimonial");
    }
    if (metricas.percentualDividaSobrePatrimonio > 35) {
      add("endividamentoAlto", "N\xEDvel de endividamento elevado em rela\xE7\xE3o ao patrim\xF4nio.", "comportamentoFinanceiro");
    }
    if (metricas.percentualEmImoveis > 55) {
      add("dependenciaDeAtivoIliquido", "Concentra\xE7\xE3o patrimonial elevada em im\xF3veis.", "estruturaPatrimonial");
    }
    if (metricas.percentualEmVeiculos > 25) {
      add("dinheiroParadoAlto", "Concentra\xE7\xE3o patrimonial elevada em ve\xEDculos.", "estruturaPatrimonial");
    }
    if (metricas.ativosLiquidos > 0 && metricas.passivoTotal / metricas.ativosLiquidos > 0.7) {
      add("endividamentoAlto", "Passivo pressiona fortemente a liquidez dispon\xEDvel.", "comportamentoFinanceiro");
    }
    const faixaEtaria = (perfil?.faixaEtaria ?? "").toLowerCase();
    const idadeMadura = faixaEtaria.startsWith("46") || faixaEtaria.startsWith("56") || faixaEtaria.startsWith("55+") || faixaEtaria.startsWith("56+");
    const idadeJovem = faixaEtaria.startsWith("18") || faixaEtaria.startsWith("26") || faixaEtaria.startsWith("20") || faixaEtaria.startsWith("25");
    const preAposentadoria = faixaEtaria.startsWith("56") || faixaEtaria.startsWith("55+") || faixaEtaria.startsWith("56+");
    if (idadeMadura && rv > 60) {
      add(
        "idadeMaduraRiscoAgressivo",
        `Faixa et\xE1ria ${perfil?.faixaEtaria} com ${rv.toFixed(0)}% em renda vari\xE1vel \u2014 risco elevado para o momento de vida.`,
        "adequacaoMomentoVida"
      );
    }
    if (idadeJovem && horizonte.includes("longo") && rf > 80) {
      add(
        "idadeJovemSubaproveitada",
        `Investidor jovem (${perfil?.faixaEtaria}) com horizonte longo mas carteira excessivamente conservadora (${rf.toFixed(0)}% em renda fixa).`,
        "adequacaoMomentoVida"
      );
    }
    if (preAposentadoria && rv > 40) {
      add(
        "idadePreAposentadoriaDefensiva",
        `Pr\xF3ximo da aposentadoria (${perfil?.faixaEtaria}) com ${rv.toFixed(0)}% em renda vari\xE1vel \u2014 considere migrar gradualmente para ativos mais defensivos.`,
        "adequacaoMomentoVida"
      );
    }
    return penalidades;
  }
  calcularPilares(config, penalidadesAplicadas) {
    const penalidadePorPilar = {
      estrategiaCarteira: 0,
      comportamentoFinanceiro: 0,
      estruturaPatrimonial: 0,
      adequacaoMomentoVida: 0
    };
    for (const item of penalidadesAplicadas) {
      penalidadePorPilar[item.pilar] += item.peso;
    }
    return {
      estrategiaCarteira: clamp(0, config.pesos.estrategiaCarteira, arred(config.pesos.estrategiaCarteira - penalidadePorPilar.estrategiaCarteira)),
      comportamentoFinanceiro: clamp(0, config.pesos.comportamentoFinanceiro, arred(config.pesos.comportamentoFinanceiro - penalidadePorPilar.comportamentoFinanceiro)),
      estruturaPatrimonial: clamp(0, config.pesos.estruturaPatrimonial, arred(config.pesos.estruturaPatrimonial - penalidadePorPilar.estruturaPatrimonial)),
      adequacaoMomentoVida: clamp(0, config.pesos.adequacaoMomentoVida, arred(config.pesos.adequacaoMomentoVida - penalidadePorPilar.adequacaoMomentoVida))
    };
  }
  calcularFatoresPositivos(metricas, perfil) {
    const positivos = [];
    if (metricas.quantidadeCategorias >= 3) positivos.push({ label: "Boa diversifica\xE7\xE3o entre classes de ativos.", impacto: 3 });
    if (metricas.maiorParticipacao <= 25 && metricas.top3Participacao <= 60) positivos.push({ label: "Concentra\xE7\xE3o controlada no topo da carteira.", impacto: 3 });
    if (metricas.percentualInternacional > 5) positivos.push({ label: "Exposi\xE7\xE3o internacional presente.", impacto: 2 });
    if (metricas.mesesComAporteUltimos6m >= 5) {
      const label = metricas.fonteMesesComAporte === "real" ? "Disciplina de aportes consistente nos \xFAltimos meses." : "Evolu\xE7\xE3o patrimonial consistente nos \xFAltimos meses.";
      positivos.push({ label, impacto: 3 });
    }
    if (metricas.evolucaoPatrimonio12m > 0) positivos.push({ label: "Evolu\xE7\xE3o patrimonial positiva em 12 meses.", impacto: 4 });
    if ((perfil?.objetivo ?? "").toLowerCase().includes("crescimento") && metricas.percentualRendaVariavel >= 30) {
      positivos.push({ label: "Aloca\xE7\xE3o compat\xEDvel com objetivo de crescimento.", impacto: 2 });
    }
    if (metricas.percentualEmInvestimentos >= 20) positivos.push({ label: "Parcela relevante do patrim\xF4nio em investimentos produtivos.", impacto: 3 });
    if (metricas.ativosLiquidos > 0 && metricas.passivoTotal / metricas.ativosLiquidos < 0.25) positivos.push({ label: "Endividamento controlado frente \xE0 liquidez.", impacto: 4 });
    return positivos.sort((a, b) => b.impacto - a.impacto);
  }
  calcularAjusteProprietario(metricas) {
    const scoreLiquidez = metricas.patrimonioBruto > 0 ? Math.max(0, Math.min(1, metricas.ativosLiquidos / metricas.patrimonioBruto)) : 0;
    const scorePatrimonioLiquido = metricas.patrimonioBruto > 0 ? Math.max(0, Math.min(1, metricas.patrimonioLiquido / metricas.patrimonioBruto)) : 0;
    const scoreDiversificacao = Math.max(0, Math.min(1, metricas.quantidadeCategorias / 5));
    const scoreConcentracaoIliquida = 1 - Math.max(0, Math.min(1, (metricas.percentualEmImoveis + metricas.percentualEmVeiculos) / 100));
    const scoreEndividamento = 1 - Math.max(0, Math.min(1, metricas.percentualDividaSobrePatrimonio / 100));
    const scoreReserva = Math.max(0, Math.min(1, metricas.percentualEmCaixa / 20));
    const scoreInvestimentos = Math.max(0, Math.min(1, metricas.percentualEmInvestimentos / 40));
    const weighted = scoreLiquidez * proprietaryWeights.liquidez + scorePatrimonioLiquido * proprietaryWeights.patrimonioLiquido + scoreDiversificacao * proprietaryWeights.diversificacao + scoreConcentracaoIliquida * proprietaryWeights.concentracaoIliquida + scoreEndividamento * proprietaryWeights.endividamento + scoreReserva * proprietaryWeights.reservaFinanceira + scoreInvestimentos * proprietaryWeights.investimentos;
    return Math.round(weighted - 50);
  }
  traduzirPenalidade(penalidade) {
    if (!penalidade) {
      return {
        titulo: "Estrat\xE9gia saud\xE1vel",
        descricao: "N\xE3o identificamos penalidade estrutural dominante na carteira atual.",
        acao: "Manter consist\xEAncia de aportes e monitorar mudan\xE7as de perfil."
      };
    }
    switch (penalidade.tipo) {
      case "perfilConservadorRvAlto":
      case "perfilModeradoRvAlto":
      case "horizonteCurtoAgressivo":
      case "rendaBaixaVolatilidadeAlta":
        return {
          titulo: "Risco acima do seu perfil",
          descricao: "Sua carteira est\xE1 assumindo mais risco do que o perfil e o contexto atual sugerem.",
          acao: "Reduzir exposi\xE7\xE3o em renda vari\xE1vel e refor\xE7ar componente defensivo."
        };
      case "maiorAtivoAlto":
      case "concentracaoExtrema":
      case "top3Concentrado":
      case "classeUnica":
      case "poucosAtivos":
        return {
          titulo: "Carteira concentrada",
          descricao: "Boa parte do patrim\xF4nio est\xE1 em poucos ativos ou poucas classes.",
          acao: "Diversificar por classe e reduzir concentra\xE7\xE3o no topo da carteira."
        };
      case "objetivoPreservacaoRisco":
      case "objetivoCrescimentoDefensivo":
      case "objetivoRendaSemBase":
      case "objetivoAposentadoriaSemConsistencia":
        return {
          titulo: "Carteira desalinhada ao objetivo",
          descricao: "A aloca\xE7\xE3o atual n\xE3o est\xE1 coerente com o objetivo financeiro declarado.",
          acao: "Rebalancear carteira para aproximar risco, prazo e objetivo."
        };
      case "aportesInconsistentes":
      case "evolucaoNegativa":
        return {
          titulo: "Ritmo financeiro inconsistente",
          // Detectado via variação do patrimônio mês a mês — sinal indireto.
          // Confirme se há aportes regulares antes de agir.
          descricao: "A evolu\xE7\xE3o patrimonial observada est\xE1 abaixo do esperado. Pode indicar aportes irregulares ou press\xE3o de mercado.",
          acao: "Revisar rotina de aportes e estrat\xE9gia de execu\xE7\xE3o."
        };
      case "liquidezBaixa":
      case "dinheiroParadoAlto":
      case "dependenciaDeAtivoIliquido":
      case "endividamentoAlto":
        return {
          titulo: "Estrutura patrimonial pressionada",
          descricao: "A composi\xE7\xE3o entre liquidez, ativos il\xEDquidos e d\xEDvidas est\xE1 fr\xE1gil.",
          acao: "Refor\xE7ar reserva l\xEDquida e reduzir exposi\xE7\xE3o il\xEDquida nos pr\xF3ximos aportes."
        };
      case "idadeMaduraRiscoAgressivo":
      case "idadePreAposentadoriaDefensiva":
        return {
          titulo: "Risco desalinhado com o momento de vida",
          descricao: "Sua exposi\xE7\xE3o a renda vari\xE1vel est\xE1 elevada para a faixa et\xE1ria declarada.",
          acao: "Migrar gradualmente parte da carteira para ativos de menor volatilidade compat\xEDveis com o horizonte restante."
        };
      case "idadeJovemSubaproveitada":
        return {
          titulo: "Potencial de crescimento subutilizado",
          descricao: "Com seu horizonte de investimento e faixa et\xE1ria, uma carteira mais diversificada pode gerar retornos superiores no longo prazo.",
          acao: "Avaliar gradual aumento da exposi\xE7\xE3o a renda vari\xE1vel e diversifica\xE7\xE3o por classes de maior crescimento."
        };
      default:
        return {
          titulo: "Estrat\xE9gia ajust\xE1vel",
          descricao: penalidade.descricao,
          acao: "Revisar composi\xE7\xE3o da carteira e objetivo financeiro."
        };
    }
  }
  gerarDiagnosticoFinal(score, retorno, insightPrincipal, impactoDecisoes, thresholds) {
    const limiteFragil = thresholds.regularMax;
    const limiteSolido = thresholds.bomMax + 1;
    const impactoConcreto = score <= limiteFragil ? `Seu score est\xE1 em ${score}/100, abaixo do patamar saud\xE1vel para execu\xE7\xE3o consistente.` : `Seu score est\xE1 em ${score}/100, com estrutura financeira funcional.`;
    const consequencia = score <= limiteFragil ? "Mantendo o cen\xE1rio atual, o risco de perda de efici\xEAncia e desalinhamento com objetivo aumenta nos pr\xF3ximos ciclos." : "Se voc\xEA mantiver a disciplina atual, a tend\xEAncia \xE9 sustentar evolu\xE7\xE3o com menor volatilidade estrutural.";
    const efeitoDecisoes = impactoDecisoes.quantidade > 0 ? `Decis\xF5es recentes ${impactoDecisoes.deltaTotal >= 0 ? "melhoraram" : "pioraram"} o score em ${impactoDecisoes.deltaTotal.toFixed(1)} pontos acumulados.` : "Ainda n\xE3o h\xE1 decis\xF5es simuladas salvas para calibrar o diagn\xF3stico comportamental.";
    if (retorno > 0 && score <= limiteFragil) {
      return {
        mensagem: `Sua carteira rendeu ${retorno.toFixed(2)}%, mas a estrat\xE9gia est\xE1 fr\xE1gil. ${efeitoDecisoes}`,
        impactoConcreto,
        consequencia,
        oQueFazerAgora: insightPrincipal.acao,
        insightPrincipal
      };
    }
    if (retorno < 0 && score >= limiteSolido) {
      return {
        mensagem: `A estrat\xE9gia est\xE1 s\xF3lida, mas o mercado pressionou o retorno (${retorno.toFixed(2)}%). ${efeitoDecisoes}`,
        impactoConcreto,
        consequencia,
        oQueFazerAgora: insightPrincipal.acao,
        insightPrincipal
      };
    }
    if (retorno < 0 && score <= limiteFragil) {
      return {
        mensagem: `Resultado e estrutura est\xE3o pressionados (retorno ${retorno.toFixed(2)}%). ${efeitoDecisoes}`,
        impactoConcreto,
        consequencia,
        oQueFazerAgora: insightPrincipal.acao,
        insightPrincipal
      };
    }
    return {
      mensagem: `Estrat\xE9gia e resultado est\xE3o em linha (retorno ${retorno.toFixed(2)}%). ${efeitoDecisoes}`,
      impactoConcreto,
      consequencia,
      oQueFazerAgora: insightPrincipal.acao,
      insightPrincipal
    };
  }
  codigoRiscoPorPenalidade(tipo) {
    if (!tipo) return "sem_risco_estrutural";
    if (["maiorAtivoAlto", "concentracaoExtrema", "top3Concentrado", "classeUnica", "poucosAtivos"].includes(tipo)) return "concentracao_renda_variavel";
    if (["aportesInconsistentes", "evolucaoNegativa"].includes(tipo)) return "inconsistencia_aportes";
    if (["perfilConservadorRvAlto", "perfilModeradoRvAlto", "horizonteCurtoAgressivo", "rendaBaixaVolatilidadeAlta", "semDefensivo"].includes(tipo)) {
      return "risco_incompativel_perfil";
    }
    if (["liquidezBaixa", "dinheiroParadoAlto", "dependenciaDeAtivoIliquido", "endividamentoAlto"].includes(tipo)) {
      return "estrutura_patrimonial_fragil";
    }
    if (["idadeMaduraRiscoAgressivo", "idadeJovemSubaproveitada", "idadePreAposentadoriaDefensiva"].includes(tipo)) {
      return "risco_incompativel_momento_vida";
    }
    return "desalinhamento_objetivo";
  }
  codigoAcaoPorRisco(riscoPrincipal) {
    if (riscoPrincipal === "concentracao_renda_variavel") return "diversificar_por_classe_de_ativo";
    if (riscoPrincipal === "inconsistencia_aportes") return "regularizar_aportes_mensais";
    if (riscoPrincipal === "risco_incompativel_perfil") return "reduzir_assimetria_nos_proximos_aportes";
    if (riscoPrincipal === "estrutura_patrimonial_fragil") return "recompor_reserva_e_liquidez";
    if (riscoPrincipal === "sem_risco_estrutural") return "manter_estrategia_com_consistencia";
    if (riscoPrincipal === "risco_incompativel_momento_vida") return "adequar_carteira_ao_momento_de_vida";
    return "realinhar_carteira_ao_objetivo";
  }
  tituloRisco(codigo) {
    if (codigo === "concentracao_renda_variavel") return "Concentra\xE7\xE3o excessiva em poucos ativos";
    if (codigo === "inconsistencia_aportes") return "Inconsist\xEAncia de aportes e evolu\xE7\xE3o";
    if (codigo === "risco_incompativel_perfil") return "Risco incompat\xEDvel com seu perfil";
    if (codigo === "estrutura_patrimonial_fragil") return "Liquidez e estrutura patrimonial fragilizadas";
    if (codigo === "sem_risco_estrutural") return "Sem risco estrutural dominante";
    return "Desalinhamento com objetivo";
  }
  descricaoRisco(codigo) {
    if (codigo === "concentracao_renda_variavel") return "A carteira est\xE1 concentrada e mais vulner\xE1vel a eventos isolados.";
    if (codigo === "inconsistencia_aportes") return "A evolu\xE7\xE3o patrimonial observada sugere baixa regularidade \u2014 verifique seus aportes reais.";
    if (codigo === "risco_incompativel_perfil") return "A exposi\xE7\xE3o de risco n\xE3o est\xE1 alinhada com seu perfil e contexto atual.";
    if (codigo === "estrutura_patrimonial_fragil") return "O patrim\xF4nio est\xE1 pouco l\xEDquido e com press\xE3o de endividamento ou caixa ineficiente.";
    if (codigo === "sem_risco_estrutural") return "N\xE3o foi identificada fragilidade dominante com peso cr\xEDtico.";
    if (codigo === "risco_incompativel_momento_vida") return "A exposi\xE7\xE3o ao risco n\xE3o est\xE1 adequada \xE0 sua faixa et\xE1ria e momento de vida atual.";
    return "A aloca\xE7\xE3o atual n\xE3o est\xE1 totalmente aderente ao objetivo financeiro declarado.";
  }
  tituloAcao(codigo) {
    if (codigo === "diversificar_por_classe_de_ativo") return "Diversificar por classe de ativo";
    if (codigo === "regularizar_aportes_mensais") return "Regularizar aportes mensais";
    if (codigo === "reduzir_assimetria_nos_proximos_aportes") return "Rebalancear risco nos pr\xF3ximos aportes";
    if (codigo === "recompor_reserva_e_liquidez") return "Recompor reserva e liquidez imediata";
    if (codigo === "manter_estrategia_com_consistencia") return "Manter estrat\xE9gia com disciplina";
    if (codigo === "risco_incompativel_momento_vida") return "Adequar carteira ao momento de vida";
    return "Realinhar carteira ao objetivo";
  }
};

// ../modulos-backend/carteira/src/repositorio.ts
var RepositorioCarteiraD1 = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "RepositorioCarteiraD1");
  }
  mapCacheRow(row) {
    const payload = row.payload_json ? JSON.parse(row.payload_json) : null;
    const payloadObj = payload && typeof payload === "object" ? payload : null;
    const precoPayload = typeof payloadObj?.price === "number" ? payloadObj.price : null;
    const variacaoPayload = typeof payloadObj?.changePercent === "number" ? payloadObj.changePercent : null;
    return {
      precoAtual: row.preco_atual ?? precoPayload ?? null,
      variacaoPercentual: row.variacao_percentual ?? variacaoPayload ?? null,
      atualizadoEm: row.atualizado_em,
      expiraEm: row.expira_em,
      payload
    };
  }
  async listarAtivos(usuarioId) {
    const result = await this.db.prepare(
      [
        "SELECT id, ticker, nome, categoria, plataforma, quantidade, preco_medio, valor_atual, participacao, retorno_12m, ticker_canonico, cnpj_fundo",
        ", data_cadastro, data_aquisicao",
        "FROM ativos",
        "WHERE usuario_id = ?"
      ].join(" ")
    ).bind(usuarioId).all();
    return (result.results ?? []).map((row) => ({
      id: row.id,
      ticker: row.ticker ?? "",
      nome: row.nome ?? "",
      categoria: row.categoria,
      plataforma: row.plataforma ?? "",
      quantidade: row.quantidade ?? 1,
      precoMedio: row.preco_medio ?? 0,
      valorAtual: row.valor_atual ?? 0,
      participacao: row.participacao ?? 0,
      retorno12m: row.retorno_12m ?? 0,
      dataCadastro: row.data_cadastro ?? null,
      dataAquisicao: row.data_aquisicao ?? null,
      tickerCanonico: row.ticker_canonico ?? null,
      cnpjFundo: row.cnpj_fundo ?? null
    }));
  }
  async listarSnapshotsPatrimonio(usuarioId, limite) {
    const result = await this.db.prepare("SELECT data, valor_total FROM snapshots_patrimonio WHERE usuario_id = ? ORDER BY data DESC LIMIT ?").bind(usuarioId, limite).all();
    return (result.results ?? []).map((row) => ({ data: row.data, valorTotal: row.valor_total ?? 0 }));
  }
  async atualizarValorAtivo(ativoId, valorAtual, retorno12m) {
    await this.db.prepare("UPDATE ativos SET valor_atual = ?, retorno_12m = ? WHERE id = ?").bind(valorAtual, retorno12m, ativoId).run();
  }
  async lerCacheValido(fonte, chaveAtivo, referenciaIso) {
    const row = await this.db.prepare(
      [
        "SELECT preco_atual, variacao_percentual, payload_json, atualizado_em, expira_em",
        "FROM cotacoes_ativos_cache",
        "WHERE fonte = ? AND chave_ativo = ? AND expira_em > ?",
        "LIMIT 1"
      ].join(" ")
    ).bind(fonte, chaveAtivo, referenciaIso).first();
    if (!row) return null;
    return this.mapCacheRow(row);
  }
  async lerUltimoCache(fonte, chaveAtivo) {
    const row = await this.db.prepare(
      [
        "SELECT preco_atual, variacao_percentual, payload_json, atualizado_em, expira_em",
        "FROM cotacoes_ativos_cache",
        "WHERE fonte = ? AND chave_ativo = ?",
        "ORDER BY atualizado_em DESC",
        "LIMIT 1"
      ].join(" ")
    ).bind(fonte, chaveAtivo).first();
    if (!row) return null;
    return this.mapCacheRow(row);
  }
  async salvarCache(fonte, chaveAtivo, precoAtual, variacaoPercentual, payload, atualizadoEmIso, expiraEmIso, erro2) {
    await this.db.prepare(
      [
        "INSERT INTO cotacoes_ativos_cache",
        "(id, fonte, chave_ativo, preco_atual, variacao_percentual, payload_json, atualizado_em, expira_em, erro)",
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        "ON CONFLICT(fonte, chave_ativo) DO UPDATE SET",
        "preco_atual = excluded.preco_atual,",
        "variacao_percentual = excluded.variacao_percentual,",
        "payload_json = excluded.payload_json,",
        "atualizado_em = excluded.atualizado_em,",
        "expira_em = excluded.expira_em,",
        "erro = excluded.erro"
      ].join(" ")
    ).bind(
      crypto.randomUUID(),
      fonte,
      chaveAtivo,
      precoAtual,
      variacaoPercentual,
      JSON.stringify(payload ?? null),
      atualizadoEmIso,
      expiraEmIso,
      erro2
    ).run();
  }
};

// ../modulos-backend/carteira/src/servico.ts
var BOLSA_TTL_MIN = 10;
var FUNDOS_TTL_HOURS = 18;
var nowIso3 = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString(), "nowIso");
var toIsoOffset = /* @__PURE__ */ __name((mins) => new Date(Date.now() + mins * 6e4).toISOString(), "toIsoOffset");
var toIsoOffsetHours = /* @__PURE__ */ __name((hours) => new Date(Date.now() + hours * 36e5).toISOString(), "toIsoOffsetHours");
var normalizarCnpj2 = /* @__PURE__ */ __name((value) => value.replace(/\D/g, ""), "normalizarCnpj");
var dataIsoAnterior = /* @__PURE__ */ __name((dataRef) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataRef)) return null;
  const d = /* @__PURE__ */ new Date(`${dataRef}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}, "dataIsoAnterior");
var pareceTickerListado = /* @__PURE__ */ __name((ticker) => /^[A-Z]{4}\d{1,2}$/.test(ticker) || /^[A-Z]{5}\d{1,2}$/.test(ticker) || /^\^[A-Z0-9.]+$/.test(ticker), "pareceTickerListado");
var normalizarPrecoMedioUnitario = /* @__PURE__ */ __name((precoMedio, quantidade, valorAtual) => {
  if (!Number.isFinite(precoMedio) || precoMedio <= 0) {
    return { valor: 0, status: "inconsistente", motivo: "preco_medio_ausente_ou_invalido" };
  }
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    return { valor: precoMedio, status: "confiavel", motivo: "sem_quantidade_para_reconciliar" };
  }
  const totalEstimadoComUnitario = precoMedio * quantidade;
  const valorReferencia = Number.isFinite(valorAtual) && valorAtual > 0 ? valorAtual : totalEstimadoComUnitario;
  const referenciaUnitaria = valorReferencia / quantidade;
  const erroRelativoUnitario = Math.abs(totalEstimadoComUnitario - valorReferencia) / Math.max(1, valorReferencia);
  const erroRelativoTotal = Math.abs(precoMedio - valorReferencia) / Math.max(1, valorReferencia);
  if (erroRelativoUnitario <= 0.05) {
    return { valor: precoMedio, status: "confiavel" };
  }
  if (erroRelativoTotal <= 0.05) {
    return { valor: precoMedio / quantidade, status: "ajustado_heuristica", motivo: "preco_medio_recebido_como_total_investido" };
  }
  if (Number.isFinite(referenciaUnitaria) && referenciaUnitaria > 0) {
    const candidatos = [precoMedio, precoMedio / 10, precoMedio / 100, precoMedio / 1e3, precoMedio / 1e4];
    let melhor = precoMedio;
    let menorErro = Number.POSITIVE_INFINITY;
    for (const candidato of candidatos) {
      if (!Number.isFinite(candidato) || candidato <= 0) continue;
      const erro2 = Math.abs(candidato - referenciaUnitaria) / Math.max(1, referenciaUnitaria);
      if (erro2 < menorErro) {
        menorErro = erro2;
        melhor = candidato;
      }
    }
    if (menorErro <= 0.35) {
      return {
        valor: melhor,
        status: melhor === precoMedio ? "inconsistente" : "ajustado_heuristica",
        motivo: melhor === precoMedio ? "reconciliacao_falhou_mantido_valor_original" : "preco_medio_ajustado_por_ordem_de_grandeza"
      };
    }
  }
  return { valor: precoMedio, status: "inconsistente", motivo: "nao_reconciliavel_com_valor_atual" };
}, "normalizarPrecoMedioUnitario");
var ServicoCarteiraPadrao = class {
  constructor(deps) {
    this.deps = deps;
    this.fetchFn = deps.fetchFn ?? fetch;
    this.brapiToken = deps.brapiToken?.trim() || null;
    this.brapiBaseUrl = deps.brapiBaseUrl?.trim().replace(/\/+$/, "") || "https://brapi.dev/api";
  }
  static {
    __name(this, "ServicoCarteiraPadrao");
  }
  fetchFn;
  brapiToken;
  brapiBaseUrl;
  async listarAtivos(usuarioId) {
    const ativos = await this.deps.repositorio.listarAtivos(usuarioId);
    const atualizados = [];
    for (const ativo of ativos) {
      const meta = await this.obterAtualizacaoMercado(ativo);
      const resumo = this.mapComAtualizacao(ativo, meta);
      if (meta.precoAtual !== null) {
        await this.deps.repositorio.atualizarValorAtivo(ativo.id, resumo.valorAtual, resumo.ganhoPerdaPercentual ?? 0);
      }
      atualizados.push(resumo);
    }
    const total = atualizados.reduce((acc, item) => acc + item.valorAtual, 0);
    return atualizados.map((item) => ({
      ...item,
      participacao: total > 0 ? Number((item.valorAtual / total * 100).toFixed(2)) : 0
    })).sort((a, b) => b.valorAtual - a.valorAtual);
  }
  async obterResumo(usuarioId) {
    const ativos = await this.deps.repositorio.listarAtivos(usuarioId);
    let patrimonioTotal = 0;
    let custoTotalAcumulado = 0;
    let todosComBaseCusto = true;
    let houveInconsistencia = false;
    for (const ativo of ativos) {
      const meta = await this.obterAtualizacaoMercado(ativo);
      const normalizado = normalizarPrecoMedioUnitario(ativo.precoMedio, ativo.quantidade, ativo.valorAtual);
      if (normalizado.status === "inconsistente") houveInconsistencia = true;
      const precoMedioUnitario = normalizado.valor;
      const custoAquisicao = precoMedioUnitario * ativo.quantidade;
      let valorMercadoAtual;
      const usarVariacaoCota = meta.fonte === "cvm" && meta.precoAtual !== null && meta.cotaAquisicao != null && meta.cotaAquisicao > 0;
      if (usarVariacaoCota) {
        const retornoCota = (meta.precoAtual - meta.cotaAquisicao) / meta.cotaAquisicao;
        valorMercadoAtual = custoAquisicao * (1 + retornoCota);
      } else {
        const precoAtual = meta.precoAtual ?? (ativo.quantidade > 0 ? ativo.valorAtual / ativo.quantidade : 0);
        valorMercadoAtual = precoAtual * ativo.quantidade;
      }
      if (!(Number.isFinite(ativo.precoMedio) && ativo.precoMedio > 0)) {
        todosComBaseCusto = false;
      }
      patrimonioTotal += valorMercadoAtual;
      custoTotalAcumulado += custoAquisicao;
    }
    const retornoDisponivel = ativos.length > 0 && todosComBaseCusto && !houveInconsistencia;
    const retornoTotal = retornoDisponivel && custoTotalAcumulado > 0 ? (patrimonioTotal - custoTotalAcumulado) / custoTotalAcumulado * 100 : 0;
    const retornoArredondado = Number(retornoTotal.toFixed(2));
    const motivoIndisponivel = !retornoDisponivel ? houveInconsistencia ? "Pre\xE7o m\xE9dio de pelo menos um ativo \xE9 inconsistente \u2014 revise seus dados importados" : "Retorno indispon\xEDvel \u2014 importe seu hist\xF3rico para calcular" : void 0;
    return {
      patrimonioTotal: Number(patrimonioTotal.toFixed(2)),
      retornoDesdeAquisicao: retornoArredondado,
      retorno_desde_aquisicao: retornoArredondado,
      // Campo legado — mesmo valor de `retornoDesdeAquisicao`. Remover após migração do frontend.
      retorno12m: retornoArredondado,
      retornoDisponivel,
      motivoRetornoIndisponivel: motivoIndisponivel,
      // Score legado/deprecated — mantido por compat; consumidores devem usar scoreUnificado.
      score: patrimonioTotal > 0 ? Math.max(0, Math.min(100, Math.round(70 + retornoTotal / 2))) : 0,
      quantidadeAtivos: ativos.length
    };
  }
  async obterDetalhePorCategoria(usuarioId, categoria) {
    const ativos = await this.listarAtivos(usuarioId);
    const itens = ativos.filter((item) => item.categoria === categoria);
    const valorTotal = itens.reduce((acc, item) => acc + item.valorAtual, 0);
    const totalCarteira = ativos.reduce((acc, item) => acc + item.valorAtual, 0);
    return {
      categoria,
      valorTotal,
      participacao: totalCarteira > 0 ? Number((valorTotal / totalCarteira * 100).toFixed(2)) : 0,
      ativos: itens
    };
  }
  async obterComparativoBenchmark(usuarioId, periodoMeses) {
    const meses = Number.isFinite(periodoMeses) ? Math.max(3, Math.min(24, Math.floor(periodoMeses))) : 12;
    const snapshots = await this.deps.repositorio.listarSnapshotsPatrimonio(usuarioId, Math.max(meses, 12));
    const serieCarteira = [...snapshots].reverse().map((item) => ({ data: item.data, valor: item.valorTotal }));
    const baseCarteira = serieCarteira[0]?.valor ?? 0;
    const serieCarteiraNormalizada = serieCarteira.map((item) => ({
      data: item.data,
      carteira: baseCarteira > 0 ? Number((item.valor / baseCarteira * 100).toFixed(4)) : 100
    }));
    const comparativoCDI = await this.obterSerieCDI(meses);
    const datas = /* @__PURE__ */ new Set([
      ...serieCarteiraNormalizada.map((item) => item.data),
      ...comparativoCDI.serie.map((item) => item.data)
    ]);
    const carteiraMap = new Map(serieCarteiraNormalizada.map((item) => [item.data, item.carteira]));
    const cdiMap = new Map(comparativoCDI.serie.map((item) => [item.data, item.valor]));
    let lastCarteira = 100;
    let lastCDI = 100;
    const serie = Array.from(datas).sort((a, b) => a < b ? -1 : 1).map((data) => {
      const c = carteiraMap.get(data);
      if (typeof c === "number") lastCarteira = c;
      const d = cdiMap.get(data);
      if (typeof d === "number") lastCDI = d;
      return { data, carteira: Number(lastCarteira.toFixed(4)), cdi: Number(lastCDI.toFixed(4)) };
    });
    const ultimoCarteira = serie[serie.length - 1]?.carteira ?? 100;
    const ultimoCDI = serie[serie.length - 1]?.cdi ?? 100;
    const carteiraRetornoPeriodo = Number((ultimoCarteira - 100).toFixed(2));
    const cdiRetornoPeriodo = Number((ultimoCDI - 100).toFixed(2));
    return {
      periodoMeses: meses,
      carteiraRetornoPeriodo,
      cdiRetornoPeriodo,
      excessoRetorno: Number((carteiraRetornoPeriodo - cdiRetornoPeriodo).toFixed(2)),
      fonteBenchmark: comparativoCDI.fonte,
      statusAtualizacaoBenchmark: comparativoCDI.status,
      atualizadoEmBenchmark: comparativoCDI.atualizadoEm,
      serie
    };
  }
  async obterAtualizacaoMercado(ativo) {
    const tickerListado = (ativo.tickerCanonico || ativo.ticker)?.toUpperCase();
    const tickerComCaraDeBolsa = !!tickerListado && pareceTickerListado(tickerListado);
    const deveUsarBrapi = !!tickerListado && (ativo.categoria === "acao" || tickerComCaraDeBolsa || ativo.categoria === "fundo" && !(ativo.cnpjFundo && normalizarCnpj2(ativo.cnpjFundo).length > 0));
    if (deveUsarBrapi && tickerListado) {
      return this.obterCotacaoComCache("brapi", tickerListado);
    }
    if (ativo.categoria === "fundo" && ativo.cnpjFundo) {
      const meta = await this.obterCotacaoComCache("cvm", normalizarCnpj2(ativo.cnpjFundo));
      if (meta.precoAtual !== null && this.deps.provedorCotacaoFundos) {
        const dataAq = ativo.dataAquisicao ?? ativo.dataCadastro;
        if (dataAq) {
          try {
            const cotaAq = await this.deps.provedorCotacaoFundos.obterCotaMaisRecente(
              normalizarCnpj2(ativo.cnpjFundo),
              dataAq.slice(0, 10)
            );
            meta.cotaAquisicao = cotaAq?.vlQuota ?? null;
          } catch {
          }
        }
      }
      return meta;
    }
    return {
      fonte: "nenhuma",
      status: "indisponivel",
      precoAtual: null,
      variacaoPercentual: null,
      atualizadoEm: null
    };
  }
  mapComAtualizacao(ativo, meta) {
    const normalizado = normalizarPrecoMedioUnitario(ativo.precoMedio, ativo.quantidade, ativo.valorAtual);
    const precoMedioUnitario = normalizado.valor;
    const statusPrecoMedio = normalizado.status;
    const precoAtual = meta.precoAtual;
    const custoTotal = precoMedioUnitario * ativo.quantidade;
    let valorAtual;
    let ganhoPerdaPercentual;
    const usarVariacaoCota = meta.fonte === "cvm" && precoAtual !== null && meta.cotaAquisicao != null && meta.cotaAquisicao > 0;
    if (usarVariacaoCota) {
      const retornoCota = (precoAtual - meta.cotaAquisicao) / meta.cotaAquisicao;
      valorAtual = custoTotal * (1 + retornoCota);
      ganhoPerdaPercentual = retornoCota * 100;
    } else if (precoAtual !== null && meta.fonte !== "cvm") {
      valorAtual = precoAtual * ativo.quantidade;
      ganhoPerdaPercentual = custoTotal > 0 ? (valorAtual - custoTotal) / custoTotal * 100 : 0;
    } else {
      valorAtual = ativo.valorAtual;
      ganhoPerdaPercentual = custoTotal > 0 ? (valorAtual - custoTotal) / custoTotal * 100 : 0;
    }
    const ganhoPerda = valorAtual - custoTotal;
    return {
      id: ativo.id,
      ticker: ativo.ticker,
      nome: ativo.nome,
      categoria: ativo.categoria,
      plataforma: ativo.plataforma ?? "",
      quantidade: ativo.quantidade,
      precoMedio: Number(precoMedioUnitario.toFixed(8)),
      preco_medio: Number(precoMedioUnitario.toFixed(8)),
      precoAtual: precoAtual ?? void 0,
      variacaoPercentual: meta.variacaoPercentual ?? void 0,
      ganhoPerda,
      ganhoPerdaPercentual: Number(ganhoPerdaPercentual.toFixed(2)),
      ultimaAtualizacao: meta.atualizadoEm ?? void 0,
      fontePreco: meta.fonte,
      statusAtualizacao: meta.status,
      dataCadastro: ativo.dataCadastro ?? void 0,
      dataAquisicao: ativo.dataAquisicao ?? ativo.dataCadastro ?? void 0,
      valorAtual: Number(valorAtual.toFixed(2)),
      participacao: ativo.participacao ?? 0,
      retornoDesdeAquisicao: Number(ganhoPerdaPercentual.toFixed(2)),
      retorno_desde_aquisicao: Number(ganhoPerdaPercentual.toFixed(2)),
      // Campo legado — mesmo valor. Ver contrato para detalhes.
      retorno12m: Number(ganhoPerdaPercentual.toFixed(2)),
      statusPrecoMedio,
      status_preco_medio: statusPrecoMedio
    };
  }
  async obterCotacaoComCache(fonte, chaveAtivo) {
    const cacheKeyPrimaria = fonte === "brapi" ? `quote:${chaveAtivo.toUpperCase()}` : chaveAtivo;
    const cache = await this.deps.repositorio.lerCacheValido(fonte, cacheKeyPrimaria, nowIso3()) ?? (fonte === "brapi" ? await this.deps.repositorio.lerCacheValido(fonte, chaveAtivo, nowIso3()) : null);
    if (cache) {
      return {
        fonte,
        status: "atualizado",
        precoAtual: cache.precoAtual,
        variacaoPercentual: cache.variacaoPercentual,
        atualizadoEm: cache.atualizadoEm
      };
    }
    try {
      const resultado = fonte === "brapi" ? await this.buscarBrapi(chaveAtivo) : await this.buscarCvm(chaveAtivo);
      const atualizadoEm = nowIso3();
      const expiraEm = fonte === "brapi" ? toIsoOffset(BOLSA_TTL_MIN) : toIsoOffsetHours(FUNDOS_TTL_HOURS);
      await this.deps.repositorio.salvarCache(
        fonte,
        cacheKeyPrimaria,
        resultado.precoAtual,
        resultado.variacaoPercentual,
        resultado.payload,
        atualizadoEm,
        expiraEm,
        null
      );
      return {
        fonte,
        status: resultado.precoAtual !== null ? "atualizado" : "atrasado",
        precoAtual: resultado.precoAtual,
        variacaoPercentual: resultado.variacaoPercentual,
        atualizadoEm
      };
    } catch (error) {
      const fallback = await this.deps.repositorio.lerUltimoCache(fonte, cacheKeyPrimaria) ?? (fonte === "brapi" ? await this.deps.repositorio.lerUltimoCache(fonte, chaveAtivo) : null);
      await this.deps.repositorio.salvarCache(
        fonte,
        cacheKeyPrimaria,
        fallback?.precoAtual ?? null,
        fallback?.variacaoPercentual ?? null,
        fallback?.payload ?? null,
        nowIso3(),
        fonte === "brapi" ? toIsoOffset(2) : toIsoOffsetHours(2),
        error instanceof Error ? error.message : "ERRO_DESCONHECIDO"
      );
      if (fallback) {
        return {
          fonte,
          status: "atrasado",
          precoAtual: fallback.precoAtual,
          variacaoPercentual: fallback.variacaoPercentual,
          atualizadoEm: fallback.atualizadoEm
        };
      }
      return {
        fonte,
        status: "indisponivel",
        precoAtual: null,
        variacaoPercentual: null,
        atualizadoEm: null
      };
    }
  }
  async buscarBrapi(ticker) {
    const url = new URL(`${this.brapiBaseUrl}/quote/${encodeURIComponent(ticker)}`);
    if (this.brapiToken) url.searchParams.set("token", this.brapiToken);
    const response = await this.fetchFn(url.toString(), {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!response.ok) throw new Error(`BRAPI_HTTP_${response.status}`);
    const data = await response.json();
    const first = data.results?.[0];
    return {
      precoAtual: typeof first?.regularMarketPrice === "number" ? first.regularMarketPrice : null,
      variacaoPercentual: typeof first?.regularMarketChangePercent === "number" ? first.regularMarketChangePercent : null,
      payload: data
    };
  }
  /**
   * Busca a cota diária de um fundo via CVM.
   *
   * Estratégia em cascata:
   *  1) Provider D1 (cache populado pelo script offline de ingestão) — rápido,
   *     preferencial. Calcula variação pegando a cota do dia anterior disponível.
   *  2) Streaming direto ao CSV da CVM — fallback preservado para casos em que
   *     o provider não foi injetado ou o cache ainda não tem aquele CNPJ.
   *     Tênue por limites de CPU do Worker; será descontinuado em v2.
   */
  async buscarCvm(cnpj) {
    if (this.deps.provedorCotacaoFundos) {
      try {
        const atual = await this.deps.provedorCotacaoFundos.obterCotaMaisRecente(cnpj);
        if (atual) {
          const ateAnterior = dataIsoAnterior(atual.dataRef);
          const anterior = ateAnterior ? await this.deps.provedorCotacaoFundos.obterCotaMaisRecente(cnpj, ateAnterior) : null;
          const variacaoPercentual = anterior && anterior.vlQuota > 0 && anterior.dataRef !== atual.dataRef ? (atual.vlQuota - anterior.vlQuota) / anterior.vlQuota * 100 : null;
          return {
            precoAtual: atual.vlQuota,
            variacaoPercentual,
            payload: { cnpj: atual.cnpj, data: atual.dataRef, cota: atual.vlQuota, fonte: "cvm_d1" }
          };
        }
      } catch {
      }
    }
    const resultado = await this.buscarCotaCvmDiaria(cnpj);
    if (resultado !== null) return resultado;
    throw new Error("CVM_COTA_NAO_ENCONTRADA");
  }
  async buscarCotaCvmDiaria(cnpj) {
    const tentativas = this.gerarUrlsCvmDiaria();
    for (const url of tentativas) {
      try {
        const resultado = await this.lerCotaCvmStream(url, cnpj);
        if (resultado !== null) return resultado;
      } catch {
      }
    }
    return null;
  }
  /** Gera as URLs do arquivo CVM para o mês atual e o anterior. */
  gerarUrlsCvmDiaria() {
    const agora = /* @__PURE__ */ new Date();
    const urls = [];
    for (let delta = 0; delta <= 1; delta++) {
      const data = new Date(agora.getFullYear(), agora.getMonth() - delta, 1);
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      urls.push(`https://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO_FI/DADOS/inf_diario_fi_${ano}${mes}.csv`);
    }
    return urls;
  }
  /**
   * Lê o CSV CVM via streaming em chunks de texto, procurando o CNPJ sem
   * carregar o arquivo inteiro na memória. Retorna a cota mais recente ou null.
   */
  async lerCotaCvmStream(url, cnpj) {
    const response = await this.fetchFn(url, { method: "GET", headers: { accept: "text/plain" } });
    if (!response.ok) throw new Error(`CVM_DIARIO_HTTP_${response.status}`);
    if (!response.body) throw new Error("CVM_DIARIO_SEM_BODY");
    const reader = response.body.getReader();
    const decoder2 = new TextDecoder("latin1");
    let buffer = "";
    let cabecalho = null;
    let idxCnpj = -1;
    let idxData = -1;
    let idxCota = -1;
    let melhorData = "";
    let melhorCota = null;
    let cotaAnterior = null;
    const processarLinha = /* @__PURE__ */ __name((linha) => {
      if (!linha.trim()) return;
      const cols = linha.split(";");
      if (cabecalho === null) {
        cabecalho = cols.map((c) => c.replace(/"/g, "").trim().toUpperCase());
        idxCnpj = cabecalho.indexOf("CNPJ_FUNDO");
        idxData = cabecalho.indexOf("DT_COMPTC");
        idxCota = cabecalho.indexOf("VL_QUOTA");
        return;
      }
      if (idxCnpj < 0 || idxData < 0 || idxCota < 0) return;
      const cnpjLinha = normalizarCnpj2((cols[idxCnpj] ?? "").replace(/"/g, ""));
      if (cnpjLinha !== cnpj) return;
      const data = (cols[idxData] ?? "").trim();
      const cotaStr = (cols[idxCota] ?? "").replace(",", ".").trim();
      const cota = Number.parseFloat(cotaStr);
      if (!Number.isFinite(cota) || cota <= 0) return;
      if (data > melhorData) {
        cotaAnterior = melhorCota;
        melhorData = data;
        melhorCota = cota;
      }
    }, "processarLinha");
    const MAX_BYTES = 30 * 1024 * 1024;
    let totalBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        buffer += decoder2.decode(value, { stream: true });
        const linhas = buffer.split(/\r?\n/);
        buffer = linhas.pop() ?? "";
        for (const linha of linhas) processarLinha(linha);
        if (totalBytes >= MAX_BYTES) break;
      }
      if (buffer) processarLinha(buffer);
    } finally {
      reader.cancel().catch(() => void 0);
    }
    if (melhorCota === null) return null;
    const variacaoPercentual = cotaAnterior !== null && cotaAnterior > 0 ? (melhorCota - cotaAnterior) / cotaAnterior * 100 : null;
    return {
      precoAtual: melhorCota,
      variacaoPercentual,
      payload: { cnpj, data: melhorData, cota: melhorCota }
    };
  }
  async obterSerieCDI(periodoMeses) {
    const fim = /* @__PURE__ */ new Date();
    const inicio = /* @__PURE__ */ new Date();
    inicio.setMonth(fim.getMonth() - periodoMeses);
    const d2 = `${String(fim.getDate()).padStart(2, "0")}/${String(fim.getMonth() + 1).padStart(2, "0")}/${fim.getFullYear()}`;
    const d1 = `${String(inicio.getDate()).padStart(2, "0")}/${String(inicio.getMonth() + 1).padStart(2, "0")}/${inicio.getFullYear()}`;
    const parseBCBDate = /* @__PURE__ */ __name((value) => {
      const [day, month, year] = value.split("/");
      return `${year}-${month}-${day}`;
    }, "parseBCBDate");
    try {
      const response = await this.fetchFn(
        `https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados?formato=json&dataInicial=${encodeURIComponent(d1)}&dataFinal=${encodeURIComponent(d2)}`
      );
      if (!response.ok) throw new Error(`BCB_CDI_HTTP_${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("BCB_CDI_EMPTY");
      let acumulado = 100;
      const serie = data.map((item) => {
        const taxa = Number.parseFloat(String(item.valor).replace(",", "."));
        if (Number.isFinite(taxa)) acumulado *= 1 + taxa / 100;
        return { data: parseBCBDate(item.data), valor: Number(acumulado.toFixed(4)) };
      });
      return { serie, fonte: "bcb_sgs_4389", status: "atualizado", atualizadoEm: (/* @__PURE__ */ new Date()).toISOString() };
    } catch {
      try {
        const response = await this.fetchFn(
          `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${encodeURIComponent(d1)}&dataFinal=${encodeURIComponent(d2)}`
        );
        if (!response.ok) throw new Error(`BCB_SELIC_HTTP_${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("BCB_SELIC_EMPTY");
        let acumulado = 100;
        const serie = data.map((item) => {
          const taxa = Number.parseFloat(String(item.valor).replace(",", "."));
          if (Number.isFinite(taxa)) acumulado *= 1 + taxa / 100;
          return { data: parseBCBDate(item.data), valor: Number(acumulado.toFixed(4)) };
        });
        return { serie, fonte: "bcb_sgs_12_proxy", status: "atrasado", atualizadoEm: (/* @__PURE__ */ new Date()).toISOString() };
      } catch {
        return { serie: [], fonte: "indisponivel", status: "indisponivel", atualizadoEm: null };
      }
    }
  }
};

// ../modulos-backend/carteira/src/snapshot-consolidado.ts
var arredondarCentavos = /* @__PURE__ */ __name((valor) => Number(valor.toFixed(2)), "arredondarCentavos");
var arredondarPercentual2 = /* @__PURE__ */ __name((valor) => Number(valor.toFixed(4)), "arredondarPercentual");
function calcularSnapshotConsolidado(ativos, contexto) {
  const patrimonioInvestimentos = ativos.reduce(
    (acc, a) => acc + Number(a.valorAtual ?? 0),
    0
  );
  const imoveis = contexto?.patrimonioExterno?.imoveis ?? [];
  const veiculos = contexto?.patrimonioExterno?.veiculos ?? [];
  const patrimonioImoveis = imoveis.reduce(
    (acc, i) => acc + Math.max(0, Number(i.valorEstimado ?? 0) - Number(i.saldoFinanciamento ?? 0)),
    0
  );
  const patrimonioVeiculos = veiculos.reduce(
    (acc, v) => acc + Math.max(0, Number(v.valorEstimado ?? 0)),
    0
  );
  const patrimonioBens = patrimonioImoveis + patrimonioVeiculos;
  const patrimonioPoupanca = Number(
    contexto?.patrimonioExterno?.poupanca ?? contexto?.patrimonioExterno?.caixaDisponivel ?? 0
  );
  const patrimonioTotal = patrimonioInvestimentos + patrimonioBens + patrimonioPoupanca;
  const distribuicaoBase = [
    { id: "investimentos", label: "Investimentos", valor: patrimonioInvestimentos },
    { id: "bens", label: "Bens", valor: patrimonioBens },
    { id: "poupanca", label: "Poupan\xE7a", valor: patrimonioPoupanca }
  ].filter((item) => item.valor > 0);
  const distribuicaoPatrimonio = distribuicaoBase.map(
    (item) => ({
      ...item,
      percentual: patrimonioTotal > 0 ? arredondarPercentual2(item.valor / patrimonioTotal * 100) : 0
    })
  );
  const ativosConsolidados = ativos.map((a) => ({
    id: a.id,
    ticker: a.ticker ?? null,
    nome: a.nome,
    categoria: a.categoria,
    valorAtual: Number(a.valorAtual ?? 0),
    totalInvestido: Number((a.quantidade ?? 0) * (a.precoMedio ?? 0)),
    retorno12m: Number(a.retorno12m ?? 0),
    participacao: Number(a.participacao ?? 0)
  }));
  const payload = {
    ativos: ativosConsolidados,
    patrimonioInvestimentos: arredondarCentavos(patrimonioInvestimentos),
    patrimonioBens: arredondarCentavos(patrimonioBens),
    patrimonioPoupanca: arredondarCentavos(patrimonioPoupanca),
    patrimonioTotal: arredondarCentavos(patrimonioTotal),
    distribuicaoPatrimonio
  };
  const totalInvestido = ativos.reduce(
    (acc, a) => acc + Number((a.quantidade ?? 0) * (a.precoMedio ?? 0)),
    0
  );
  const retornoTotal = totalInvestido > 0 ? (patrimonioInvestimentos - totalInvestido) / totalInvestido * 100 : 0;
  return {
    payload,
    totalInvestido: arredondarCentavos(totalInvestido),
    totalAtual: arredondarCentavos(patrimonioInvestimentos),
    retornoTotal: arredondarPercentual2(retornoTotal)
  };
}
__name(calcularSnapshotConsolidado, "calcularSnapshotConsolidado");

// src/server/services/construir-servico-carteira.ts
function construirServicoCarteira(env) {
  return new ServicoCarteiraPadrao({
    repositorio: new RepositorioCarteiraD1(env.DB),
    brapiToken: env.BRAPI_TOKEN,
    brapiBaseUrl: env.BRAPI_BASE_URL,
    provedorCotacaoFundos: construirCvmFundosProvider(env)
  });
}
__name(construirServicoCarteira, "construirServicoCarteira");

// src/server/services/portfolio-view.service.ts
var PortfolioViewService = class {
  constructor(env) {
    this.env = env;
    this.carteiraService = construirServicoCarteira(env);
    this.perfilService = new ServicoPerfilPadrao(new RepositorioPerfilD1(env.DB));
    this.insightsService = new ServicoInsightsPadrao(new RepositorioInsightsD1(env.DB));
  }
  static {
    __name(this, "PortfolioViewService");
  }
  carteiraService;
  perfilService;
  insightsService;
  /**
   * Retorna o resumo consolidado da carteira.
   * Preferência: lê do snapshot. Fallback: calcula ao vivo (sem refresh de mercado).
   */
  async getResumo(userId) {
    const [snapshot, analytics] = await Promise.all([
      this.readSnapshot(userId),
      this.readAnalytics(userId)
    ]);
    if (snapshot) {
      const payload = JSON.parse(snapshot.payload_json);
      const overlaid = await this.overlayFreshQuotes(payload, userId);
      return {
        ...overlaid,
        score: analytics ? analytics.scoreGeral : null,
        _fonte: "snapshot",
        _calculadoEm: snapshot.calculado_em
      };
    }
    return this.computeResumoFallback(userId);
  }
  /**
   * Retorna os analytics (score, diagnóstico) do portfólio.
   * Preferência: lê do analytics. Fallback: calcula ao vivo.
   */
  async getAnalytics(userId) {
    const row = await this.readAnalyticsRow(userId);
    if (row) {
      return {
        ...JSON.parse(row.payload_json),
        _calculadoEm: row.calculado_em
      };
    }
    try {
      const resumo = await this.insightsService.gerarResumo(userId);
      return {
        scoreGeral: resumo.scoreDetalhado?.score ?? null,
        pilares: resumo.scoreDetalhado?.pilares ?? null,
        score: resumo.scoreDetalhado ?? null,
        diagnostico: resumo.diagnosticoLegado ?? null,
        riscoPrincipal: resumo.riscoPrincipal ?? null,
        acaoPrioritaria: resumo.acaoPrioritaria ?? null,
        retorno: resumo.retorno ?? null,
        classificacao: resumo.classificacao ?? null,
        diagnosticoFinal: resumo.diagnostico ?? null,
        insightPrincipal: resumo.diagnostico?.insightPrincipal ?? null,
        penalidadesAplicadas: resumo.penalidadesAplicadas ?? null,
        impactoDecisoesRecentes: resumo.impactoDecisoesRecentes ?? null,
        patrimonioConsolidado: resumo.patrimonioConsolidado ?? null,
        pesosScoreProprietario: resumo.pesosProprietarios ?? null
      };
    } catch {
      return null;
    }
  }
  // ─── Internals ────────────────────────────────────────────────────────────
  async readSnapshot(userId) {
    return this.env.DB.prepare("SELECT calculado_em, total_investido, total_atual, retorno_total, payload_json FROM portfolio_snapshots WHERE usuario_id = ? LIMIT 1").bind(userId).first();
  }
  async readAnalyticsRow(userId) {
    return this.env.DB.prepare("SELECT calculado_em, score_unificado, faixa, confianca, payload_json FROM portfolio_analytics WHERE usuario_id = ? LIMIT 1").bind(userId).first();
  }
  async readAnalytics(userId) {
    const row = await this.readAnalyticsRow(userId);
    if (!row) return null;
    return JSON.parse(row.payload_json);
  }
  /**
   * Faz overlay das cotações frescas no payload do snapshot.
   * Para cada ativo com ticker, lê cotacoes_ativos_cache e atualiza valorAtual.
   * Recalcula totais se alguma cotação foi atualizada.
   */
  async overlayFreshQuotes(payload, _userId) {
    const ativos = payload.ativos;
    if (!ativos || ativos.length === 0) return payload;
    const tickers = [...new Set(ativos.filter((a) => a.ticker).map((a) => a.ticker.toUpperCase()))];
    if (tickers.length === 0) return payload;
    const quoteResults = await Promise.all(
      tickers.map((ticker) => readCache(this.env.DB, "brapi", `quote:${ticker}`))
    );
    const quoteMap = /* @__PURE__ */ new Map();
    quoteResults.forEach((q) => {
      if (q && q.price !== null) quoteMap.set(q.ticker, q.price);
    });
    if (quoteMap.size === 0) return payload;
    let totalAtualAtualizado = 0;
    const ativosAtualizados = ativos.map((ativo) => {
      const ticker = ativo.ticker?.toUpperCase();
      const freshPrice = ticker ? quoteMap.get(ticker) : void 0;
      if (freshPrice === void 0) {
        totalAtualAtualizado += Number(ativo.valorAtual ?? 0);
        return ativo;
      }
      const quantidade = Number(ativo.quantidade ?? 0);
      const precoMedio = Number(ativo.precoMedio ?? 0);
      const novoValor = quantidade > 0 ? quantidade * freshPrice : freshPrice;
      const novoRetorno = precoMedio > 0 ? (freshPrice - precoMedio) / precoMedio * 100 : 0;
      totalAtualAtualizado += novoValor;
      const retornoFormatado = Number(novoRetorno.toFixed(4));
      return {
        ...ativo,
        valorAtual: Number(novoValor.toFixed(4)),
        retornoDesdeAquisicao: retornoFormatado,
        retorno_desde_aquisicao: retornoFormatado,
        // legado, mantido por compat
        retorno12m: retornoFormatado
      };
    });
    const patrimonioTotal = Number(payload.patrimonioTotal ?? 0);
    const deltaInvestimentos = totalAtualAtualizado - Number(payload.patrimonioInvestimentos ?? 0);
    const novoPatrimonioTotal = patrimonioTotal + deltaInvestimentos;
    return {
      ...payload,
      ativos: ativosAtualizados,
      patrimonioInvestimentos: Number(totalAtualAtualizado.toFixed(2)),
      patrimonioTotal: Number(novoPatrimonioTotal.toFixed(2))
    };
  }
  /**
   * Fallback síncrono: calcula o resumo sem snapshot (primeira vez ou após tabela vazia).
   * NÃO chama BRAPI — usa valores de ativos.valor_atual já no banco.
   */
  async computeResumoFallback(userId) {
    const [resumo, ativos, contexto] = await Promise.all([
      this.carteiraService.obterResumo(userId),
      this.carteiraService.listarAtivos(userId),
      this.perfilService.obterContextoFinanceiro(userId)
    ]);
    const ativosTyped = ativos;
    const patrimonioInvestimentos = ativosTyped.reduce((acc, a) => acc + Number(a.valorAtual ?? 0), 0);
    const imoveis = contexto?.patrimonioExterno?.imoveis ?? [];
    const veiculos = contexto?.patrimonioExterno?.veiculos ?? [];
    const patrimonioBens = imoveis.reduce((acc, i) => acc + Math.max(0, Number(i.valorEstimado ?? 0) - Number(i.saldoFinanciamento ?? 0)), 0) + veiculos.reduce((acc, v) => acc + Math.max(0, Number(v.valorEstimado ?? 0)), 0);
    const patrimonioPoupanca = Number(contexto?.patrimonioExterno?.poupanca ?? contexto?.patrimonioExterno?.caixaDisponivel ?? 0);
    const patrimonioTotal = patrimonioInvestimentos + patrimonioBens + patrimonioPoupanca;
    const distribuicaoBase = [
      { id: "investimentos", label: "Investimentos", valor: patrimonioInvestimentos },
      { id: "bens", label: "Bens", valor: patrimonioBens },
      { id: "poupanca", label: "Poupan\xE7a", valor: patrimonioPoupanca }
    ].filter((item) => item.valor > 0);
    const distribuicaoPatrimonio = distribuicaoBase.map((item) => ({
      ...item,
      percentual: patrimonioTotal > 0 ? Number((item.valor / patrimonioTotal * 100).toFixed(4)) : 0
    }));
    let score = null;
    try {
      const insightsScore = await this.insightsService.calcularScore(userId);
      score = insightsScore.score;
    } catch {
    }
    return {
      ...resumo,
      patrimonioTotal: Number(patrimonioTotal.toFixed(2)),
      patrimonioInvestimentos: Number(patrimonioInvestimentos.toFixed(2)),
      patrimonioBens: Number(patrimonioBens.toFixed(2)),
      patrimonioPoupanca: Number(patrimonioPoupanca.toFixed(2)),
      distribuicaoPatrimonio,
      score,
      _fonte: "live"
    };
  }
};

// src/server/services/unified-score.service.ts
var DISCLAIMER2 = "Este score \xE9 um indicador propriet\xE1rio baseado em liquidez, patrim\xF4nio, endividamento, investimentos e objetivos financeiros. Ele n\xE3o constitui aconselhamento financeiro, oferta de cr\xE9dito ou recomenda\xE7\xE3o profissional.";
var clamp2 = /* @__PURE__ */ __name((n, min, max) => Math.max(min, Math.min(max, n)), "clamp");
var scoreByRanges = /* @__PURE__ */ __name((value, ranges, fallback = 500) => {
  for (const r of ranges) {
    if (r.when(value)) return r.score;
  }
  return fallback;
}, "scoreByRanges");
var UnifiedScoreService = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "UnifiedScoreService");
  }
  async calculateForUser(userId) {
    const inputs = await this.loadUserInputs(userId);
    const result = await this.calculateFromInputs(inputs);
    await this.saveSnapshot(userId, result, inputs);
    return result;
  }
  async preview(payload) {
    const profile = payload.profile ?? {};
    const patrimony = payload.patrimony ?? {};
    const portfolio = payload.portfolio ?? {};
    const goals = payload.goals ?? {};
    const inputs = {
      monthlyIncome: Number(profile.monthlyIncome ?? 0),
      monthlyEssentialCost: Number(profile.monthlyEssentialCost ?? 0),
      monthlyDebtPayment: Number(profile.monthlyDebtPayment ?? 0),
      patrimonyGross: Number(patrimony.patrimonyGross ?? 0),
      patrimonyNet: Number(patrimony.patrimonyNet ?? 0),
      liquidAssets: Number(patrimony.liquidAssets ?? 0),
      illiquidAssets: Number(patrimony.illiquidAssets ?? 0),
      investedAssets: Number(patrimony.investedAssets ?? 0),
      totalDebt: Number(patrimony.totalDebt ?? 0),
      largestClassRatio: typeof patrimony.concentrationLargestClassRatio === "number" ? Number(patrimony.concentrationLargestClassRatio) : null,
      investmentDiversificationRatio: typeof portfolio.investmentDiversificationRatio === "number" ? Number(portfolio.investmentDiversificationRatio) : null,
      listedLargestTickerRatio: typeof portfolio.listedLargestTickerRatio === "number" ? Number(portfolio.listedLargestTickerRatio) : null,
      goalCoverageRatio: typeof goals.goalCoverageRatio === "number" ? Number(goals.goalCoverageRatio) : null,
      marketUpdatedAt: typeof portfolio.marketUpdatedAt === "string" ? String(portfolio.marketUpdatedAt) : null,
      scoreHistory: null
      // preview não tem histórico real
    };
    return this.calculateFromInputs(inputs);
  }
  async getHistory(userId) {
    const rows = await this.db.prepare("SELECT score, faixa, criado_em FROM snapshots_score_unificado WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 50").bind(userId).all();
    return (rows.results || []).map((item) => ({ score: item.score, band: item.faixa, createdAt: item.criado_em }));
  }
  async loadModelConfig() {
    const defaults = {
      pillarWeights: { liquidity: 0.25, financial_health: 0.25, patrimonial_structure: 0.2, investment_behavior: 0.15, efficiency_evolution: 0.15 },
      ranges: { criticalMax: 299, fragileMax: 499, stableMax: 699, goodMax: 849 }
    };
    const row = await this.db.prepare("SELECT valor_json FROM configuracoes_produto WHERE chave = 'score.v1' LIMIT 1").first();
    if (!row?.valor_json) return defaults;
    try {
      const parsed = JSON.parse(row.valor_json);
      return {
        pillarWeights: { ...defaults.pillarWeights, ...parsed.unifiedModel?.pillarWeights ?? {} },
        ranges: { ...defaults.ranges, ...parsed.unifiedModel?.ranges ?? {} }
      };
    } catch {
      return defaults;
    }
  }
  async calculateFromInputs(inputs) {
    const modelConfig = await this.loadModelConfig();
    const calculatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const completenessStatus = this.getCompletenessStatus(inputs);
    const isEmpty = completenessStatus === "empty";
    const isPartial = completenessStatus === "partial";
    if (isEmpty) {
      return {
        score: 0,
        band: "critical",
        completenessStatus: "empty",
        pillars: [],
        insights: [],
        breakdown: {
          patrimonyGross: inputs.patrimonyGross,
          patrimonyNet: inputs.patrimonyNet,
          liquidAssets: inputs.liquidAssets,
          illiquidAssets: inputs.illiquidAssets,
          investedAssets: inputs.investedAssets,
          totalDebt: inputs.totalDebt,
          monthlyIncome: inputs.monthlyIncome,
          monthlyEssentialCost: inputs.monthlyEssentialCost,
          monthlyDebtPayment: inputs.monthlyDebtPayment,
          emergencyReserveMonths: null,
          debtToIncomeRatio: null,
          debtToPatrimonyRatio: null,
          liquidityRatio: null,
          concentrationLargestClassRatio: inputs.largestClassRatio,
          investmentDiversificationRatio: inputs.investmentDiversificationRatio,
          marketUpdatedAt: inputs.marketUpdatedAt,
          sessionUpdatedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        disclaimer: DISCLAIMER2,
        calculatedAt
      };
    }
    const emergencyReserveMonths = inputs.monthlyEssentialCost > 0 ? inputs.liquidAssets / inputs.monthlyEssentialCost : null;
    const debtToIncomeRatio = inputs.monthlyIncome > 0 ? inputs.totalDebt / (inputs.monthlyIncome * 12) : null;
    const debtToPatrimonyRatio = inputs.patrimonyGross > 0 ? inputs.totalDebt / inputs.patrimonyGross : null;
    const debtServiceRatio = inputs.monthlyIncome > 0 ? inputs.monthlyDebtPayment / inputs.monthlyIncome : null;
    const liquidityRatio = inputs.patrimonyGross > 0 ? inputs.liquidAssets / inputs.patrimonyGross : null;
    const freeCashCapacity = inputs.monthlyIncome - inputs.monthlyEssentialCost - inputs.monthlyDebtPayment;
    const freeCashCapacityRatio = inputs.monthlyIncome > 0 ? freeCashCapacity / inputs.monthlyIncome : null;
    const liquidVsIlliquidRatio = inputs.illiquidAssets > 0 ? inputs.liquidAssets / inputs.illiquidAssets : inputs.liquidAssets > 0 ? 1 : 0;
    const investedPatrimonyRatio = inputs.patrimonyGross > 0 ? inputs.investedAssets / inputs.patrimonyGross : 0;
    const reserveScore = scoreByRanges(
      emergencyReserveMonths,
      [
        { when: /* @__PURE__ */ __name((v) => v === null, "when"), score: 400 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) < 1, "when"), score: 50 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) < 3, "when"), score: 250 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) < 6, "when"), score: 600 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) < 12, "when"), score: 850 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) >= 12, "when"), score: 1e3 }
      ]
    );
    const liquidityRatioScore = scoreByRanges(
      liquidityRatio,
      [
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.05, "when"), score: 100 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.15, "when"), score: 300 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.3, "when"), score: 550 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.5, "when"), score: 800 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 0.5, "when"), score: 1e3 }
      ],
      100
    );
    const freeCashScore = scoreByRanges(
      freeCashCapacityRatio,
      [
        { when: /* @__PURE__ */ __name((_v) => inputs.monthlyIncome <= 0, "when"), score: 100 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0, "when"), score: 50 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.05, "when"), score: 250 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.15, "when"), score: 500 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.3, "when"), score: 800 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 0.3, "when"), score: 1e3 }
      ],
      100
    );
    const liquidityScore = Math.round(reserveScore * 0.45 + liquidityRatioScore * 0.35 + freeCashScore * 0.2);
    const debtToIncomeScore = scoreByRanges(
      debtToIncomeRatio,
      [
        { when: /* @__PURE__ */ __name((_v) => inputs.monthlyIncome <= 0, "when"), score: 50 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) > 2, "when"), score: 50 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) > 1.2, "when"), score: 250 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) > 0.6, "when"), score: 500 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) > 0.2, "when"), score: 800 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) <= 0.2, "when"), score: 1e3 }
      ],
      50
    );
    const debtToPatrimonyScore = scoreByRanges(
      debtToPatrimonyRatio,
      [
        { when: /* @__PURE__ */ __name((_v) => inputs.patrimonyGross <= 0, "when"), score: 50 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) > 0.8, "when"), score: 50 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) > 0.5, "when"), score: 250 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) > 0.3, "when"), score: 500 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) > 0.1, "when"), score: 800 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) <= 0.1, "when"), score: 1e3 }
      ],
      50
    );
    const debtServiceScore = scoreByRanges(
      debtServiceRatio,
      [
        { when: /* @__PURE__ */ __name((_v) => inputs.monthlyIncome <= 0, "when"), score: 50 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) > 0.5, "when"), score: 50 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) > 0.35, "when"), score: 250 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) > 0.2, "when"), score: 500 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) > 0.1, "when"), score: 800 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 9) <= 0.1, "when"), score: 1e3 }
      ],
      50
    );
    const financialHealthScore = Math.round(debtToIncomeScore * 0.35 + debtToPatrimonyScore * 0.35 + debtServiceScore * 0.3);
    const patrimonyNetAbsoluteScore = scoreByRanges(
      inputs.patrimonyNet,
      [
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0, "when"), score: 50 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 2e4, "when"), score: 200 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 1e5, "when"), score: 450 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 3e5, "when"), score: 650 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 1e6, "when"), score: 850 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 1e6, "when"), score: 1e3 }
      ]
    );
    const concentrationLargestClassScore = scoreByRanges(
      inputs.largestClassRatio,
      [
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 0.8, "when"), score: 100 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 0.65, "when"), score: 300 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 0.5, "when"), score: 550 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 0.35, "when"), score: 800 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.35, "when"), score: 1e3 }
      ],
      500
    );
    const liquidVsIlliquidBalanceScore = scoreByRanges(
      liquidVsIlliquidRatio,
      [
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.05, "when"), score: 50 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.15, "when"), score: 250 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.3, "when"), score: 450 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.6, "when"), score: 700 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 0.6, "when"), score: 1e3 }
      ],
      500
    );
    const patrimonialStructureScore = Math.round(
      patrimonyNetAbsoluteScore * 0.3 + concentrationLargestClassScore * 0.35 + liquidVsIlliquidBalanceScore * 0.35
    );
    const investedPatrimonyRatioScore = scoreByRanges(
      investedPatrimonyRatio,
      [
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.01, "when"), score: 100 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.05, "when"), score: 300 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.15, "when"), score: 550 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.35, "when"), score: 800 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 0.35, "when"), score: 1e3 }
      ],
      100
    );
    const investmentDiversificationScore = scoreByRanges(
      inputs.investmentDiversificationRatio,
      [
        { when: /* @__PURE__ */ __name((v) => v === null, "when"), score: 500 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0, "when"), score: 50 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.25, "when"), score: 300 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.5, "when"), score: 600 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.75, "when"), score: 800 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 0.75, "when"), score: 1e3 }
      ],
      500
    );
    const listedAssetsDisciplineScore = scoreByRanges(
      inputs.listedLargestTickerRatio,
      [
        { when: /* @__PURE__ */ __name((v) => v === null, "when"), score: 500 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 0.7, "when"), score: 200 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 0.5, "when"), score: 450 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 0.3, "when"), score: 700 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.3, "when"), score: 1e3 }
      ],
      500
    );
    const investmentBehaviorScore = Math.round(
      investedPatrimonyRatioScore * 0.35 + investmentDiversificationScore * 0.4 + listedAssetsDisciplineScore * 0.25
    );
    const patrimonyTrendScore = (() => {
      const hist = inputs.scoreHistory;
      if (!hist || hist.length < 2) return 500;
      const mais_recente = hist[0];
      const referencia = hist[hist.length - 1];
      const delta = mais_recente - referencia;
      const deltaPct = referencia > 0 ? delta / referencia : 0;
      if (deltaPct > 0.1) return 1e3;
      if (deltaPct > 0.04) return 850;
      if (deltaPct > 0) return 700;
      if (deltaPct === 0) return 500;
      if (deltaPct > -0.05) return 350;
      if (deltaPct > -0.1) return 200;
      return 50;
    })();
    const savingsProgressScore = scoreByRanges(
      freeCashCapacityRatio,
      [
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0, "when"), score: 100 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.05, "when"), score: 300 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.15, "when"), score: 550 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.3, "when"), score: 800 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 0.3, "when"), score: 1e3 }
      ],
      500
    );
    const goalAlignmentScore = scoreByRanges(
      inputs.goalCoverageRatio,
      [
        { when: /* @__PURE__ */ __name((v) => v === null, "when"), score: 500 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.25, "when"), score: 100 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.5, "when"), score: 300 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 0.8, "when"), score: 600 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) <= 1, "when"), score: 850 },
        { when: /* @__PURE__ */ __name((v) => (v ?? 0) > 1, "when"), score: 1e3 }
      ],
      500
    );
    const efficiencyEvolutionScore = Math.round(patrimonyTrendScore * 0.35 + savingsProgressScore * 0.35 + goalAlignmentScore * 0.3);
    const pillars = [
      {
        id: "liquidity",
        name: "Liquidez",
        score: liquidityScore,
        weightedContribution: liquidityScore * modelConfig.pillarWeights.liquidity,
        reasons: [`Reserva: ${reserveScore}`, `Liquidez patrimonial: ${liquidityRatioScore}`]
      },
      {
        id: "financial_health",
        name: "Sa\xFAde Financeira",
        score: financialHealthScore,
        weightedContribution: financialHealthScore * modelConfig.pillarWeights.financial_health,
        reasons: [`D\xEDvida/renda: ${debtToIncomeScore}`, `D\xEDvida/patrim\xF4nio: ${debtToPatrimonyScore}`]
      },
      {
        id: "patrimonial_structure",
        name: "Estrutura Patrimonial",
        score: patrimonialStructureScore,
        weightedContribution: patrimonialStructureScore * modelConfig.pillarWeights.patrimonial_structure,
        reasons: [`Concentra\xE7\xE3o classe: ${concentrationLargestClassScore}`, `Liquidez vs iliquidez: ${liquidVsIlliquidBalanceScore}`]
      },
      {
        id: "investment_behavior",
        name: "Comportamento de Investimento",
        score: investmentBehaviorScore,
        weightedContribution: investmentBehaviorScore * modelConfig.pillarWeights.investment_behavior,
        reasons: [`% investido: ${investedPatrimonyRatioScore}`, `Diversifica\xE7\xE3o: ${investmentDiversificationScore}`]
      },
      {
        id: "efficiency_evolution",
        name: "Efici\xEAncia e Evolu\xE7\xE3o",
        score: efficiencyEvolutionScore,
        weightedContribution: efficiencyEvolutionScore * modelConfig.pillarWeights.efficiency_evolution,
        reasons: [`Progresso de poupan\xE7a: ${savingsProgressScore}`, `Alinhamento objetivos: ${goalAlignmentScore}`]
      }
    ];
    const rawScore = pillars.reduce((acc, p) => acc + p.weightedContribution, 0);
    const partialPenalty = isPartial ? 0.85 : 1;
    const score = clamp2(Math.round(rawScore * partialPenalty), 0, 1e3);
    const band = score <= modelConfig.ranges.criticalMax ? "critical" : score <= modelConfig.ranges.fragileMax ? "fragile" : score <= modelConfig.ranges.stableMax ? "stable" : score <= modelConfig.ranges.goodMax ? "good" : "strong";
    const insights = this.generateInsights({
      emergencyReserveMonths,
      debtServiceRatio,
      largestClassRatio: inputs.largestClassRatio,
      investmentDiversificationScore,
      goalCoverageRatio: inputs.goalCoverageRatio,
      liquidityRatio,
      score
    });
    if (isPartial) {
      insights.unshift({
        type: "warning",
        title: "Leitura parcial",
        message: "O score foi calculado com dados incompletos e est\xE1 em modo conservador."
      });
    }
    return {
      score,
      band,
      completenessStatus,
      pillars,
      insights,
      breakdown: {
        patrimonyGross: inputs.patrimonyGross,
        patrimonyNet: inputs.patrimonyNet,
        liquidAssets: inputs.liquidAssets,
        illiquidAssets: inputs.illiquidAssets,
        investedAssets: inputs.investedAssets,
        totalDebt: inputs.totalDebt,
        monthlyIncome: inputs.monthlyIncome,
        monthlyEssentialCost: inputs.monthlyEssentialCost,
        monthlyDebtPayment: inputs.monthlyDebtPayment,
        emergencyReserveMonths,
        debtToIncomeRatio,
        debtToPatrimonyRatio,
        liquidityRatio,
        concentrationLargestClassRatio: inputs.largestClassRatio,
        investmentDiversificationRatio: inputs.investmentDiversificationRatio,
        marketUpdatedAt: inputs.marketUpdatedAt,
        sessionUpdatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      disclaimer: DISCLAIMER2,
      calculatedAt
    };
  }
  generateInsights(args) {
    const insights = [];
    const reservaMeses = args.emergencyReserveMonths;
    if ((reservaMeses ?? 0) < 1) {
      insights.push({
        type: "risk",
        title: "Reserva de emerg\xEAncia ausente",
        message: `Voc\xEA n\xE3o tem liquidez para cobrir nem 1 m\xEAs de gastos essenciais. Construir uma reserva de 3 a 6 meses \xE9 a corre\xE7\xE3o de maior impacto que voc\xEA pode fazer agora \u2014 pode adicionar at\xE9 250 pontos ao pilar de Liquidez.`
      });
    } else if ((reservaMeses ?? 0) < 3) {
      insights.push({
        type: "risk",
        title: "Reserva de emerg\xEAncia insuficiente",
        message: `Sua liquidez cobre ${reservaMeses?.toFixed(1)} m\xEAs de gastos essenciais. O recomendado \xE9 3 a 6 meses. Aumentar a reserva pode adicionar at\xE9 150 pontos ao pilar de Liquidez.`
      });
    } else if ((reservaMeses ?? 0) < 6) {
      insights.push({
        type: "warning",
        title: "Reserva de emerg\xEAncia parcial",
        message: `Sua reserva cobre ${reservaMeses?.toFixed(1)} meses. Chegar a 6 meses \xE9 o pr\xF3ximo n\xEDvel e pode adicionar at\xE9 80 pontos ao pilar de Liquidez.`
      });
    }
    if ((args.debtServiceRatio ?? 0) > 0.5) {
      insights.push({
        type: "risk",
        title: "Comprometimento cr\xEDtico da renda com d\xEDvidas",
        message: `Mais de 50% da sua renda mensal vai para pagamento de d\xEDvidas. Isso deixa pouca margem para emerg\xEAncias e aportes. Reduzir esse \xEDndice abaixo de 35% pode adicionar at\xE9 250 pontos ao pilar de Sa\xFAde Financeira.`
      });
    } else if ((args.debtServiceRatio ?? 0) > 0.35) {
      insights.push({
        type: "warning",
        title: "Comprometimento alto da renda com d\xEDvidas",
        message: `${Math.round((args.debtServiceRatio ?? 0) * 100)}% da renda mensal est\xE1 comprometida com parcelas. O ideal \xE9 manter abaixo de 20%. Reduzir esse \xEDndice pode adicionar at\xE9 150 pontos ao pilar de Sa\xFAde Financeira.`
      });
    }
    if ((args.largestClassRatio ?? 0) > 0.8) {
      insights.push({
        type: "risk",
        title: "Concentra\xE7\xE3o extrema em uma classe de ativos",
        message: `Mais de 80% do patrim\xF4nio est\xE1 em uma \xFAnica categoria. Um evento adverso nessa classe pode comprometer a maior parte do seu patrim\xF4nio. Diversificar pode adicionar at\xE9 200 pontos ao pilar de Estrutura Patrimonial.`
      });
    } else if ((args.largestClassRatio ?? 0) > 0.65) {
      insights.push({
        type: "warning",
        title: "Patrim\xF4nio concentrado em uma classe de ativos",
        message: `${Math.round((args.largestClassRatio ?? 0) * 100)}% do patrim\xF4nio est\xE1 em uma \xFAnica categoria. Distribuir por pelo menos 3 classes pode adicionar at\xE9 100 pontos ao pilar de Estrutura Patrimonial.`
      });
    }
    if (args.investmentDiversificationScore >= 800) {
      insights.push({
        type: "positive",
        title: "Boa diversifica\xE7\xE3o entre classes",
        message: "Seus investimentos est\xE3o distribu\xEDdos por m\xFAltiplas classes de ativos \u2014 isso reduz o risco de concentra\xE7\xE3o e contribui positivamente para o seu score."
      });
    }
    if ((args.goalCoverageRatio ?? 1) < 0.25) {
      insights.push({
        type: "opportunity",
        title: "Objetivos financeiros muito defasados",
        message: "O fluxo mensal dispon\xEDvel cobre menos de 25% do necess\xE1rio para seus objetivos. Revisar metas ou aumentar o aporte mensal pode adicionar at\xE9 150 pontos ao pilar de Efici\xEAncia e Evolu\xE7\xE3o."
      });
    } else if ((args.goalCoverageRatio ?? 1) < 0.5) {
      insights.push({
        type: "opportunity",
        title: "Objetivos subfinanciados",
        message: "Seu fluxo mensal cobre menos da metade do que seria necess\xE1rio para seus objetivos. Pequenos ajustes no aporte ou nos gastos podem melhorar significativamente esse \xEDndice."
      });
    }
    if ((args.liquidityRatio ?? 0) > 0.35 && insights.filter((i) => i.type === "positive").length === 0) {
      insights.push({
        type: "positive",
        title: "Liquidez patrimonial saud\xE1vel",
        message: "Mais de 35% do seu patrim\xF4nio est\xE1 em ativos de f\xE1cil convers\xE3o em dinheiro. Isso lhe d\xE1 capacidade de resposta a imprevistos sem precisar vender investimentos de longo prazo."
      });
    }
    if (insights.length < 2) {
      insights.push({
        type: args.score >= 700 ? "positive" : "warning",
        title: args.score >= 700 ? "Estrutura financeira s\xF3lida" : "Estrutura financeira exige aten\xE7\xE3o",
        message: args.score >= 700 ? "Seu score indica base patrimonial funcional. Continue com a disciplina de aportes e revis\xE3o peri\xF3dica da carteira." : `Seu score est\xE1 em ${args.score}/1000. As corre\xE7\xF5es de maior impacto est\xE3o nos pilares com menor pontua\xE7\xE3o \u2014 Liquidez e Sa\xFAde Financeira costumam ser os mais alavancados.`
      });
    }
    return insights.slice(0, 6);
  }
  getCompletenessStatus(inputs) {
    const relevantSignals = [
      inputs.monthlyIncome > 0,
      inputs.monthlyEssentialCost > 0,
      inputs.patrimonyGross > 0 || inputs.totalDebt > 0,
      inputs.investedAssets > 0,
      inputs.goalCoverageRatio !== null,
      inputs.largestClassRatio !== null
    ];
    const count = relevantSignals.filter(Boolean).length;
    if (count === 0) return "empty";
    if (count < 4) return "partial";
    return "complete";
  }
  async loadUserInputs(userId) {
    const [perfil, contexto, ativos, scoreHistoryRows] = await Promise.all([
      this.db.prepare("SELECT renda_mensal, gasto_mensal, aporte_mensal, reserva_caixa FROM perfil_financeiro WHERE usuario_id = ? LIMIT 1").bind(userId).first(),
      this.db.prepare("SELECT contexto_json, atualizado_em FROM perfil_contexto_financeiro WHERE usuario_id = ? LIMIT 1").bind(userId).first(),
      this.db.prepare("SELECT ticker, categoria, valor_atual FROM ativos WHERE usuario_id = ?").bind(userId).all(),
      this.db.prepare("SELECT score FROM snapshots_score_unificado WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 5").bind(userId).all().catch(() => ({ results: [] }))
    ]);
    const ativosRows = ativos.results || [];
    const investedAssets = ativosRows.reduce((acc, item) => acc + Number(item.valor_atual ?? 0), 0);
    const classMap = /* @__PURE__ */ new Map();
    ativosRows.forEach((item) => {
      const cat = item.categoria || "outros";
      classMap.set(cat, (classMap.get(cat) || 0) + Number(item.valor_atual ?? 0));
    });
    const listedTickerMap = /* @__PURE__ */ new Map();
    ativosRows.filter((item) => item.ticker && String(item.ticker).trim().length > 0).forEach((item) => listedTickerMap.set(String(item.ticker).toUpperCase(), (listedTickerMap.get(String(item.ticker).toUpperCase()) || 0) + Number(item.valor_atual ?? 0)));
    let imoveis = 0;
    let veiculos = 0;
    let caixaContexto = 0;
    let totalDebt = 0;
    let monthlyDebtPayment = 0;
    if (contexto?.contexto_json) {
      try {
        const parsed = JSON.parse(contexto.contexto_json);
        const imoveisBruto = (parsed.patrimonioExterno?.imoveis || []).reduce((acc, item) => acc + Number(item.valorEstimado ?? 0), 0);
        const saldoImoveis = (parsed.patrimonioExterno?.imoveis || []).reduce((acc, item) => acc + Number(item.saldoFinanciamento ?? 0), 0);
        imoveis = Math.max(0, imoveisBruto - saldoImoveis);
        veiculos = (parsed.patrimonioExterno?.veiculos || []).reduce((acc, item) => acc + Number(item.valorEstimado ?? 0), 0);
        caixaContexto = Number(parsed.patrimonioExterno?.caixaDisponivel ?? 0);
        totalDebt += saldoImoveis;
        totalDebt += (parsed.dividas || []).reduce((acc, item) => acc + Number(item.saldoDevedor ?? 0), 0);
        monthlyDebtPayment += (parsed.dividas || []).reduce((acc, item) => acc + Number(item.parcelaMensal ?? 0), 0);
      } catch {
      }
    }
    const caixa = Math.max(Number(perfil?.reserva_caixa ?? 0), caixaContexto);
    const patrimonyGross = investedAssets + imoveis + veiculos + caixa;
    const patrimonyNet = patrimonyGross - totalDebt;
    const liquidAssets = investedAssets + caixa;
    const illiquidAssets = imoveis + veiculos;
    const largestClassRatio = patrimonyGross > 0 ? Math.max(investedAssets, imoveis, veiculos, caixa) / patrimonyGross : null;
    const investmentDiversificationRatio = classMap.size > 0 ? Math.min(1, classMap.size / 4) : 0;
    const listedLargestTickerRatio = investedAssets > 0 && listedTickerMap.size > 0 ? Math.max(...Array.from(listedTickerMap.values())) / investedAssets : null;
    const monthlyIncome = Number(perfil?.renda_mensal ?? 0);
    const monthlyEssentialCost = Number(perfil?.gasto_mensal ?? 0);
    const goalCoverageRatio = Number(perfil?.aporte_mensal ?? 0) > 0 ? (monthlyIncome - monthlyEssentialCost - monthlyDebtPayment) / Number(perfil?.aporte_mensal ?? 1) : null;
    const scoreHistory = (scoreHistoryRows.results ?? []).length > 0 ? (scoreHistoryRows.results ?? []).map((r) => r.score) : null;
    return {
      monthlyIncome,
      monthlyEssentialCost,
      monthlyDebtPayment,
      patrimonyGross,
      patrimonyNet,
      liquidAssets,
      illiquidAssets,
      investedAssets,
      totalDebt,
      largestClassRatio,
      investmentDiversificationRatio,
      listedLargestTickerRatio,
      goalCoverageRatio,
      marketUpdatedAt: contexto?.atualizado_em ?? null,
      scoreHistory
    };
  }
  async saveSnapshot(userId, result, inputs) {
    await this.db.prepare(
      [
        "INSERT INTO snapshots_score_unificado",
        "(id, usuario_id, score, faixa, pilares_json, patrimonio_bruto, patrimonio_liquido, divida_total, ativos_liquidos, inputs_resumo_json, criado_em)",
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ].join(" ")
    ).bind(
      crypto.randomUUID(),
      userId,
      result.score,
      result.band,
      JSON.stringify(result.pillars),
      inputs.patrimonyGross,
      inputs.patrimonyNet,
      inputs.totalDebt,
      inputs.liquidAssets,
      JSON.stringify({
        monthlyIncome: inputs.monthlyIncome,
        monthlyEssentialCost: inputs.monthlyEssentialCost,
        monthlyDebtPayment: inputs.monthlyDebtPayment,
        investmentDiversificationRatio: inputs.investmentDiversificationRatio,
        listedLargestTickerRatio: inputs.listedLargestTickerRatio,
        goalCoverageRatio: inputs.goalCoverageRatio
      }),
      (/* @__PURE__ */ new Date()).toISOString()
    ).run();
  }
};

// src/server/services/benchmark.service.ts
var BenchmarkService = class {
  static {
    __name(this, "BenchmarkService");
  }
  /**
   * Retorno acumulado do CDI entre `dataInicioIso` e hoje, em percentual.
   * Usa a série diária SGS 4389 do BCB. Retorna 0 quando indisponível.
   */
  async cdiReturnSince(dataInicioIso) {
    const inicio = new Date(dataInicioIso);
    if (Number.isNaN(inicio.getTime())) return 0;
    const fim = /* @__PURE__ */ new Date();
    const fmt = /* @__PURE__ */ __name((d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`, "fmt");
    const response = await fetch(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados?formato=json&dataInicial=${encodeURIComponent(fmt(inicio))}&dataFinal=${encodeURIComponent(fmt(fim))}`
    );
    if (!response.ok) return 0;
    const series = await response.json();
    if (!Array.isArray(series) || series.length === 0) return 0;
    let acumulado = 1;
    for (const ponto of series) {
      const taxa = Number.parseFloat(String(ponto.valor).replace(",", "."));
      if (Number.isFinite(taxa)) acumulado *= 1 + taxa / 100;
    }
    return Number(((acumulado - 1) * 100).toFixed(2));
  }
};

// src/server/jobs/market-refresh.job.ts
function buildMarketService(env) {
  const token = env.BRAPI_TOKEN?.trim();
  if (!token) return null;
  return new MarketDataService({
    db: env.DB,
    provider: new BrapiProvider({
      token,
      baseUrl: env.BRAPI_BASE_URL?.trim() || "https://brapi.dev/api"
    })
  });
}
__name(buildMarketService, "buildMarketService");
function isValidListedTicker(asset) {
  const ticker = String(asset.ticker ?? "").trim().toUpperCase();
  if (!ticker || ticker.includes("_")) return false;
  if (!/^[A-Z]{4,6}\d{1,2}$/.test(ticker)) return false;
  const categoria = String(asset.categoria ?? "").toLowerCase();
  return categoria === "acao" || categoria === "fundo";
}
__name(isValidListedTicker, "isValidListedTicker");
async function applyQuoteUpdates(assets, market, db) {
  const tickers = Array.from(new Set(assets.map((a) => String(a.ticker).toUpperCase())));
  const quoteMap = /* @__PURE__ */ new Map();
  try {
    const quotes = await market.getQuotes(tickers);
    quotes.forEach((q) => {
      if (q.price !== null) quoteMap.set(q.ticker, q.price);
    });
  } catch {
    for (const ticker of tickers) {
      try {
        const quote = await market.getQuote(ticker);
        if (quote.price !== null) quoteMap.set(quote.ticker, quote.price);
      } catch {
      }
    }
  }
  const updates = assets.map((asset) => {
    const ticker = String(asset.ticker).toUpperCase();
    const price = quoteMap.get(ticker);
    if (price === void 0) return null;
    const quantidade = Number(asset.quantidade ?? 0);
    const precoMedio = Number(asset.preco_medio ?? 0);
    const valorAtual = quantidade > 0 ? quantidade * price : price;
    const retorno12m = precoMedio > 0 ? (price - precoMedio) / precoMedio * 100 : 0;
    return db.prepare("UPDATE ativos SET valor_atual = ?, retorno_12m = ? WHERE id = ?").bind(Number(valorAtual.toFixed(4)), Number(retorno12m.toFixed(4)), asset.id);
  }).filter((stmt) => stmt !== null);
  if (updates.length > 0) await db.batch(updates);
  return updates.length;
}
__name(applyQuoteUpdates, "applyQuoteUpdates");
async function refreshMarketQuotesForUser(userId, env) {
  const market = buildMarketService(env);
  if (!market) return { refreshed: 0, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  const rows = await env.DB.prepare(
    "SELECT id, usuario_id, ticker, quantidade, preco_medio, categoria FROM ativos WHERE usuario_id = ? AND ticker IS NOT NULL AND ticker <> ''"
  ).bind(userId).all();
  const assets = (rows.results ?? []).filter(isValidListedTicker);
  if (assets.length === 0) return { refreshed: 0, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  const refreshed = await applyQuoteUpdates(assets, market, env.DB);
  return { refreshed, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
__name(refreshMarketQuotesForUser, "refreshMarketQuotesForUser");
async function refreshAllUsersMarketQuotes(env) {
  const market = buildMarketService(env);
  if (!market) {
    return { refreshed: 0, users: 0, tickers: 0, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  const rows = await env.DB.prepare(
    "SELECT id, usuario_id, ticker, quantidade, preco_medio, categoria FROM ativos WHERE ticker IS NOT NULL AND ticker <> ''"
  ).all();
  const assets = (rows.results ?? []).filter(isValidListedTicker);
  if (assets.length === 0) {
    return { refreshed: 0, users: 0, tickers: 0, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  const users = new Set(assets.map((a) => a.usuario_id)).size;
  const tickers = new Set(assets.map((a) => String(a.ticker).toUpperCase())).size;
  const refreshed = await applyQuoteUpdates(assets, market, env.DB);
  return { refreshed, users, tickers, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
__name(refreshAllUsersMarketQuotes, "refreshAllUsersMarketQuotes");

// src/server/jobs/portfolio-reprocess.job.ts
async function reprocessUserPortfolio(userId, env) {
  const carteiraService = construirServicoCarteira(env);
  const perfilService = new ServicoPerfilPadrao(new RepositorioPerfilD1(env.DB));
  const [ativosRaw, contexto] = await Promise.all([
    carteiraService.listarAtivos(userId),
    perfilService.obterContextoFinanceiro(userId)
  ]);
  const ativos = ativosRaw;
  const snapshot = calcularSnapshotConsolidado(ativos, contexto);
  const agora = (/* @__PURE__ */ new Date()).toISOString();
  const snapshotId = `snap_${userId}`;
  await env.DB.prepare(
    [
      "INSERT INTO portfolio_snapshots (id, usuario_id, calculado_em, total_investido, total_atual, retorno_total, payload_json)",
      "VALUES (?, ?, ?, ?, ?, ?, ?)",
      "ON CONFLICT(usuario_id) DO UPDATE SET",
      "calculado_em = excluded.calculado_em,",
      "total_investido = excluded.total_investido,",
      "total_atual = excluded.total_atual,",
      "retorno_total = excluded.retorno_total,",
      "payload_json = excluded.payload_json"
    ].join(" ")
  ).bind(
    snapshotId,
    userId,
    agora,
    snapshot.totalInvestido,
    snapshot.totalAtual,
    snapshot.retornoTotal,
    JSON.stringify(snapshot.payload)
  ).run();
  await tentarGravarAnalytics(userId, env, agora);
}
__name(reprocessUserPortfolio, "reprocessUserPortfolio");
async function tentarGravarAnalytics(userId, env, agora) {
  try {
    const insightsService = new ServicoInsightsPadrao(new RepositorioInsightsD1(env.DB));
    const resumo = await insightsService.gerarResumo(userId);
    const analyticsPayload = {
      scoreGeral: resumo.scoreDetalhado?.score ?? null,
      pilares: resumo.scoreDetalhado?.pilares ?? null,
      score: resumo.scoreDetalhado ?? null,
      diagnostico: resumo.diagnosticoLegado ?? null,
      riscoPrincipal: resumo.riscoPrincipal ?? null,
      acaoPrioritaria: resumo.acaoPrioritaria ?? null,
      retorno: resumo.retorno ?? null,
      classificacao: resumo.classificacao ?? null,
      diagnosticoFinal: resumo.diagnostico ?? null,
      insightPrincipal: resumo.diagnostico?.insightPrincipal ?? null,
      penalidadesAplicadas: resumo.penalidadesAplicadas ?? null,
      impactoDecisoesRecentes: resumo.impactoDecisoesRecentes ?? null,
      patrimonioConsolidado: resumo.patrimonioConsolidado ?? null,
      pesosScoreProprietario: resumo.pesosProprietarios ?? null
    };
    const scoreGeral = resumo.scoreDetalhado?.score ?? null;
    const faixa = resumo.classificacao ?? null;
    await env.DB.prepare(
      [
        "INSERT INTO portfolio_analytics (id, usuario_id, calculado_em, score_unificado, faixa, confianca, payload_json)",
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        "ON CONFLICT(usuario_id) DO UPDATE SET",
        "calculado_em = excluded.calculado_em,",
        "score_unificado = excluded.score_unificado,",
        "faixa = excluded.faixa,",
        "confianca = excluded.confianca,",
        "payload_json = excluded.payload_json"
      ].join(" ")
    ).bind(
      `analytics_${userId}`,
      userId,
      agora,
      scoreGeral,
      faixa,
      1,
      JSON.stringify(analyticsPayload)
    ).run();
  } catch {
  }
}
__name(tentarGravarAnalytics, "tentarGravarAnalytics");

// src/server/jobs/historico-mensal.job.ts
async function registrarFechamentoMensalAtual(usuarioId, env) {
  const row = await env.DB.prepare("SELECT payload_json FROM portfolio_snapshots WHERE usuario_id = ?").bind(usuarioId).first();
  if (!row?.payload_json) return;
  const payloadSnapshot = JSON.parse(row.payload_json);
  const anoMesAtual = extrairAnoMes((/* @__PURE__ */ new Date()).toISOString());
  const servico = new ServicoHistoricoMensalPadrao(
    new RepositorioHistoricoMensalD1(env.DB)
  );
  await servico.registrarFechamentoMensal(
    usuarioId,
    anoMesAtual,
    payloadSnapshot,
    "fechamento_mensal"
  );
}
__name(registrarFechamentoMensalAtual, "registrarFechamentoMensalAtual");
async function registrarFechamentoMensalTodosUsuarios(env) {
  const result = await env.DB.prepare("SELECT DISTINCT usuario_id FROM portfolio_snapshots").all();
  const usuarios = result.results ?? [];
  for (const { usuario_id } of usuarios) {
    try {
      await registrarFechamentoMensalAtual(usuario_id, env);
    } catch {
    }
  }
}
__name(registrarFechamentoMensalTodosUsuarios, "registrarFechamentoMensalTodosUsuarios");

// src/server/jobs/portfolio-orchestrator.job.ts
async function orquestrarPosEscritaCarteira(usuarioId, env, opcoes = {}) {
  const { refrescarMercado = true, gravarHistoricoMensal = false } = opcoes;
  if (refrescarMercado) {
    try {
      await refreshMarketQuotesForUser(usuarioId, env);
    } catch {
    }
  }
  try {
    await reprocessUserPortfolio(usuarioId, env);
  } catch {
  }
  if (gravarHistoricoMensal) {
    try {
      await registrarFechamentoMensalAtual(usuarioId, env);
    } catch {
    }
  }
}
__name(orquestrarPosEscritaCarteira, "orquestrarPosEscritaCarteira");

// src/server/routes/carteira.routes.ts
var categoriasPermitidas = ["acao", "fundo", "previdencia", "renda_fixa", "poupanca", "bens"];
var atualizarDataAquisicaoSchema = external_exports.object({
  dataAquisicao: external_exports.string().min(8)
});
var vincularMovimentacaoSchema = external_exports.object({
  ativoOrigemId: external_exports.string().min(3),
  ativoDestinoId: external_exports.string().min(3),
  valor: external_exports.number().positive(),
  dataMovimentacao: external_exports.string().min(8),
  observacao: external_exports.string().optional()
});
var registrarAporteSchema = external_exports.object({
  valorAporte: external_exports.number().positive(),
  quantidade: external_exports.number().positive().optional(),
  precoUnitario: external_exports.number().positive().optional(),
  dataOperacao: external_exports.string().min(8).optional(),
  observacao: external_exports.string().optional()
});
var excluirAtivoSchema = external_exports.object({
  motivo: external_exports.string().min(5).max(280)
});
var serializarAtivoMercado = /* @__PURE__ */ __name((ativo) => ({
  ...ativo,
  fonte_preco: ativo.fontePreco,
  status_atualizacao: ativo.statusAtualizacao,
  ultima_atualizacao: ativo.ultimaAtualizacao,
  data_cadastro: ativo.dataCadastro,
  data_aquisicao: ativo.dataAquisicao || ativo.dataCadastro,
  retorno_desde_aquisicao: ativo.retornoDesdeAquisicao ?? ativo.retorno12m,
  status_preco_medio: ativo.statusPrecoMedio
}), "serializarAtivoMercado");
var calcularPercentuais = /* @__PURE__ */ __name((itensBase) => {
  const total = itensBase.reduce((acc, item) => acc + item.valor, 0);
  return itensBase.map((item) => ({
    ...item,
    percentual: total > 0 ? Number((item.valor / total * 100).toFixed(4)) : 0
  }));
}, "calcularPercentuais");
async function handleCarteiraRoutes(pathname, request, env, sessao, ctx) {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/carteira")) return null;
  const userId = sessao.usuario.id;
  const carteiraService = construirServicoCarteira(env);
  const perfilService = new ServicoPerfilPadrao(new RepositorioPerfilD1(env.DB));
  const insightsService = new ServicoInsightsPadrao(new RepositorioInsightsD1(env.DB));
  const portfolioView = new PortfolioViewService(env);
  if (pathname === "/api/carteira/resumo" && request.method === "GET") {
    const resumoData = await portfolioView.getResumo(userId);
    let scoreOficial = null;
    try {
      scoreOficial = await new UnifiedScoreService(env.DB).calculateForUser(userId);
    } catch {
      scoreOficial = null;
    }
    return sucesso({
      ...resumoData,
      // Score oficial do produto (canônico). O campo `score` raiz é legado/deprecated.
      scoreOficial,
      score_oficial: scoreOficial,
      scoreUnificado: scoreOficial,
      score_unificado: scoreOficial
    });
  }
  if (pathname === "/api/carteira/dashboard" && request.method === "GET") {
    const ativos = await carteiraService.listarAtivos(userId);
    const contexto = await perfilService.obterContextoFinanceiro(userId);
    const itensInvestimento = ativos.filter((a) => Number(a.valorAtual ?? 0) > 0).map((a) => ({ id: a.id, nome: a.ticker || a.nome || "Ativo", categoria: a.categoria, valor: Number(a.valorAtual ?? 0) }));
    const itensBens = [
      ...(contexto?.patrimonioExterno?.imoveis ?? []).map((i) => ({ id: i.id, nome: i.tipo || "Im\xF3vel", categoria: "bens", valor: Math.max(0, Number(i.valorEstimado ?? 0) - Number(i.saldoFinanciamento ?? 0)) })).filter((i) => i.valor > 0),
      ...(contexto?.patrimonioExterno?.veiculos ?? []).map((v) => ({ id: v.id, nome: v.tipo || "Ve\xEDculo", categoria: "bens", valor: Math.max(0, Number(v.valorEstimado ?? 0)) })).filter((v) => v.valor > 0)
    ];
    const valorPoupanca = Number(contexto?.patrimonioExterno?.poupanca ?? contexto?.patrimonioExterno?.caixaDisponivel ?? 0);
    const itensPoupanca = valorPoupanca > 0 ? [{ id: "poupanca", nome: "Poupan\xE7a", categoria: "poupanca", valor: valorPoupanca }] : [];
    const todosBase = [...itensInvestimento, ...itensBens, ...itensPoupanca];
    const filtros = {
      todos: calcularPercentuais(todosBase),
      acao: calcularPercentuais(itensInvestimento.filter((i) => i.categoria === "acao")),
      fundo: calcularPercentuais(itensInvestimento.filter((i) => i.categoria === "fundo")),
      previdencia: calcularPercentuais(itensInvestimento.filter((i) => i.categoria === "previdencia")),
      renda_fixa: calcularPercentuais(itensInvestimento.filter((i) => i.categoria === "renda_fixa")),
      poupanca: calcularPercentuais(itensPoupanca),
      bens: calcularPercentuais(itensBens)
    };
    const totais = Object.fromEntries(
      Object.entries(filtros).map(([key, value]) => [key, Number(value.reduce((acc, item) => acc + item.valor, 0).toFixed(2))])
    );
    return sucesso({ filtros, totais });
  }
  if (pathname === "/api/carteira/benchmark" && request.method === "GET") {
    const url = new URL(request.url);
    const meses = Number.parseInt(url.searchParams.get("meses") ?? "12", 10);
    const benchmark = await carteiraService.obterComparativoBenchmark(userId, Number.isNaN(meses) ? 12 : meses);
    return sucesso({
      ...benchmark,
      fonte_benchmark: benchmark.fonteBenchmark,
      status_atualizacao_benchmark: benchmark.statusAtualizacaoBenchmark,
      atualizado_em_benchmark: benchmark.atualizadoEmBenchmark
    });
  }
  if (pathname === "/api/carteira/ativos" && request.method === "GET") {
    const ativos = await carteiraService.listarAtivos(userId);
    return sucesso(ativos.map(serializarAtivoMercado));
  }
  if (pathname.startsWith("/api/carteira/categoria/") && request.method === "GET") {
    const categoria = pathname.replace("/api/carteira/categoria/", "");
    if (!categoriasPermitidas.includes(categoria)) {
      return erro("CATEGORIA_INVALIDA", "Categoria inv\xE1lida");
    }
    if (categoria === "poupanca" || categoria === "bens") {
      const contexto = await perfilService.obterContextoFinanceiro(userId);
      const patrimonioInvestimentos = (await carteiraService.listarAtivos(userId)).reduce((acc, a) => acc + (a.valorAtual ?? 0), 0);
      const patrimonioBens = (contexto?.patrimonioExterno?.imoveis ?? []).reduce((acc, i) => acc + (i.valorEstimado ?? 0), 0) + (contexto?.patrimonioExterno?.veiculos ?? []).reduce((acc, v) => acc + (v.valorEstimado ?? 0), 0);
      const patrimonioPoupanca = Number(contexto?.patrimonioExterno?.poupanca ?? contexto?.patrimonioExterno?.caixaDisponivel ?? 0);
      const totalPatrimonio = patrimonioInvestimentos + patrimonioBens + patrimonioPoupanca;
      let ativos = [];
      let valorTotal = 0;
      if (categoria === "poupanca") {
        valorTotal = patrimonioPoupanca;
        if (valorTotal > 0) {
          ativos.push({
            id: "poupanca_unica",
            ticker: "POUP",
            nome: "Reserva Financeira / Poupan\xE7a",
            categoria: "poupanca",
            valorAtual: valorTotal,
            participacao: totalPatrimonio > 0 ? valorTotal / totalPatrimonio * 100 : 100,
            retorno12m: 0,
            plataforma: "Reserva em Caixa"
          });
        }
      } else {
        ativos = [
          ...(contexto?.patrimonioExterno?.imoveis ?? []).map((i) => ({
            id: i.id,
            ticker: "IMOVEL",
            nome: i.tipo,
            categoria: "bens",
            valorAtual: i.valorEstimado,
            participacao: totalPatrimonio > 0 ? i.valorEstimado / totalPatrimonio * 100 : 0,
            retorno12m: 0,
            plataforma: "Im\xF3vel"
          })),
          ...(contexto?.patrimonioExterno?.veiculos ?? []).map((v) => ({
            id: v.id,
            ticker: "VEICULO",
            nome: v.tipo,
            categoria: "bens",
            valorAtual: v.valorEstimado,
            participacao: totalPatrimonio > 0 ? v.valorEstimado / totalPatrimonio * 100 : 0,
            retorno12m: 0,
            plataforma: "Ve\xEDculo"
          }))
        ];
        valorTotal = patrimonioBens;
      }
      return sucesso({
        categoria,
        valorTotal,
        participacao: totalPatrimonio > 0 ? Number((valorTotal / totalPatrimonio * 100).toFixed(2)) : 0,
        ativos: ativos.map(serializarAtivoMercado)
      });
    }
    const detalhe = await carteiraService.obterDetalhePorCategoria(userId, categoria);
    return sucesso({ ...detalhe, ativos: detalhe.ativos.map(serializarAtivoMercado) });
  }
  if (pathname.startsWith("/api/carteira/ativo/") && request.method === "GET" && !pathname.endsWith("/data-aquisicao") && !pathname.endsWith("/aporte")) {
    const ticker = decodeURIComponent(pathname.replace("/api/carteira/ativo/", ""));
    const ativos = await carteiraService.listarAtivos(userId);
    const ativo = ativos.find((item) => item.ticker === ticker);
    if (!ativo) return erro("ATIVO_NAO_ENCONTRADO", "Ativo n\xE3o encontrado", 404);
    const baseComparacao = ativo.dataAquisicao || ativo.dataCadastro || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const inicio = new Date(baseComparacao);
    const hoje = /* @__PURE__ */ new Date();
    const diffMeses = Math.max(1, (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth()) + 1);
    const benchmarkCarteira = await carteiraService.obterComparativoBenchmark(userId, diffMeses);
    const cdiRetornoPeriodo = await new BenchmarkService().cdiReturnSince(baseComparacao);
    const ativoRetornoPeriodo = typeof ativo.ganhoPerdaPercentual === "number" && Number.isFinite(ativo.ganhoPerdaPercentual) ? Number(ativo.ganhoPerdaPercentual.toFixed(2)) : 0;
    const benchmark = {
      ...benchmarkCarteira,
      carteiraRetornoPeriodo: ativoRetornoPeriodo,
      cdiRetornoPeriodo,
      excessoRetorno: Number((ativoRetornoPeriodo - cdiRetornoPeriodo).toFixed(2))
    };
    const movimentos = await env.DB.prepare(
      "SELECT id, ativo_origem_id, ativo_destino_id, valor, data_movimentacao, observacao, criado_em FROM ativos_movimentacoes WHERE usuario_id = ? AND (ativo_origem_id = ? OR ativo_destino_id = ?) ORDER BY data_movimentacao DESC, criado_em DESC"
    ).bind(userId, ativo.id, ativo.id).all();
    const movimentosRows = movimentos.results ?? [];
    const serieTickerDesc = [
      { data: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), valor: Number(ativo.valorAtual ?? 0) }
    ];
    let valorCorrente = Number(ativo.valorAtual ?? 0);
    for (const mov of movimentosRows) {
      const dataMov = String(mov.data_movimentacao ?? "").slice(0, 10);
      const valorMov = Number(mov.valor ?? 0);
      if (!dataMov || !Number.isFinite(valorMov) || valorMov <= 0) continue;
      if (mov.ativo_origem_id === ativo.id) valorCorrente += valorMov;
      else if (mov.ativo_destino_id === ativo.id) valorCorrente = Math.max(0, valorCorrente - valorMov);
      serieTickerDesc.push({ data: dataMov, valor: Number(valorCorrente.toFixed(2)) });
    }
    const serieTicker = [...serieTickerDesc].sort((a, b) => a.data < b.data ? -1 : 1).filter((point, idx, arr) => idx === 0 || point.data !== arr[idx - 1].data);
    const importacoesAtivo = await env.DB.prepare(
      "SELECT imp.id, imp.criado_em, imp.arquivo_nome, imp.validos FROM importacoes imp INNER JOIN itens_importacao item ON item.importacao_id = imp.id WHERE imp.usuario_id = ? AND item.ticker = ? ORDER BY imp.criado_em DESC LIMIT 20"
    ).bind(userId, ativo.ticker).all();
    const eventosTicker = [
      ...(importacoesAtivo.results ?? []).map((imp) => ({
        id: `import_${imp.id}`,
        data: imp.criado_em,
        tipo: "importacao",
        descricao: `Importa\xE7\xE3o ${imp.arquivo_nome ?? "manual"} impactou ${ativo.ticker}`
      })),
      ...movimentosRows.map((mov) => ({
        id: `mov_${mov.id}`,
        data: mov.data_movimentacao,
        tipo: mov.ativo_origem_id === ativo.id ? "rebalanceamento_saida" : "rebalanceamento_entrada",
        descricao: mov.ativo_origem_id === ativo.id ? `Movimenta\xE7\xE3o de sa\xEDda vinculada (${Number(mov.valor ?? 0).toFixed(2)})` : `Movimenta\xE7\xE3o de entrada vinculada (${Number(mov.valor ?? 0).toFixed(2)})`
      }))
    ].sort((a, b) => String(a.data) < String(b.data) ? 1 : -1).slice(0, 30);
    return sucesso({
      ...serializarAtivoMercado(ativo),
      benchmarkDesdeAquisicao: benchmark,
      benchmark_desde_aquisicao: benchmark,
      dataBaseComparacao: baseComparacao,
      data_base_comparacao: baseComparacao,
      movimentacoes: movimentosRows,
      serieTicker,
      serie_ticker: serieTicker,
      eventosTicker,
      eventos_ticker: eventosTicker
    });
  }
  if (pathname.startsWith("/api/carteira/ativo/") && pathname.endsWith("/data-aquisicao") && request.method === "PUT") {
    const ativoId = decodeURIComponent(pathname.replace("/api/carteira/ativo/", "").replace("/data-aquisicao", ""));
    const body = atualizarDataAquisicaoSchema.parse(await parseJsonBody2(request));
    await env.DB.prepare("UPDATE ativos SET data_aquisicao = ? WHERE id = ? AND usuario_id = ?").bind(body.dataAquisicao, ativoId, userId).run();
    ctx.waitUntil(orquestrarPosEscritaCarteira(userId, env, { refrescarMercado: false }));
    return sucesso({ atualizado: true, mensagem: "Data de aquisi\xE7\xE3o atualizada com sucesso. Comparativos recalculados." });
  }
  if (pathname === "/api/carteira/movimentacoes/vincular" && request.method === "POST") {
    const body = vincularMovimentacaoSchema.parse(await parseJsonBody2(request));
    if (body.ativoOrigemId === body.ativoDestinoId) {
      return erro("MOVIMENTACAO_INVALIDA", "Origem e destino devem ser diferentes");
    }
    const origem = await env.DB.prepare("SELECT id, ticker, quantidade, preco_medio, valor_atual FROM ativos WHERE id = ? AND usuario_id = ? LIMIT 1").bind(body.ativoOrigemId, userId).first();
    const destino = await env.DB.prepare("SELECT id, ticker, quantidade, preco_medio, valor_atual FROM ativos WHERE id = ? AND usuario_id = ? LIMIT 1").bind(body.ativoDestinoId, userId).first();
    if (!origem || !destino) return erro("ATIVO_NAO_ENCONTRADO", "Origem ou destino n\xE3o encontrado", 404);
    const qO = Number(origem.quantidade ?? 0);
    const qD = Number(destino.quantidade ?? 0);
    const pO = (Number(origem.preco_medio ?? 0) > 0 ? Number(origem.preco_medio) : void 0) ?? (qO > 0 ? Number(origem.valor_atual ?? 0) / qO : void 0);
    const pD = (Number(destino.preco_medio ?? 0) > 0 ? Number(destino.preco_medio) : void 0) ?? (qD > 0 ? Number(destino.valor_atual ?? 0) / qD : void 0);
    if (!pO || pO <= 0 || !pD || pD <= 0) {
      return erro("PRECO_REFERENCIA_INVALIDO", "N\xE3o foi poss\xEDvel calcular pre\xE7o de refer\xEAncia para movimenta\xE7\xE3o");
    }
    const qOMov = body.valor / pO;
    const qDMov = body.valor / pD;
    if (qOMov > qO) return erro("SALDO_INSUFICIENTE", `Saldo insuficiente em ${origem.ticker} para movimentar ${body.valor.toFixed(2)}`);
    const novaQO = Math.max(0, qO - qOMov);
    const novoCO = Math.max(0, qO * Number(origem.preco_medio ?? pO) - body.valor);
    const novoPO = novaQO > 0 ? novoCO / novaQO : 0;
    const novaQD = qD + qDMov;
    const novoCD = qD * Number(destino.preco_medio ?? pD) + body.valor;
    const novoPD = novaQD > 0 ? novoCD / novaQD : 0;
    const id = crypto.randomUUID();
    const agora = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.batch([
      env.DB.prepare("UPDATE ativos SET quantidade = ?, preco_medio = ?, valor_atual = ?, retorno_12m = ? WHERE id = ? AND usuario_id = ?").bind(novaQO, novoPO, novaQO * pO, novoCO > 0 ? (novaQO * pO - novoCO) / novoCO * 100 : 0, origem.id, userId),
      env.DB.prepare("UPDATE ativos SET quantidade = ?, preco_medio = ?, valor_atual = ?, retorno_12m = ? WHERE id = ? AND usuario_id = ?").bind(novaQD, novoPD, novaQD * pD, novoCD > 0 ? (novaQD * pD - novoCD) / novoCD * 100 : 0, destino.id, userId),
      env.DB.prepare("INSERT INTO ativos_movimentacoes (id, usuario_id, ativo_origem_id, ativo_destino_id, valor, data_movimentacao, observacao, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, userId, body.ativoOrigemId, body.ativoDestinoId, body.valor, body.dataMovimentacao, body.observacao ?? "", agora)
    ]);
    ctx.waitUntil(orquestrarPosEscritaCarteira(userId, env, { refrescarMercado: false }));
    return sucesso({
      id,
      mensagem: "Movimenta\xE7\xE3o vinculada e aplicada nas posi\xE7\xF5es com sucesso.",
      impacto: {
        origem: { ativoId: origem.id, ticker: origem.ticker, quantidadeAnterior: qO, quantidadeAtual: novaQO },
        destino: { ativoId: destino.id, ticker: destino.ticker, quantidadeAnterior: qD, quantidadeAtual: novaQD }
      }
    });
  }
  if (pathname.startsWith("/api/carteira/ativo/") && pathname.endsWith("/aporte") && request.method === "POST") {
    const ativoId = decodeURIComponent(pathname.replace("/api/carteira/ativo/", "").replace("/aporte", ""));
    const body = registrarAporteSchema.parse(await parseJsonBody2(request));
    const atual = await env.DB.prepare("SELECT id, quantidade, preco_medio, valor_atual FROM ativos WHERE id = ? AND usuario_id = ? LIMIT 1").bind(ativoId, userId).first();
    if (!atual) return erro("ATIVO_NAO_ENCONTRADO", "Ativo n\xE3o encontrado para aporte", 404);
    const ativosMercado = await carteiraService.listarAtivos(userId);
    const ativoMercado = ativosMercado.find((item) => item.id === ativoId);
    const qAtual = Number(atual.quantidade ?? 0);
    const pMedio = Number(atual.preco_medio ?? 0);
    const pPorValor = qAtual > 0 ? Number(atual.valor_atual ?? 0) / qAtual : 0;
    const precoRef = body.precoUnitario ?? ativoMercado?.precoAtual ?? (pMedio > 0 ? pMedio : void 0) ?? (pPorValor > 0 ? pPorValor : 0);
    if (!Number.isFinite(precoRef) || precoRef <= 0) {
      return erro("PRECO_REFERENCIA_INVALIDO", "Pre\xE7o de refer\xEAncia inv\xE1lido para aporte");
    }
    const qAporte = body.quantidade ?? body.valorAporte / precoRef;
    const novaQ = qAtual + qAporte;
    const novoCusto = qAtual * Number(atual.preco_medio ?? 0) + body.valorAporte;
    const novoPMedio = novaQ > 0 ? novoCusto / novaQ : 0;
    const novoValor = novaQ * precoRef;
    const novoRetorno = novoCusto > 0 ? (novoValor - novoCusto) / novoCusto * 100 : 0;
    await env.DB.prepare("UPDATE ativos SET quantidade = ?, preco_medio = ?, valor_atual = ?, retorno_12m = ? WHERE id = ? AND usuario_id = ?").bind(novaQ, novoPMedio, novoValor, novoRetorno, ativoId, userId).run();
    ctx.waitUntil(orquestrarPosEscritaCarteira(userId, env));
    return sucesso({
      atualizado: true,
      mensagem: "Aporte registrado com sucesso.",
      data_operacao: body.dataOperacao ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      observacao: body.observacao ?? ""
    });
  }
  if (pathname.startsWith("/api/carteira/ativo/") && request.method === "DELETE") {
    const ativoId = decodeURIComponent(pathname.replace("/api/carteira/ativo/", ""));
    const body = excluirAtivoSchema.parse(await parseJsonBody2(request));
    const existe = await env.DB.prepare("SELECT id, ticker, nome, categoria, valor_atual, quantidade FROM ativos WHERE id = ? AND usuario_id = ? LIMIT 1").bind(ativoId, userId).first();
    if (!existe) return erro("ATIVO_NAO_ENCONTRADO", "Ativo n\xE3o encontrado para exclus\xE3o", 404);
    await env.DB.prepare("DELETE FROM ativos WHERE id = ? AND usuario_id = ?").bind(ativoId, userId).run();
    try {
      await env.DB.prepare("INSERT INTO admin_auditoria (id, acao, alvo, payload_json, autor_email, criado_em) VALUES (?, ?, ?, ?, ?, ?)").bind(
        crypto.randomUUID(),
        "carteira.ativo.excluir",
        "ativos",
        JSON.stringify({ usuarioId: userId, ativoId, ticker: existe.ticker, nome: existe.nome, categoria: existe.categoria, valorAtual: existe.valor_atual ?? 0, quantidade: existe.quantidade ?? 0, motivo: body.motivo }),
        sessao.usuario.email,
        (/* @__PURE__ */ new Date()).toISOString()
      ).run();
    } catch {
    }
    ctx.waitUntil(orquestrarPosEscritaCarteira(userId, env, { refrescarMercado: false }));
    return sucesso({ removido: true, mensagem: "Ativo exclu\xEDdo com sucesso." });
  }
  return null;
}
__name(handleCarteiraRoutes, "handleCarteiraRoutes");

// src/server/services/financial-core.service.ts
var CATEGORY_LABELS = {
  acao: "A\xE7\xF5es",
  fundo: "Fundos",
  previdencia: "Previd\xEAncia",
  renda_fixa: "Renda Fixa",
  poupanca: "Caixa / Poupan\xE7a",
  bens: "Outros Patrim\xF4nios"
};
var SCORE_VERSION = "unified_score_v1";
var mapPrecoMedioStatus = /* @__PURE__ */ __name((status) => {
  if (status === "confiavel") return "trusted";
  if (status === "ajustado_heuristica") return "adjusted";
  if (status === "inconsistente") return "inconsistent";
  return "unknown";
}, "mapPrecoMedioStatus");
var FinancialCoreService = class {
  constructor(env) {
    this.env = env;
    this.portfolioView = new PortfolioViewService(env);
    this.unifiedScore = new UnifiedScoreService(env.DB);
    this.benchmark = new BenchmarkService();
  }
  static {
    __name(this, "FinancialCoreService");
  }
  portfolioView;
  unifiedScore;
  benchmark;
  async getSummary(userId) {
    const [resumo, ativos, scoreResult, benchmarkData] = await Promise.all([
      this.portfolioView.getResumo(userId),
      this.listAssetsRaw(userId),
      this.calculateScoreSafe(userId),
      this.calculateBenchmarkSafe(userId, 12)
    ]);
    const patrimonioTotal = Number(resumo.patrimonioTotal ?? 0);
    const patrimonioInvestimentos = Number(resumo.patrimonioInvestimentos ?? 0);
    const patrimonioBens = Number(resumo.patrimonioBens ?? 0);
    const patrimonioPoupanca = Number(resumo.patrimonioPoupanca ?? 0);
    const retornoRaw = resumo.retornoDesdeAquisicao ?? resumo.retorno12m ?? null;
    const retornoDisponivel = resumo.retornoDisponivel !== false && retornoRaw !== null;
    const marketData = this.summarizeMarketData(ativos);
    const qualityFlags = this.deriveQualityFlags(ativos, marketData, retornoDisponivel);
    return {
      portfolio: {
        totalValue: patrimonioTotal,
        investedValue: patrimonioInvestimentos,
        otherAssetsValue: patrimonioBens,
        cashValue: patrimonioPoupanca,
        returnSinceInception: retornoDisponivel ? Number(retornoRaw) : null,
        returnAvailable: retornoDisponivel,
        assetCount: ativos.length,
        lastCalculatedAt: resumo._calculadoEm ?? null
      },
      allocation: this.buildAllocation(ativos, { patrimonioInvestimentos, patrimonioBens, patrimonioPoupanca, patrimonioTotal }),
      benchmark: benchmarkData,
      score: scoreResult,
      marketData,
      qualityFlags
    };
  }
  async getAssets(userId, filters = {}) {
    const ativos = await this.listAssetsRaw(userId);
    return ativos.filter((a) => !filters.class || a.categoria === filters.class).filter((a) => !filters.source || a.fontePreco === filters.source).filter((a) => !filters.status || a.statusAtualizacao === filters.status).map((a) => this.toPublicAsset(a));
  }
  async getHistory(userId, range = "12m") {
    const months = this.parseRangeToMonths(range);
    const carteiraService = construirServicoCarteira(this.env);
    const [benchmark, scoreHistory] = await Promise.all([
      carteiraService.obterComparativoBenchmark(userId, months).catch(() => null),
      this.unifiedScore.getHistory(userId).catch(() => [])
    ]);
    const serie = benchmark?.serie ?? [];
    const scoreByMonth = /* @__PURE__ */ new Map();
    for (const item of scoreHistory) {
      const mes = item.createdAt.slice(0, 7);
      if (!scoreByMonth.has(mes)) scoreByMonth.set(mes, item.score);
    }
    const series = serie.map((ponto) => ({
      date: ponto.data,
      portfolioBase100: Number(ponto.carteira ?? 0),
      cdiBase100: Number(ponto.cdi ?? 0),
      officialScore: scoreByMonth.get(ponto.data.slice(0, 7)) ?? null
    }));
    return { range, series };
  }
  // ─── Internals ────────────────────────────────────────────────────────────
  async listAssetsRaw(userId) {
    const carteiraService = construirServicoCarteira(this.env);
    const ativos = await carteiraService.listarAtivos(userId);
    return ativos;
  }
  async calculateScoreSafe(userId) {
    try {
      const result = await this.unifiedScore.calculateForUser(userId);
      return { official: result.score, band: result.band, version: SCORE_VERSION };
    } catch {
      return null;
    }
  }
  async calculateBenchmarkSafe(userId, periodMonths) {
    const carteiraService = construirServicoCarteira(this.env);
    try {
      const data = await carteiraService.obterComparativoBenchmark(userId, periodMonths);
      return {
        periodMonths: data.periodoMeses,
        portfolioReturn: data.carteiraRetornoPeriodo,
        cdiReturn: data.cdiRetornoPeriodo,
        excessReturn: data.excessoRetorno,
        source: data.fonteBenchmark,
        status: data.statusAtualizacaoBenchmark,
        updatedAt: data.atualizadoEmBenchmark
      };
    } catch {
      return {
        periodMonths,
        portfolioReturn: 0,
        cdiReturn: 0,
        excessReturn: 0,
        source: "bcb",
        status: "indisponivel",
        updatedAt: null
      };
    }
  }
  buildAllocation(ativos, totals) {
    const byClassMap = /* @__PURE__ */ new Map();
    for (const ativo of ativos) {
      const cat = ativo.categoria;
      byClassMap.set(cat, (byClassMap.get(cat) ?? 0) + Number(ativo.valorAtual ?? 0));
    }
    if (totals.patrimonioBens > 0) byClassMap.set("bens", (byClassMap.get("bens") ?? 0) + totals.patrimonioBens);
    if (totals.patrimonioPoupanca > 0) byClassMap.set("poupanca", (byClassMap.get("poupanca") ?? 0) + totals.patrimonioPoupanca);
    const total = totals.patrimonioTotal > 0 ? totals.patrimonioTotal : 1;
    const byClass = Array.from(byClassMap.entries()).filter(([, value]) => value > 0).map(([id, value]) => ({
      id,
      label: CATEGORY_LABELS[id],
      value: Number(value.toFixed(2)),
      percent: Number((value / total * 100).toFixed(2))
    })).sort((a, b) => b.value - a.value);
    const largestPositions = ativos.filter((a) => Number(a.valorAtual ?? 0) > 0).sort((a, b) => Number(b.valorAtual ?? 0) - Number(a.valorAtual ?? 0)).slice(0, 5).map((a) => ({
      id: a.id,
      ticker: a.ticker,
      name: a.nome,
      value: Number((a.valorAtual ?? 0).toFixed(2)),
      percent: Number((Number(a.valorAtual ?? 0) / total * 100).toFixed(2))
    }));
    return { byClass, largestPositions };
  }
  summarizeMarketData(ativos) {
    const total = ativos.length;
    const coberturaPorStatus = { atualizado: 0, atrasado: 0, indisponivel: 0 };
    const fontesMap = /* @__PURE__ */ new Map();
    let ultimaAtualizacao = null;
    for (const ativo of ativos) {
      const status = ativo.statusAtualizacao ?? "indisponivel";
      coberturaPorStatus[status] += 1;
      const fonte = ativo.fontePreco ?? "nenhuma";
      fontesMap.set(fonte, (fontesMap.get(fonte) ?? 0) + 1);
      if (ativo.ultimaAtualizacao && (!ultimaAtualizacao || ativo.ultimaAtualizacao > ultimaAtualizacao)) {
        ultimaAtualizacao = ativo.ultimaAtualizacao;
      }
    }
    const coveragePercent = total > 0 ? Number((coberturaPorStatus.atualizado / total * 100).toFixed(2)) : 0;
    let statusGeral = "indisponivel";
    if (coberturaPorStatus.atualizado === total && total > 0) statusGeral = "atualizado";
    else if (coberturaPorStatus.atualizado > 0) statusGeral = "atrasado";
    else if (coberturaPorStatus.atrasado > 0) statusGeral = "atrasado";
    return {
      coveragePercent,
      status: statusGeral,
      updatedAt: ultimaAtualizacao,
      sources: Array.from(fontesMap.entries()).map(([source, count]) => ({ source, count }))
    };
  }
  deriveQualityFlags(ativos, marketData, retornoDisponivel) {
    const flags = [];
    const ajustados = ativos.filter((a) => a.statusPrecoMedio === "ajustado_heuristica").length;
    const inconsistentes = ativos.filter((a) => a.statusPrecoMedio === "inconsistente").length;
    if (ajustados > 0) {
      flags.push({
        code: "PRICE_AVERAGE_HEURISTIC_ADJUSTMENT",
        severity: "warning",
        message: `O pre\xE7o m\xE9dio de ${ajustados} ativo(s) foi ajustado heuristicamente para reconciliar com o valor investido.`
      });
    }
    if (inconsistentes > 0) {
      flags.push({
        code: "PRICE_AVERAGE_INCONSISTENT",
        severity: "critical",
        message: `O pre\xE7o m\xE9dio de ${inconsistentes} ativo(s) n\xE3o p\xF4de ser reconciliado \u2014 o retorno desses ativos pode estar distorcido.`
      });
    }
    if (marketData.status === "indisponivel" && ativos.length > 0) {
      flags.push({
        code: "MARKET_DATA_STALE",
        severity: "warning",
        message: "Nenhum ativo tem cota\xE7\xE3o atualizada \u2014 valores podem estar defasados."
      });
    } else if (marketData.coveragePercent < 80 && ativos.length > 0) {
      flags.push({
        code: "MARKET_DATA_PARTIAL",
        severity: "warning",
        message: `Apenas ${marketData.coveragePercent}% dos ativos t\xEAm cota\xE7\xE3o atualizada.`
      });
    }
    if (!retornoDisponivel) {
      flags.push({
        code: "RETURN_UNAVAILABLE",
        severity: "info",
        message: "Retorno indispon\xEDvel: dados insuficientes para calcular sem inventar."
      });
    }
    return flags;
  }
  toPublicAsset(a) {
    const retorno = a.retornoDesdeAquisicao ?? a.retorno12m ?? null;
    const qualityFlags = [];
    if (a.statusPrecoMedio === "ajustado_heuristica") {
      qualityFlags.push({
        code: "PRICE_AVERAGE_HEURISTIC_ADJUSTMENT",
        severity: "warning",
        message: "Pre\xE7o m\xE9dio ajustado heuristicamente."
      });
    }
    if (a.statusPrecoMedio === "inconsistente") {
      qualityFlags.push({
        code: "PRICE_AVERAGE_INCONSISTENT",
        severity: "critical",
        message: "Pre\xE7o m\xE9dio n\xE3o reconcili\xE1vel \u2014 retorno deste ativo deve ser tratado com cautela."
      });
    }
    if (a.statusAtualizacao === "indisponivel") {
      qualityFlags.push({
        code: "MARKET_DATA_STALE",
        severity: "warning",
        message: "Cota\xE7\xE3o indispon\xEDvel para este ativo."
      });
    }
    return {
      id: a.id,
      ticker: a.ticker,
      name: a.nome,
      class: a.categoria,
      quantity: typeof a.quantidade === "number" ? a.quantidade : null,
      averagePrice: typeof a.precoMedio === "number" ? a.precoMedio : null,
      averagePriceStatus: mapPrecoMedioStatus(a.statusPrecoMedio),
      currentPrice: typeof a.precoAtual === "number" ? a.precoAtual : null,
      currentValue: Number((a.valorAtual ?? 0).toFixed(2)),
      gainLoss: typeof a.ganhoPerda === "number" ? Number(a.ganhoPerda.toFixed(2)) : null,
      gainLossPercent: typeof a.ganhoPerdaPercentual === "number" ? Number(a.ganhoPerdaPercentual.toFixed(2)) : null,
      returnSinceInception: typeof retorno === "number" ? Number(retorno.toFixed(2)) : null,
      marketSource: a.fontePreco ?? "nenhuma",
      marketStatus: a.statusAtualizacao ?? "indisponivel",
      updatedAt: a.ultimaAtualizacao ?? null,
      qualityFlags
    };
  }
  parseRangeToMonths(range) {
    const match = /^(\d+)([my])$/.exec(range.toLowerCase());
    if (!match) return 12;
    const value = Number.parseInt(match[1], 10);
    if (!Number.isFinite(value) || value <= 0) return 12;
    return match[2] === "y" ? value * 12 : value;
  }
  // BenchmarkService é parte do núcleo — expõe para quem precisar (drill-down de ativo etc)
  getBenchmarkService() {
    return this.benchmark;
  }
};

// src/server/routes/financial-core.routes.ts
async function handleFinancialCoreRoutes(pathname, request, env, sessao) {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/financial-core")) return null;
  const userId = sessao.usuario.id;
  const core = new FinancialCoreService(env);
  if (pathname === "/api/financial-core/summary" && request.method === "GET") {
    const summary = await core.getSummary(userId);
    return sucesso(summary);
  }
  if (pathname === "/api/financial-core/assets" && request.method === "GET") {
    const url = new URL(request.url);
    const filters = {
      class: url.searchParams.get("class") ?? void 0,
      source: url.searchParams.get("source") ?? void 0,
      status: url.searchParams.get("status") ?? void 0
    };
    const assets = await core.getAssets(userId, filters);
    return sucesso(assets);
  }
  if (pathname.startsWith("/api/financial-core/assets/") && request.method === "GET") {
    const id = decodeURIComponent(pathname.replace("/api/financial-core/assets/", ""));
    const assets = await core.getAssets(userId);
    const asset = assets.find((a) => a.id === id);
    if (!asset) return erro("ASSET_NOT_FOUND", "Ativo n\xE3o encontrado", 404);
    return sucesso(asset);
  }
  if (pathname === "/api/financial-core/history" && request.method === "GET") {
    const url = new URL(request.url);
    const range = url.searchParams.get("range") ?? "12m";
    const history = await core.getHistory(userId, range);
    return sucesso(history);
  }
  return null;
}
__name(handleFinancialCoreRoutes, "handleFinancialCoreRoutes");

// src/server/routes/insights.routes.ts
var resumirAtualizacaoMercado = /* @__PURE__ */ __name((ativos) => {
  const total = ativos.length;
  const coberturaPorStatus = { atualizado: 0, atrasado: 0, indisponivel: 0 };
  const fontesMap = /* @__PURE__ */ new Map();
  let ultimaAtualizacao = null;
  for (const ativo of ativos) {
    const status = ativo.statusAtualizacao ?? "indisponivel";
    coberturaPorStatus[status] += 1;
    const fonte = ativo.fontePreco ?? "nenhuma";
    fontesMap.set(fonte, (fontesMap.get(fonte) ?? 0) + 1);
    if (ativo.ultimaAtualizacao && (!ultimaAtualizacao || ativo.ultimaAtualizacao > ultimaAtualizacao)) {
      ultimaAtualizacao = ativo.ultimaAtualizacao;
    }
  }
  const cobertura = total > 0 ? Number((coberturaPorStatus.atualizado / total * 100).toFixed(2)) : 0;
  let statusGeral = "indisponivel";
  if (coberturaPorStatus.atualizado > 0) statusGeral = "atualizado";
  else if (coberturaPorStatus.atrasado > 0) statusGeral = "atrasado";
  return {
    cobertura,
    statusGeral,
    ultimaAtualizacao,
    fontes: Array.from(fontesMap.entries()).map(([fonte, quantidade]) => ({ fonte, quantidade })),
    coberturaPorStatus,
    cobertura_por_status: coberturaPorStatus,
    status_geral: statusGeral,
    ultima_atualizacao: ultimaAtualizacao
  };
}, "resumirAtualizacaoMercado");
async function handleInsightsRoutes(pathname, request, env, sessao, ctx) {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/insights")) return null;
  const userId = sessao.usuario.id;
  const insightsService = new ServicoInsightsPadrao(new RepositorioInsightsD1(env.DB));
  const portfolioView = new PortfolioViewService(env);
  if (pathname === "/api/insights/summary" && request.method === "GET") {
    try {
      const core = new FinancialCoreService(env);
      const [summary, resumo] = await Promise.all([
        core.getSummary(userId),
        insightsService.gerarResumo(userId).catch(() => null)
      ]);
      const risco = resumo?.riscoPrincipal ?? null;
      const acao = resumo?.acaoPrioritaria ?? null;
      const mainRisk = risco ? {
        code: risco.codigo,
        title: risco.titulo,
        description: risco.descricao,
        severity: risco.severidade
      } : null;
      const mainOpportunity = acao ? {
        code: acao.codigo,
        title: acao.titulo,
        description: acao.descricao,
        impact: acao.impactoEsperado
      } : null;
      const actions = [];
      if (acao) {
        actions.push({ code: acao.codigo, title: acao.titulo, priority: 1, expectedImpact: acao.impactoEsperado });
      }
      const penalidades = resumo?.penalidadesAplicadas ?? [];
      penalidades.slice(0, 3).forEach((pen, idx) => {
        actions.push({
          code: pen.tipo,
          title: pen.descricao,
          priority: idx + 2,
          expectedImpact: pen.peso >= 10 ? "high" : pen.peso >= 5 ? "medium" : "low"
        });
      });
      const confidenceReasons = [];
      if (summary.marketData.coveragePercent < 80) confidenceReasons.push("market_data_partial");
      if (summary.marketData.status === "indisponivel") confidenceReasons.push("market_data_unavailable");
      if (!resumo) confidenceReasons.push("insights_engine_unavailable");
      if (summary.qualityFlags.some((f) => f.severity === "critical")) confidenceReasons.push("critical_quality_flags");
      const confidenceLevel = confidenceReasons.length === 0 ? "high" : confidenceReasons.length <= 1 ? "medium" : "low";
      return sucesso({
        officialScore: summary.score ? { value: summary.score.official, band: summary.score.band, version: summary.score.version } : null,
        diagnosis: {
          mainRisk,
          mainOpportunity,
          summary: resumo?.diagnostico?.mensagem ?? null
        },
        actions,
        narrative: {
          enabled: false,
          provider: null,
          text: null
        },
        confidence: {
          level: confidenceLevel,
          reasons: confidenceReasons
        },
        qualityFlags: summary.qualityFlags
      });
    } catch (error) {
      return {
        ok: false,
        status: 500,
        codigo: "ERRO_INSIGHTS_SUMMARY",
        mensagem: "Falha ao gerar summary de insights",
        detalhes: { message: error instanceof Error ? error.message : String(error) }
      };
    }
  }
  if (pathname === "/api/insights/score" && request.method === "GET") {
    try {
      const score = await insightsService.calcularScore(userId);
      return sucesso(score);
    } catch (error) {
      return {
        ok: false,
        status: 500,
        codigo: "ERRO_INSIGHTS_SCORE",
        mensagem: "Falha ao calcular score de insights",
        detalhes: { message: error instanceof Error ? error.message : String(error) }
      };
    }
  }
  if (pathname === "/api/insights/diagnostico" && request.method === "GET") {
    try {
      const diagnostico = await insightsService.gerarDiagnostico(userId);
      return sucesso(diagnostico);
    } catch (error) {
      return {
        ok: false,
        status: 500,
        codigo: "ERRO_INSIGHTS_DIAGNOSTICO",
        mensagem: "Falha ao gerar diagn\xF3stico de insights",
        detalhes: { message: error instanceof Error ? error.message : String(error) }
      };
    }
  }
  if (pathname === "/api/insights/resumo" && request.method === "GET") {
    try {
      const analyticsData = await portfolioView.getAnalytics(userId);
      if (analyticsData && analyticsData._calculadoEm) {
        const carteiraService2 = construirServicoCarteira(env);
        const ativosMercado2 = await carteiraService2.listarAtivos(userId);
        const atualizacaoMercado2 = resumirAtualizacaoMercado(ativosMercado2);
        const confiancaDiagnostico2 = atualizacaoMercado2.statusGeral === "atualizado" ? "alta" : "limitada";
        const dadosMercadoSessao = {
          status: atualizacaoMercado2.statusGeral,
          timestamp: atualizacaoMercado2.ultimaAtualizacao,
          ativosAtualizados: atualizacaoMercado2.coberturaPorStatus.atualizado
        };
        const unifiedService2 = new UnifiedScoreService(env.DB);
        let scoreUnificado2 = null;
        let scoreHistorico = [];
        try {
          scoreUnificado2 = await unifiedService2.calculateForUser(userId);
        } catch {
        }
        try {
          scoreHistorico = (await unifiedService2.getHistory(userId)).slice(0, 12).reverse();
        } catch {
          scoreHistorico = [];
        }
        const diagnosticoFinal = analyticsData.diagnosticoFinal;
        const mensagemConfianca2 = confiancaDiagnostico2 === "alta" ? diagnosticoFinal?.mensagem ?? "" : `${diagnosticoFinal?.mensagem ?? ""} Aten\xE7\xE3o: parte das cota\xE7\xF5es est\xE1 ${atualizacaoMercado2.statusGeral === "atrasado" ? "atrasada" : "indispon\xEDvel"}; revise antes de decis\xE3o cr\xEDtica.`;
        return sucesso({
          ...analyticsData,
          diagnosticoFinal: diagnosticoFinal ? { ...diagnosticoFinal, mensagem: mensagemConfianca2 } : null,
          scoreUnificado: scoreUnificado2,
          score_unificado: scoreUnificado2,
          scoreOficial: scoreUnificado2,
          score_oficial: scoreUnificado2,
          scoreHistorico,
          score_historico: scoreHistorico,
          confiancaDiagnostico: confiancaDiagnostico2,
          confianca_diagnostico: confiancaDiagnostico2,
          atualizacaoMercado: atualizacaoMercado2,
          atualizacao_mercado: atualizacaoMercado2,
          dadosMercadoSessao,
          dados_mercado_sessao: dadosMercadoSessao
        });
      }
      const resumo = await insightsService.gerarResumo(userId);
      const unifiedService = new UnifiedScoreService(env.DB);
      let scoreUnificado = null;
      try {
        scoreUnificado = await unifiedService.calculateForUser(userId);
      } catch {
        scoreUnificado = null;
      }
      let scoreHistoricoReal = [];
      try {
        scoreHistoricoReal = (await unifiedService.getHistory(userId)).slice(0, 12).reverse();
      } catch {
        scoreHistoricoReal = [];
      }
      const carteiraService = construirServicoCarteira(env);
      const ativosMercado = await carteiraService.listarAtivos(userId);
      const atualizacaoMercado = resumirAtualizacaoMercado(ativosMercado);
      const confiancaDiagnostico = atualizacaoMercado.statusGeral === "atualizado" ? "alta" : "limitada";
      const dadosMercadoSessaoLive = {
        status: atualizacaoMercado.statusGeral,
        timestamp: atualizacaoMercado.ultimaAtualizacao,
        ativosAtualizados: atualizacaoMercado.coberturaPorStatus.atualizado
      };
      const mensagemConfianca = confiancaDiagnostico === "alta" ? resumo.diagnostico.mensagem : `${resumo.diagnostico.mensagem} Aten\xE7\xE3o: parte das cota\xE7\xF5es est\xE1 ${atualizacaoMercado.statusGeral === "atrasado" ? "atrasada" : "indispon\xEDvel"}; revise antes de decis\xE3o cr\xEDtica.`;
      ctx.waitUntil(orquestrarPosEscritaCarteira(userId, env, { refrescarMercado: false }));
      return sucesso({
        scoreGeral: resumo.scoreDetalhado.score,
        pilares: resumo.scoreDetalhado.pilares,
        score: resumo.scoreDetalhado,
        diagnostico: resumo.diagnosticoLegado,
        riscoPrincipal: resumo.riscoPrincipal ?? null,
        acaoPrioritaria: resumo.acaoPrioritaria ?? null,
        retorno: resumo.retorno,
        classificacao: resumo.classificacao,
        diagnosticoFinal: { ...resumo.diagnostico, mensagem: mensagemConfianca },
        insightPrincipal: resumo.diagnostico.insightPrincipal,
        penalidadesAplicadas: resumo.penalidadesAplicadas,
        impactoDecisoesRecentes: resumo.impactoDecisoesRecentes,
        patrimonioConsolidado: resumo.patrimonioConsolidado,
        patrimonio_consolidado: resumo.patrimonioConsolidado,
        pesosScoreProprietario: resumo.pesosProprietarios,
        pesos_score_proprietario: resumo.pesosProprietarios,
        scoreUnificado,
        score_unificado: scoreUnificado,
        scoreOficial: scoreUnificado,
        score_oficial: scoreUnificado,
        scoreHistorico: scoreHistoricoReal,
        score_historico: scoreHistoricoReal,
        confiancaDiagnostico,
        confianca_diagnostico: confiancaDiagnostico,
        atualizacaoMercado,
        atualizacao_mercado: atualizacaoMercado,
        dadosMercadoSessao: dadosMercadoSessaoLive,
        dados_mercado_sessao: dadosMercadoSessaoLive
      });
    } catch (error) {
      return {
        ok: false,
        status: 500,
        codigo: "ERRO_INSIGHTS_RESUMO",
        mensagem: "Falha ao gerar resumo de insights",
        detalhes: { message: error instanceof Error ? error.message : String(error) }
      };
    }
  }
  return null;
}
__name(handleInsightsRoutes, "handleInsightsRoutes");

// src/server/routes/perfil.routes.ts
var salvarPerfilSchema = external_exports.object({
  rendaMensal: external_exports.number().nonnegative(),
  gastoMensal: external_exports.number().nonnegative().optional(),
  aporteMensal: external_exports.number().nonnegative(),
  reservaCaixa: external_exports.number().nonnegative().optional(),
  horizonte: external_exports.string().min(2).max(100),
  perfilRisco: external_exports.string().min(2).max(50),
  objetivo: external_exports.string().min(2).max(120),
  frequenciaAporte: external_exports.string().min(2).max(50).optional(),
  experienciaInvestimentos: external_exports.string().min(2).max(80).optional(),
  toleranciaRiscoReal: external_exports.string().min(2).max(80).optional(),
  maturidade: external_exports.number().int().min(1).max(5)
});
var contextoFinanceiroSchema = external_exports.object({
  objetivoPrincipal: external_exports.string().optional(),
  objetivosSecundarios: external_exports.array(external_exports.string()).optional(),
  horizonte: external_exports.enum(["curto", "medio", "longo"]).optional(),
  dependentes: external_exports.boolean().optional(),
  faixaEtaria: external_exports.string().optional(),
  rendaMensal: external_exports.number().nonnegative().optional(),
  gastoMensal: external_exports.number().nonnegative().optional(),
  aporteMensal: external_exports.number().nonnegative().optional(),
  perfilRiscoDeclarado: external_exports.string().optional(),
  maturidadeInvestidor: external_exports.number().int().min(1).max(5).optional(),
  frequenciaAporte: external_exports.string().optional(),
  experienciaInvestimentos: external_exports.string().optional(),
  toleranciaRiscoReal: external_exports.string().optional(),
  patrimonioExterno: external_exports.object({
    imoveis: external_exports.array(external_exports.object({ id: external_exports.string().min(1), tipo: external_exports.string().min(1), valorEstimado: external_exports.number(), saldoFinanciamento: external_exports.number().optional(), geraRenda: external_exports.boolean().optional() })).default([]),
    veiculos: external_exports.array(external_exports.object({ id: external_exports.string().min(1), tipo: external_exports.string().min(1), valorEstimado: external_exports.number(), quitado: external_exports.boolean().optional() })).default([]),
    poupanca: external_exports.number().default(0),
    caixaDisponivel: external_exports.number().default(0)
  }).default({ imoveis: [], veiculos: [], poupanca: 0, caixaDisponivel: 0 }),
  dividas: external_exports.array(external_exports.object({ id: external_exports.string().min(1), tipo: external_exports.string().min(1), saldoDevedor: external_exports.number(), parcelaMensal: external_exports.number().optional() })).default([])
});
var preferenciasUsuarioSchema = external_exports.object({
  tema: external_exports.enum(["light", "dark"]).optional(),
  ocultarValores: external_exports.boolean().optional()
});
async function handlePerfilRoutes(pathname, request, env, sessao) {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/perfil")) return null;
  const userId = sessao.usuario.id;
  const perfilService = new ServicoPerfilPadrao(new RepositorioPerfilD1(env.DB));
  if (pathname === "/api/perfil" && request.method === "GET") {
    return sucesso(await perfilService.obterPerfil(userId));
  }
  if (pathname === "/api/perfil" && request.method === "PUT") {
    const body = salvarPerfilSchema.parse(await parseJsonBody2(request));
    const existente = await perfilService.obterPerfil(userId);
    const payload = {
      id: existente?.id ?? `perf_${userId}`,
      usuarioId: userId,
      rendaMensal: body.rendaMensal,
      gastoMensal: body.gastoMensal ?? existente?.gastoMensal ?? 0,
      aporteMensal: body.aporteMensal,
      reservaCaixa: body.reservaCaixa ?? existente?.reservaCaixa ?? 0,
      horizonte: body.horizonte,
      perfilRisco: body.perfilRisco,
      objetivo: body.objetivo,
      frequenciaAporte: body.frequenciaAporte ?? existente?.frequenciaAporte ?? "",
      experienciaInvestimentos: body.experienciaInvestimentos ?? existente?.experienciaInvestimentos ?? "",
      toleranciaRiscoReal: body.toleranciaRiscoReal ?? existente?.toleranciaRiscoReal ?? "",
      maturidade: body.maturidade
    };
    return sucesso(await perfilService.salvarPerfil(payload));
  }
  if (pathname === "/api/perfil/contexto" && request.method === "GET") {
    return sucesso(await perfilService.obterContextoFinanceiro(userId));
  }
  if (pathname === "/api/perfil/contexto" && request.method === "PUT") {
    const body = contextoFinanceiroSchema.parse(await parseJsonBody2(request));
    const poupancaNormalizada = Number(body.patrimonioExterno?.poupanca ?? body.patrimonioExterno?.caixaDisponivel ?? 0);
    return sucesso(
      await perfilService.salvarContextoFinanceiro({
        usuarioId: userId,
        ...body,
        patrimonioExterno: { ...body.patrimonioExterno, poupanca: poupancaNormalizada, caixaDisponivel: poupancaNormalizada }
      })
    );
  }
  if (pathname === "/api/perfil/plataformas" && request.method === "GET") {
    return sucesso(await perfilService.listarPlataformas(userId));
  }
  if (pathname === "/api/perfil/preferencias" && request.method === "GET") {
    const row = await env.DB.prepare("SELECT tema, ocultar_valores, atualizado_em FROM preferencias_usuario WHERE usuario_id = ? LIMIT 1").bind(userId).first();
    return sucesso({
      tema: row?.tema === "dark" ? "dark" : "light",
      ocultarValores: row?.ocultar_valores === 1,
      atualizadoEm: row?.atualizado_em ?? null
    });
  }
  if (pathname === "/api/perfil/preferencias" && request.method === "PUT") {
    const body = preferenciasUsuarioSchema.parse(await parseJsonBody2(request));
    const existente = await env.DB.prepare("SELECT tema, ocultar_valores FROM preferencias_usuario WHERE usuario_id = ? LIMIT 1").bind(userId).first();
    const temaFinal = body.tema ?? (existente?.tema === "dark" ? "dark" : "light");
    const ocultarValoresFinal = body.ocultarValores ?? existente?.ocultar_valores === 1;
    const agora = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      [
        "INSERT INTO preferencias_usuario (id, usuario_id, tema, ocultar_valores, atualizado_em)",
        "VALUES (?, ?, ?, ?, ?)",
        "ON CONFLICT(usuario_id) DO UPDATE SET",
        "tema = excluded.tema,",
        "ocultar_valores = excluded.ocultar_valores,",
        "atualizado_em = excluded.atualizado_em"
      ].join(" ")
    ).bind(`pref_${userId}`, userId, temaFinal, ocultarValoresFinal ? 1 : 0, agora).run();
    return sucesso({
      tema: temaFinal,
      ocultarValores: ocultarValoresFinal,
      atualizadoEm: agora
    });
  }
  return null;
}
__name(handlePerfilRoutes, "handlePerfilRoutes");

// src/server/routes/historico.routes.ts
var TAMANHO_LOTE_RECONSTRUCAO = 6;
var construirServicoHistoricoMensal = /* @__PURE__ */ __name((env) => new ServicoHistoricoMensalPadrao(new RepositorioHistoricoMensalD1(env.DB)), "construirServicoHistoricoMensal");
async function handleHistoricoRoutes(pathname, request, env, sessao, ctx) {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/historico")) return null;
  const userId = sessao.usuario.id;
  const historicoService = new ServicoHistoricoPadrao(new RepositorioHistoricoD1(env.DB));
  if (pathname === "/api/historico/snapshots" && request.method === "GET") {
    const url = new URL(request.url);
    const limite = Number.parseInt(url.searchParams.get("limite") ?? "12", 10);
    return sucesso(await historicoService.listarSnapshots(userId, Number.isNaN(limite) ? 12 : limite));
  }
  if (pathname === "/api/historico/eventos" && request.method === "GET") {
    const url = new URL(request.url);
    const limite = Number.parseInt(url.searchParams.get("limite") ?? "12", 10);
    return sucesso(await historicoService.listarEventos(userId, Number.isNaN(limite) ? 12 : limite));
  }
  if (pathname === "/api/historico/mensal" && request.method === "GET") {
    const url = new URL(request.url);
    const limite = Number.parseInt(url.searchParams.get("limite") ?? "24", 10);
    const servico = construirServicoHistoricoMensal(env);
    const pontos = await servico.listarPontos(userId, Number.isNaN(limite) ? 24 : limite);
    if (pontos.length === 0 && ctx) {
      const servicoReconstrucao = construirServicoReconstrucao(env);
      ctx.waitUntil(
        (async () => {
          try {
            const estado = await servicoReconstrucao.obterEstado(userId);
            if (!estado) {
              await servicoReconstrucao.enfileirar(userId);
              await servicoReconstrucao.processarProximoLote(userId, TAMANHO_LOTE_RECONSTRUCAO);
            } else if (estado.status === "pendente" || estado.status === "processando") {
              await servicoReconstrucao.processarProximoLote(userId, TAMANHO_LOTE_RECONSTRUCAO);
            }
          } catch {
          }
        })()
      );
    }
    return sucesso({ pontos });
  }
  if (pathname.startsWith("/api/historico/mensal/") && request.method === "GET") {
    const anoMes = pathname.replace("/api/historico/mensal/", "");
    if (!/^\d{4}-\d{2}$/.test(anoMes)) {
      return erro("ANO_MES_INVALIDO", "Formato esperado: YYYY-MM", 422);
    }
    const servico = construirServicoHistoricoMensal(env);
    const ponto = await servico.obterMes(userId, anoMes);
    if (!ponto) return erro("MES_NAO_ENCONTRADO", "Sem dados para o m\xEAs informado", 404);
    return sucesso(ponto);
  }
  if (pathname === "/api/historico/reconstrucao" && request.method === "GET") {
    const servico = construirServicoReconstrucao(env);
    const estado = await servico.obterEstado(userId);
    return sucesso(estado);
  }
  if (pathname === "/api/historico/reconstrucao" && request.method === "POST") {
    const servico = construirServicoReconstrucao(env);
    const estado = await servico.enfileirar(userId);
    if (ctx) {
      ctx.waitUntil(
        servico.processarProximoLote(userId, TAMANHO_LOTE_RECONSTRUCAO).then(() => void 0).catch(() => void 0)
      );
    }
    return sucesso(estado);
  }
  if (pathname === "/api/historico/reconstrucao/processar" && request.method === "POST") {
    const servico = construirServicoReconstrucao(env);
    const estado = await servico.processarProximoLote(userId, TAMANHO_LOTE_RECONSTRUCAO);
    return sucesso(estado);
  }
  return null;
}
__name(handleHistoricoRoutes, "handleHistoricoRoutes");

// src/server/routes/posicoes.routes.ts
var posicaoSchema = external_exports.object({
  tipo: external_exports.enum(["investimento", "caixa", "poupanca", "cofrinho", "imovel", "veiculo", "divida"]),
  nome: external_exports.string().min(2),
  valorAtual: external_exports.number(),
  custoAquisicao: external_exports.number().optional(),
  liquidez: external_exports.enum(["imediata", "curto_prazo", "medio_prazo", "baixa"]),
  risco: external_exports.enum(["baixo", "medio", "alto"]),
  categoria: external_exports.string().min(2),
  metadata: external_exports.record(external_exports.unknown()).optional()
});
async function handlePosicoesRoutes(pathname, request, env, sessao) {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/posicoes")) return null;
  const userId = sessao.usuario.id;
  if (pathname === "/api/posicoes" && request.method === "GET") {
    const rows = await env.DB.prepare("SELECT id, usuario_id, tipo, nome, valor_atual, custo_aquisicao, liquidez, risco, categoria, metadata_json, criado_em, atualizado_em FROM posicoes_financeiras WHERE usuario_id = ? AND ativo = 1 ORDER BY atualizado_em DESC").bind(userId).all();
    const dados = (rows.results ?? []).map((row) => ({
      id: String(row.id),
      usuarioId: String(row.usuario_id),
      tipo: row.tipo,
      nome: String(row.nome),
      valorAtual: Number(row.valor_atual ?? 0),
      custoAquisicao: typeof row.custo_aquisicao === "number" ? row.custo_aquisicao : void 0,
      liquidez: row.liquidez,
      risco: row.risco,
      categoria: String(row.categoria),
      metadata: row.metadata_json ? JSON.parse(String(row.metadata_json)) : {},
      criadoEm: String(row.criado_em),
      atualizadoEm: String(row.atualizado_em)
    }));
    return sucesso(dados);
  }
  if (pathname === "/api/posicoes" && request.method === "POST") {
    const body = posicaoSchema.parse(await parseJsonBody2(request));
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare("INSERT INTO posicoes_financeiras (id, usuario_id, tipo, nome, valor_atual, custo_aquisicao, liquidez, risco, categoria, metadata_json, ativo, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)").bind(id, userId, body.tipo, body.nome, body.valorAtual, body.custoAquisicao ?? null, body.liquidez, body.risco, body.categoria, JSON.stringify(body.metadata ?? {}), now, now).run();
    return sucesso({ id, usuarioId: userId, ...body, criadoEm: now, atualizadoEm: now });
  }
  if (pathname.startsWith("/api/posicoes/") && request.method === "PUT") {
    const id = pathname.replace("/api/posicoes/", "");
    const body = posicaoSchema.partial().parse(await parseJsonBody2(request));
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare([
      "UPDATE posicoes_financeiras SET",
      "tipo = COALESCE(?, tipo), nome = COALESCE(?, nome), valor_atual = COALESCE(?, valor_atual),",
      "custo_aquisicao = COALESCE(?, custo_aquisicao), liquidez = COALESCE(?, liquidez),",
      "risco = COALESCE(?, risco), categoria = COALESCE(?, categoria), metadata_json = COALESCE(?, metadata_json), atualizado_em = ?",
      "WHERE id = ? AND usuario_id = ? AND ativo = 1"
    ].join(" ")).bind(
      body.tipo ?? null,
      body.nome ?? null,
      typeof body.valorAtual === "number" ? body.valorAtual : null,
      typeof body.custoAquisicao === "number" ? body.custoAquisicao : null,
      body.liquidez ?? null,
      body.risco ?? null,
      body.categoria ?? null,
      body.metadata ? JSON.stringify(body.metadata) : null,
      now,
      id,
      userId
    ).run();
    return sucesso({ atualizado: true });
  }
  if (pathname.startsWith("/api/posicoes/") && request.method === "DELETE") {
    const id = pathname.replace("/api/posicoes/", "");
    await env.DB.prepare("UPDATE posicoes_financeiras SET ativo = 0, atualizado_em = ? WHERE id = ? AND usuario_id = ?").bind((/* @__PURE__ */ new Date()).toISOString(), id, userId).run();
    return sucesso({ removido: true });
  }
  return null;
}
__name(handlePosicoesRoutes, "handlePosicoesRoutes");

// src/server/routes/aportes.routes.ts
var aporteSchema = external_exports.object({
  ativoId: external_exports.string().uuid().nullable().optional(),
  valor: external_exports.number().positive(),
  dataAporte: external_exports.string().min(10),
  origem: external_exports.enum(["manual", "importacao", "integracao"]).optional(),
  observacao: external_exports.string().max(500).optional()
});
var serializar = /* @__PURE__ */ __name((row) => ({
  id: row.id,
  usuarioId: row.usuario_id,
  ativoId: row.ativo_id,
  valor: Number(row.valor),
  dataAporte: row.data_aporte,
  origem: row.origem,
  observacao: row.observacao,
  criadoEm: row.criado_em
}), "serializar");
async function handleAportesRoutes(pathname, request, env, sessao) {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/aportes")) return null;
  const userId = sessao.usuario.id;
  if (pathname === "/api/aportes" && request.method === "GET") {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);
    const rows = await env.DB.prepare(
      "SELECT id, usuario_id, ativo_id, valor, data_aporte, origem, observacao, criado_em FROM aportes WHERE usuario_id = ? ORDER BY data_aporte DESC LIMIT ?"
    ).bind(userId, limit).all();
    return sucesso((rows.results ?? []).map(serializar));
  }
  if (pathname === "/api/aportes/resumo" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT COUNT(*) AS total, COUNT(DISTINCT substr(data_aporte, 1, 7)) AS meses_distintos_6m, COALESCE(SUM(valor), 0) AS valor_total_6m FROM aportes WHERE usuario_id = ? AND date(data_aporte) >= date('now', '-6 months')"
    ).bind(userId).first();
    return sucesso({
      total: Number(rows?.total ?? 0),
      mesesDistintos6m: Number(rows?.meses_distintos_6m ?? 0),
      valorTotal6m: Number(rows?.valor_total_6m ?? 0)
    });
  }
  if (pathname === "/api/aportes" && request.method === "POST") {
    const body = aporteSchema.parse(await parseJsonBody2(request));
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      "INSERT INTO aportes (id, usuario_id, ativo_id, valor, data_aporte, origem, observacao, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id,
      userId,
      body.ativoId ?? null,
      body.valor,
      body.dataAporte,
      body.origem ?? "manual",
      body.observacao ?? null,
      now
    ).run();
    return sucesso({
      id,
      usuarioId: userId,
      ativoId: body.ativoId ?? null,
      valor: body.valor,
      dataAporte: body.dataAporte,
      origem: body.origem ?? "manual",
      observacao: body.observacao ?? null,
      criadoEm: now
    });
  }
  if (pathname.startsWith("/api/aportes/") && request.method === "DELETE") {
    const id = pathname.replace("/api/aportes/", "");
    const result = await env.DB.prepare("DELETE FROM aportes WHERE id = ? AND usuario_id = ?").bind(id, userId).run();
    return sucesso({ removido: (result.meta?.changes ?? 0) > 0 });
  }
  return null;
}
__name(handleAportesRoutes, "handleAportesRoutes");

// ../modulos-backend/decisoes/src/repositorio.ts
var parseJson = /* @__PURE__ */ __name((raw) => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}, "parseJson");
var parseNumericJson = /* @__PURE__ */ __name((raw) => {
  const parsed = parseJson(raw);
  const out = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
  }
  return out;
}, "parseNumericJson");
var RepositorioDecisoesD1 = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "RepositorioDecisoesD1");
  }
  async obterContextoScore(usuarioId) {
    const row = await this.db.prepare("SELECT score, blocos_json FROM snapshots_score WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 1").bind(usuarioId).first();
    const pilares = parseNumericJson(row?.blocos_json ?? null);
    const scoreAtual = typeof row?.score === "number" ? row.score : 65;
    return { scoreAtual, pilares };
  }
  async obterParametrosPorChaves(chaves) {
    if (!chaves.length) return {};
    const placeholders = chaves.map(() => "?").join(", ");
    const rows = await this.db.prepare(`SELECT chave, valor_json FROM simulacoes_parametros WHERE ativo = 1 AND chave IN (${placeholders}) ORDER BY chave ASC`).bind(...chaves).all();
    const out = {};
    for (const row of rows.results ?? []) {
      out[row.chave] = parseJson(row.valor_json ?? null);
    }
    return out;
  }
  async obterParametrosAtivos() {
    const rows = await this.db.prepare("SELECT chave, valor_json FROM simulacoes_parametros WHERE ativo = 1 ORDER BY chave ASC").all();
    const out = {};
    for (const row of rows.results ?? []) {
      out[row.chave] = parseJson(row.valor_json ?? null);
    }
    return out;
  }
  async salvar(simulacao) {
    await this.db.prepare(
      [
        "INSERT INTO simulacoes",
        "(id, usuario_id, tipo, nome, status, score_atual, score_projetado, delta_score, diagnostico_titulo, diagnostico_descricao, diagnostico_acao, resumo_curto, premissas_json, resultado_json, metadata_json, criado_em, atualizado_em, salvo_em)",
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ].join(" ")
    ).bind(
      simulacao.id,
      simulacao.usuarioId,
      simulacao.tipo,
      simulacao.nome,
      simulacao.status,
      simulacao.scoreAtual ?? null,
      simulacao.scoreProjetado ?? null,
      simulacao.deltaScore ?? null,
      simulacao.diagnosticoTitulo ?? null,
      simulacao.diagnosticoDescricao ?? null,
      simulacao.diagnosticoAcao ?? null,
      simulacao.resumoCurto ?? null,
      JSON.stringify(simulacao.premissas ?? {}),
      JSON.stringify(simulacao.resultado ?? {}),
      JSON.stringify(simulacao.metadata ?? {}),
      simulacao.criadoEm,
      simulacao.atualizadoEm,
      simulacao.salvoEm ?? null
    ).run();
  }
  async atualizar(simulacao) {
    await this.db.prepare(
      [
        "UPDATE simulacoes",
        "SET nome = ?, status = ?, score_atual = ?, score_projetado = ?, delta_score = ?,",
        "diagnostico_titulo = ?, diagnostico_descricao = ?, diagnostico_acao = ?, resumo_curto = ?,",
        "premissas_json = ?, resultado_json = ?, metadata_json = ?, atualizado_em = ?, salvo_em = ?",
        "WHERE id = ? AND usuario_id = ?"
      ].join(" ")
    ).bind(
      simulacao.nome,
      simulacao.status,
      simulacao.scoreAtual ?? null,
      simulacao.scoreProjetado ?? null,
      simulacao.deltaScore ?? null,
      simulacao.diagnosticoTitulo ?? null,
      simulacao.diagnosticoDescricao ?? null,
      simulacao.diagnosticoAcao ?? null,
      simulacao.resumoCurto ?? null,
      JSON.stringify(simulacao.premissas ?? {}),
      JSON.stringify(simulacao.resultado ?? {}),
      JSON.stringify(simulacao.metadata ?? {}),
      simulacao.atualizadoEm,
      simulacao.salvoEm ?? null,
      simulacao.id,
      simulacao.usuarioId
    ).run();
  }
  async listar(usuarioId) {
    const rows = await this.db.prepare(
      "SELECT id, usuario_id, tipo, nome, status, score_atual, score_projetado, delta_score, diagnostico_titulo, diagnostico_descricao, diagnostico_acao, resumo_curto, premissas_json, resultado_json, metadata_json, criado_em, atualizado_em, salvo_em FROM simulacoes WHERE usuario_id = ? ORDER BY atualizado_em DESC"
    ).bind(usuarioId).all();
    return (rows.results ?? []).map((row) => this.mapRow(row));
  }
  async obter(usuarioId, simulacaoId) {
    const row = await this.db.prepare(
      "SELECT id, usuario_id, tipo, nome, status, score_atual, score_projetado, delta_score, diagnostico_titulo, diagnostico_descricao, diagnostico_acao, resumo_curto, premissas_json, resultado_json, metadata_json, criado_em, atualizado_em, salvo_em FROM simulacoes WHERE usuario_id = ? AND id = ? LIMIT 1"
    ).bind(usuarioId, simulacaoId).first();
    return row ? this.mapRow(row) : null;
  }
  async listarHistorico(simulacaoId) {
    const rows = await this.db.prepare(
      "SELECT id, simulacao_id, versao, premissas_json, resultado_json, diagnostico_json, criado_em, criado_por FROM simulacoes_historico WHERE simulacao_id = ? ORDER BY versao DESC"
    ).bind(simulacaoId).all();
    return (rows.results ?? []).map((row) => ({
      id: row.id,
      simulacaoId: row.simulacao_id,
      versao: row.versao,
      premissas: parseJson(row.premissas_json),
      resultado: parseJson(row.resultado_json),
      diagnostico: parseJson(row.diagnostico_json),
      criadoEm: row.criado_em,
      criadoPor: row.criado_por
    }));
  }
  async salvarHistorico(simulacaoId, payload) {
    const versaoAtual = await this.db.prepare("SELECT COALESCE(MAX(versao), 0) as versao FROM simulacoes_historico WHERE simulacao_id = ?").bind(simulacaoId).first();
    const versao = (versaoAtual?.versao ?? 0) + 1;
    await this.db.prepare(
      [
        "INSERT INTO simulacoes_historico (id, simulacao_id, versao, premissas_json, resultado_json, diagnostico_json, criado_em, criado_por)",
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ].join(" ")
    ).bind(
      crypto.randomUUID(),
      simulacaoId,
      versao,
      JSON.stringify(payload.premissas ?? {}),
      JSON.stringify(payload.resultado ?? {}),
      JSON.stringify(payload.diagnostico ?? {}),
      (/* @__PURE__ */ new Date()).toISOString(),
      payload.criadoPor
    ).run();
  }
  mapRow(row) {
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      tipo: row.tipo,
      nome: row.nome,
      status: row.status,
      scoreAtual: typeof row.score_atual === "number" ? row.score_atual : void 0,
      scoreProjetado: typeof row.score_projetado === "number" ? row.score_projetado : void 0,
      deltaScore: typeof row.delta_score === "number" ? row.delta_score : void 0,
      diagnosticoTitulo: row.diagnostico_titulo ?? void 0,
      diagnosticoDescricao: row.diagnostico_descricao ?? void 0,
      diagnosticoAcao: row.diagnostico_acao ?? void 0,
      resumoCurto: row.resumo_curto ?? void 0,
      premissas: parseJson(row.premissas_json),
      resultado: parseJson(row.resultado_json),
      metadata: parseJson(row.metadata_json),
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em,
      salvoEm: row.salvo_em ?? void 0
    };
  }
};

// ../modulos-backend/decisoes/src/servico.ts
var asNum = /* @__PURE__ */ __name((v, fallback = 0) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const parsed = Number.parseFloat(v.replace(".", "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}, "asNum");
var moeda = /* @__PURE__ */ __name((valor) => `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "moeda");
var pct = /* @__PURE__ */ __name((valor) => `${valor.toFixed(2)}%`, "pct");
var DecisionImpactServicePadrao = class {
  static {
    __name(this, "DecisionImpactServicePadrao");
  }
  calcularImpacto({ tipo, premissas, resultado, contexto }) {
    let delta = 0;
    let regraDominante = "impacto_neutro";
    if (tipo === "imovel") {
      const entrada = asNum(premissas.entrada);
      const liquidez = asNum(premissas.liquidezAtual || premissas.reservaDisponivel);
      const comprometeLiquidez = liquidez > 0 && entrada / liquidez > 0.7;
      delta += comprometeLiquidez ? -7 : 3;
      regraDominante = comprometeLiquidez ? "liquidez_pressionada" : "liquidez_preservada";
    }
    if (tipo === "carro") {
      const depreciacao = asNum(premissas.depreciacaoAnual, 0.15);
      const custoMensal = asNum((resultado.cenarioA.find((c) => c.label.toLowerCase().includes("custo real mensal"))?.value ?? "0").replace(/[R$\s.]/g, "").replace(",", "."));
      const renda = asNum(premissas.rendaMensal, 0);
      const pressaoRenda = renda > 0 ? custoMensal / renda : 0;
      if (depreciacao > 0.15 || pressaoRenda > 0.25) {
        delta -= 5;
        regraDominante = "veiculo_acima_da_capacidade";
      } else {
        delta += 1;
        regraDominante = "veiculo_compat\xEDvel";
      }
    }
    if (tipo === "reserva_ou_financiar") {
      const reserva = asNum(premissas.reservaDisponivel);
      const valor = asNum(premissas.valorCompra);
      const usaReservaDemais = reserva > 0 && valor / reserva > 0.8;
      delta += usaReservaDemais ? -6 : 2;
      regraDominante = usaReservaDemais ? "uso_excessivo_reserva" : "seguranca_financeira";
    }
    if (tipo === "gastar_ou_investir") {
      const valor = asNum(premissas.valor);
      const prazo = Math.max(1, asNum(premissas.prazoAnos || premissas.prazo, 5));
      const retorno = asNum(premissas.retornoEsperado, 0.1);
      const futuro = valor * Math.pow(1 + retorno, prazo);
      if (futuro > valor * 1.6) {
        delta += 4;
        regraDominante = "priorizar_investimento";
      } else {
        delta -= 1;
        regraDominante = "ganho_limitado";
      }
    }
    const scoreProjetado = Math.max(0, Math.min(100, Math.round(contexto.scoreAtual + delta)));
    const dist = this.distribuirDelta(delta);
    return {
      scoreAtual: contexto.scoreAtual,
      scoreProjetado,
      delta: scoreProjetado - contexto.scoreAtual,
      pilares: {
        estrategiaCarteira: dist.estrategiaCarteira,
        comportamentoFinanceiro: dist.comportamentoFinanceiro,
        estruturaPatrimonial: dist.estruturaPatrimonial,
        adequacaoMomentoVida: dist.adequacaoMomentoVida
      },
      regraDominante
    };
  }
  distribuirDelta(delta) {
    if (delta === 0) return { estrategiaCarteira: 0, comportamentoFinanceiro: 0, estruturaPatrimonial: 0, adequacaoMomentoVida: 0 };
    const estrutura = Math.trunc(delta * 0.4);
    const comportamento = Math.trunc(delta * 0.3);
    const adequacao = Math.trunc(delta * 0.2);
    const estrategia = delta - estrutura - comportamento - adequacao;
    return {
      estrategiaCarteira: estrategia,
      comportamentoFinanceiro: comportamento,
      estruturaPatrimonial: estrutura,
      adequacaoMomentoVida: adequacao
    };
  }
};
var ServicoDecisoesPadrao = class {
  constructor(repositorio, impactoService) {
    this.repositorio = repositorio;
    this.impactoService = impactoService ?? new DecisionImpactServicePadrao();
  }
  static {
    __name(this, "ServicoDecisoesPadrao");
  }
  impactoService;
  async calcular(usuarioId, entrada) {
    const premissas = entrada.premissas ?? {};
    const [contexto, parametros] = await Promise.all([
      this.repositorio.obterContextoScore(usuarioId),
      this.repositorio.obterParametrosAtivos()
    ]);
    const resultado = this.calcularPorTipo(entrada.tipo, premissas, parametros);
    const impacto = this.impactoService.calcularImpacto({
      tipo: entrada.tipo,
      premissas,
      resultado,
      contexto
    });
    return {
      ...resultado,
      impactoScore: impacto
    };
  }
  async salvar(usuarioId, entrada) {
    const resultado = await this.calcular(usuarioId, entrada);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const id = crypto.randomUUID();
    const simulacao = {
      id,
      usuarioId,
      tipo: entrada.tipo,
      nome: entrada.nome || `Simula\xE7\xE3o ${entrada.tipo}`,
      status: "salva",
      scoreAtual: resultado.impactoScore.scoreAtual,
      scoreProjetado: resultado.impactoScore.scoreProjetado,
      deltaScore: resultado.impactoScore.delta,
      diagnosticoTitulo: resultado.diagnostico.titulo,
      diagnosticoDescricao: resultado.diagnostico.descricao,
      diagnosticoAcao: resultado.diagnostico.acao,
      resumoCurto: `${resultado.diagnostico.titulo} (${resultado.impactoScore.delta >= 0 ? "+" : ""}${resultado.impactoScore.delta} pts)`,
      premissas: entrada.premissas,
      resultado,
      metadata: { regraDominante: resultado.impactoScore.regraDominante, pilares: resultado.impactoScore.pilares },
      criadoEm: now,
      atualizadoEm: now,
      salvoEm: now
    };
    await this.repositorio.salvar({ ...simulacao });
    await this.repositorio.salvarHistorico(id, {
      premissas: simulacao.premissas,
      resultado: simulacao.resultado,
      diagnostico: resultado.diagnostico,
      criadoPor: usuarioId
    });
    return simulacao;
  }
  async listar(usuarioId) {
    return this.repositorio.listar(usuarioId);
  }
  async obter(usuarioId, simulacaoId) {
    return this.repositorio.obter(usuarioId, simulacaoId);
  }
  async recalcular(usuarioId, simulacaoId) {
    const atual = await this.repositorio.obter(usuarioId, simulacaoId);
    if (!atual) return null;
    const calculado = await this.calcular(usuarioId, {
      tipo: atual.tipo,
      nome: atual.nome,
      premissas: atual.premissas
    });
    const atualizado = {
      ...atual,
      scoreAtual: calculado.impactoScore.scoreAtual,
      scoreProjetado: calculado.impactoScore.scoreProjetado,
      deltaScore: calculado.impactoScore.delta,
      diagnosticoTitulo: calculado.diagnostico.titulo,
      diagnosticoDescricao: calculado.diagnostico.descricao,
      diagnosticoAcao: calculado.diagnostico.acao,
      resumoCurto: `${calculado.diagnostico.titulo} (${calculado.impactoScore.delta >= 0 ? "+" : ""}${calculado.impactoScore.delta} pts)`,
      resultado: calculado,
      metadata: { regraDominante: calculado.impactoScore.regraDominante, pilares: calculado.impactoScore.pilares },
      atualizadoEm: (/* @__PURE__ */ new Date()).toISOString(),
      salvoEm: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.repositorio.atualizar(atualizado);
    await this.repositorio.salvarHistorico(simulacaoId, {
      premissas: atualizado.premissas,
      resultado: atualizado.resultado,
      diagnostico: calculado.diagnostico,
      criadoPor: usuarioId
    });
    return atualizado;
  }
  async duplicar(usuarioId, simulacaoId) {
    const atual = await this.repositorio.obter(usuarioId, simulacaoId);
    if (!atual) return null;
    return this.salvar(usuarioId, {
      tipo: atual.tipo,
      nome: `${atual.nome} (c\xF3pia)`,
      premissas: atual.premissas
    });
  }
  async listarHistorico(usuarioId, simulacaoId) {
    const simulacao = await this.repositorio.obter(usuarioId, simulacaoId);
    if (!simulacao) return [];
    return this.repositorio.listarHistorico(simulacaoId);
  }
  async obterPremissasMercado(tipo) {
    const chavesPorTipo = {
      imovel: ["imovel_juros_padrao", "imovel_itbi_padrao", "imovel_manutencao_padrao", "imovel_valorizacao_padrao", "reajuste_aluguel_padrao", "retorno_investimento_padrao"],
      carro: ["carro_juros_padrao", "carro_seguro_pct_padrao", "carro_manutencao_pct_padrao", "carro_combustivel_km_padrao", "carro_consumo_padrao", "carro_combustivel_preco_padrao", "carro_depreciacao_padrao"],
      reserva_ou_financiar: ["credito_juros_padrao", "retorno_investimento_padrao"],
      gastar_ou_investir: ["retorno_investimento_padrao"],
      livre: []
    };
    const chaves = chavesPorTipo[tipo] ?? [];
    if (!chaves.length) return { tipo, premissas: [] };
    const params = await this.repositorio.obterParametrosPorChaves(chaves);
    const premissas = chaves.filter((c) => params[c]).map((chave) => {
      const p = params[chave];
      const valor = asNum(p.valor);
      return {
        chave,
        label: typeof p.label === "string" ? p.label : String(valor),
        valor,
        valorFormatado: typeof p.label === "string" ? p.label : String(valor),
        fonte: typeof p.fonte === "string" ? p.fonte : ""
      };
    });
    return { tipo, premissas };
  }
  calcularPorTipo(tipo, premissas, parametros) {
    if (tipo === "imovel") return this.calcularImovel(premissas, parametros);
    if (tipo === "carro") return this.calcularCarro(premissas, parametros);
    if (tipo === "reserva_ou_financiar") return this.calcularReservaFinanciamento(premissas, parametros);
    if (tipo === "gastar_ou_investir") return this.calcularGastarInvestir(premissas, parametros);
    return this.calcularLivre(premissas);
  }
  calcularImovel(p, parametros) {
    const valorizacaoPadrao = asNum(parametros.imovel_valorizacao_padrao?.valor, 0.06);
    const reajustePadrao = asNum(parametros.reajuste_aluguel_padrao?.valor, 0.06);
    const retornoPadrao = asNum(parametros.retorno_investimento_padrao?.valor, 0.1);
    const valorImovel = asNum(p.valorImovel);
    const entrada = asNum(p.entrada);
    const prazo = Math.max(12, asNum(p.prazoMeses || p.prazo, 360));
    const jurosAa = asNum(p.jurosAnual, 0.1);
    const doc = asNum(p.custosDocumentacao);
    const manutencao = asNum(p.manutencaoMensal);
    const valorizacao = asNum(p.valorizacaoAnual, valorizacaoPadrao);
    const aluguel = asNum(p.aluguelMensal);
    const reajuste = asNum(p.reajusteAluguelAnual, reajustePadrao);
    const retorno = asNum(p.retornoInvestimentoAnual, retornoPadrao);
    const financiado = Math.max(0, valorImovel - entrada);
    const jurosMensal = jurosAa / 12;
    const parcela = jurosMensal > 0 ? financiado * (jurosMensal * Math.pow(1 + jurosMensal, prazo)) / (Math.pow(1 + jurosMensal, prazo) - 1) : financiado / prazo;
    const custoCompraMensal = parcela + manutencao;
    const custoCompraTotal = custoCompraMensal * prazo + entrada + doc;
    const patrimonioCompra = valorImovel * Math.pow(1 + valorizacao, prazo / 12);
    const aluguelMedio = aluguel * (1 + reajuste * (prazo / 24));
    const custoAluguelTotal = aluguelMedio * prazo;
    const diferencaMensal = Math.max(0, custoCompraMensal - aluguelMedio);
    const investInicial = entrada + doc;
    const investMensal = diferencaMensal;
    const fatorMensal = retorno / 12;
    const investFinal = investInicial * Math.pow(1 + fatorMensal, prazo) + investMensal * ((Math.pow(1 + fatorMensal, prazo) - 1) / Math.max(fatorMensal, 1e-4));
    const alugarMelhor = investFinal > patrimonioCompra;
    const gap = Math.abs(investFinal - patrimonioCompra);
    return {
      cenarioA: [
        { label: "Custo mensal estimado", value: moeda(custoCompraMensal), description: "Parcela + manuten\xE7\xE3o" },
        { label: "Custo total projetado", value: moeda(custoCompraTotal), description: `Horizonte ${Math.round(prazo / 12)} anos` },
        { label: "Patrim\xF4nio projetado", value: moeda(patrimonioCompra), description: "Valor estimado do im\xF3vel" }
      ],
      cenarioB: [
        { label: "Custo mensal estimado", value: moeda(aluguelMedio), description: "Aluguel m\xE9dio reajustado" },
        { label: "Custo total projetado", value: moeda(custoAluguelTotal), description: `Horizonte ${Math.round(prazo / 12)} anos` },
        { label: "Patrim\xF4nio projetado", value: moeda(investFinal), description: "Entrada + diferen\xE7a investida" }
      ],
      diagnostico: {
        titulo: alugarMelhor ? "Alugar e investir tende a gerar mais valor l\xEDquido" : "Comprar tende a fechar melhor no horizonte informado",
        descricao: alugarMelhor ? `Impacto concreto: o cen\xE1rio de aluguel + investimento projeta ${moeda(gap)} a mais de patrim\xF4nio.` : `Impacto concreto: o cen\xE1rio de compra projeta ${moeda(gap)} a mais de patrim\xF4nio no prazo informado.`,
        acao: alugarMelhor ? "Se n\xE3o houver necessidade imediata de compra, preserve liquidez e reavalie em 12 meses." : "Siga para compra apenas se mantiver reserva m\xEDnima intacta ap\xF3s entrada e custos."
      }
    };
  }
  calcularCarro(p, parametros) {
    const depreciacaoPadrao = asNum(parametros.carro_depreciacao_padrao?.valor, 0.15);
    const retornoPadrao = asNum(parametros.retorno_investimento_padrao?.valor, 0.1);
    const valor = asNum(p.valorCarro || p.valor);
    const entrada = asNum(p.entrada);
    const prazo = Math.max(12, asNum(p.prazoMeses || p.prazo, 60));
    const jurosAa = asNum(p.jurosAnual, 0.16);
    const seguroAnual = asNum(p.seguroAnual);
    const manutencaoAnual = asNum(p.manutencaoAnual);
    const combustivelMensal = asNum(p.combustivelMensal);
    const depreciacaoAnual = asNum(p.depreciacaoAnual, depreciacaoPadrao);
    const retorno = asNum(p.retornoInvestimentoAnual, retornoPadrao);
    const financiado = Math.max(0, valor - entrada);
    const jurosMensal = jurosAa / 12;
    const parcela = jurosMensal > 0 ? financiado * (jurosMensal * Math.pow(1 + jurosMensal, prazo)) / (Math.pow(1 + jurosMensal, prazo) - 1) : financiado / prazo;
    const custoMensal = parcela + (seguroAnual + manutencaoAnual) / 12 + combustivelMensal;
    const custoTotal = custoMensal * prazo + entrada;
    const valorRevenda = valor * Math.pow(1 - depreciacaoAnual, prazo / 12);
    const custoOportunidade = valor * Math.pow(1 + retorno / 12, prazo) - valor;
    const investimentoFinal = valor * Math.pow(1 + retorno / 12, prazo);
    const investirMelhor = investimentoFinal > valorRevenda;
    return {
      cenarioA: [
        { label: "Custo real mensal", value: moeda(custoMensal), description: "Posse + opera\xE7\xE3o" },
        { label: "Custo total projetado", value: moeda(custoTotal), description: "Horizonte informado" },
        { label: "Valor de revenda", value: moeda(valorRevenda), description: "Ap\xF3s deprecia\xE7\xE3o" }
      ],
      cenarioB: [
        { label: "Capital investido", value: moeda(valor), description: "Valor da compra aplicado" },
        { label: "Patrim\xF4nio projetado", value: moeda(investimentoFinal), description: "Investimento alternativo" },
        { label: "Custo de oportunidade", value: moeda(custoOportunidade), description: "Ganho potencial" }
      ],
      diagnostico: {
        titulo: investirMelhor ? "Investir o capital tende a preservar mais patrim\xF4nio" : "Compra pode ser vi\xE1vel com custo controlado",
        descricao: investirMelhor ? `Impacto concreto: a compra custa ${moeda(custoMensal)}/m\xEAs e sacrifica ${moeda(custoOportunidade)} de oportunidade.` : `Impacto concreto: diferen\xE7a entre cen\xE1rios est\xE1 controlada para o prazo definido.`,
        acao: investirMelhor ? "Reavaliar faixa do ve\xEDculo ou ampliar entrada para reduzir drenagem mensal." : "Executar compra com teto de custo mensal e revis\xE3o anual."
      }
    };
  }
  calcularReservaFinanciamento(p, parametros) {
    const retornoPadrao = asNum(parametros.retorno_investimento_padrao?.valor, 0.1);
    const valor = asNum(p.valorCompra || p.valor);
    const reserva = asNum(p.reservaDisponivel);
    const reservaMin = asNum(p.reservaMinimaDesejada, reserva * 0.4);
    const jurosAa = asNum(p.jurosAnual, 0.18);
    const prazo = Math.max(12, asNum(p.prazoMeses || p.prazo, 48));
    const retorno = asNum(p.retornoInvestimentoAnual, retornoPadrao);
    const jurosMensal = jurosAa / 12;
    const parcela = jurosMensal > 0 ? valor * (jurosMensal * Math.pow(1 + jurosMensal, prazo)) / (Math.pow(1 + jurosMensal, prazo) - 1) : valor / prazo;
    const custoFinanciado = parcela * prazo;
    const reservaFinalVista = Math.max(0, reserva - valor);
    const reservaFinalFinanciando = reserva * Math.pow(1 + retorno / 12, prazo);
    const hibridoPagamento = Math.min(valor * 0.5, reserva * 0.5);
    const hibridoReserva = Math.max(0, reserva - hibridoPagamento);
    const usarReservaMelhor = reservaFinalVista >= reservaMin && valor < reserva * 0.7;
    return {
      cenarioA: [
        { label: "Custo total", value: moeda(valor), description: "Pagamento com reserva" },
        { label: "Liquidez final", value: moeda(reservaFinalVista), description: "Reserva remanescente" },
        { label: "Seguran\xE7a financeira", value: reservaFinalVista >= reservaMin ? "Adequada" : "Pressionada", description: "Comparado \xE0 reserva m\xEDnima" }
      ],
      cenarioB: [
        { label: "Custo total", value: moeda(custoFinanciado), description: "Incluindo juros" },
        { label: "Parcela mensal", value: moeda(parcela), description: "Fluxo de caixa" },
        { label: "Liquidez final", value: moeda(reservaFinalFinanciando), description: "Reserva investida" }
      ],
      diagnostico: {
        titulo: usarReservaMelhor ? "Usar reserva parcial reduz custo sem desmontar prote\xE7\xE3o" : "Financiar preserva melhor sua seguran\xE7a no curto prazo",
        descricao: usarReservaMelhor ? "Impacto concreto: voc\xEA elimina juros relevantes e mant\xE9m reserva acima do m\xEDnimo seguro." : "Impacto concreto: pagar \xE0 vista derruba sua liquidez para n\xEDvel de risco operacional.",
        acao: `Ajuste recomendado: cen\xE1rio h\xEDbrido com ${moeda(hibridoPagamento)} de entrada e reserva final em ${moeda(hibridoReserva)}.`
      }
    };
  }
  calcularGastarInvestir(p, parametros) {
    const retornoPadrao = asNum(parametros.retorno_investimento_padrao?.valor, 0.1);
    const valor = asNum(p.valor);
    const prazo = Math.max(1, asNum(p.prazoAnos || p.prazo, 5));
    const retorno = asNum(p.retornoEsperado, retornoPadrao);
    const futuro = valor * Math.pow(1 + retorno, prazo);
    const custoOportunidade = futuro - valor;
    const investirMelhor = custoOportunidade > valor * 0.3;
    return {
      cenarioA: [
        { label: "Valor da decis\xE3o", value: moeda(valor), description: "Consumo imediato" },
        { label: "Valor futuro", value: moeda(0), description: "Sem capital acumulado" },
        { label: "Liquidez", value: "Reduzida", description: "Sa\xEDda de caixa imediata" }
      ],
      cenarioB: [
        { label: "Valor investido", value: moeda(valor), description: "Aporte inicial" },
        { label: "Valor futuro", value: moeda(futuro), description: `Horizonte ${prazo} anos` },
        { label: "Ganho potencial", value: moeda(custoOportunidade), description: "Custo de oportunidade" }
      ],
      diagnostico: {
        titulo: investirMelhor ? "Investir agora protege melhor sua constru\xE7\xE3o patrimonial" : "Diferen\xE7a entre cen\xE1rios \xE9 moderada neste prazo",
        descricao: investirMelhor ? `Impacto concreto: consumir agora custa ${moeda(custoOportunidade)} em valor futuro potencial.` : "Impacto concreto: o ganho financeiro adicional \xE9 baixo para o horizonte escolhido.",
        acao: "Decida com base em urg\xEAncia real da compra e no efeito sobre sua reserva de seguran\xE7a."
      }
    };
  }
  calcularLivre(p) {
    const valorA = asNum(p.valorA || p.valor, 0);
    const valorB = asNum(p.valorB || p.valorAlternativo, valorA);
    const retornoA = asNum(p.retornoA, 0.04);
    const retornoB = asNum(p.retornoB, 0.08);
    const prazo = Math.max(1, asNum(p.prazoAnos || p.prazo, 3));
    const futuroA = valorA * Math.pow(1 + retornoA, prazo);
    const futuroB = valorB * Math.pow(1 + retornoB, prazo);
    return {
      cenarioA: [
        { label: "Valor inicial", value: moeda(valorA) },
        { label: "Retorno estimado", value: pct(retornoA * 100) },
        { label: "Valor projetado", value: moeda(futuroA), description: `${prazo} anos` }
      ],
      cenarioB: [
        { label: "Valor inicial", value: moeda(valorB) },
        { label: "Retorno estimado", value: pct(retornoB * 100) },
        { label: "Valor projetado", value: moeda(futuroB), description: `${prazo} anos` }
      ],
      diagnostico: {
        titulo: futuroB >= futuroA ? "Cen\xE1rio B apresenta melhor proje\xE7\xE3o" : "Cen\xE1rio A apresenta melhor proje\xE7\xE3o",
        descricao: "Impacto concreto: resultado comparativo orientado pelas premissas informadas manualmente.",
        acao: "Ajustar premissas cr\xEDticas e testar sensibilidade antes de decidir."
      }
    };
  }
};

// src/server/routes/decisoes.routes.ts
var simulacaoCalculoSchema = external_exports.object({
  tipo: external_exports.enum(["imovel", "carro", "reserva_ou_financiar", "gastar_ou_investir", "livre"]),
  nome: external_exports.string().min(2).optional(),
  premissas: external_exports.record(external_exports.unknown())
});
async function handleDecisoesRoutes(pathname, request, env, sessao) {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/decisoes")) return null;
  const userId = sessao.usuario.id;
  const decisoesService = new ServicoDecisoesPadrao(new RepositorioDecisoesD1(env.DB));
  if (pathname.startsWith("/api/decisoes/premissas/") && request.method === "GET") {
    const tipo = pathname.replace("/api/decisoes/premissas/", "");
    return sucesso(await decisoesService.obterPremissasMercado(tipo));
  }
  if (pathname === "/api/decisoes/simulacoes/calcular" && request.method === "POST") {
    const body = simulacaoCalculoSchema.parse(await parseJsonBody2(request));
    return sucesso(await decisoesService.calcular(userId, body));
  }
  if (pathname === "/api/decisoes/simulacoes" && request.method === "POST") {
    const body = simulacaoCalculoSchema.parse(await parseJsonBody2(request));
    return sucesso(await decisoesService.salvar(userId, body));
  }
  if (pathname === "/api/decisoes/simulacoes" && request.method === "GET") {
    return sucesso(await decisoesService.listar(userId));
  }
  if (pathname.startsWith("/api/decisoes/simulacoes/") && pathname.endsWith("/recalcular") && request.method === "POST") {
    const id = pathname.replace("/api/decisoes/simulacoes/", "").replace("/recalcular", "");
    const recalculado = await decisoesService.recalcular(userId, id);
    if (!recalculado) return erro("SIMULACAO_NAO_ENCONTRADA", "Simula\xE7\xE3o n\xE3o encontrada", 404);
    return sucesso(recalculado);
  }
  if (pathname.startsWith("/api/decisoes/simulacoes/") && pathname.endsWith("/duplicar") && request.method === "POST") {
    const id = pathname.replace("/api/decisoes/simulacoes/", "").replace("/duplicar", "");
    const duplicada = await decisoesService.duplicar(userId, id);
    if (!duplicada) return erro("SIMULACAO_NAO_ENCONTRADA", "Simula\xE7\xE3o n\xE3o encontrada", 404);
    return sucesso(duplicada);
  }
  if (pathname.startsWith("/api/decisoes/simulacoes/") && pathname.endsWith("/historico") && request.method === "GET") {
    const id = pathname.replace("/api/decisoes/simulacoes/", "").replace("/historico", "");
    return sucesso(await decisoesService.listarHistorico(userId, id));
  }
  if (pathname.startsWith("/api/decisoes/simulacoes/") && request.method === "GET") {
    const id = pathname.replace("/api/decisoes/simulacoes/", "");
    const simulacao = await decisoesService.obter(userId, id);
    if (!simulacao) return erro("SIMULACAO_NAO_ENCONTRADA", "Simula\xE7\xE3o n\xE3o encontrada", 404);
    return sucesso(simulacao);
  }
  return null;
}
__name(handleDecisoesRoutes, "handleDecisoesRoutes");

// src/server/routes/importacao.routes.ts
var uploadImportacaoCsvSchema = external_exports.object({
  nomeArquivo: external_exports.string().min(1),
  conteudo: external_exports.string().min(1),
  tipoArquivo: external_exports.literal("csv")
});
var itemXlsxSchema = external_exports.object({ aba: external_exports.enum(["acoes", "fundos", "imoveis", "veiculos", "poupanca"]), linha: external_exports.number().int().positive() }).passthrough();
var uploadImportacaoXlsxSchema = external_exports.object({
  nomeArquivo: external_exports.string().min(1),
  tipoArquivo: external_exports.literal("xlsx"),
  itens: external_exports.array(itemXlsxSchema).min(1)
});
var uploadImportacaoSchema = external_exports.union([uploadImportacaoCsvSchema, uploadImportacaoXlsxSchema]);
var confirmarImportacaoSchema = external_exports.object({
  itensValidos: external_exports.array(external_exports.number().int().positive())
});
async function handleImportacaoRoutes(pathname, request, env, sessao, ctx) {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/importacao")) return null;
  const userId = sessao.usuario.id;
  const importacaoService = new ServicoImportacaoPadrao({
    db: env.DB,
    repositorio: new RepositorioImportacaoD1(env.DB),
    parsers: [new ParserCsvGenerico()]
  });
  if (pathname === "/api/importacao/upload" && request.method === "POST") {
    const body = uploadImportacaoSchema.parse(await parseJsonBody2(request));
    if (body.tipoArquivo === "xlsx") {
      const preview2 = await importacaoService.gerarPreview({
        usuarioId: userId,
        nomeArquivo: body.nomeArquivo,
        tipoArquivo: "xlsx",
        itens: body.itens
      });
      return sucesso(preview2);
    }
    const preview = await importacaoService.gerarPreview({
      usuarioId: userId,
      nomeArquivo: body.nomeArquivo,
      conteudo: body.conteudo,
      tipoArquivo: "csv"
    });
    return sucesso(preview);
  }
  if (pathname.startsWith("/api/importacao/") && pathname.endsWith("/preview") && request.method === "GET") {
    const importacaoId = pathname.replace("/api/importacao/", "").replace("/preview", "");
    return sucesso(await importacaoService.obterPreview(importacaoId));
  }
  if (pathname.startsWith("/api/importacao/") && pathname.endsWith("/confirmar") && request.method === "POST") {
    const importacaoId = pathname.replace("/api/importacao/", "").replace("/confirmar", "");
    const body = confirmarImportacaoSchema.parse(await parseJsonBody2(request));
    const confirmacao = await importacaoService.confirmarImportacao(importacaoId, body.itensValidos);
    ctx.waitUntil(orquestrarPosEscritaCarteira(userId, env));
    return sucesso(confirmacao);
  }
  return null;
}
__name(handleImportacaoRoutes, "handleImportacaoRoutes");

// src/server/services/vera/core.ts
var DEFAULT_VERA_MODEL_PARAMS = {
  monthlyDebtServiceRate: 0.03,
  highInterestDebtWeight: 1.5,
  defaultEmergencyMonths: 6,
  expectedAnnualReturn: 0.07,
  goalFeasibility: { tightBelow: 1, unviableBelow: 0.7 },
  goalFeasibilityWhenNoContributionRequired: 1.5
};
var VeraCoreEngine = class {
  static {
    __name(this, "VeraCoreEngine");
  }
  params;
  constructor(params = {}) {
    this.params = {
      ...DEFAULT_VERA_MODEL_PARAMS,
      ...params,
      goalFeasibility: { ...DEFAULT_VERA_MODEL_PARAMS.goalFeasibility, ...params.goalFeasibility ?? {} }
    };
  }
  /**
   * DebtPressureScore (Sdp)
   * Sdp = (Monthly Debt Service / Monthly Income) + (High Interest Debt / Net Worth * phi)
   */
  calculateDebtPressure(profile) {
    const income = profile.income.value || 0;
    if (income <= 0) return 1;
    const monthlyDebtService = (profile.totalDebt.value || 0) * this.params.monthlyDebtServiceRate;
    const highInterestDebt = profile.highInterestDebt.value || 0;
    const netWorth = Math.max(1, (profile.liquidAssets.value || 0) - (profile.totalDebt.value || 0));
    const score = monthlyDebtService / income + highInterestDebt / netWorth * this.params.highInterestDebtWeight;
    return Math.min(1, score);
  }
  /**
   * LiquidityAdequacyScore (Sla)
   * Sla = Liquid Assets / (Monthly Expenses * Target Months)
   */
  calculateLiquidityAdequacy(profile, targetMonths = this.params.defaultEmergencyMonths) {
    const expenses = profile.expenses.value || 1;
    const assets = profile.liquidAssets.value || 0;
    return assets / (expenses * targetMonths);
  }
  /**
   * GoalFeasibilityScore (Sgf)
   * Sgf = Available Monthly Surplus / PMT_req
   */
  evaluateGoals(profile) {
    const income = profile.income.value || 0;
    const expenses = profile.expenses.value || 0;
    const surplus = Math.max(0, income - expenses);
    const i = this.params.expectedAnnualReturn / 12;
    const { tightBelow, unviableBelow } = this.params.goalFeasibility;
    return profile.goals.map((goal) => {
      const n = goal.deadlineMonths;
      const FV = goal.targetValue;
      const PV = goal.currentValue;
      const pow = Math.pow(1 + i, n);
      const denominator = (pow - 1) / i;
      const pmtReq = denominator > 0 ? (FV - PV * pow) / denominator : 0;
      const sgf = pmtReq > 0 ? surplus / pmtReq : this.params.goalFeasibilityWhenNoContributionRequired;
      let status = "viable";
      if (sgf < unviableBelow) status = "unviable";
      else if (sgf < tightBelow) status = "tight";
      const suggestedAdjustments = [];
      if (status !== "viable") {
        suggestedAdjustments.push(`Aumentar aporte mensal em $${Math.ceil(pmtReq - surplus)}`);
        suggestedAdjustments.push(`Estender prazo em ${Math.ceil(n * 0.5)} meses`);
        suggestedAdjustments.push(`Reduzir valor alvo para $${Math.ceil(surplus * denominator + PV * pow)}`);
      }
      return {
        id: goal.id,
        status,
        requiredMonthlyContribution: Math.max(0, pmtReq),
        gap: Math.max(0, FV - PV),
        suggestedAdjustments
      };
    });
  }
};

// src/server/services/vera/esquilo-engine.ts
var EsquiloEngine = class {
  static {
    __name(this, "EsquiloEngine");
  }
  vera;
  policyVersion = "2024.Q2.v1.4";
  constructor(veraParams = {}) {
    this.vera = new VeraCoreEngine(veraParams);
  }
  evaluate(profile, history) {
    const traceId = crypto.randomUUID();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const globalConfidence = this.calculateGlobalConfidence(profile);
    const debtPressure = this.vera.calculateDebtPressure(profile);
    const targetLiquidityMonths = this.calculateDynamicLiquidityTarget(profile);
    const liquidityAdequacy = this.vera.calculateLiquidityAdequacy(profile, targetLiquidityMonths);
    const goalStatuses = this.vera.evaluateGoals(profile);
    const behavioralConsistency = history.consistencyScore;
    let stage = "GROWING" /* GROWING */;
    if (debtPressure > 0.7 || liquidityAdequacy < 0.2) {
      stage = "CRITICAL" /* CRITICAL */;
    } else if (liquidityAdequacy < 0.5 || debtPressure > 0.4) {
      stage = "UNSTABLE" /* UNSTABLE */;
    } else if (goalStatuses.some((g) => g.status === "unviable") || liquidityAdequacy < 1) {
      stage = "STRUCTURING" /* STRUCTURING */;
    }
    const { authorizedCapabilities, appliedRules, overrides } = this.applyGatingRules(
      globalConfidence,
      debtPressure,
      liquidityAdequacy,
      behavioralConsistency,
      profile
    );
    let recLevel = "structure";
    if (authorizedCapabilities.includes("PRODUCT_ELIGIBLE")) recLevel = "product";
    else if (authorizedCapabilities.includes("CLASS_RECOMMENDATION")) recLevel = "asset_class";
    const reasoning = this.generateReasoning(stage, authorizedCapabilities, globalConfidence);
    const auditTrace = {
      traceId,
      policyVersion: this.policyVersion,
      timestamp,
      inputSnapshot: this.createSnapshot(profile),
      derivedVariables: {
        globalConfidence,
        debtPressure,
        liquidityAdequacy,
        behavioralConsistency
      },
      rulesEngine: {
        evaluated: ["RULE_DEBT_STRESS", "RULE_LIQUIDITY_CHECK", "RULE_PRODUCT_GATING", "RULE_CONFIDENCE_THRESHOLD"],
        applied: appliedRules,
        overrides
      },
      limitations: this.identifyLimitations(profile),
      decision: {
        authorizedCapabilities,
        primaryAction: this.determinePrimaryAction(stage, debtPressure, liquidityAdequacy)
      }
    };
    return {
      user_stage: stage,
      main_problem: this.determineMainProblem(stage, debtPressure, liquidityAdequacy),
      main_opportunity: stage === "GROWING" /* GROWING */ ? "Otimiza\xE7\xE3o de Portf\xF3lio" : "Estabiliza\xE7\xE3o Financeira",
      recommended_action: auditTrace.decision.primaryAction,
      urgency: stage === "CRITICAL" /* CRITICAL */ ? "critical" : stage === "UNSTABLE" /* UNSTABLE */ ? "high" : "medium",
      confidence_level: globalConfidence,
      goal_status: goalStatuses,
      authorized_capabilities: authorizedCapabilities,
      eligible_recommendation_level: recLevel,
      reasoning,
      evidence: {
        debtPressure,
        liquidityAdequacy,
        globalConfidence,
        behavioralConsistency
      },
      audit_trace: auditTrace
    };
  }
  calculateGlobalConfidence(profile) {
    const weights = {
      income: 1,
      expenses: 1,
      liquidAssets: 0.8,
      totalDebt: 0.9,
      highInterestDebt: 0.9
    };
    const stateWeights = {
      ["HAS_VALUE" /* HAS_VALUE */]: 1,
      ["ESTIMATED" /* ESTIMATED */]: 0.5,
      ["INFERRED" /* INFERRED */]: 0.3,
      ["UNKNOWN_NOT_ASKED" /* UNKNOWN_NOT_ASKED */]: 0,
      ["UNKNOWN_SKIPPED" /* UNKNOWN_SKIPPED */]: 0,
      ["UNKNOWN_REFUSED" /* UNKNOWN_REFUSED */]: 0.05,
      ["DOES_NOT_HAVE" /* DOES_NOT_HAVE */]: 1
    };
    let totalWeight = 0;
    let weightedSum = 0;
    for (const key in weights) {
      const container = profile[key];
      if (container) {
        const w = weights[key];
        const s = stateWeights[container.state] ?? 0;
        weightedSum += w * s * container.confidence;
        totalWeight += w;
      }
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  calculateDynamicLiquidityTarget(profile) {
    let target = 6;
    if ((profile.age.value || 0) > 50) target += 2;
    if (profile.income.origin === "inference_engine") target += 2;
    return target;
  }
  applyGatingRules(conf, debt, liq, cons, profile) {
    const authorizedCapabilities = ["STRUCTURAL_ONLY"];
    const appliedRules = ["RULE_BASE_STRUCTURAL"];
    const overrides = [];
    if (conf > 0.4 && profile.income.state !== "UNKNOWN_REFUSED" /* UNKNOWN_REFUSED */) {
      authorizedCapabilities.push("GOAL_SIMULATION");
      appliedRules.push("RULE_GOAL_SIMULATION_ENABLED");
    } else {
      overrides.push({ rule: "GOAL_SIMULATION", status: "BLOCKED", reason: "LOW_CONFIDENCE_OR_REFUSED_INCOME" });
    }
    if (liq > 0.5 && debt < 0.4 && conf > 0.6) {
      authorizedCapabilities.push("CLASS_RECOMMENDATION");
      appliedRules.push("RULE_CLASS_REC_ENABLED");
    }
    if (liq >= 1 && debt < 0.2 && conf > 0.8 && cons > 0.6) {
      authorizedCapabilities.push("PRODUCT_ELIGIBLE");
      appliedRules.push("RULE_PRODUCT_ELIGIBLE_ENABLED");
    } else {
      if (liq < 1) overrides.push({ rule: "PRODUCT_ELIGIBLE", status: "BLOCKED", reason: "INSUFFICIENT_LIQUIDITY" });
      if (conf <= 0.8) overrides.push({ rule: "PRODUCT_ELIGIBLE", status: "BLOCKED", reason: "CONFIDENCE_BELOW_THRESHOLD" });
    }
    if (liq > 1.5 && conf > 0.9 && profile.investorProfile.value === "aggressive") {
      authorizedCapabilities.push("HIGH_RISK_ALLOWED");
      appliedRules.push("RULE_HIGH_RISK_ENABLED");
    }
    return { authorizedCapabilities, appliedRules, overrides };
  }
  determinePrimaryAction(stage, debt, liq) {
    if (debt > 0.5) return "Plano de Quita\xE7\xE3o de D\xEDvidas";
    if (liq < 1) return "Constru\xE7\xE3o de Reserva de Emerg\xEAncia";
    if (stage === "STRUCTURING" /* STRUCTURING */) return "Ajuste de Cronograma de Metas";
    return "Diversifica\xE7\xE3o de Ativos";
  }
  determineMainProblem(stage, debt, liq) {
    if (debt > 0.7) return "ALTA_PRESSAO_DE_DIVIDA";
    if (liq < 0.3) return "RISCO_DE_INSOLVENCIA_LIQUIDEZ";
    if (stage === "STRUCTURING" /* STRUCTURING */) return "DESALINHAMENTO_DE_METAS";
    return "NENHUM_DETECTADO";
  }
  generateReasoning(stage, caps, conf) {
    let text = `Diagn\xF3stico em est\xE1gio ${stage}. `;
    if (conf < 0.6) text += "A precis\xE3o est\xE1 limitada pela falta de dados confirmados. ";
    if (!caps.includes("PRODUCT_ELIGIBLE")) text += "Recomenda\xE7\xF5es de produtos espec\xEDficos est\xE3o bloqueadas por crit\xE9rios de seguran\xE7a. ";
    return text;
  }
  createSnapshot(profile) {
    const snapshot = {};
    for (const key in profile) {
      if (key !== "goals") {
        const container = profile[key];
        snapshot[key] = { val: container.value, state: container.state, conf: container.confidence };
      }
    }
    return snapshot;
  }
  identifyLimitations(profile) {
    const limitations = [];
    if (profile.expenses.state === "ESTIMATED" /* ESTIMATED */) {
      limitations.push({ field: "expenses", impact: "PRECISAO_REDUZIDA_NO_CALCULO_DE_SUPERAVIT" });
    }
    if (profile.income.state === "UNKNOWN_SKIPPED" /* UNKNOWN_SKIPPED */) {
      limitations.push({ field: "income", impact: "IMPOSSIBILIDADE_DE_VALIDAR_CAPACIDADE_DE_APORTE" });
    }
    return limitations;
  }
};

// src/server/services/vera/behavioral.ts
var EsquiloBehavioralEngine = class {
  static {
    __name(this, "EsquiloBehavioralEngine");
  }
  updateHistory(history, action) {
    const total = history.acceptedCount + history.ignoredCount + history.postponedCount;
    let updatedCount = { accepted: history.acceptedCount, ignored: history.ignoredCount, postponed: history.postponedCount };
    switch (action) {
      case "accepted":
        updatedCount.accepted++;
        break;
      case "ignored":
        updatedCount.ignored++;
        break;
      case "postponed":
        updatedCount.postponed++;
        break;
    }
    const newTotal = updatedCount.accepted + updatedCount.ignored + updatedCount.postponed;
    const executionRate = newTotal > 0 ? updatedCount.accepted / newTotal : 0;
    const consistency = (updatedCount.accepted - updatedCount.ignored) / Math.max(1, newTotal);
    return {
      acceptedCount: updatedCount.accepted,
      ignoredCount: updatedCount.ignored,
      postponedCount: updatedCount.postponed,
      consistencyScore: Math.max(0, Math.min(1, 0.5 + consistency * 0.5)),
      executionRate,
      averageTimeToAction: history.averageTimeToAction
    };
  }
};

// src/server/services/vera/adapter.ts
var severityByUrgency = {
  low: "info",
  medium: "warning",
  high: "error",
  critical: "critical"
};
var VeraAdapter = class {
  static {
    __name(this, "VeraAdapter");
  }
  toIntegrationOutput(decision) {
    return {
      engine: "vera",
      decision,
      template_payload: this.toTemplatePayload(decision),
      capabilities: {
        authorized: decision.authorized_capabilities,
        blocked: this.getBlockedCapabilities(decision)
      },
      explanation: {
        primary_reason: decision.main_problem,
        secondary_reason: decision.main_opportunity
      }
    };
  }
  toTemplatePayload(decision) {
    const primaryProblem = decision.problems?.[0];
    const templateVars = {
      user_stage: decision.user_stage,
      main_problem: decision.main_problem,
      main_opportunity: decision.main_opportunity,
      recommended_action: decision.recommended_action,
      confidence_level: Number(decision.confidence_level.toFixed(2)),
      debt_pressure: this.safeNumber(decision.evidence.debtPressure),
      liquidity_adequacy: this.safeNumber(decision.evidence.liquidityAdequacy),
      behavioral_consistency: this.safeNumber(decision.evidence.behavioralConsistency),
      goal_count: decision.goal_status.length,
      first_unviable_goal_id: decision.goal_status.find((goal) => goal.status === "unviable")?.id ?? null
    };
    if (primaryProblem) {
      if (primaryProblem.type === "INSUFFICIENT_EMERGENCY_FUND") {
        templateVars.liquidity_months = this.safeNumber(decision.evidence.liquidityAdequacy);
        templateVars.monthly_reserve = this.safeNumber(primaryProblem.monthlySave);
        templateVars.months_to_save = primaryProblem.monthsToSolve ?? 12;
      } else if (primaryProblem.type === "HIGH_DEBT_RATIO" || primaryProblem.type === "HIGH_INTEREST_DEBT") {
        templateVars.debt_percentage = this.safeNumber((decision.evidence.debtPressure ?? 0) * 100);
        templateVars.high_interest_percentage = this.safeNumber(primaryProblem.percentageOfIncome ?? 30);
        templateVars.monthly_savings = this.safeNumber(primaryProblem.monthlySave);
        templateVars.debt_payment = this.safeNumber(primaryProblem.monthlySave);
        templateVars.months_to_payoff = primaryProblem.monthsToSolve ?? 24;
      } else if (primaryProblem.type === "EXPENSE_OPTIMIZATION") {
        templateVars.expense_percentage = this.safeNumber(primaryProblem.percentageOfIncome ?? 85);
        templateVars.optimization_potential = this.safeNumber(primaryProblem.monthlySave);
      }
    }
    const opportunity = decision.opportunities?.[0];
    if (opportunity && opportunity.type === "INVESTMENT_READY") {
      templateVars.investment_capacity = this.safeNumber(opportunity.monthlyCapacity);
      templateVars.initial_amount = this.safeNumber(opportunity.monthlyCapacity ?? 500);
    }
    return {
      template_key: this.resolveTemplateKey(decision),
      decision_type: decision.main_problem,
      severity: severityByUrgency[decision.urgency],
      suggested_channels: this.resolveSuggestedChannels(decision),
      variables: templateVars
    };
  }
  resolveTemplateKey(decision) {
    const primaryProblem = decision.problems?.[0];
    if (primaryProblem) {
      switch (primaryProblem.type) {
        case "INSUFFICIENT_EMERGENCY_FUND":
          return "reserve_missing_high_priority";
        case "HIGH_DEBT_RATIO":
        case "HIGH_INTEREST_DEBT":
          return "debt_restructuring_needed";
        case "EXPENSE_OPTIMIZATION":
          return "expense_optimization";
        case "NEGATIVE_CASH_FLOW":
          return "debt_restructuring_needed";
      }
    }
    switch (decision.main_problem) {
      case "ALTA_PRESSAO_DE_DIVIDA":
        return "debt_restructuring_needed";
      case "RISCO_DE_INSOLVENCIA_LIQUIDEZ":
        return "reserve_missing_high_priority";
      case "DESALINHAMENTO_DE_METAS":
        return "goal_timeline_adjustment";
      default:
        return decision.eligible_recommendation_level === "product" ? "investment_ready" : "reserve_missing_high_priority";
    }
  }
  resolveSuggestedChannels(decision) {
    if (decision.urgency === "critical") return ["in_app", "email", "push"];
    if (decision.urgency === "high") return ["in_app", "push"];
    return ["in_app"];
  }
  getBlockedCapabilities(decision) {
    const all = ["STRUCTURAL_ONLY", "GOAL_SIMULATION", "CLASS_RECOMMENDATION", "PRODUCT_ELIGIBLE", "HIGH_RISK_ALLOWED"];
    return all.filter((capability) => !decision.authorized_capabilities.includes(capability));
  }
  safeNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? Number(value.toFixed(2)) : null;
  }
};

// src/server/services/vera/service.ts
var VeraService = class {
  static {
    __name(this, "VeraService");
  }
  esquilo;
  adapter = new VeraAdapter();
  behavioral = new EsquiloBehavioralEngine();
  constructor(veraParams = {}) {
    this.esquilo = new EsquiloEngine(veraParams);
  }
  evaluate(profile, history) {
    const decision = this.esquilo.evaluate(profile, history);
    return this.adapter.toIntegrationOutput(decision);
  }
  updateHistory(history, action) {
    return this.behavioral.updateHistory(history, action);
  }
};
var vera = new VeraService();

// src/server/services/vera/studio-store.ts
var DEFAULT_TEMPLATES = [
  {
    id: "t1",
    key: "reserve_missing_high_priority",
    title: "Seu Fundo de Seguran\xE7a Precisa de Aten\xE7\xE3o",
    body: "Voc\xEA atualmente tem {{liquidity_months}} meses de despesas guardadas. O ideal \xE9 ter 6 meses. Para chegar l\xE1, reserve {{monthly_reserve}}/m\xEAs durante {{months_to_save}} meses.\n\nPor que isso importa? Uma emerg\xEAncia inesperada (desemprego, doen\xE7a) pode derrubar seus planos. Com essa almofada, voc\xEA consegue lidar sem puxar cr\xE9dito caro ou parar seus investimentos.\n\nComo fazer: Automatize uma transfer\xEAncia de {{monthly_reserve}} para uma conta poupan\xE7a assim que recebe seu sal\xE1rio.",
    subject: "Alerta de Seguran\xE7a Financeira",
    cta: "Come\xE7ar a Economizar",
    channels: { in_app: true, email: true, push: true },
    version: "published"
  },
  {
    id: "t2",
    key: "debt_restructuring_needed",
    title: "Sua D\xEDvida Est\xE1 Consumindo Seu Potencial",
    body: "{{debt_percentage}}% do que voc\xEA ganha vai para pagar d\xEDvidas. Voc\xEA est\xE1 pagando {{high_interest_percentage}}% delas com juros altos (cart\xE3o, cheque especial).\n\nPor que isso importa? Quanto mais voc\xEA paga de juros, menos sobra para construir riqueza. A boa not\xEDcia: voc\xEA pode se livrar disso.\n\nComo fazer: Primeiro, consolidar a d\xEDvida de juros altos em um empr\xE9stimo pessoal pode poupar R$ {{monthly_savings}}/m\xEAs. Depois, dedique {{debt_payment}}/m\xEAs para quita\xE7\xE3o. Em {{months_to_payoff}} meses voc\xEA respira fundo de novo.",
    subject: "Plano de Reestrutura\xE7\xE3o de D\xEDvidas",
    cta: "Ver Op\xE7\xF5es de Consolida\xE7\xE3o",
    channels: { in_app: true, email: true, push: false },
    version: "published"
  },
  {
    id: "t3",
    key: "goal_timeline_adjustment",
    title: "Suas Metas Precisam de Ajuste",
    body: "Para atingir suas metas, voc\xEA consegue em {{months_to_save}} meses com {{monthly_reserve}}/m\xEAs. Mas d\xE1 para acelerar.\n\nPor que isso importa? Conhecer o caminho real ajuda a manter a disciplina e a fazer escolhas certas agora para ganhar no futuro.\n\nComo fazer: Aumente seu aporte e alcan\xE7a mais r\xE1pido. Ou mantenha o ritmo atual e estenda o prazo. Voc\xEA escolhe qual encaixa melhor.",
    cta: "Ajustar Metas",
    channels: { in_app: true, email: false, push: true },
    version: "published"
  },
  {
    id: "t4",
    key: "investment_ready",
    title: "Voc\xEA Est\xE1 Pronto para Investir",
    body: "Suas d\xEDvidas est\xE3o sob controle, sua reserva est\xE1 s\xF3lida. Voc\xEA tem {{investment_capacity}}/m\xEAs dispon\xEDvel para crescer seu dinheiro.\n\nPor que agora? Quando voc\xEA investe cedo e por tempo, o juros composto trabalha a seu favor. R$ 500/m\xEAs por 10 anos pode virar R$ 80 mil+.\n\nComo fazer: Comece com {{initial_amount}}/m\xEAs em fundos diversificados. Daqui a 6 meses, revise e aumente se conseguir. Pequeno e consistente supera grande e espor\xE1dico.",
    cta: "Come\xE7ar a Investir",
    channels: { in_app: true, email: true, push: true },
    version: "published"
  },
  {
    id: "t5",
    key: "expense_optimization",
    title: "Suas Despesas Est\xE3o Acima do Ideal",
    body: "Voc\xEA gasta {{expense_percentage}}% da sua renda em despesas fixas. O padr\xE3o saud\xE1vel \xE9 70%. Isso deixa pouco espa\xE7o para economizar.\n\nPor que isso importa? Se n\xE3o sobra dinheiro, voc\xEA fica preso. Sem almofada, qualquer problema vira d\xEDvida. Sem sobra, imposs\xEDvel investir.\n\nComo fazer: Revise seus gastos neste m\xEAs. Pode cortar {{optimization_potential}}/m\xEAs em assinaturas, alimenta\xE7\xE3o, transporte. Alguns clientes conseguem 20-30% de redu\xE7\xE3o.",
    cta: "Revisar Despesas",
    channels: { in_app: true, email: false, push: true },
    version: "published"
  }
];
var DEFAULT_MAPPINGS = [
  {
    decisionType: "ALTA_PRESSAO_DE_DIVIDA",
    templateKey: "debt_restructuring_needed",
    severity: "critical",
    channelPolicy: {
      priority: ["in_app", "email"],
      fallback: "email"
    }
  },
  {
    decisionType: "RISCO_DE_INSOLVENCIA_LIQUIDEZ",
    templateKey: "reserve_missing_high_priority",
    severity: "critical",
    channelPolicy: {
      priority: ["push", "in_app", "email"],
      fallback: "email"
    }
  },
  {
    decisionType: "DESALINHAMENTO_DE_METAS",
    templateKey: "goal_timeline_adjustment",
    severity: "warning",
    channelPolicy: {
      priority: ["in_app"],
      fallback: "none"
    }
  }
];
var StudioStore = class {
  static {
    __name(this, "StudioStore");
  }
  templates = [...DEFAULT_TEMPLATES];
  mappings = [...DEFAULT_MAPPINGS];
  getTemplates() {
    return this.templates;
  }
  getMappings() {
    return this.mappings;
  }
  updateTemplate(updated) {
    this.templates = this.templates.map((t) => t.id === updated.id ? updated : t);
  }
  updateMapping(updated) {
    this.mappings = this.mappings.map((m) => m.decisionType === updated.decisionType ? updated : m);
  }
  getTemplateByKey(key) {
    return this.templates.find((t) => t.key === key);
  }
  getMappingByDecision(type) {
    return this.mappings.find((m) => m.decisionType === type);
  }
};
var studioStore = new StudioStore();

// src/server/services/vera/studio-renderer.ts
var TemplateRenderer = class {
  static {
    __name(this, "TemplateRenderer");
  }
  render(template, variables) {
    const interpolate = /* @__PURE__ */ __name((text) => {
      return text.replace(/\{\{(.*?)\}\}/g, (_, key) => {
        const value = variables[key.trim()];
        return value !== void 0 ? String(value) : `{{${key}}}`;
      });
    }, "interpolate");
    return {
      title: interpolate(template.title),
      body: interpolate(template.body),
      subject: template.subject ? interpolate(template.subject) : void 0,
      cta: template.cta ? interpolate(template.cta) : void 0
    };
  }
};
var templateRenderer = new TemplateRenderer();

// src/server/services/vera-bridge.ts
async function loadVeraModelParams(db) {
  try {
    const row = await db.prepare("SELECT valor_json FROM configuracoes_produto WHERE chave = 'vera.v1' LIMIT 1").first();
    if (!row?.valor_json) return {};
    const parsed = JSON.parse(row.valor_json);
    return parsed.modelParams ?? {};
  } catch {
    return {};
  }
}
__name(loadVeraModelParams, "loadVeraModelParams");
var VeraBridge = class {
  static {
    __name(this, "VeraBridge");
  }
  store = new StudioStore();
  renderer = new TemplateRenderer();
  avaliar(request, modelParams = {}) {
    const profile = this.mapProfile(request.profile);
    const history = this.mapHistory(request.history);
    const engine = Object.keys(modelParams).length > 0 ? new VeraService(modelParams) : vera;
    const veraOutput = engine.evaluate(profile, history);
    const template = this.store.getTemplateByKey(veraOutput.template_payload.template_key);
    const rendered = template ? this.renderer.render(template, veraOutput.template_payload.variables) : null;
    const kind = this.resolveKind(veraOutput);
    const severity = veraOutput.template_payload.severity;
    const tone = this.resolveTone(severity);
    const ctaAction = this.resolveCtaAction(veraOutput);
    const badges = this.resolveBadges(veraOutput.template_payload.severity);
    const frontendPayload = {
      kind,
      id: veraOutput.decision.audit_trace?.traceId ?? crypto.randomUUID(),
      decision_type: veraOutput.decision.main_problem ?? "generic",
      severity: this.mapSeverity(severity),
      tone,
      status: "active",
      title: rendered?.title ?? veraOutput.decision.reasoning,
      body: rendered?.body ?? "",
      supporting_text: rendered?.subject,
      cta: ctaAction ? { label: rendered?.cta ?? "Ver detalhes", action: ctaAction } : void 0,
      badges,
      metadata: {
        template_key: veraOutput.template_payload.template_key,
        stage: veraOutput.decision.user_stage,
        confidence: veraOutput.decision.confidence_level,
        trace_id: veraOutput.decision.audit_trace?.traceId,
        authorized_capabilities: veraOutput.capabilities.authorized,
        blocked_capabilities: veraOutput.capabilities.blocked
      }
    };
    const mapUrgency = /* @__PURE__ */ __name((u) => {
      if (u === "critical") return "high";
      return u || "low";
    }, "mapUrgency");
    const decisionPayload = {
      decision_type: veraOutput.decision.main_problem ?? "generic",
      stage: veraOutput.decision.user_stage,
      urgency: mapUrgency(veraOutput.decision.urgency),
      template_key: veraOutput.template_payload.template_key,
      variables: veraOutput.template_payload.variables,
      authorized_capabilities: veraOutput.capabilities.authorized,
      blocked_capabilities: veraOutput.capabilities.blocked,
      confidence: veraOutput.decision.confidence_level,
      explanation: {
        main_reason: veraOutput.explanation.primary_reason,
        secondary_reason: veraOutput.explanation.secondary_reason,
        rationale: veraOutput.decision.reasoning
      },
      trace_id: veraOutput.decision.audit_trace?.traceId
    };
    return {
      engine: "vera",
      decision: decisionPayload,
      frontend_payload: frontendPayload,
      audit_trace: veraOutput.decision.audit_trace ? {
        trace_id: veraOutput.decision.audit_trace.traceId,
        policy_version: veraOutput.decision.audit_trace.policyVersion,
        timestamp: Date.parse(veraOutput.decision.audit_trace.timestamp),
        limitations: veraOutput.decision.audit_trace.limitations
      } : void 0
    };
  }
  mapProfile(input) {
    const now = Date.now();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const wrap = /* @__PURE__ */ __name((sc, fallback = null) => ({
      value: sc?.value ?? fallback,
      state: sc?.state ?? "UNKNOWN_NOT_ASKED",
      origin: sc?.origin ?? "user_input",
      confidence: sc?.confidence ?? 0,
      lastUpdated: timestamp,
      isEstimated: sc?.isEstimated ?? false
    }), "wrap");
    const dateToMonths = /* @__PURE__ */ __name((isoDate) => {
      if (!isoDate) return 24;
      const diff = new Date(isoDate).getTime() - Date.now();
      return Math.max(1, Math.round(diff / (1e3 * 60 * 60 * 24 * 30)));
    }, "dateToMonths");
    return {
      income: wrap(input.monthly_income),
      expenses: wrap(input.monthly_expenses),
      liquidAssets: wrap(input.current_reserve),
      totalDebt: wrap(input.debt_total),
      // highInterestDebt: only if explicit, otherwise UNKNOWN_NOT_ASKED
      highInterestDebt: input.high_interest_debt ? wrap(input.high_interest_debt) : wrap(void 0),
      age: wrap(input.age),
      investorProfile: wrap(input.investor_profile_declared),
      goals: (input.goals ?? []).map((g) => {
        const priorityMap = { high: 3, medium: 2, low: 1 };
        const priorityValue = g.priority?.value;
        const priorityNum = priorityValue && (priorityValue === "high" || priorityValue === "medium" || priorityValue === "low") ? priorityMap[priorityValue] : 2;
        return {
          id: g.id ?? crypto.randomUUID(),
          type: g.category ?? "generic",
          title: g.title,
          targetValue: g.target_amount?.value ?? 0,
          currentValue: g.current_allocated_amount?.value ?? 0,
          deadlineMonths: dateToMonths(g.target_date?.value),
          priority: priorityNum,
          flexibility: typeof g.flexibility?.value === "number" ? g.flexibility.value : 0.5
        };
      })
    };
  }
  mapHistory(input) {
    const completedCount = input?.recommendations_completed ?? 0;
    const ignoredCount = input?.recommendations_ignored ?? 0;
    const postponedCount = input?.recommendations_postponed ?? 0;
    const totalCount = completedCount + ignoredCount + postponedCount;
    return {
      acceptedCount: completedCount,
      ignoredCount,
      postponedCount,
      consistencyScore: input?.promised_vs_actual_contribution_ratio ?? 0.5,
      executionRate: totalCount > 0 ? completedCount / totalCount : 0.5,
      averageTimeToAction: input?.average_time_to_action_days ?? 7
    };
  }
  resolveKind(output) {
    const stage = output.decision.user_stage;
    if (stage === "CRITICAL" || stage === "UNSTABLE") return "warning_card";
    if (output.template_payload.template_key.includes("goal")) return "goal_card";
    if (output.capabilities.authorized.includes("PRODUCT_ELIGIBLE")) return "recommendation_card";
    return "insight_card";
  }
  resolveTone(severity) {
    const map = {
      critical: "critical",
      error: "critical",
      high: "critical",
      warning: "warning",
      medium: "warning",
      info: "neutral",
      success: "positive",
      low: "neutral"
    };
    return map[severity] ?? "neutral";
  }
  resolveCtaAction(output) {
    const key = output.template_payload.template_key;
    if (key.includes("reserve")) return "OPEN_RESERVE_FLOW";
    if (key.includes("goal")) return "OPEN_GOAL_REVIEW";
    if (key.includes("debt")) return "OPEN_DEBT_FLOW";
    return null;
  }
  mapSeverity(severity) {
    const map = {
      critical: "high",
      error: "high",
      high: "high",
      warning: "medium",
      medium: "medium",
      info: "low",
      success: "low",
      low: "low"
    };
    return map[severity] ?? "low";
  }
  resolveBadges(severity) {
    const badges = [];
    if (severity === "high" || severity === "error" || severity === "critical") {
      badges.push({ label: "Prioridade alta", type: "critical" });
    } else if (severity === "medium" || severity === "warning") {
      badges.push({ label: "Aten\xE7\xE3o", type: "warning" });
    }
    return badges.length > 0 ? badges : void 0;
  }
};
var veraBridge = new VeraBridge();

// src/server/routes/vera.routes.ts
async function handleVeraRoutes(pathname, request, env, sessao) {
  if (!sessao) return null;
  if (pathname === "/api/vera/avaliar" && request.method === "POST") {
    const [body, modelParams] = await Promise.all([
      parseJsonBody2(request),
      loadVeraModelParams(env.DB)
    ]);
    const result = veraBridge.avaliar(body, modelParams);
    return sucesso(result);
  }
  return null;
}
__name(handleVeraRoutes, "handleVeraRoutes");

// src/server/services/cvm-backfill-planner.ts
var JANELA_PADRAO_DEFAULT = 60;
var MARGEM_DEFAULT = 2;
function normalizarCnpj14(raw) {
  if (!raw) return null;
  const d = String(raw).replace(/\D/g, "");
  return d.length === 14 ? d : null;
}
__name(normalizarCnpj14, "normalizarCnpj14");
function anoMesUtc(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
__name(anoMesUtc, "anoMesUtc");
function subtrairMeses(anoMes, qtd) {
  const [ano, mes] = anoMes.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1 - qtd, 1));
  return anoMesUtc(d);
}
__name(subtrairMeses, "subtrairMeses");
function compararAnoMes(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
__name(compararAnoMes, "compararAnoMes");
function gerarMesesEntre(inicio, fim) {
  if (compararAnoMes(inicio, fim) > 0) return [];
  const [anoI, mesI] = inicio.split("-").map(Number);
  const [anoF, mesF] = fim.split("-").map(Number);
  const out = [];
  let y = anoI;
  let m = mesI;
  while (y < anoF || y === anoF && m <= mesF) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}
__name(gerarMesesEntre, "gerarMesesEntre");
function planejarBackfill(input) {
  const hoje = input.hoje ?? /* @__PURE__ */ new Date();
  const mesAtual = anoMesUtc(hoje);
  const fim = input.intervaloFinal ?? mesAtual;
  let inicio;
  let origem;
  if (input.intervaloInicial) {
    inicio = input.intervaloInicial;
    origem = "override";
  } else if (input.menorDataAquisicao && /^\d{4}-\d{2}/.test(input.menorDataAquisicao)) {
    const base = input.menorDataAquisicao.slice(0, 7);
    inicio = subtrairMeses(base, input.margemMeses ?? MARGEM_DEFAULT);
    origem = "data_aquisicao";
  } else {
    const janela = input.janelaPadraoMeses ?? JANELA_PADRAO_DEFAULT;
    inicio = subtrairMeses(fim, janela - 1);
    origem = "janela_padrao";
  }
  if (compararAnoMes(inicio, fim) > 0) inicio = fim;
  const meses = gerarMesesEntre(inicio, fim);
  const fonte = input.cnpjsOverride ?? input.cnpjsDisponiveis ?? [];
  const cnpjs = Array.from(
    new Set(
      fonte.map((c) => normalizarCnpj14(c)).filter((c) => Boolean(c))
    )
  );
  return {
    intervaloInicial: inicio,
    intervaloFinal: fim,
    meses,
    totalMesesPrevistos: meses.length,
    cnpjs,
    origem
  };
}
__name(planejarBackfill, "planejarBackfill");

// src/server/routes/admin.routes.ts
var atualizarScoreConfigSchema = external_exports.object({ score: external_exports.record(external_exports.unknown()) });
var atualizarFlagsSchema = external_exports.object({ flags: external_exports.record(external_exports.boolean()) });
var atualizarMenusSchema = external_exports.object({
  menus: external_exports.array(external_exports.object({ chave: external_exports.string().min(1), label: external_exports.string().min(1), path: external_exports.string().min(1), ordem: external_exports.number().int().nonnegative(), visivel: external_exports.boolean() }))
});
var blocoConteudoSchema = external_exports.object({ chave: external_exports.string().min(2), modulo: external_exports.string().min(2), tipo: external_exports.enum(["texto", "markdown", "json", "boolean"]), valor: external_exports.string(), visivel: external_exports.boolean(), ordem: external_exports.number().int().nonnegative() });
var atualizarConteudoSchema = external_exports.object({ blocos: external_exports.array(blocoConteudoSchema) });
var corretoraSchema = external_exports.object({ codigo: external_exports.string().min(2), nome: external_exports.string().min(2), status: external_exports.enum(["ativo", "beta", "planejado"]), mensagemAjuda: external_exports.string().min(2) });
var atualizarCorretorasSchema = external_exports.object({ corretoras: external_exports.array(corretoraSchema) });
var atualizarAdminSchema = external_exports.object({ email: external_exports.string().email(), ativo: external_exports.boolean() });
var atualizarParametrosSimulacaoSchema = external_exports.object({
  parametros: external_exports.array(external_exports.object({ chave: external_exports.string().min(2), valor: external_exports.record(external_exports.unknown()), descricao: external_exports.string().optional(), ativo: external_exports.boolean().default(true) }))
});
var cotaCvmSchema = external_exports.object({
  cnpj: external_exports.string().min(11),
  // aceita com ou sem pontuação
  dataRef: external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vlQuota: external_exports.number().positive(),
  vlPatrimLiq: external_exports.number().optional(),
  nrCotst: external_exports.number().int().optional()
});
var ingerirCotasCvmSchema = external_exports.object({
  itens: external_exports.array(cotaCvmSchema).min(1).max(5e3),
  runId: external_exports.string().uuid().optional()
});
var cadastroCvmSchema = external_exports.object({
  cnpj: external_exports.string().min(11),
  denominacaoSocial: external_exports.string().min(2),
  classe: external_exports.string().optional(),
  situacao: external_exports.string().optional()
});
var ingerirCadastroCvmSchema = external_exports.object({
  itens: external_exports.array(cadastroCvmSchema).min(1).max(5e3)
});
var vincularCnpjFundoSchema = external_exports.object({
  vinculos: external_exports.array(external_exports.object({
    ativoId: external_exports.string().min(1),
    cnpj: external_exports.string().min(11)
  })).min(1).max(500)
});
var origemExecucaoSchema = external_exports.enum(["manual", "scheduled", "github_action", "trigger"]);
var abrirRunCvmSchema = external_exports.object({
  referenciaAnoMes: external_exports.string().regex(/^\d{4}-\d{2}$/),
  origemExecucao: origemExecucaoSchema.default("manual")
});
var atualizarRunCvmSchema = external_exports.object({
  status: external_exports.enum(["queued", "running", "completed", "failed"]).optional(),
  arquivosProcessados: external_exports.number().int().nonnegative().optional(),
  registrosLidos: external_exports.number().int().nonnegative().optional(),
  registrosValidos: external_exports.number().int().nonnegative().optional(),
  registrosInvalidos: external_exports.number().int().nonnegative().optional(),
  erroResumo: external_exports.string().max(1e3).nullable().optional(),
  finalizar: external_exports.boolean().optional()
});
var triggerIngestaoSchema = external_exports.object({
  referenciaAnoMes: external_exports.string().regex(/^\d{4}-\d{2}$/).optional(),
  origemExecucao: origemExecucaoSchema.default("trigger")
});
var planBackfillSchema = external_exports.object({
  intervaloInicial: external_exports.string().regex(/^\d{4}-\d{2}$/).optional(),
  intervaloFinal: external_exports.string().regex(/^\d{4}-\d{2}$/).optional(),
  janelaPadraoMeses: external_exports.number().int().positive().max(240).optional(),
  margemMeses: external_exports.number().int().nonnegative().max(12).optional(),
  cnpjs: external_exports.array(external_exports.string().min(11)).max(5e3).optional()
});
var abrirBackfillSchema = planBackfillSchema.extend({
  origemExecucao: origemExecucaoSchema.default("manual"),
  totalMesesPrevistos: external_exports.number().int().nonnegative().optional(),
  totalFundos: external_exports.number().int().nonnegative().optional()
});
var atualizarBackfillSchema = external_exports.object({
  status: external_exports.enum(["queued", "running", "completed", "failed"]).optional(),
  totalMesesProcessados: external_exports.number().int().nonnegative().optional(),
  totalFundos: external_exports.number().int().nonnegative().optional(),
  registrosLidos: external_exports.number().int().nonnegative().optional(),
  registrosGravados: external_exports.number().int().nonnegative().optional(),
  registrosInvalidos: external_exports.number().int().nonnegative().optional(),
  erroResumo: external_exports.string().max(1e3).nullable().optional(),
  finalizar: external_exports.boolean().optional()
});
var normalizarCnpjDigitos = /* @__PURE__ */ __name((cnpj) => {
  const digitos = String(cnpj).replace(/\D/g, "");
  return digitos.length === 14 ? digitos : null;
}, "normalizarCnpjDigitos");
var normalizarDenominacao = /* @__PURE__ */ __name((nome) => nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim(), "normalizarDenominacao");
async function handleAdminRoutes(pathname, request, env, sessao) {
  if (!pathname.startsWith("/api/admin")) return null;
  if (pathname === "/api/admin/test-data/reset" && request.method === "POST") {
    const tokenHeader = request.headers.get("x-admin-token");
    if (!env.ADMIN_TOKEN || !tokenHeader || tokenHeader !== env.ADMIN_TOKEN) {
      return erro("ACESSO_NEGADO", "Token administrativo inv\xE1lido", 403);
    }
    return sucesso(await resetMassaTesteEiRaiz(env));
  }
  if (!sessao) return { ok: false, status: 401, codigo: "NAO_AUTORIZADO", mensagem: "Token ausente" };
  const validarAdmin = /* @__PURE__ */ __name(async () => {
    const autorizado = await usuarioEhAdmin(env.DB, sessao.usuario.email, {
      adminTokenHeader: request.headers.get("x-admin-token"),
      adminTokenEnv: env.ADMIN_TOKEN,
      adminEmailsEnv: env.ADMIN_EMAILS
    });
    if (!autorizado) return erro("ACESSO_NEGADO", "Acesso administrativo negado", 403);
    return null;
  }, "validarAdmin");
  if (pathname === "/api/admin/me" && request.method === "GET") {
    return sucesso({ email: sessao.usuario.email, isAdmin: !await validarAdmin() });
  }
  if (pathname === "/api/admin/config" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    return sucesso(await obterAppConfig(env.DB, { incluirOcultos: true }));
  }
  if (pathname === "/api/admin/content" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    return sucesso(await obterConteudoApp(env.DB, { incluirOcultos: true }));
  }
  if (pathname === "/api/admin/config/score" && request.method === "PUT") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarScoreConfigSchema.parse(await parseJsonBody2(request));
    await atualizarScoreConfig(env.DB, body.score, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }
  if (pathname === "/api/admin/config/flags" && request.method === "PUT") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarFlagsSchema.parse(await parseJsonBody2(request));
    await atualizarFeatureFlags(env.DB, body.flags, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }
  if (pathname === "/api/admin/config/menus" && request.method === "PUT") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarMenusSchema.parse(await parseJsonBody2(request));
    await atualizarMenus(env.DB, body.menus, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }
  if (pathname === "/api/admin/content" && request.method === "PUT") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarConteudoSchema.parse(await parseJsonBody2(request));
    await atualizarConteudoApp(env.DB, body.blocos, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }
  if (pathname === "/api/admin/corretoras" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    return sucesso(await obterCorretorasSuportadas(env.DB));
  }
  if (pathname === "/api/admin/corretoras" && request.method === "PUT") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarCorretorasSchema.parse(await parseJsonBody2(request));
    await atualizarCorretorasSuportadas(env.DB, body.corretoras, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }
  if (pathname === "/api/admin/simulacoes/parametros" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const rows = await env.DB.prepare("SELECT id, chave, valor_json, descricao, origem, ativo, atualizado_em FROM simulacoes_parametros ORDER BY chave ASC").all();
    return sucesso(
      (rows.results ?? []).map((row) => ({
        id: row.id,
        chave: row.chave,
        valor: row.valor_json ? JSON.parse(String(row.valor_json)) : {},
        descricao: row.descricao ?? "",
        origem: row.origem ?? "admin",
        ativo: row.ativo === 1,
        atualizadoEm: row.atualizado_em
      }))
    );
  }
  if (pathname === "/api/admin/simulacoes/parametros" && request.method === "PUT") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarParametrosSimulacaoSchema.parse(await parseJsonBody2(request));
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const stmts = body.parametros.map(
      (item) => env.DB.prepare("INSERT INTO simulacoes_parametros (id, chave, valor_json, descricao, origem, ativo, atualizado_em) VALUES (?, ?, ?, ?, 'admin', ?, ?) ON CONFLICT(chave) DO UPDATE SET valor_json = excluded.valor_json, descricao = excluded.descricao, origem = 'admin', ativo = excluded.ativo, atualizado_em = excluded.atualizado_em").bind(crypto.randomUUID(), item.chave, JSON.stringify(item.valor ?? {}), item.descricao ?? "", item.ativo ? 1 : 0, now)
    );
    if (stmts.length > 0) await env.DB.batch(stmts);
    await env.DB.prepare("INSERT INTO admin_auditoria (id, acao, alvo, payload_json, autor_email, criado_em) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), "simulacoes.parametros.atualizar", "simulacoes_parametros", JSON.stringify({ quantidade: body.parametros.length }), sessao.usuario.email, now).run();
    return sucesso({ atualizado: true });
  }
  if (pathname === "/api/admin/usuarios" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    return sucesso(await listarAdmins(env.DB));
  }
  if (pathname === "/api/admin/usuarios" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarAdminSchema.parse(await parseJsonBody2(request));
    await definirAdmin(env.DB, body.email, body.ativo, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }
  if (pathname === "/api/admin/auditoria" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const url = new URL(request.url);
    const limite = Number.parseInt(url.searchParams.get("limite") ?? "50", 10);
    return sucesso(await obterLogsAuditoriaAdmin(env.DB, Number.isNaN(limite) ? 50 : limite));
  }
  if (pathname === "/api/admin/auditoria/exclusoes" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const url = new URL(request.url);
    const limite = Math.max(1, Math.min(500, Number.parseInt(url.searchParams.get("limite") ?? "100", 10) || 100));
    const autorEmail = (url.searchParams.get("autorEmail") ?? "").trim().toLowerCase();
    const ticker = (url.searchParams.get("ticker") ?? "").trim().toUpperCase();
    const dataInicio = (url.searchParams.get("dataInicio") ?? "").trim();
    const dataFim = (url.searchParams.get("dataFim") ?? "").trim();
    const filtros = ["acao = 'carteira.ativo.excluir'"];
    const valores = [];
    if (autorEmail) {
      filtros.push("LOWER(autor_email) = ?");
      valores.push(autorEmail);
    }
    if (ticker) {
      filtros.push("UPPER(json_extract(payload_json, '$.ticker')) = ?");
      valores.push(ticker);
    }
    if (dataInicio) {
      filtros.push("criado_em >= ?");
      valores.push(dataInicio);
    }
    if (dataFim) {
      filtros.push("criado_em <= ?");
      valores.push(dataFim);
    }
    valores.push(limite);
    const rows = await env.DB.prepare(`SELECT id, acao, alvo, payload_json, autor_email, criado_em FROM admin_auditoria WHERE ${filtros.join(" AND ")} ORDER BY criado_em DESC LIMIT ?`).bind(...valores).all();
    return sucesso(
      (rows.results ?? []).map((row) => {
        let payload = {};
        try {
          payload = row.payload_json ? JSON.parse(row.payload_json) : {};
        } catch {
          payload = {};
        }
        return {
          id: row.id,
          acao: row.acao,
          alvo: row.alvo,
          autorEmail: row.autor_email,
          criadoEm: row.criado_em,
          motivo: String(payload.motivo ?? ""),
          usuarioId: String(payload.usuarioId ?? ""),
          ativoId: String(payload.ativoId ?? ""),
          ticker: String(payload.ticker ?? ""),
          nome: String(payload.nome ?? ""),
          categoria: String(payload.categoria ?? ""),
          valorAtual: Number(payload.valorAtual ?? 0),
          quantidade: Number(payload.quantidade ?? 0),
          payloadJson: row.payload_json
        };
      })
    );
  }
  if (pathname === "/api/admin/mercado/saude" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const agora = (/* @__PURE__ */ new Date()).toISOString();
    const rows = await env.DB.prepare([
      "SELECT fonte, COUNT(*) AS total,",
      "SUM(CASE WHEN erro IS NOT NULL AND erro <> '' THEN 1 ELSE 0 END) AS erros,",
      "SUM(CASE WHEN expira_em < ? THEN 1 ELSE 0 END) AS expirados,",
      "MAX(atualizado_em) AS ultima_atualizacao",
      "FROM cotacoes_ativos_cache GROUP BY fonte"
    ].join(" ")).bind(agora).all();
    const slaPorFonte = { brapi: 15, cvm: 1440 };
    const saudePorFonte = (rows.results ?? []).map((row) => {
      const total = Number(row.total ?? 0);
      const erros = Number(row.erros ?? 0);
      const expirados = Number(row.expirados ?? 0);
      const slaMinutos = slaPorFonte[row.fonte] ?? 60;
      const minutosDesdeUltima = row.ultima_atualizacao && !Number.isNaN(new Date(row.ultima_atualizacao).getTime()) ? Math.max(0, Math.round((Date.now() - new Date(row.ultima_atualizacao).getTime()) / 6e4)) : null;
      const status = total === 0 ? "indisponivel" : erros > 0 || expirados > 0 || minutosDesdeUltima !== null && minutosDesdeUltima > slaMinutos ? "degradado" : "saudavel";
      return { fonte: row.fonte, total, erros, expirados, ultimaAtualizacao: row.ultima_atualizacao, minutosDesdeUltima, slaMinutos, coberturaAtualizada: total > 0 ? Number(((total - expirados) / total * 100).toFixed(2)) : 0, status };
    });
    return sucesso({
      referencia: agora,
      sla: { acoesMinutos: 15, fundosMinutos: 1440 },
      fontes: saudePorFonte,
      statusGeral: saudePorFonte.some((i) => i.status === "degradado") ? "degradado" : saudePorFonte.some((i) => i.status === "indisponivel") ? "indisponivel" : "saudavel"
    });
  }
  if (pathname === "/api/admin/bootstrap" && request.method === "POST") {
    const tokenHeader = request.headers.get("x-admin-token");
    if (!env.ADMIN_TOKEN || !tokenHeader || tokenHeader !== env.ADMIN_TOKEN) {
      return erro("ACESSO_NEGADO", "Token administrativo inv\xE1lido", 403);
    }
    await definirAdmin(env.DB, sessao.usuario.email, true, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }
  if (pathname === "/api/admin/historico/reconstruir/status" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const rows = await env.DB.prepare(
      "SELECT status, COUNT(*) AS total FROM fila_reconstrucao_carteira GROUP BY status"
    ).all();
    const totais = { pendente: 0, processando: 0, concluido: 0, erro: 0 };
    for (const row of rows.results ?? []) {
      totais[row.status] = Number(row.total ?? 0);
    }
    const usuariosComAtivos = await env.DB.prepare("SELECT COUNT(DISTINCT usuario_id) AS total FROM ativos").first();
    return sucesso({
      totais,
      usuariosComAtivos: Number(usuariosComAtivos?.total ?? 0),
      faltamEnfileirar: Math.max(
        0,
        Number(usuariosComAtivos?.total ?? 0) - (totais.pendente + totais.processando + totais.concluido + totais.erro)
      )
    });
  }
  if (pathname === "/api/admin/historico/reconstruir/enfileirar-todos" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const usuariosRows = await env.DB.prepare(
      [
        "SELECT DISTINCT a.usuario_id",
        "FROM ativos a",
        "LEFT JOIN fila_reconstrucao_carteira f ON f.usuario_id = a.usuario_id",
        "WHERE f.usuario_id IS NULL"
      ].join(" ")
    ).all();
    const usuarios = usuariosRows.results ?? [];
    const servico = construirServicoReconstrucao(env);
    let enfileirados = 0;
    const erros = [];
    for (const { usuario_id } of usuarios) {
      try {
        await servico.enfileirar(usuario_id);
        enfileirados += 1;
      } catch (err) {
        erros.push({
          usuarioId: usuario_id,
          mensagem: err instanceof Error ? err.message : "erro desconhecido"
        });
      }
    }
    return sucesso({ enfileirados, totalCandidatos: usuarios.length, erros });
  }
  if (pathname === "/api/admin/historico/reconstruir/processar-todos" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = await parseJsonBody2(request).catch(() => ({}));
    const tamanhoLoteSchema = external_exports.object({ tamanhoLote: external_exports.number().int().min(1).max(12).optional() });
    const { tamanhoLote = 6 } = tamanhoLoteSchema.parse(body);
    const pendentesRows = await env.DB.prepare(
      "SELECT usuario_id FROM fila_reconstrucao_carteira WHERE status IN ('pendente', 'processando')"
    ).all();
    const pendentes = pendentesRows.results ?? [];
    const servico = construirServicoReconstrucao(env);
    let processados = 0;
    let concluidos = 0;
    const erros = [];
    for (const { usuario_id } of pendentes) {
      try {
        const estado = await servico.processarProximoLote(usuario_id, tamanhoLote);
        processados += 1;
        if (estado.status === "concluido") concluidos += 1;
      } catch (err) {
        erros.push({
          usuarioId: usuario_id,
          mensagem: err instanceof Error ? err.message : "erro desconhecido"
        });
      }
    }
    return sucesso({
      processados,
      concluidosAgora: concluidos,
      restantes: Math.max(0, pendentes.length - concluidos),
      erros
    });
  }
  if (pathname === "/api/admin/fundos/cvm/ingerir-cotas" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = ingerirCotasCvmSchema.parse(await parseJsonBody2(request));
    let inseridos = 0;
    let invalidos = 0;
    const stmts = [];
    for (const item of body.itens) {
      const cnpj = normalizarCnpjDigitos(item.cnpj);
      if (!cnpj) {
        invalidos += 1;
        continue;
      }
      stmts.push(
        env.DB.prepare(
          "INSERT INTO cotas_fundos_cvm (cnpj, data_ref, vl_quota, vl_patrim_liq, nr_cotst, atualizado_em) VALUES (?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(cnpj, data_ref) DO UPDATE SET vl_quota = excluded.vl_quota, vl_patrim_liq = excluded.vl_patrim_liq, nr_cotst = excluded.nr_cotst, atualizado_em = excluded.atualizado_em"
        ).bind(cnpj, item.dataRef, item.vlQuota, item.vlPatrimLiq ?? null, item.nrCotst ?? null)
      );
      inseridos += 1;
    }
    if (stmts.length > 0) await env.DB.batch(stmts);
    if (body.runId) {
      await env.DB.prepare(
        "UPDATE cvm_ingestion_runs SET registros_validos = COALESCE(registros_validos, 0) + ?, registros_invalidos = COALESCE(registros_invalidos, 0) + ?, registros_lidos = COALESCE(registros_lidos, 0) + ?, status = CASE WHEN status = 'queued' THEN 'running' ELSE status END WHERE id = ?"
      ).bind(inseridos, invalidos, inseridos + invalidos, body.runId).run();
    }
    return sucesso({ inseridos, invalidos, runId: body.runId ?? null });
  }
  if (pathname === "/api/admin/fundos/cvm/ingerir-cadastro" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = ingerirCadastroCvmSchema.parse(await parseJsonBody2(request));
    let inseridos = 0;
    let invalidos = 0;
    const stmts = [];
    for (const item of body.itens) {
      const cnpj = normalizarCnpjDigitos(item.cnpj);
      if (!cnpj) {
        invalidos += 1;
        continue;
      }
      stmts.push(
        env.DB.prepare(
          "INSERT INTO fundos_cvm_cadastro (cnpj, denominacao_social, denominacao_norm, classe, situacao, atualizado_em) VALUES (?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(cnpj) DO UPDATE SET denominacao_social = excluded.denominacao_social, denominacao_norm = excluded.denominacao_norm, classe = excluded.classe, situacao = excluded.situacao, atualizado_em = excluded.atualizado_em"
        ).bind(
          cnpj,
          item.denominacaoSocial,
          normalizarDenominacao(item.denominacaoSocial),
          item.classe ?? null,
          item.situacao ?? null
        )
      );
      inseridos += 1;
    }
    if (stmts.length > 0) await env.DB.batch(stmts);
    return sucesso({ inseridos, invalidos });
  }
  if (pathname === "/api/admin/fundos/cvm/buscar-cnpj" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const url = new URL(request.url);
    const q = normalizarDenominacao(url.searchParams.get("q") ?? "");
    if (q.length < 2) return erro("TERMO_CURTO", "Informe ao menos 2 caracteres", 422);
    const limite = Math.min(50, Number.parseInt(url.searchParams.get("limite") ?? "20", 10) || 20);
    const palavras = q.split(" ").filter(Boolean);
    const conds = palavras.map(() => "denominacao_norm LIKE ?").join(" AND ");
    const binds = palavras.map((p) => `%${p}%`);
    const rs = await env.DB.prepare(
      `SELECT cnpj, denominacao_social, classe, situacao FROM fundos_cvm_cadastro WHERE ${conds} ORDER BY CASE WHEN situacao = 'EM FUNCIONAMENTO NORMAL' THEN 0 ELSE 1 END, denominacao_social ASC LIMIT ?`
    ).bind(...binds, limite).all();
    return sucesso({
      resultados: (rs.results ?? []).map((r) => ({
        cnpj: r.cnpj,
        denominacaoSocial: r.denominacao_social,
        classe: r.classe,
        situacao: r.situacao
      }))
    });
  }
  if (pathname === "/api/admin/fundos/cvm/vincular-cnpj" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = vincularCnpjFundoSchema.parse(await parseJsonBody2(request));
    let atualizados = 0;
    let invalidos = 0;
    const stmts = [];
    for (const v of body.vinculos) {
      const cnpj = normalizarCnpjDigitos(v.cnpj);
      if (!cnpj) {
        invalidos += 1;
        continue;
      }
      stmts.push(env.DB.prepare("UPDATE ativos SET cnpj_fundo = ? WHERE id = ?").bind(cnpj, v.ativoId));
      atualizados += 1;
    }
    if (stmts.length > 0) await env.DB.batch(stmts);
    return sucesso({ atualizados, invalidos });
  }
  if (pathname === "/api/admin/fundos/cvm/ativos-sem-cnpj" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const rs = await env.DB.prepare(
      "SELECT id, usuario_id, ticker, nome, categoria, quantidade, preco_medio FROM ativos WHERE categoria IN ('fundo','previdencia') AND (cnpj_fundo IS NULL OR cnpj_fundo = '') ORDER BY nome ASC LIMIT 500"
    ).all();
    return sucesso({
      ativos: (rs.results ?? []).map((r) => ({
        id: r.id,
        usuarioId: r.usuario_id,
        ticker: r.ticker,
        nome: r.nome,
        categoria: r.categoria,
        quantidade: Number(r.quantidade),
        precoMedio: Number(r.preco_medio)
      }))
    });
  }
  if ((pathname === "/api/admin/fundos/cvm/status" || pathname === "/api/admin/cvm/status") && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const totais = await env.DB.prepare(
      "SELECT (SELECT COUNT(*) FROM cotas_fundos_cvm) AS total_cotas, (SELECT COUNT(*) FROM fundos_cvm_cadastro) AS total_cadastro, (SELECT COUNT(DISTINCT cnpj) FROM cotas_fundos_cvm) AS cnpjs_com_cota, (SELECT COUNT(*) FROM ativos WHERE categoria IN ('fundo','previdencia') AND cnpj_fundo IS NOT NULL AND cnpj_fundo != '') AS ativos_vinculados, (SELECT COUNT(*) FROM ativos WHERE categoria IN ('fundo','previdencia')) AS ativos_fundo_total, (SELECT MAX(data_ref) FROM cotas_fundos_cvm) AS data_ref_mais_recente, (SELECT MAX(atualizado_em) FROM cotas_fundos_cvm) AS atualizado_em_mais_recente"
    ).first();
    const ultimaExecucao = await env.DB.prepare(
      "SELECT id, referencia_ano_mes, status, origem_execucao, arquivos_processados, registros_lidos, registros_validos, registros_invalidos, erro_resumo, iniciado_em, finalizado_em FROM cvm_ingestion_runs ORDER BY iniciado_em DESC LIMIT 1"
    ).first();
    const ultimaExecucaoOk = await env.DB.prepare(
      "SELECT id, referencia_ano_mes, status, iniciado_em, finalizado_em FROM cvm_ingestion_runs WHERE status = 'completed' ORDER BY iniciado_em DESC LIMIT 1"
    ).first();
    const dataRefMaisRecente = totais?.data_ref_mais_recente ?? null;
    const freshnessDias = dataRefMaisRecente ? Math.floor((Date.now() - (/* @__PURE__ */ new Date(`${dataRefMaisRecente}T00:00:00Z`)).getTime()) / (24 * 3600 * 1e3)) : null;
    return sucesso({
      totalCotas: Number(totais?.total_cotas ?? 0),
      totalCadastro: Number(totais?.total_cadastro ?? 0),
      cnpjsComCota: Number(totais?.cnpjs_com_cota ?? 0),
      ativosFundoVinculados: Number(totais?.ativos_vinculados ?? 0),
      ativosFundoTotal: Number(totais?.ativos_fundo_total ?? 0),
      dataset: {
        dataRefMaisRecente,
        atualizadoEmMaisRecente: totais?.atualizado_em_mais_recente ?? null,
        freshnessDias
      },
      ultimaExecucao: ultimaExecucao ? {
        id: ultimaExecucao.id,
        referenciaAnoMes: ultimaExecucao.referencia_ano_mes,
        status: ultimaExecucao.status,
        origemExecucao: ultimaExecucao.origem_execucao,
        arquivosProcessados: Number(ultimaExecucao.arquivos_processados ?? 0),
        registrosLidos: Number(ultimaExecucao.registros_lidos ?? 0),
        registrosValidos: Number(ultimaExecucao.registros_validos ?? 0),
        registrosInvalidos: Number(ultimaExecucao.registros_invalidos ?? 0),
        erroResumo: ultimaExecucao.erro_resumo,
        iniciadoEm: ultimaExecucao.iniciado_em,
        finalizadoEm: ultimaExecucao.finalizado_em
      } : null,
      ultimaExecucaoCompleta: ultimaExecucaoOk ? {
        id: ultimaExecucaoOk.id,
        referenciaAnoMes: ultimaExecucaoOk.referencia_ano_mes,
        iniciadoEm: ultimaExecucaoOk.iniciado_em,
        finalizadoEm: ultimaExecucaoOk.finalizado_em
      } : null
    });
  }
  if (pathname === "/api/admin/cvm/runs" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = abrirRunCvmSchema.parse(await parseJsonBody2(request));
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO cvm_ingestion_runs (id, referencia_ano_mes, status, origem_execucao, iniciado_em) VALUES (?, ?, 'running', ?, datetime('now'))"
    ).bind(id, body.referenciaAnoMes, body.origemExecucao).run();
    return sucesso({
      id,
      referenciaAnoMes: body.referenciaAnoMes,
      origemExecucao: body.origemExecucao,
      status: "running"
    });
  }
  if (pathname === "/api/admin/cvm/runs" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const url = new URL(request.url);
    const limite = Math.min(100, Number.parseInt(url.searchParams.get("limite") ?? "20", 10) || 20);
    const rs = await env.DB.prepare(
      "SELECT id, referencia_ano_mes, status, origem_execucao, arquivos_processados, registros_lidos, registros_validos, registros_invalidos, erro_resumo, iniciado_em, finalizado_em FROM cvm_ingestion_runs ORDER BY iniciado_em DESC LIMIT ?"
    ).bind(limite).all();
    return sucesso({
      runs: (rs.results ?? []).map((r) => ({
        id: r.id,
        referenciaAnoMes: r.referencia_ano_mes,
        status: r.status,
        origemExecucao: r.origem_execucao,
        arquivosProcessados: Number(r.arquivos_processados ?? 0),
        registrosLidos: Number(r.registros_lidos ?? 0),
        registrosValidos: Number(r.registros_validos ?? 0),
        registrosInvalidos: Number(r.registros_invalidos ?? 0),
        erroResumo: r.erro_resumo,
        iniciadoEm: r.iniciado_em,
        finalizadoEm: r.finalizado_em
      }))
    });
  }
  if (/^\/api\/admin\/cvm\/runs\/[0-9a-fA-F-]{36}$/.test(pathname) && request.method === "PATCH") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const id = pathname.split("/").pop();
    const body = atualizarRunCvmSchema.parse(await parseJsonBody2(request));
    const sets = [];
    const binds = [];
    if (body.status) {
      sets.push("status = ?");
      binds.push(body.status);
    }
    if (body.arquivosProcessados !== void 0) {
      sets.push("arquivos_processados = ?");
      binds.push(body.arquivosProcessados);
    }
    if (body.registrosLidos !== void 0) {
      sets.push("registros_lidos = ?");
      binds.push(body.registrosLidos);
    }
    if (body.registrosValidos !== void 0) {
      sets.push("registros_validos = ?");
      binds.push(body.registrosValidos);
    }
    if (body.registrosInvalidos !== void 0) {
      sets.push("registros_invalidos = ?");
      binds.push(body.registrosInvalidos);
    }
    if (body.erroResumo !== void 0) {
      sets.push("erro_resumo = ?");
      binds.push(body.erroResumo);
    }
    if (body.finalizar) {
      sets.push("finalizado_em = datetime('now')");
    }
    if (sets.length === 0) return erro("NADA_A_ATUALIZAR", "Nenhum campo informado", 422);
    binds.push(id);
    const resultado = await env.DB.prepare(`UPDATE cvm_ingestion_runs SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();
    const afetados = Number(resultado.meta?.changes ?? 0);
    if (afetados === 0) return erro("RUN_NAO_ENCONTRADO", "Run n\xE3o encontrado", 404);
    const atual = await env.DB.prepare(
      "SELECT id, referencia_ano_mes, status, origem_execucao, arquivos_processados, registros_lidos, registros_validos, registros_invalidos, erro_resumo, iniciado_em, finalizado_em FROM cvm_ingestion_runs WHERE id = ?"
    ).bind(id).first();
    return sucesso({
      run: atual && {
        id: atual.id,
        referenciaAnoMes: atual.referencia_ano_mes,
        status: atual.status,
        origemExecucao: atual.origem_execucao,
        arquivosProcessados: Number(atual.arquivos_processados ?? 0),
        registrosLidos: Number(atual.registros_lidos ?? 0),
        registrosValidos: Number(atual.registros_validos ?? 0),
        registrosInvalidos: Number(atual.registros_invalidos ?? 0),
        erroResumo: atual.erro_resumo,
        iniciadoEm: atual.iniciado_em,
        finalizadoEm: atual.finalizado_em
      }
    });
  }
  if (pathname === "/api/admin/cvm/backfill/plan" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = planBackfillSchema.parse(await parseJsonBody2(request));
    const agregados = await env.DB.prepare(
      "SELECT MIN(data_aquisicao) AS menor_data, COUNT(DISTINCT cnpj_fundo) AS total_cnpjs FROM ativos WHERE categoria IN ('fundo','previdencia') AND cnpj_fundo IS NOT NULL AND cnpj_fundo != ''"
    ).first();
    const cnpjsRs = await env.DB.prepare(
      "SELECT DISTINCT cnpj_fundo AS cnpj FROM ativos WHERE categoria IN ('fundo','previdencia') AND cnpj_fundo IS NOT NULL AND cnpj_fundo != ''"
    ).all();
    const cnpjsDisponiveis = (cnpjsRs.results ?? []).map((r) => r.cnpj);
    const plano = planejarBackfill({
      intervaloInicial: body.intervaloInicial,
      intervaloFinal: body.intervaloFinal,
      janelaPadraoMeses: body.janelaPadraoMeses,
      margemMeses: body.margemMeses,
      menorDataAquisicao: agregados?.menor_data ?? null,
      cnpjsDisponiveis,
      cnpjsOverride: body.cnpjs
    });
    return sucesso({
      intervaloInicial: plano.intervaloInicial,
      intervaloFinal: plano.intervaloFinal,
      totalMesesPrevistos: plano.totalMesesPrevistos,
      meses: plano.meses,
      cnpjs: plano.cnpjs,
      totalFundos: plano.cnpjs.length,
      origem: plano.origem,
      contexto: {
        menorDataAquisicao: agregados?.menor_data ?? null,
        totalCnpjsDisponiveis: Number(agregados?.total_cnpjs ?? 0)
      }
    });
  }
  if (pathname === "/api/admin/cvm/backfill/runs" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = abrirBackfillSchema.parse(await parseJsonBody2(request));
    if (!body.intervaloInicial || !body.intervaloFinal) {
      return erro("INTERVALO_OBRIGATORIO", "Informe intervaloInicial e intervaloFinal (use /backfill/plan para calcular).", 422);
    }
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO cvm_backfill_runs (id, status, origem_execucao, intervalo_inicial, intervalo_final, total_meses_previstos, total_fundos, iniciado_em) VALUES (?, 'running', ?, ?, ?, ?, ?, datetime('now'))"
    ).bind(
      id,
      body.origemExecucao,
      body.intervaloInicial,
      body.intervaloFinal,
      body.totalMesesPrevistos ?? 0,
      body.totalFundos ?? 0
    ).run();
    return sucesso({
      id,
      status: "running",
      intervaloInicial: body.intervaloInicial,
      intervaloFinal: body.intervaloFinal,
      origemExecucao: body.origemExecucao
    });
  }
  if (pathname === "/api/admin/cvm/backfill/runs" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const url = new URL(request.url);
    const limite = Math.min(100, Number.parseInt(url.searchParams.get("limite") ?? "20", 10) || 20);
    const rs = await env.DB.prepare(
      "SELECT id, status, origem_execucao, intervalo_inicial, intervalo_final, total_meses_previstos, total_meses_processados, total_fundos, registros_lidos, registros_gravados, registros_invalidos, erro_resumo, iniciado_em, finalizado_em FROM cvm_backfill_runs ORDER BY iniciado_em DESC LIMIT ?"
    ).bind(limite).all();
    return sucesso({
      runs: (rs.results ?? []).map((r) => ({
        id: r.id,
        status: r.status,
        origemExecucao: r.origem_execucao,
        intervaloInicial: r.intervalo_inicial,
        intervaloFinal: r.intervalo_final,
        totalMesesPrevistos: Number(r.total_meses_previstos ?? 0),
        totalMesesProcessados: Number(r.total_meses_processados ?? 0),
        totalFundos: Number(r.total_fundos ?? 0),
        registrosLidos: Number(r.registros_lidos ?? 0),
        registrosGravados: Number(r.registros_gravados ?? 0),
        registrosInvalidos: Number(r.registros_invalidos ?? 0),
        erroResumo: r.erro_resumo,
        iniciadoEm: r.iniciado_em,
        finalizadoEm: r.finalizado_em
      }))
    });
  }
  if (/^\/api\/admin\/cvm\/backfill\/runs\/[0-9a-fA-F-]{36}$/.test(pathname) && request.method === "PATCH") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const id = pathname.split("/").pop();
    const body = atualizarBackfillSchema.parse(await parseJsonBody2(request));
    const sets = [];
    const binds = [];
    if (body.status) {
      sets.push("status = ?");
      binds.push(body.status);
    }
    if (body.totalMesesProcessados !== void 0) {
      sets.push("total_meses_processados = ?");
      binds.push(body.totalMesesProcessados);
    }
    if (body.totalFundos !== void 0) {
      sets.push("total_fundos = ?");
      binds.push(body.totalFundos);
    }
    if (body.registrosLidos !== void 0) {
      sets.push("registros_lidos = ?");
      binds.push(body.registrosLidos);
    }
    if (body.registrosGravados !== void 0) {
      sets.push("registros_gravados = ?");
      binds.push(body.registrosGravados);
    }
    if (body.registrosInvalidos !== void 0) {
      sets.push("registros_invalidos = ?");
      binds.push(body.registrosInvalidos);
    }
    if (body.erroResumo !== void 0) {
      sets.push("erro_resumo = ?");
      binds.push(body.erroResumo);
    }
    if (body.finalizar) {
      sets.push("finalizado_em = datetime('now')");
    }
    if (sets.length === 0) return erro("NADA_A_ATUALIZAR", "Nenhum campo informado", 422);
    binds.push(id);
    const resultado = await env.DB.prepare(`UPDATE cvm_backfill_runs SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();
    const afetados = Number(resultado.meta?.changes ?? 0);
    if (afetados === 0) return erro("RUN_NAO_ENCONTRADO", "Backfill run n\xE3o encontrado", 404);
    return sucesso({ atualizado: true });
  }
  if (pathname === "/api/admin/cvm/backfill/ingest-lote" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const schema = external_exports.object({
      runId: external_exports.string().uuid(),
      itens: external_exports.array(cotaCvmSchema).min(1).max(5e3),
      registrosLidosLote: external_exports.number().int().nonnegative().default(0)
    });
    const body = schema.parse(await parseJsonBody2(request));
    let gravados = 0;
    let invalidos = 0;
    const stmts = [];
    for (const item of body.itens) {
      const cnpj = normalizarCnpjDigitos(item.cnpj);
      if (!cnpj) {
        invalidos += 1;
        continue;
      }
      stmts.push(
        env.DB.prepare(
          "INSERT INTO cotas_fundos_cvm (cnpj, data_ref, vl_quota, vl_patrim_liq, nr_cotst, atualizado_em) VALUES (?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(cnpj, data_ref) DO UPDATE SET vl_quota = excluded.vl_quota, vl_patrim_liq = excluded.vl_patrim_liq, nr_cotst = excluded.nr_cotst, atualizado_em = excluded.atualizado_em"
        ).bind(cnpj, item.dataRef, item.vlQuota, item.vlPatrimLiq ?? null, item.nrCotst ?? null)
      );
      gravados += 1;
    }
    if (stmts.length > 0) await env.DB.batch(stmts);
    await env.DB.prepare(
      "UPDATE cvm_backfill_runs SET registros_gravados = COALESCE(registros_gravados,0) + ?, registros_invalidos = COALESCE(registros_invalidos,0) + ?, registros_lidos = COALESCE(registros_lidos,0) + ? WHERE id = ?"
    ).bind(gravados, invalidos, body.registrosLidosLote, body.runId).run();
    return sucesso({ gravados, invalidos, runId: body.runId });
  }
  if (pathname === "/api/admin/cvm/ingestion-trigger" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = triggerIngestaoSchema.parse(await parseJsonBody2(request));
    const agora = /* @__PURE__ */ new Date();
    const mesAtual = `${agora.getUTCFullYear()}-${String(agora.getUTCMonth() + 1).padStart(2, "0")}`;
    const referenciaAnoMes = body.referenciaAnoMes ?? mesAtual;
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO cvm_ingestion_runs (id, referencia_ano_mes, status, origem_execucao, iniciado_em) VALUES (?, ?, 'queued', ?, datetime('now'))"
    ).bind(id, referenciaAnoMes, body.origemExecucao).run();
    return sucesso({
      id,
      referenciaAnoMes,
      status: "queued",
      origemExecucao: body.origemExecucao,
      aviso: "Trigger registrado. A execu\xE7\xE3o efetiva ocorre fora do Worker (GitHub Action agendado ou `npm run ingest:cvm` manual). Este endpoint n\xE3o baixa nem processa o CSV da CVM."
    });
  }
  return null;
}
__name(handleAdminRoutes, "handleAdminRoutes");

// src/server/routes/score.routes.ts
async function handleScoreRoutes(pathname, request, env, sessao) {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/score")) return null;
  const service = new UnifiedScoreService(env.DB);
  const validarAdmin = /* @__PURE__ */ __name(async () => {
    const autorizado = await usuarioEhAdmin(env.DB, sessao.usuario.email, {
      adminTokenHeader: request.headers.get("x-admin-token"),
      adminTokenEnv: env.ADMIN_TOKEN,
      adminEmailsEnv: env.ADMIN_EMAILS
    });
    if (!autorizado) return erro("ACESSO_NEGADO", "Acesso administrativo negado", 403);
    return null;
  }, "validarAdmin");
  if (pathname === "/api/score/unified/calculate" && request.method === "POST") {
    const body = await parseJsonBody2(request);
    const requestedUserId = String(body.userId ?? "").trim();
    const targetUserId = requestedUserId || sessao.usuario.id;
    if (targetUserId !== sessao.usuario.id) {
      const erroAdmin = await validarAdmin();
      if (erroAdmin) return erroAdmin;
    }
    return sucesso(await service.calculateForUser(targetUserId));
  }
  if (pathname === "/api/score/unified/preview" && request.method === "POST") {
    const body = await parseJsonBody2(request);
    return sucesso(await service.preview(body));
  }
  if (pathname.startsWith("/api/score/unified/") && pathname.endsWith("/history") && request.method === "GET") {
    const userId = pathname.replace("/api/score/unified/", "").replace("/history", "");
    const alvo = userId || sessao.usuario.id;
    if (alvo !== sessao.usuario.id) {
      const erroAdmin = await validarAdmin();
      if (erroAdmin) return erroAdmin;
    }
    return sucesso(await service.getHistory(alvo));
  }
  return null;
}
__name(handleScoreRoutes, "handleScoreRoutes");

// src/server/routes/telemetria.routes.ts
var telemetriaEventoSchema = external_exports.object({
  nomeEvento: external_exports.string().min(3).max(120),
  payload: external_exports.record(external_exports.unknown()).optional(),
  origem: external_exports.string().min(2).max(40).optional()
});
async function handleTelemetriaRoutes(pathname, request, env, sessao) {
  if (pathname === "/api/telemetria/evento" && request.method === "POST") {
    const body = telemetriaEventoSchema.parse(await parseJsonBody2(request));
    const usuarioId = sessao?.usuario?.id ?? null;
    await env.DB.prepare("INSERT INTO telemetria_eventos (id, usuario_id, nome_evento, payload_json, origem, criado_em) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), usuarioId, body.nomeEvento, JSON.stringify(body.payload ?? {}), body.origem ?? "web", (/* @__PURE__ */ new Date()).toISOString()).run();
    return sucesso({ registrado: true });
  }
  return null;
}
__name(handleTelemetriaRoutes, "handleTelemetriaRoutes");

// src/index.ts
var routePrefixes = [
  "/api/auth",
  "/api/carteira",
  "/api/importacao",
  "/api/perfil",
  "/api/insights",
  "/api/historico",
  "/api/decisoes",
  "/api/vera",
  "/api/posicoes",
  "/api/app",
  "/api/admin",
  "/api/telemetria",
  "/api/market",
  "/api/funds",
  "/api/portfolio",
  "/api/fipe",
  "/api/score",
  "/api/financial-core",
  "/api/aportes"
];
var isPublicRoute = /* @__PURE__ */ __name((pathname) => pathname === "/api/auth/registrar" || pathname === "/api/auth/registro" || pathname === "/api/auth/entrar" || pathname === "/api/auth/login" || pathname === "/api/auth/verificar-cadastro" || pathname === "/api/auth/recuperar-senha" || pathname === "/api/auth/recuperar-acesso" || pathname === "/api/auth/redefinir-senha" || pathname === "/api/admin/test-data/reset" || pathname === "/api/telemetria/evento" || pathname === "/api/app/content" || pathname === "/api/app/corretoras" || pathname === "/api/app/simulacoes/parametros" || pathname.startsWith("/api/market/") || pathname.startsWith("/api/funds/"), "isPublicRoute");
var corsHeaders = /* @__PURE__ */ __name(() => ({
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,x-admin-token"
}), "corsHeaders");
var json = /* @__PURE__ */ __name((payload, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { ...corsHeaders(), "content-type": "application/json; charset=utf-8" }
}), "json");
var extrairToken = /* @__PURE__ */ __name((request) => {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const [tipo, token] = auth.split(" ");
  if (!tipo || !token || tipo.toLowerCase() !== "bearer") return null;
  return token;
}, "extrairToken");
async function dispatch(pathname, request, env, sessao, ctx) {
  const financialRoute = await handleFinancialRoutes(pathname, request, env);
  if (financialRoute) return financialRoute;
  const routers = [
    () => handleAuthRoutes(pathname, request, env, sessao, ctx),
    () => handleTelemetriaRoutes(pathname, request, env, sessao),
    () => handleAppRoutes(pathname, request, env, sessao),
    () => handleAdminRoutes(pathname, request, env, sessao),
    () => handleFinancialCoreRoutes(pathname, request, env, sessao),
    () => handleCarteiraRoutes(pathname, request, env, sessao, ctx),
    () => handleInsightsRoutes(pathname, request, env, sessao, ctx),
    () => handlePerfilRoutes(pathname, request, env, sessao),
    () => handleHistoricoRoutes(pathname, request, env, sessao, ctx),
    () => handlePosicoesRoutes(pathname, request, env, sessao),
    () => handleAportesRoutes(pathname, request, env, sessao),
    () => handleDecisoesRoutes(pathname, request, env, sessao),
    () => handleImportacaoRoutes(pathname, request, env, sessao, ctx),
    () => handleVeraRoutes(pathname, request, env, sessao),
    () => handleScoreRoutes(pathname, request, env, sessao)
  ];
  for (const router of routers) {
    const result = await router();
    if (result !== null) return result;
  }
  return { ok: false, status: 404, codigo: "ROTA_NAO_ENCONTRADA", mensagem: "Rota n\xE3o encontrada" };
}
__name(dispatch, "dispatch");
var index_default = {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
    if (!pathname.startsWith("/api/")) {
      return json({ ok: false, erro: { codigo: "ROTA_INVALIDA", mensagem: "Prefixo de rota inv\xE1lido" } }, 404);
    }
    const isAllowedPrefix = routePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    if (!isAllowedPrefix) {
      return json({ ok: false, erro: { codigo: "ROTA_INVALIDA", mensagem: "Prefixo de rota inv\xE1lido" } }, 404);
    }
    try {
      let sessao = null;
      if (!isPublicRoute(pathname)) {
        const token = extrairToken(request);
        if (!token) {
          return json({ ok: false, erro: { codigo: "NAO_AUTORIZADO", mensagem: "Token ausente" } }, 401);
        }
        sessao = await buildAuthService(env).obterSessao(token);
      }
      const resultado = await dispatch(pathname, request, env, sessao, ctx);
      if (!resultado.ok) {
        return json(
          { ok: false, erro: { codigo: resultado.codigo, mensagem: resultado.mensagem, detalhes: resultado.detalhes } },
          resultado.status
        );
      }
      return json({ ok: true, dados: resultado.dados }, 200);
    } catch (error) {
      if (error instanceof ZodError) {
        return json({ ok: false, erro: { codigo: "VALIDACAO", mensagem: "Payload inv\xE1lido", detalhes: error.flatten() } }, 422);
      }
      if (error instanceof ErroAutenticacao) {
        return json({ ok: false, erro: { codigo: error.codigo, mensagem: error.message } }, error.status);
      }
      if (error instanceof ErroImportacao) {
        return json({ ok: false, erro: { codigo: error.codigo, mensagem: error.message, detalhes: error.detalhes } }, error.status);
      }
      return json({ ok: false, erro: { codigo: "ERRO_INTERNO", mensagem: "Falha interna no gateway" } }, 500);
    }
  },
  async scheduled(event, env, ctx) {
    if (event.cron === "0 3 * * *") {
      ctx.waitUntil(registrarFechamentoMensalTodosUsuarios(env).catch(() => {
      }));
      return;
    }
    ctx.waitUntil(refreshAllUsersMarketQuotes(env).catch(() => {
    }));
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
