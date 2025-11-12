'use client';

import React, { useState, useEffect } from 'react';
import { useWindowManager } from '@/app/context/WindowManager';
import { FaFolder, FaFileAlt, FaFileCsv, FaFilePdf, FaArrowLeft, FaHome } from 'react-icons/fa';
import FileIcon from '../os/FileIcon';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  extension: string;
}

const FileExplorer: React.FC = () => {
  const { openWindow } = useWindowManager();
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        throw new Error('Failed to load files');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError('Failed to load directory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDoubleClick = (file: FileItem) => {
    if (file.isDirectory) {
      // Navigate into directory
      setCurrentPath(file.path);
    } else {
      // Open file in appropriate viewer
      const extension = file.extension.toLowerCase();

      let appType = 'text-viewer';
      let title = file.name;

      switch (extension) {
        case '.csv':
          appType = 'csv-viewer';
          break;
        case '.pdf':
          appType = 'pdf-viewer';
          break;
        case '.txt':
        case '.md':
        case '.log':
          appType = 'text-viewer';
          break;
        default:
          appType = 'text-viewer';
      }

      openWindow({
        id: `${appType}-${file.path}`,
        title,
        appType,
        position: { x: 150, y: 150 },
        size: { width: 800, height: 600 },
        appProps: { filePath: file.path },
      });
    }
  };

  const handleBack = () => {
    if (currentPath === '/') return;
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parentPath);
  };

  const handleHome = () => {
    setCurrentPath('/');
  };

  const getFileIcon = (file: FileItem) => {
    if (file.isDirectory) return FaFolder;

    switch (file.extension.toLowerCase()) {
      case '.csv':
        return FaFileCsv;
      case '.pdf':
        return FaFilePdf;
      default:
        return FaFileAlt;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
        <button
          onClick={handleBack}
          disabled={currentPath === '/'}
          className="p-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Go back"
        >
          <FaArrowLeft />
        </button>
        <button
          onClick={handleHome}
          className="p-2 rounded hover:bg-gray-700 transition-colors"
          aria-label="Go home"
        >
          <FaHome />
        </button>
        <div className="flex-1 bg-gray-900 rounded px-3 py-1 text-sm">
          {currentPath || '/'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-400">{error}</div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">This folder is empty</div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {files.map((file) => (
              <FileIcon
                key={file.path}
                name={file.name}
                icon={getFileIcon(file)}
                onDoubleClick={() => handleFileDoubleClick(file)}
                dragData={{ filePath: file.path, fileName: file.name }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-1 text-xs text-gray-400">
        {files.length} item(s)
      </div>
    </div>
  );
};

export default FileExplorer;
