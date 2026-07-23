export type ExternalDataBanner = {
  kind: 'external_data';
  severity: 'info' | 'warning';
  title: string;
  body: string;
};

export function bannerFromSourceWarning(sourceWarning: string | null | undefined): ExternalDataBanner | null {
  if (!sourceWarning) return null;
  return {
    kind: 'external_data',
    severity: 'info',
    title: 'Dados externos indisponiveis',
    body: sourceWarning
  };
}

export function bannerFromQuotationStatus(input: { quotationStatus: string | null | undefined }): ExternalDataBanner | null {
  const status = input.quotationStatus;
  if (!status) return null;

  // O contrato usa string; tratamos "priced" como caminho feliz.
  if (status === 'priced') return null;

  return {
    kind: 'external_data',
    severity: 'warning',
    title: 'Cotacao indisponivel',
    body: 'Alguns valores podem estar desatualizados por falta de referencia externa. A leitura principal continua valida.'
  };
}

export function bannerFromMissingExternalLink(externalLink: string | null | undefined): ExternalDataBanner | null {
  if (externalLink) return null;
  return {
    kind: 'external_data',
    severity: 'info',
    title: 'Link externo indisponivel',
    body: 'Alguns detalhes externos podem nao aparecer agora. O nucleo do produto continua funcionando.'
  };
}
