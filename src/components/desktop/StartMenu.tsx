import React, { useEffect, useRef } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { WindowId } from '../../types';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMyPhotos: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  isOpen,
  onClose,
  onOpenMyPhotos
}) => {
  const { openWindow } = useFlowStore();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close start menu on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  const menuItems: { label: string; icon: string; action: () => void }[] = [
    {
      label: '방명록 보기',
      icon: '✉️',
      action: () => openWindow('guestbook'),
    },
    {
      label: '내 사진첩',
      icon: '🖼️',
      action: onOpenMyPhotos,
    },
    {
      label: '내 PC',
      icon: '💻',
      action: () => openWindow('pc'),
    },
    {
      label: '휴지통',
      icon: '🗑️',
      action: () => openWindow('trash'),
    },
    {
      label: '시스템 종료...',
      icon: '🔌',
      action: () => alert('자리네컷 웹 서비스를 이용해 주셔서 감사합니다! 브라우저 창을 닫아 종료하세요. 👋'),
    },
  ];

  return (
    <div
      ref={menuRef}
      style={{ zIndex: 99999 }}
      className="absolute bottom-[34px] left-0 w-[220px] bg-[#c0c0c0] win-raised flex font-sans select-none"
    >
      {/* Side Brand Banner */}
      <div 
        className="w-[30px] text-white font-bold flex items-end justify-center py-2 select-none"
        style={{
          background: 'linear-gradient(180deg, #000080 0%, #1084d0 100%)',
          writingMode: 'vertical-lr',
          transform: 'rotate(180deg)',
        }}
      >
        <span className="tracking-wider text-sm select-none">Zarinaecut 98</span>
      </div>

      {/* Action Items List */}
      <div className="flex-1 py-1 flex flex-col">
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={() => handleItemClick(item.action)}
            className="flex items-center gap-3 px-3 py-2 text-xs text-black hover:bg-[#000080] hover:text-white cursor-pointer active:bg-[#000080]"
          >
            <span className="text-base filter drop-shadow-[0.5px_0.5px_0px_rgba(0,0,0,0.5)]">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
