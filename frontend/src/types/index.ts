export interface LendOffer {
  id: string;
  provider: string; // Address
  asset: string; // CoinType (e.g., 'USDC')
  amount: number;
  minRateBps: number;
  maxDuration: number; // Seconds
  minLtvBps: number;
}

export interface BorrowRequest {
  id: string;
  borrower: string; // Address
  collateral: string; // CoinType (e.g., 'SUI')
  requestAmount: number; // CoinType (e.g., 'USDC')
  maxRateBps: number;
  duration: number; // Seconds
  collateralAmount: number;
}

export interface Loan {
  id: string;
  borrower: string;
  lender: string; // Helper for UI, strictly it's the LoanNote holder
  principal: number;
  interestRateBps: number;
  startTime: number;
  duration: number;
  state: 'Active' | 'Repaid' | 'Liquidated';
  collateralAmount: number;
  collateralType: string;
  principalType: string;
}

// Mock Data Types for UI
export interface MarketStat {
  totalSupplied: number;
  totalBorrowed: number;
  netApy: number;
  healthFactor: number;
}
