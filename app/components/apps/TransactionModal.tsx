// Helper component for PortfolioApp - Buy/Sell Modal
'use client';

import React, { useState } from 'react';
import { db, Holding, HoldingTransaction, CapitalGain, calculateFIFOCostBasis } from '@/app/lib/db';
import { FaTimes } from 'react-icons/fa';

interface TransactionModalProps {
  holding: Holding;
  transactionType: 'buy' | 'sell';
  onClose: () => void;
  onSuccess: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  holding,
  transactionType,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    pricePerShare: '',
    notes: '',
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      const quantity = parseFloat(form.quantity);
      const pricePerShare = parseFloat(form.pricePerShare);
      const totalAmount = quantity * pricePerShare;

      if (transactionType === 'sell' && quantity > holding.quantity) {
        setError(`Cannot sell ${quantity} shares. You only have ${holding.quantity} shares.`);
        setProcessing(false);
        return;
      }

      // Create holding transaction record
      const transaction: HoldingTransaction = {
        id: crypto.randomUUID(),
        holdingId: holding.id,
        type: transactionType,
        quantity,
        pricePerUnit: pricePerShare,
        totalAmount,
        currency: holding.currency,
        date: form.date,
        notes: form.notes,
        createdAt: new Date().toISOString(),
      };

      await db.holdingTransactions.setItem(transaction.id, transaction);

      if (transactionType === 'buy') {
        // Update holding: increase quantity, update average cost basis
        const newQuantity = holding.quantity + quantity;
        const newTotalCost = (holding.quantity * holding.averageCostBasis) + totalAmount;
        const newAverageCostBasis = newTotalCost / newQuantity;

        const updatedHolding: Holding = {
          ...holding,
          quantity: newQuantity,
          averageCostBasis: newAverageCostBasis,
          updatedAt: new Date().toISOString(),
        };

        await db.holdings.setItem(holding.id, updatedHolding);
      } else {
        // SELL: Calculate FIFO cost basis and create capital gain record
        const fifoResult = await calculateFIFOCostBasis(
          holding.portfolioId,
          holding.symbol,
          quantity,
          form.date
        );

        const proceeds = totalAmount;
        const realizedGain = proceeds - fifoResult.costBasis;

        // Create capital gain record
        const capitalGain: CapitalGain = {
          id: crypto.randomUUID(),
          portfolioId: holding.portfolioId,
          symbol: holding.symbol,
          saleDate: form.date,
          sharesSold: quantity,
          proceeds,
          costBasis: fifoResult.costBasis,
          realizedGain,
          gainType: fifoResult.gainType,
          purchaseDates: fifoResult.purchaseDates,
          notes: form.notes,
          createdAt: new Date().toISOString(),
        };

        await db.capitalGains.setItem(capitalGain.id, capitalGain);

        // Update holding: decrease quantity
        const newQuantity = holding.quantity - quantity;
        const updatedHolding: Holding = {
          ...holding,
          quantity: newQuantity,
          updatedAt: new Date().toISOString(),
        };

        await db.holdings.setItem(holding.id, updatedHolding);
      }

      onSuccess();
    } catch (err) {
      console.error('Transaction error:', err);
      setError('Failed to process transaction. Please try again.');
      setProcessing(false);
    }
  };

  const totalValue = (parseFloat(form.quantity) || 0) * (parseFloat(form.pricePerShare) || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-200">
            {transactionType === 'buy' ? 'Buy' : 'Sell'} {holding.symbol}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded p-3 mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Quantity (Shares)</label>
            <input
              type="number"
              step="0.00000001"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
              placeholder="0"
              required
            />
            {transactionType === 'sell' && (
              <div className="text-xs text-gray-500 mt-1">
                Available: {holding.quantity.toFixed(8)} shares
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Price Per Share</label>
            <input
              type="number"
              step="0.01"
              value={form.pricePerShare}
              onChange={(e) => setForm({ ...form, pricePerShare: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
              placeholder="0.00"
              required
            />
          </div>

          <div className="bg-gray-900 rounded p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Value:</span>
              <span className="text-gray-200 font-semibold">
                ${totalValue.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes (Optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200"
              placeholder="Optional notes"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={processing}
              className={`flex-1 py-2 rounded transition-colors ${
                transactionType === 'buy'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } disabled:bg-gray-600`}
            >
              {processing ? 'Processing...' : transactionType === 'buy' ? 'Buy Shares' : 'Sell Shares'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
