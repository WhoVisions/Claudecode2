'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/app/lib/db';
import { FaCalculator, FaFileInvoiceDollar, FaMoneyBillWave } from 'react-icons/fa';

// 2024 Federal Tax Brackets (Single Filer)
const TAX_BRACKETS_SINGLE = [
  { rate: 0.10, min: 0, max: 11600 },
  { rate: 0.12, min: 11600, max: 47150 },
  { rate: 0.22, min: 47150, max: 100525 },
  { rate: 0.24, min: 100525, max: 191950 },
  { rate: 0.32, min: 191950, max: 243725 },
  { rate: 0.35, min: 243725, max: 609350 },
  { rate: 0.37, min: 609350, max: Infinity },
];

const STANDARD_DEDUCTION_SINGLE = 14600;

interface TaxCalculation {
  totalIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  estimatedTax: number;
  totalWithheld: number;
  estimatedRefund: number;
  effectiveTaxRate: number;
  marginalTaxRate: number;
}

const TaxCalculatorApp: React.FC = () => {
  const [taxData, setTaxData] = useState<TaxCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [incomeBreakdown, setIncomeBreakdown] = useState<Array<{ source: string; amount: number }>>([]);
  const [deductionBreakdown, setDeductionBreakdown] = useState<Array<{ category: string; amount: number }>>([]);

  useEffect(() => {
    calculateTax();
  }, []);

  const calculateTax = async () => {
    setLoading(true);
    try {
      // Read all tax documents from taxData store
      const taxDocKeys = await db.taxData.keys();
      let totalIncome = 0;
      let totalWithheld = 0;
      const sources: Array<{ source: string; amount: number }> = [];

      for (const key of taxDocKeys) {
        const doc = await db.taxData.getItem<any>(key);
        if (doc && doc.extractedData) {
          // W-2 Income
          if (doc.extractedData['W-2']) {
            const w2 = doc.extractedData['W-2'];
            const wages = parseFloat(w2['Wages, tips, other comp']?.replace(/[^0-9.-]+/g, '') || '0');
            const withheld = parseFloat(w2['Federal income tax withheld']?.replace(/[^0-9.-]+/g, '') || '0');

            if (wages > 0) {
              totalIncome += wages;
              totalWithheld += withheld;
              sources.push({ source: `W-2: ${doc.name}`, amount: wages });
            }
          }

          // 1099-INT Interest Income
          if (doc.extractedData['1099-INT']) {
            const int1099 = doc.extractedData['1099-INT'];
            const interest = parseFloat(int1099['Interest income']?.replace(/[^0-9.-]+/g, '') || '0');

            if (interest > 0) {
              totalIncome += interest;
              sources.push({ source: `1099-INT: ${doc.name}`, amount: interest });
            }
          }

          // 1099-DIV Dividend Income
          if (doc.extractedData['1099-DIV']) {
            const div1099 = doc.extractedData['1099-DIV'];
            const dividends = parseFloat(div1099['Total ordinary dividends']?.replace(/[^0-9.-]+/g, '') || '0');

            if (dividends > 0) {
              totalIncome += dividends;
              sources.push({ source: `1099-DIV: ${doc.name}`, amount: dividends });
            }
          }
        }
      }

      setIncomeBreakdown(sources);

      // Calculate deductions from transactions
      const transactionKeys = await db.transactions.keys();
      let totalDeductions = 0;
      const deductions: Array<{ category: string; amount: number }> = [];
      const deductionMap = new Map<string, number>();

      for (const key of transactionKeys) {
        const tx = await db.transactions.getItem<any>(key);
        if (tx && tx.amount < 0) { // Expenses are negative
          const category = tx.category || 'Uncategorized';
          // Only include deductible categories
          if (['Charitable Donations', 'Medical Expenses', 'Business Expense', 'Education'].includes(category)) {
            const amount = Math.abs(tx.amount);
            deductionMap.set(category, (deductionMap.get(category) || 0) + amount);
            totalDeductions += amount;
          }
        }
      }

      deductionMap.forEach((amount, category) => {
        deductions.push({ category, amount });
      });
      setDeductionBreakdown(deductions);

      // Calculate taxable income
      const standardDeduction = STANDARD_DEDUCTION_SINGLE;
      const itemizedDeductions = totalDeductions;
      const deduction = Math.max(standardDeduction, itemizedDeductions);
      const taxableIncome = Math.max(0, totalIncome - deduction);

      // Calculate tax using brackets
      let estimatedTax = 0;
      let incomeToTax = taxableIncome;
      let marginalRate = 0.10;

      for (const bracket of TAX_BRACKETS_SINGLE) {
        if (incomeToTax <= 0) break;

        const bracketWidth = bracket.max - bracket.min;
        const taxableInBracket = Math.min(incomeToTax, bracketWidth);
        estimatedTax += taxableInBracket * bracket.rate;
        incomeToTax -= taxableInBracket;

        if (incomeToTax >= 0) {
          marginalRate = bracket.rate;
        }
      }

      const estimatedRefund = totalWithheld - estimatedTax;
      const effectiveTaxRate = totalIncome > 0 ? (estimatedTax / totalIncome) * 100 : 0;

      setTaxData({
        totalIncome,
        standardDeduction: deduction,
        taxableIncome,
        estimatedTax,
        totalWithheld,
        estimatedRefund,
        effectiveTaxRate,
        marginalTaxRate: marginalRate * 100,
      });
    } catch (error) {
      console.error('Error calculating tax:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">Calculating taxes...</div>
      </div>
    );
  }

  if (!taxData) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-gray-500 p-6">
        <FaCalculator className="text-5xl mb-4 opacity-50" />
        <p className="text-lg">No tax data available</p>
        <p className="text-sm text-center mt-2">
          Use the Document Agent to scan your tax forms (W-2, 1099, etc.) first
        </p>
        <button
          onClick={calculateTax}
          className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
        >
          Recalculate
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 overflow-auto">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-200 mb-2">2024 Tax Calculator</h2>
            <p className="text-sm text-gray-400">Estimated federal tax calculation</p>
          </div>
          <button
            onClick={calculateTax}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <FaCalculator />
            Recalculate
          </button>
        </div>
      </div>

      {/* Main Result Card */}
      <div className="p-6">
        <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg p-6 mb-6 border border-blue-700">
          <div className="text-center mb-4">
            <div className="text-sm text-gray-300 mb-2">Estimated Refund / Amount Owed</div>
            <div className={`text-5xl font-bold ${taxData.estimatedRefund >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {taxData.estimatedRefund >= 0 ? '+' : ''}
              {formatCurrency(taxData.estimatedRefund)}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              {taxData.estimatedRefund >= 0 ? 'Expected Refund' : 'Amount You Owe'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center bg-black/20 rounded-lg p-3">
              <div className="text-xs text-gray-400">Total Income</div>
              <div className="text-xl font-bold text-gray-200">{formatCurrency(taxData.totalIncome)}</div>
            </div>
            <div className="text-center bg-black/20 rounded-lg p-3">
              <div className="text-xs text-gray-400">Estimated Tax</div>
              <div className="text-xl font-bold text-red-400">{formatCurrency(taxData.estimatedTax)}</div>
            </div>
            <div className="text-center bg-black/20 rounded-lg p-3">
              <div className="text-xs text-gray-400">Withheld</div>
              <div className="text-xl font-bold text-blue-400">{formatCurrency(taxData.totalWithheld)}</div>
            </div>
          </div>
        </div>

        {/* Tax Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Income Breakdown */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <FaMoneyBillWave className="text-green-400" />
              Income Sources
            </h3>
            {incomeBreakdown.length > 0 ? (
              <div className="space-y-2">
                {incomeBreakdown.map((source, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-900 rounded">
                    <span className="text-sm text-gray-300">{source.source}</span>
                    <span className="text-sm font-bold text-green-400">{formatCurrency(source.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded font-bold">
                  <span className="text-sm text-gray-200">Total Income</span>
                  <span className="text-sm text-green-400">{formatCurrency(taxData.totalIncome)}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No income sources found</p>
            )}
          </div>

          {/* Deductions */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <FaFileInvoiceDollar className="text-blue-400" />
              Deductions
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
                <span className="text-sm text-gray-300">Standard Deduction</span>
                <span className="text-sm font-bold text-blue-400">{formatCurrency(STANDARD_DEDUCTION_SINGLE)}</span>
              </div>
              {deductionBreakdown.length > 0 && (
                <>
                  <div className="text-xs text-gray-500 mt-3 mb-2">Itemized Deductions:</div>
                  {deductionBreakdown.map((deduction, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-900 rounded text-xs">
                      <span className="text-gray-400">{deduction.category}</span>
                      <span className="text-blue-400">{formatCurrency(deduction.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-3 bg-gray-700 rounded font-bold">
                    <span className="text-sm text-gray-200">Total Itemized</span>
                    <span className="text-sm text-blue-400">
                      {formatCurrency(deductionBreakdown.reduce((sum, d) => sum + d.amount, 0))}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded font-bold mt-2">
                <span className="text-sm text-gray-200">Applied Deduction</span>
                <span className="text-sm text-blue-400">{formatCurrency(taxData.standardDeduction)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Summary */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Tax Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-900 rounded">
              <div className="text-xs text-gray-500">Taxable Income</div>
              <div className="text-lg font-bold text-gray-200">{formatCurrency(taxData.taxableIncome)}</div>
            </div>
            <div className="text-center p-3 bg-gray-900 rounded">
              <div className="text-xs text-gray-500">Effective Tax Rate</div>
              <div className="text-lg font-bold text-purple-400">{taxData.effectiveTaxRate.toFixed(2)}%</div>
            </div>
            <div className="text-center p-3 bg-gray-900 rounded">
              <div className="text-xs text-gray-500">Marginal Tax Rate</div>
              <div className="text-lg font-bold text-purple-400">{taxData.marginalTaxRate.toFixed(0)}%</div>
            </div>
            <div className="text-center p-3 bg-gray-900 rounded">
              <div className="text-xs text-gray-500">Tax Bracket</div>
              <div className="text-lg font-bold text-gray-200">
                {TAX_BRACKETS_SINGLE.find(b => taxData.taxableIncome >= b.min && taxData.taxableIncome < b.max)?.rate ?
                  `${(TAX_BRACKETS_SINGLE.find(b => taxData.taxableIncome >= b.min && taxData.taxableIncome < b.max)!.rate * 100).toFixed(0)}%` :
                  '37%'}
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <p className="text-xs text-yellow-400">
            <strong>Disclaimer:</strong> This is an estimated calculation for educational purposes only.
            Actual tax liability may differ based on additional factors not considered here.
            Consult a tax professional for accurate tax preparation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaxCalculatorApp;
