import { getFrameConfig } from '../constants/frames';
import { FilterType } from '../types';

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image load failed: ${src}`));
    img.src = src;
  });
};

interface ComposeParams {
  layout: '2x2' | '1x4';
  frameId: string;
  photos: string[]; // Length must be 4
  filter: FilterType;
}

// 한 슬롯 영역에 픽셀 단위 필터를 적용한다.
// (imgData.data 는 Uint8ClampedArray 라 0~255 범위를 자동 클램프한다)
const applySlotFilter = (
  ctx: CanvasRenderingContext2D,
  slot: { x: number; y: number; w: number; h: number },
  filter: FilterType
) => {
  if (filter === 'none') return;

  // 소프트(뽀샤시)는 픽셀 연산 없이 파스텔 오버레이
  if (filter === 'soft') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
    ctx.fillStyle = 'rgba(255, 220, 240, 0.12)';
    ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
    return;
  }

  const imgData = ctx.getImageData(slot.x, slot.y, slot.w, slot.h);
  const d = imgData.data;
  const w = slot.w;
  const cx = slot.w / 2;
  const cy = slot.h / 2;
  const dMax = Math.sqrt(cx * cx + cy * cy);

  // 듀오톤/트라이톤용 색상 좌표
  const NEON_C1 = [10, 25, 47];   // 딥블루
  const NEON_C2 = [255, 0, 128];  // 핫핑크
  const CP_DARK = [30, 0, 80];    // 어두운 보라
  const CP_MID = [255, 0, 128];   // 핫핑크
  const CP_LIGHT = [0, 240, 255]; // 민트/하늘

  for (let j = 0; j < d.length; j += 4) {
    const r = d[j];
    const g = d[j + 1];
    const b = d[j + 2];
    const luma = r * 0.299 + g * 0.587 + b * 0.114;

    switch (filter) {
      case 'bw': {
        d[j] = d[j + 1] = d[j + 2] = luma;
        break;
      }
      case 'sepia': {
        d[j]     = r * 0.393 + g * 0.769 + b * 0.189;
        d[j + 1] = r * 0.349 + g * 0.686 + b * 0.168;
        d[j + 2] = r * 0.272 + g * 0.534 + b * 0.131;
        break;
      }
      case 'neon': {
        const v = luma / 255;
        d[j]     = NEON_C1[0] + (NEON_C2[0] - NEON_C1[0]) * v;
        d[j + 1] = NEON_C1[1] + (NEON_C2[1] - NEON_C1[1]) * v;
        d[j + 2] = NEON_C1[2] + (NEON_C2[2] - NEON_C1[2]) * v;
        break;
      }
      case 'citypop': {
        let nr: number, ng: number, nb: number;
        if (luma < 127.5) {
          const t = luma / 127.5;
          nr = CP_DARK[0] + (CP_MID[0] - CP_DARK[0]) * t;
          ng = CP_DARK[1] + (CP_MID[1] - CP_DARK[1]) * t;
          nb = CP_DARK[2] + (CP_MID[2] - CP_DARK[2]) * t;
        } else {
          const t = (luma - 127.5) / 127.5;
          nr = CP_MID[0] + (CP_LIGHT[0] - CP_MID[0]) * t;
          ng = CP_MID[1] + (CP_LIGHT[1] - CP_MID[1]) * t;
          nb = CP_MID[2] + (CP_LIGHT[2] - CP_MID[2]) * t;
        }
        // 원본 디테일 20% 블렌딩으로 입체감 유지
        d[j]     = nr * 0.8 + r * 0.2;
        d[j + 1] = ng * 0.8 + g * 0.2;
        d[j + 2] = nb * 0.8 + b * 0.2;
        break;
      }
      case 'vignette': {
        const px = (j / 4) % w;
        const py = Math.floor(j / 4 / w);
        const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) / dMax;
        const f = 1 - dist * dist; // 1 - d^2
        d[j]     = r * f;
        d[j + 1] = g * f;
        d[j + 2] = b * f;
        break;
      }
      case 'vhs': {
        // 채도 살짝 빼고(원본:밝기 = 7:3) 청록빛 색보정 + 아날로그 그레인
        const rMuted = r * 0.7 + luma * 0.3;
        const gMuted = g * 0.7 + luma * 0.3;
        const bMuted = b * 0.7 + luma * 0.3;
        const noise = Math.random() * 40 - 20; // -20 ~ +20
        d[j]     = rMuted * 0.9 + noise;
        d[j + 1] = gMuted * 1.05 + noise;
        d[j + 2] = bMuted * 1.15 + noise;
        break;
      }
      default:
        break;
    }
  }

  ctx.putImageData(imgData, slot.x, slot.y);
};

// VHS 캠코더 타임스탬프를 전체 캔버스 우하단에 그린다.
const drawVhsTimestamp = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const stamp = `${yyyy}.${mm}.${dd} ${hh}:${min}`;

  const fontSize = Math.max(14, Math.round(width * 0.038));
  const pad = Math.round(width * 0.03);

  ctx.save();
  ctx.font = `bold ${fontSize}px 'Courier New', Courier, monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.shadowColor = 'rgba(255, 120, 0, 0.7)';
  ctx.shadowBlur = fontSize * 0.35;
  ctx.fillStyle = 'rgb(255, 30, 30)';
  ctx.fillText(stamp, width - pad, height - pad);
  ctx.restore();
};

export const canvasCompose = async ({
  layout,
  frameId,
  photos,
  filter,
}: ComposeParams): Promise<Blob> => {
  // 1. Establish canvas dimensions based on chosen layout
  const width = layout === '2x2' ? 800 : 591;
  const height = layout === '2x2' ? 800 : 1890;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D Context not supported');
  }

  // 2. Load frame configuration
  const config = getFrameConfig(frameId, layout);

  // 3. Draw frame base color
  ctx.fillStyle = config.bgColor;
  ctx.fillRect(0, 0, width, height);

  // 4. Draw frame decorative borders (Windows retro 3D frames or colored strokes)
  // Double borders around the outer edges
  ctx.strokeStyle = config.borderColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, width - 10, height - 10);
  
  ctx.strokeStyle = config.accentColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  // 5. Draw 4 photos onto their respective slots
  for (let i = 0; i < 4; i++) {
    const slot = config.slots[i];
    if (!slot || !photos[i]) continue;

    try {
      const img = await loadImage(photos[i]);
      
      // Save canvas state before clipping
      ctx.save();
      
      // Create clipping path for the slot
      ctx.beginPath();
      ctx.rect(slot.x, slot.y, slot.w, slot.h);
      ctx.clip();

      // Fit and crop image inside slot (Object-fit Cover emulation)
      const imgRatio = img.width / img.height;
      const slotRatio = slot.w / slot.h;
      let drawW = slot.w;
      let drawH = slot.h;
      let drawX = slot.x;
      let drawY = slot.y;

      if (imgRatio > slotRatio) {
        // Image is wider than slot - crop left/right
        drawW = slot.h * imgRatio;
        drawX = slot.x - (drawW - slot.w) / 2;
      } else {
        // Image is taller than slot - crop top/bottom
        drawH = slot.w / imgRatio;
        drawY = slot.y - (drawH - slot.h) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // 6. Apply filters to photo inside the clipping path
      applySlotFilter(ctx, slot, filter);

      // Restore to draw slots outer borders without clipping
      ctx.restore();

      // Draw a thin border line around each photo slot for separation
      ctx.strokeStyle = config.textColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);

    } catch (e) {
      console.error(`Error rendering photo ${i + 1} onto canvas:`, e);
      // Fallback: fill slot with dark/empty color to prevent crash
      ctx.fillStyle = '#000000';
      ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
    }
  }

  // 7. Optional Frame Overlay Image load (layout-specific, fallback if file does not exist)
  try {
    const overlayImg = await loadImage(`/frames/${frameId}/frame_${layout}.png`);
    ctx.drawImage(overlayImg, 0, 0, width, height);
  } catch (err) {
    console.log(`Note: No custom frame PNG overlay found for ${frameId}. Using default geometric rendering.`);
  }

  // 7-b. VHS 필터일 때 레트로 타임스탬프를 전체 캔버스에 합성
  if (filter === 'vhs') {
    drawVhsTimestamp(ctx, width, height);
  }

  // 8. Convert Canvas to PNG Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas to Blob conversion failed'));
        }
      },
      'image/png',
      1.0
    );
  });
};
