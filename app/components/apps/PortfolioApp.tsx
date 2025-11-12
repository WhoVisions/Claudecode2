'use client';

import React, { useState, useEffect } from 'react';
import { db, Portfolio, Holding, HoldingTransaction, calculateHoldingMetrics, calculatePortfolioMetrics } from '@/app/lib/db';
import { FaPlus, FaEdit, FaTrash, FaChartPie, FaArrowUp, FaArrowDown, FaExchangeAlt, FaBriefcase } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TransactionModal } from './TransactionModal';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const PortfolioApp: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [showHoldingForm, setShowHoldingForm] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
  const [transactionModal, setTransactionModal] = useState<{
    holding: Holding;
    type: 'buy' | 'sell';
  } | null>(null);

  const [portfolioForm, setPortfolioForm] = useState({
    name: '',
    description: '',
    cashBalance: '0',
    currency: 'USD',
  });

  const [holdingForm, setHoldingForm] = useState({
    symbol: '',
    name: '',
    type: 'stock' as Holding['type'],
    quantity: '',
    averageCostBasis: '',
    currentPrice: '',
    currency: 'USD',
    notes: '',
  });

  useEffect(() => {
    loadPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolioId) {
      loadHoldings(selectedPortfolioId);
    }
  }, [selectedPortfolioId]);

  const loadPortfolios = async () => {
    const keys = await db.portfolios.keys();
    const portfoliosData: Portfolio[] = [];
    for (const key of keys) {
      const item = await db.portfolios.getItem<Portfolio>(key);
      if (item) {
        // Recalculate metrics
        const metrics = await calculatePortfolioMetrics(item.id);
        const updatedPortfolio = { ...item, ...metrics };
        portfoliosData.push(updatedPortfolio);
      }
    }
    setPortfolios(portfoliosData);

    // Auto-select first portfolio if none selected
    if (!selectedPortfolioId && portfoliosData.length > 0) {
      setSelectedPortfolioId(portfoliosData[0].id);
    }
  };

  const loadHoldings = async (portfolioId: string) => {
    const keys = await db.holdings.keys();
    const holdingsData: Holding[] = [];
    for (const key of keys) {
      const item = await db.holdings.getItem<Holding>(key);
      if (item && item.portfolioId === portfolioId) {
        holdingsData.push(calculateHoldingMetrics(item));
      }
    }
    setHoldings(holdingsData);
  };

  const handlePortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date().toISOString();
    const portfolio: Portfolio = {
      id: editingPortfolioId || `portfolio-${Date.now()}`,
      name: portfolioForm.name,
      description: portfolioForm.description,
      cashBalance: parseFloat(portfolioForm.cashBalance) || 0,
      currency: portfolioForm.currency,
      totalValue: 0,
      totalCost: 0,
      totalGain: 0,
      totalGainPercent: 0,
      createdAt: editingPortfolioId ? portfolios.find(p => p.id === editingPortfolioId)!.createdAt : now,
      updatedAt: now,
    };

    await db.portfolios.setItem(portfolio.id, portfolio);
    await loadPortfolios();
    resetPortfolioForm();

    if (!selectedPortfolioId) {
      setSelectedPortfolioId(portfolio.id);
    }
  };

  const handleHoldingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPortfolioId) return;

    const now = new Date().toISOString();
    const holding: Holding = {
      id: editingHoldingId || `holding-${Date.now()}`,
      portfolioId: selectedPortfolioId,
      symbol: holdingForm.symbol.toUpperCase(),
      name: holdingForm.name,
      type: holdingForm.type,
      quantity: parseFloat(holdingForm.quantity) || 0,
      averageCostBasis: parseFloat(holdingForm.averageCostBasis) || 0,
      currentPrice: parseFloat(holdingForm.currentPrice) || 0,
      currency: holdingForm.currency,
      totalCost: 0,
      currentValue: 0,
      unrealizedGain: 0,
      unrealizedGainPercent: 0,
      notes: holdingForm.notes,
      lastPriceUpdate: now,
      createdAt: editingHoldingId ? holdings.find(h => h.id === editingHoldingId)!.createdAt : now,
      updatedAt: now,
    };

    const calculatedHolding = calculateHoldingMetrics(holding);
    await db.holdings.setItem(calculatedHolding.id, calculatedHolding);

    // Update portfolio metrics
    const metrics = await calculatePortfolioMetrics(selectedPortfolioId);
    const portfolio = portfolios.find(p => p.id === selectedPortfolioId);
    if (portfolio) {
      await db.portfolios.setItem(portfolio.id, { ...portfolio, ...metrics, updatedAt: now });
    }

    await loadHoldings(selectedPortfolioId);
    await loadPortfolios();
    resetHoldingForm();
  };

  const handleEditPortfolio = (portfolio: Portfolio) => {
    setPortfolioForm({
      name: portfolio.name,
      description: portfolio.description || '',
      cashBalance: portfolio.cashBalance.toString(),
      currency: portfolio.currency,
    });
    setEditingPortfolioId(portfolio.id);
    setShowPortfolioForm(true);
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('Are you sure you want to delete this portfolio? All holdings will also be deleted.')) return;

    // Delete all holdings in this portfolio
    const keys = await db.holdings.keys();
    for (const key of keys) {
      const holding = await db.holdings.getItem<Holding>(key);
      if (holding && holding.portfolioId === id) {
        await db.holdings.removeItem(key);
      }
    }

    await db.portfolios.removeItem(id);
    await loadPortfolios();

    if (selectedPortfolioId === id) {
      setSelectedPortfolioId(portfolios[0]?.id || null);
    }
  };

  const handleEditHolding = (holding: Holding) => {
    setHoldingForm({
      symbol: holding.symbol,
      name: holding.name,
      type: holding.type,
      quantity: holding.quantity.toString(),
      averageCostBasis: holding.averageCostBasis.toString(),
      currentPrice: holding.currentPrice.toString(),
      currency: holding.currency,
      notes: holding.notes || '',
    });
    setEditingHoldingId(holding.id);
    setShowHoldingForm(true);
  };

  const handleDeleteHolding = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holding?')) return;

    await db.holdings.removeItem(id);

    if (selectedPortfolioId) {
      const metrics = await calculatePortfolioMetrics(selectedPortfolioId);
      const portfolio = portfolios.find(p => p.id === selectedPortfolioId);
      if (portfolio) {
        await db.portfolios.setItem(portfolio.id, { ...portfolio, ...metrics, updatedAt: new Date().toISOString() });
      }
      await loadHoldings(selectedPortfolioId);
      await loadPortfolios();
    }
  };

  const resetPortfolioForm = () => {
    setPortfolioForm({
      name: '',
      description: '',
      cashBalance: '0',
      currency: 'USD',
    });
    setEditingPortfolioId(null);
    setShowPortfolioForm(false);
  };

  const resetHoldingForm = () => {
    setHoldingForm({
      symbol: '',
      name: '',
      type: 'stock',
      quantity: '',
      averageCostBasis: '',
      currentPrice: '',
      currency: 'USD',
      notes: '',
    });
    setEditingHoldingId(null);
    setShowHoldingForm(false);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);

  // Prepare pie chart data
  const pieChartData = holdings.map((holding, index) => ({
    name: holding.symbol,
    value: holding.currentValue,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-200">Investment Portfolio</h2>
            <p className="text-xs text-gray-400">{portfolios.length} portfolios</p>
          </div>
          <button
            onClick={() => setShowPortfolioForm(!showPortfolioForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <FaPlus />
            New Portfolio
          </button>
        </div>
      </div>

      {/* Portfolio Form */}
      {showPortfolioForm && (
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <form onSubmit={handlePortfolioSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Portfolio Name</label>
                <input
                  type="text"
                  value={portfolioForm.name}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  placeholder="e.g., Retirement Account"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cash Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={portfolioForm.cashBalance}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, cashBalance: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={portfolioForm.description}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                placeholder="Optional notes about this portfolio"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors text-sm"
              >
                {editingPortfolioId ? 'Update Portfolio' : 'Create Portfolio'}
              </button>
              <button
                type="button"
                onClick={resetPortfolioForm}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {portfolios.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <FaBriefcase className="text-4xl mb-2" />
          <p>No portfolios yet</p>
          <p className="text-sm">Click "New Portfolio" to get started</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* Portfolio Selector */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center gap-4 overflow-x-auto">
              {portfolios.map((portfolio) => (
                <button
                  key={portfolio.id}
                  onClick={() => setSelectedPortfolioId(portfolio.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all ${
                    selectedPortfolioId === portfolio.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium">{portfolio.name}</div>
                  <div className="text-xs opacity-80">{formatCurrency(portfolio.totalValue + portfolio.cashBalance)}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedPortfolio && (
            <>
              {/* Portfolio Summary */}
              <div className="bg-gray-800 border-b border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-200">{selectedPortfolio.name}</h3>
                    {selectedPortfolio.description && (
                      <p className="text-sm text-gray-400 mt-1">{selectedPortfolio.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPortfolio(selectedPortfolio)}
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                      title="Edit portfolio"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeletePortfolio(selectedPortfolio.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete portfolio"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Value</div>
                    <div className="text-xl font-bold text-blue-400">
                      {formatCurrency(selectedPortfolio.totalValue + selectedPortfolio.cashBalance)}
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Gain/Loss</div>
                    <div className={`text-xl font-bold ${selectedPortfolio.totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedPortfolio.totalGain >= 0 ? '+' : ''}
                      {formatCurrency(selectedPortfolio.totalGain)}
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1">Return %</div>
                    <div className={`text-xl font-bold ${selectedPortfolio.totalGainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedPortfolio.totalGainPercent >= 0 ? '+' : ''}
                      {selectedPortfolio.totalGainPercent.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1">Cash Balance</div>
                    <div className="text-xl font-bold text-gray-200">
                      {formatCurrency(selectedPortfolio.cashBalance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Holdings Section */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-200">Holdings ({holdings.length})</h3>
                  <button
                    onClick={() => setShowHoldingForm(!showHoldingForm)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <FaPlus />
                    Add Holding
                  </button>
                </div>

                {/* Holding Form */}
                {showHoldingForm && (
                  <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
                    <form onSubmit={handleHoldingSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Symbol/Ticker</label>
                          <input
                            type="text"
                            value={holdingForm.symbol}
                            onChange={(e) => setHoldingForm({ ...holdingForm, symbol: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                            placeholder="e.g., AAPL"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                          <input
                            type="text"
                            value={holdingForm.name}
                            onChange={(e) => setHoldingForm({ ...holdingForm, name: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                            placeholder="e.g., Apple Inc."
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                          <select
                            value={holdingForm.type}
                            onChange={(e) => setHoldingForm({ ...holdingForm, type: e.target.value as Holding['type'] })}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                          >
                            <option value="stock">Stock</option>
                            <option value="etf">ETF</option>
                            <option value="mutual-fund">Mutual Fund</option>
                            <option value="crypto">Crypto</option>
                            <option value="bond">Bond</option>
                            <option value="commodity">Commodity</option>
                            <option value="real-estate">Real Estate</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
                          <input
                            type="number"
                            step="0.00000001"
                            value={holdingForm.quantity}
                            onChange={(e) => setHoldingForm({ ...holdingForm, quantity: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                            placeholder="0"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Avg Cost Basis</label>
                          <input
                            type="number"
                            step="0.01"
                            value={holdingForm.averageCostBasis}
                            onChange={(e) => setHoldingForm({ ...holdingForm, averageCostBasis: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Current Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={holdingForm.currentPrice}
                            onChange={(e) => setHoldingForm({ ...holdingForm, currentPrice: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                        <textarea
                          value={holdingForm.notes}
                          onChange={(e) => setHoldingForm({ ...holdingForm, notes: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
                          placeholder="Optional notes"
                          rows={2}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors text-sm"
                        >
                          {editingHoldingId ? 'Update Holding' : 'Add Holding'}
                        </button>
                        <button
                          type="button"
                          onClick={resetHoldingForm}
                          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {holdings.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FaChartPie className="text-3xl mx-auto mb-2 opacity-50" />
                    <p>No holdings yet</p>
                    <p className="text-sm">Click "Add Holding" to start tracking investments</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Holdings List */}
                    <div className="lg:col-span-2 space-y-3">
                      {holdings.map((holding) => (
                        <div
                          key={holding.id}
                          className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-lg font-bold text-gray-200">{holding.symbol}</h4>
                                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                  {holding.type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 mb-3">{holding.name}</p>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <div className="text-xs text-gray-500">Quantity</div>
                                  <div className="text-gray-200 font-medium">{holding.quantity.toFixed(4)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Avg Cost</div>
                                  <div className="text-gray-200 font-medium">{formatCurrency(holding.averageCostBasis)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Current Price</div>
                                  <div className="text-gray-200 font-medium">{formatCurrency(holding.currentPrice)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Total Value</div>
                                  <div className="text-blue-400 font-bold">{formatCurrency(holding.currentValue)}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-700">
                                <div>
                                  <div className="text-xs text-gray-500">Gain/Loss</div>
                                  <div className={`font-bold ${holding.unrealizedGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {holding.unrealizedGain >= 0 ? '+' : ''}
                                    {formatCurrency(holding.unrealizedGain)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Return %</div>
                                  <div className={`font-bold ${holding.unrealizedGainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {holding.unrealizedGainPercent >= 0 ? '+' : ''}
                                    {holding.unrealizedGainPercent.toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <button
                                onClick={() => setTransactionModal({ holding, type: 'buy' })}
                                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs transition-colors"
                                title="Buy more shares"
                              >
                                <FaArrowUp /> Buy
                              </button>
                              <button
                                onClick={() => setTransactionModal({ holding, type: 'sell' })}
                                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs transition-colors"
                                title="Sell shares"
                              >
                                <FaArrowDown /> Sell
                              </button>
                              <button
                                onClick={() => handleEditHolding(holding)}
                                className="text-gray-400 hover:text-blue-400 transition-colors p-2"
                                title="Edit holding"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteHolding(holding.id)}
                                className="text-gray-400 hover:text-red-400 transition-colors p-2"
                                title="Delete holding"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Asset Allocation Chart */}
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-200 mb-4">Asset Allocation</h4>
                      {pieChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(1)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
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
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                          No data
                        </div>
                      )}

                      {/* Type Breakdown */}
                      <div className="mt-4 space-y-2">
                        {Array.from(new Set(holdings.map(h => h.type))).map(type => {
                          const typeHoldings = holdings.filter(h => h.type === type);
                          const typeValue = typeHoldings.reduce((sum, h) => sum + h.currentValue, 0);
                          const typePercent = selectedPortfolio.totalValue > 0
                            ? (typeValue / selectedPortfolio.totalValue) * 100
                            : 0;
                          return (
                            <div key={type} className="text-xs">
                              <div className="flex justify-between text-gray-400 mb-1">
                                <span className="capitalize">{type}</span>
                                <span>{typePercent.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: `${typePercent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Transaction Modal */}
      {transactionModal && (
        <TransactionModal
          holding={transactionModal.holding}
          transactionType={transactionModal.type}
          onClose={() => setTransactionModal(null)}
          onSuccess={() => {
            setTransactionModal(null);
            if (selectedPortfolioId) {
              loadHoldings(selectedPortfolioId);
              loadPortfolios();
            }
          }}
        />
      )}
    </div>
  );
};

export default PortfolioApp;
