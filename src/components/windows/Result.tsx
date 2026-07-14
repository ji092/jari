import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { Win98Button } from '../ui/Win98Button';
import { canvasCompose } from '../../utils/canvasCompose';
import { FilterType } from '../../types';

// ── 드로잉 stroke 모델 (native 캔버스 좌표 기준) ─────────────────────────────
interface Point { x: number; y: number; }
interface Stroke {
  color: string;
  size: number;
  erase: boolean;
  points: Point[];
}

const PEN_COLORS = ['#000000', '#ffffff', '#e94560', '#ff8c00', '#ffd500', '#2ecc40', '#0074d9', '#ff69b4'];
const PEN_SIZES: { label: string; value: number }[] = [
  { label: '얇게', value: 6 },
  { label: '보통', value: 14 },
  { label: '굵게', value: 28 },
];

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('base image load failed'));
    img.src = src;
  });

// stroke 배열을 주어진 컨텍스트에 그린다 (지우개는 destination-out)
const paintStrokes = (ctx: CanvasRenderingContext2D, strokes: Stroke[]) => {
  for (const st of strokes) {
    ctx.globalCompositeOperation = st.erase ? 'destination-out' : 'source-over';
    ctx.strokeStyle = st.color;
    ctx.fillStyle = st.color;
    ctx.lineWidth = st.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pts = st.points;
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, st.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (pts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
};

export const Result: React.FC = () => {
  const {
    selectedLayout,
    selectedFrameId,
    capturedPhotos,
    selectedOrder,
    currentFilter,
    setFilter,
    resetAll,
    openWindow,
  } = useFlowStore();

  // 표시/다운로드용 (사진 + 드로잉 합성 결과)
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [blobData, setBlobData] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(false);

  // 원본 합성본(드로잉 미포함) — 그리기 배경/합성 재료로 사용
  // ref: async 클로저에서 최신값 접근 / state: 렌더(그리기 배경 img)용
  const baseDataUrlRef = useRef<string>('');
  const [baseDataUrl, setBaseDataUrl] = useState<string>('');

  // 드로잉 상태
  const [mode, setMode] = useState<'view' | 'draw'>('view');
  const [penColor, setPenColor] = useState<string>('#e94560');
  const [penSize, setPenSize] = useState<number>(14);
  const [isErasing, setIsErasing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0); // undo 버튼 활성화 트리거
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);

  // 카카오톡/인스타 등 인앱 브라우저: blob 저장이 막혀 data URL로 표시해야 함
  const isInAppBrowser = typeof navigator !== 'undefined' &&
    /KAKAOTALK|kakaotalk|Instagram|FBAN|FBAV|NAVER|Line\//i.test(navigator.userAgent);
  const isKakaoTalk = typeof navigator !== 'undefined' &&
    /KAKAOTALK|kakaotalk/i.test(navigator.userAgent);

  const dims = selectedLayout === '2x2' ? { w: 800, h: 800 } : { w: 591, h: 1890 };

  const orderedPhotos = selectedOrder.map((idx) => capturedPhotos[idx]);

  // 사진(원본 합성본) + 드로잉 stroke → 최종 합성 결과 생성
  const buildDisplay = useCallback(async (baseUrl: string): Promise<{ blob: Blob; url: string }> => {
    const strokes = strokesRef.current;
    const baseImg = await loadImage(baseUrl);

    const out = document.createElement('canvas');
    out.width = dims.w;
    out.height = dims.h;
    const octx = out.getContext('2d')!;
    octx.drawImage(baseImg, 0, 0, dims.w, dims.h);

    if (strokes.length > 0) {
      // stroke 전용 레이어에 먼저 그려(지우개가 사진을 지우지 않도록) 위에 합성
      const layer = document.createElement('canvas');
      layer.width = dims.w;
      layer.height = dims.h;
      paintStrokes(layer.getContext('2d')!, strokes);
      octx.drawImage(layer, 0, 0);
    }

    const url = out.toDataURL('image/png');
    const blob: Blob = await new Promise((res, rej) =>
      out.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png', 1.0)
    );
    return { blob, url };
  }, [dims.w, dims.h]);

  // 현재 base + 드로잉으로 표시/다운로드 상태 갱신
  const refreshDisplay = useCallback(async () => {
    if (!baseDataUrlRef.current) return;
    const { blob, url } = await buildDisplay(baseDataUrlRef.current);
    setBlobData(blob);
    setDataUrl(url);
    setPreviewUrl(URL.createObjectURL(blob));
  }, [buildDisplay]);

  // 필터/선택 변경 시 원본 합성본 재생성 후 표시 갱신 (드로잉은 유지)
  useEffect(() => {
    let active = true;
    const composeImage = async () => {
      if (!selectedLayout || !selectedFrameId || orderedPhotos.length !== 4) {
        setIsGenerating(false);
        return;
      }
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

        // base 합성본을 data URL로 보관
        const baseUrl: string = await new Promise((res) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result as string);
          reader.readAsDataURL(blob);
        });
        if (!active) return;
        baseDataUrlRef.current = baseUrl;
        setBaseDataUrl(baseUrl);

        const { blob: dispBlob, url } = await buildDisplay(baseUrl);
        if (!active) return;
        setBlobData(dispBlob);
        setDataUrl(url);
        setPreviewUrl(URL.createObjectURL(dispBlob));
      } catch (err) {
        console.error(err);
        if (active) setError(true);
      } finally {
        if (active) setIsGenerating(false);
      }
    };
    composeImage();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayout, selectedFrameId, currentFilter, selectedOrder]);

  // object URL 정리
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // 그리기 모드 진입 시 캔버스 초기화 + 기존 stroke 복원
  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    canvas.width = dims.w;
    canvas.height = dims.h;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, dims.w, dims.h);
    paintStrokes(ctx, strokesRef.current);
  }, [mode, dims.w, dims.h]);

  // ── 포인터(마우스+터치) 드로잉 핸들러 ──────────────────────────────────────
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = drawCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const drawSegment = (from: Point, to: Point, st: Stroke) => {
    const ctx = drawCanvasRef.current!.getContext('2d')!;
    ctx.globalCompositeOperation = st.erase ? 'destination-out' : 'source-over';
    ctx.strokeStyle = st.color;
    ctx.lineWidth = st.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    drawCanvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const pos = getPos(e);
    const stroke: Stroke = { color: penColor, size: penSize, erase: isErasing, points: [pos] };
    currentStrokeRef.current = stroke;
    // 점 하나 찍기
    const ctx = drawCanvasRef.current!.getContext('2d')!;
    ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
    ctx.fillStyle = stroke.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !currentStrokeRef.current) return;
    e.preventDefault();
    const st = currentStrokeRef.current;
    const prev = st.points[st.points.length - 1];
    const pos = getPos(e);
    st.points.push(pos);
    drawSegment(prev, pos, st);
  };

  const endStroke = () => {
    if (!drawingRef.current || !currentStrokeRef.current) return;
    drawingRef.current = false;
    strokesRef.current.push(currentStrokeRef.current);
    currentStrokeRef.current = null;
    setStrokeCount(strokesRef.current.length);
  };

  const redrawCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paintStrokes(ctx, strokesRef.current);
  };

  const handleUndo = () => {
    strokesRef.current.pop();
    setStrokeCount(strokesRef.current.length);
    redrawCanvas();
  };

  const handleClearDrawing = () => {
    strokesRef.current = [];
    setStrokeCount(0);
    redrawCanvas();
  };

  const enterDraw = () => setMode('draw');

  const finishDraw = async () => {
    setMode('view');
    setIsErasing(false);
    await refreshDisplay(); // 사진 + 드로잉 합성본으로 표시/다운로드 갱신
  };

  // ── 다운로드 ────────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!blobData) return;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, '');
    const filename = `zarinaecut_${timestamp}.png`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile && navigator.share && navigator.canShare) {
      const file = new File([blobData], filename, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: '자리네컷' });
          return;
        } catch (e) {
          if ((e as { name?: string })?.name === 'AbortError') return;
        }
      }
    }

    try {
      const url = URL.createObjectURL(blobData);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      alert('이미지를 길게 눌러 저장해 주세요.');
    }
  };

  const handleRestart = () => {
    if (confirm('만들어진 사진을 저장하셨나요? 처음 단계로 돌아갑니다.')) {
      resetAll();
      openWindow('frame');
    }
  };

  const filterTabs: { label: string; value: FilterType }[] = [
    { label: '원본 (Normal)', value: 'none' },
    { label: '흑백 (Retro B&W)', value: 'bw' },
    { label: '뽀샤시 (Soft Soft)', value: 'soft' },
    { label: '세피아 (Sepia)', value: 'sepia' },
    { label: '네온 (Neon Duotone)', value: 'neon' },
    { label: '비네팅 (Vignette)', value: 'vignette' },
    { label: '시티팝 (City Pop)', value: 'citypop' },
    { label: 'Y2K 캠코더 (VHS)', value: 'vhs' },
  ];

  const layoutLabel = selectedLayout === '2x2' ? '2 × 2 배열' : '1 × 4 세로 배열';
  const isDraw = mode === 'draw';

  return (
    <div className="flex flex-col gap-4 font-sans text-xs text-black select-none max-w-full">
      <div className="border-b border-[#808080] pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center select-none gap-2">
        <span className="font-bold text-sm text-[#333]">★ 촬영 완료! 인생샷 탄생 ★</span>
        <span className="bg-[#000080] text-white text-[10px] px-2 py-0.5 font-bold">{layoutLabel}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center md:items-stretch">
        {/* Left: Preview / Drawing */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 win-sunken bg-[#808080] min-h-[300px] w-full relative">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center text-white font-bold gap-2">
              <span>⌛ 이미지 합성 및 필터링 적용 중...</span>
            </div>
          ) : error ? (
            <div className="text-red-300 font-bold">⚠️ 이미지 렌더링 중 오류가 발생했습니다.</div>
          ) : (
            <div className="flex flex-col items-center justify-center max-w-full overflow-hidden gap-2">
              {/* 사진(배경) + 드로잉 캔버스(오버레이) */}
              <div
                className="relative win-raised border border-white"
                style={{
                  aspectRatio: `${dims.w} / ${dims.h}`,
                  width: selectedLayout === '2x2' ? 'min(320px, 80vw)' : 'min(170px, 45vw)',
                  maxHeight: '500px',
                }}
              >
                <img
                  src={isDraw ? baseDataUrl : (isInAppBrowser ? (dataUrl || previewUrl) : previewUrl)}
                  alt="Zarinaecut composite preview"
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />
                <canvas
                  ref={drawCanvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endStroke}
                  onPointerCancel={endStroke}
                  onPointerLeave={endStroke}
                  className="absolute inset-0 w-full h-full"
                  style={{
                    touchAction: 'none',
                    pointerEvents: isDraw ? 'auto' : 'none',
                    cursor: isDraw ? 'crosshair' : 'default',
                    // 그리기 모드에서는 오버레이 캔버스가 실시간 stroke를 보여주고,
                    // 보기 모드에서는 합성된 img가 이미 드로잉을 포함하므로 캔버스는 숨긴다.
                    opacity: isDraw ? 1 : 0,
                  }}
                />
              </div>

              {isDraw ? (
                <p className="text-white text-[11px] font-bold text-center bg-black/50 px-3 py-1.5 rounded">
                  ✏️ 화면에 자유롭게 그려보세요
                </p>
              ) : isInAppBrowser ? (
                <p className="text-white text-[11px] font-bold text-center bg-black/50 px-3 py-1.5 rounded">
                  📌 이미지를 길게 눌러 저장하세요
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* Right: 도구 패널 */}
        <div className="w-full md:w-[180px] flex flex-col gap-3 shrink-0">
          {isDraw ? (
            /* ── 드로잉 도구 ─────────────────────────────── */
            <div className="flex flex-col gap-3">
              <span className="font-bold text-[#333] select-none">🎨 그리기 도구</span>

              {/* 색상 팔레트 */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-[#333]">색상</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {PEN_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setPenColor(c); setIsErasing(false); }}
                      className={`w-7 h-7 border-2 ${
                        !isErasing && penColor === c ? 'border-[#000080] shadow-[0_0_0_1px_#fff_inset]' : 'border-[#808080]'
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`색상 ${c}`}
                    />
                  ))}
                </div>
              </div>

              {/* 굵기 */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-[#333]">굵기</span>
                <div className="flex gap-1.5">
                  {PEN_SIZES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setPenSize(s.value)}
                      className={`flex-1 px-1 py-1 text-[11px] ${
                        penSize === s.value
                          ? 'border-t-2 border-l-2 border-[#808080] border-b-2 border-r-2 border-[#fff] bg-[#e6e6e6] font-bold'
                          : 'win-raised bg-[#c0c0c0] hover:bg-[#d5d5d5]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 지우개 / 되돌리기 / 전체지우기 */}
              <div className="flex flex-col gap-1.5">
                <Win98Button
                  onClick={() => setIsErasing((v) => !v)}
                  className={`w-full text-xs py-1.5 ${isErasing ? 'font-bold bg-[#e6e6e6]' : ''}`}
                >
                  🧽 지우개 {isErasing ? 'ON' : 'OFF'}
                </Win98Button>
                <div className="flex gap-1.5">
                  <Win98Button onClick={handleUndo} disabled={strokeCount === 0} className="flex-1 text-xs py-1.5">
                    ↩️ 되돌리기
                  </Win98Button>
                  <Win98Button onClick={handleClearDrawing} disabled={strokeCount === 0} className="flex-1 text-xs py-1.5">
                    🗑️ 전체
                  </Win98Button>
                </div>
              </div>

              <Win98Button onClick={finishDraw} variant="primary" className="w-full text-xs py-2 font-bold mt-1">
                ✓ 그리기 완료
              </Win98Button>
            </div>
          ) : (
            /* ── 필터 + 액션 ─────────────────────────────── */
            <>
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

              {/* 드로잉 진입 */}
              <Win98Button
                onClick={enterDraw}
                disabled={isGenerating || error || !blobData}
                className="w-full text-xs py-2 font-bold"
              >
                ✏️ 그림 그리기 {strokeCount > 0 ? '(수정)' : ''}
              </Win98Button>

              <div className="p-2 text-[10px] bg-[#fffff0] border border-dotted border-gray-400 leading-normal text-gray-700 select-none">
                🔒 <strong>안심 보안 안내:</strong> 사용자의 사진은 브라우저 캔버스를 통해서만 합성되며, 어떠한 데이터도 서버로 전송되지 않습니다.
              </div>

              <div className="flex flex-col gap-2 mt-auto pt-4 md:pt-0">
                {isInAppBrowser ? (
                  <div className="py-2 px-3 text-[11px] text-center bg-[#fffff0] border border-dotted border-gray-400 leading-relaxed text-gray-700">
                    📌 {isKakaoTalk ? '카카오톡' : '인앱 브라우저'}에서는<br />
                    <strong>위 이미지를 길게 눌러</strong><br />
                    저장해 주세요
                  </div>
                ) : (
                  <Win98Button
                    onClick={handleDownload}
                    variant="primary"
                    disabled={isGenerating || error || !blobData}
                    className="py-2.5 w-full text-xs font-bold"
                  >
                    💾 기기에 저장하기
                  </Win98Button>
                )}

                <Win98Button onClick={handleRestart} disabled={isGenerating} className="py-2.5 w-full text-xs">
                  🔄 처음부터 다시 찍기
                </Win98Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
