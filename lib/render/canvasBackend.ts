import type { GlobalSettings, Page } from "@/lib/types";
import { mulberry32 } from "@/lib/handwriting/jitter";
import { getMargins, layoutText, LayoutLine } from "@/lib/render/layout";

export const PAGE_WIDTH_PX = 794;
export const PAGE_HEIGHT_PX = 1123;

const imageCache = new Map<string, HTMLImageElement>();

// Full-page offscreen canvases are ~3.5MB each; cap the cache so typing
// (which mints new keys every keystroke) cannot grow memory unboundedly.
const textCache = new Map<string, HTMLCanvasElement>();
const MAX_TEXT_CACHE_ENTRIES = 30;

// Layout covers the whole document, so every page (main canvas + each
// thumbnail) shares one computation per content/settings change.
let layoutMemo: { key: string; lines: LayoutLine[] } | null = null;

function drawRuledPaper(ctx: CanvasRenderingContext2D, settings: GlobalSettings) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PAGE_WIDTH_PX, PAGE_HEIGHT_PX);
  const margins = getMargins(settings.marginPreset);
  const lineHeight = settings.fontSize * settings.lineSpacing;
  const effectiveTop = settings.topMargin ?? 105;
  const effectiveLeft = settings.leftMargin ?? 105;

  ctx.strokeStyle = "#b9c9e6";
  ctx.lineWidth = 1;
  for (let y = effectiveTop + settings.fontSize; y < PAGE_HEIGHT_PX - margins.bottom; y += lineHeight) {
    ctx.beginPath();
    ctx.moveTo(margins.left, y + 4);
    ctx.lineTo(PAGE_WIDTH_PX - margins.right, y + 4);
    ctx.stroke();
  }
  ctx.strokeStyle = "#e39aa0";
  ctx.beginPath();
  ctx.moveTo(effectiveLeft - 5, 0);
  ctx.lineTo(effectiveLeft - 5, PAGE_HEIGHT_PX);
  ctx.stroke();

  ctx.strokeStyle = "#e39aa0";
  ctx.beginPath();
  ctx.moveTo(effectiveLeft - 10, 0);
  ctx.lineTo(effectiveLeft - 10, PAGE_HEIGHT_PX);
  ctx.stroke();
}

function drawGraphPaper(ctx: CanvasRenderingContext2D, settings: GlobalSettings) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PAGE_WIDTH_PX, PAGE_HEIGHT_PX);
  ctx.strokeStyle = "#cad4e6";
  ctx.lineWidth = 0.75;
  const gridSize = 25;
  for (let x = 0; x < PAGE_WIDTH_PX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, PAGE_HEIGHT_PX);
    ctx.stroke();
  }
  for (let y = 0; y < PAGE_HEIGHT_PX; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(PAGE_WIDTH_PX, y);
    ctx.stroke();
  }
}

function drawPaperBackground(ctx: CanvasRenderingContext2D, settings: GlobalSettings) {
  if (!settings.exportBackground) {
    ctx.clearRect(0, 0, PAGE_WIDTH_PX, PAGE_HEIGHT_PX);
    return;
  }

  switch (settings.paperStyle) {
    case "ruled":
      drawRuledPaper(ctx, settings);
      break;
    case "graph":
      drawGraphPaper(ctx, settings);
      break;
    default:
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, PAGE_WIDTH_PX, PAGE_HEIGHT_PX);
  }
}

function drawWatermark(ctx: CanvasRenderingContext2D, settings: GlobalSettings, fontFamily: string) {
  if (!settings.watermarkText?.trim()) return;

  ctx.save();
  ctx.font = `bold 56px ${fontFamily}, sans-serif`;
  ctx.fillStyle = "#000000";
  ctx.globalAlpha = 0.15;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(PAGE_WIDTH_PX / 2, PAGE_HEIGHT_PX / 2);
  ctx.rotate((-45 * Math.PI) / 180);
  ctx.fillText(settings.watermarkText.trim(), 0, 0);
  ctx.restore();
}

function drawHeaderFooter(ctx: CanvasRenderingContext2D, settings: GlobalSettings, fontFamily: string, pageIndex: number = 0) {
  ctx.save();
  ctx.font = `14px ${fontFamily}, sans-serif`;
  ctx.fillStyle = "#444444";
  ctx.globalAlpha = 0.8;

  // Header Left
  if (settings.headerLeft?.trim()) {
    ctx.textAlign = "left";
    ctx.fillText(settings.headerLeft.trim(), 40, 40);
  }

  // Header Right
  if (settings.headerRight?.trim()) {
    ctx.textAlign = "right";
    ctx.fillText(settings.headerRight.trim(), PAGE_WIDTH_PX - 40, 40);
  }

  // Show Date & Page No
  if (settings.showDatePageNo) {
    const today = new Date().toLocaleDateString();
    ctx.textAlign = "right";
    ctx.fillText(today, PAGE_WIDTH_PX - 40, 40);
    ctx.textAlign = "center";
    ctx.fillText(`Page ${pageIndex + 1}`, PAGE_WIDTH_PX / 2, PAGE_HEIGHT_PX - 30);
  }

  ctx.restore();
}

function drawAntiCopyPattern(ctx: CanvasRenderingContext2D, settings: GlobalSettings) {
  if (!settings.antiCopyPattern) return;

  ctx.save();
  ctx.strokeStyle = "#cccccc";
  ctx.globalAlpha = 0.08;
  ctx.lineWidth = 0.5;

  for (let x = -PAGE_HEIGHT_PX; x < PAGE_WIDTH_PX + PAGE_HEIGHT_PX; x += 25) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + PAGE_HEIGHT_PX, PAGE_HEIGHT_PX);
    ctx.stroke();
  }

  ctx.restore();
}

let cachedScannerCanvas: HTMLCanvasElement | null = null;
function getScannerCanvas(): HTMLCanvasElement {
  if (cachedScannerCanvas) return cachedScannerCanvas;
  const width = PAGE_WIDTH_PX, height = PAGE_HEIGHT_PX;
  const c = document.createElement("canvas");
  c.width = width; c.height = height;
  const gc = c.getContext("2d")!;
  const data = gc.createImageData(width, height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const tone = Math.random() * 70 + 160;
    d[i] = d[i + 1] = d[i + 2] = tone;
    d[i + 3] = Math.random() * 50 + 40;
  }
  gc.putImageData(data, 0, 0);
  return (cachedScannerCanvas = c);
}

function drawScannerEffect(ctx: CanvasRenderingContext2D, settings: GlobalSettings) {
  if (!settings.scannerEffect) return;
  const width = PAGE_WIDTH_PX, height = PAGE_HEIGHT_PX;
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(getScannerCanvas(), 0, 0);
  ctx.restore();

  const lg = ctx.createLinearGradient(0, 0, width, 0);
  lg.addColorStop(0, "rgba(0, 0, 0, 0)");
  lg.addColorStop(0.03, "rgba(0, 0, 0, 0.08)");
  lg.addColorStop(0.08, "rgba(0, 0, 0, 0.0)");
  lg.addColorStop(1, "rgba(0, 0, 0, 0.0)");

  ctx.save();
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function renderPageToCanvas(
  canvas: HTMLCanvasElement,
  page: Page,
  settings: GlobalSettings,
  fontFamily: string,
  globalTextContent: string = "",
  pageIndex: number = 0,
  targetSrcIndex?: number | null,
  scale: number = 1
): { maxRequiredPages: number, targetPageIndex?: number } {
  canvas.width = Math.round(PAGE_WIDTH_PX * scale); canvas.height = Math.round(PAGE_HEIGHT_PX * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return { maxRequiredPages: 1 };
  if (scale !== 1) ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawPaperBackground(ctx, settings);
  drawAntiCopyPattern(ctx, settings);
  drawWatermark(ctx, settings, fontFamily);
  drawHeaderFooter(ctx, settings, fontFamily, pageIndex);

  let lastMeasureFont = "";
  const measureChar = (ch: string, bold?: boolean, italic?: boolean, charFontSize?: number) => {
    const f = `${italic ? "italic " : ""}${bold ? "bold " : ""}${charFontSize || settings.fontSize}px ${fontFamily}`;
    if (f !== lastMeasureFont) { ctx.font = f; lastMeasureFont = f; }
    return ctx.measureText(ch).width;
  };

  const margins = getMargins(settings.marginPreset);

  for (const el of page.elements) {
    if (el.type === "image") {
      let img = imageCache.get(el.src);
      if (!img) {
        img = new Image();
        img.src = el.src;
        imageCache.set(el.src, img);
      }
      const draw = () => {
        ctx.save();
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.drawImage(img!, -el.width / 2, -el.height / 2, el.width, el.height);
        ctx.restore();
      };
      img.complete ? draw() : (img.onload = draw);
    }
  }

  const layoutKey = JSON.stringify([
    globalTextContent, fontFamily, settings.fontSize, settings.lineSpacing,
    settings.wordSpacing ?? 1.0, settings.marginPreset, settings.leftMargin ?? 105, settings.topMargin ?? 105,
  ]);
  let lines: LayoutLine[];
  if (layoutMemo && layoutMemo.key === layoutKey) {
    lines = layoutMemo.lines;
  } else {
    lines = layoutText({
      content: globalTextContent, fontSize: settings.fontSize, lineSpacing: settings.lineSpacing,
      pageWidth: PAGE_WIDTH_PX, pageHeight: PAGE_HEIGHT_PX,
      margins: { ...margins, left: settings.leftMargin ?? 105, top: settings.topMargin ?? 105, right: 20 },
      measureChar, wordSpacing: settings.wordSpacing ?? 1.0,
    });
    layoutMemo = { key: layoutKey, lines };
  }

  const renderTextToOffscreen = (): HTMLCanvasElement => {
    const offscreen = document.createElement("canvas");
    offscreen.width = PAGE_WIDTH_PX;
    offscreen.height = PAGE_HEIGHT_PX;
    const octx = offscreen.getContext("2d")!;
    let lastFont = "", lastColor = "";
    octx.setTransform(1, 0, 0, 1, 0, 0);

    for (const line of lines) {
      if (line.pageIndex !== pageIndex) continue;

      let hlSX: number | null = null, hlEX = 0, hlY = 0, hlSize = settings.fontSize;
      const drawHL = (sX: number, eX: number, yPos: number, size: number) => {
        const pX = Math.max(2, size * 0.1), fX = sX - pX, fW = (eX - sX) + (pX * 2);
        octx.fillStyle = "rgba(253, 224, 71, 0.42)";
        octx.fillRect(fX, yPos - size * 0.85, fW, size * 1.15);
        lastColor = "";
      };

      for (const g of line.glyphs) {
        const gSize = g.fontSize || settings.fontSize;
        if (g.highlight) {
          if (hlSX === null) { hlSX = g.x; hlSize = gSize; }
          hlEX = g.x + measureChar(g.char, g.bold, g.italic, g.fontSize); hlY = g.y;
          hlSize = Math.max(hlSize, gSize);
        } else if (hlSX !== null) { drawHL(hlSX, hlEX, hlY, hlSize); hlSX = null; }
      }
      if (hlSX !== null) drawHL(hlSX, hlEX, hlY, hlSize);

      const lText = line.glyphs.map(g => g.char).join("").trim();
      let lColor = settings.inkColor;
      if (settings.smartQA) {
        if (/^(q|question|q\d+)(\.|\:|\s)/i.test(lText)) lColor = "#000000";
        else if (/^(ans|answer|a|ans\d+)(\.|\:|\s)/i.test(lText)) lColor = "#2563eb";
      } else if (settings.autoHeadings && lText === lText.toUpperCase() && lText.length > 3) lColor = "#000000";

      for (const g of line.glyphs) {
        const gseed = settings.realism.seed + g.srcIndex;
        const random = mulberry32(gseed);
        const slantRad = (settings.realism.slant * Math.PI) / 180;
        let tf;
        if (Number(settings.realism.seed) <= 1) {
          tf = {
            dx: 0,
            dy: 0,
            rotation: 0,
            slant: slantRad,
            opacity: 1 - random() * settings.realism.pressureVariance,
          };
        } else {
          const dx = (random() - 0.5) * 2 * settings.realism.jitterX;
          const dy = (random() - 0.5) * 2 * settings.realism.jitterY;
          const rotationJitter = (random() - 0.5) * 2 * (Math.PI / 180) * 3;
          const opacity = 1 - random() * settings.realism.pressureVariance;
          tf = {
            dx,
            dy,
            rotation: rotationJitter,
            slant: slantRad,
            opacity,
          };
        }

        octx.globalAlpha = tf.opacity;
        const gSize = g.fontSize || settings.fontSize;
        const tfnt = `${g.italic ? "italic " : ""}${g.bold ? "bold " : ""}${gSize}px ${fontFamily}`;
        if (tfnt !== lastFont) { octx.font = tfnt; lastFont = tfnt; }
        const tcol = g.color || lColor;
        if (tcol !== lastColor) { octx.fillStyle = octx.strokeStyle = tcol; lastColor = tcol; }
        octx.translate(g.x + tf.dx, g.y + tf.dy);
        if (tf.slant) octx.transform(1, 0, Math.tan(-tf.slant), 1, 0, 0);
        if (tf.rotation) octx.rotate(tf.rotation);
        octx.fillText(g.char, 0, 0);

        octx.setTransform(1, 0, 0, 1, 0, 0);
      }

      const drawHandwrittenLine = (sX: number, eX: number, yPos: number, size: number, color: string, isUnderline: boolean) => {
        octx.strokeStyle = color;
        octx.lineWidth = Math.max(1, size / 16);
        octx.beginPath();
        
        const targetY = yPos + (isUnderline ? size * 0.12 : -size * 0.28);
        const length = eX - sX;
        const lineSeed = settings.realism.seed + Math.floor(sX) + Math.floor(yPos);
        const random = mulberry32(lineSeed);
        
        const pressureJitter = Number(settings.realism.seed) <= 1 ? 0 : settings.realism.jitterY;
        const startJitterY = (random() - 0.5) * pressureJitter * 2.5;
        const endJitterY = (random() - 0.5) * pressureJitter * 2.5;
        
        const step = 6;
        let first = true;
        
        for (let x = sX; x <= eX; x += step) {
          const t = (x - sX) / (length || 1);
          const baseDrift = startJitterY * (1 - t) + endJitterY * t;
          const wiggle = Math.sin(t * Math.PI * 2.5) * (pressureJitter * 0.6) + (random() - 0.5) * (pressureJitter * 0.4);
          const y = targetY + baseDrift + wiggle;
          
          if (first) {
            octx.moveTo(x, y);
            first = false;
          } else {
            octx.lineTo(x, y);
          }
        }
        
        const finalY = targetY + endJitterY + (random() - 0.5) * (pressureJitter * 0.4);
        octx.lineTo(eX, finalY);
        octx.stroke();
        lastColor = "";
      };

      // Draw continuous underlines
      let ulSX: number | null = null, ulEX = 0, ulY = 0, ulSize = settings.fontSize, ulColor = "";
      for (const g of line.glyphs) {
        const gSize = g.fontSize || settings.fontSize;
        const gColor = g.color || lColor;
        if (g.underline) {
          if (ulSX === null) {
            ulSX = g.x;
            ulSize = gSize;
            ulColor = gColor;
            ulY = g.y;
          }
          ulEX = g.x + measureChar(g.char, g.bold, g.italic, g.fontSize);
          ulSize = Math.max(ulSize, gSize);
        } else {
          if (ulSX !== null) {
            drawHandwrittenLine(ulSX, ulEX, ulY, ulSize, ulColor, true);
            ulSX = null;
          }
        }
      }
      if (ulSX !== null) drawHandwrittenLine(ulSX, ulEX, ulY, ulSize, ulColor, true);

      let stSX: number | null = null, stEX = 0, stY = 0, stSize = settings.fontSize, stColor = "";
      for (const g of line.glyphs) {
        const gSize = g.fontSize || settings.fontSize;
        const gColor = g.color || lColor;
        if (g.strikethrough) {
          if (stSX === null) {
            stSX = g.x;
            stSize = gSize;
            stColor = gColor;
            stY = g.y;
          }
          stEX = g.x + measureChar(g.char, g.bold, g.italic, g.fontSize);
          stSize = Math.max(stSize, gSize);
        } else {
          if (stSX !== null) {
            drawHandwrittenLine(stSX, stEX, stY, stSize, stColor, false);
            stSX = null;
          }
        }
      }
      if (stSX !== null) drawHandwrittenLine(stSX, stEX, stY, stSize, stColor, false);
    }
    return offscreen;
  };

  const cacheKey = `${globalTextContent}_${pageIndex}_${fontFamily}_${settings.fontSize}_${settings.lineSpacing}_${settings.wordSpacing}_${settings.inkColor}_${settings.marginPreset}_${settings.leftMargin ?? 105}_${settings.topMargin ?? 105}_${settings.smartQA}_${settings.autoHeadings}_${settings.realism.seed}_${settings.realism.jitterX}_${settings.realism.jitterY}_${settings.realism.slant}_${settings.realism.pressureVariance}`;
  let offscreenCanvas = textCache.get(cacheKey);
  if (!offscreenCanvas && typeof window !== "undefined") {
    offscreenCanvas = renderTextToOffscreen();
    textCache.set(cacheKey, offscreenCanvas);
    while (textCache.size > MAX_TEXT_CACHE_ENTRIES) {
      const oldestKey = textCache.keys().next().value;
      if (oldestKey === undefined) break;
      textCache.delete(oldestKey);
    }
  }

  if (offscreenCanvas) {
    ctx.drawImage(offscreenCanvas, 0, 0);
  }

  ctx.globalAlpha = 1.0;
  drawScannerEffect(ctx, settings);

  let targetPageIndex = undefined;
  if (targetSrcIndex !== undefined && targetSrcIndex !== null) {
    for (const line of lines) {
      if (line.glyphs.length > 0 && line.glyphs[0].srcIndex <= targetSrcIndex && line.glyphs[line.glyphs.length - 1].srcIndex >= targetSrcIndex) {
        targetPageIndex = line.pageIndex;
        break;
      }
    }
    if (targetPageIndex === undefined && lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      if (targetSrcIndex >= (lastLine.glyphs.length > 0 ? lastLine.glyphs[lastLine.glyphs.length - 1].srcIndex : 0)) { targetPageIndex = lastLine.pageIndex; }
    }
  }

  return {
    maxRequiredPages: lines.length > 0 ? Math.max(...lines.map(l => l.pageIndex)) + 1 : 1,
    targetPageIndex
  };
}
