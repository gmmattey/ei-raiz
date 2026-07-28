# Rascunho — Google Play, Segurança dos dados (Data Safety)

Baseado 100% no estado real do binário/código descrito nesta auditoria (2026-07-28), nunca em
intenção futura. Alimenta a política de privacidade pública da issue #122 (não iniciada, não
tocada por esta auditoria — só produz o insumo).

**Aplicação/pacote relevante:** `io.savro.app` (produção) / `io.savro.app.dev` (desenvolvimento) —
ver `ADR-002-savro-kmp-multiplataforma.md`. Nenhum dos dois está publicado hoje (pendência de
Play Console registrada na ADR-002, não desta auditoria).

## 1. O app coleta ou compartilha algum dos tipos de dados de usuário?

**Não.** O Savro MVP1 não coleta, não transmite e não compartilha nenhum dado do usuário com
nenhum servidor — confirmado por esta auditoria: zero dependência de rede declarada, sem permissão
`INTERNET` no `AndroidManifest.xml`, sem SDK de analytics/anúncio/crash reporter (ver
`inventario-dependencias-savro.md`, `auditoria-rede-savro.md`).

Resposta recomendada no formulário: **"Nenhum dado é coletado ou compartilhado."**

## 2. Categorias de dados — checklist do formulário do Google Play

| Categoria | Coletado? | Compartilhado? | Observação |
|---|---|---|---|
| Localização | Não | Não | Nenhuma API de localização usada |
| Informações pessoais (nome, e-mail, endereço) | Não | Não | Não há conta, não há cadastro de identidade — o "nome" que existe é o nome de um item patrimonial, dado do usuário que **nunca sai do aparelho** |
| Informações financeiras | Não (coletado *pelo servidor Google/terceiros*) | Não | O app **processa** dado financeiro localmente (é o produto), mas isso é distinto de "coleta" no sentido do formulário (que trata de dados que saem do dispositivo para o desenvolvedor/terceiros) — nenhum valor, saldo ou instituição sai do aparelho |
| Saúde e fitness | Não | Não | N/A |
| Mensagens | Não | Não | N/A |
| Fotos e vídeos | Não | Não | N/A (o backup/CSV é um arquivo que o próprio usuário escolhe salvar via seletor do sistema — não é upload) |
| Arquivos e documentos | Não coletado *pelo app* | Não | O app lê/grava um arquivo `*.savrobackup`/`.csv` só quando o usuário aciona a exportação/restauração, e só entrega ao seletor nativo do sistema escolhido pelo próprio usuário — nunca a um servidor |
| Contatos | Não | Não | N/A |
| Calendário | Não | Não | N/A |
| Histórico de apps ativos | Não | Não | N/A |
| Informações do dispositivo ou outros identificadores | Não | Não | Nenhum identificador de dispositivo é lido/transmitido |
| Registros de app (logs) | Não | Não | Nenhum log é enviado a lugar nenhum — não existe nem log local persistente hoje |

## 3. Práticas de segurança de dados

| Pergunta do formulário | Resposta recomendada | Base real |
|---|---|---|
| Os dados são criptografados em trânsito? | N/A — não há trânsito de dado do usuário | Zero rede (auditoria de rede) |
| Os dados são criptografados em repouso? | **Sim** | SQLCipher (AES-256) sobre Room, chave gerenciada pelo Android Keystore, nunca exportável (`ProvedorChaveMestraAndroid`) |
| Você pode solicitar que os dados sejam excluídos? | **Sim, localmente** — desinstalar o app remove o banco cifrado; não há conta nem cópia em servidor para excluir porque nenhuma cópia sai do aparelho | `android:allowBackup="false"`, sem conta, sem backend de dados de usuário |
| Os dados são revisados por uma política de exclusão? | Ver política de privacidade pública (#122, não tocada por esta auditoria) |
| O app segue a Família de Práticas de Dados do Google? | Sim — nenhum dado é vendido, nenhum uso para anúncio, nenhuma finalidade além do funcionamento do próprio app |

## 4. Permissões declaradas (`AndroidManifest.xml`)

Nenhuma `<uses-permission>` está declarada hoje (confirmado por leitura do manifesto). Se
biometria/`BiometricPrompt` exigir alguma permissão especial no futuro (hoje não exige, é gerida
pelo próprio SO via `BiometricManager`), isso precisa atualizar este documento antes de publicar.

## 5. Contas e login

Não há conta, login, e-mail ou senha de acesso ao serviço — o Savro é local-first e sem
autenticação de servidor (ADR-001/ADR-002). A única "senha" que existe no app é a senha de backup
(`*.savrobackup`), que nunca sai do aparelho e nunca é enviada a lugar nenhum.

## Observação final

Este rascunho deve ser revisado por Rhodolfo/QA e por quem tiver acesso ao Play Console antes de
qualquer submissão real — **nenhuma publicação foi autorizada nem realizada como parte desta
issue**.
