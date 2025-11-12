'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/app/lib/db';
import { FaCheckCircle, FaTimesCircle, FaExclamationCircle } from 'react-icons/fa';

export interface TaxChecklistItem {
  id: string;
  formType: string;
  description: string;
  required: boolean;
  found: boolean;
  files: string[];
  extractedData?: any;
}

const DEFAULT_CHECKLIST: TaxChecklistItem[] = [
  { id: 'w2-primary', formType: 'W-2', description: 'Primary Job W-2', required: true, found: false, files: [] },
  { id: 'w2-secondary', formType: 'W-2', description: 'Secondary Job W-2 (if applicable)', required: false, found: false, files: [] },
  { id: '1099-int-savings', formType: '1099-INT', description: 'Savings Account Interest', required: true, found: false, files: [] },
  { id: '1099-div-investments', formType: '1099-DIV', description: 'Investment Dividends', required: false, found: false, files: [] },
  { id: '1099-b-stocks', formType: '1099-B', description: 'Stock Sales', required: false, found: false, files: [] },
  { id: '1098-mortgage', formType: '1098', description: 'Mortgage Interest', required: false, found: false, files: [] },
  { id: 'crypto-transactions', formType: 'Crypto', description: 'Cryptocurrency Transactions', required: false, found: false, files: [] },
  { id: 'charitable-donations', formType: 'Receipts', description: 'Charitable Donation Receipts', required: false, found: false, files: [] },
];

const TaxIntakeApp: React.FC = () => {
  const [checklist, setChecklist] = useState<TaxChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklist();
  }, []);

  const loadChecklist = async () => {
    try {
      const storedChecklist = await db.taxChecklist.getItem<TaxChecklistItem[]>('main-checklist');
      if (storedChecklist && Array.isArray(storedChecklist)) {
        setChecklist(storedChecklist);
      } else {
        // Initialize with default checklist
        await db.taxChecklist.setItem('main-checklist', DEFAULT_CHECKLIST);
        setChecklist(DEFAULT_CHECKLIST);
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
      setChecklist(DEFAULT_CHECKLIST);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemFound = async (id: string) => {
    const updatedChecklist = checklist.map(item =>
      item.id === id ? { ...item, found: !item.found } : item
    );
    setChecklist(updatedChecklist);
    await db.taxChecklist.setItem('main-checklist', updatedChecklist);
  };

  const requiredItems = checklist.filter(item => item.required);
  const requiredFound = requiredItems.filter(item => item.found).length;
  const requiredTotal = requiredItems.length;
  const completionPercent = requiredTotal > 0 ? (requiredFound / requiredTotal) * 100 : 0;

  const optionalItems = checklist.filter(item => !item.required);
  const optionalFound = optionalItems.filter(item => item.found).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">Loading checklist...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Tax Document Intake</h2>
        <p className="text-sm text-gray-400">Track your tax documents and ensure nothing is missing</p>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Required Documents</span>
            <span>{requiredFound} / {requiredTotal} ({completionPercent.toFixed(0)}%)</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                completionPercent === 100
                  ? 'bg-green-500'
                  : completionPercent >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="flex-1 overflow-auto p-6">
        {/* Required Items */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Required Documents</h3>
          <div className="space-y-3">
            {requiredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-gray-800 rounded-lg p-4 border ${
                  item.found
                    ? 'border-green-700 bg-green-900/20'
                    : 'border-red-700 bg-red-900/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {item.found ? (
                        <FaCheckCircle className="text-green-400 text-xl" />
                      ) : (
                        <FaTimesCircle className="text-red-400 text-xl" />
                      )}
                      <div>
                        <h4 className="text-base font-semibold text-gray-200">{item.description}</h4>
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {item.formType}
                        </span>
                      </div>
                    </div>

                    {item.files.length > 0 && (
                      <div className="ml-9 text-sm text-gray-400">
                        <div className="font-medium mb-1">Files:</div>
                        <ul className="list-disc list-inside">
                          {item.files.map((file, idx) => (
                            <li key={idx} className="truncate">{file}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleItemFound(item.id)}
                    className={`px-4 py-2 rounded transition-colors ${
                      item.found
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {item.found ? 'Mark Missing' : 'Mark Found'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optional Items */}
        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            Optional Documents
            <span className="text-sm text-gray-400 ml-2">
              ({optionalFound} found)
            </span>
          </h3>
          <div className="space-y-3">
            {optionalItems.map((item) => (
              <div
                key={item.id}
                className={`bg-gray-800 rounded-lg p-4 border ${
                  item.found
                    ? 'border-blue-700 bg-blue-900/20'
                    : 'border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {item.found ? (
                        <FaCheckCircle className="text-blue-400 text-xl" />
                      ) : (
                        <FaExclamationCircle className="text-gray-500 text-xl" />
                      )}
                      <div>
                        <h4 className="text-base font-semibold text-gray-200">{item.description}</h4>
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {item.formType}
                        </span>
                      </div>
                    </div>

                    {item.files.length > 0 && (
                      <div className="ml-9 text-sm text-gray-400">
                        <div className="font-medium mb-1">Files:</div>
                        <ul className="list-disc list-inside">
                          {item.files.map((file, idx) => (
                            <li key={idx} className="truncate">{file}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleItemFound(item.id)}
                    className={`px-4 py-2 rounded transition-colors ${
                      item.found
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {item.found ? 'Mark Missing' : 'Mark Found'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{requiredFound}</div>
              <div className="text-sm text-gray-400">Required Found</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{requiredTotal - requiredFound}</div>
              <div className="text-sm text-gray-400">Required Missing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{optionalFound}</div>
              <div className="text-sm text-gray-400">Optional Found</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxIntakeApp;
