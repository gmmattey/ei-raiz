# Matriz de dados — Savro (issue #130)

Matriz explícita de dados permitidos/proibidos por plataforma e por canal, cobrindo o MVP1 real
(#118–#121). Backend hoje não participa de nenhum fluxo do app KMP (o backend Cloudflare existente
no monorepo serve o produto legado React/Capacitor, não o Savro KMP — ver
`documentacao/arquitetura/ADR-002-savro-kmp-multiplataforma.md`, seção Cloudflare: "Android e iOS
nunca acessam D1, endpoint administrativo ou serviço de backup diretamente"). Por isso a coluna
"Backend" desta matriz é **N/A por arquitetura** em toda linha — não existe canal algum entre o
Savro e qualquer servidor no MVP1 atual.

Legenda das colunas de canal: **Permitido** (✅), **Proibido** (🚫), **N/A** (funcionalidade não
existe ainda, ou canal não existe).

## Dados patrimoniais (proibidos fora do dispositivo, sem exceção)

| Dado | Classificação | Armazenamento local | Finalidade | Retenção | Android | iOS | Backend | Log | Crash | Telemetria | Suporte | Backup (`*.savrobackup`) | CSV |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Nome do item (`nome`) | Patrimonial | `savro.db` (cifrado) | Identificar o item ao usuário | Enquanto o item existir | Local apenas | Local apenas | N/A | 🚫 | 🚫 | 🚫 | 🚫 | ✅ (cifrado) | ✅ (texto claro, opt-in do usuário) |
| Valor (`valorCentavos`) | Patrimonial | `savro.db` (cifrado) | Cálculo de patrimônio | Enquanto o item existir | Local apenas | Local apenas | N/A | 🚫 | 🚫 | 🚫 | 🚫 | ✅ (cifrado) | ✅ |
| Quantidade/preço médio | Patrimonial | `savro.db` (cifrado) | Registro informativo (não é fonte de verdade do valor) | Enquanto o item existir | Local apenas | Local apenas | N/A | 🚫 | 🚫 | 🚫 | 🚫 | ✅ (cifrado) | ✅ |
| Moeda (`moeda`) | Patrimonial (fraco, mas proibido por regra do produto) | `savro.db` (cifrado) | Exibição e agregação por moeda | Enquanto o item existir | Local apenas | Local apenas | N/A | 🚫 | 🚫 | 🚫 | 🚫 | ✅ (cifrado) | ✅ |
| Instituição (`instituicao`) | Patrimonial | `savro.db` (cifrado) | Registro informativo | Enquanto o item existir | Local apenas | Local apenas | N/A | 🚫 | 🚫 | 🚫 | 🚫 | ✅ (cifrado) | ✅ |
| Observação (`observacao`) | Patrimonial | `savro.db` (cifrado) | Anotação livre do usuário | Enquanto o item existir | Local apenas | Local apenas | N/A | 🚫 | 🚫 | 🚫 | 🚫 | ✅ (cifrado) | ✅ |
| Dívidas (`valorCentavos` negativo, tipo `DIVIDA`) | Patrimonial | `savro.db` (cifrado) | Patrimônio líquido | Enquanto o item existir | Local apenas | Local apenas | N/A | 🚫 | 🚫 | 🚫 | 🚫 | ✅ (cifrado) | ✅ |
| Ajustes de valor (`AjusteValorItem`) | Patrimonial | `savro.db` (cifrado) | Histórico auditável de mudança de valor | Append-only, vida do item | Local apenas | Local apenas | N/A | 🚫 | 🚫 | 🚫 | 🚫 | ✅ (cifrado) | 🚫 (CSV exporta só o estado atual, não o histórico) |
| Eventos de timeline (`EventoTimelineItem`, incl. `itemNome`) | Patrimonial | `savro.db` (cifrado) | Linha do tempo do item | Append-only, vida do item | Local apenas | Local apenas | N/A | 🚫 | 🚫 | 🚫 | 🚫 | ✅ (cifrado) | 🚫 |
| Conteúdo do backup (`ConteudoBackup` serializado) | Patrimonial (agregado) | Área temporária privada, apagada após uso | Transportar o cofre entre aparelhos, sob senha do usuário | Só durante o fluxo de exportação/restauração | Local apenas | Local apenas | N/A | 🚫 | 🚫 | 🚫 | 🚫 | — (é o próprio arquivo) | N/A |
| Conteúdo do CSV | Patrimonial | Área temporária privada, apagada após uso | Exportação legível para planilha, sob decisão explícita do usuário | Só durante o fluxo de exportação | Local apenas | Local apenas | N/A | 🚫 | 🚫 | 🚫 | 🚫 | N/A | — (é o próprio arquivo, texto claro por definição) |
| Caminho de arquivo de usuário (URI do SAF/`UIDocumentPickerViewController` escolhido) | Potencialmente revelador (pode conter nome de arquivo com dica de conteúdo) | Não persistido — só durante o fluxo ativo | Entregar/ler o arquivo escolhido | Efêmero (duração da operação) | Local apenas | Local apenas | N/A | 🚫 | 🚫 | 🚫 | 🚫 | N/A | N/A |

## Material criptográfico e segredos (proibidos em qualquer canal, incluindo backup)

| Dado | Classificação | Armazenamento local | Android | iOS | Backend | Log/Crash/Telemetria/Suporte | Backup | CSV |
|---|---|---|---|---|---|---|---|---|
| Chave mestra do cofre (passphrase de 256 bits) | Segredo crítico | Encapsulada (Android) / Keychain (iOS) | Android Keystore, não exportável | Keychain, `ThisDeviceOnly`, não sincronizável | N/A | 🚫 | 🚫 — **deliberadamente excluída** do backup (ver `formato-savrobackup.md` §4, "o que não entra no backup") | 🚫 |
| Senha de backup escolhida pelo usuário | Segredo | Nunca persistida — só em memória durante geração/restauração | N/A (só em memória) | N/A (só em memória) | N/A | 🚫 | 🚫 (só usada para derivar a chave; nunca gravada) | 🚫 |
| Chave derivada do PBKDF2 (cifra + MAC) | Segredo | Só em memória, zerada após uso | N/A | N/A | N/A | 🚫 | 🚫 | 🚫 |
| Salt/nonce do backup | Não secreto por design, mas específico de um arquivo | Cabeçalho em texto claro do próprio arquivo | N/A | N/A | N/A | 🚫 (não faz sentido logar, mas não é um segredo caso apareça em debug local) | ✅ (é parte do formato, mas não revela conteúdo — ver `formato-savrobackup.md` §2) | N/A |
| `PreferenciasCofre` (onboarding concluído, política de proteção, timeout, flag de chave invalidada) | Estado de app, não patrimonial nem segredo | `SharedPreferences` (Android) / `NSUserDefaults` (iOS), texto claro | Local apenas | Local apenas | N/A | ✅ (baixo risco, mas não há motivo para logar hoje) | 🚫 (timeout entra no backup como preferência restaurável; onboarding/chave-invalidada são estado de instalação, nunca entram — ver `ConteudoBackup.kt`) | N/A |

## Metadados técnicos (permitidos, com minimização)

| Dado | Classificação | Finalidade | Android | iOS | Backend | Log | Crash | Telemetria | Suporte |
|---|---|---|---|---|---|---|---|---|---|
| `versaoEsquema` do banco/backup | Técnico | Compatibilidade de migration | ✅ | ✅ | N/A | ✅ | ✅ | ✅ (se telemetria existir no futuro) | ✅ |
| Contagem de itens/ajustes/eventos (número, não conteúdo) | Técnico, mas **borderline patrimonial** | Diagnóstico e prévia de restauração | ✅ (na UI, prévia de restauração) | ✅ | N/A | ⚠️ ver nota | 🚫 | 🚫 | ⚠️ ver nota |
| Lista de moedas presentes no backup (`PreviaBackup.moedas`) | Técnico, mas **borderline patrimonial** | Prévia de restauração — mostrar ao usuário antes de confirmar | ✅ (na UI) | ✅ | N/A | 🚫 | 🚫 | 🚫 | 🚫 |
| Código de erro técnico (`ErroRepositorio`/`ErroBackup`, rótulo fixo — ex. `"abertura"`, `"chave"`) | Técnico | Diagnóstico de falha sem revelar conteúdo | ✅ | ✅ | N/A | ✅ | ✅ | ✅ | ✅ |
| Nome de classe de exceção nativa (`excecao.javaClass.simpleName`) | Técnico | Diagnóstico | ✅ | ✅ | N/A | ✅ | ✅ | ⚠️ avaliar caso a caso | ✅ |
| Versão do app, SO, modelo de aparelho | Técnico | Diagnóstico de compatibilidade | ✅ | ✅ | N/A | ✅ | ✅ | ✅ (se telemetria existir) | ✅ |

**Nota sobre contagem de itens/moedas:** contagem e moedas presentes **não** identificam o
patrimônio em si (não revelam nome, valor ou instituição), mas podem permitir uma inferência fraca
de porte/complexidade do patrimônio ("tem 40 itens em 3 moedas" sugere um perfil diferente de "tem
2 itens em 1 moeda"). A regra desta auditoria: **permitido na UI local** (é exatamente para isso que
a prévia de restauração existe) e **permitido em mensagem de suporte que o próprio usuário decide
compartilhar** (ex.: "tenho X itens, o app trava ao restaurar"), mas **proibido em qualquer telemetria
automática** — não existe telemetria automática hoje (ver seção abaixo), e se um dia existir, esse
campo específico deve ficar de fora por decisão explícita, não por omissão.

## Telemetria — estado atual

**Não existe nenhuma telemetria automática no MVP1.** Nenhum SDK de analytics, crash reporter ou
qualquer client HTTP está declarado em `gradle/libs.versions.toml`, `Podfile` ou em qualquer
`build.gradle.kts` do projeto (confirmado nesta auditoria, ver `inventario-dependencias-savro.md` e
`auditoria-rede-savro.md`). Não há, portanto, nada para o usuário desativar — o requisito da issue
"telemetria opcional desativável" está satisfeito trivialmente porque a telemetria não existe.

**Se telemetria automática for adicionada no futuro** (não está no roadmap hoje, nenhuma issue
aberta prevê isso para o MVP1): é mudança de arquitetura que exige decisão explícita do Luiz, e
precisa, no mínimo: (a) opt-in ou opt-out claro e persistido localmente, nunca ligado por padrão
sem aviso; (b) passar pelo mesmo contrato de redaction desta auditoria (`contrato-redaction-savro.md`)
antes de qualquer evento sair do aparelho; (c) atualizar esta matriz e as declarações de loja
(`loja-google-play-data-safety.md`/`loja-app-store-privacy.md`) antes de ir ao ar; (d) o gate
`verifyNoNetworkAccess` (criado nesta issue) precisa ser deliberadamente ajustado para permitir o
novo módulo de rede — nunca simplesmente contornado.

## Dados de instalação/dispositivo usados pelo SO (fora do controle direto do app)

| Dado | Onde vive | Controle do Savro | Observação |
|---|---|---|---|
| Backup automático do SO (Android Auto Backup) | Sistema operacional | `android:allowBackup="false"` no `AndroidManifest.xml` — app inteiro fora do backup automático | Nenhum dado do Savro (nem preferências, nem banco) entra em backup automático do Android. |
| Backup automático do SO (iCloud/iTunes, iOS) | Sistema operacional | **Parcial — achado desta auditoria.** `NSUserDefaults` (preferências não sensíveis) e o arquivo `savro.db` em `Application Support` **não têm exclusão explícita de backup** (`NSURLIsExcludedFromBackupKey`) hoje. A chave mestra (Keychain, `ThisDeviceOnly`) já está corretamente excluída de qualquer sincronização/backup por atributo do próprio Keychain. | Ver `modelo-ameacas-savro.md` seção 2 e o achado "importante" registrado no resumo desta issue — recomendação de correção documentada, não implementada nesta auditoria por falta de toolchain macOS para validar localmente. |
