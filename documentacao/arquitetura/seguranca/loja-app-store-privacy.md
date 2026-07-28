# Rascunho — App Store, App Privacy (Nutrition Label)

Baseado 100% no estado real do código descrito nesta auditoria (2026-07-28), nunca em intenção
futura. Alimenta a política de privacidade pública da issue #122 (não iniciada, não tocada por
esta auditoria — só produz o insumo).

**App relevante:** `io.savro.app` (produção) / `io.savro.app.dev` (desenvolvimento) — não cadastrado
na App Store Connect hoje (pendência registrada na ADR-002, não desta auditoria; Igor não cria
nenhum registro de loja sem autorização explícita do Luiz).

## 1. Categoria geral

Resposta recomendada: **"Data Not Collected"** (o desenvolvedor não coleta nenhum dado deste app).

Justificativa: confirmado por esta auditoria que não existe nenhuma dependência de rede, nenhum
SDK de analytics/anúncio/crash reporter, e nenhuma chamada de rede possível no MVP1 (ver
`auditoria-rede-savro.md`, `inventario-dependencias-savro.md`). O app processa dado financeiro
localmente (é o produto), mas processar não é o mesmo que coletar no sentido da Nutrition Label da
Apple, que trata de dados que saem do dispositivo para o desenvolvedor ou terceiros.

## 2. Categorias de dados da Apple — checklist

| Categoria Apple | Coletado? | Observação |
|---|---|---|
| Contact Info (nome, e-mail, telefone, endereço) | Não | Sem conta, sem cadastro |
| Health & Fitness | Não | N/A |
| Financial Info (informações de conta financeira, histórico de transações, informações de crédito) | Não | O app trabalha com dado financeiro **localmente** — nada disso é enviado à Apple, ao desenvolvedor ou a terceiros. A pergunta da Apple é sobre o que o desenvolvedor recebe, não sobre o que o app processa no aparelho do usuário |
| Location | Não | Nenhuma API de localização |
| Sensitive Info | Não | N/A |
| Contacts | Não | N/A |
| User Content (fotos, vídeos, áudio, outros arquivos gerados pelo usuário) | Não | O `*.savrobackup`/CSV é gerado e entregue diretamente ao seletor nativo do sistema escolhido pelo usuário (`UIDocumentPickerViewController`) — nunca chega ao desenvolvedor |
| Browsing History | Não | N/A |
| Search History | Não | N/A |
| Identifiers (User ID, Device ID) | Não | Nenhum identificador é lido ou transmitido |
| Purchases | Não | Não há compra dentro do app no MVP1 |
| Usage Data | Não | Nenhuma telemetria de uso existe hoje |
| Diagnostics (crash data, performance data) | Não | Nenhum crash reporter/SDK de diagnóstico presente |
| Other Data | Não | N/A |

## 3. Tracking (rastreamento entre apps/sites de terceiros, ATT)

**Não há tracking.** Nenhum identificador de publicidade (IDFA) é lido, nenhum SDK de rastreamento
está presente. O app **não precisa** solicitar permissão de App Tracking Transparency (ATT) — não
há nada para rastrear.

## 4. Dados vinculados à identidade (linked) vs. não vinculados (not linked)

Não aplicável — como nenhum dado é coletado (categoria "Data Not Collected"), a distinção
linked/not linked do formulário da Apple não se aplica. Se isso mudar no futuro (ex.: telemetria
técnica opcional), a resposta correta dependerá de como esse dado futuro é desenhado — precisa ser
reavaliado então, não assumido hoje.

## 4.1 Backup automático do sistema (iCloud/iTunes) — reforço da postura "Data Not Collected"

Correção aplicada nesta auditoria (decisão do Luiz, ver `modelo-ameacas-savro.md` seção 1.1): o
arquivo interno do cofre (`savro.db`) e seus sidecars passam a ser explicitamente excluídos do
backup automático do sistema via `NSURLIsExcludedFromBackupKey` (API pública), além da chave mestra
(Keychain, `ThisDeviceOnly`) já excluída desde sempre. Isso reforça, com evidência técnica, a
resposta "Data Not Collected": nem o iCloud do próprio usuário recebe automaticamente uma cópia do
banco patrimonial — só o backup MANUAL explícito (`*.savrobackup`, ação deliberada do usuário) sai
do aparelho, e mesmo esse vai só para onde o próprio usuário escolher entregá-lo.

## 5. Uso de criptografia (export compliance)

`Info.plist` já declara `ITSAppUsesNonExemptEncryption = false`. Base real: o app usa criptografia
padrão do sistema operacional (CommonCrypto, Keychain, Secure Enclave quando disponível) para
proteger dados em repouso — isso se qualifica pela isenção padrão da Apple para uso de criptografia
"para proteger a confidencialidade de dados do próprio app/usuário", que é exatamente o caso do
Savro (nenhuma criptografia é oferecida como serviço a terceiros, nenhum algoritmo proprietário é
implementado — só orquestração de AES/HMAC/PBKDF2 públicos do próprio SO, ver
`formato-savrobackup.md` §3). Recomendação: manter essa declaração como está; reavaliar apenas se o
app um dia expuser criptografia como funcionalidade voltada a terceiros (não é o caso).

## 6. Face ID

`Info.plist` já declara `NSFaceIDUsageDescription`: "O Savro usa o Face ID para desbloquear o cofre
local do seu patrimônio." — frase já coerente com o uso real (`AutenticadorBiometricoIOS`,
`LAContext`). Nenhuma correção necessária.

## Observação final

Este rascunho deve ser revisado por quem tiver acesso à App Store Connect antes de qualquer
submissão real — **nenhuma publicação foi autorizada nem realizada como parte desta issue**.
