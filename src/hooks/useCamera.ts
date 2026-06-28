import { useState, useCallback, useRef } from 'react';

type FacingMode = 'user' | 'environment';

// 인생네컷 특유의 화사하고 뽀샤시한 보정 필터 (라이브 프리뷰 & 캡처 동일 적용)
export const BEAUTY_FILTER = 'brightness(1.08) contrast(0.95) saturate(1.15) blur(0.4px)';

export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('user');
  const activeStreamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = useCallback(async (videoElement: HTMLVideoElement | null, mode: FacingMode = 'user') => {
    if (!videoElement) return;

    videoElementRef.current = videoElement;

    // Stop any existing streams first
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    setIsReady(false);
    setError(null);

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: mode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false, // No microphone needed
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      activeStreamRef.current = mediaStream;
      setStream(mediaStream);
      setFacingMode(mode);

      videoElement.srcObject = mediaStream;
      videoElement.onloadedmetadata = () => {
        videoElement.play().catch((e) => {
          console.error("Video play failed:", e);
        });
        setIsReady(true);
      };
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('카메라 권한이 필요해요. 브라우저 설정에서 허용해주세요.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('사용 가능한 카메라 장치를 찾을 수 없습니다.');
      } else {
        setError('카메라를 시작하는 중 오류가 발생했습니다. HTTPS 환경인지 확인하세요.');
      }
    }
  }, []);

  const switchCamera = useCallback(async () => {
    const nextMode: FacingMode = facingMode === 'user' ? 'environment' : 'user';
    await startCamera(videoElementRef.current, nextMode);
  }, [facingMode, startCamera]);

  const stopCamera = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }
    setStream(null);
    setIsReady(false);
  }, []);

  const takeSnapshot = useCallback((videoElement: HTMLVideoElement | null): string => {
    if (!videoElement || !isReady) return '';

    const canvas = document.createElement('canvas');
    // Maintain native video dimensions
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 전면 카메라만 미러링 (후면은 실제 보이는 그대로)
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    // 라이브 프리뷰와 동일한 화사 보정을 캡처본에도 동일하게 베이크
    ctx.filter = BEAUTY_FILTER;
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Output high quality JPEG data URL
    return canvas.toDataURL('image/jpeg', 0.92);
  }, [isReady, facingMode]);

  return {
    stream,
    isReady,
    error,
    facingMode,
    startCamera,
    stopCamera,
    switchCamera,
    takeSnapshot,
  };
};
