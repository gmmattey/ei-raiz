# 117-A — validação da fundação Android e SQLCipher

- **Issue:** [#176](https://github.com/gmmattey/esquilo-wallet/issues/176) (filha de [#117](https://github.com/gmmattey/esquilo-wallet/issues/117))
- **Data da pesquisa:** 2026-07-26
- **Escopo:** parecer técnico e documental. Nenhum projeto Android, banco, dependência ou configuração Gradle foi criado ou alterado.
- **Decisão:** **aprovado com condições**.

## Resumo executivo

O cofre local definido na ADR-001 pode usar SQLCipher sem desvio arquitetural, desde que a implementação use o pacote moderno oficial **`net.zetetic:sqlcipher-android:4.17.0`**, e não o legado `android-database-sqlcipher`. O primeiro é o substituto oficial, tem integração suportada com Room por `SupportOpenHelperFactory`, inclui as quatro ABIs Android usuais e suporta páginas de memória de 16 KB desde a versão 4.6.1. O segundo foi descontinuado em 2023 e a Community Edition dele não recebe atualizações publicadas; portanto, é proibido para o Savro.

O baseline recomendado é `minSdk 23`, `compileSdk 36`, `targetSdk 36`, JDK 17, AGP 8.13.2, Gradle 8.13, Kotlin 2.3.10, KSP 2.3.10, Compose BOM 2026.06.00 e Room 2.8.4. O `minSdk` é imposto tanto pelo SQLCipher atual quanto pelo Room 2.8. O `targetSdk` 36 antecipa a exigência do Google Play para novas submissões a partir de 31 de agosto de 2026.

SQLCipher protege o banco e seus journals em repouso; ele **não** gerencia a chave. A passphrase aleatória de 256 bits deverá ser protegida por uma chave não exportável do Android Keystore, nunca persistida ao lado de `savro.db`. Isso não protege conteúdo já decriptado em memória, um processo comprometido que possa usar a sessão liberada, aparelho desbloqueado/comprometido, nem a tela; #118 e #130 continuam necessários.

## Fontes primárias

| Fonte | Uso nesta decisão |
|---|---|
| [SQLCipher for Android — repositório oficial](https://github.com/sqlcipher/sqlcipher-android) | artefato atual, API 23+, ABIs, carga explícita da lib nativa e integração Room |
| [Community Edition para Android — Zetetic](https://www.zetetic.net/sqlcipher/sqlcipher-for-android-community/) | coordenadas oficiais atuais e diferença Community/comercial |
| [Migração oficial para `sqlcipher-android`](https://www.zetetic.net/sqlcipher/sqlcipher-for-android-migration/) | substituição do pacote legado e `SupportOpenHelperFactory` |
| [16 KB para SQLCipher Android — Zetetic](https://www.zetetic.net/blog/2025/06/26/sqlcipher-for-android-16kb-page-size-support/) | suporte desde 4.6.1 e EOL do pacote legado |
| [Metadado Maven Central 4.17.0](https://repo1.maven.org/maven2/net/zetetic/sqlcipher-android/maven-metadata.xml) e [artefato AAR](https://repo1.maven.org/maven2/net/zetetic/sqlcipher-android/4.17.0/sqlcipher-android-4.17.0.aar) | versão estável publicada, data e medição do AAR |
| [Licença SQLCipher — Zetetic](https://www.zetetic.net/sqlcipher/license/) e [Community Edition](https://www.zetetic.net/sqlcipher/community/) | obrigação de atribuição e distinção de licenças |
| [Design de segurança SQLCipher](https://www.zetetic.net/sqlcipher/design/) e [material de chave](https://www.zetetic.net/sqlcipher/database-key-material/) | escopo da cifra, journals e responsabilidade de gestão de chaves |
| [Room — releases oficiais](https://developer.android.com/jetpack/androidx/releases/room) e [migrations do Room](https://developer.android.com/training/data-storage/room/migrating-db-versions) | Room 2.8.4, KSP, minSdk e schemas/migrations testáveis |
| [AGP 8.13.0](https://developer.android.com/build/releases/agp-8-13-0-release-notes), [tabela AGP/Gradle](https://developer.android.com/build/releases/about-agp) e [JDK para builds Android](https://developer.android.com/build/jdks) | JDK 17, Gradle 8.13 e teto de API 36.1 |
| [Kotlin/Gradle — compatibilidade](https://kotlinlang.org/docs/gradle-configure-project.html) e [KSP — início rápido](https://kotlinlang.org/docs/ksp-quickstart.html) | limites de compatibilidade Kotlin/AGP/Gradle e uso de KSP |
| [Compose BOM](https://developer.android.com/develop/ui/compose/bom) | BOM estável e relação do compilador Compose com Kotlin 2+ |
| [Android 16 SDK](https://developer.android.com/about/versions/16/setup-sdk), [exigência Play target API](https://developer.android.com/google/play/requirements/target-sdk) e [páginas de 16 KB](https://developer.android.com/guide/practices/page-sizes) | SDK 36, exigência de publicação e verificação de binários nativos |
| [Android Keystore](https://developer.android.com/privacy-and-security/keystore) e [boas práticas de backup](https://developer.android.com/privacy-and-security/risks/backup-best-practices) | chave não exportável, restrições de uso e exclusões de Auto Backup |

## SQLCipher for Android

### Projeto, artefato, manutenção e licença

| Item | Parecer |
|---|---|
| Projeto aprovado | `sqlcipher/sqlcipher-android`, mantido pela Zetetic; é explicitamente o substituto de longo prazo do pacote original. |
| Artefato Community | `net.zetetic:sqlcipher-android:4.17.0` (AAR do Maven Central). O metadado oficial informa `4.17.0` como `latest` e `release`, publicado em 2026-07-08. |
| Artefato proibido | `net.zetetic:android-database-sqlcipher`. A Zetetic o depreciou em 2022; a Community Edition chegou ao fim de vida em 2023 e não recebe releases. |
| Estado de manutenção | Ativo: há release 4.17.0 de manutenção em julho de 2026 e o repositório oficial declara contribuições/reports. Isso não equivale a SLA gratuito. |
| Community | BSD-style, pode ser usada em software fechado/comercial, mas requer aviso de copyright, texto integral da licença e avisos de dependências em local acessível ao usuário. |
| Comercial/Enterprise | licença proprietária/assinatura, desempenho e extensões adicionais, suporte privado; Enterprise pode incluir FIPS e contratos específicos. Não é necessária para o escopo atual e não deve ser assumida sem decisão de produto/compras. |

**Condição legal:** #118 deve prever uma tela acessível de licenças/atribuições (ou fluxo equivalente acessível no app) antes de qualquer distribuição. #177 não deve colar aviso incompleto nem alegar certificação FIPS para a Community Edition.

### Compatibilidade, ABIs e 16 KB

O repositório oficial declara suporte a API 23+ em `armeabi-v7a`, `arm64-v8a`, `x86` e `x86_64`. A biblioteca é nativa: a aplicação deve carregar `libsqlcipher.so` explicitamente antes do uso. Isso cria risco de empacotamento/ABI e exige validação em dispositivo, mas não é impedimento.

Desde 4.6.1 a biblioteca moderna suporta páginas de 16 KB. A regra do Google Play exige suporte a 16 KB para apps novos e atualizações que visem Android 15+ desde 2025-11-01; a documentação Android exige conferir alinhamento de ELF e do bundle de toda dependência nativa. #180 deve gerar AAB e comprovar `PAGE_ALIGNMENT_16K`, além de testar `arm64-v8a` em imagem/dispositivo de 16 KB. Não aceitar apenas a declaração do fornecedor.

| Critério | Resultado |
|---|---|
| minSdk SQLCipher | 23 |
| ABIs fornecidas no AAR | `armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64` |
| Páginas de 16 KB | suportadas no pacote moderno desde 4.6.1; 4.17.0 está acima desse piso |
| Android moderno | adequado ao `targetSdk 36`, condicionado aos testes de 16 KB e regressão Android 16 |
| Código nativo | presente (`libsqlcipher.so`); revisar ABIs, alinhamento, carga e falhas `UnsatisfiedLinkError` na CI/teste |

### Integração com Room

O caminho suportado é Room sobre o `SupportOpenHelperFactory` da biblioteca moderna, configurado no `Room.databaseBuilder(...).openHelperFactory(factory)`. Não usar `FrameworkSQLiteOpenHelperFactory`, não acessar SQLite framework em paralelo, nem depender do `SupportFactory` do pacote legado.

Na #180, a factory recebe material de chave de memória de vida curta; o código deverá limpar buffers mutáveis assim que a API permitir e nunca logar senha/chave. Room continua responsável por schema, DAOs, transações e migrations; SQLCipher substitui a implementação de abertura/armazenamento. A abertura negativa com material de chave errado ou ausente é teste obrigatório.

## Baseline Android aprovado

| Componente | Versão fixada | Evidência de compatibilidade e motivo |
|---|---:|---|
| `minSdk` | 23 | mínimo do SQLCipher atual e do Room 2.8; evita um suporte inferior falso. |
| `compileSdk` / `targetSdk` | 36 / 36 | SDK Android 16; Play exige target 36 para novos apps/updates a partir de 2026-08-31. |
| JDK | 17 | requisito e padrão do AGP 8.13. |
| AGP | 8.13.2 | AGP 8.13 requer Gradle 8.13, suporta API até 36.1 e 8.13.2 adiciona suporte Kotlin 2.3 no R8. |
| Gradle wrapper | 8.13 | combinação requerida pelo AGP 8.13. |
| Kotlin / Compose Compiler plugin | 2.3.10 / 2.3.10 | Kotlin 2.3.10 é compatível com AGP 8.2.2–9.0; o plugin Compose usa a mesma versão do Kotlin desde Kotlin 2.0. A atualização de patch só ocorre em lote compatível. |
| KSP | 2.3.10 | release atual indicado pela documentação oficial do KSP. KSP tem versionamento próprio: a seleção foi validada pela release/documentação, não pela coincidência numérica. #177 deve usar KSP2 e confirmar a resolução no primeiro `assembleDevDebug`. Não usar KAPT para Room. |
| Compose BOM | 2026.06.00 | BOM estável oficial atual; dependências Compose ficam sem versão individual. |
| Room | 2.8.4 | release estável; suporta KSP/KSP2, `minSdk 23` e plugin de schema reproduzível. |
| AndroidX SQLite | 2.6.2 | coordenada explicitamente indicada pela integração oficial do SQLCipher 4.17.0. |
| SQLCipher Community | 4.17.0 | release estável publicado e pacote moderno com suporte 16 KB. |

**Nota de manutenção do baseline:** o Kotlin/KSP evolui em cadência própria. A versão acima é uma base reprodutível, não autorização para faixas dinâmicas (`+`, `latest.release`, `^`). #177 deve fixar todas em catálogo de versões; atualizações passam por PR próprio, matriz de compatibilidade oficial, dependências resolvidas, testes e inspeção de AAB.

## Segurança, backup, migrations e rotação

### O que fica protegido

SQLCipher aplica cifra transparente a todas as páginas do banco e também às páginas de journal/WAL; sem o material criptográfico correto, o arquivo não é SQLite legível. É proteção de **dados em repouso**, não uma solução de autenticação, bloqueio de sessão ou cofre de chaves.

| Tema | Exigência para Savro |
|---|---|
| Passphrase | gerar 256 bits aleatórios na primeira inicialização; usar formato raw-key adequado à API, não PIN nem biometria como chave direta. |
| Keystore | cifrar/encapsular a passphrase com chave `savro.vault.master.v1` não exportável; aplicar autenticação de usuário conforme #118. SQLCipher não substitui o Keystore. |
| Persistência da chave | proibido em `SharedPreferences`, DataStore comum, banco, arquivo ao lado de `savro.db`, recurso, log, crash report ou backup. |
| Auto Backup | excluir banco, WAL/journal, preferências sensíveis, chaves encapsuladas e temporários em regras de data extraction; se não houver prova de exclusão em todas as APIs suportadas, desabilitar backup. |
| Migrations | incrementais, sem fallback destrutivo; exportar schemas versionados, usar `room-testing`, testar caminho completo e preservação de dados com a factory SQLCipher. |
| Exportação | não copiar `savro.db` como backup portável. #121 define `*.savrobackup` com cifra/chave independente e transferência explícita. |
| Rotação | não há rotação mágica. #180 deve definir procedimento atômico e testável para rekey/cópia cifrada, energia insuficiente/erro, rollback e validação; sem esse procedimento, não expor ação de rotação ao usuário. |

### Limites e ameaças residuais

- Aparelho desbloqueado, root/bootloader comprometido ou atacante com controle do processo podem abusar da sessão e, dependendo dos controles, pedir uso da chave Keystore; a não exportabilidade reduz extração, não torna o processo invulnerável.
- Dados decriptados, passphrase e resultados de consulta podem existir na memória do processo enquanto o cofre está aberto. SQLCipher reduz exposição nativa ao bloquear/limpar memória quando possível, mas não elimina cópias no runtime Kotlin/Java, heap dump, debugger ou processo comprometido.
- SQLCipher não impede screenshots, gravação de tela, recents, overlay malicioso, acessibilidade abusiva ou exfiltração de uma UI já desbloqueada. #118 define `FLAG_SECURE`, ciclo de bloqueio e UX; #130 define modelo de ameaças, redaction e inventário de SDKs.
- Logs, migrations malfeitas, exportações e backups podem vazar dados mesmo que `savro.db` esteja cifrado. Não registrar SQL com valores, passphrase, bytes de chave, caminhos de exportação sensíveis ou exceções brutas.

## Tamanho: medição de artefato, não de aplicativo

Não foi adicionada dependência e ainda não existe AAB Savro. Portanto, não há medição honesta de APK/AAB final nesta issue. Foi feita somente inspeção reproduzível do AAR oficial `sqlcipher-android-4.17.0.aar` baixado do Maven Central em 2026-07-26:

```text
URL: https://repo1.maven.org/maven2/net/zetetic/sqlcipher-android/4.17.0/sqlcipher-android-4.17.0.aar
SHA-256: 44FC40C33D1DE597C8339072A71FA0FF20E12D01AB352D6ABE4AD5DF668EAD94
arquivo AAR: 4,007,507 bytes (ZIP)
```

| ABI | `libsqlcipher.so` descomprimida | entrada comprimida no AAR | Acréscimo mínimo de payload por split ABI* |
|---|---:|---:|---:|
| `armeabi-v7a` | 1,046,404 B (1.00 MiB) | 665,859 B (0.64 MiB) | ~1.00 MiB |
| `arm64-v8a` | 2,100,040 B (2.00 MiB) | 1,026,194 B (0.98 MiB) | ~2.00 MiB |
| `x86` | 2,244,588 B (2.14 MiB) | 1,099,872 B (1.05 MiB) | ~2.14 MiB |
| `x86_64` | 2,231,416 B (2.13 MiB) | 1,093,975 B (1.04 MiB) | ~2.13 MiB |

\*Não inclui `classes.jar` (126,934 B descomprimidos), manifest/resources, dependências transitivas, DEX, assinatura nem overhead de zip/alinhamento. Um AAB com ABI splits normalmente entrega apenas a `.so` da ABI do aparelho; um APK universal carrega as quatro e soma 7,622,448 B de `.so` descomprimidas. Esses valores são tamanho de artefato, não tamanho instalado nem download da Play.

**Método reproduzível:** baixar exatamente a URL acima, validar SHA-256, abrir o AAR como ZIP e ler `jni/<abi>/libsqlcipher.so` nas colunas `Length` e `CompressedLength`. Na #180, medir `bundleRelease`, `bundletool get-size total`, conteúdo do AAB e `bundletool dump config`; registrar delta contra build idêntico sem SQLCipher, ABI por ABI. A documentação Android alerta que alinhamento ELF de 16 KB pode aumentar ligeiramente o binário, portanto a medição de #180 é obrigatória.

## Alternativas avaliadas

| Alternativa | Resultado | Motivo |
|---|---|---|
| SQLCipher Android moderno Community | **aprovada com condições** | cifra integral, Room suportado, manutenção ativa, licença aceitável com atribuição e 16 KB suportado. |
| `android-database-sqlcipher` Community legado | rejeitada | EOL, sem updates publicados e não atende o caminho 16 KB exigido. |
| SQLCipher Commercial/FIPS | não selecionada agora | adiciona suporte/recursos e eventual FIPS, mas requer licença comercial e decisão de custo/conformidade; não há requisito aprovado que justifique isso. |
| Room/SQLite sem SQLCipher + FBE do aparelho | rejeitada | não entrega a cifra integral em nível de aplicação definida pela ADR e depende de proteção do dispositivo. |
| cifrar colunas/arquivos seletivamente | rejeitada | viola a decisão de cofre integral, complica consulta/migration e deixa metadados/temporários fora do cofre. |

## Condições obrigatórias para as próximas issues

| Issue | Condições decorrentes desta validação |
|---|---|
| #177 — bootstrap Gradle | criar somente `android/` novo; fixar o baseline aprovado em catálogo, JDK 17 e wrapper 8.13; não importar Capacitor; deixar o suporte a 16 KB verificável na CI futura. |
| #178 — modularização | manter Room/SQLCipher confinados a `core:database` e Keystore em `core:security`; domínio e features não conhecem Room, SQLCipher, Android ou passphrase. |
| #180 — persistência | usar `sqlcipher-android:4.17.0` + `androidx.sqlite:sqlite:2.6.2` + `SupportOpenHelperFactory`; gerar/encapsular chave como acima; migrations e teste negativo; schemas exportados; Auto Backup bloqueado/excluído; validar AAB 16 KB e medir delta real. |

## Itens que devem retornar à ADR-001

Não é necessária alteração da ADR-001 para aprovar a direção atual. Quando #180 concluir as evidências, ela deve receber apenas um adendo rastreável (não nesta task) com:

1. versão efetivamente aprovada após a build reproduzível;
2. resultado do teste de AAB/ELF de 16 KB e tamanho medido;
3. política de rotação/rekey e falhas recuperáveis;
4. referência às regras finais de Auto Backup e aos testes de migration/abertura negativa.

## Validação contra os critérios da #176

- [x] Manutenção, licença, compatibilidade Android/ABI e tamanho do SQLCipher analisados com fontes primárias.
- [x] Artefato moderno e versão estável publicada identificados; pacote legado explicitamente excluído.
- [x] Integração Room, minSdk, Android moderno, 16 KB e risco nativo registrados.
- [x] Baseline reprodutível de Android, JDK, AGP, Gradle, Kotlin, Compose BOM, Room e KSP fixado.
- [x] Segurança de dados em repouso, Keystore, passphrase, memória, aparelho comprometido, screenshots, backups, migrations, exportação e rotação tratada.
- [x] Estimativa de tamanho por ABI é derivada do AAR oficial e marcada como não equivalente a medição final; #180 mede o AAB real.
- [x] Decisão explícita e condições para #177, #178 e #180 registradas.
