import { canvasToPNGBlob, downloadBlob } from "@/lib/export/exportPNG";
import { exportCanvasesToPDF } from "@/lib/export/exportPDF";
import { renderPageToCanvas, PAGE_WIDTH_PX, PAGE_HEIGHT_PX } from "@/lib/render/canvasBackend";
import type { Document } from "@/lib/types";
import { FontKey, fontsMap, caveat } from "@/lib/fonts";

export interface ExportLogicProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  doc: Document;
  fontFamily: string;
  globalTextContent: string;
}

export function useExport(canvasRef: React.RefObject<HTMLCanvasElement | null>, doc: Document, fontFamily: string, globalTextContent: string) {
  const handleExportPNG = async (): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await canvasToPNGBlob(canvas, doc.globalSettings.highCompression);
    downloadBlob(blob, "handwriting.png");
  };

  const handleExportPDF = async (): Promise<void> => {
    const activeFamily = fontFamily || (fontsMap[doc.globalSettings.font as FontKey] || caveat).style.fontFamily;
    const canvases: HTMLCanvasElement[] = await Promise.all(
      doc.pages.map((page, idx) => {
        const canvas = document.createElement("canvas");
        canvas.width = PAGE_WIDTH_PX;
        canvas.height = PAGE_HEIGHT_PX;
        const pageSettings = { ...doc.globalSettings, ...(page.settingsOverride || {}) };
        renderPageToCanvas(canvas, page, pageSettings, activeFamily, globalTextContent, idx);
        return canvas;
      })
    );
    const blob = await exportCanvasesToPDF(canvases, doc.globalSettings.highCompression);
    downloadBlob(blob, "handwriting.pdf");
  };

  return { handleExportPNG, handleExportPDF };
}
