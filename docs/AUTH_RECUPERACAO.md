# Recuperacao de Acesso (Estado Atual)

## Canais implementados
- Principal: e-mail.
- Fluxos:
  - `POST /api/auth/recuperar-senha` (usuario lembra e-mail)
  - `POST /api/auth/recuperar-acesso` (usuario nao lembra e-mail, usa CPF)
  - `POST /api/auth/redefinir-senha` (token + nova senha forte)

## Regras de seguranca aplicadas
- Nenhuma senha definitiva e enviada em texto puro.
- Recuperacao usa token temporario com expiração.
- E-mail de destino e sempre retornado mascarado no fluxo por CPF.

## Observabilidade em ambiente local
- Sem provedor de e-mail configurado, o token e registrado no log do Worker para testes locais.

## Nao implementado agora
- Envio real via Telegram/telefone.
- Motivo: nao existe infraestrutura confiavel de mensageria no projeto atual.
- Proximo passo sugerido: integrar provedor de e-mail transacional e, depois, canal secundario (SMS/Telegram) com verificacao forte de identidade.
