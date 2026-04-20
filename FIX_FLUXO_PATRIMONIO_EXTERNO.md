# Fix: Fluxo Patrimônio Externo (Imóveis e Veículos)

**Data:** 2026-04-20  
**Commit:** Será atualizado após merge  
**Status:** 🔧 Em implementação

---

## O Problema

Usuário Luiz tem R$ 280k (2 imóveis) + R$ 86k (1 veículo) registrados em `posicoes_financeiras` (dados operacionais de carteira), mas esses dados **não aparecem**:

1. ❌ No painel de perfil (aba "Patrimônio externo")
2. ❌ Na tela de "Bens" da carteira
3. ❌ Na tela home de patrimônio

**Raiz do Problema (INVESTIGAÇÃO):**

Identificamos dois problemas entrelaçados:

### Problema 1: Frontend não mostra feedback de erro
- Componente `PerfilUsuario.jsx` permite editar imovel/veiculo
- Chama `salvarContextoFinanceiro()` ao clicar "Salvar Alterações"
- **MAS** se houver erro, o usuário não recebe feedback visual
- E se o usuário nunca clicou "Salvar", os dados local também desaparecem ao navegar

### Problema 2: Dados não estão em perfil_contexto_financeiro
- Tabela `perfil_contexto_financeiro` está **VAZIA** para este usuário
- Dados estão em `posicoes_financeiras` (import de carteira)
- UI endpoints esperam dados em `perfil_contexto_financeiro`
- **Resultado:** Dados não aparecem em lugar nenhum

---

## A Solução (2 Partes)

### Parte 1: Sincronizar Dados Existentes

**Opção A: Via API Admin Endpoint (RECOMENDADO)**

**Arquivo:** `utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs`

Script que chama o novo endpoint `/api/admin/patrimonio/sincronizar-externo` (adicionado a `admin.routes.ts`).

**Como usar:**

```bash
# Preview (sem alterar dados) - apenas Luiz
EI_ADMIN_TOKEN=<seu_jwt_admin> node utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs \
  --usuario-id=4a858baf-fd89-42a8-84f2-d45c7489b2a3 \
  --dry-run

# Aplicar sincronização - apenas Luiz
EI_ADMIN_TOKEN=<seu_jwt_admin> node utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs \
  --usuario-id=4a858baf-fd89-42a8-84f2-d45c7489b2a3

# Preview de todos os usuários
EI_ADMIN_TOKEN=<seu_jwt_admin> node utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs --dry-run

# Sincronizar TODOS os usuários com bens
EI_ADMIN_TOKEN=<seu_jwt_admin> node utilitarios/scripts/sincronizar-patrimonio-externo-api.mjs
```

**Requisitos:**
- JWT admin válido em `EI_ADMIN_TOKEN`
- Pode apontar para ambiente local ou produção via `EI_API_URL`
- Padrão: `https://ei-api-gateway.giammattey-luiz.workers.dev`

---

**Opção B: Via Script Local (Alternativa)**

**Arquivo:** `utilitarios/scripts/sincronizar-patrimonio-externo.mjs`

Script que acessa banco local diretamente (requer `better-sqlite3` instalado).

```bash
npm install better-sqlite3
node utilitarios/scripts/sincronizar-patrimonio-externo.mjs --usuario-id=4a858baf-fd89-42a8-84f2-d45c7489b2a3
```

**Resultado esperado:**

```
[2026-04-20T...] Sincronização de Patrimônio Externo
[2026-04-20T...] Banco: infra/banco/banco.db
[2026-04-20T...] Modo: APPLY
[2026-04-20T...] Encontrados 1 usuário(s) com bens
  [INSERT] 4a858baf-fd89-42a8-84f2-d45c7489b2a3 — 2 imóvel(is) + 1 veículo(s)

[2026-04-20T...] Resumo:
  Novos registros: 1
  Atualizados: 0
  Erros: 0
  Modo: APPLY (dados foram sincronizados)
[2026-04-20T...] Concluído
```

### Parte 2: Melhorias no Frontend (Próxima PR)

**Arquivo:** `apresentacao/src/features/perfil/PerfilUsuario.jsx`

Melhorias planejadas:

1. **Feedback visual de sucesso/erro:**
   - Toast que aparece ao salvar com sucesso
   - Mensagem de erro clara se salvar falhar
   - Ícone de carregamento no botão enquanto salva

2. **Validação local:**
   - Impedir submit se patrimonioExterno está vazio e o usuário entrou dados (proto-save)
   - Avisar ao usuário se há dados não salvos ao navegar

3. **UX melhorada:**
   - Feedback em tempo real de quais campos estão dirty (modificados)
   - Desabilitar botão "Salvar Alterações" se nada mudou

**Código esperado (em breve):**

```javascript
const salvar = async () => {
  try {
    setSaving(true);
    setError(""); // limpa erros antigos
    
    await perfilApi.salvarContextoFinanceiro({...contexto});
    
    // ✅ Sucesso
    setSuccess("Perfil salvo com sucesso!"); // Nova prop
    setTimeout(() => setSuccess(""), 3000);
    invalidarCacheUsuario();
  } catch (err) {
    // ❌ Erro visível
    if (err instanceof ApiError && err.status === 401) {
      navigate("/", { replace: true });
      return;
    }
    setError("Falha ao salvar perfil: " + err.message); // Mais descritivo
  } finally {
    setSaving(false);
  }
};
```

---

## Impacto Esperado

### Imediato (após sincronização):

1. ✅ Dados aparecem no painel de perfil (aba "Patrimônio externo")
2. ✅ Bens aparecem na taba "Bens" da carteira
3. ✅ Home patrimonio soma bens corretamente
4. ✅ Score contabiliza patrimonioBruto com 88% em bens (apropriado)

### Futuramente (PR frontend):

1. ✅ Usuários recebem feedback quando salvam
2. ✅ Erros de rede/validação são visíveis
3. ✅ Dados não são perdidos ao navegar sem salvar

---

## Checklist

### ✅ Concluído

- [x] Investigação: Identificou-se que dados estão em `posicoes_financeiras` mas não em `perfil_contexto_financeiro`
- [x] Fix patrimonioBruto bug (commit anterior)
- [x] Criação de migração 035 (preparatória)
- [x] Criação de script `sincronizar-patrimonio-externo.mjs`

### ⏳ Próximos passos

1. Executar sync script para Luiz (ou todos os usuários):
   ```bash
   cd "D:\Programação\Projetos\Esquilo Invest"
   node utilitarios/scripts/sincronizar-patrimonio-externo.mjs
   ```

2. Verificar que dados aparecem em UI:
   - Painel de perfil > "Patrimônio externo" aba
   - Carteira > "Bens" aba
   - Home > seção patrimonio

3. PR separada para melhorias frontend (feedback visual)

---

## Teste Manual pós-sincronização

1. **Abrir painel de perfil do usuário:**
   ```
   https://ei-app.local/perfil (ou seu domínio)
   ```
   → Clicar aba "Patrimônio externo"
   → Deve mostrar 2 imóveis + 1 veículo

2. **Abrir carteira e clicar aba "Bens":**
   ```
   https://ei-app.local/carteira
   ```
   → Aba "Bens" deve listar os 2 imóveis + 1 veículo

3. **Verificar home patrimonio:**
   ```
   https://ei-app.local/home
   ```
   → Seção "Patrimônio" deve incluir bens (R$ 366k)
   → Score deve ser ~45 (apropriado para 88% em bens)

---

## Referências

- **Resumo Auditoria 7-Fases:** AUDITORIA_7FASE_RESUMO.md
- **Verificação patrimonioBruto Fix:** VERIFICACAO_FIX_PATRIMONIOBUTO.md
- **Componente frontend (perfil):** apresentacao/src/features/perfil/PerfilUsuario.jsx
- **API client:** apresentacao/src/cliente-api/perfil.ts
- **Rotas backend:** servidores/porta-entrada/src/server/routes/perfil.routes.ts
- **Repository:** servidores/modulos-backend/perfil/src/repositorio.ts
