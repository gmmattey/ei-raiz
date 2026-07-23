# **Schema Conceitual Revisado (Cloudflare D1 / SQLite)**

Aqui separamos a fotografia atual (Snapshot) do que é histórico (Transação), e preparamos o terreno pra qualquer tipo de ativo.

## **Domínio: Usuário e Contexto**

*Objetivo: Entender quem é o usuário para a IA ter insumo de verdade.*  
**users**

* id (PK, UUID)  
* auth\_provider\_id (String, Nullable) \-\> *Deixamos pronto pra quando plugar um Google Login/Clerk.*  
* financial\_goal (String) \-\> *Ex: "Aposentadoria", "Comprar casa".*  
* monthly\_income\_range (String) \-\> *Ex: "5k-10k".*  
* monthly\_investment\_target (Decimal) \-\> *Quanto pretende aportar por mês.*  
* risk\_profile (String) \-\> *Conservador, Arrojado, etc.*  
* platforms\_used (JSON) \-\> *Quais corretoras/bancos usa.*  
* created\_at (Timestamp)

## **Domínio: Ativos e Rastreabilidade**

*Objetivo: Lidar com o caos dos nomes de fundos e CDBs.*  
**assets** (Dicionário global e local de ativos)

* id (PK, UUID)  
* type (Enum: STOCK, FII, FUND, FIXED\_INCOME, PENSION, CRYPTO)  
* code (String, Nullable) \-\> *Ex: PETR4, ou o CNPJ do fundo.*  
* custom\_name (String) \-\> *Ex: "CDB Sofisa Prefixado". Usado quando não tem Ticker.*  
* is\_custom (Boolean) \-\> *True se foi criado via input manual que não tem match global.*

**import\_jobs** (Rastreabilidade do que sobe)

* id (PK, UUID)  
* user\_id (FK \-\> users)  
* status (Enum: PENDING, PARSING, DONE, FAILED)  
* origin (Enum: B3\_CSV, BROKER\_EXTRACT, MANUAL\_ENTRY)  
* file\_storage\_ref (String, Nullable) \-\> *Caminho do arquivo cru salvo no Cloudflare R2.*  
* error\_log (Text, Nullable)  
* created\_at (Timestamp)

## **Domínio: Posição e Carteira (O Coração do Esquilo)**

*Objetivo: Garantir que a Home carregue rápido baseada na última "foto" certa.*  
**portfolios**

* id (PK, UUID)  
* user\_id (FK \-\> users)  
* name (String) \-\> *Ex: "Carteira Principal"*

**portfolio\_snapshots** (A Fotografia da Carteira num dado momento)

* id (PK, UUID)  
* portfolio\_id (FK \-\> portfolios)  
* import\_job\_id (FK \-\> import\_jobs, Nullable) \-\> *Qual importação gerou essa foto?*  
* reference\_date (Timestamp) \-\> *Data base da posição.*  
* total\_equity (Decimal) \-\> *Patrimônio total consolidado naquele instante (Cache para a Home).*  
* created\_at (Timestamp)

**snapshot\_positions** (O que tinha dentro da fotografia)

* id (PK, UUID)  
* snapshot\_id (FK \-\> portfolio\_snapshots)  
* asset\_id (FK \-\> assets)  
* quantity (Decimal)  
* unit\_price (Decimal) \-\> *Preço médio ou fechamento do dia.*  
* current\_value (Decimal) \-\> *Valor total da posição (qty \* price).*

**transactions** (Opcional no MVP \- Histórico de movimentação)

* id (PK, UUID)  
* portfolio\_id (FK \-\> portfolios)  
* asset\_id (FK \-\> assets)  
* operation\_type (Enum: BUY, SELL, DIVIDEND, YIELD)  
* quantity (Decimal)  
* price (Decimal)  
* date (Timestamp)

## **Domínio: Inteligência e Recomendações**

*Objetivo: Guardar o contexto que gerou a dica pra evitar alucinação.*  
**insights**

* id (PK, UUID)  
* snapshot\_id (FK \-\> portfolio\_snapshots) \-\> *A IA analisou qual foto da carteira?*  
* status (Enum: PENDING, GENERATED, FAILED)  
* ai\_context\_used (JSON) \-\> *Um log do que foi enviado no prompt (saldo, perfil, etc).*  
* raw\_ai\_response (Text) \-\> *Resposta crua do LLM.*  
* final\_message (Text) \-\> *A fraseologia final tratada para o usuário.*  
* generated\_at (Timestamp)