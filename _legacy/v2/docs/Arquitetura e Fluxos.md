# **Arquitetura e Fluxos de Dados (Revisado)**

## **Nova Estrutura de Pastas (novo-backend)**

A estrutura agora reflete os domínios reais e lida com processamento em background (workers/filas).  
`novo-backend/`  
`├── src/`  
`│   ├── api/               # Endpoints REST (recebem requisições do App)`  
`│   ├── core/`                
`│   │   ├── users/         # Lida com perfil e contexto`  
`│   │   ├── portfolios/    # Lógica de Snapshot vs Transactions`  
`│   │   └── imports/       # Lógica de fila e parser de arquivos`  
`│   ├── db/                # Schemas Drizzle e queries D1`  
`│   ├── ai/                # Montagem de contexto e chamadas LLM`  
`│   ├── workers/           # Consumidores de filas (Cloudflare Queues)`  
`│   └── index.ts           # Roteador principal`  
`├── wrangler.toml          # Configs de D1, R2 (Storage) e Queues`  
`└── README.md`

## **Fluxo de Autenticação (Hipótese de MVP)**

* **Não entra agora:** Login com senha, verificação de e-mail, JWT robusto.  
* **Entra no MVP:** App gera um UUID de instalação (Device ID) ou o backend gera um guest\_id transparente. Toda requisição manda esse ID via Header (X-Esquilo-User-Id). O backend cria o usuário silenciosamente se não existir.  
* **Ponto a validar:** O risco de perda de dados se o usuário trocar de celular. Se o teste de produto provar que a galera quer manter o dado, integramos Firebase Auth ou Clerk na V2.

## **Fluxo de Importação (Revisado para Arquitetura Resiliente)**

*O problema do Base64 e tempo de execução foi resolvido delegando o peso para Storage e Filas.*

1. **Upload Seguro:** O App bate na API e pede uma URL de Upload. A API gera uma *Presigned URL* do Cloudflare R2 (Storage).  
2. **Envio Direto:** O App sobe o CSV/Extrato direto para o R2 (Storage), não passa pela memória da API.  
3. **Sinalização:** App avisa a API: "Arquivo subiu".  
4. **Registro:** A API cria um import\_job no banco (status PENDING) e joga uma mensagem na *Cloudflare Queue* (Fila). A API responde "Em processamento" pro App.  
5. **Processamento Assíncrono:** Um Worker de background puxa o arquivo do R2, faz o parser (sem limite de 10ms de CPU), cadastra assets que faltam, e gera um novo portfolio\_snapshot com as snapshot\_positions.  
6. **Finalização:** Worker atualiza import\_job pra DONE. O App (via *polling* curto ou notificação) lê que terminou e recarrega a Home.

## **Fluxo de Home Principal**

Ficou absurdamente mais rápido:

1. App chama GET /home.  
2. Backend só precisa buscar o último portfolio\_snapshots do usuário (pega o total\_equity) e buscar na tabela insights a última recomendação atrelada a esse snapshot.  
3. Não há cálculo matemático pesado no carregamento da tela inicial.

## **O que entra vs O que NÃO entra no MVP**

**Entra:**

* Perfilamento financeiro avançado na base (pra melhorar o prompt da IA).  
* Estrutura de Snapshots (importação foca em atualizar a "foto" atual e não criar um ledger complexo de contabilidade).  
* Fluxo de Importação Assíncrono via Storage/Fila (Obrigatório para a saúde do servidor).

**Não Entra agora:**

* Auth completo (Senhas, Google, Apple Login).  
* Reconstrução de carteira com base em retroatividade de transações (só lemos a foto final).  
* Integração via Open Finance (mantemos o CSV/Extrato manual ou parser de PDF).