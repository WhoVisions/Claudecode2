// IndexedDB storage using localforage for privacy-first data persistence
import localforage from 'localforage';

// Transaction interface for db.transactions store
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  accountId: string;
  receiptId?: string; // Link to receipt in receipts store
}

// Account interface for db.accounts store
export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

// Budget interface for db.budgets store
export interface Budget {
  id: string;
  name: string;
  amount: number;
  period: string;
  categoryIds: string[];
  spent: number;
  remaining: number;
}

// Tax data interface for db.taxData store
export interface TaxData {
  key: string;
  file: string;
  name: string;
  detectedForms: string[];
  extractedData: Record<string, any>;
  extractedText?: string;
}

// Tax checklist item interface for db.taxChecklist store
export interface TaxChecklistItem {
  id: string;
  formType: string;
  description: string;
  required: boolean;
  found: boolean;
  files: string[];
  extractedData?: any;
}

// Receipt interface for db.receipts store
export interface Receipt {
  key: string;
  file: string;
  filePath: string;
  name: string;
  detectedForms: string[];
  extractedData: {
    Receipt: {
      Merchant?: string;
      Date?: string;
      'Total Amount'?: string;
    };
  };
  transactionId?: string; // Link to transaction in transactions store
}

// Portfolio interface for db.portfolios store
export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  accountId?: string;
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  cashBalance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// Holding interface for db.holdings store
export interface Holding {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  type: 'stock' | 'etf' | 'mutual-fund' | 'crypto' | 'bond' | 'commodity' | 'real-estate' | 'other';
  quantity: number;
  averageCostBasis: number;
  currentPrice: number;
  currency: string;
  totalCost: number;
  currentValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  notes?: string;
  lastPriceUpdate?: string;
  createdAt: string;
  updatedAt: string;
}

// Holding transaction interface for db.holdingTransactions store
export interface HoldingTransaction {
  id: string;
  holdingId: string;
  type: 'buy' | 'sell' | 'dividend' | 'split' | 'transfer-in' | 'transfer-out';
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  fees?: number;
  currency: string;
  date: string;
  notes?: string;
  createdAt: string;
}

// Initialize all stores
export const db = {
  transactions: localforage.createInstance({
    name: 'fin-os-db',
    storeName: 'transactions',
  }),
  accounts: localforage.createInstance({
    name: 'fin-os-db',
    storeName: 'accounts',
  }),
  budgets: localforage.createInstance({
    name: 'fin-os-db',
    storeName: 'budgets',
  }),
  taxData: localforage.createInstance({
    name: 'fin-os-db',
    storeName: 'taxData',
  }),
  taxChecklist: localforage.createInstance({
    name: 'fin-os-db',
    storeName: 'taxChecklist',
  }),
  receipts: localforage.createInstance({
    name: 'fin-os-db',
    storeName: 'receipts',
  }),
  portfolios: localforage.createInstance({
    name: 'fin-os-db',
    storeName: 'portfolios',
  }),
  holdings: localforage.createInstance({
    name: 'fin-os-db',
    storeName: 'holdings',
  }),
  holdingTransactions: localforage.createInstance({
    name: 'fin-os-db',
    storeName: 'holdingTransactions',
  }),
  settings: localforage.createInstance({
    name: 'fin-os-db',
    storeName: 'settings',
  }),
};

// Helper functions for portfolio calculations
export const calculateHoldingMetrics = (holding: Holding): Holding => {
  const totalCost = holding.quantity * holding.averageCostBasis;
  const currentValue = holding.quantity * holding.currentPrice;
  const unrealizedGain = currentValue - totalCost;
  const unrealizedGainPercent = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0;

  return {
    ...holding,
    totalCost,
    currentValue,
    unrealizedGain,
    unrealizedGainPercent,
  };
};

export const calculatePortfolioMetrics = async (portfolioId: string): Promise<Partial<Portfolio>> => {
  const holdingsKeys = await db.holdings.keys();
  const holdings: Holding[] = [];

  for (const key of holdingsKeys) {
    const holding = await db.holdings.getItem<Holding>(key);
    if (holding && holding.portfolioId === portfolioId) {
      holdings.push(calculateHoldingMetrics(holding));
    }
  }

  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent,
  };
};
