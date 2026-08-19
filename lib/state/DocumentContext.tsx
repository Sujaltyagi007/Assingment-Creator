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

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [doc, dispatch] = useReducer(documentReducer, undefined, createDefaultDocument);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("assignment_creator_doc");
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
    if (isLoaded) {
      localStorage.setItem("assignment_creator_doc", JSON.stringify(doc));
    }
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
