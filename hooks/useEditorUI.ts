import { useState, useEffect } from "react";
import type { Document } from "@/lib/types";
import { DocumentAction } from "@/lib/state/documentReducer";

export function useEditorUI(doc: Document, dispatch: React.Dispatch<DocumentAction>, isLoaded: boolean) {
  const [uiState, setUiState] = useState({
    activePageId: doc.pages[0]?.id || "",
    pageToDelete: null as string | null,
    isHoveringCanvas: false,
    toastMessage: null as string | null,
    mobileView: "edit" as "edit" | "preview",
    lastEditIndex: null as number | null,
    pendingActivePageIndex: null as number | null,
  });

  useEffect(() => {
    if (uiState.pendingActivePageIndex !== null && doc.pages[uiState.pendingActivePageIndex]) {
      setUiState(s => ({ ...s, activePageId: doc.pages[s.pendingActivePageIndex!].id, pendingActivePageIndex: null }));
    }
  }, [doc.pages, uiState.pendingActivePageIndex]);

  useEffect(() => {
    if (isLoaded && doc.pages.length > 0) {
      setUiState(s => {
        const stillExists = doc.pages.some(p => p.id === s.activePageId);
        return { ...s, activePageId: stillExists ? s.activePageId : doc.pages[0].id };
      });
    }
  }, [isLoaded, doc.pages]);

  useEffect(() => {
    if (uiState.toastMessage) {
      const timer = setTimeout(() => { setUiState(s => ({ ...s, toastMessage: null })); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uiState.toastMessage]);

  const handleAddPage = () => {
    if (doc.pages.length >= 25) { setUiState(s => ({ ...s, toastMessage: "Maximum limit of 25 pages reached!" })); return; }
    dispatch({ type: "ADD_PAGE" });
  };

  const activePage = doc.pages.find(p => p.id === uiState.activePageId) || doc.pages[0];
  const activePageIndex = doc.pages.findIndex(p => p.id === uiState.activePageId) !== -1 ? doc.pages.findIndex(p => p.id === uiState.activePageId) : 0;
  const globalTextElement = doc.pages[0]?.elements.find((el) => el.type === "text");
  const globalTextContent = globalTextElement?.type === "text" ? globalTextElement.content : "";

  return { uiState, setUiState, handleAddPage, activePage, activePageIndex, globalTextElement, globalTextContent };
}
