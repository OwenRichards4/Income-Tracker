// Flat-rate tax estimate for tip income. Wage income is excluded — it's
// already withheld via payroll (see wage_entries). Kept isolated from the
// rest of the app so it stays a single, testable seam if the model ever
// needs to grow beyond flat-rate arithmetic.

export interface TaxEstimateInput {
  totalTips: number;
  ficaRate: number;
  estimatedIncomeTaxRate: number;
}

export interface TaxEstimateResult {
  ficaOwed: number;
  incomeTaxOwed: number;
  totalOwed: number;
  takeHomeEstimate: number;
}

export function estimateTaxOwed({
  totalTips,
  ficaRate,
  estimatedIncomeTaxRate,
}: TaxEstimateInput): TaxEstimateResult {
  const ficaOwed = totalTips * ficaRate;
  const incomeTaxOwed = totalTips * estimatedIncomeTaxRate;
  const totalOwed = ficaOwed + incomeTaxOwed;

  return {
    ficaOwed,
    incomeTaxOwed,
    totalOwed,
    takeHomeEstimate: totalTips - totalOwed,
  };
}
