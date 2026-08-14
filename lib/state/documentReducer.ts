import type { Document, GlobalSettings, Page, TextElement } from "@/lib/types";

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  font: "Caveat",
  fontSource: "builtin",
  bold: false,
  italic: false,
  underline: false,
  highlight: false,
  strikethrough: false,
  fontSize: 28,
  inkColor: "#2563eb",
  paperStyle: "ruled",
  lineSpacing: 1.7,
  marginPreset: "standard",
  realism: {
    slant: -2,
    jitterX: 1.2,
    jitterY: 1.6,
    pressureVariance: 0.15,
    seed: 42,
  },
  wordSpacing: 1.0,
  topMargin: 105,
  leftMargin: 105,
  headerLeft: "",
  headerRight: "",
  watermarkText: "",
  showDatePageNo: true,
  autoCorrect: true,
  performanceMode: true,
  antiCopyPattern: false,
  smartQA: true,
  autoHeadings: true,
  paperTexture: true,
  inkBleed: true,
  scannerEffect: true,
  exportBackground: true,
  exportQuality: "ultrahd",
  highCompression: true,
  exportFormat: "png",
};

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function createDefaultDocument(): Document {
  const textElement: TextElement = {
    type: "text",
    id: nextId("text"),
    content: "Type something and watch it turn into handwriting.",
    x: 0,
    y: 0,
  };
  const page: Page = {
    id: nextId("page"),
    elements: [textElement],
  };
  return {
    id: nextId("doc"),
    pages: [page],
    globalSettings: DEFAULT_GLOBAL_SETTINGS,
  };
}

export type DocumentAction =
  | { type: "SET_TEXT_CONTENT"; pageId: string; elementId: string; content: string }
  | { type: "ADD_IMAGE"; pageId: string; src: string; width: number; height: number }
  | { type: "UPDATE_GLOBAL_SETTINGS"; settings: Partial<GlobalSettings> }
  | { type: "UPDATE_REALISM"; realism: Partial<GlobalSettings["realism"]> }
  | { type: "UPDATE_ELEMENT"; pageId: string; elementId: string; updates: any }
  | { type: "ADD_PAGE" }
  | { type: "DELETE_PAGE"; pageId: string }
  | { type: "UPDATE_PAGE_SETTINGS"; pageId: string; settings: Partial<GlobalSettings> };

export function documentReducer(doc: Document, action: DocumentAction): Document {
  switch (action.type) {
    case "SET_TEXT_CONTENT": {
      return {
        ...doc,
        pages: doc.pages.map((page) =>
          page.id !== action.pageId ? page : {
            ...page,
            elements: page.elements.map((el) =>
              el.id === action.elementId && el.type === "text"
                ? { ...el, content: action.content }
                : el
            ),
          }
        ),
      };
    }
    case "ADD_IMAGE": {
      return {
        ...doc,
        pages: doc.pages.map((page) =>
          page.id !== action.pageId ? page : {
            ...page,
            elements: [
              ...page.elements,
              {
                type: "image",
                id: nextId("img"),
                src: action.src,
                x: 397 - action.width / 2, 
                y: 561 - action.height / 2,
                width: action.width,
                height: action.height,
                rotation: 0,
                filters: [],
              } as any
            ],
          }
        ),
      };
    }
    case "UPDATE_GLOBAL_SETTINGS": {
      return {
        ...doc,
        globalSettings: { ...doc.globalSettings, ...action.settings },
      };
    }
    case "UPDATE_REALISM": {
      return {
        ...doc,
        globalSettings: {
          ...doc.globalSettings,
          realism: { ...doc.globalSettings.realism, ...action.realism },
        },
      };
    }
    case "UPDATE_ELEMENT": {
      return {
        ...doc,
        pages: doc.pages.map((page) =>
          page.id !== action.pageId ? page : {
            ...page,
            elements: page.elements.map((el) =>
              el.id === action.elementId
                ? { ...el, ...action.updates } as any
                : el
            ),
          }
        ),
      };
    }
    case "UPDATE_PAGE_SETTINGS": {
      return {
        ...doc,
        pages: doc.pages.map((page) => 
          page.id !== action.pageId ? page : {
            ...page,
            settingsOverride: { ...page.settingsOverride, ...action.settings }
          }
        )
      };
    }
    case "ADD_PAGE": {
      return {
        ...doc,
        pages: [
          ...doc.pages,
          {
            id: nextId("page"),
            elements: [],
            settingsOverride: {}
          },
        ],
      };
    }
    case "DELETE_PAGE": {
      if (doc.pages.length <= 1) return doc;
      return {
        ...doc,
        pages: doc.pages.filter((p) => p.id !== action.pageId),
      };
    }
    default:
      return doc;
  }
}
