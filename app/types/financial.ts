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
}
