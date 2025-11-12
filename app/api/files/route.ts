import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedPath = searchParams.get('path');

    // Default to user's Documents/Finances folder
    const homeDir = os.homedir();
    const defaultPath = path.join(homeDir, 'Documents', 'Finances');

    // Resolve the path
    let targetPath: string;
    if (!requestedPath || requestedPath === '/') {
      targetPath = defaultPath;
    } else {
      // Security: Prevent directory traversal attacks
      targetPath = path.resolve(defaultPath, requestedPath);
      if (!targetPath.startsWith(defaultPath)) {
        return NextResponse.json(
          { error: 'Access denied: Path is outside allowed directory' },
          { status: 403 }
        );
      }
    }

    // Create the directory if it doesn't exist
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    // Check if path exists and is accessible
    if (!fs.existsSync(targetPath)) {
      return NextResponse.json(
        { error: 'Path not found' },
        { status: 404 }
      );
    }

    // Check if it's a directory
    const stats = fs.statSync(targetPath);
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Path is not a directory' },
        { status: 400 }
      );
    }

    // Read directory contents
    const files = fs.readdirSync(targetPath);

    // Get file details
    const fileDetails = files.map((file) => {
      const filePath = path.join(targetPath, file);
      const fileStats = fs.statSync(filePath);

      return {
        name: file,
        path: path.relative(defaultPath, filePath),
        isDirectory: fileStats.isDirectory(),
        size: fileStats.size,
        modified: fileStats.mtime,
        extension: path.extname(file).toLowerCase(),
      };
    });

    return NextResponse.json({
      currentPath: path.relative(defaultPath, targetPath) || '/',
      basePath: defaultPath,
      files: fileDetails,
    });
  } catch (error) {
    console.error('Error reading directory:', error);
    return NextResponse.json(
      { error: 'Failed to read directory' },
      { status: 500 }
    );
  }
}
