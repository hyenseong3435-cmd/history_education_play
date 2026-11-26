import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

const processedSpriteCache = new Map<string, string>();
const failedSpriteCache = new Set<string>();

interface RgbCluster {
  r: number;
  g: number;
  b: number;
  lum: number;
  count: number;
}

/**
 * Samples opaque neutral pixels around all four borders and extracts 1 (solid)
 * or 2 (checkerboard) dominant backdrop colors so background removal never
 * over-matches interior clothing colors.
 */
function detectBorderBackdropClusters(
  data: Uint8ClampedArray,
  w: number,
  h: number
): RgbCluster[] {
  const bins = new Map<
    number,
    { sumR: number; sumG: number; sumB: number; count: number }
  >();
  let totalNeutral = 0;

  const stepX = Math.max(1, Math.floor(w / 96));
  const stepY = Math.max(1, Math.floor(h / 64));

  const sample = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    if (data[idx + 3] < 40) return;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const lum = (r + g + b) / 3;
    // Ignore dark outline colors and saturated pixels on the border
    if (chroma > 24 || lum < 45) return;
    const binKey = Math.round(lum / 12) * 12;
    const existing = bins.get(binKey);
    if (existing) {
      existing.sumR += r;
      existing.sumG += g;
      existing.sumB += b;
      existing.count += 1;
    } else {
      bins.set(binKey, { sumR: r, sumG: g, sumB: b, count: 1 });
    }
    totalNeutral += 1;
  };

  for (let x = 0; x < w; x += stepX) {
    sample(x, 0);
    sample(x, Math.min(h - 1, 2));
    sample(x, h - 1);
    sample(x, Math.max(0, h - 3));
  }
  for (let y = 0; y < h; y += stepY) {
    sample(0, y);
    sample(Math.min(w - 1, 2), y);
    sample(w - 1, y);
    sample(Math.max(0, w - 3), y);
  }

  if (totalNeutral === 0) {
    return [{ r: 255, g: 255, b: 255, lum: 255, count: 1 }];
  }

  // Merge adjacent bins within 16 luminance units into clean clusters
  const sortedBins = Array.from(bins.entries())
    .map(([binLum, v]) => ({
      binLum,
      r: v.sumR / v.count,
      g: v.sumG / v.count,
      b: v.sumB / v.count,
      lum: (v.sumR + v.sumG + v.sumB) / (3 * v.count),
      count: v.count,
    }))
    .sort((a, b) => b.count - a.count);

  const clusters: RgbCluster[] = [];
  for (const bin of sortedBins) {
    const match = clusters.find((c) => Math.abs(c.lum - bin.lum) <= 20);
    if (match) {
      const nextCount = match.count + bin.count;
      match.r = (match.r * match.count + bin.r * bin.count) / nextCount;
      match.g = (match.g * match.count + bin.g * bin.count) / nextCount;
      match.b = (match.b * match.count + bin.b * bin.count) / nextCount;
      match.lum = (match.r + match.g + match.b) / 3;
      match.count = nextCount;
    } else {
      clusters.push({
        r: bin.r,
        g: bin.g,
        b: bin.b,
        lum: bin.lum,
        count: bin.count,
      });
    }
  }

  clusters.sort((a, b) => b.count - a.count);
  const primary = clusters[0];
  const result: RgbCluster[] = [primary];

  // Keep a second dominant neutral color if this is a checkerboard backdrop
  if (
    clusters.length > 1 &&
    clusters[1].count >= totalNeutral * 0.12 &&
    Math.abs(clusters[1].lum - primary.lum) >= 22
  ) {
    result.push(clusters[1]);
  }

  return result;
}

/**
 * Strips solid (white, light-gray, mid-gray, dark-gray) and 2-tone checkerboard
 * backgrounds at full native sprite resolution so 1px pixel-art outlines stay
 * completely intact and clothing colors are never eaten by flood-fill.
 */
function stripPixelSpriteBackground(img: HTMLImageElement): string {
  // Always work at full native resolution so thin dark outlines never break
  const w = Math.max(1, img.naturalWidth);
  const h = Math.max(1, img.naturalHeight);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return img.src;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const clusters = detectBorderBackdropClusters(data, w, h);
  const isCheckerboard = clusters.length >= 2;
  const minClusterLum = Math.min(...clusters.map((c) => c.lum));
  const maxClusterLum = Math.max(...clusters.map((c) => c.lum));
  const distSqThreshold = isCheckerboard ? 30 * 30 : 26 * 26;

  const matchesBackdrop = (idx: number, extraTol = 0): boolean => {
    const a = data[idx + 3];
    if (a < 30) return true;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const chroma = maxC - minC;
    const lum = (r + g + b) / 3;

    // Never match dark character outlines or saturated clothing pixels
    if (lum < 44 || chroma > 24 + extraTol * 0.4) return false;

    const tolSq =
      extraTol > 0
        ? (Math.sqrt(distSqThreshold) + extraTol) ** 2
        : distSqThreshold;

    for (let i = 0; i < clusters.length; i++) {
      const c = clusters[i];
      const dr = r - c.r;
      const dg = g - c.g;
      const db = b - c.b;
      if (dr * dr + dg * dg + db * db <= tolSq) {
        return true;
      }
    }

    // For JPEG-compressed checkerboards, allow neutral transition pixels
    // strictly between the two checkerboard luminances.
    if (
      isCheckerboard &&
      chroma <= 18 &&
      lum >= minClusterLum - 12 &&
      lum <= maxClusterLum + 12
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
    if (matchesBackdrop(pos * 4)) {
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
      if (!visited[n] && matchesBackdrop(n * 4)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (x < w - 1) {
      const n = pos + 1;
      if (!visited[n] && matchesBackdrop(n * 4)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (y > 0) {
      const n = pos - w;
      if (!visited[n] && matchesBackdrop(n * 4)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (y < h - 1) {
      const n = pos + w;
      if (!visited[n] && matchesBackdrop(n * 4)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
  }

  // Clean only 1px outer JPEG anti-alias halo pixels strictly close to the
  // detected backdrop color(s); never touch clothing interiors or collars.
  const fringePositions: number[] = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const pos = y * w + x;
      const idx = pos * 4;
      if (data[idx + 3] === 0) continue;
      if (
        data[(pos - 1) * 4 + 3] === 0 ||
        data[(pos + 1) * 4 + 3] === 0 ||
        data[(pos - w) * 4 + 3] === 0 ||
        data[(pos + w) * 4 + 3] === 0
      ) {
        if (matchesBackdrop(idx, 12)) {
          fringePositions.push(pos);
        }
      }
    }
  }
  for (let i = 0; i < fringePositions.length; i++) {
    data[fringePositions[i] * 4 + 3] = 0;
  }

  // Clear isolated bottom-right sparkle watermark corner (characters sit centered)
  const wmStartX = Math.floor(w * 0.85);
  const wmStartY = Math.floor(h * 0.76);
  for (let y = wmStartY; y < h; y++) {
    for (let x = wmStartX; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] > 0) {
        const chroma =
          Math.max(data[idx], data[idx + 1], data[idx + 2]) -
          Math.min(data[idx], data[idx + 1], data[idx + 2]);
        if (chroma <= 26) {
          data[idx + 3] = 0;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Tight bounding box crop around visible character silhouette
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

  if (!found || maxX - minX < 16 || maxY - minY < 16) {
    return img.src;
  }

  const pad = 6;
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
