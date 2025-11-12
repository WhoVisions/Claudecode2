'use client';

import React, { useState, useEffect } from 'react';
import StorageManager from '@/app/lib/storage';
import { Transaction, Account, Category, TransactionType } from '@/app/types/financial';
import { FaPlus, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');

  // Form state
  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    sourceAccountId: '',
    destinationAccountId: '',
    categoryId: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTransactions(StorageManager.getTransactions());
    setAccounts(StorageManager.getAccounts());
    setCategories(StorageManager.getCategories());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const transaction: Transaction = {
      id: `txn-${Date.now()}`,
      type: formData.type,
      amount: parseFloat(formData.amount),
      currency: 'USD',
      description: formData.description,
      date: new Date(formData.date),
      sourceAccountId: formData.sourceAccountId || undefined,
      destinationAccountId: formData.destinationAccountId || undefined,
      categoryId: formData.categoryId || undefined,
      notes: formData.notes || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    StorageManager.addTransaction(transaction);
    loadData();
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      StorageManager.deleteTransaction(id);
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      sourceAccountId: '',
      destinationAccountId: '',
      categoryId: '',
      notes: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredTransactions = transactions.filter((t) =>
    filterType === 'all' ? true : t.type === filterType
  );

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    return categories.find((c) => c.id === categoryId)?.name || 'Unknown';
  };

  const getAccountName = (accountId?: string) => {
    if (!accountId) return 'Unknown';
    return accounts.find((a) => a.id === accountId)?.name || 'Unknown';
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-200">Transactions</h2>
          <p className="text-xs text-gray-400">{transactions.length} total transactions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
        >
          <FaPlus />
          New Transaction
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  placeholder="e.g., Grocery shopping"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                >
                  <option value="">Select category</option>
                  {categories
                    .filter((c) =>
                      formData.type === 'income' ? c.type === 'income' : c.type === 'expense'
                    )
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Account Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(formData.type === 'expense' || formData.type === 'transfer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    From Account
                  </label>
                  <select
                    value={formData.sourceAccountId}
                    onChange={(e) => setFormData({ ...formData, sourceAccountId: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({formatCurrency(account.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(formData.type === 'income' || formData.type === 'transfer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    To Account
                  </label>
                  <select
                    value={formData.destinationAccountId}
                    onChange={(e) => setFormData({ ...formData, destinationAccountId: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({formatCurrency(account.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200 h-20"
                placeholder="Additional notes..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
              >
                Add Transaction
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
        <FaFilter className="text-gray-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-gray-200"
        >
          <option value="all">All Transactions</option>
          <option value="income">Income Only</option>
          <option value="expense">Expenses Only</option>
          <option value="transfer">Transfers Only</option>
        </select>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-auto p-4">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FaPlus className="text-4xl mb-2" />
            <p>No transactions yet</p>
            <p className="text-sm">Click "New Transaction" to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            transaction.type === 'income'
                              ? 'bg-green-900 text-green-300'
                              : transaction.type === 'expense'
                              ? 'bg-red-900 text-red-300'
                              : 'bg-blue-900 text-blue-300'
                          }`}
                        >
                          {transaction.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-lg font-semibold text-gray-200 mb-1">
                        {transaction.description}
                      </div>
                      <div className="text-sm text-gray-400">
                        {getCategoryName(transaction.categoryId)}
                        {transaction.sourceAccountId && (
                          <span> • From: {getAccountName(transaction.sourceAccountId)}</span>
                        )}
                        {transaction.destinationAccountId && (
                          <span> • To: {getAccountName(transaction.destinationAccountId)}</span>
                        )}
                      </div>
                      {transaction.notes && (
                        <div className="text-sm text-gray-500 mt-2">{transaction.notes}</div>
                      )}
                    </div>
                    <div className="flex items-start gap-3 ml-4">
                      <div
                        className={`text-xl font-bold ${
                          transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete transaction"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
