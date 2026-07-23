# Telegram Notifications

## Objective
Define how the system communicates with Telegram for alerts.

## Flow
1. alert is generated
2. notification module formats message
3. message is sent via Telegram API
4. send is logged

## Message structure

- title
- context (portfolio issue)
- action recommendation

Example:
"Seu portfólio está concentrado demais. Reduza exposição em fundos X e Y."

## API
POST https://api.telegram.org/bot{TOKEN}/sendMessage

## Required payload
- chat_id
- text

## Rules
- no duplication (use alert id)
- apply cooldown per alert type
- message must be short and actionable

## Future
- support multiple users
- support message formatting (markdown)
