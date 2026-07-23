const http = require('node:http');
const { URL } = require('node:url');

const PRICE_MAP = {
  CPLE3: 14.61,
  ITSA4: 12.88,
  RANI3: 7.95,
  BRST3: 2.93,
  PETR4: 38.12,
  VALE3: 62.25,
  BBAS3: 28.7,
  HGLG11: 158.4,
};

function historyFor(ticker, range) {
  const base = PRICE_MAP[ticker] ?? 10;
  const steps = range === '1mo' ? 4 : range === '3mo' ? 7 : range === '1y' ? 12 : 6;
  const start = Math.max(1, base * 0.82);
  const delta = (base - start) / Math.max(steps - 1, 1);
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: steps }, (_, i) => ({
    date: now - (steps - 1 - i) * 86400 * 7,
    close: Number((start + delta * i).toFixed(2)),
  }));
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const pathname = url.pathname;

  if (pathname === '/health') {
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/v2/macro/latest') {
    return sendJson(res, 200, {
      results: [
        { slug: 'cdi', latestValue: 10.65, latestDate: '2026-06-16' },
        { slug: 'selic', latestValue: 10.50, latestDate: '2026-06-16' },
        { slug: 'ipca12m', latestValue: 4.20, latestDate: '2026-06-16' },
      ],
    });
  }

  const quoteMatch = pathname.match(/^\/api\/quote\/([^/]+)$/);
  if (quoteMatch) {
    const ticker = decodeURIComponent(quoteMatch[1]).toUpperCase();
    const range = url.searchParams.get('range');
    if (range) {
      return sendJson(res, 200, {
        results: [
          {
            symbol: ticker,
            historicalDataPrice: historyFor(ticker, range),
          },
        ],
      });
    }

    return sendJson(res, 200, {
      results: [
        {
          symbol: ticker,
          regularMarketPrice: PRICE_MAP[ticker] ?? 10,
        },
      ],
    });
  }

  sendJson(res, 404, { error: 'Not found', path: pathname });
});

server.listen(0, '127.0.0.1', () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  process.stdout.write(`READY:${port}\n`);
});
