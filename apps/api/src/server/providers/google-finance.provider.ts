export class GoogleFinanceProvider {
  async fetchQuote(_ticker: string): Promise<{ price: number | null; updatedAt: string | null } | null> {
    return null;
  }
}
