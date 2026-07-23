# ALERTAS E NOTIFICAÇÕES — MVP

---

## OBJETIVO

Gerar alertas simples, acionáveis e relevantes com base nos dados da carteira.

O Esquilo não notifica tudo.
Ele notifica o que importa.

---

## PRINCÍPIO

Todo alerta deve responder:
- o que aconteceu
- por que importa
- o que fazer

---

## TIPOS DE ALERTA (MVP)

### 1. Queda relevante de ativo

Condição:
- ativo caiu abaixo de X% definido

Exemplo:
"Ação X caiu abaixo do nível que você costuma tolerar."

Ação:
"Avalie se mantém ou reduz exposição."

---

### 2. Fundo rendendo abaixo do CDI

Condição:
- fundo rendendo abaixo do CDI por período contínuo (ex: 90 dias)

Exemplo:
"Este fundo está rendendo abaixo do CDI há algum tempo."

Ação:
"Pode não estar compensando o risco ou custo. Vale revisar."

---

### 3. Concentração excessiva

Condição:
- um bloco > 50% da carteira

Exemplo:
"Você está muito concentrado em um único tipo de investimento."

Ação:
"Use os próximos aportes para equilibrar."

---

### 4. Falta de aporte

Condição:
- usuário sem aporte por período

Exemplo:
"Você está há um tempo sem investir."

Ação:
"Retomar consistência tende a ser mais importante que buscar o investimento perfeito."

---

## CANAIS — MVP

### RECOMENDADO

#### Telegram (principal)
- simples de integrar
- gratuito
- envio via HTTP (Bot API)

Base:
- endpoint sendMessage
- envio de texto direto

#### Email (opcional)
- útil para fallback
- pode usar Apps Script (legado) ou serviço externo

---

## NÃO RECOMENDADO PARA MVP

#### WhatsApp
- modelo pago por conversa
- exige configuração mais complexa

---

## ESTRUTURA DO ALERTA (BACKEND)

Exemplo:

{
  "type": "fundo_abaixo_cdi",
  "severity": "media",
  "message_key": "fund_underperforming",
  "data": {
    "duration_days": 90
  }
}

---

## USO DE IA

### Backend define:
- tipo do alerta
- severidade
- contexto

### IA gera:
- frase final
- tom humano
- simplificação

---

## REGRA FINAL

IA não decide quando alertar.
IA apenas traduz o alerta.

---

FIM
