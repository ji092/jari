import React, { useState, useEffect } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { StartMenu } from './StartMenu';
import { WindowId } from '../../types';

interface TaskbarProps {
  onOpenMyPhotos: () => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({ onOpenMyPhotos }) => {
  const { openWindows, activeWindow, openWindow } = useFlowStore();
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  // Clock tick effect
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? '오후' : '오전';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 hour should be 12
      
      setTimeStr(`${ampm} ${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const windowTitleMap: Record<WindowId, string> = {
    write: '방명록 작성',
    guestbook: '방명록.txt',
    frame: '프레임 선택',
    camera: '카메라 촬영',
    select: '사진 선택',
    result: '완성 및 저장',
    pc: '내 PC',
    trash: '휴지통',
  };

  const windowIconMap: Record<WindowId, string> = {
    write: '✍️',
    guestbook: '📄',
    frame: '🎞️',
    camera: '📷',
    select: '✅',
    result: '🎨',
    pc: '💻',
    trash: '🗑️',
  };

  return (
    <div
      style={{ zIndex: 99999 }}
      className="fixed bottom-0 left-0 w-full h-[34px] bg-[#c0c0c0] border-t-2 border-[#fff] flex items-center justify-between px-1 gap-1 select-none"
    >
      {/* Start Button & Menu */}
      <div className="relative flex items-center h-full">
        <button
          onClick={() => setStartMenuOpen(!startMenuOpen)}
          className={`h-[26px] px-2 flex items-center gap-1 font-bold text-xs select-none outline-none ${
            startMenuOpen
              ? 'border-t-2 border-l-2 border-[#808080] border-b-2 border-r-2 border-[#fff] shadow-[-1px_-1px_0px_0px_#000]'
              : 'win-raised'
          }`}
        >
          {/* Start Logo (Retro flag look using emojis) */}
          <span className="text-sm">🏁</span>
          <span className="font-sans">시작</span>
        </button>

        <StartMenu
          isOpen={startMenuOpen}
          onClose={() => setStartMenuOpen(false)}
          onOpenMyPhotos={onOpenMyPhotos}
        />
      </div>

      {/* Taskbar Windows list */}
      <div className="flex-1 flex items-center gap-[4px] px-2 overflow-x-auto h-full scrollbar-none">
        {openWindows.map((winId) => {
          const isActive = activeWindow === winId;
          return (
            <button
              key={winId}
              onClick={() => openWindow(winId)}
              className={`h-[26px] max-w-[120px] sm:max-w-[150px] min-w-[60px] px-2 truncate flex items-center gap-1 text-xs select-none outline-none text-left ${
                isActive
                  ? 'border-t-2 border-l-2 border-[#808080] border-b-2 border-r-2 border-[#fff] bg-[#e6e6e6] shadow-[-1px_-1px_0px_0px_#000]'
                  : 'win-raised'
              }`}
            >
              <span className="text-xs">{windowIconMap[winId] || '📁'}</span>
              <span className="truncate">{windowTitleMap[winId] || winId}</span>
            </button>
          );
        })}
      </div>

      {/* Retro Tray (Time & System Indicators) */}
      <div className="h-[26px] px-2 flex items-center gap-2 win-sunken font-sans text-xs bg-[#c0c0c0] shrink-0">
        <span className="text-[10px] opacity-75">🔊</span>
        <span>{timeStr}</span>
      </div>
    </div>
  );
};
