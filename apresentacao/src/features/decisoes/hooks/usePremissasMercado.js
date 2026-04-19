import { useEffect, useState } from 'react';
import { decisoesApi } from '../../../cliente-api';

export function usePremissasMercado(tipo) {
  const [premissas, setPremissas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    setLoading(true);
    decisoesApi.obterPremissasMercado(tipo)
      .then((data) => { if (ativo) setPremissas(data.premissas || []); })
      .catch(() => { if (ativo) setErro('Parâmetros de mercado indisponíveis.'); })
      .finally(() => { if (ativo) setLoading(false); });
    return () => { ativo = false; };
  }, [tipo]);

  const getValor = (chave) => premissas.find((p) => p.chave === chave)?.valor ?? null;

  return { premissas, loading, erro, getValor };
}

export function buildPremissasImovel(form, getValor) {
  const juros = getValor('imovel_juros_padrao') ?? 0.105;
  const itbiRate = getValor('imovel_itbi_padrao') ?? 0.03;
  const manutRate = getValor('imovel_manutencao_padrao') ?? 0.005;
  const valorizacao = getValor('imovel_valorizacao_padrao');
  const reajuste = getValor('reajuste_aluguel_padrao');
  const retorno = getValor('retorno_investimento_padrao');

  const extra = {};
  if (valorizacao !== null) extra.valorizacaoAnual = valorizacao;
  if (reajuste !== null) extra.reajusteAluguelAnual = reajuste;
  if (retorno !== null) extra.retornoInvestimentoAnual = retorno;

  return {
    ...form,
    jurosAnual: juros,
    custosDocumentacao: itbiRate * (form.valorImovel || 0),
    manutencaoMensal: manutRate * (form.valorImovel || 0) / 12,
    ...extra,
  };
}

export function buildPremissasCarro(form, getValor) {
  const juros = getValor('carro_juros_padrao') ?? 0.16;
  const seguroPct = getValor('carro_seguro_pct_padrao') ?? 0.0375;
  const manutPct = getValor('carro_manutencao_pct_padrao') ?? 0.027;
  const km = getValor('carro_combustivel_km_padrao') ?? 650;
  const consumo = getValor('carro_consumo_padrao') ?? 12;
  const precoL = getValor('carro_combustivel_preco_padrao') ?? 6.2;
  const depreciacao = getValor('carro_depreciacao_padrao') ?? 0.15;
  const retorno = getValor('retorno_investimento_padrao');

  const combustivelMensal = (km / consumo) * precoL;
  const extra = {};
  if (retorno !== null) extra.retornoInvestimentoAnual = retorno;

  return {
    ...form,
    jurosAnual: juros,
    seguroAnual: seguroPct * (form.valorCarro || 0),
    manutencaoAnual: manutPct * (form.valorCarro || 0),
    combustivelMensal,
    depreciacaoAnual: depreciacao,
    ...extra,
  };
}

export function buildPremissasReservaFinanciar(form, getValor) {
  const juros = getValor('credito_juros_padrao') ?? 0.18;
  const retorno = getValor('retorno_investimento_padrao');
  const extra = {};
  if (retorno !== null) extra.retornoInvestimentoAnual = retorno;
  return { ...form, jurosCreditoAnual: juros, ...extra };
}

export function buildPremissasGastarInvestir(form, getValor) {
  const retorno = getValor('retorno_investimento_padrao');
  if (retorno !== null) return { ...form, retornoEsperado: retorno };
  return form;
}
