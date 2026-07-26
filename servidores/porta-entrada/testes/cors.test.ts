import assert from 'node:assert/strict';
import test from 'node:test';
import { cabecalhosCors } from '../src/index';

test('autoriza somente a origem explicitamente configurada', () => {
  const env = { CORS_ALLOWED_ORIGINS: 'https://esquilo.wallet, http://localhost:5173' };
  const permitido = cabecalhosCors(new Request('https://api.esquilo.wallet/api/mercado/ativos', {
    headers: { origin: 'https://esquilo.wallet' },
  }), env as never);
  const negado = cabecalhosCors(new Request('https://api.esquilo.wallet/api/mercado/ativos', {
    headers: { origin: 'https://hostil.example' },
  }), env as never);
  assert.equal(permitido['access-control-allow-origin'], 'https://esquilo.wallet');
  assert.equal(permitido.vary, 'origin');
  assert.equal(negado['access-control-allow-origin'], undefined);
});
