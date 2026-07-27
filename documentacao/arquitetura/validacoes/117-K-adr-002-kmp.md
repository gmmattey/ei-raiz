# 117-K — ADR-002: arquitetura KMP + Compose Multiplatform

- **Issue:** #192, filha de #117.
- **Escopo:** decisão arquitetural e plano de migração. Sem implementação de KMP, sem projeto
  Xcode, sem alteração de Gradle, sem operação destrutiva.
- **Entregável principal:** `documentacao/arquitetura/ADR-002-savro-kmp-multiplataforma.md`.

## Fontes consultadas

- CLAUDE.md e AGENTS.md do repositório.
- ADR-001 (`documentacao/arquitetura/ADR-001-savro-android-local-first.md`) e seus dois adendos.
- Issues GitHub: #116 (épico), #117 (pai), #123 (épico dados públicos), #174 (histórica, gerou a
  ADR-001), #192 (esta task), #193–#195 (fundação KMP, design system, CI), #118–#130 (funcionais).
- Documentos de validação `117-A` (SQLCipher), `117-C` (fronteiras), `117-J` (design system
  Compose).
- Estrutura real de `android/` (`settings.gradle.kts`, `build.gradle.kts` raiz — tasks
  `verifyArchitecture`/`verifyDesignSystemTokens`, módulos existentes).
- Histórico git: commits `88f3c17` (#189) e `0bdbf00` (#190), já mergeados na `master`.
- Projetos online `claude.ai/design`: `445b937c-...` (protótipos "Novo Esquilo") e
  `abe5910f-...` (design system Savro), via `DesignSync.list_files`.
- ZIPs locais (`C:\Users\luizg\Downloads\Novo Esquilo.zip`,
  `Esquilo Wallet Design System.zip`) — usados só como fallback/inventário offline, nunca como
  fonte canônica quando o projeto online estava acessível e mais atual.

## Achados que orientaram a ADR-002

1. `android/` tem hoje só 6 módulos Gradle (`:app`, `:core:common`, `:core:model`,
   `:core:testing`, `:core:designsystem`, `:domain:patrimonio`); `core:common`, `core:model` e
   `domain:patrimonio` existem só como `build.gradle.kts` sem `src/` populado. Nenhum módulo de
   banco, segurança, rede ou feature existe ainda. Isso simplifica a migração: não há
   Room/SQLCipher/Keystore reais para desmontar.
2. `#189` e `#190`, citados de forma imprecisa em outros documentos como "issues", são **PRs já
   mergeados** — confirmado via `git log`/`git show`. Tratados como entregas existentes na
   migração, não como trabalho ausente.
3. Os ZIPs locais auditados estavam desatualizados frente ao projeto online equivalente —
   principalmente a ausência de `Esquilo - MVP1.dc.html` no `Novo Esquilo.zip` local, que existe e
   continua ativo no projeto online. Ver detalhe e hashes na ADR-002 e em
   `documentacao/produto/SAVRO_PROTOTIPOS.md`.
4. Não há conflito material entre #192/#193/#194/#195 entre si — ordem e limites de escopo são
   consistentes.

## Verificação contra os critérios de aceite da #192

- [x] A ADR-002 declara formalmente Android e iOS como runtimes suportados.
- [x] A ADR-001 foi marcada como histórica/sucedida no próprio cabeçalho, sem ser apagada.
- [x] Fronteiras comuns/específicas por plataforma são verificáveis (seção de módulos e matriz
      comum × Android × iOS da ADR-002).
- [x] Segurança e persistência não são tratadas como automaticamente compartilháveis — contrato
      comum + implementação nativa distinta; biblioteca de persistência registrada como pendência
      deliberada da #180, não decidida aqui.
- [x] Nenhuma contradição encontrada entre a ADR-002 e as issues abertas #118–#130, #193–#195.
- [x] A implementação da persistência (#180) permanece bloqueada até esta ADR ser aprovada — ADR-002
      declara isso explicitamente.

## Verificação adicional (checklist de fechamento)

- [x] Nenhuma feature funcional (#118–#130) passou a ser Android-only pela ADR-002 — todas
      continuam com Android e iOS como runtimes de primeira classe.
- [x] Segurança não foi artificialmente compartilhada — a ADR-002 exige contrato comum com
      implementação nativa distinta e proíbe redução de proteção do cofre.
- [x] Consistência revisada entre ADR-002, #117, #118–#130 e #193–#195 — sem contradição
      encontrada.
- [x] Política de autoridade visual explícita na ADR-002 e em `SAVRO_PROTOTIPOS.md`.
- [x] Nenhuma versão local desatualizada dos ZIPs foi tratada como canônica — divergência
      registrada, projeto online tratado como fonte de verdade.

## Fora de escopo desta task (mantido fora, conforme a #192)

Implementação de KMP, criação de projeto Xcode, migração de componentes, escolha definitiva de
biblioteca de persistência, telas, fluxos ou comportamento visual.
