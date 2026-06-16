import React from 'react';
import { useFlowStore } from '../../store/flowStore';
import { Win98Button } from '../ui/Win98Button';

export const PhotoSelect: React.FC = () => {
  const { 
    capturedPhotos, 
    selectedOrder, 
    togglePhotoSelect, 
    resetPhotos, 
    closeWindow, 
    openWindow 
  } = useFlowStore();

  const handlePhotoClick = (idx: number) => {
    // Alert if trying to select more than 4 photos
    if (!selectedOrder.includes(idx) && selectedOrder.length >= 4) {
      alert('이미 4장의 사진을 모두 선택하셨습니다! 해제 후 다시 선택해주세요.');
      return;
    }
    togglePhotoSelect(idx);
  };

  const handleNext = () => {
    if (selectedOrder.length !== 4) return;
    closeWindow('select');
    openWindow('result');
  };

  const handleRetake = () => {
    if (confirm('촬영된 8장의 사진이 모두 초기화됩니다. 다시 촬영하시겠습니까?')) {
      resetPhotos();
      closeWindow('select');
      openWindow('camera');
    }
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-xs text-black select-none">
      {/* Informative Header */}
      <div className="border-b border-[#808080] pb-2 flex justify-between items-center select-none">
        <span className="font-bold text-sm text-[#333]">🎞️ 인화할 사진 4장 선택</span>
        <span className="font-bold text-xs text-[#000080]">
          선택 완료: {selectedOrder.length} / 4장
        </span>
      </div>

      <div className="text-center font-bold bg-[#fffff0] p-2 border border-dotted border-gray-400 select-none">
        💡 클릭하는 순서대로 1번부터 4번 슬롯에 배치됩니다!
      </div>

      {/* 8 Photo Grid Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-1">
        {capturedPhotos.map((photoUrl, idx) => {
          const selectIndex = selectedOrder.indexOf(idx);
          const isSelected = selectIndex !== -1;
          
          return (
            <div
              key={idx}
              onClick={() => handlePhotoClick(idx)}
              className={`aspect-[4/3] relative cursor-pointer overflow-hidden transition-all ${
                isSelected
                  ? 'border-4 border-[#000080] brightness-[0.85]'
                  : 'border-2 border-[#fff] win-raised hover:scale-[1.02]'
              }`}
            >
              <img
                src={photoUrl}
                alt={`Shot option ${idx + 1}`}
                className="w-full h-full object-cover select-none"
              />

              {/* Selection order indicator badge */}
              {isSelected && (
                <div className="absolute top-2 left-2 w-6 h-6 bg-[#000080] border border-white text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md select-none">
                  {selectIndex + 1}
                </div>
              )}

              {/* Filmid indicator */}
              <div className="absolute bottom-1 right-1 bg-black/60 text-white font-mono text-[9px] px-1 select-none">
                #{idx + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-[#808080] select-none">
        <Win98Button onClick={handleRetake} className="w-[110px] whitespace-nowrap">
          ↩ 다시 찍기
        </Win98Button>
        <Win98Button
          onClick={handleNext}
          variant="primary"
          disabled={selectedOrder.length !== 4}
          className="w-[140px]"
        >
          <span className="flex flex-col items-center leading-tight">
            <span>선택 완료!</span>
            <span>필터 씌우기 →</span>
          </span>
        </Win98Button>
      </div>
    </div>
  );
};
