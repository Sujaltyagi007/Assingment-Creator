"use client";
import Sidebar from "@/components/Sidebar";
import { useEditorLogic } from "@/hooks/useEditorLogic";
import { FontKey, fontsMap, caveat } from "@/lib/fonts";
import { motion, AnimatePresence } from "motion/react";
import { exportCanvasesToPDF } from "@/lib/export/exportPDF";
import { useEffect, useReducer, useRef, useState } from "react";
import { canvasToPNGBlob, downloadBlob } from "@/lib/export/exportPNG";
import { createDefaultDocument, documentReducer, syncIdCounter } from "@/lib/state/documentReducer";
import { renderPageToCanvas, PAGE_WIDTH_PX, PAGE_HEIGHT_PX } from "@/lib/render/canvasBackend";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function PageThumbnail({ page, pageIndex, settings, fontFamily, globalTextContent, isActive, onClick, onDelete, canDelete }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current && fontFamily) {
      renderPageToCanvas(canvasRef.current, page, settings, fontFamily, globalTextContent, pageIndex);
    }
  }, [page, settings, fontFamily, globalTextContent, pageIndex]);

  return (
    <div onClick={onClick} className={`relative cursor-pointer w-16 rounded shrink-0 bg-white group transition-all duration-300 shadow-md ${isActive ? 'ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-[1.03]' : 'ring-1 ring-zinc-300 hover:ring-zinc-400 hover:shadow-lg dark:ring-zinc-700/50 dark:hover:ring-zinc-400/80 dark:hover:shadow-zinc-900/60'}`}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill' }} className="rounded pointer-events-none" />
      <div className="absolute inset-0 rounded pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }} />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-zinc-900/75 text-white dark:bg-black/60 text-[9px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md pointer-events-none tracking-wide shadow-sm">
        {pageIndex + 1}
      </div>
      {canDelete && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={`absolute -top-2 -right-2 z-20 bg-white hover:bg-red-600 text-zinc-600 hover:text-white border border-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white dark:border-zinc-700/50 p-1 cursor-pointer rounded-full transition-all duration-200 hover:scale-110 shadow-md ${isActive ? 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`} title="Delete Page">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-2.5 h-2.5" fill="currentColor">
            <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function Editor() {
  const {
    doc, dispatch, canvasRef, scrollContainerRef, previewWrapperRef,
    activePage, activePageIndex, globalTextContent, fontFamily,
    activePageId, setActivePageId, pageToDelete, setPageToDelete,
    isHoveringCanvas, setIsHoveringCanvas, toastMessage, mobileView, setMobileView,
    zoomMode, zoomLevel,
    handleAddPage, handleZoomIn, handleZoomOut, handleResetZoom, handleFitWidth,
    handleTouchStart, handleTouchMove, handleTouchEnd, handlePointerDown,
    handlePointerMove, handlePointerUp, handleContentChange, handleAddImage,
    handleExportPNG, handleExportPDF
  } = useEditorLogic();

  return (
    <div className="flex h-screen w-screen overflow-hidden flex-col lg:flex-row bg-zinc-100 dark:bg-[#08080a] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <div className={`w-full lg:w-[25vw] lg:min-w-75 lg:max-w-105 h-full shrink-0 ${mobileView === "edit" ? "block" : "hidden lg:block"}`}>
        <Sidebar content={globalTextContent}
          onContentChange={handleContentChange}
          onAddImage={handleAddImage}
          settings={{ ...doc.globalSettings, ...(activePage.settingsOverride || {}) }}
          onUpdateSettings={(settings) => {
            const { paperStyle, ...globalUpdates } = settings;
            if (paperStyle !== undefined) {
              dispatch({ type: "UPDATE_PAGE_SETTINGS", pageId: activePage.id, settings: { paperStyle } });
            }
            if (Object.keys(globalUpdates).length > 0) {
              dispatch({ type: "UPDATE_GLOBAL_SETTINGS", settings: globalUpdates });
            }
          }}
          onUpdateRealism={(realism) => dispatch({ type: "UPDATE_REALISM", realism })}
          onExportPNG={handleExportPNG}
          onExportPDF={handleExportPDF}
          pageCount={doc.pages.length}
        />
      </div>

      <div className={`flex-1 w-full lg:w-[75vw] h-full bg-zinc-200/70 dark:bg-[#0a0a0d] relative overflow-hidden transition-colors duration-200 ${mobileView === "preview" ? "flex" : "hidden lg:flex"}`} onMouseEnter={() => setIsHoveringCanvas(true)} onMouseLeave={() => setIsHoveringCanvas(false)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,85,51,0.08),transparent_65%)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF5533]/4 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/4 rounded-full blur-[140px] pointer-events-none" />

        <div ref={previewWrapperRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full overflow-auto flex p-6 touch-pan-x touch-pan-y [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-400 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          <div className="relative shadow-2xl rounded-sm overflow-hidden flex items-center justify-center m-auto transition-all">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={zoomMode === "fit-height" ? "max-h-[88vh] w-auto max-w-full object-contain rounded-sm shadow-2xl border border-zinc-300 dark:border-zinc-800/60" : zoomMode === "fit-width" ? "w-full h-auto max-w-none max-h-none object-contain rounded-sm shadow-2xl border border-zinc-300 dark:border-zinc-800/60" : "w-auto h-auto max-w-none max-h-none object-contain rounded-sm shadow-2xl border border-zinc-300 dark:border-zinc-800/60 origin-top"}
              style={zoomMode === "custom" ? { width: PAGE_WIDTH_PX * zoomLevel, height: PAGE_HEIGHT_PX * zoomLevel } : undefined}
            />
          </div>
        </div>

        {/* Floating UI */}
        <div className={`absolute top-6 left-6 z-20 flex items-center gap-2.5 transition-opacity duration-300 ${isHoveringCanvas ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <button onClick={handleFitWidth} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 dark:bg-[#16161e] dark:border-zinc-700/50 rounded-full shadow-lg dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors text-xs font-semibold cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
            Fit Width
          </button>
          <ThemeToggle variant="pill" />
        </div>

        <div className={`absolute lg:bottom-6 bottom-24 right-6 z-10 hidden sm:flex flex-col items-center bg-white border border-zinc-200 text-zinc-600 dark:bg-[#16161e] dark:border-zinc-700/50 dark:text-zinc-400 rounded-xl overflow-hidden shadow-xl transition-opacity duration-300 ${isHoveringCanvas ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <button onClick={handleZoomIn} className="p-2.5 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer" title="Zoom In">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <div className="w-full h-px bg-zinc-200 dark:bg-zinc-700/50" />
          <button onClick={handleResetZoom} className="p-2.5 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer" title="Fit to Height">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
          </button>
          <div className="w-full h-px bg-zinc-200 dark:bg-zinc-700/50" />
          <button onClick={handleZoomOut} className="p-2.5 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer" title="Zoom Out">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>

        <div className="fixed sm:absolute bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-3 sm:top-[30%] sm:translate-y-[-30%] z-10 flex flex-row sm:flex-col items-center gap-4" style={{ perspective: '600px' }}>
          <div className="rounded-2xl bg-white/85 border border-zinc-200/90 shadow-xl backdrop-blur-xl dark:bg-zinc-950/65 dark:border-white/10 dark:shadow-2xl p-3 flex flex-row sm:flex-col items-center gap-3 sm:gap-0 transition-colors duration-200">
            <motion.div layout ref={scrollContainerRef} className="flex flex-row sm:flex-col gap-3.5 max-w-[60vw] sm:max-w-none max-h-[12vh] sm:max-h-[50vh] overflow-x-auto! sm:overflow-x-visible overflow-y-visible sm:overflow-y-auto py-2 px-1.5 scrollbar-none" >
              <AnimatePresence initial={false} mode="popLayout">
                {doc.pages.map((p, idx) => (
                  <motion.div key={p.id} layout="position"
                    initial={{ opacity: 0, scaleY: 0, rotateX: -60, y: -20, filter: 'blur(4px)', }}
                    animate={{ opacity: 1, scaleY: 1, rotateX: 0, y: 0, filter: 'blur(0px)', }}
                    exit={{ opacity: 0, scaleY: 0.5, rotateX: 40, y: 10, filter: 'blur(4px)', }}
                    transition={{
                      type: 'spring', stiffness: 400, damping: 30,
                      layout: { type: 'spring', stiffness: 300, damping: 28 }
                    }}
                    style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
                    className="shrink-0" >
                    <PageThumbnail page={p} pageIndex={idx}
                      settings={{ ...doc.globalSettings, ...(p.settingsOverride || {}) }}
                      fontFamily={fontFamily} globalTextContent={globalTextContent}
                      isActive={activePageId === p.id} canDelete={doc.pages.length > 1}
                      onClick={() => setActivePageId(p.id)} onDelete={() => setPageToDelete(p.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            <div className="w-px h-8 sm:w-full sm:h-px bg-zinc-200 dark:bg-white/10 mx-2 sm:mx-0 sm:my-2 shrink-0 transition-colors" />
            <motion.button layout whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88, rotate: 90 }} onClick={handleAddPage}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 hover:bg-blue-600 text-zinc-600 hover:text-white border border-zinc-300 hover:border-blue-500 shadow-sm dark:bg-white/5 dark:hover:bg-blue-600/80 dark:text-zinc-400 dark:hover:text-white dark:border-white/8 dark:hover:border-blue-500/60 transition-colors duration-200 shrink-0 cursor-pointer" title="Add Page" >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </motion.button>
          </div>
        </div>

        {pageToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-zinc-200 text-zinc-900 dark:bg-[#16161e] dark:border-zinc-700/50 dark:text-white rounded-2xl py-3 px-4 shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Page?</h3>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2 px-2">
                Are you sure you want to delete this page? The text will automatically reflow, but any images on this page will be permanently lost.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setPageToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer">Cancel</button>
                <button onClick={() => {
                  if (activePageId === pageToDelete) { setActivePageId(doc.pages[0].id); }
                  dispatch({ type: "DELETE_PAGE", pageId: pageToDelete });
                  setPageToDelete(null);
                }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-lg shadow-red-500/20 transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -25, scale: 0.9, x: "-50%" }}
              animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
              exit={{ opacity: 0, y: -20, scale: 0.9, x: "-50%" }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="fixed top-5 left-1/2 z-55 flex items-center gap-2.5 px-4 py-2 bg-white/95 border-zinc-200 text-zinc-900 shadow-xl dark:bg-zinc-950/95 dark:border-[#FF5533]/45 dark:text-zinc-100 text-xs font-bold tracking-wide rounded-full dark:shadow-[0_0_30px_rgba(255,85,51,0.22)] backdrop-blur-xl pointer-events-auto border-[1.5px]" >
              <div className="flex items-center justify-center p-1.5 rounded-full bg-[#FF5533]/15 text-[#FF5533] shrink-0 animate-shake">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-6 right-6 z-50 sm:hidden flex items-center bg-white/95 border border-zinc-200 shadow-xl dark:bg-[#111116]/90 dark:border-zinc-800/80 rounded-full p-1.5 backdrop-blur-md gap-1.5">
        <button type="button" onClick={() => setMobileView("edit")}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${mobileView === "edit" ? "bg-[#FF5533] text-white shadow-[0_0_12px_rgba(255,85,51,0.5)]" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`} title="Edit Mode"        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <button type="button" onClick={() => setMobileView("preview")} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${mobileView === "preview" ? "bg-[#FF5533] text-white shadow-[0_0_12px_rgba(255,85,51,0.5)]" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`} title="Preview Mode" >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <ThemeToggle className="w-10 h-10 p-0!" />
      </div>
    </div>
  );
}
