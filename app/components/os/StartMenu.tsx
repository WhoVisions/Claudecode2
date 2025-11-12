'use client';

import React from 'react';
import { useWindowManager } from '@/app/context/WindowManager';
import { FaFolder, FaChartBar, FaCog, FaTimes, FaTachometerAlt, FaDollarSign, FaWallet, FaPiggyBank, FaBriefcase, FaCalculator, FaClipboardCheck, FaShieldAlt } from 'react-icons/fa';

interface StartMenuProps {
  onClose: () => void;
}

const StartMenu: React.FC<StartMenuProps> = ({ onClose }) => {
  const { openWindow } = useWindowManager();

  const apps = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: FaTachometerAlt,
      appType: 'dashboard',
    },
    {
      id: 'transactions',
      title: 'Transactions',
      icon: FaDollarSign,
      appType: 'transactions',
    },
    {
      id: 'accounts',
      title: 'Accounts',
      icon: FaWallet,
      appType: 'accounts',
    },
    {
      id: 'budgets',
      title: 'Budgets',
      icon: FaPiggyBank,
      appType: 'budgets',
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      icon: FaBriefcase,
      appType: 'portfolio',
    },
    {
      id: 'file-explorer',
      title: 'File Explorer',
      icon: FaFolder,
      appType: 'file-explorer',
    },
    {
      id: 'tax-agent',
      title: 'Document Agent',
      icon: FaChartBar,
      appType: 'tax-agent',
    },
    {
      id: 'tax-intake',
      title: 'Tax Intake',
      icon: FaClipboardCheck,
      appType: 'tax-intake',
    },
    {
      id: 'tax-calculator',
      title: 'Tax Calculator',
      icon: FaCalculator,
      appType: 'tax-calculator',
    },
    {
      id: 'audit-center',
      title: 'Audit Center',
      icon: FaShieldAlt,
      appType: 'audit-center',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: FaCog,
      appType: 'settings',
    },
  ];

  const handleAppClick = (app: typeof apps[0]) => {
    openWindow({
      id: app.id,
      title: app.title,
      appType: app.appType,
      position: { x: 100, y: 100 },
      size: { width: 800, height: 600 },
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Start Menu */}
      <div className="fixed bottom-14 left-4 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-200">Applications</div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {/* Apps List */}
        <div className="p-2">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleAppClick(app)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-left"
            >
              <app.icon className="text-2xl text-blue-400" />
              <div>
                <div className="text-sm font-medium text-gray-200">{app.title}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-900 border-t border-gray-700 px-4 py-2">
          <div className="text-xs text-gray-500 text-center">
            Fin-OS v1.0
          </div>
        </div>
      </div>
    </>
  );
};

export default StartMenu;
