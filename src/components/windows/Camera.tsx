import React, { useEffect, useRef, useState } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { useCamera } from '../../hooks/useCamera';
import { Win98Button } from '../ui/Win98Button';

export const Camera: React.FC = () => {
  const { capturedPhotos, addPhoto, resetPhotos, closeWindow, openWindow } = useFlowStore();
  const { isReady, error, startCamera, stopCamera, takeSnapshot } = useCamera();

  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isShooting, setIsShooting] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [lastShotIndex, setLastShotIndex] = useState<number | null>(null);

  // Initialize camera stream
  useEffect(() => {
    if (videoRef.current) {
      startCamera(videoRef.current);
    }
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Synthesize camera shutter noise using Web Audio API
  const playShutterSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      const bufferSize = ctx.sampleRate * 0.15; // 0.15s duration
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate white noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      source.start();
    } catch (e) {
      console.warn('Audio Context shutter sound not allowed or failed:', e);
    }
  };

  // Run the sequence to take a single photo
  const triggerSingleCapture = async (photoIndex: number): Promise<string> => {
    return new Promise((resolve) => {
      let count = 3;
      setCountdown('3');
      
      const timer = setInterval(() => {
        count -= 1;
        if (count === 0) {
          setCountdown('📸');
        } else if (count === -1) {
          clearInterval(timer);
          setCountdown(null);
          
          // Flash overlay and sound
          setIsFlashing(true);
          playShutterSound();
          setTimeout(() => setIsFlashing(false), 200);

          // Take screenshot
          const photoUrl = takeSnapshot(videoRef.current);
          if (photoUrl) {
            addPhoto(photoUrl);
            setLastShotIndex(photoIndex);
          }
          resolve(photoUrl);
        } else {
          setCountdown(count.toString());
        }
      }, 900); // 900ms interval for retro snap speed
    });
  };

  // Run the automatic shooting sequence for 8 photos
  const startShootingSequence = async () => {
    if (isShooting || !isReady) return;
    setIsShooting(true);
    resetPhotos();
    setLastShotIndex(null);

    // Shoot 8 times
    for (let i = 0; i < 8; i++) {
      await triggerSingleCapture(i);
      // Brief pause between snaps
      await new Promise((r) => setTimeout(r, 800));
    }
    setIsShooting(false);
  };

  const handleNext = () => {
    if (capturedPhotos.length < 8) return;
    stopCamera();
    closeWindow('camera');
    openWindow('select');
  };

  const handleBack = () => {
    stopCamera();
    closeWindow('camera');
    openWindow('frame');
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 font-sans text-xs text-black select-none">
      {/* Left Area: Camera Viewport */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="font-bold text-sm text-[#333] border-b border-[#808080] pb-1 flex justify-between items-center">
          <span>📷 카메라 부스</span>
          <span className="flex items-center gap-1 text-[11px] text-[#000080]">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-blink" /> LIVE PREVIEW
          </span>
        </div>

        {/* Camera Feed Shell */}
        <div className="relative w-full aspect-[4/3] bg-black win-sunken overflow-hidden flex items-center justify-center">
          {error ? (
            <div className="p-4 text-center text-red-500 font-bold text-xs">
              ⚠️ {error}
            </div>
          ) : (
            <>
              {/* Camera Video tag */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />

              {/* Countdown overlays */}
              {countdown && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/20 select-none pointer-events-none">
                  <div className="text-white font-extrabold text-7xl filter drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)] animate-[ping_0.9s_ease-in-out_infinite]">
                    {countdown}
                  </div>
                </div>
              )}

              {/* Camera Flash overlay */}
              {isFlashing && (
                <div className="absolute inset-0 bg-white flash-overlay pointer-events-none" />
              )}
            </>
          )}
        </div>

        {/* Control Button & Progress */}
        <div className="flex flex-col gap-2 mt-2">
          {/* Progress bar indicator */}
          <div className="flex justify-between items-center font-bold text-xs select-none">
            <span>촬영 진행도</span>
            <span>{capturedPhotos.length} / 8장 완료</span>
          </div>
          <div className="h-4 w-full bg-[#808080] border border-[#fff] p-[1px] relative">
            <div 
              style={{ width: `${(capturedPhotos.length / 8) * 100}%` }}
              className="h-full bg-[#000080] transition-all duration-300"
            />
          </div>

          <div className="flex items-center justify-center pt-1">
            <Win98Button
              onClick={startShootingSequence}
              disabled={isShooting || !isReady}
              variant="primary"
              className="px-6 py-2 text-xs font-bold w-full sm:w-auto"
            >
              {isShooting ? '🚨 촬영 진행 중...' : '📸 8장 찰칵! 촬영 시작'}
            </Win98Button>
          </div>
        </div>
      </div>

      {/* Right Area: Thumbnail list */}
      <div className="w-full md:w-[150px] flex flex-col gap-2 shrink-0">
        <div className="font-bold text-xs text-[#333] border-b border-[#808080] pb-1">
          🎞️ 촬영된 필름
        </div>
        
        {/* 8 slot grids */}
        <div className="grid grid-cols-4 md:grid-cols-2 gap-2">
          {Array.from({ length: 8 }).map((_, idx) => {
            const photoUrl = capturedPhotos[idx];
            const isLatest = lastShotIndex === idx;
            return (
              <div 
                key={idx} 
                className="aspect-[4/3] bg-[#808080] border border-dotted border-[#fff] relative flex items-center justify-center overflow-hidden"
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`Snap ${idx + 1}`}
                    className={`w-full h-full object-cover ${
                      isLatest ? 'animate-flash-thumb' : ''
                    }`}
                  />
                ) : (
                  <span className="text-[10px] text-[#dfdfdf]">{idx + 1}</span>
                )}
                {photoUrl && (
                  <div className="absolute bottom-0 right-0 bg-black/60 text-white font-mono text-[8px] px-1">
                    #{idx + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dialog Transitions */}
        <div className="flex flex-row md:flex-col gap-2 mt-auto pt-4 md:pt-0">
          <Win98Button onClick={handleBack} disabled={isShooting} className="w-full whitespace-nowrap">
            ← 프레임 다시 고르기
          </Win98Button>
          <Win98Button
            onClick={handleNext}
            variant="primary"
            disabled={capturedPhotos.length < 8 || isShooting}
            className="w-full"
          >
            4장 고르기 →
          </Win98Button>
        </div>
      </div>
    </div>
  );
};
