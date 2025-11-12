'use client';

import React, { useRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useWindowManager } from '@/app/context/WindowManager';
import { FaTimes, FaMinus, FaExpand, FaCompress } from 'react-icons/fa';

interface WindowProps {
  id: string;
  title: string;
  children: ReactNode;
  onClose?: () => void;
}

const Window: React.FC<WindowProps> = ({ id, title, children, onClose }) => {
  const {
    windows,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    bringToFront,
    updateWindowPosition,
    updateWindowSize,
  } = useWindowManager();

  const windowState = windows.find((w) => w.id === id);
  const dragConstraintsRef = useRef(null);

  if (!windowState || windowState.isMinimized) {
    return null;
  }

  const handleClose = () => {
    if (onClose) onClose();
    closeWindow(id);
  };

  const handleMinimize = () => {
    minimizeWindow(id);
  };

  const handleMaximize = () => {
    if (windowState.isMaximized) {
      restoreWindow(id);
    } else {
      maximizeWindow(id);
    }
  };

  const handleMouseDown = () => {
    bringToFront(id);
  };

  const windowStyle = windowState.isMaximized
    ? {
        left: 0,
        top: 0,
        width: '100vw',
        height: 'calc(100vh - 48px)',
      }
    : {
        left: windowState.position.x,
        top: windowState.position.y,
        width: windowState.size.width,
        height: windowState.size.height,
      };

  return (
    <motion.div
      drag={!windowState.isMaximized}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={dragConstraintsRef}
      onDragEnd={(e, info) => {
        if (!windowState.isMaximized) {
          updateWindowPosition(id, {
            x: windowState.position.x + info.offset.x,
            y: windowState.position.y + info.offset.y,
          });
        }
      }}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        zIndex: windowState.zIndex,
        ...windowStyle,
      }}
      className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden flex flex-col"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      {/* Title Bar */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between cursor-move">
        <div className="text-sm font-semibold text-gray-200 select-none">
          {title}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMinimize}
            className="w-6 h-6 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors"
            aria-label="Minimize"
          >
            <FaMinus className="text-xs text-gray-900" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-6 h-6 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
            aria-label={windowState.isMaximized ? 'Restore' : 'Maximize'}
          >
            {windowState.isMaximized ? (
              <FaCompress className="text-xs text-gray-900" />
            ) : (
              <FaExpand className="text-xs text-gray-900" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <FaTimes className="text-xs text-gray-900" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-900 text-gray-200">
        {children}
      </div>

      {/* Resize Handle (only when not maximized) */}
      {!windowState.isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = windowState.size.width;
            const startHeight = windowState.size.height;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const deltaY = moveEvent.clientY - startY;
              updateWindowSize(id, {
                width: Math.max(300, startWidth + deltaX),
                height: Math.max(200, startHeight + deltaY),
              });
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      )}
    </motion.div>
  );
};

export default Window;
