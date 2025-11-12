import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Papa from 'papaparse';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedPath = searchParams.get('path');

    if (!requestedPath) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Default base path
    const homeDir = os.homedir();
    const basePath = path.join(homeDir, 'Documents', 'Finances');

    // Resolve the full path
    const fullPath = path.resolve(basePath, requestedPath);

    // Security: Prevent directory traversal attacks
    if (!fullPath.startsWith(basePath)) {
      return NextResponse.json(
        { error: 'Access denied: Path is outside allowed directory' },
        { status: 403 }
      );
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if it's a file (not a directory)
    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) {
      return NextResponse.json(
        { error: 'Path is not a file' },
        { status: 400 }
      );
    }

    const extension = path.extname(fullPath).toLowerCase();

    // Handle different file types
    switch (extension) {
      case '.csv':
        // Parse CSV file
        const csvContent = fs.readFileSync(fullPath, 'utf-8');
        const parsedCSV = Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
        });

        return NextResponse.json({
          type: 'csv',
          data: parsedCSV.data,
          headers: parsedCSV.meta.fields || [],
          path: requestedPath,
          name: path.basename(fullPath),
        });

      case '.txt':
      case '.md':
      case '.log':
        // Read as plain text
        const textContent = fs.readFileSync(fullPath, 'utf-8');
        return NextResponse.json({
          type: 'text',
          content: textContent,
          path: requestedPath,
          name: path.basename(fullPath),
        });

      case '.json':
        // Parse JSON
        const jsonContent = fs.readFileSync(fullPath, 'utf-8');
        const parsedJSON = JSON.parse(jsonContent);
        return NextResponse.json({
          type: 'json',
          data: parsedJSON,
          path: requestedPath,
          name: path.basename(fullPath),
        });

      case '.pdf':
        // For PDFs, return the path so the frontend can handle it
        return NextResponse.json({
          type: 'pdf',
          path: requestedPath,
          fullPath: fullPath,
          name: path.basename(fullPath),
        });

      default:
        return NextResponse.json(
          { error: `Unsupported file type: ${extension}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}
