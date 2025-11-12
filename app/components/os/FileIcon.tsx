'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { IconType } from 'react-icons';

interface FileIconProps {
  name: string;
  icon: IconType;
  onDoubleClick?: () => void;
  dragData?: any;
}

const FileIcon: React.FC<FileIconProps> = ({ name, icon: Icon, onDoubleClick, dragData }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'file',
    item: dragData || { name },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [dragData, name]);

  return (
    <div
      ref={drag as any}
      onDoubleClick={onDoubleClick}
      className={`flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-800/50 rounded-lg transition-all ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
      style={{ width: '100px', height: '100px' }}
    >
      <Icon className="text-4xl text-blue-400 mb-2" />
      <div className="text-xs text-center text-gray-200 break-words w-full">
        {name}
      </div>
    </div>
  );
};

export default FileIcon;
