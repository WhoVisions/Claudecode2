import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { files } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'Files array is required' },
        { status: 400 }
      );
    }

    const homeDir = os.homedir();
    const basePath = path.join(homeDir, 'Documents', 'Finances');

    const results: any[] = [];

    for (const filePath of files) {
      const fullPath = path.resolve(basePath, filePath);

      // Security check
      if (!fullPath.startsWith(basePath)) {
        results.push({
          file: filePath,
          error: 'Access denied',
        });
        continue;
      }

      if (!fs.existsSync(fullPath)) {
        results.push({
          file: filePath,
          error: 'File not found',
        });
        continue;
      }

      const extension = path.extname(fullPath).toLowerCase();

      try {
        if (extension === '.pdf') {
          // For MVP, just return basic file info
          // Full PDF text extraction will be added in future update
          const stats = fs.statSync(fullPath);
          const analysis = {
            file: filePath,
            name: path.basename(fullPath),
            size: stats.size,
            type: 'PDF Document',
            detectedForms: ['Tax Document (Analysis coming soon)'],
            note: 'PDF text extraction will be available in a future update',
          };

          results.push(analysis);
        } else if (extension === '.txt' || extension === '.csv') {
          const content = fs.readFileSync(fullPath, 'utf-8');
          results.push({
            file: filePath,
            name: path.basename(fullPath),
            content: content.substring(0, 500),
            type: extension,
          });
        } else {
          results.push({
            file: filePath,
            error: 'Unsupported file type for tax analysis',
          });
        }
      } catch (err) {
        results.push({
          file: filePath,
          error: 'Failed to analyze file',
        });
      }
    }

    return NextResponse.json({
      analyzed: results.length,
      results,
      summary: `Analyzed ${results.length} file(s)`,
    });
  } catch (error) {
    console.error('Error analyzing tax documents:', error);
    return NextResponse.json(
      { error: 'Failed to analyze tax documents' },
      { status: 500 }
    );
  }
}
