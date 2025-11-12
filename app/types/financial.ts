// Financial data types inspired by Firefly III and ezBookkeeping

export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'asset' | 'expense' | 'revenue' | 'cash' | 'bank';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
  parentId?: string;
  createdAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  date: Date;

  // Accounts
  sourceAccountId?: string; // For expense/transfer
  destinationAccountId?: string; // For income/transfer

  // Categorization
  categoryId?: string;
  tags?: string[];

  // Additional data
  notes?: string;
  attachments?: string[]; // File paths
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };

  // Recurring
  isRecurring?: boolean;
  recurringRule?: RecurringRule;

  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  startDate: Date;
  endDate?: Date;
  nextOccurrence: Date;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  currency: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate?: Date;

  // Which categories this budget applies to
  categoryIds: string[];

  // Tracking
  spent: number;
  remaining: number;

  // Alert settings
  alertAt?: number; // Alert when spent reaches this percentage

  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: Date;
  accountId?: string; // Which account this goal is linked to
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  type: 'income-expense' | 'budget' | 'category' | 'tag' | 'net-worth';
  startDate: Date;
  endDate: Date;
  data: any;
  generatedAt: Date;
}

// Investment Portfolio Types
export type HoldingType = 'stock' | 'etf' | 'mutual-fund' | 'crypto' | 'bond' | 'commodity' | 'real-estate' | 'other';

export interface Holding {
  id: string;
  portfolioId: string;
  symbol: string; // Ticker symbol or identifier
  name: string;
  type: HoldingType;

  // Quantity and pricing
  quantity: number;
  averageCostBasis: number; // Average cost per unit
  currentPrice: number; // Current market price per unit
  currency: string;

  // Calculated values
  totalCost: number; // quantity * averageCostBasis
  currentValue: number; // quantity * currentPrice
  unrealizedGain: number; // currentValue - totalCost
  unrealizedGainPercent: number;

  // Additional data
  notes?: string;
  lastPriceUpdate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface HoldingTransaction {
  id: string;
  holdingId: string;
  type: 'buy' | 'sell' | 'dividend' | 'split' | 'transfer-in' | 'transfer-out';
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  fees?: number;
  currency: string;
  date: Date;
  notes?: string;
  createdAt: Date;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  accountId?: string; // Link to account in accounts store

  // Aggregated values
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;

  // Cash position
  cashBalance: number;
  currency: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioPerformance {
  portfolioId: string;
  date: Date;
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
}

// Dashboard statistics
export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  totalAssets: number;
  totalBudget: number;
  budgetSpent: number;
  transactionCount: number;
  topCategories: {
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
  }[];
  recentTransactions: Transaction[];

  // Investment stats
  totalPortfolioValue?: number;
  totalPortfolioGain?: number;
  totalPortfolioGainPercent?: number;
}
