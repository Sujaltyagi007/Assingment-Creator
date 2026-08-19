"use client";
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState } from "react";
import { documentReducer, createDefaultDocument, DocumentAction } from "./documentReducer";
import type { Document } from "@/lib/types";

interface DocumentContextType {
  doc: Document;
  dispatch: React.Dispatch<DocumentAction>;
  isLoaded: boolean;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

const STORAGE_KEY = "assignment_creator_doc";
const SAVE_DEBOUNCE_MS = 800;

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [doc, dispatch] = useReducer(documentReducer, undefined, createDefaultDocument);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.pages && parsed.globalSettings) {
          dispatch({ type: "LOAD_DOCUMENT", document: parsed });
        }
      } catch (e) {
        console.error("Failed to load saved document", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    let saved = false;
    const save = () => {
      if (saved) return;
      saved = true;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
      } catch (e) {
        console.error("Failed to save document to localStorage (storage quota may be exceeded)", e);
      }
    };
    // Debounced off the keystroke path; flushed when the tab is hidden or
    // closed so the pending edit is not lost.
    const timer = setTimeout(save, SAVE_DEBOUNCE_MS);
    const onVisibilityChange = () => { if (document.visibilityState === "hidden") save(); };
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [doc, isLoaded]);

  return (
    <DocumentContext.Provider value={{ doc, dispatch, isLoaded }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocument must be used within a DocumentProvider");
  }
  return context;
}
