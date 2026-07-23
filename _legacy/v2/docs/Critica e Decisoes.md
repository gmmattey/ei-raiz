# **Diagnóstico da Proposta Anterior e Correção de Rota**

## **1\. Onde a proposta anterior falhou (Crítica Arquitetural)**

* **Autenticação "Trancada":** Assumir que criaríamos um sistema de token/sessão do zero no D1 logo no MVP é um tiro no pé. Auth é complexo (recuperação de senha, 2FA, LGPD). O produto precisa validar a tese de investimento, não a tese de login.  
* **Importação Kamikaze:** Sugerir Base64 pra subir CSV em um Cloudflare Worker é pedir pra tomar *Timeout* ou *Memory Limit Exceeded*. Workers no edge têm limites rígidos de memória e tempo de CPU (10ms a 50ms no plano free). Um CSV da B3 de 3 anos derrubaria o endpoint.  
* **Ticker como Primary Key:** Erro clássico. Funciona lindo pra PETR4, mas quebra em 5 minutos quando o usuário importa um "CDB Banco Master 110% CDI" ou um Fundo de Previdência Verde. Ativos precisam de IDs universais ou *surrogate keys* (UUID).  
* **Miopia Transacional:** Tentar calcular o patrimônio atual (Consolidação) somando todas as transações (compras e vendas) do passado é frágil. Muitas vezes o extrato da corretora traz a **Posição Atual (Snapshot)** e não o histórico. Se o usuário esquecer de importar uma venda de 2021, o saldo consolida errado hoje.

## **2\. Decisões Revisadas para o Novo Backend**

1. **Autenticação vira Hipótese, não Feature (MVP):** \- *Agora:* Usaremos um device\_id ou um guest\_token gerado no app para atrelar os dados. Foco total em deixar o usuário testar o produto com zero atrito.  
   * *Depois:* Avaliar provedores de Auth as a Service (Clerk, Supabase Auth ou Firebase Auth) quando houver necessidade de "Salvar conta na nuvem".  
2. **Separação de Snapshot vs Transação:**  
   * O Esquilo vai trabalhar com **Snapshots** (Fotografias da Carteira) como fonte da verdade para a Home e IA, e não apenas com fluxo de transações.  
3. **Fluxo Assíncrono para Importação:**  
   * Sai o Base64, entra o ecossistema completo da Cloudflare: R2 (Storage tipo S3) \+ Queues (Filas de processamento) \+ D1 (Banco).