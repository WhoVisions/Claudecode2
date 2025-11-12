'use client';

import React, { useState } from 'react';
import { useWindowManager } from '@/app/context/WindowManager';
import { FaApple, FaFolder, FaFileAlt, FaChartBar, FaCog, FaTachometerAlt, FaDollarSign, FaWallet, FaPiggyBank, FaBriefcase, FaCalculator, FaClipboardCheck, FaShieldAlt, FaGraduationCap } from 'react-icons/fa';
import StartMenu from './StartMenu';

const Taskbar: React.FC = () => {
  const { windows, restoreWindow, bringToFront } = useWindowManager();
  const [showStartMenu, setShowStartMenu] = useState(false);

  const handleWindowClick = (id: string, isMinimized: boolean) => {
    if (isMinimized) {
      restoreWindow(id);
    }
    bringToFront(id);
  };

  const getWindowIcon = (appType: string) => {
    switch (appType) {
      case 'dashboard':
        return FaTachometerAlt;
      case 'file-explorer':
        return FaFolder;
      case 'transactions':
        return FaDollarSign;
      case 'accounts':
        return FaWallet;
      case 'budgets':
        return FaPiggyBank;
      case 'portfolio':
        return FaBriefcase;
      case 'csv-viewer':
      case 'pdf-viewer':
      case 'text-viewer':
        return FaFileAlt;
      case 'tax-agent':
        return FaChartBar;
      case 'tax-intake':
        return FaClipboardCheck;
      case 'tax-calculator':
        return FaCalculator;
      case 'audit-center':
        return FaShieldAlt;
      case 'tax-research':
        return FaGraduationCap;
      case 'settings':
        return FaCog;
      default:
        return FaFileAlt;
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-gray-900 border-t border-gray-700 flex items-center px-4 gap-2 z-50">
        {/* Start Button */}
        <button
          onClick={() => setShowStartMenu(!showStartMenu)}
          className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
          aria-label="Start Menu"
        >
          <FaApple className="text-xl text-white" />
        </button>

        {/* Window Buttons */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {windows.map((window) => {
            const Icon = getWindowIcon(window.appType);
            return (
              <button
                key={window.id}
                onClick={() => handleWindowClick(window.id, window.isMinimized)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  window.isMinimized
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-800 hover:bg-gray-700 border border-gray-600'
                }`}
              >
                <Icon className="text-sm" />
                <span className="text-sm max-w-32 truncate">{window.title}</span>
              </button>
            );
          })}
        </div>

        {/* System Tray */}
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400">
            {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>

      {/* Start Menu */}
      {showStartMenu && (
        <StartMenu onClose={() => setShowStartMenu(false)} />
      )}
    </>
  );
};

export default Taskbar;
