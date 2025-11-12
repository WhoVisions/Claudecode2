# Fin-OS: The Local-First Financial Agent

A personal financial and tax agent built with Next.js 16 and React 19. It runs entirely on your local machine, accessing your file system directly to organize, analyze, and manage your financial documents.

## 🌟 Features

- **Local-First & Private**: All data and processing stay on your machine. No cloud uploads.
- **Direct File System Access**: Desktop-grade application that reads/writes directly to your local `Documents/Finances` folder.
- **Desktop OS Interface**: Familiar desktop UI with windows, taskbar, and drag-and-drop.
- **File Explorer**: Browse your financial documents with a native-like file manager.
- **Document Viewers**: Built-in viewers for CSV, PDF, and text files.
- **Tax Agent**: Drag-and-drop tax documents for automated analysis and form detection.
- **Modern Stack**: Built with Next.js 16, React 19, and Tailwind CSS.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Claudecode2
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
Claudecode2/
├── app/
│   ├── api/                    # Backend API routes
│   │   ├── files/             # File system listing
│   │   ├── read-file/         # File reading & parsing
│   │   └── analyze-tax/       # Tax document analysis
│   ├── components/
│   │   ├── os/                # OS UI components
│   │   │   ├── Desktop.tsx    # Main desktop interface
│   │   │   ├── Window.tsx     # Draggable window component
│   │   │   ├── Taskbar.tsx    # Bottom taskbar
│   │   │   ├── StartMenu.tsx  # App launcher
│   │   │   └── FileIcon.tsx   # File/folder icons
│   │   └── apps/              # Application components
│   │       ├── FileExplorer.tsx
│   │       ├── CSVViewer.tsx
│   │       ├── PDFViewer.tsx
│   │       ├── TextViewer.tsx
│   │       ├── TaxAgent.tsx
│   │       └── Settings.tsx
│   ├── context/
│   │   └── WindowManager.tsx  # Global state for windows
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🏗️ Architecture

### Frontend (Client)
- **Role**: The "OS" User Interface
- **Runs**: In your browser (http://localhost:3000)
- **Tech**: React 19, Framer Motion, Tailwind CSS
- **Note**: Cannot directly access file system (browser sandbox)

### Backend (Server)
- **Role**: The "Agent" and "File System Driver"
- **Runs**: On your local machine (Node.js server)
- **Tech**: Next.js API Routes
- **Key Feature**: Full file system access using Node.js `fs` module

## 🔧 Technology Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Drag & Drop**: react-dnd
- **State Management**: React Context
- **Document Parsers**:
  - CSV: papaparse
  - PDF: pdf-parse (backend), react-pdf (frontend)
- **Icons**: react-icons

## 📱 Applications

### File Explorer
Browse your `Documents/Finances` folder with a native-like interface. Double-click files to open them in the appropriate viewer.

### CSV Viewer
View CSV files in a formatted table with column headers.

### PDF Viewer
View PDF documents with zoom and page navigation controls.

### Tax Agent
Drag and drop tax documents (W-2s, 1099s, etc.) to automatically analyze and extract key information.

### Settings
Configure the root folder path and view application information.

## 🔒 Security

- **Directory Traversal Protection**: All file paths are validated to prevent access outside the designated `Documents/Finances` folder.
- **Local-Only**: No data is sent to external servers.
- **Read/Write Permissions**: The app only accesses files within your configured root directory.

## 🛠️ Development

### Available Scripts

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Creating New Applications

1. Create a new component in `app/components/apps/`
2. Add the app to `Desktop.tsx` in the `renderApp` function
3. Add the app to `StartMenu.tsx` app list
4. (Optional) Add an icon to the desktop in `Desktop.tsx`

## 📝 Roadmap

### MVP (Current)
- ✅ Desktop OS interface
- ✅ File system API
- ✅ File Explorer
- ✅ Document viewers (CSV, PDF, Text)
- ✅ Basic Tax Agent

### Future Features
- [ ] CLI Integration (Terminal app with xterm.js)
- [ ] Budget tracking with charts
- [ ] AI-powered insights
- [ ] Export functionality
- [ ] Advanced tax form parsing
- [ ] Receipt OCR
- [ ] Multi-currency support

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📄 License

ISC

## 🙏 Acknowledgments

Built with modern web technologies and inspired by desktop operating systems.

---

**Note**: This application is designed for local use only. Always backup your financial data regularly.