import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

const processedSpriteCache = new Map<string, string>();
const failedSpriteCache = new Set<string>();

/**
 * Removes solid white, solid gray, and checkerboard neutral backgrounds from
 * 16-bit pixel art sprites using border-seeded flood-fill, then crops tightly
 * to the character silhouette so sprites stand cleanly over game backgrounds.
 */
function stripPixelSpriteBackground(img: HTMLImageElement): string {
  const maxWidth = 640;
  const scale = img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return img.src;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Inspect border pixels to detect whether this sprite sits on a solid dark-gray
  // neutral backdrop (e.g., RGB ~75-95) in addition to light/mid-gray or white.
  const borderSamples: number[] = [];
  const sampleStepX = Math.max(1, Math.floor(w / 16));
  const sampleStepY = Math.max(1, Math.floor(h / 12));
  const collectBorder = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    if (data[idx + 3] < 30) return;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    if (Math.max(r, g, b) - Math.min(r, g, b) <= 18) {
      borderSamples.push((r + g + b) / 3);
    }
  };
  for (let x = 0; x < w; x += sampleStepX) {
    collectBorder(x, 0);
    collectBorder(x, h - 1);
  }
  for (let y = 0; y < h; y += sampleStepY) {
    collectBorder(0, y);
    collectBorder(w - 1, y);
  }
  borderSamples.sort((a, b) => a - b);
  const borderMedianLum =
    borderSamples.length > 0
      ? borderSamples[Math.floor(borderSamples.length / 2)]
      : 200;
  const hasDarkNeutralBackdrop = borderMedianLum >= 58 && borderMedianLum < 105;

  const isNeutralBg = (idx: number): boolean => {
    const a = data[idx + 3];
    if (a < 30) return true;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const chroma = maxC - minC;
    const lum = (r + g + b) / 3;
    // Standard white / light-gray / mid-gray / checkerboard backdrop
    if (chroma <= 22 && lum >= 92) return true;
    // Solid dark-gray backdrop (protected by dark pixel outlines where lum < 45)
    if (
      hasDarkNeutralBackdrop &&
      chroma <= 18 &&
      lum >= 55 &&
      Math.abs(lum - borderMedianLum) <= 22
    ) {
      return true;
    }
    return false;
  };

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const trySeed = (x: number, y: number) => {
    const pos = y * w + x;
    if (visited[pos]) return;
    if (isNeutralBg(pos * 4)) {
      visited[pos] = 1;
      queue[tail++] = pos;
    }
  };

  // Seed all 4 borders
  for (let x = 0; x < w; x++) {
    trySeed(x, 0);
    trySeed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    trySeed(0, y);
    trySeed(w - 1, y);
  }

  while (head < tail) {
    const pos = queue[head++];
    const x = pos % w;
    const y = (pos - x) / w;
    data[pos * 4 + 3] = 0;

    if (x > 0) {
      const n = pos - 1;
      if (!visited[n] && isNeutralBg(n * 4)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (x < w - 1) {
      const n = pos + 1;
      if (!visited[n] && isNeutralBg(n * 4)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (y > 0) {
      const n = pos - w;
      if (!visited[n] && isNeutralBg(n * 4)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (y < h - 1) {
      const n = pos + w;
      if (!visited[n] && isNeutralBg(n * 4)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
  }

  // Softly clean 1px neutral anti-alias fringe touching transparent pixels
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const pos = y * w + x;
      const idx = pos * 4;
      if (data[idx + 3] === 0) continue;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      const lum = (r + g + b) / 3;
      const isFringe =
        (chroma <= 24 && lum >= 150) ||
        (hasDarkNeutralBackdrop &&
          chroma <= 20 &&
          lum >= 55 &&
          Math.abs(lum - borderMedianLum) <= 26);
      if (isFringe) {
        if (
          data[(pos - 1) * 4 + 3] === 0 ||
          data[(pos + 1) * 4 + 3] === 0 ||
          data[(pos - w) * 4 + 3] === 0 ||
          data[(pos + w) * 4 + 3] === 0
        ) {
          data[idx + 3] = 0;
        }
      }
    }
  }

  // Clean small isolated bottom-right watermark corner (if any neutral dots remain)
  const wmStartX = Math.floor(w * 0.86);
  const wmStartY = Math.floor(h * 0.78);
  for (let y = wmStartY; y < h; y++) {
    for (let x = wmStartX; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] > 0) {
        const chroma =
          Math.max(data[idx], data[idx + 1], data[idx + 2]) -
          Math.min(data[idx], data[idx + 1], data[idx + 2]);
        if (chroma <= 25) {
          data[idx + 3] = 0;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Tight bounding box crop around visible character pixels
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found || maxX - minX < 10 || maxY - minY < 10) {
    return img.src;
  }

  const pad = 4;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(w - cropX, maxX - minX + 1 + pad * 2);
  const cropH = Math.min(h - cropY, maxY - minY + 1 + pad * 2);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = cropW;
  outCanvas.height = cropH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return img.src;
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return outCanvas.toDataURL('image/png');
}

interface PixelSpriteProps {
  src: string;
  alt: string;
  className?: string;
  fallbackName?: string;
}

export function PixelSprite({
  src,
  alt,
  className = '',
  fallbackName,
}: PixelSpriteProps) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(() =>
    processedSpriteCache.get(src) ?? null
  );
  const [failed, setFailed] = useState<boolean>(() => failedSpriteCache.has(src));

  useEffect(() => {
    if (processedSpriteCache.has(src)) {
      setProcessedSrc(processedSpriteCache.get(src)!);
      setFailed(false);
      return;
    }
    if (failedSpriteCache.has(src)) {
      setFailed(true);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      if (cancelled) return;
      try {
        const result = stripPixelSpriteBackground(img);
        processedSpriteCache.set(src, result);
        setProcessedSrc(result);
        setFailed(false);
      } catch {
        processedSpriteCache.set(src, src);
        setProcessedSrc(src);
        setFailed(false);
      }
    };

    img.onerror = () => {
      if (cancelled) return;
      failedSpriteCache.add(src);
      setFailed(true);
    };

    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#15171A]/92 border border-[#343841] px-4 py-6 text-[#B8B4AC] ${className}`}
        role="img"
        aria-label={alt}
      >
        <User className="w-10 h-10 mb-2 opacity-70" />
        <span className="text-xs font-editorial text-center">
          {fallbackName ?? alt}
        </span>
      </div>
    );
  }

  if (!processedSrc) {
    return (
      <div
        className={`opacity-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={processedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      draggable={false}
      className={`pixel-art select-none object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.65)] ${className}`}
    />
  );
}
