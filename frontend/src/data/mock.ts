import type { Loan, LendOffer, BorrowRequest, MarketStat } from "@/types";

export const mockMarketStats: MarketStat = {
  totalSupplied: 12500000,
  totalBorrowed: 8400000,
  netApy: 12.4,
  healthFactor: 1.8,
};

export const mockLoans: Loan[] = [
  {
    id: "loan-1",
    borrower: "0x123...abc",
    lender: "0x789...xyz",
    principal: 5000,
    principalType: "USDC",
    collateralAmount: 4000,
    collateralType: "SUI",
    interestRateBps: 850, // 8.5%
    startTime: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    duration: 1000 * 60 * 60 * 24 * 14, // 14 days
    state: "Active",
  },
  {
    id: "loan-2",
    borrower: "0x123...abc",
    lender: "0x555...777",
    principal: 10000,
    principalType: "USDT",
    collateralAmount: 8000,
    collateralType: "SUI",
    interestRateBps: 600, // 6%
    startTime: Date.now() - 1000 * 60 * 60 * 24 * 20, // 20 days ago
    duration: 1000 * 60 * 60 * 24 * 30, // 30 days
    state: "Active",
  },
];

export const mockLendings: Loan[] = [
  {
    id: "loan-3",
    borrower: "0x999...111",
    lender: "0xME...ME",
    principal: 2500,
    principalType: "USDC",
    collateralAmount: 1200,
    collateralType: "ETH",
    interestRateBps: 1200, // 12%
    startTime: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    duration: 1000 * 60 * 60 * 24 * 7, // 7 days
    state: "Active",
  },
];

export const mockBorrowRequests: BorrowRequest[] = [
  {
    id: "req-1",
    borrower: "0xabc...def",
    collateral: "SUI",
    collateralAmount: 5000,
    requestAmount: 2000,
    maxRateBps: 900, // 9%
    duration: 1000 * 60 * 60 * 24 * 14,
  },
  {
    id: "req-2",
    borrower: "0xdef...123",
    collateral: "ETH",
    collateralAmount: 10,
    requestAmount: 25000,
    maxRateBps: 1200, // 12%
    duration: 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: "req-3",
    borrower: "0xaaa...bbb",
    collateral: "BTC",
    collateralAmount: 0.5,
    requestAmount: 30000,
    maxRateBps: 800, // 8%
    duration: 1000 * 60 * 60 * 24 * 60,
  },
];

export const mockLendOffers: LendOffer[] = [
  {
    id: "offer-1",
    provider: "0xlend...er1",
    asset: "USDC",
    amount: 50000,
    minRateBps: 500, // 5%
    maxDuration: 1000 * 60 * 60 * 24 * 90,
    minLtvBps: 6000, // 60%
  },
  {
    id: "offer-2",
    provider: "0xlend...er2",
    asset: "USDT",
    amount: 100000,
    minRateBps: 650, // 6.5%
    maxDuration: 1000 * 60 * 60 * 24 * 180,
    minLtvBps: 7000, // 70%
  },
];
