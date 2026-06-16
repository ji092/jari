import React from 'react';
import { useFlowStore } from '../../store/flowStore';
import { Win98Button } from '../ui/Win98Button';
import { FRAMES_CONFIG } from '../../constants/frames';
import { LayoutType } from '../../types';

export const FrameSelect: React.FC = () => {
  const { 
    selectedLayout, 
    selectedFrameId, 
    setLayout, 
    setFrameId, 
    closeWindow, 
    openWindow 
  } = useFlowStore();

  const handleLayoutSelect = (layout: LayoutType) => {
    setLayout(layout);
    // Auto select first frame if not selected yet
    if (!selectedFrameId) {
      setFrameId(FRAMES_CONFIG[0].id);
    }
  };

  const handleNext = () => {
    if (!selectedLayout || !selectedFrameId) return;
    closeWindow('frame');
    openWindow('camera');
  };

  const handleBack = () => {
    closeWindow('frame');
    openWindow('write');
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-xs select-none">
      {/* Step 1: Layout Array Selection */}
      <div className="flex flex-col gap-2">
        <div className="font-bold text-[#333] text-sm border-b border-[#808080] pb-1">
          Step 1. 사진 배열 선택
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* 2x2 Button */}
          <button
            type="button"
            onClick={() => handleLayoutSelect('2x2')}
            className={`p-3 flex flex-col items-center gap-2 rounded-[2px] transition-all outline-none ${
              selectedLayout === '2x2'
                ? 'bg-[#e6e6e6] border-t-2 border-l-2 border-[#808080] border-b-2 border-r-2 border-[#fff] shadow-[-1px_-1px_0px_0px_#000]'
                : 'bg-[#c0c0c0] win-raised hover:bg-[#d5d5d5]'
            }`}
          >
            {/* 2x2 SVG Icon */}
            <svg width="40" height="40" viewBox="0 0 40 40" className="opacity-90">
              <rect x="2" y="2" width="36" height="36" fill="#fff" stroke="#000" strokeWidth="2" />
              <rect x="5" y="5" width="13" height="13" fill="#808080" />
              <rect x="22" y="5" width="13" height="13" fill="#808080" />
              <rect x="5" y="22" width="13" height="13" fill="#808080" />
              <rect x="22" y="22" width="13" height="13" fill="#808080" />
            </svg>
            <span className="font-bold text-xs">2 × 2 배열 (네모)</span>
          </button>

          {/* 1x4 Button */}
          <button
            type="button"
            onClick={() => handleLayoutSelect('1x4')}
            className={`p-3 flex flex-col items-center gap-2 rounded-[2px] transition-all outline-none ${
              selectedLayout === '1x4'
                ? 'bg-[#e6e6e6] border-t-2 border-l-2 border-[#808080] border-b-2 border-r-2 border-[#fff] shadow-[-1px_-1px_0px_0px_#000]'
                : 'bg-[#c0c0c0] win-raised hover:bg-[#d5d5d5]'
            }`}
          >
            {/* 1x4 SVG Icon */}
            <svg width="24" height="42" viewBox="0 0 24 42" className="opacity-90">
              <rect x="2" y="2" width="20" height="38" fill="#fff" stroke="#000" strokeWidth="2" />
              <rect x="5" y="5" width="14" height="6" fill="#808080" />
              <rect x="5" y="13" width="14" height="6" fill="#808080" />
              <rect x="5" y="21" width="14" height="6" fill="#808080" />
              <rect x="5" y="29" width="14" height="6" fill="#808080" />
            </svg>
            <span className="font-bold text-xs">1 × 4 세로 (클래식)</span>
          </button>
        </div>
      </div>

      {/* Step 2: Frame Theme Selection */}
      <div className="flex flex-col gap-2">
        <div className="font-bold text-[#333] text-sm border-b border-[#808080] pb-1">
          Step 2. 프레임 테마 선택
        </div>
        
        {!selectedLayout ? (
          <div className="h-[120px] flex items-center justify-center bg-[#b5b5b5] text-[#808080] border-t-2 border-l-2 border-[#808080] border-b-2 border-r-2 border-[#fff] font-bold select-none">
            ⚠️ 배열을 먼저 선택해주세요
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {FRAMES_CONFIG.map((frame) => {
              const isSelected = selectedFrameId === frame.id;
              return (
                <div
                  key={frame.id}
                  onClick={() => setFrameId(frame.id)}
                  className={`p-2 cursor-pointer flex flex-col items-center gap-2 rounded-[2px] transition-all ${
                    isSelected
                      ? 'bg-[#e6e6e6] border-t-2 border-l-2 border-[#000080] border-b-2 border-r-2 border-[#fff] shadow-[-1px_-1px_0px_0px_#000]'
                      : 'bg-[#c0c0c0] win-raised hover:bg-[#d5d5d5]'
                  }`}
                >
                  {/* Miniature Frame Preview */}
                  <div
                    style={{ backgroundColor: frame.bgColor }}
                    className="w-full h-[65px] border border-gray-400 p-1 flex flex-col justify-between relative"
                  >
                    {/* Render Mini Grid Slots */}
                    {selectedLayout === '2x2' ? (
                      <div className="grid grid-cols-2 gap-[2px] h-[45px] w-[50px] mx-auto">
                        <div className="bg-[#b5b5b5] border border-dotted border-gray-600" />
                        <div className="bg-[#b5b5b5] border border-dotted border-gray-600" />
                        <div className="bg-[#b5b5b5] border border-dotted border-gray-600" />
                        <div className="bg-[#b5b5b5] border border-dotted border-gray-600" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-[1px] h-[50px] w-[22px] mx-auto mt-[2px]">
                        <div className="bg-[#b5b5b5] border border-dotted border-gray-600 flex-1" />
                        <div className="bg-[#b5b5b5] border border-dotted border-gray-600 flex-1" />
                        <div className="bg-[#b5b5b5] border border-dotted border-gray-600 flex-1" />
                        <div className="bg-[#b5b5b5] border border-dotted border-gray-600 flex-1" />
                      </div>
                    )}
                    {/* Logo text mock */}
                    <div
                      style={{ color: frame.textColor }}
                      className="text-[6px] text-center font-bold font-sans overflow-hidden truncate mt-[2px]"
                    >
                      ★ 자리네컷 ★
                    </div>
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-[#000080] text-white font-bold text-[8px] px-1 py-[1px] select-none">
                        ✓ 선택됨
                      </div>
                    )}
                  </div>
                  
                  <span className="font-bold text-[11px] text-center block max-w-full truncate">
                    {frame.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-[#808080]">
        <Win98Button onClick={handleBack} className="w-[110px]">
          ← 방명록 다시 쓰기
        </Win98Button>
        <Win98Button
          onClick={handleNext}
          variant="primary"
          disabled={!selectedLayout || !selectedFrameId}
          className="w-[110px]"
        >
          촬영하러 가기 →
        </Win98Button>
      </div>
    </div>
  );
};
