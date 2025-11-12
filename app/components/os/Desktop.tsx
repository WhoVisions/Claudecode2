'use client';

import React from 'react';
import { useWindowManager } from '@/app/context/WindowManager';
import Window from './Window';
import Taskbar from './Taskbar';
import FileIcon from './FileIcon';
import { FaFolder, FaChartBar, FaCog, FaTachometerAlt, FaDollarSign, FaWallet, FaPiggyBank, FaBriefcase, FaCalculator, FaClipboardCheck, FaShieldAlt, FaGraduationCap, FaClipboardList } from 'react-icons/fa';

// App Components
import FileExplorer from '../apps/FileExplorer';
import TaxAgent from '../apps/TaxAgent';
import Settings from '../apps/Settings';
import CSVViewer from '../apps/CSVViewer';
import PDFViewer from '../apps/PDFViewer';
import TextViewer from '../apps/TextViewer';
import Dashboard from '../apps/Dashboard';
import Transactions from '../apps/Transactions';
import Accounts from '../apps/Accounts';
import Budgets from '../apps/Budgets';
import PortfolioApp from '../apps/PortfolioApp';
import TaxIntakeApp from '../apps/TaxIntakeApp';
import TaxCalculatorApp from '../apps/TaxCalculatorApp';
import LocalAuditCenter from '../apps/LocalAuditCenter';
import TaxResearchApp from '../apps/TaxResearchApp';
import ClientOrganizerApp from '../apps/ClientOrganizerApp';

const Desktop: React.FC = () => {
  const { windows, openWindow } = useWindowManager();

  const desktopIcons = [
    {
      name: 'Dashboard',
      icon: FaTachometerAlt,
      appType: 'dashboard',
      title: 'Dashboard',
    },
    {
      name: 'My Finances',
      icon: FaFolder,
      appType: 'file-explorer',
      title: 'File Explorer',
    },
    {
      name: 'Transactions',
      icon: FaDollarSign,
      appType: 'transactions',
      title: 'Transactions',
    },
    {
      name: 'Accounts',
      icon: FaWallet,
      appType: 'accounts',
      title: 'Accounts',
    },
    {
      name: 'Budgets',
      icon: FaPiggyBank,
      appType: 'budgets',
      title: 'Budgets',
    },
    {
      name: 'Portfolio',
      icon: FaBriefcase,
      appType: 'portfolio',
      title: 'Investment Portfolio',
    },
    {
      name: 'Tax Agent',
      icon: FaChartBar,
      appType: 'tax-agent',
      title: 'Document Agent',
    },
    {
      name: 'Tax Intake',
      icon: FaClipboardCheck,
      appType: 'tax-intake',
      title: 'Tax Document Intake',
    },
    {
      name: 'Client Organizer',
      icon: FaClipboardList,
      appType: 'client-organizer',
      title: 'Client Tax Organizer',
    },
    {
      name: 'Tax Calculator',
      icon: FaCalculator,
      appType: 'tax-calculator',
      title: 'Tax Calculator',
    },
    {
      name: 'Audit Center',
      icon: FaShieldAlt,
      appType: 'audit-center',
      title: 'Local Audit Center',
    },
    {
      name: 'Tax Research',
      icon: FaGraduationCap,
      appType: 'tax-research',
      title: 'Tax Research Assistant',
    },
    {
      name: 'Settings',
      icon: FaCog,
      appType: 'settings',
      title: 'Settings',
    },
  ];

  const handleIconDoubleClick = (icon: typeof desktopIcons[0]) => {
    openWindow({
      id: icon.appType,
      title: icon.title,
      appType: icon.appType,
      position: { x: 100, y: 100 },
      size: { width: 800, height: 600 },
    });
  };

  const renderApp = (window: any) => {
    switch (window.appType) {
      case 'dashboard':
        return <Dashboard />;
      case 'file-explorer':
        return <FileExplorer />;
      case 'transactions':
        return <Transactions />;
      case 'accounts':
        return <Accounts />;
      case 'budgets':
        return <Budgets />;
      case 'portfolio':
        return <PortfolioApp />;
      case 'tax-agent':
        return <TaxAgent />;
      case 'tax-intake':
        return <TaxIntakeApp />;
      case 'client-organizer':
        return <ClientOrganizerApp />;
      case 'tax-calculator':
        return <TaxCalculatorApp />;
      case 'audit-center':
        return <LocalAuditCenter />;
      case 'tax-research':
        return <TaxResearchApp />;
      case 'settings':
        return <Settings />;
      case 'csv-viewer':
        return <CSVViewer filePath={window.appProps?.filePath} />;
      case 'pdf-viewer':
        return <PDFViewer filePath={window.appProps?.filePath} />;
      case 'text-viewer':
        return <TextViewer filePath={window.appProps?.filePath} />;
      default:
        return <div className="p-4">Unknown application type</div>;
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900"
      style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      }}
    >
      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {desktopIcons.map((icon) => (
          <FileIcon
            key={icon.name}
            name={icon.name}
            icon={icon.icon}
            onDoubleClick={() => handleIconDoubleClick(icon)}
          />
        ))}
      </div>

      {/* Windows */}
      {windows.map((window) => (
        <Window key={window.id} id={window.id} title={window.title}>
          {renderApp(window)}
        </Window>
      ))}

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
};

export default Desktop;
