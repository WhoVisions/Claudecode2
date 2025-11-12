// Local storage manager for financial data
// Inspired by Firefly III and ezBookkeeping's privacy-first approach

import {
  Account,
  Transaction,
  Category,
  Budget,
  Goal,
  Tag,
  DashboardStats,
} from '@/app/types/financial';

const STORAGE_KEYS = {
  ACCOUNTS: 'fin-os-accounts',
  TRANSACTIONS: 'fin-os-transactions',
  CATEGORIES: 'fin-os-categories',
  BUDGETS: 'fin-os-budgets',
  GOALS: 'fin-os-goals',
  TAGS: 'fin-os-tags',
};

export class StorageManager {
  // Generic storage methods
  private static getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item, this.dateReviver) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
    }
  }

  // Date parser for JSON
  private static dateReviver(key: string, value: any): any {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value);
    }
    return value;
  }

  // Accounts
  static getAccounts(): Account[] {
    return this.getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, this.getDefaultAccounts());
  }

  static saveAccounts(accounts: Account[]): void {
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);
  }

  static addAccount(account: Account): void {
    const accounts = this.getAccounts();
    accounts.push(account);
    this.saveAccounts(accounts);
  }

  static updateAccount(id: string, updates: Partial<Account>): void {
    const accounts = this.getAccounts();
    const index = accounts.findIndex((a) => a.id === id);
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...updates, updatedAt: new Date() };
      this.saveAccounts(accounts);
    }
  }

  static deleteAccount(id: string): void {
    const accounts = this.getAccounts().filter((a) => a.id !== id);
    this.saveAccounts(accounts);
  }

  // Transactions
  static getTransactions(): Transaction[] {
    return this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  }

  static saveTransactions(transactions: Transaction[]): void {
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  static addTransaction(transaction: Transaction): void {
    const transactions = this.getTransactions();
    transactions.push(transaction);
    this.saveTransactions(transactions);
    this.updateAccountBalances(transaction);
  }

  static updateTransaction(id: string, updates: Partial<Transaction>): void {
    const transactions = this.getTransactions();
    const index = transactions.findIndex((t) => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates, updatedAt: new Date() };
      this.saveTransactions(transactions);
    }
  }

  static deleteTransaction(id: string): void {
    const transactions = this.getTransactions().filter((t) => t.id !== id);
    this.saveTransactions(transactions);
  }

  // Update account balances based on transactions
  private static updateAccountBalances(transaction: Transaction): void {
    const accounts = this.getAccounts();

    if (transaction.type === 'expense' && transaction.sourceAccountId) {
      const account = accounts.find((a) => a.id === transaction.sourceAccountId);
      if (account) {
        account.balance -= transaction.amount;
      }
    } else if (transaction.type === 'income' && transaction.destinationAccountId) {
      const account = accounts.find((a) => a.id === transaction.destinationAccountId);
      if (account) {
        account.balance += transaction.amount;
      }
    } else if (transaction.type === 'transfer') {
      if (transaction.sourceAccountId) {
        const sourceAccount = accounts.find((a) => a.id === transaction.sourceAccountId);
        if (sourceAccount) sourceAccount.balance -= transaction.amount;
      }
      if (transaction.destinationAccountId) {
        const destAccount = accounts.find((a) => a.id === transaction.destinationAccountId);
        if (destAccount) destAccount.balance += transaction.amount;
      }
    }

    this.saveAccounts(accounts);
  }

  // Categories
  static getCategories(): Category[] {
    return this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, this.getDefaultCategories());
  }

  static saveCategories(categories: Category[]): void {
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);
  }

  static addCategory(category: Category): void {
    const categories = this.getCategories();
    categories.push(category);
    this.saveCategories(categories);
  }

  // Budgets
  static getBudgets(): Budget[] {
    return this.getItem<Budget[]>(STORAGE_KEYS.BUDGETS, []);
  }

  static saveBudgets(budgets: Budget[]): void {
    this.setItem(STORAGE_KEYS.BUDGETS, budgets);
  }

  static addBudget(budget: Budget): void {
    const budgets = this.getBudgets();
    budgets.push(budget);
    this.saveBudgets(budgets);
  }

  // Goals
  static getGoals(): Goal[] {
    return this.getItem<Goal[]>(STORAGE_KEYS.GOALS, []);
  }

  static saveGoals(goals: Goal[]): void {
    this.setItem(STORAGE_KEYS.GOALS, goals);
  }

  static addGoal(goal: Goal): void {
    const goals = this.getGoals();
    goals.push(goal);
    this.saveGoals(goals);
  }

  // Tags
  static getTags(): Tag[] {
    return this.getItem<Tag[]>(STORAGE_KEYS.TAGS, []);
  }

  static saveTags(tags: Tag[]): void {
    this.setItem(STORAGE_KEYS.TAGS, tags);
  }

  // Dashboard Statistics
  static getDashboardStats(): DashboardStats {
    const transactions = this.getTransactions();
    const accounts = this.getAccounts();
    const budgets = this.getBudgets();
    const categories = this.getCategories();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter transactions for current month
    const monthTransactions = transactions.filter(
      (t) => new Date(t.date) >= startOfMonth
    );

    const totalIncome = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalAssets = accounts
      .filter((a) => a.type === 'asset' || a.type === 'bank' || a.type === 'cash')
      .reduce((sum, a) => sum + a.balance, 0);

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const budgetSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

    // Top categories
    const categoryTotals = new Map<string, number>();
    monthTransactions
      .filter((t) => t.type === 'expense' && t.categoryId)
      .forEach((t) => {
        const current = categoryTotals.get(t.categoryId!) || 0;
        categoryTotals.set(t.categoryId!, current + t.amount);
      });

    const topCategories = Array.from(categoryTotals.entries())
      .map(([categoryId, amount]) => {
        const category = categories.find((c) => c.id === categoryId);
        return {
          categoryId,
          categoryName: category?.name || 'Unknown',
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Recent transactions
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      totalAssets,
      totalBudget,
      budgetSpent,
      transactionCount: monthTransactions.length,
      topCategories,
      recentTransactions,
    };
  }

  // Default data
  private static getDefaultAccounts(): Account[] {
    return [
      {
        id: '1',
        name: 'Checking Account',
        type: 'bank',
        currency: 'USD',
        balance: 0,
        notes: 'Primary checking account',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Savings Account',
        type: 'asset',
        currency: 'USD',
        balance: 0,
        notes: 'Emergency fund',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Cash',
        type: 'cash',
        currency: 'USD',
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  private static getDefaultCategories(): Category[] {
    return [
      // Income categories
      { id: 'cat-1', name: 'Salary', type: 'income', color: '#10B981', createdAt: new Date() },
      { id: 'cat-2', name: 'Freelance', type: 'income', color: '#3B82F6', createdAt: new Date() },
      { id: 'cat-3', name: 'Investments', type: 'income', color: '#8B5CF6', createdAt: new Date() },
      { id: 'cat-4', name: 'Other Income', type: 'income', color: '#6B7280', createdAt: new Date() },

      // Expense categories
      { id: 'cat-5', name: 'Housing', type: 'expense', color: '#EF4444', createdAt: new Date() },
      { id: 'cat-6', name: 'Transportation', type: 'expense', color: '#F59E0B', createdAt: new Date() },
      { id: 'cat-7', name: 'Food & Dining', type: 'expense', color: '#EC4899', createdAt: new Date() },
      { id: 'cat-8', name: 'Utilities', type: 'expense', color: '#06B6D4', createdAt: new Date() },
      { id: 'cat-9', name: 'Healthcare', type: 'expense', color: '#14B8A6', createdAt: new Date() },
      { id: 'cat-10', name: 'Entertainment', type: 'expense', color: '#A855F7', createdAt: new Date() },
      { id: 'cat-11', name: 'Shopping', type: 'expense', color: '#F97316', createdAt: new Date() },
      { id: 'cat-12', name: 'Insurance', type: 'expense', color: '#64748B', createdAt: new Date() },
      { id: 'cat-13', name: 'Taxes', type: 'expense', color: '#DC2626', createdAt: new Date() },
      { id: 'cat-14', name: 'Other Expenses', type: 'expense', color: '#9CA3AF', createdAt: new Date() },
    ];
  }

  // Export all data
  static exportData(): string {
    return JSON.stringify({
      accounts: this.getAccounts(),
      transactions: this.getTransactions(),
      categories: this.getCategories(),
      budgets: this.getBudgets(),
      goals: this.getGoals(),
      tags: this.getTags(),
      exportedAt: new Date(),
    }, null, 2);
  }

  // Import data
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData, this.dateReviver);
      if (data.accounts) this.saveAccounts(data.accounts);
      if (data.transactions) this.saveTransactions(data.transactions);
      if (data.categories) this.saveCategories(data.categories);
      if (data.budgets) this.saveBudgets(data.budgets);
      if (data.goals) this.saveGoals(data.goals);
      if (data.tags) this.saveTags(data.tags);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Clear all data (for testing)
  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    });
  }
}

export default StorageManager;
