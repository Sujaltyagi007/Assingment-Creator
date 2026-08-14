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

function drawScannerEffect(ctx: CanvasRenderingContext2D, settings: GlobalSettings) {
  if (!settings.scannerEffect) return;

  const width = PAGE_WIDTH_PX;
  const height = PAGE_HEIGHT_PX;
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = width;
  grainCanvas.height = height;
  const gc = grainCanvas.getContext("2d")!;
  const imageData = gc.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const tone = Math.random() * 70 + 160;
    data[i] = tone;
    data[i + 1] = tone;
    data[i + 2] = tone;
    data[i + 3] = Math.random() * 50 + 40;   // higher alpha (40–90) for denser grain
  }
  gc.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.globalAlpha = 0.55;                  // increased opacity from 0.15
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.restore();

  const lightGradient = ctx.createLinearGradient(0, 0, width, 0);
  lightGradient.addColorStop(0, "rgba(0, 0, 0, 0)");     // Dark binding crease at x = 0
  lightGradient.addColorStop(0.03, "rgba(0, 0, 0, 0.08)");   // Quick falloff
  lightGradient.addColorStop(0.08, "rgba(0, 0, 0, 0.0)");    // Flat normal bright paper area
  lightGradient.addColorStop(1, "rgba(0, 0, 0, 0.0)");       // Completely transparent on the right

  ctx.save();
  ctx.fillStyle = lightGradient;
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
  canvas.width = PAGE_WIDTH_PX;
  canvas.height = PAGE_HEIGHT_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  drawPaperBackground(ctx, settings);
  drawAntiCopyPattern(ctx, settings);
  drawWatermark(ctx, settings, fontFamily);
  drawHeaderFooter(ctx, settings, fontFamily, pageIndex);

  const measureChar = (ch: string, bold?: boolean, italic?: boolean) => {
    ctx.save();
    const italicPrefix = italic ? "italic " : "";
    const boldPrefix = bold ? "bold " : "";
    ctx.font = `${italicPrefix}${boldPrefix}${settings.fontSize}px ${fontFamily}`;
    const width = ctx.measureText(ch).width;
    ctx.restore();
    return width;
  };
  const margins = getMargins(settings.marginPreset);

  for (const element of page.elements) {
    if (element.type === "image") {
      // Draw image
      const img = new Image();
      img.src = element.src;
      if (img.complete) {
        ctx.save();
        ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.drawImage(img, -element.width / 2, -element.height / 2, element.width, element.height);
        ctx.restore();
      } else {
        img.onload = () => {
          ctx.save();
          ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
          ctx.rotate((element.rotation * Math.PI) / 180);
          ctx.drawImage(img, -element.width / 2, -element.height / 2, element.width, element.height);
          ctx.restore();
        };
      }
    }
  }

  const lines = layoutText({
    content: globalTextContent,
    fontSize: settings.fontSize,
    lineSpacing: settings.lineSpacing,
    pageWidth: PAGE_WIDTH_PX,
    pageHeight: PAGE_HEIGHT_PX,
    margins: {
      ...margins,
      left: settings.leftMargin ?? 105,
      top: settings.topMargin ?? 105,
      right: 20
    },
    measureChar,
    wordSpacing: settings.wordSpacing ?? 1.0,
  });

  const nextGlyphTransform = createJitterGenerator(settings.realism);

  for (const line of lines) {
    if (line.pageIndex !== pageIndex) continue;

    let highlightStartX: number | null = null;
    let highlightEndX = 0;
    let highlightY = 0;

    const drawHighlightSpan = (sX: number, eX: number, yPos: number) => {
      const padX = Math.max(2, settings.fontSize * 0.1);
      const fillX = sX - padX;
      const fillWidth = (eX - sX) + (padX * 2);
      const highlightHeight = settings.fontSize * 1.15;
      const highlightTopY = yPos - settings.fontSize * 0.85;

      ctx.save();
      ctx.fillStyle = "rgba(253, 224, 71, 0.42)";
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(fillX, highlightTopY, fillWidth, highlightHeight, 3);
        ctx.fill();
      } else {
        ctx.fillRect(fillX, highlightTopY, fillWidth, highlightHeight);
      }
      ctx.restore();
    };

      for (let i = 0; i < line.glyphs.length; i++) {
        const glyph = line.glyphs[i];
        if (glyph.highlight) {
          const charWidth = measureChar(glyph.char, glyph.bold, glyph.italic);
          if (highlightStartX === null) {
            highlightStartX = glyph.x;
          }
          highlightEndX = glyph.x + charWidth;
          highlightY = glyph.y;
        } else if (highlightStartX !== null) {
          drawHighlightSpan(highlightStartX, highlightEndX, highlightY);
          highlightStartX = null;
        }
      }
      if (highlightStartX !== null) {
        drawHighlightSpan(highlightStartX, highlightEndX, highlightY);
      }

      const lineText = line.glyphs.map((g) => g.char).join("").trim();
      let currentLineColor = settings.inkColor;
      if (settings.smartQA) {
        if (/^(q|question|q\d+)(\.|\:|\s)/i.test(lineText)) {
          currentLineColor = "#000000"; 
        } else if (/^(ans|answer|a|ans\d+)(\.|\:|\s)/i.test(lineText)) {
          currentLineColor = "#2563eb"; 
        }
      } else if (settings.autoHeadings && lineText === lineText.toUpperCase() && lineText.length > 3) {
        currentLineColor = "#000000";
      }

      for (const glyph of line.glyphs) {
        const transform = nextGlyphTransform();
        ctx.save();
        ctx.globalAlpha = transform.opacity;

        // Resolve font for this character
        const charItalic = glyph.italic ?? false;
        const charBold = glyph.bold ?? false;
        const italicPrefix = charItalic ? "italic " : "";
        const boldPrefix = charBold ? "bold " : "";
        ctx.font = `${italicPrefix}${boldPrefix}${settings.fontSize}px ${fontFamily}`;

        // Resolve color
        const charColor = glyph.color || currentLineColor;
        ctx.fillStyle = charColor;

        ctx.translate(glyph.x + transform.dx, glyph.y + transform.dy);
        ctx.rotate(transform.rotation);

        ctx.fillText(glyph.char, 0, 0);

        // Underline
        if (glyph.underline) {
          const width = ctx.measureText(glyph.char).width;
          ctx.beginPath();
          ctx.lineWidth = Math.max(1, settings.fontSize / 16);
          ctx.strokeStyle = charColor;
          const underlineY = settings.fontSize * 0.12;
          ctx.moveTo(0, underlineY);
          ctx.lineTo(width, underlineY);
          ctx.stroke();
        }

        // Strikethrough
        if (glyph.strikethrough) {
          const width = ctx.measureText(glyph.char).width;
          ctx.beginPath();
          ctx.lineWidth = Math.max(1, settings.fontSize / 16);
          ctx.strokeStyle = charColor;
          const strikethroughY = -settings.fontSize * 0.28;
          ctx.moveTo(0, strikethroughY);
          ctx.lineTo(width, strikethroughY);
          ctx.stroke();
        }

        ctx.restore();
      }
    }
  drawScannerEffect(ctx, settings);
}
