'use client';

import React, { useState } from 'react';
import { FaSave, FaFolder } from 'react-icons/fa';

const Settings: React.FC = () => {
  const [rootFolder, setRootFolder] = useState('~/Documents/Finances');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real implementation, this would save to localStorage or a config file
    localStorage.setItem('fin-os-root-folder', rootFolder);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Settings</h2>

        {/* Root Folder Setting */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            <FaFolder className="inline mr-2" />
            Root Folder Path
          </label>
          <input
            type="text"
            value={rootFolder}
            onChange={(e) => setRootFolder(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
            placeholder="~/Documents/Finances"
          />
          <div className="mt-2 text-xs text-gray-500">
            This is the base folder where Fin-OS will look for your financial documents.
          </div>
        </div>

        {/* About Section */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">
            About Fin-OS
          </h3>
          <div className="text-sm text-gray-400 space-y-2">
            <p>
              <strong>Version:</strong> 1.0.0 MVP
            </p>
            <p>
              <strong>Framework:</strong> Next.js 16 + React 19
            </p>
            <p>
              <strong>Privacy:</strong> All data stays local on your machine
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">
            Features
          </h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>✓ File Explorer with direct file system access</li>
            <li>✓ CSV Viewer with table display</li>
            <li>✓ PDF Viewer for tax documents</li>
            <li>✓ Tax Agent with document analysis</li>
            <li>✓ Desktop OS interface with windows</li>
            <li>✓ Drag and drop file operations</li>
          </ul>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
        >
          <FaSave />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
