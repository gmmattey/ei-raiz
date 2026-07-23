import { expect, test } from '@playwright/test';
import { deflateRawSync } from 'node:zlib';
import { decodeLatin1, parseZipHeader, searchFunds, streamParseCsvFromZip } from '../src/cvm';

function makeZip(csv: string) {
  const filename = Buffer.from('cvm.csv', 'utf8');
  const compressed = deflateRawSync(Buffer.from(csv, 'utf8'));
  const header = Buffer.alloc(30 + filename.length);

  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(8, 8);
  header.writeUInt32LE(0, 10);
  header.writeUInt32LE(0, 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(Buffer.byteLength(csv), 22);
  header.writeUInt16LE(filename.length, 26);
  header.writeUInt16LE(0, 28);
  filename.copy(header, 30);

  return Buffer.concat([header, compressed]);
}

function fakeDb(rows: Array<Record<string, unknown>>) {
  return {
    prepare() {
      return {
        bind(...args: unknown[]) {
      return {
          async all() {
              const [query, digitsOnly] = args as [string, string];
              const q = String(query).toLowerCase();
              const digits = String(digitsOnly || '');
              const filtered = rows.filter((row) => {
                const name = String(row.denom_social ?? '');
                const cnpj = String(row.cnpj ?? '').replace(/\D/g, '');
                const matchName = q.length > 0 ? name.toLowerCase().includes(q) : false;
                const matchCnpj = digits.length > 0 ? cnpj.includes(digits) : false;
                return matchName || matchCnpj;
              });
              return { results: filtered.map((row) => ({ ...row })) };
            },
          };
        },
      };
    },
  } as unknown as D1Database;
}

test('parsers da CVM leem ZIP e CSV com dados reais', async () => {
  const accent = decodeLatin1(Uint8Array.from([0x43, 0x61, 0x66, 0xe9]).buffer);
  expect(accent).toBe('Café');

  const csv = [
    'TP_FUNDO_CLASSE;CNPJ_FUNDO_CLASSE;ID_SUBCLASSE;DT_COMPTC;VL_TOTAL;VL_QUOTA;VL_PATRIM_LIQ;CAPTC_DIA;RESG_DIA;NR_COTST',
    'F;12345678000190;1;2026-06-01;10;1.23;100;0;0;1',
    'F;12345678000190;1;2026-06-03;10;1.45;100;0;0;1',
    'F;11111111000111;1;2026-06-02;10;2.50;100;0;0;1',
  ].join('\n');
  const zip = makeZip(csv);

  const header = parseZipHeader(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength));
  expect(header.compressedSize).toBeGreaterThan(0);
  expect(header.dataOffset).toBeGreaterThan(30);

  const parsed = await streamParseCsvFromZip(zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength), new Set([
    '12345678000190',
    '11111111000111',
  ]));

  expect(parsed.get('12345678000190')).toEqual({ date: '2026-06-03', quota: 1.45 });
  expect(parsed.get('11111111000111')).toEqual({ date: '2026-06-02', quota: 2.5 });
});

test('busca fundos por nome e CNPJ', async () => {
  const db = fakeDb([
    {
      cnpj: '12345678000190',
      denom_social: 'Icatu Vanguarda Pos Fixado RF Prev',
      gestor: 'Icatu',
      classe: 'Renda Fixa',
      classe_anbima: 'Previdenciario',
      rentab_fundo: 'CDI',
      vl_patrim_liq: 500000000,
    },
    {
      cnpj: '11111111000111',
      denom_social: 'Western Asset US Index 500 FIF',
      gestor: 'Western Asset',
      classe: 'Multimercado',
      classe_anbima: 'Macro',
      rentab_fundo: 'S&P 500',
      vl_patrim_liq: 1200000000,
    },
  ]);

  const byName = await searchFunds(db, 'icatu');
  expect(byName).toHaveLength(1);
  expect(byName[0].name).toContain('Icatu');

  const byCnpj = await searchFunds(db, '12.345.678/0001-90');
  expect(byCnpj).toHaveLength(1);
  expect(byCnpj[0].cnpj).toBe('12345678000190');
});
