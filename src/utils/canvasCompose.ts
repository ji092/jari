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
      if (filter === 'bw') {
        // Pixel-level Grayscale conversion
        const imgData = ctx.getImageData(slot.x, slot.y, slot.w, slot.h);
        const d = imgData.data;
        for (let j = 0; j < d.length; j += 4) {
          const r = d[j];
          const g = d[j + 1];
          const b = d[j + 2];
          // Classic luma coefficients for grayscale conversion
          const gray = r * 0.299 + g * 0.587 + b * 0.114;
          d[j] = gray;
          d[j + 1] = gray;
          d[j + 2] = gray;
        }
        ctx.putImageData(imgData, slot.x, slot.y);
      } else if (filter === 'soft') {
        // Pastel soft overlay (slightly pink and bright white)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
        ctx.fillStyle = 'rgba(255, 220, 240, 0.12)';
        ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
      }

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

  // 8. Render Logo Text
  if (config.logoArea) {
    ctx.fillStyle = config.textColor;
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.logoArea.text, width / 2, config.logoArea.y);
  }

  // 9. Convert Canvas to PNG Blob
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
