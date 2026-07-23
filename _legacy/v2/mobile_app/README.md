# ESQUILO INVEST

Base inicial do app Flutter do Esquilo Invest.

## Objetivo

- transportar a leitura principal do dashboard para um app mobile real
- preservar a logica de negocio no AppScript
- adaptar a interface para Android e iPhone sem retrabalhar o web atual

## Estrutura

- `lib/app/`: shell, tema e roteamento
- `lib/core/`: configuracao e utilitarios base
- `lib/features/dashboard/`: telas e controller do MVP
- `lib/models/`: contrato mobile derivado do payload atual do AppScript
- `lib/services/`: cliente HTTP para o backend em AppScript
- `lib/widgets/`: blocos visuais reutilizaveis
- `docs/`: blueprint, matriz de migracao e contrato da API mobile

## Blueprint

- `docs/pocket_ops_architecture_blueprint.pdf`
- `docs/pocket_ops_architecture_blueprint.html`

## Como rodar

Android com backend real:

```bash
flutter run --dart-define=APP_SCRIPT_BASE_URL=https://script.google.com/macros/s/SEU_DEPLOY/exec
```

Android com token opcional:

```bash
flutter run --dart-define=APP_SCRIPT_BASE_URL=https://script.google.com/macros/s/SEU_DEPLOY/exec --dart-define=APP_SCRIPT_API_TOKEN=seu_token
```

## Endpoints esperados

O app usa o mesmo deploy do Apps Script, trocando apenas os parametros:

- `?format=json&resource=dashboard`
- `?format=json&resource=ai-analysis`
- `?format=json&resource=health`

## Validacao local

- `flutter analyze`
- `flutter test`

## Observacoes

- o app abre em estado de configuracao quando `APP_SCRIPT_BASE_URL` nao e informado
- a metrica exibida no hero usa a leitura consolidada atual do backend
- se voce quiser um `rendimento do mes` explicito, o backend precisa expor esse campo com regra confiavel
