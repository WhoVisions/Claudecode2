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

// Tax knowledge chunk interface for db.taxKnowledge store
export interface TaxKnowledgeChunk {
  id: string;
  source: string; // e.g., "IRS Publication 17"
  title: string; // e.g., "Your Federal Income Tax"
  section: string; // e.g., "Chapter 5: Standard Deduction"
  year: number; // e.g., 2024
  content: string; // The actual text content
  keywords: string[]; // For simple keyword matching
  createdAt: string;
}

// Capital gains interface for db.capitalGains store
export interface CapitalGain {
  id: string;
  portfolioId: string;
  symbol: string;
  saleDate: string;
  sharesSold: number;
  proceeds: number; // Total sale amount
  costBasis: number; // Total cost basis of shares sold
  realizedGain: number; // proceeds - costBasis
  gainType: 'short-term' | 'long-term'; // Based on 1-year holding period
  purchaseDates: string[]; // Array of original purchase dates for the shares sold
  notes?: string;
  createdAt: string;
}

// Client organizer interface for db.clientOrganizer store
export interface ClientOrganizerAnswer {
  id: string;
  taxYear: number;
  question: string;
  answer: boolean; // true = yes, false = no
  category: 'family' | 'housing' | 'employment' | 'investment' | 'business' | 'education' | 'health' | 'other';
  notes?: string;
  updatedAt: string;
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
  taxKnowledge: localforage.createInstance({
    name: 'fin-os-db',
    storeName: 'taxKnowledge',
  }),
  capitalGains: localforage.createInstance({
    name: 'fin-os-db',
    storeName: 'capitalGains',
  }),
  clientOrganizer: localforage.createInstance({
    name: 'fin-os-db',
    storeName: 'clientOrganizer',
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

// FIFO Cost Basis Calculation for selling shares
export interface FIFOResult {
  costBasis: number;
  gainType: 'short-term' | 'long-term';
  purchaseDates: string[];
}

export const calculateFIFOCostBasis = async (
  portfolioId: string,
  symbol: string,
  sharesSold: number,
  saleDate: string
): Promise<FIFOResult> => {
  // Get all holding transactions for this symbol
  const transactionKeys = await db.holdingTransactions.keys();
  const buyTransactions: HoldingTransaction[] = [];

  for (const key of transactionKeys) {
    const tx = await db.holdingTransactions.getItem<HoldingTransaction>(key);
    if (tx && tx.type === 'buy') {
      // Find the holding for this transaction
      const holdingKeys = await db.holdings.keys();
      for (const hKey of holdingKeys) {
        const holding = await db.holdings.getItem<Holding>(hKey);
        if (holding && holding.id === tx.holdingId && holding.portfolioId === portfolioId && holding.symbol === symbol) {
          buyTransactions.push(tx);
          break;
        }
      }
    }
  }

  // Sort buy transactions by date (oldest first) - FIFO
  buyTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let remainingShares = sharesSold;
  let totalCostBasis = 0;
  const purchaseDates: string[] = [];
  let isShortTerm = false;

  const saleDateObj = new Date(saleDate);
  const oneYearAgo = new Date(saleDateObj);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Process buy transactions in FIFO order
  for (const buyTx of buyTransactions) {
    if (remainingShares <= 0) break;

    const sharesToTake = Math.min(remainingShares, buyTx.quantity);
    const costBasisForTheseShares = sharesToTake * buyTx.pricePerUnit;

    totalCostBasis += costBasisForTheseShares;
    purchaseDates.push(buyTx.date);

    // Check if any shares are short-term (held <= 1 year)
    const purchaseDate = new Date(buyTx.date);
    if (purchaseDate > oneYearAgo) {
      isShortTerm = true;
    }

    remainingShares -= sharesToTake;
  }

  return {
    costBasis: totalCostBasis,
    gainType: isShortTerm ? 'short-term' : 'long-term',
    purchaseDates,
  };
};

// Seed initial IRS tax knowledge base
export const seedTaxKnowledge = async (): Promise<void> => {
  const existingKeys = await db.taxKnowledge.keys();
  if (existingKeys.length > 0) {
    return; // Already seeded
  }

  const knowledgeChunks: TaxKnowledgeChunk[] = [
    // IRS Publication 17 - Standard Deduction
    {
      id: 'pub17-standard-deduction',
      source: 'IRS Publication 17',
      title: 'Your Federal Income Tax',
      section: 'Standard Deduction',
      year: 2024,
      content: `The standard deduction is a dollar amount that reduces your taxable income. For 2024, the standard deduction amounts are: Single or Married Filing Separately: $14,600; Married Filing Jointly or Qualifying Surviving Spouse: $29,200; Head of Household: $21,900. You can claim the standard deduction if you don't itemize deductions. The standard deduction is higher for taxpayers who are 65 or older or blind.`,
      keywords: ['standard deduction', 'deduction', 'taxable income', 'itemize', '14600', 'married', 'single', 'head of household'],
      createdAt: new Date().toISOString(),
    },
    // IRS Publication 587 - Home Office Deduction
    {
      id: 'pub587-home-office',
      source: 'IRS Publication 587',
      title: 'Business Use of Your Home',
      section: 'Home Office Deduction',
      year: 2024,
      content: `To qualify for a home office deduction, you must use part of your home regularly and exclusively for business. The space must be either your principal place of business OR a place where you meet clients or customers in the normal course of business. You can deduct direct expenses (expenses that benefit only the business part of your home) in full. For indirect expenses (expenses for keeping up and running your entire home), you deduct only the business percentage. The simplified method allows you to deduct $5 per square foot of home used for business, up to 300 square feet (maximum $1,500).`,
      keywords: ['home office', 'deduction', 'business', 'exclusive', 'regular', 'principal place', 'simplified method', 'square feet'],
      createdAt: new Date().toISOString(),
    },
    // IRS Publication 550 - Capital Gains
    {
      id: 'pub550-capital-gains',
      source: 'IRS Publication 550',
      title: 'Investment Income and Expenses',
      section: 'Capital Gains and Losses',
      year: 2024,
      content: `A capital gain or loss is the difference between your basis in property and the amount you realize when you sell or exchange it. If you hold property for more than one year before disposing of it, your capital gain or loss is long-term. If you hold it one year or less, your capital gain or loss is short-term. Net capital gain is taxed at lower rates than ordinary income. The maximum capital gains tax rates for 2024 are: 0% for taxpayers in the 10% and 12% ordinary income tax brackets; 15% for taxpayers in the 22%, 24%, 32%, and 35% brackets; 20% for taxpayers in the 37% bracket. Short-term capital gains are taxed at your ordinary income tax rate.`,
      keywords: ['capital gains', 'capital loss', 'long-term', 'short-term', 'basis', 'investment', 'stock', 'sale', 'tax rate'],
      createdAt: new Date().toISOString(),
    },
    // IRS Publication 544 - Sales of Assets
    {
      id: 'pub544-basis',
      source: 'IRS Publication 544',
      title: 'Sales and Other Dispositions of Assets',
      section: 'Cost Basis',
      year: 2024,
      content: `The basis of property you buy is usually its cost. The cost includes the purchase price and certain other expenses. If you acquire property other than by purchase (such as by gift or inheritance), refer to IRS rules for determining basis. When you sell property, your gain or loss is the difference between the amount realized and your adjusted basis. For stocks, your basis is typically what you paid for the stock, including commissions. If you bought stock at different times for different prices, you must keep track of the basis for each lot. When you sell, you can specify which shares you're selling (specific identification method) or use the default FIFO (first-in, first-out) method.`,
      keywords: ['basis', 'cost basis', 'adjusted basis', 'fifo', 'specific identification', 'stock', 'purchase', 'commission'],
      createdAt: new Date().toISOString(),
    },
    // Charitable Contributions
    {
      id: 'pub526-charitable',
      source: 'IRS Publication 526',
      title: 'Charitable Contributions',
      section: 'Charitable Contribution Deductions',
      year: 2024,
      content: `You can deduct charitable contributions of money or property to qualified organizations. To be deductible, your contribution must be made to a qualified organization. No charitable contribution deduction is allowed for a contribution of $250 or more unless you obtain written acknowledgment from the charity. The deduction is limited to 60% of your adjusted gross income for cash contributions to public charities, and 30% for property contributions. Contributions that exceed the limits can be carried forward for up to 5 years. You must keep records of all contributions, regardless of amount.`,
      keywords: ['charitable', 'contribution', 'donation', 'deduction', '250', 'acknowledgment', 'qualified organization', 'receipt'],
      createdAt: new Date().toISOString(),
    },
    // Medical Expenses
    {
      id: 'pub502-medical',
      source: 'IRS Publication 502',
      title: 'Medical and Dental Expenses',
      section: 'Medical Expense Deduction',
      year: 2024,
      content: `You can deduct only the amount of your medical and dental expenses that exceeds 7.5% of your adjusted gross income (AGI). Medical expenses include payments for diagnosis, cure, mitigation, treatment, or prevention of disease. This includes payments for doctors, dentists, surgeons, hospitals, prescription medicines, and medical insurance premiums. You can also include expenses for transportation primarily for and essential to medical care. You cannot deduct expenses that are reimbursed by insurance or other sources.`,
      keywords: ['medical', 'dental', 'expenses', 'deduction', '7.5%', 'agi', 'insurance', 'prescription', 'doctor', 'hospital'],
      createdAt: new Date().toISOString(),
    },
    // Cryptocurrency Taxation
    {
      id: 'crypto-taxation',
      source: 'IRS Notice 2014-21',
      title: 'Virtual Currency Guidance',
      section: 'Cryptocurrency as Property',
      year: 2024,
      content: `The IRS treats cryptocurrency as property for federal tax purposes. This means general tax principles applicable to property transactions apply to transactions using cryptocurrency. When you sell or exchange cryptocurrency, you must recognize a capital gain or loss on the transaction. If you held the cryptocurrency for more than one year before selling or exchanging it, you will have a long-term capital gain or loss. If you held it for one year or less, you will have a short-term capital gain or loss. Mining cryptocurrency is treated as ordinary income equal to the fair market value of the cryptocurrency on the date of receipt.`,
      keywords: ['cryptocurrency', 'crypto', 'bitcoin', 'property', 'capital gains', 'mining', 'exchange', 'virtual currency'],
      createdAt: new Date().toISOString(),
    },
  ];

  for (const chunk of knowledgeChunks) {
    await db.taxKnowledge.setItem(chunk.id, chunk);
  }
};
