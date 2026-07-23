import { UserFinancialProfile } from "../../types";

export interface PortfolioPosition {
  assetClass: 'stocks' | 'funds' | 'crypto' | 'bonds' | 'reits' | 'cash';
  ticker: string;
  name: string;
  quantity: number;
  currentPrice: number;
  purchasePrice: number;
  currentValue: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  diversification: {
    count: number;
    herfindahl: number; // 0 = perfect, 1 = concentrated
    concentration: 'high' | 'moderate' | 'low';
  };
  assetClassDistribution: Record<string, number>;
  riskScore: number; // 0-100
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  issues: Array<{ severity: 'critical' | 'warning' | 'info'; message: string }>;
}

export interface PortfolioRecommendation {
  type: 'REBALANCE' | 'CONCENTRATE' | 'DIVERSIFY' | 'REDUCE_RISK' | 'INCREASE_YIELD';
  priority: 'high' | 'medium' | 'low';
  detail: string;
  targetAllocation?: Record<string, number>;
}

export class PortfolioAnalysis {
  /**
   * Analyze portfolio against profile
   */
  public analyzePortfolio(
    positions: PortfolioPosition[],
    profile: UserFinancialProfile
  ): PortfolioMetrics {
    const totalValue = this.calculateTotalValue(positions);
    const totalCost = this.calculateTotalCost(positions);
    const unrealizedGain = totalValue - totalCost;
    const unrealizedGainPercent = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0;

    const diversification = this.calculateDiversification(positions, totalValue);
    const assetClassDist = this.calculateAssetClassDistribution(positions, totalValue);
    const riskScore = this.calculateRiskScore(
      profile.investorProfile.value || 'moderate',
      diversification.herfindahl,
      assetClassDist
    );
    const expectedReturn = this.estimateExpectedReturn(assetClassDist);
    const volatility = this.estimateVolatility(assetClassDist);
    const sharpeRatio = this.calculateSharpeRatio(expectedReturn, volatility);

    const issues = this.identifyIssues(
      positions,
      profile,
      diversification,
      assetClassDist,
      riskScore
    );

    return {
      totalValue,
      totalCost,
      unrealizedGain,
      unrealizedGainPercent,
      diversification,
      assetClassDistribution: assetClassDist,
      riskScore,
      expectedReturn,
      volatility,
      sharpeRatio,
      issues,
    };
  }

  /**
   * Generate rebalancing recommendations
   */
  public generateRecommendations(
    metrics: PortfolioMetrics,
    profile: UserFinancialProfile
  ): PortfolioRecommendation[] {
    const recommendations: PortfolioRecommendation[] = [];

    // High concentration check
    if (metrics.diversification.herfindahl > 0.4) {
      recommendations.push({
        type: 'DIVERSIFY',
        priority: 'high',
        detail: `Seu portfólio está muito concentrado (${(metrics.diversification.herfindahl * 100).toFixed(0)}% em poucos ativos). Reduza riscos diversificando.`,
      });
    }

    // Risk mismatch
    const targetRisk = this.getTargetRiskScore(profile.investorProfile.value || 'moderate');
    if (Math.abs(metrics.riskScore - targetRisk) > 20) {
      const action = metrics.riskScore > targetRisk ? 'REDUCE_RISK' : 'INCREASE_YIELD';
      const verb = metrics.riskScore > targetRisk ? 'Reduza' : 'Aumente';
      recommendations.push({
        type: action,
        priority: 'high',
        detail: `Seu risco (${metrics.riskScore}/100) não corresponde ao perfil ${profile.investorProfile.value} (alvo: ${targetRisk}/100). ${verb} exposição.`,
      });
    }

    // Rebalancing check (if allocation drifts >5%)
    const drift = this.calculateAllocationDrift(metrics.assetClassDistribution);
    if (drift > 5) {
      recommendations.push({
        type: 'REBALANCE',
        priority: 'medium',
        detail: `Sua alocação desviou ${drift.toFixed(1)}% do alvo. Rebalanceie para manter perfil de risco.`,
        targetAllocation: this.getTargetAllocation(profile.investorProfile.value || 'moderate'),
      });
    }

    // Low yield check
    if (metrics.expectedReturn < 3 && profile.age && profile.age.value < 50) {
      recommendations.push({
        type: 'INCREASE_YIELD',
        priority: 'medium',
        detail: `Retorno esperado (${metrics.expectedReturn.toFixed(1)}% a.a.) é baixo para sua idade. Considere diversificar em ações.`,
      });
    }

    return recommendations;
  }

  private calculateTotalValue(positions: PortfolioPosition[]): number {
    return positions.reduce((sum, p) => sum + p.currentValue, 0);
  }

  private calculateTotalCost(positions: PortfolioPosition[]): number {
    return positions.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0);
  }

  private calculateDiversification(
    positions: PortfolioPosition[],
    totalValue: number
  ): { count: number; herfindahl: number; concentration: 'high' | 'moderate' | 'low' } {
    const herfindahl = positions.reduce((sum, p) => {
      const weight = p.currentValue / totalValue;
      return sum + weight * weight;
    }, 0);

    let concentration: 'high' | 'moderate' | 'low' = 'low';
    if (herfindahl > 0.4) concentration = 'high';
    else if (herfindahl > 0.2) concentration = 'moderate';

    return {
      count: positions.length,
      herfindahl,
      concentration,
    };
  }

  private calculateAssetClassDistribution(
    positions: PortfolioPosition[],
    totalValue: number
  ): Record<string, number> {
    const dist: Record<string, number> = {};
    positions.forEach((p) => {
      dist[p.assetClass] = (dist[p.assetClass] || 0) + p.currentValue / totalValue;
    });
    return dist;
  }

  private calculateRiskScore(
    investorProfile: string,
    herfindahl: number,
    assetClassDist: Record<string, number>
  ): number {
    let baseScore = 50;

    // Profile adjustment
    if (investorProfile === 'aggressive') baseScore = 75;
    else if (investorProfile === 'moderate') baseScore = 50;
    else if (investorProfile === 'conservative') baseScore = 25;

    // Asset class adjustment
    const stockAlloc = assetClassDist['stocks'] || 0;
    const cryptoAlloc = assetClassDist['crypto'] || 0;
    baseScore += stockAlloc * 20 + cryptoAlloc * 30;

    // Concentration adjustment (diversification reduces risk)
    baseScore -= herfindahl * 20;

    return Math.min(100, Math.max(0, Math.round(baseScore)));
  }

  private getTargetRiskScore(profile: string): number {
    if (profile === 'aggressive') return 75;
    if (profile === 'conservative') return 25;
    return 50; // moderate
  }

  private estimateExpectedReturn(assetClassDist: Record<string, number>): number {
    const returns: Record<string, number> = {
      stocks: 8,
      funds: 6,
      bonds: 4,
      reits: 5,
      crypto: 12,
      cash: 1,
    };

    return Object.entries(assetClassDist).reduce((sum, [cls, weight]) => {
      return sum + (returns[cls] || 0) * weight;
    }, 0);
  }

  private estimateVolatility(assetClassDist: Record<string, number>): number {
    const volatilities: Record<string, number> = {
      stocks: 15,
      funds: 10,
      bonds: 5,
      reits: 12,
      crypto: 60,
      cash: 0,
    };

    return Object.entries(assetClassDist).reduce((sum, [cls, weight]) => {
      return sum + (volatilities[cls] || 0) * weight;
    }, 0);
  }

  private calculateSharpeRatio(expectedReturn: number, volatility: number): number {
    const riskFreeRate = 1;
    if (volatility === 0) return 0;
    return (expectedReturn - riskFreeRate) / volatility;
  }

  private identifyIssues(
    positions: PortfolioPosition[],
    profile: UserFinancialProfile,
    diversification: any,
    assetClassDist: Record<string, number>,
    riskScore: number
  ): Array<{ severity: 'critical' | 'warning' | 'info'; message: string }> {
    const issues: Array<{ severity: 'critical' | 'warning' | 'info'; message: string }> = [];

    // Check for concentration
    if (positions.length === 1) {
      issues.push({
        severity: 'critical',
        message: 'Portfólio com apenas 1 ativo. Risco de concentração crítico.',
      });
    } else if (diversification.herfindahl > 0.5) {
      issues.push({
        severity: 'warning',
        message: `${positions[0].ticker} representa ${((positions[0].currentValue / this.calculateTotalValue(positions)) * 100).toFixed(0)}% do portfólio.`,
      });
    }

    // Check for age-risk mismatch
    if (profile.age && profile.age.value && profile.age.value > 60) {
      if (riskScore > 60) {
        issues.push({
          severity: 'warning',
          message: 'Portfólio muito agressivo para sua idade. Considere aumentar alocação defensiva.',
        });
      }
    }

    // Check for crypto concentration
    const cryptoAlloc = assetClassDist['crypto'] || 0;
    if (cryptoAlloc > 0.2) {
      issues.push({
        severity: 'warning',
        message: `Alocação em criptoativos (${(cryptoAlloc * 100).toFixed(0)}%) acima do recomendado.`,
      });
    }

    return issues;
  }

  private calculateAllocationDrift(distribution: Record<string, number>): number {
    const target = this.getTargetAllocation('moderate');
    let drift = 0;
    Object.keys(target).forEach((cls) => {
      drift += Math.abs((distribution[cls] || 0) - target[cls]);
    });
    return drift / 2; // Normalize
  }

  private getTargetAllocation(profile: string): Record<string, number> {
    if (profile === 'aggressive') {
      return { stocks: 0.7, funds: 0.15, bonds: 0.05, reits: 0.05, crypto: 0.05 };
    }
    if (profile === 'conservative') {
      return { stocks: 0.2, funds: 0.3, bonds: 0.4, reits: 0.08, crypto: 0 };
    }
    // moderate
    return { stocks: 0.4, funds: 0.25, bonds: 0.2, reits: 0.1, crypto: 0.05 };
  }
}
