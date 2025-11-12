'use client';

import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { FaFileAlt, FaTrash, FaPlay } from 'react-icons/fa';

interface DroppedFile {
  filePath: string;
  fileName: string;
}

interface AnalysisResult {
  file: string;
  name: string;
  detectedForms?: string[];
  text?: string;
  error?: string;
}

const TaxAgent: React.FC = () => {
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[] | null>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'file',
    drop: (item: any) => {
      if (item.filePath) {
        addFile(item.filePath, item.fileName);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const addFile = (filePath: string, fileName: string) => {
    if (!droppedFiles.find((f) => f.filePath === filePath)) {
      setDroppedFiles([...droppedFiles, { filePath, fileName }]);
    }
  };

  const removeFile = (filePath: string) => {
    setDroppedFiles(droppedFiles.filter((f) => f.filePath !== filePath));
  };

  const analyzeFiles = async () => {
    if (droppedFiles.length === 0) return;

    setAnalyzing(true);
    setResults(null);

    try {
      const response = await fetch('/api/analyze-tax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: droppedFiles.map((f) => f.filePath),
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      console.error(err);
      alert('Failed to analyze files');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Drop Zone */}
      <div
        ref={drop as any}
        className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
          isOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 bg-gray-800/50'
        }`}
      >
        <FaFileAlt className="text-6xl text-gray-500 mb-4" />
        <div className="text-lg text-gray-300 mb-2">
          Drop Tax Documents Here
        </div>
        <div className="text-sm text-gray-500">
          Drag and drop W-2s, 1099s, and other tax forms
        </div>

        {/* Dropped Files List */}
        {droppedFiles.length > 0 && (
          <div className="mt-6 w-full max-w-md">
            <div className="text-sm font-semibold text-gray-300 mb-2">
              Files to analyze ({droppedFiles.length}):
            </div>
            <div className="space-y-2">
              {droppedFiles.map((file) => (
                <div
                  key={file.filePath}
                  className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded"
                >
                  <span className="text-sm text-gray-200 truncate flex-1">
                    {file.fileName}
                  </span>
                  <button
                    onClick={() => removeFile(file.filePath)}
                    className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                    aria-label="Remove file"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={analyzeFiles}
              disabled={analyzing}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors"
            >
              <FaPlay />
              {analyzing ? 'Analyzing...' : 'Analyze Documents'}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="bg-gray-800 rounded-lg p-4 max-h-64 overflow-auto">
          <div className="text-lg font-semibold text-gray-200 mb-3">
            Analysis Results
          </div>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-gray-700 rounded p-3"
              >
                <div className="text-sm font-semibold text-gray-200 mb-1">
                  {result.name}
                </div>

                {result.error ? (
                  <div className="text-xs text-red-400">{result.error}</div>
                ) : (
                  <>
                    {result.detectedForms && result.detectedForms.length > 0 && (
                      <div className="text-xs text-green-400 mb-2">
                        Detected Forms: {result.detectedForms.join(', ')}
                      </div>
                    )}
                    {result.text && (
                      <div className="text-xs text-gray-400 mt-2">
                        {result.text.substring(0, 200)}...
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxAgent;
