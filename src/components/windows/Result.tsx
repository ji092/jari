import React, { useEffect, useState } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { Win98Button } from '../ui/Win98Button';
import { canvasCompose } from '../../utils/canvasCompose';
import { FilterType } from '../../types';

export const Result: React.FC = () => {
  const { 
    selectedLayout, 
    selectedFrameId, 
    capturedPhotos, 
    selectedOrder, 
    currentFilter, 
    setFilter, 
    resetAll, 
    closeWindow, 
    openWindow 
  } = useFlowStore();

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState(false);
  const [blobData, setBlobData] = useState<Blob | null>(null);

  // Compile photos ordered by user selections
  const orderedPhotos = selectedOrder.map((idx) => capturedPhotos[idx]);

  useEffect(() => {
    let active = true;
    
    const composeImage = async () => {
      if (!selectedLayout || !selectedFrameId || orderedPhotos.length !== 4) return;
      
      setIsGenerating(true);
      setError(false);

      try {
        const blob = await canvasCompose({
          layout: selectedLayout,
          frameId: selectedFrameId,
          photos: orderedPhotos,
          filter: currentFilter,
        });

        if (!active) return;
        setBlobData(blob);

        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev); // clean up memory leaks
          return url;
        });
      } catch (err) {
        console.error(err);
        if (active) setError(true);
      } finally {
        if (active) setIsGenerating(false);
      }
    };

    composeImage();

    return () => {
      active = false;
    };
  }, [selectedLayout, selectedFrameId, currentFilter, selectedOrder]);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDownload = async () => {
    if (!blobData) return;

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, '');
    const filename = `zarinaecut_${timestamp}.png`;

    // 모바일: Web Share API로 네이티브 공유 시트 호출
    if (navigator.share && navigator.canShare) {
      const file = new File([blobData], filename, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: '자리네컷' });
          return;
        } catch (e: any) {
          if (e?.name === 'AbortError') return; // 사용자가 취소한 경우
        }
      }
    }

    // PC 폴백: 기존 앵커 다운로드
    try {
      const url = URL.createObjectURL(blobData);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('이미지를 길게 눌러 저장해 주세요.');
    }
  };

  const handleRestart = () => {
    if (confirm('만들어진 사진을 저장하셨나요? 처음 단계로 돌아갑니다.')) {
      resetAll();
      closeWindow('result');
      openWindow('camera');
    }
  };

  const filterTabs: { label: string; value: FilterType }[] = [
    { label: '원본 (Normal)', value: 'none' },
    { label: '흑백 (Retro B&W)', value: 'bw' },
    { label: '뽀샤시 (Soft Soft)', value: 'soft' },
  ];

  const layoutLabel = selectedLayout === '2x2' ? '2 × 2 배열' : '1 × 4 세로 배열';

  return (
    <div className="flex flex-col gap-4 font-sans text-xs text-black select-none max-w-full">
      {/* Dynamic Summary Info */}
      <div className="border-b border-[#808080] pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center select-none gap-2">
        <span className="font-bold text-sm text-[#333]">★ 촬영 완료! 인생샷 탄생 ★</span>
        <span className="bg-[#000080] text-white text-[10px] px-2 py-0.5 font-bold">
          {layoutLabel}
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center md:items-stretch">
        
        {/* Left: Preview Canvas Shell */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 win-sunken bg-[#808080] min-h-[300px] w-full relative">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center text-white font-bold gap-2">
              <span>⌛ 이미지 합성 및 필터링 적용 중...</span>
            </div>
          ) : error ? (
            <div className="text-red-300 font-bold">⚠️ 이미지 렌더링 중 오류가 발생했습니다.</div>
          ) : (
            <div className="flex items-center justify-center max-w-full overflow-hidden">
              {/* Responsive size limits matching actual ratios */}
              <img
                src={previewUrl}
                alt="Zarinaecut composite preview"
                className={`win-raised border border-white max-h-[480px] sm:max-h-[500px] object-contain ${
                  selectedLayout === '2x2' 
                    ? 'w-full max-w-[320px]' 
                    : 'w-[150px] sm:w-[170px]'
                }`}
              />
            </div>
          )}
        </div>

        {/* Right: Operations & Filter Switcher */}
        <div className="w-full md:w-[180px] flex flex-col gap-3 shrink-0">
          {/* Step 3: Filter Selector Tabs */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-[#333] select-none">필터 선택</span>
            <div className="flex flex-col gap-1.5">
              {filterTabs.map((tab) => {
                const isActive = currentFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    disabled={isGenerating}
                    className={`px-3 py-1.5 text-xs text-left outline-none ${
                      isActive
                        ? 'border-t-2 border-l-2 border-[#808080] border-b-2 border-r-2 border-[#fff] bg-[#e6e6e6] shadow-[-1px_-1px_0px_0px_#000] font-bold'
                        : 'win-raised bg-[#c0c0c0] hover:bg-[#d5d5d5]'
                    }`}
                  >
                    {isActive ? '➔ ' : ''} {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security Banner Info */}
          <div className="p-2 text-[10px] bg-[#fffff0] border border-dotted border-gray-400 leading-normal text-gray-700 mt-2 select-none">
            🔒 <strong>안심 보안 안내:</strong> 사용자의 사진은 브라우저 캔버스를 통해서만 합성되며, 어떠한 데이터도 서버로 전송되지 않습니다.
          </div>

          {/* Action Operations */}
          <div className="flex flex-col gap-2 mt-auto pt-4 md:pt-0">
            <Win98Button
              onClick={handleDownload}
              variant="primary"
              disabled={isGenerating || error || !blobData}
              className="py-2.5 w-full text-xs font-bold"
            >
              💾 기기에 저장하기
            </Win98Button>
            
            <Win98Button onClick={handleRestart} disabled={isGenerating} className="py-2.5 w-full text-xs">
              🔄 처음부터 다시 찍기
            </Win98Button>
          </div>
        </div>

      </div>
    </div>
  );
};
