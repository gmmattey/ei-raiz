export const normalizeCnpj = (input: string): string => input.replace(/\D+/g, "");

const toSearchText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const matchesSearch = (name: string, query: string): boolean => toSearchText(name).includes(toSearchText(query));
