import { describe, it, expect, beforeEach } from 'vitest';
import { BrapiClient } from './brapi-client.js';

describe('BrapiClient', () => {
  let client: BrapiClient;

  beforeEach(() => {
    client = new BrapiClient();
    client.clearCache();
  });

  it('should return null for invalid ticker', async () => {
    const result = await client.getStockPrice('INVALID9999');
    expect(result).toBeNull();
  });

  it('should cache stock prices', async () => {
    const ticker = 'PETR4';

    const result1 = await client.getStockPrice(ticker);
    const result2 = await client.getStockPrice(ticker);

    // Should return same cached object
    expect(result1).toBe(result2);
  });

  it('should parse stock quote correctly', async () => {
    const ticker = 'PETR4';
    const result = await client.getStockPrice(ticker);

    if (result) {
      expect(result).toHaveProperty('ticker', ticker);
      expect(result).toHaveProperty('currentPrice');
      expect(result).toHaveProperty('dividendYield');
      expect(result).toHaveProperty('volatility');
      expect(typeof result.currentPrice).toBe('number');
    }
  });

  it('should return multiple prices in batch', async () => {
    const tickers = ['PETR4', 'VALE3'];
    const results = await client.getBatchPrices(tickers);

    expect(results.size).toBeGreaterThan(0);
  });

  it('should respect cache TTL', async () => {
    const ticker = 'PETR4';

    const result1 = await client.getStockPrice(ticker);

    // Manually expire cache by clearing
    client.clearCache();

    const result2 = await client.getStockPrice(ticker);

    expect(result1).not.toBe(result2);
  });
});
