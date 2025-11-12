'use client';

import React, { useState } from 'react';
import { db } from '@/app/lib/db';
import { FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaPlay } from 'react-icons/fa';

interface AuditFlag {
  type: 'pass' | 'yellow' | 'red';
  title: string;
  message: string;
  details?: any[];
}

interface AuditReport {
  incomeMismatch: AuditFlag;
  roundNumbers: AuditFlag;
  deductionPercentage: AuditFlag;
  yearOverYear: AuditFlag;
}

const LocalAuditCenter: React.FC = () => {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    try {
      const auditReport: AuditReport = {
        incomeMismatch: await checkIncomeMismatch(),
        roundNumbers: await checkRoundNumbers(),
        deductionPercentage: await checkDeductionPercentage(),
        yearOverYear: await checkYearOverYear(),
      };
      setReport(auditReport);
    } catch (error) {
      console.error('Audit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIncomeMismatch = async (): Promise<AuditFlag> => {
    try {
      // Get all income documents from TaxIntakeApp (checklist)
      const checklist = await db.taxChecklist.getItem<any[]>('main-checklist') || [];
      const foundIncomeDocs = checklist.filter(
        item => item.found && ['W-2', '1099-INT', '1099-DIV', '1099-B'].includes(item.formType)
      );

      // Get all income used in TaxCalculatorApp (taxData)
      const taxDataKeys = await db.taxData.keys();
      const usedIncomeDocs: string[] = [];
      const missingDocs: string[] = [];

      for (const key of taxDataKeys) {
        const doc = await db.taxData.getItem<any>(key);
        if (doc && doc.detectedForms) {
          usedIncomeDocs.push(...doc.detectedForms);
        }
      }

      // Check if all found income docs are used
      for (const doc of foundIncomeDocs) {
        const isUsed = usedIncomeDocs.some(used =>
          used === doc.formType && doc.files.length > 0
        );
        if (!isUsed) {
          missingDocs.push(`${doc.formType}: ${doc.description}`);
        }
      }

      if (missingDocs.length === 0) {
        return {
          type: 'pass',
          title: 'Income Mismatch Scan',
          message: `All ${foundIncomeDocs.length} income documents from your TaxIntakeApp are included in your tax calculation.`,
        };
      } else if (missingDocs.length <= 2) {
        return {
          type: 'yellow',
          title: 'Income Mismatch Scan',
          message: `Found ${missingDocs.length} income document(s) that may not be included in your calculation.`,
          details: missingDocs,
        };
      } else {
        return {
          type: 'red',
          title: 'Income Mismatch Scan',
          message: `⚠️ CRITICAL: ${missingDocs.length} income documents are marked as found but not included in calculation. You may be under-reporting income.`,
          details: missingDocs,
        };
      }
    } catch (error) {
      return {
        type: 'yellow',
        title: 'Income Mismatch Scan',
        message: 'Unable to complete scan. Ensure you have scanned documents and run the tax calculator.',
      };
    }
  };

  const checkRoundNumbers = async (): Promise<AuditFlag> => {
    try {
      const transactionKeys = await db.transactions.keys();
      const roundNumberTransactions: any[] = [];

      for (const key of transactionKeys) {
        const tx = await db.transactions.getItem<any>(key);
        if (tx && tx.amount < 0) { // Only check expenses
          const amount = Math.abs(tx.amount);
          // Check if it's a "suspiciously round" number
          const isRound =
            amount >= 100 &&
            (amount % 100 === 0 || amount % 500 === 0 || amount % 1000 === 0);

          if (isRound && ['Charitable Donations', 'Business Expense', 'Medical Expenses'].includes(tx.category)) {
            roundNumberTransactions.push({
              date: tx.date,
              description: tx.description,
              amount: amount,
              category: tx.category,
            });
          }
        }
      }

      if (roundNumberTransactions.length === 0) {
        return {
          type: 'pass',
          title: 'Round Number Scan',
          message: 'No suspicious round-number deductions detected.',
        };
      } else if (roundNumberTransactions.length <= 3) {
        return {
          type: 'yellow',
          title: 'Round Number Scan',
          message: `Found ${roundNumberTransactions.length} transactions with "round numbers" (e.g., $500.00, $1,200.00). The IRS AI may flag these as suspicious.`,
          details: roundNumberTransactions.map(tx =>
            `${tx.date}: ${tx.description} - $${tx.amount.toFixed(2)} (${tx.category})`
          ),
        };
      } else {
        return {
          type: 'red',
          title: 'Round Number Scan',
          message: `⚠️ ALERT: Found ${roundNumberTransactions.length} transactions with suspiciously round numbers. This pattern is a known IRS red flag.`,
          details: roundNumberTransactions.map(tx =>
            `${tx.date}: ${tx.description} - $${tx.amount.toFixed(2)} (${tx.category})`
          ),
        };
      }
    } catch (error) {
      return {
        type: 'yellow',
        title: 'Round Number Scan',
        message: 'Unable to complete scan. Ensure you have transaction data.',
      };
    }
  };

  const checkDeductionPercentage = async (): Promise<AuditFlag> => {
    try {
      // Calculate total income
      const taxDataKeys = await db.taxData.keys();
      let totalIncome = 0;

      for (const key of taxDataKeys) {
        const doc = await db.taxData.getItem<any>(key);
        if (doc && doc.extractedData) {
          if (doc.extractedData['W-2']) {
            totalIncome += parseFloat(doc.extractedData['W-2']['Wages, tips, other comp']?.replace(/[^0-9.-]+/g, '') || '0');
          }
          if (doc.extractedData['1099-INT']) {
            totalIncome += parseFloat(doc.extractedData['1099-INT']['Interest income']?.replace(/[^0-9.-]+/g, '') || '0');
          }
        }
      }

      if (totalIncome === 0) {
        return {
          type: 'yellow',
          title: 'Deduction Percentage Scan',
          message: 'No income data found. Run the Tax Calculator first.',
        };
      }

      // Calculate deductions by category
      const transactionKeys = await db.transactions.keys();
      const deductionsByCategory: { [key: string]: number } = {};

      for (const key of transactionKeys) {
        const tx = await db.transactions.getItem<any>(key);
        if (tx && tx.amount < 0) {
          const category = tx.category || 'Uncategorized';
          if (['Charitable Donations', 'Medical Expenses', 'Business Expense', 'Education'].includes(category)) {
            deductionsByCategory[category] = (deductionsByCategory[category] || 0) + Math.abs(tx.amount);
          }
        }
      }

      // IRS average deduction percentages (rough estimates)
      const avgPercentages: { [key: string]: number } = {
        'Charitable Donations': 3.0, // Average 2-3%
        'Medical Expenses': 5.0, // Average 3-5%
        'Business Expense': 10.0, // Highly variable
        'Education': 2.0, // Average 1-2%
      };

      const warnings: string[] = [];
      const severe: string[] = [];

      for (const [category, amount] of Object.entries(deductionsByCategory)) {
        const percentage = (amount / totalIncome) * 100;
        const avgPercentage = avgPercentages[category] || 5;

        if (percentage > avgPercentage * 2) {
          // More than 2x the average
          severe.push(
            `${category}: $${amount.toFixed(2)} (${percentage.toFixed(1)}% of income) - Significantly higher than ${avgPercentage}% average`
          );
        } else if (percentage > avgPercentage * 1.5) {
          // More than 1.5x the average
          warnings.push(
            `${category}: $${amount.toFixed(2)} (${percentage.toFixed(1)}% of income) - Higher than ${avgPercentage}% average`
          );
        }
      }

      if (severe.length === 0 && warnings.length === 0) {
        return {
          type: 'pass',
          title: 'Deduction Percentage Scan',
          message: 'Your deductions are within normal ranges compared to your income.',
        };
      } else if (severe.length > 0) {
        return {
          type: 'red',
          title: 'Deduction Percentage Scan',
          message: `⚠️ CRITICAL: ${severe.length} deduction category(ies) are significantly higher than average. Ensure you have "bulletproof documentation".`,
          details: [...severe, ...warnings],
        };
      } else {
        return {
          type: 'yellow',
          title: 'Deduction Percentage Scan',
          message: `${warnings.length} deduction category(ies) are higher than average. Review your documentation.`,
          details: warnings,
        };
      }
    } catch (error) {
      return {
        type: 'yellow',
        title: 'Deduction Percentage Scan',
        message: 'Unable to complete scan. Ensure you have income and transaction data.',
      };
    }
  };

  const checkYearOverYear = async (): Promise<AuditFlag> => {
    // Future feature
    return {
      type: 'yellow',
      title: 'Year-Over-Year Scan',
      message: '(Future Feature) Checking for sudden changes in income or deductions compared to previous years...',
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-200 mb-2 flex items-center gap-3">
              <FaShieldAlt className="text-blue-400" />
              Local Audit Center
            </h2>
            <p className="text-sm text-gray-400">
              Run IRS-style checks on your data before you file
            </p>
          </div>
          <button
            onClick={runAudit}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors"
          >
            <FaPlay />
            {loading ? 'Running Audit...' : 'Run Audit'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {!report ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FaShieldAlt className="text-6xl mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Pre-Audit Defense System</h3>
            <p className="text-center max-w-md mb-6">
              In the age of AI audits, documentation is everything. This tool runs the IRS's own
              playbook against your data to find red flags before you file.
            </p>
            <p className="text-sm text-center max-w-lg text-gray-600">
              Make sure you've: (1) Scanned documents with DocumentAgent, (2) Marked forms in TaxIntakeApp,
              and (3) Run the TaxCalculatorApp
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Audit Report Header */}
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-700">
              <h3 className="text-2xl font-bold text-white mb-2">Audit Report Complete</h3>
              <p className="text-gray-300 text-sm">
                Scanned your local data for IRS red flags. Review each section below.
              </p>
            </div>

            {/* Income Mismatch Scan */}
            <AuditFlagCard flag={report.incomeMismatch} />

            {/* Round Number Scan */}
            <AuditFlagCard flag={report.roundNumbers} />

            {/* Deduction Percentage Scan */}
            <AuditFlagCard flag={report.deductionPercentage} />

            {/* Year-Over-Year Scan */}
            <AuditFlagCard flag={report.yearOverYear} />

            {/* Summary */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-700">
                  <div className="text-3xl font-bold text-green-400">
                    {Object.values(report).filter(f => f.type === 'pass').length}
                  </div>
                  <div className="text-sm text-gray-400">Passed Checks</div>
                </div>
                <div className="text-center p-4 bg-yellow-900/20 rounded-lg border border-yellow-700">
                  <div className="text-3xl font-bold text-yellow-400">
                    {Object.values(report).filter(f => f.type === 'yellow').length}
                  </div>
                  <div className="text-sm text-gray-400">Yellow Flags</div>
                </div>
                <div className="text-center p-4 bg-red-900/20 rounded-lg border border-red-700">
                  <div className="text-3xl font-bold text-red-400">
                    {Object.values(report).filter(f => f.type === 'red').length}
                  </div>
                  <div className="text-sm text-gray-400">Red Flags</div>
                </div>
              </div>
              <div className="mt-6 text-center">
                {Object.values(report).some(f => f.type === 'red') ? (
                  <p className="text-red-400 font-semibold">
                    ⚠️ Critical issues detected. Address red flags before filing.
                  </p>
                ) : Object.values(report).some(f => f.type === 'yellow') ? (
                  <p className="text-yellow-400 font-semibold">
                    ⚠️ Minor issues detected. Review yellow flags for accuracy.
                  </p>
                ) : (
                  <p className="text-green-400 font-semibold">
                    ✓ All checks passed. Your data looks good!
                  </p>
                )}
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <strong>Recommendation:</strong> Save this audit report and keep it with your tax records.
                If you address any red or yellow flags, run the audit again to verify.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Audit Flag Card Component
const AuditFlagCard: React.FC<{ flag: AuditFlag }> = ({ flag }) => {
  const getIcon = () => {
    switch (flag.type) {
      case 'pass':
        return <FaCheckCircle className="text-green-400 text-2xl" />;
      case 'yellow':
        return <FaExclamationTriangle className="text-yellow-400 text-2xl" />;
      case 'red':
        return <FaTimesCircle className="text-red-400 text-2xl" />;
    }
  };

  const getBorderColor = () => {
    switch (flag.type) {
      case 'pass':
        return 'border-green-700';
      case 'yellow':
        return 'border-yellow-700';
      case 'red':
        return 'border-red-700';
    }
  };

  const getBgColor = () => {
    switch (flag.type) {
      case 'pass':
        return 'bg-green-900/20';
      case 'yellow':
        return 'bg-yellow-900/20';
      case 'red':
        return 'bg-red-900/20';
    }
  };

  return (
    <div className={`rounded-lg p-5 border ${getBorderColor()} ${getBgColor()}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">{getIcon()}</div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-200 mb-2">{flag.title}</h4>
          <p className="text-sm text-gray-300 mb-3">{flag.message}</p>
          {flag.details && flag.details.length > 0 && (
            <div className="bg-black/30 rounded-lg p-3 mt-3">
              <div className="text-xs text-gray-400 font-semibold mb-2">Details:</div>
              <ul className="space-y-1">
                {flag.details.map((detail, idx) => (
                  <li key={idx} className="text-xs text-gray-300 pl-4">
                    • {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocalAuditCenter;
