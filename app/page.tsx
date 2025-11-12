'use client';

import Desktop from './components/os/Desktop';
import { WindowManagerProvider } from './context/WindowManager';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function Home() {
  return (
    <DndProvider backend={HTML5Backend}>
      <WindowManagerProvider>
        <Desktop />
      </WindowManagerProvider>
    </DndProvider>
  );
}
