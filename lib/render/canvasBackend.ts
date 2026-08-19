import type { GlobalSettings, Page } from "@/lib/types";
import { createJitterGenerator } from "@/lib/handwriting/jitter";
import { getMargins, layoutText } from "@/lib/render/layout";

export const PAGE_WIDTH_PX = 794;
export const PAGE_HEIGHT_PX = 1123;

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

function drawPaperBackground(ctx: CanvasRenderingContext2D, settings: GlobalSettings) {
  if (!settings.exportBackground) {
    ctx.clearRect(0, 0, PAGE_WIDTH_PX, PAGE_HEIGHT_PX);
    return;
  }

  switch (settings.paperStyle) {
    case "ruled":
      drawRuledPaper(ctx, settings);
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
  pageIndex: number = 0
) {
  canvas.width = PAGE_WIDTH_PX; canvas.height = PAGE_HEIGHT_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  drawPaperBackground(ctx, settings);
  drawAntiCopyPattern(ctx, settings);
  drawWatermark(ctx, settings, fontFamily);
  drawHeaderFooter(ctx, settings, fontFamily, pageIndex);

  let lastMeasureFont = "";
  const measureChar = (ch: string, bold?: boolean, italic?: boolean) => {
    const f = `${italic ? "italic " : ""}${bold ? "bold " : ""}${settings.fontSize}px ${fontFamily}`;
    if (f !== lastMeasureFont) { ctx.font = f; lastMeasureFont = f; }
    return ctx.measureText(ch).width;
  };

  const margins = getMargins(settings.marginPreset);

  for (const el of page.elements) {
    if (el.type === "image") {
      const img = new Image(); img.src = el.src;
      const draw = () => {
        ctx.save();
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);
        ctx.restore();
      };
      img.complete ? draw() : (img.onload = draw);
    }
  }

  const lines = layoutText({
    content: globalTextContent, fontSize: settings.fontSize, lineSpacing: settings.lineSpacing,
    pageWidth: PAGE_WIDTH_PX, pageHeight: PAGE_HEIGHT_PX,
    margins: { ...margins, left: settings.leftMargin ?? 105, top: settings.topMargin ?? 105, right: 20 },
    measureChar, wordSpacing: settings.wordSpacing ?? 1.0,
  });

  const nextGlyphTransform = createJitterGenerator(settings.realism);
  let lastFont = "", lastColor = "";
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  for (const line of lines) {
    if (line.pageIndex !== pageIndex) continue;

    let hlSX: number | null = null, hlEX = 0, hlY = 0;
    const drawHL = (sX: number, eX: number, yPos: number) => {
      const pX = Math.max(2, settings.fontSize * 0.1), fX = sX - pX, fW = (eX - sX) + (pX * 2);
      ctx.fillStyle = "rgba(253, 224, 71, 0.42)";
      ctx.fillRect(fX, yPos - settings.fontSize * 0.85, fW, settings.fontSize * 1.15);
      lastColor = "";
    };

    for (const g of line.glyphs) {
      if (g.highlight) {
        if (hlSX === null) hlSX = g.x;
        hlEX = g.x + measureChar(g.char, g.bold, g.italic); hlY = g.y;
      } else if (hlSX !== null) { drawHL(hlSX, hlEX, hlY); hlSX = null; }
    }
    if (hlSX !== null) drawHL(hlSX, hlEX, hlY);

    const lText = line.glyphs.map(g => g.char).join("").trim();
    let lColor = settings.inkColor;
    if (settings.smartQA) {
      if (/^(q|question|q\d+)(\.|\:|\s)/i.test(lText)) lColor = "#000000";
      else if (/^(ans|answer|a|ans\d+)(\.|\:|\s)/i.test(lText)) lColor = "#2563eb";
    } else if (settings.autoHeadings && lText === lText.toUpperCase() && lText.length > 3) lColor = "#000000";

    for (const g of line.glyphs) {
      const tf = nextGlyphTransform();
      ctx.globalAlpha = tf.opacity;

      const tfnt = `${g.italic ? "italic " : ""}${g.bold ? "bold " : ""}${settings.fontSize}px ${fontFamily}`;
      if (tfnt !== lastFont) { ctx.font = tfnt; lastFont = tfnt; }

      const tcol = g.color || lColor;
      if (tcol !== lastColor) { ctx.fillStyle = ctx.strokeStyle = tcol; lastColor = tcol; }

      ctx.translate(g.x + tf.dx, g.y + tf.dy);
      if (tf.rotation) ctx.rotate(tf.rotation);
      ctx.fillText(g.char, 0, 0);

      if (g.underline || g.strikethrough) {
        const w = ctx.measureText(g.char).width;
        ctx.beginPath();
        ctx.lineWidth = Math.max(1, settings.fontSize / 16);
        if (g.underline) { const y = settings.fontSize * 0.12; ctx.moveTo(0, y); ctx.lineTo(w, y); }
        if (g.strikethrough) { const y = -settings.fontSize * 0.28; ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  ctx.globalAlpha = 1.0;
  drawScannerEffect(ctx, settings);
}
