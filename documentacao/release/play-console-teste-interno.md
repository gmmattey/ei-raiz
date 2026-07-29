# Play Console — Teste Interno (Savro 0.1.0)

Guia para gerar e validar o primeiro AAB assinado do Savro, destinado ao envio manual à faixa de
teste interno do Google Play Console (#241). Não cobre ficha de loja, screenshots, IARC, Data
Safety ou publicação — isso é preparação posterior (#225, #227), fora do escopo deste documento.

## Identidade da versão

| Campo | Valor |
|---|---|
| `applicationId` | `io.savro.app` |
| `versionCode` | `1` |
| `versionName` | `0.1.0` |
| Nome do app | Savro |

Esses valores são fixos em `aplicativo/androidApp/build.gradle.kts` (`defaultConfig`). Incrementar
`versionCode` é obrigatório a cada novo envio ao Play Console — ver seção final.

## 1. Geração da chave de upload

**Não existe ainda uma chave de upload definitiva para o Savro.** Ela não deve ser gerada
silenciosamente por automação, nem reaproveitada da chave usada pelo SignallQ — cada produto tem
sua própria chave de assinatura.

O Luiz deve gerar localmente, com `keytool` (parte do JDK):

```bash
keytool -genkeypair -v \
  -keystore savro-upload-keystore.jks \
  -alias savro-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

O comando pede uma senha do keystore (store password) e, por padrão, reaproveita a mesma senha
para a chave (key password) — pode-se optar por senhas diferentes respondendo `n` quando
perguntado. Guarde as duas senhas e o arquivo `.jks` em um cofre de senhas (não em disco solto, não
no repositório).

Recomendação: gerar em um diretório fora do repositório (ex. `~/keys/savro/`), nunca dentro de
`aplicativo/`.

## 2. Secrets necessários

O workflow `android-internal-release.yml` e o build script (`androidApp/build.gradle.kts`) aceitam
as seguintes variáveis — em CI, via **GitHub Actions repository secrets**; localmente, via
variável de ambiente ou `gradle.properties` (fora do controle de versão):

| Nome | Uso | Onde configurar |
|---|---|---|
| `SAVRO_UPLOAD_KEYSTORE_BASE64` | Conteúdo do `.jks` codificado em base64 | Secret do repositório (usado pelo workflow de CI) |
| `SAVRO_UPLOAD_KEYSTORE_PATH` | Caminho absoluto do `.jks` no disco | Variável de ambiente local (build manual, fora de CI) |
| `SAVRO_UPLOAD_STORE_PASSWORD` | Senha do keystore | Secret do repositório / variável de ambiente local |
| `SAVRO_UPLOAD_KEY_ALIAS` | Alias da chave (`savro-upload`) | Secret do repositório / variável de ambiente local |
| `SAVRO_UPLOAD_KEY_PASSWORD` | Senha da chave | Secret do repositório / variável de ambiente local |

O build script usa `SAVRO_UPLOAD_KEYSTORE_PATH` **ou** `SAVRO_UPLOAD_KEYSTORE_BASE64` (o primeiro
que existir); nunca os dois ao mesmo tempo. O workflow de CI usa exclusivamente a variante base64 —
reconstrói o `.jks` num arquivo temporário do runner e apaga esse arquivo ao final do job
(`if: always()`), mesmo se algum passo anterior falhar.

Cadastro dos secrets no repositório (`buildea-labs/savro`) **não faz parte desta issue** — fica
para quando o Luiz gerar a chave real e decidir cadastrá-los.

Gerar o base64 a partir do `.jks` (Linux/macOS):

```bash
base64 -w0 savro-upload-keystore.jks > savro-upload-keystore.b64
```

No Windows (PowerShell):

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("savro-upload-keystore.jks")) | Out-File -Encoding ascii savro-upload-keystore.b64
```

## 3. Execução do workflow

`.github/workflows/android-internal-release.yml` é disparado manualmente
(`workflow_dispatch`) — Actions → "Android Internal Release" → Run workflow, na branch desejada.

O que o workflow faz, em ordem:

1. `verifyArchitecture`, `verifyDesignSystemTokens`, `verifyNoNetworkAccess`.
2. `commonTest` dos módulos compartilhados (`:shared:core:*`, `:shared:domain:patrimonio`).
3. Testes unitários de `:androidApp` (`testDevDebugUnitTest`).
4. Lint de release (`:androidApp:lintDevRelease`).
5. Reconstrói o keystore de upload a partir do secret base64.
6. Gera o bundle assinado: `:androidApp:bundleDevRelease`.
7. Inspeciona o Manifest do `.aab` via `bundletool dump manifest` — confirma `package`,
   `versionCode`, `versionName`, `debuggable=false` e ausência de sufixo `.dev`/`-dev`.
8. Valida a assinatura do bundle (`jarsigner -verify`).
9. Calcula o SHA-256 do `.aab`.
10. Publica o artifact privado `savro-0.1.0-internal-aab` (retenção de 7 dias).
11. Apaga o keystore temporário do runner (`if: always()`).

Sem os secrets cadastrados, o workflow falha explicitamente no passo de reconstrução do keystore —
não existe fallback silencioso para uma chave de debug.

## 4. Download e validação do artifact

No run concluído do workflow, aba "Summary" → seção Artifacts → baixar `savro-0.1.0-internal-aab`
(contém o `.aab` e um arquivo `.sha256`).

Validação manual adicional antes do envio ao Play Console:

```bash
# Conferir o hash contra o savro-0.1.0-internal.sha256 do artifact
sha256sum caminho/para/androidApp-dev-release.aab

# Conferir package/versão/debuggable (requer bundletool — mesma versão do workflow)
java -jar bundletool.jar dump manifest --bundle=caminho/para/androidApp-dev-release.aab
```

## 5. Envio manual ao Play Console

Fora do escopo de automação desta issue — feito manualmente pelo Luiz:

1. Play Console → Savro → Teste → Interno → Criar nova versão.
2. Upload do `.aab` baixado do artifact.
3. Preencher notas da versão (ver seção abaixo).
4. Salvar e revisar — **não enviar para revisão/publicação** sem decisão explícita do Luiz.

## 6. Notas da versão (sugestão para o Play Console)

```
Savro 0.1.0 — primeira versão de teste interno.

App de organização patrimonial local-first: os dados nunca saem do aparelho. Versão inicial
para validação interna antes da ficha de loja completa.
```

Ajustar conforme o que efetivamente estiver funcional no momento do envio.

## 7. Incremento futuro de versionCode

Cada novo envio ao Play Console (mesmo faixa de teste interno) exige `versionCode` estritamente
maior que o anterior — o Play Console rejeita reenvio com o mesmo `versionCode`. Antes do próximo
envio:

1. Incrementar `versionCode` em `aplicativo/androidApp/build.gradle.kts` (`defaultConfig`).
2. Atualizar `versionName` se a mudança for visível ao usuário (ex. `0.1.1`, `0.2.0`) — versionCode
   sobe sempre, versionName é decisão de produto.
3. Rodar o workflow novamente para gerar o novo `.aab` assinado.

Este documento não cobre a política de quando subir `versionName` (minor vs. patch) — isso é
decisão de produto a ser tomada quando houver mais de uma versão em campo.
