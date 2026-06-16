import { useState, useCallback, useRef } from 'react';

export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async (videoElement: HTMLVideoElement | null) => {
    if (!videoElement) return;
    
    // Stop any existing streams first
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    setIsReady(false);
    setError(null);

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: 'user', // Default to front camera
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false, // No microphone needed
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      activeStreamRef.current = mediaStream;
      setStream(mediaStream);
      
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

    // Draw the current video frame onto the canvas
    // Flip horizontally to match mirror preview UX
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Output high quality JPEG data URL
    return canvas.toDataURL('image/jpeg', 0.92);
  }, [isReady]);

  return {
    stream,
    isReady,
    error,
    startCamera,
    stopCamera,
    takeSnapshot,
  };
};
