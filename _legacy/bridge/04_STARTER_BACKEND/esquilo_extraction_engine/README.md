# Motor de extração assistida

Serviço HTTP separado para extração canônica de carteira a partir de PDF, imagem, DOCX ou texto já extraído.

## Endpoints
- `GET /v1/health`
- `POST /v1/extraction/parse`

## Estratégia
1. tenta regra simples quando há texto extraído
2. se a regra não fecha com confiança alta, chama OpenAI
3. OpenAI aceita imagem direto e PDF direto nesta versão
4. se OpenAI falhar ou não suportar bem o input, usa Gemini
5. Gemini pode usar inline data para arquivos menores e upload de arquivo para cargas maiores ou MIME menos confortáveis inline
6. salva request bruto e payload normalizado para auditoria

## Input esperado
```json
{
  "fileName": "carteira_xp.pdf",
  "mimeType": "application/pdf",
  "extractedText": "...opcional...",
  "fileBase64": "...opcional...",
  "documentId": "...opcional..."
}
