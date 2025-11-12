'use client';

import React, { useState } from 'react';

interface PDFViewerProps {
  filePath: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ filePath }) => {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8">
      <div className="text-center">
        <div className="text-6xl mb-4">📄</div>
        <div className="text-xl font-semibold text-gray-200 mb-2">PDF Viewer</div>
        <div className="text-sm text-gray-400 mb-4">
          {filePath}
        </div>
        <div className="text-sm text-gray-500">
          PDF viewing is available in this application. The full react-pdf integration
          will be completed in a future update.
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
