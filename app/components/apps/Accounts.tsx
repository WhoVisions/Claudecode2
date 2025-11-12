'use client';

import React, { useState, useEffect } from 'react';
import StorageManager from '@/app/lib/storage';
import { Account, AccountType } from '@/app/types/financial';
import { FaPlus, FaEdit, FaTrash, FaWallet, FaUniversity, FaMoneyBillWave } from 'react-icons/fa';

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'bank' as AccountType,
    currency: 'USD',
    balance: '',
    notes: '',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    setAccounts(StorageManager.getAccounts());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      StorageManager.updateAccount(editingId, {
        ...formData,
        balance: parseFloat(formData.balance),
      });
    } else {
      const account: Account = {
        id: `acc-${Date.now()}`,
        name: formData.name,
        type: formData.type,
        currency: formData.currency,
        balance: parseFloat(formData.balance),
        notes: formData.notes || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      StorageManager.addAccount(account);
    }

    loadAccounts();
    resetForm();
  };

  const handleEdit = (account: Account) => {
    setFormData({
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance.toString(),
      notes: account.notes || '',
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      StorageManager.deleteAccount(id);
      loadAccounts();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'bank',
      currency: 'USD',
      balance: '',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
      case 'asset':
        return <FaUniversity className="text-2xl text-blue-400" />;
      case 'cash':
        return <FaMoneyBillWave className="text-2xl text-green-400" />;
      default:
        return <FaWallet className="text-2xl text-gray-400" />;
    }
  };

  const getTotalBalance = () => {
    return accounts
      .filter((a) => a.type === 'asset' || a.type === 'bank' || a.type === 'cash')
      .reduce((sum, a) => sum + a.balance, 0);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-200">Accounts</h2>
          <p className="text-xs text-gray-400">
            Total Balance: {formatCurrency(getTotalBalance())}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
        >
          <FaPlus />
          {editingId ? 'Cancel Edit' : 'New Account'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  placeholder="e.g., Main Checking"
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Account Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  required
                >
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash</option>
                  <option value="asset">Asset</option>
                  <option value="expense">Expense Account</option>
                  <option value="revenue">Revenue Account</option>
                </select>
              </div>

              {/* Balance */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Initial Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  required
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
              </div>
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
                placeholder="Account description or notes..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
              >
                {editingId ? 'Update Account' : 'Add Account'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account List */}
      <div className="flex-1 overflow-auto p-4">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FaWallet className="text-4xl mb-2" />
            <p>No accounts yet</p>
            <p className="text-sm">Click "New Account" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  {getAccountIcon(account.type)}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(account)}
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                      title="Edit account"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete account"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-200 mb-1">
                  {account.name}
                </h3>

                <div className="text-sm text-gray-400 mb-3 capitalize">
                  {account.type}
                </div>

                <div className="text-2xl font-bold text-gray-100 mb-2">
                  {formatCurrency(account.balance)}
                </div>

                {account.notes && (
                  <div className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-2">
                    {account.notes}
                  </div>
                )}

                <div className="text-xs text-gray-600 mt-2">
                  Updated: {new Date(account.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounts;
