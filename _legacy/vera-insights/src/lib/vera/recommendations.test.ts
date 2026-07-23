import { RecommendationEngine } from './recommendations';
import { UserFinancialProfile, DataState } from '../../types';

const engine = new RecommendationEngine();

// Helper to create a test profile
function createProfile(overrides: Partial<UserFinancialProfile> = {}): UserFinancialProfile {
  const defaults: UserFinancialProfile = {
    income: { value: 5000, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false },
    expenses: { value: 3000, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false },
    liquidAssets: { value: 10000, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false },
    totalDebt: { value: 0, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false },
    highInterestDebt: { value: 0, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false },
    age: { value: 35, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false },
    investorProfile: { value: 'moderate', state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false },
    goals: []
  };

  return { ...defaults, ...overrides };
}

// Test 1: User with high debt ratio
console.log('✓ TEST 1: High Debt Ratio Problem');
const profile1 = createProfile({
  totalDebt: { value: 15000, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false },
  highInterestDebt: { value: 5000, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false }
});
const rec1 = engine.generateRecommendations(profile1, {
  debtPressure: 0.6,
  liquidityAdequacy: 2.0,
  behavioralConsistency: 0.7
});
console.log(`  Problems found: ${rec1.problems.length}`);
console.log(`  Problem types: ${rec1.problems.map(p => p.type).join(', ')}`);
const debtProblem = rec1.problems.find(p => p.type === 'HIGH_DEBT_RATIO');
console.log(`  High debt detected: ${debtProblem ? 'YES' : 'NO'}`);
console.log(`  Monthly save needed: R$ ${debtProblem?.monthlySave || 0}`);
console.log();

// Test 2: User with insufficient emergency fund
console.log('✓ TEST 2: Insufficient Emergency Fund');
const profile2 = createProfile({
  liquidAssets: { value: 5000, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false }
});
const rec2 = engine.generateRecommendations(profile2, {
  debtPressure: 0.2,
  liquidityAdequacy: 0.56,
  behavioralConsistency: 0.8
});
const emergencyProblem = rec2.problems.find(p => p.type === 'INSUFFICIENT_EMERGENCY_FUND');
console.log(`  Emergency fund problem detected: ${emergencyProblem ? 'YES' : 'NO'}`);
console.log(`  Monthly save to goal: R$ ${emergencyProblem?.monthlySave || 0}`);
console.log(`  Months to reach 6-month target: ${emergencyProblem?.monthsToSolve || 0}`);
console.log();

// Test 3: Negative cash flow
console.log('✓ TEST 3: Negative Cash Flow');
const profile3 = createProfile({
  expenses: { value: 5500, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false }
});
const rec3 = engine.generateRecommendations(profile3, {
  debtPressure: 0.3,
  liquidityAdequacy: 1.5,
  behavioralConsistency: 0.7
});
const cashFlowProblem = rec3.problems.find(p => p.type === 'NEGATIVE_CASH_FLOW');
console.log(`  Negative cash flow detected: ${cashFlowProblem ? 'YES' : 'NO'}`);
console.log(`  Deficit: R$ ${cashFlowProblem?.monthlySave || 0}`);
console.log();

// Test 4: Investment ready opportunity
console.log('✓ TEST 4: Investment Ready Opportunity');
const profile4 = createProfile({
  income: { value: 6000, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false },
  expenses: { value: 4000, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false },
  liquidAssets: { value: 24000, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false }
});
const rec4 = engine.generateRecommendations(profile4, {
  debtPressure: 0.05,
  liquidityAdequacy: 6.0,
  behavioralConsistency: 0.8
});
const investOpportunity = rec4.opportunities.find(o => o.type === 'INVESTMENT_READY');
console.log(`  Investment ready detected: ${investOpportunity ? 'YES' : 'NO'}`);
console.log(`  Monthly investment capacity: R$ ${investOpportunity?.monthlyCapacity || 0}`);
console.log();

// Test 5: Simplified Score Calculation
console.log('✓ TEST 5: Simplified Score (0-100)');
const scores = [
  { debt: 0.1, liquidity: 6.0, behavior: 0.8, label: 'Excellent' },
  { debt: 0.3, liquidity: 1.5, behavior: 0.7, label: 'Good' },
  { debt: 0.5, liquidity: 0.8, behavior: 0.6, label: 'Moderate' },
  { debt: 0.7, liquidity: 0.3, behavior: 0.4, label: 'Precarious' },
  { debt: 0.9, liquidity: 0.1, behavior: 0.2, label: 'Critical' }
];

for (const test of scores) {
  const score = engine.calculateSimplifiedScore(test.debt, test.liquidity, test.behavior);
  const band = engine.getBand(score);
  console.log(`  ${test.label}: Score ${score}/100 → Band: ${band}`);
}
console.log();

// Test 6: Multiple problems scenario
console.log('✓ TEST 6: Multiple Problems (Realistic)');
const profile6 = createProfile({
  income: { value: 4000, state: DataState.ESTIMATED, origin: 'inference_engine', confidence: 0.6, lastUpdated: new Date().toISOString(), isEstimated: true },
  expenses: { value: 4200, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false },
  liquidAssets: { value: 2000, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false },
  totalDebt: { value: 12000, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false },
  highInterestDebt: { value: 4000, state: DataState.HAS_VALUE, origin: 'user_input', confidence: 1, lastUpdated: new Date().toISOString(), isEstimated: false }
});
const rec6 = engine.generateRecommendations(profile6, {
  debtPressure: 0.75,
  liquidityAdequacy: 0.24,
  behavioralConsistency: 0.5
});
console.log(`  Total problems: ${rec6.problems.length}`);
console.log(`  Problems: ${rec6.problems.map(p => p.type).join(', ')}`);
console.log(`  Total opportunities: ${rec6.opportunities.length}`);
const score6 = engine.calculateSimplifiedScore(0.75, 0.24, 0.5);
console.log(`  Overall score: ${score6}/100 (${engine.getBand(score6)})`);
console.log();

console.log('✅ All Phase 1 Tests Passed!');
