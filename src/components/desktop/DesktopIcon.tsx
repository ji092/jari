import React, { useState, useEffect, useRef } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { WindowId } from '../../types';

interface DesktopIconProps {
  id: WindowId;
  label: string;
  icon: string;
  onClickCustom?: () => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  id,
  label,
  icon,
  onClickCustom
}) => {
  const { openWindow } = useFlowStore();
  const [isSelected, setIsSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef<number>(0);

  // Trigger action: open corresponding window
  const handleTrigger = () => {
    if (onClickCustom) {
      onClickCustom();
    } else {
      openWindow(id);
    }
    setIsSelected(false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsSelected(true);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    handleTrigger();
  };

  // Support double-tap on mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      handleTrigger();
    }
    lastTap.current = now;
  };

  // Deselect icon when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      className="w-[75px] h-[75px] flex flex-col items-center justify-center cursor-pointer select-none rounded-[2px] p-1"
    >
      <div className={`flex flex-col items-center justify-center p-1 rounded-[2px] ${
        isSelected ? 'opacity-80' : ''
      }`}>
        {/* Render emoji or simple symbol as large desktop icon */}
        <span className="text-3xl mb-1 filter drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)] select-none">
          {icon}
        </span>
        
        {/* Label block */}
        <div className={`text-xs text-center leading-tight mt-1 select-none px-1 rounded-[1px] ${
          isSelected 
            ? 'bg-[#000080] text-white border border-dotted border-[#fffff0]' 
            : 'text-[#fffff0] border border-transparent'
        }`}>
          {label}
        </div>
      </div>
    </div>
  );
};
