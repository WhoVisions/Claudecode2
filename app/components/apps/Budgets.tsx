'use client';

import React, { useState, useEffect } from 'react';
import StorageManager from '@/app/lib/storage';
import { Budget, Category } from '@/app/types/financial';
import { FaPlus, FaEdit, FaTrash, FaPiggyBank } from 'react-icons/fa';

const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: 'USD',
    period: 'monthly' as Budget['period'],
    categoryIds: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setBudgets(StorageManager.getBudgets());
    setCategories(StorageManager.getCategories().filter((c) => c.type === 'expense'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const budget: Budget = {
      id: editingId || `budget-${Date.now()}`,
      name: formData.name,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      period: formData.period,
      startDate: now,
      categoryIds: formData.categoryIds,
      spent: 0,
      remaining: parseFloat(formData.amount),
      createdAt: editingId ? budgets.find((b) => b.id === editingId)!.createdAt : now,
      updatedAt: now,
    };

    if (editingId) {
      const allBudgets = StorageManager.getBudgets();
      const index = allBudgets.findIndex((b) => b.id === editingId);
      if (index !== -1) {
        allBudgets[index] = budget;
        StorageManager.saveBudgets(allBudgets);
      }
    } else {
      StorageManager.addBudget(budget);
    }

    loadData();
    resetForm();
  };

  const handleEdit = (budget: Budget) => {
    setFormData({
      name: budget.name,
      amount: budget.amount.toString(),
      currency: budget.currency,
      period: budget.period,
      categoryIds: budget.categoryIds,
    });
    setEditingId(budget.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      const allBudgets = StorageManager.getBudgets().filter((b) => b.id !== id);
      StorageManager.saveBudgets(allBudgets);
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      currency: 'USD',
      period: 'monthly',
      categoryIds: [],
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

  const getBudgetProgress = (budget: Budget) => {
    const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
    return Math.min(percentage, 100);
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-200">Budgets</h2>
          <p className="text-xs text-gray-400">{budgets.length} active budgets</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
        >
          <FaPlus />
          {editingId ? 'Cancel Edit' : 'New Budget'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Budget Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  placeholder="e.g., Monthly Groceries"
                  required
                />
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

              {/* Period */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as Budget['period'] })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  required
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Apply to Categories
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded px-3 py-2 cursor-pointer hover:border-gray-600 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      className="rounded bg-gray-800 border-gray-600"
                    />
                    <span className="text-sm text-gray-200">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
              >
                {editingId ? 'Update Budget' : 'Create Budget'}
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

      {/* Budget List */}
      <div className="flex-1 overflow-auto p-4">
        {budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FaPiggyBank className="text-4xl mb-2" />
            <p>No budgets yet</p>
            <p className="text-sm">Click "New Budget" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((budget) => {
              const progress = getBudgetProgress(budget);
              const isOverBudget = budget.spent > budget.amount;

              return (
                <div
                  key={budget.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-200 mb-1">
                        {budget.name}
                      </h3>
                      <div className="text-sm text-gray-400 capitalize">
                        {budget.period} • {budget.categoryIds.length} categories
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                        title="Edit budget"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete budget"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isOverBudget
                            ? 'bg-red-500'
                            : progress > 75
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        {formatCurrency(budget.spent)} spent
                      </span>
                      <span className={isOverBudget ? 'text-red-400' : 'text-gray-400'}>
                        {formatCurrency(budget.amount)} budget
                      </span>
                    </div>
                  </div>

                  {/* Remaining */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                    <span className="text-sm text-gray-400">Remaining</span>
                    <span
                      className={`text-lg font-bold ${
                        budget.remaining < 0 ? 'text-red-400' : 'text-green-400'
                      }`}
                    >
                      {formatCurrency(budget.remaining)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Budgets;
