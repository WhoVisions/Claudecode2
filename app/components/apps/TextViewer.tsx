'use client';

import React, { useState, useEffect } from 'react';

interface TextViewerProps {
  filePath: string;
}

const TextViewer: React.FC<TextViewerProps> = ({ filePath }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadText();
  }, [filePath]);

  const loadText = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/read-file?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) {
        throw new Error('Failed to load text file');
      }

      const result = await response.json();
      setContent(result.content || '');
    } catch (err) {
      setError('Failed to load text file');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
        {content}
      </pre>
    </div>
  );
};

export default TextViewer;
