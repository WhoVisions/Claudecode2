'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StorageManager from '@/app/lib/storage';
import { DashboardStats } from '@/app/types/financial';
import { FaWallet, FaArrowUp, FaArrowDown, FaChartLine } from 'react-icons/fa';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const dashboardStats = StorageManager.getDashboardStats();
    setStats(dashboardStats);
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Prepare chart data
  const categoryChartData = stats.topCategories.map((cat) => ({
    name: cat.categoryName,
    value: cat.amount,
    percentage: cat.percentage.toFixed(1),
  }));

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

  const incomeExpenseData = [
    { name: 'Income', amount: stats.totalIncome, fill: '#10B981' },
    { name: 'Expenses', amount: stats.totalExpenses, fill: '#EF4444' },
  ];

  return (
    <div className="h-full overflow-auto p-6 bg-gray-900">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Financial Dashboard</h2>
        <p className="text-sm text-gray-400">Overview of your finances this month</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Net Income */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Net Income</div>
            <FaChartLine className="text-blue-400" />
          </div>
          <div className={`text-2xl font-bold ${stats.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(stats.netIncome)}
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Total Income</div>
            <FaArrowUp className="text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">
            {formatCurrency(stats.totalIncome)}
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Total Expenses</div>
            <FaArrowDown className="text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">
            {formatCurrency(stats.totalExpenses)}
          </div>
        </div>

        {/* Total Assets */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Total Assets</div>
            <FaWallet className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {formatCurrency(stats.totalAssets)}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={incomeExpenseData}>
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {incomeExpenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Categories Pie Chart */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Top Expense Categories</h3>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No expense data available
            </div>
          )}
        </div>
      </div>

      {/* Budget Overview */}
      {stats.totalBudget > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Budget Overview</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Budget</span>
              <span className="text-gray-200">{formatCurrency(stats.totalBudget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Spent</span>
              <span className="text-red-400">{formatCurrency(stats.budgetSpent)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (stats.budgetSpent / stats.totalBudget) * 100 > 90
                    ? 'bg-red-500'
                    : (stats.budgetSpent / stats.totalBudget) * 100 > 75
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min((stats.budgetSpent / stats.totalBudget) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Remaining</span>
              <span className="text-green-400">
                {formatCurrency(Math.max(0, stats.totalBudget - stats.budgetSpent))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Recent Transactions</h3>
        {stats.recentTransactions.length > 0 ? (
          <div className="space-y-2">
            {stats.recentTransactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gray-900 rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">
                    {transaction.description}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold ${
                    transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No transactions yet. Start tracking your finances!
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
