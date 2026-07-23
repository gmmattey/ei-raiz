// Adapter temporario do runtime vivo.
// A implementacao real da trilha de ingestao agora mora em `apps/ingestion-plane`,
// mas `src/index.ts` e os testes locais continuam importando daqui enquanto o Worker
// principal nao passa por um cutover estruturado.

export * from '../apps/ingestion-plane/cvm'
