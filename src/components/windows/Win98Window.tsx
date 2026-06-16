import React, { useState, useRef, useEffect } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { WindowId } from '../../types';

interface Win98WindowProps {
  id: WindowId;
  title: string;
  icon?: string;
  children: React.ReactNode;
  width?: string;
  onClose?: () => void;
  draggable?: boolean;
}

export const Win98Window: React.FC<Win98WindowProps> = ({
  id,
  title,
  icon = '📁',
  children,
  width = '480px',
  onClose,
  draggable = true,
}) => {
  const { activeWindow, openWindow, closeWindow, openWindows } = useFlowStore();
  const isActive = activeWindow === id;
  
  // Draggable state for desktop
  const [position, setPosition] = useState({ x: 50 + openWindows.indexOf(id) * 25, y: 50 + openWindows.indexOf(id) * 25 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Bring to front on mouse down
  const handleMouseDown = (e: React.MouseEvent) => {
    openWindow(id); // focus
  };

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || window.innerWidth < 640) return; // Disable dragging on mobile
    if ((e.target as HTMLElement).closest('button')) return; // Ignore if clicking titlebar buttons
    
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      
      // Clamp bounds to prevent window from going completely offscreen
      const clampedX = Math.max(-100, Math.min(window.innerWidth - 100, newX));
      const clampedY = Math.max(0, Math.min(window.innerHeight - 50, newY));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closeWindow(id);
    }
  };

  // Determine standard layering z-index
  const windowIndex = openWindows.indexOf(id);
  const zIndexStyle = {
    zIndex: isActive ? 9990 : 9000 + windowIndex,
  };

  return (
    <div
      ref={windowRef}
      onMouseDown={handleMouseDown}
      style={{
        ...zIndexStyle,
        width: window.innerWidth < 640 ? '100%' : width,
        left: window.innerWidth < 640 ? 0 : `${position.x}px`,
        top: window.innerWidth < 640 ? 0 : `${position.y}px`,
        position: window.innerWidth < 640 ? 'fixed' : 'absolute',
        height: window.innerWidth < 640 ? 'calc(100dvh - 34px)' : 'auto',
      }}
      className="bg-[#c0c0c0] win-raised flex flex-col select-none overflow-hidden max-h-[90vh] sm:max-h-[85vh] pointer-events-auto"
    >
      {/* Title bar */}
      <div
        onMouseDown={handleTitleMouseDown}
        className={`flex items-center justify-between p-1 cursor-default ${
          isActive ? 'win-titlebar' : 'win-titlebar-inactive'
        }`}
      >
        <div className="flex items-center gap-1 font-bold text-sm select-none px-1 overflow-hidden truncate">
          <span>{icon}</span>
          <span className="truncate">{title}</span>
        </div>
        
        {/* Title bar buttons */}
        <div className="flex items-center gap-[2px]">
          {/* Minimize button */}
          <button 
            onClick={handleClose} 
            className="w-4 h-4 bg-[#c0c0c0] win-raised text-black font-bold text-[10px] flex items-center justify-center border border-black active:border-t-2 active:border-l-2 active:border-[#808080] active:border-b-0 active:border-r-0"
          >
            _
          </button>
          {/* Maximize button (disabled look) */}
          <button 
            disabled 
            className="w-4 h-4 bg-[#c0c0c0] win-raised text-[#808080] font-bold text-[10px] flex items-center justify-center border border-black cursor-not-allowed"
          >
            ▢
          </button>
          {/* Close button */}
          <button 
            onClick={handleClose} 
            className="w-4 h-4 bg-[#c0c0c0] win-raised text-black font-bold text-[10px] flex items-center justify-center border border-black active:border-t-2 active:border-l-2 active:border-[#808080] active:border-b-0 active:border-r-0 hover:bg-[#ff8080] hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Window Body Container */}
      <div className="p-3 flex-1 flex flex-col min-h-0 overflow-y-auto bg-[#c0c0c0] text-black">
        {children}
      </div>
    </div>
  );
};
