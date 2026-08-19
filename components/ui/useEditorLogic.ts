"use client";
import { useState, useRef, useEffect } from "react";
import { useDocument } from "@/lib/state/DocumentContext";
import { FontKey, fontsMap, caveat } from "@/lib/fonts";
import { renderPageToCanvas } from "@/lib/render/canvasBackend";
import { useZoom } from "@/hooks/useZoom";
import { useCanvasInteraction } from "@/hooks/useCanvasInteraction";
import { useEditorUI } from "@/hooks/useEditorUI";
import { useExport } from "@/hooks/useExport";

export function useEditorLogic() {
  const { doc, dispatch, isLoaded } = useDocument();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);
  const prevPagesLength = useRef(doc.pages.length);

  useEffect(() => {
    if (doc.pages.length > prevPagesLength.current) {
      if (scrollContainerRef.current) {
        setTimeout(() => { scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: "smooth" }); }, 100);
      }
    }
    prevPagesLength.current = doc.pages.length;
  }, [doc.pages.length]);

  const { uiState, setUiState, handleAddPage, activePage, activePageIndex, globalTextElement, globalTextContent } = useEditorUI(doc, dispatch, isLoaded);
  const { zoom, setZoom, handleZoomIn, handleZoomOut, handleResetZoom, handleFitWidth, handleTouchStart, handleTouchMove, handleTouchEnd } = useZoom(canvasRef);
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useCanvasInteraction(canvasRef, activePage, dispatch);

  const [fontFamily, setFontFamily] = useState<string>(() => {
    const activeFont = fontsMap[doc.globalSettings.font as FontKey] || caveat;
    return activeFont.style.fontFamily;
  });

  const { handleExportPNG, handleExportPDF } = useExport(canvasRef, doc, fontFamily, globalTextContent);

  useEffect(() => {
    let isMounted = true;
    const activePageSettings = { ...doc.globalSettings, ...(activePage.settingsOverride || {}) };
    const { font, fontSource } = activePageSettings;

    const resolveFontFamily = async (): Promise<string> => {
      if (typeof window === "undefined" || !document.fonts) {
        const activeFont = fontsMap[font as FontKey] || caveat;
        return activeFont.style.fontFamily;
      }
      if (fontSource === "builtin") {
        const activeFont = fontsMap[font as FontKey] || caveat;
        const fontName = activeFont.style.fontFamily;
        const primary = fontName.split(",")[0].trim().replace(/['"]/g, "");
        try { await document.fonts.load(`16px "${primary}"`); } catch { }
        return fontName;
      }
      try { await document.fonts.load(`16px "${font}"`); } catch { }
      return `"${font}", sans-serif`;
    };

    resolveFontFamily()
      .catch((err) => {
        console.warn("Font load failed, falling back", err);
        const activeFont = fontsMap[font as FontKey] || caveat;
        return activeFont.style.fontFamily;
      })
      .then((resolvedFamily) => {
        if (isMounted) {
          setFontFamily(resolvedFamily);
        }
      });

    return () => { isMounted = false; };
  }, [doc.globalSettings.font, doc.globalSettings.fontSource, activePage.settingsOverride?.font, activePage.settingsOverride?.fontSource]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const activePageSettings = { ...doc.globalSettings, ...(activePage.settingsOverride || {}) };

    const renderId = requestAnimationFrame(() => {
      const { maxRequiredPages, targetPageIndex } = renderPageToCanvas(
        canvas,
        activePage,
        activePageSettings,
        fontFamily,
        globalTextContent,
        activePageIndex,
        uiState.lastEditIndex
      );

      if (maxRequiredPages > doc.pages.length) {
        dispatch({ type: "ENSURE_PAGE_COUNT", count: maxRequiredPages });
      }
      if (targetPageIndex !== undefined && targetPageIndex !== activePageIndex) {
        setUiState(s => ({ ...s, pendingActivePageIndex: targetPageIndex }));
      }
      if (uiState.lastEditIndex !== null) {
        setUiState(s => ({ ...s, lastEditIndex: null }));
      }
    });

    return () => {
      cancelAnimationFrame(renderId);
    };
  }, [activePage, doc.globalSettings, globalTextContent, activePageIndex, uiState.lastEditIndex, doc.pages.length, dispatch, setUiState, fontFamily]);

  const handleContentChange = (newContent: string) => {
    if (!globalTextElement) return;
    let diffIndex = 0;
    while (diffIndex < globalTextContent.length && diffIndex < newContent.length && globalTextContent[diffIndex] === newContent[diffIndex]) {
      diffIndex++;
    }
    setUiState(s => ({ ...s, lastEditIndex: diffIndex }));

    dispatch({
      type: "SET_TEXT_CONTENT",
      pageId: doc.pages[0].id,
      elementId: globalTextElement.id,
      content: newContent,
    });
  };

  const handleAddImage = (src: string, width: number, height: number) => {
    dispatch({
      type: "ADD_IMAGE",
      pageId: activePage.id,
      src,
      width,
      height,
    });
  };

  return {
    doc, dispatch, canvasRef, scrollContainerRef, previewWrapperRef,
    activePage, activePageIndex, globalTextContent, fontFamily,

    // UI State mapped to individual properties
    activePageId: uiState.activePageId,
    setActivePageId: (id: string) => setUiState(s => ({ ...s, activePageId: id })),

    pageToDelete: uiState.pageToDelete,
    setPageToDelete: (id: string | null) => setUiState(s => ({ ...s, pageToDelete: id })),

    isHoveringCanvas: uiState.isHoveringCanvas,
    setIsHoveringCanvas: (v: boolean) => setUiState(s => ({ ...s, isHoveringCanvas: v })),

    toastMessage: uiState.toastMessage,

    mobileView: uiState.mobileView,
    setMobileView: (v: "edit" | "preview") => setUiState(s => ({ ...s, mobileView: v })),
    isLoaded,

    // Zoom State mapped to individual properties
    zoomMode: zoom.mode,
    zoomLevel: zoom.level,

    // Handlers
    handleAddPage, handleZoomIn, handleZoomOut, handleResetZoom, handleFitWidth,
    handleTouchStart, handleTouchMove, handleTouchEnd, handlePointerDown,
    handlePointerMove, handlePointerUp, handleContentChange, handleAddImage,
    handleExportPNG, handleExportPDF
  };
}
