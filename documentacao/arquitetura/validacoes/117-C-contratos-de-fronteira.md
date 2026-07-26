# 117-C — modularização e contratos de fronteira

- **Issue:** #178 (filha de #117)
- **Escopo:** módulos Gradle puros, allowlist arquitetural e fronteiras de dependência.

## Módulos entregues

```text
:app
:core:common
:core:model
:core:testing
:domain:patrimonio
```

`domain:patrimonio` depende somente de `core:common` e `core:model`. Os três módulos `core` e o módulo de domínio usam Kotlin/JVM, sem Android, Compose, Room, SQLCipher, SQLite, KSP, HTTP, JSON, DTOs de rede ou DI. `core:testing` não é dependência de produção e a regra arquitetural reprova seu uso em configurações que não sejam de teste.

Os módulos `core:common`, `core:model` e `domain:patrimonio` são, nesta entrega, **estrutura arquitetural sem fontes de produção e sem entrega funcional**. O módulo `core:testing` contém apenas a cobertura funcional do verificador arquitetural. Isso é deliberado: a issue não aprova comportamento de patrimônio, e preencher módulos com marcadores, interfaces vazias ou regras especulativas seria desvio de escopo.

## Contratos de domínio deliberadamente adiados

A ADR-001 estabelece que o domínio não conhece detalhes de UI, banco ou rede e que persistência futura deve ficar atrás de sua fronteira. Contudo, #178 não especifica nenhuma operação patrimonial: CRUD, movimentos, importação, saldo, resumo, histórico, cálculo e rede pública pertencem a outras issues.

Por isso, esta task não cria interfaces vazias nem métodos especulativos. A fronteira entregue é a estrutura de módulos e as regras executáveis. Portas com operações concretas serão criadas apenas quando uma issue aprovada definir a semântica:

| Porta futura | Origem necessária |
|---|---|
| Persistência patrimonial local e transacional | #119 e #180 |
| Regras/casos de uso patrimoniais | #179 e #119 |
| Cotação, catálogo, manifesto ou pacote público | #182 |

## Regra executável

`verifyArchitecture`, ligado a `check`, combina:

1. inspeção das dependências de projeto declaradas no Gradle contra uma allowlist;
2. proibição de `core:testing` fora de configurações de teste;
3. proibição preventiva de feature para feature, `core:database` e `core:network`;
4. inspeção de fontes Kotlin dos módulos puros para referências a APIs proibidas.

`core:testing` executa quatro fixtures Gradle TestKit contra uma cópia temporária do projeto Android: grafo válido, dependência proibida no domínio, uso de `core:testing` em produção e referência proibida em fonte pura. Os três cenários inválidos usam `buildAndFail()`, comprovando que a regra efetivamente interrompe o build.

## Evidência de validação

Nesta etapa estrutural, os seguintes módulos não possuem fontes de produção nem testes de domínio: `core:common`, `core:model` e `domain:patrimonio`. No Gradle, suas tarefas `compileKotlin`, `compileJava` e `test` terminam como `NO-SOURCE`; isso confirma ausência intencional de entrega funcional, não uma suíte aprovada.

`core:testing` também possui `compileKotlin` como `NO-SOURCE`, pois não entra no runtime. Diferentemente dos demais, `compileTestKotlin` e `test` executam código: a suíte `VerifyArchitectureFunctionalTest` roda as quatro fixtures TestKit descritas acima. Além dessa suíte, `verifyArchitecture` executa a regra Gradle no projeto real e `:app:assembleDevDebug` compila/empacota o bootstrap já existente.

A inspeção de fontes é uma defesa complementar. A barreira principal é o grafo Gradle: módulos puros não recebem plugin Android nem dependências que disponibilizem classes Android, banco, SQLCipher ou HTTP no classpath de produção.
