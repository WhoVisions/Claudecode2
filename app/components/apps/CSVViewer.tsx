'use client';

import React, { useState, useEffect } from 'react';

interface CSVViewerProps {
  filePath: string;
}

const CSVViewer: React.FC<CSVViewerProps> = ({ filePath }) => {
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCSV();
  }, [filePath]);

  const loadCSV = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/read-file?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) {
        throw new Error('Failed to load CSV file');
      }

      const result = await response.json();
      setData(result.data || []);
      setHeaders(result.headers || []);
    } catch (err) {
      setError('Failed to load CSV file');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading CSV...</div>
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
      <div className="mb-4">
        <div className="text-sm text-gray-400">
          {data.length} row(s), {headers.length} column(s)
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-700">
          <thead>
            <tr className="bg-gray-800">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="border border-gray-700 px-4 py-2 text-left text-sm font-semibold text-gray-200"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}
              >
                {headers.map((header, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-gray-700 px-4 py-2 text-sm text-gray-300"
                  >
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CSVViewer;
