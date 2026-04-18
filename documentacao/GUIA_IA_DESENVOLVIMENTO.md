# 🤖 Guia de Desenvolvimento para IAs

**Para Claude, Gemini, Codex, ChatGPT e outras IAs trabalhando no Esquilo Invest**

---

## ⚠️ REGRA DE OURO

🚨 **A branch `master` faz deploy automático em produção via Cloudflare Pages**

**NUNCA, JAMAIS, EM HIPÓTESE ALGUMA:**
- Faça commit direto em `master`
- Mergue sua branch direto em `master` sem PR
- Deixe código quebrado em `master`
- Suba features incompletas em `master`

Se quebrar `master`, você derruba a aplicação para todos os usuários reais.

---

## 🌳 Modelo de Branches

### Estrutura: `tipo/descrição-curta`

**Tipos de branch:**

| Tipo | Uso | Exemplo |
|------|-----|---------|
| `feat/` | Nova feature | `feat/dark-mode`, `feat/filtro-carteira` |
| `fix/` | Bug fix | `fix/login-crash`, `fix/calculo-valor` |
| `refactor/` | Refatoração | `refactor/api-gateway`, `refactor/hooks` |
| `docs/` | Documentação | `docs/architecture`, `docs/setup` |
| `chore/` | Tarefas/deps | `chore/update-deps`, `chore/lint-config` |
| `perf/` | Performance | `perf/cache-api`, `perf/lazy-load` |
| `test/` | Testes | `test/auth-flow`, `test/carteira-calc` |

### Regras de Nomenclatura

✅ **BOM:**
```
feat/dark-mode
fix/calculo-rentabilidade
refactor/lista-insights
docs/api-routes
chore/update-packages
```

❌ **RUIM:**
```
feature/implementar-dark-mode-completo-com-todas-cores-e-componentes
fix/arruma-isso-que-ta-quebrado
refactor/tudao
melhoria-geral-tudo
bla-bla-qualquer-coisa
```

**Regras:**
- Use **kebab-case** (hífens, minúsculas)
- Máximo **30 caracteres** de descrição
- Seja **específico e criativo** (não genérico)
- Use **nomes em português** (conforme arquitetura do repo)

---

## 📋 Workflow de Desenvolvimento

### 1. **Criar sua branch**

```bash
# Sempre partir de master atualizada
git checkout master
git pull origin master

# Criar sua branch
git checkout -b feat/sua-feature

# OU: criar e enviar para remoto
git checkout -b feat/sua-feature
git push -u origin feat/sua-feature
```

### 2. **Trabalhar na branch**

```bash
# Fazer commits regularmente (não um megacommit no final)
git add arquivo-modificado.jsx
git commit -m "feat: adicionar botão de tema escuro"

git add otro-archivo.css
git commit -m "style: cores dark mode em Tailwind"

# Push incremental
git push origin feat/sua-feature
```

### 3. **Criar Pull Request**

Quando a feature está pronta:

```bash
git push origin feat/sua-feature
# Depois ir no GitHub e criar PR
```

**Título da PR:** `feat: descrição curta` (máx 60 chars)

**Descrição da PR:**
```markdown
## O que foi feito
- Adicionado dark mode completo
- Cores em variáveis CSS
- Toggle no Perfil

## Como testar
1. Ir para /perfil
2. Clicar no ícone de tema
3. Verificar que cores mudam

## Checklist
- [ ] Testado em mobile
- [ ] Testado em desktop
- [ ] Sem console errors
- [ ] TypeScript compila (npm run typecheck)
- [ ] Build passa (npm run build)
```

### 4. **Review & Merge**

- ✅ **Code review:** Alguém (outra IA ou humano) revisa
- ✅ **Testes:** Passar em todos os testes
- ✅ **Build:** `npm run build` deve passar
- ✅ **Typecheck:** `npm run typecheck` deve passar
- ✅ **Sem conflitos:** Rebase/merge com master sem conflitos

**NÃO MERGUE sua própria PR** — pedir review de outra IA ou do Luiz.

### 5. **Mergear para Master**

```bash
# Se tudo passou no review, mergear via GitHub
# (Preferir "Squash and merge" para commits limpos)
```

---

## 📝 Padrão de Commits

### Formato: `tipo: descrição`

```
feat: adicionar filtro por categoria na carteira
fix: corrigir cálculo de rentabilidade mensal
refactor: simplificar hook de portfolio
docs: atualizar API docs
chore: update dependencies
style: formatar código com prettier
test: adicionar testes de autenticação
```

**Regras:**
- Use **tipos convencionais** (feat, fix, refactor, docs, etc)
- Descrição em **português**
- **Minúscula** no início da descrição
- Máximo **72 caracteres** na primeira linha
- Se precisar de mais detalhes, use corpo do commit (após linha em branco)

**Exemplo completo:**
```
feat: implementar dark mode na carteira

- Adicionar preferência de tema no localStorage
- Criar variáveis CSS para cores light/dark
- Atualizar componentes com theme provider
- Testar em navegadores principais

Fixes: #42
```

---

## 🗂️ Estrutura do Repositório

**Revise sempre** `ARQUITETURA_REPOSITORIO.md` para:
- Onde colocar componentes novos
- Onde colocar hooks personalizados
- Onde colocar tipos TypeScript
- Onde colocar serviços/API calls
- Onde colocar testes

**Quick Reference:**

```
apresentacao/src/
├── features/      → Funcionalidades (Home, Carteira, Insights)
├── components/    → Componentes reutilizáveis
├── hooks/         → Custom hooks
├── services/      → API calls
├── types/         → Types TypeScript
├── utils/         → Funções utilitárias
└── styles/        → CSS/Tailwind

servidores/
├── porta-entrada/ → API Gateway (Cloudflare Workers)
└── modulos-backend/
    ├── autenticacao/
    ├── carteira/
    ├── insights/
    └── ... (outros serviços)

bibliotecas/
├── contratos/     → Types compartilhados
├── utilitarios/   → Funções compartilhadas
└── validacao/     → Schemas Zod
```

---

## ✅ Checklist Antes de Fazer PR

```
[ ] Minha branch partiu de master atualizada
[ ] Não tenho merge conflicts
[ ] npm run build passa (sem erros)
[ ] npm run typecheck passa (sem erros)
[ ] npm run dev funciona sem crashes
[ ] Testei a feature manualmente
[ ] Código está formatado (prettier/eslint)
[ ] Commits têm mensagens boas
[ ] PR descreve claramente o que foi feito
[ ] Revisei meu próprio código (self-review)
[ ] Não tenho console.logs de debug
[ ] Não tenho arquivos .env ou secrets
[ ] Retirei console.errors/warnings desnecessários
```

---

## 🚨 Situações de Risco

### "Eu cometi em master acidentalmente!"

```bash
# CALMA. Desfazer:
git reset --soft HEAD~1     # Volta o commit mas mantém mudanças
git checkout -b feat/minha-feature  # Cria nova branch
git commit -m "feat: descrição"
git push -u origin feat/minha-feature
# Depois fazer PR normal
```

### "Minha branch tem conflitos com master!"

```bash
git fetch origin
git rebase origin/master
# Resolver conflitos (seu editor vai marcar)
# Depois:
git add arquivos-resolvidos
git rebase --continue
git push -f origin feat/sua-feature  # force porque rebase muda history
```

### "Preciso sincronizar com master enquanto desenvolvo"

```bash
# Sua branch está desatualizada? Sincronize:
git fetch origin
git rebase origin/master
# OU se prefere merge (menos limpo):
git merge origin/master
```

### "Alguém mergeou uma coisa que quebrou master!"

1. ✋ **PARE tudo**
2. 🔍 Identifique o commit que quebrou
3. 🔙 Revert rápido: `git revert COMMIT_HASH`
4. 🚀 Push e espera deploy (~1-2 min)
5. 📋 Depois investigar o que deu errado em nova branch

```bash
git revert abc123def  # Cria commit que desfaz abc123def
git push origin master  # Deploy automático ativa
```

---

## 🎯 Boas Práticas Gerais

### Para IAs trabalhando em paralelo

1. **Comunique-se via branch name**
   - Nomes de branch indicam o que está sendo feito
   - Não puxe a branch de outro sem avisar

2. **Evite modificar os mesmos arquivos**
   - Se outro está em `refactor/api-gateway`, não modifique gateway files
   - Prefira trabalhar em features/areas diferentes

3. **Commits pequenos e frequentes**
   - Não faça um commit gigante no final
   - Vários commits pequenos = mais fácil reverter se errado
   - Mais fácil de revisar

4. **Sincronize com master regularmente**
   - Antes de abrir PR, sincronize com master
   - Evita conflitos grandes no final

5. **Respeite .gitignore**
   - Não commite: node_modules, .env, builds, .cache
   - Adicione ao .gitignore se achar que falta algo

6. **Escreva bom código**
   - Legível > Impressionante
   - Use tipos TypeScript (não `any`)
   - Evite lógica complexa (use funções pequenas)
   - Adicione comentários se lógica for não-óbvia

### Antes de fazer push final

```bash
# 1. Verificar build
npm run build

# 2. Verificar types
npm run typecheck

# 3. Verificar testes (se houver)
npm run test

# 4. Revisar commits
git log origin/master..HEAD

# 5. Só então push
git push origin feat/sua-feature
```

---

## 📚 Padrões de Código

### TypeScript
```typescript
// ✅ BOM: tipos claros
interface Usuario {
  id: string;
  nome: string;
  email: string;
}

function buscarUsuario(id: string): Promise<Usuario> {
  // ...
}

// ❌ RUIM: qualquer tipo
function buscarUsuario(id: any): any {
  // ...
}
```

### React Components
```typescript
// ✅ BOM: componente funcional com tipos
interface CardProps {
  titulo: string;
  descricao: string;
  onClique?: () => void;
}

export function Card({ titulo, descricao, onClique }: CardProps) {
  return (
    <div onClick={onClique}>
      <h2>{titulo}</h2>
      <p>{descricao}</p>
    </div>
  );
}

// ❌ RUIM: sem tipos, lógica complexa inline
export function Card(props) {
  return (
    <div onClick={() => {
      if (props.onClique && props.tema === 'dark' && localStorage.getItem('user')) {
        props.onClique();
      }
    }}>
      {props.titulo}
    </div>
  );
}
```

### Hooks Personalizados
```typescript
// ✅ BOM: nome descritivo, tipo retorno claro
function useCarteira(): Carteira {
  const [carteira, setCarteira] = useState<Carteira | null>(null);
  // ...
  return carteira;
}

// ❌ RUIM: nome genérico, sem tipos
function useData() {
  const [data, setData] = useState({});
  // ...
  return data;
}
```

---

## 🔄 Exemplo Completo: Criar Feature do Zero

```bash
# 1. Criar branch
git checkout -b feat/notificacoes-carteira

# 2. Trabalhar (exemplos de commits)
git add src/features/carteira/Notificacao.jsx
git commit -m "feat: criar componente de notificação"

git add src/hooks/useNotificacoes.ts
git commit -m "feat: implementar hook de notificações"

git add src/services/notificacao.ts
git commit -m "feat: integrar API de notificações"

# 3. Sincronizar com master (antes de PR)
git fetch origin
git rebase origin/master
# (resolver conflitos se houver)

# 4. Fazer última verificação
npm run build
npm run typecheck

# 5. Push
git push -u origin feat/notificacoes-carteira

# 6. Criar PR no GitHub com boa descrição

# 7. Pedir review (aguardar aprovação)

# 8. Se aprovado, mergear (via GitHub UI)

# 9. Deletar branch (GitHub oferece opção)
git branch -d feat/notificacoes-carteira
```

---

## 📞 Dúvidas ou Problemas?

Se algo der errado:

1. **Antes de sair deletando branches**, pergunte
2. **Commit errado?** Use `git revert` (não `git reset --hard`)
3. **Arquivo deletado por acidente?** Recupere via `git restore`
4. **Master quebrada?** Revert o commit problemático

**Melhor pedir desculpas depois do que silenciosamente estragar tudo.**

---

## 🎨 Tom do Desenvolvimento

- 🚀 **Seja rápido** mas não apressado
- 📝 **Escreva código claro** e bem comentado
- 🧪 **Teste antes de subir** (nunca assuma)
- 🤝 **Colabore** com outras IAs/humanos
- 📚 **Estude o código** antes de mexer
- 🛑 **Respeite master** como sagrada (porque é)

---

**Última atualização:** 2026-04-17  
**Versão:** 1.0 — Primeira versão do guia para IAs

Leia este guia sempre que começar trabalho novo no repositório. Sua presença aqui = compromisso de seguir. 🤝
