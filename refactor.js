const fs = require('fs');

let content = fs.readFileSync('components/ui/Editor.tsx', 'utf8');

// Replace state declarations
const oldStateBlock = `  const [activePageId, setActivePageId] = useState(doc.pages[0].id);
  const activePage = doc.pages.find(p => p.id === activePageId) || doc.pages[0];
  const activePageIndex = doc.pages.findIndex(p => p.id === activePageId) !== -1 ? doc.pages.findIndex(p => p.id === activePageId) : 0;
  const globalTextElement = doc.pages[0].elements.find((el) => el.type === "text");
  const globalTextContent = globalTextElement?.type === "text" ? globalTextElement.content : "";
  const [fontFamily, setFontFamily] = useState<string>(() => { const activeFont = fontsMap[doc.globalSettings.font as FontKey] || caveat; return activeFont.style.fontFamily; });
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizingElementId, setResizingElementId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ w: number; h: number; x: number; y: number }>({ w: 0, h: 0, x: 0, y: 0 });
  const [zoomMode, setZoomMode] = useState<"fit-height" | "fit-width" | "custom">("fit-height");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [isLoaded, setIsLoaded] = useState(false);
  const touchStartDistance = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(1);
  const [lastEditIndex, setLastEditIndex] = useState<number | null>(null);
  const [pendingActivePageIndex, setPendingActivePageIndex] = useState<number | null>(null);`;

const newStateBlock = `  const [uiState, setUiState] = useState({
    activePageId: doc.pages[0]?.id || "",
    pageToDelete: null as string | null,
    isHoveringCanvas: false,
    toastMessage: null as string | null,
    mobileView: "edit" as "edit" | "preview",
    isLoaded: false,
    lastEditIndex: null as number | null,
    pendingActivePageIndex: null as number | null,
  });

  const [interaction, setInteraction] = useState({
    draggingElementId: null as string | null,
    dragOffset: { x: 0, y: 0 },
    resizingElementId: null as string | null,
    resizeStart: { w: 0, h: 0, x: 0, y: 0 },
  });

  const [zoom, setZoom] = useState({
    mode: "fit-height" as "fit-height" | "fit-width" | "custom",
    level: 1,
  });

  const activePage = doc.pages.find(p => p.id === uiState.activePageId) || doc.pages[0];
  const activePageIndex = doc.pages.findIndex(p => p.id === uiState.activePageId) !== -1 ? doc.pages.findIndex(p => p.id === uiState.activePageId) : 0;
  const globalTextElement = doc.pages[0]?.elements.find((el) => el.type === "text");
  const globalTextContent = globalTextElement?.type === "text" ? globalTextElement.content : "";
  const [fontFamily, setFontFamily] = useState<string>(() => { const activeFont = fontsMap[doc.globalSettings.font as FontKey] || caveat; return activeFont.style.fontFamily; });
  const touchStartDistance = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(1);`;

content = content.replace(oldStateBlock, newStateBlock);

// Replace UI state variables
content = content.replace(/\bactivePageId\b/g, "uiState.activePageId");
content = content.replace(/\bsetActivePageId\((.*?)\)/g, "setUiState(s => ({ ...s, activePageId: $1 }))");

content = content.replace(/\bpageToDelete\b/g, "uiState.pageToDelete");
content = content.replace(/\bsetPageToDelete\((.*?)\)/g, "setUiState(s => ({ ...s, pageToDelete: $1 }))");

content = content.replace(/\bisHoveringCanvas\b/g, "uiState.isHoveringCanvas");
content = content.replace(/\bsetIsHoveringCanvas\((.*?)\)/g, "setUiState(s => ({ ...s, isHoveringCanvas: $1 }))");

content = content.replace(/\btoastMessage\b/g, "uiState.toastMessage");
content = content.replace(/\bsetToastMessage\((.*?)\)/g, "setUiState(s => ({ ...s, toastMessage: $1 }))");

content = content.replace(/\bmobileView\b/g, "uiState.mobileView");
content = content.replace(/\bsetMobileView\((.*?)\)/g, "setUiState(s => ({ ...s, mobileView: $1 }))");

content = content.replace(/\bisLoaded\b/g, "uiState.isLoaded");
content = content.replace(/\bsetIsLoaded\((.*?)\)/g, "setUiState(s => ({ ...s, isLoaded: $1 }))");

content = content.replace(/\blastEditIndex\b/g, "uiState.lastEditIndex");
content = content.replace(/\bsetLastEditIndex\((.*?)\)/g, "setUiState(s => ({ ...s, lastEditIndex: $1 }))");

content = content.replace(/\bpendingActivePageIndex\b/g, "uiState.pendingActivePageIndex");
content = content.replace(/\bsetPendingActivePageIndex\((.*?)\)/g, "setUiState(s => ({ ...s, pendingActivePageIndex: $1 }))");


// Replace Interaction state variables
content = content.replace(/\bdraggingElementId\b/g, "interaction.draggingElementId");
content = content.replace(/\bsetDraggingElementId\((.*?)\)/g, "setInteraction(s => ({ ...s, draggingElementId: $1 }))");

content = content.replace(/\bdragOffset\b/g, "interaction.dragOffset");
content = content.replace(/\bsetDragOffset\((.*?)\)/g, "setInteraction(s => ({ ...s, dragOffset: $1 }))");

content = content.replace(/\bresizingElementId\b/g, "interaction.resizingElementId");
content = content.replace(/\bsetResizingElementId\((.*?)\)/g, "setInteraction(s => ({ ...s, resizingElementId: $1 }))");

content = content.replace(/\bresizeStart\b/g, "interaction.resizeStart");
content = content.replace(/\bsetResizeStart\((.*?)\)/g, "setInteraction(s => ({ ...s, resizeStart: $1 }))");


// Replace Zoom state variables
content = content.replace(/\bzoomMode\b/g, "zoom.mode");
content = content.replace(/\bsetZoomMode\((.*?)\)/g, "setZoom(s => ({ ...s, mode: $1 }))");

content = content.replace(/\bzoomLevel\b/g, "zoom.level");
// Special case for setZoomLevel which uses a callback: setZoomLevel(z => Math.max(...))
content = content.replace(/\bsetZoomLevel\((.*?)\)/g, (match, p1) => {
    if (p1.includes('=>')) {
        return `setZoom(s => ({ ...s, level: (${p1})(s.level) }))`;
    }
    return `setZoom(s => ({ ...s, level: ${p1} }))`;
});

// Fix duplicate uiState
content = content.replace(/uiState\.uiState\./g, "uiState.");
content = content.replace(/zoom\.zoom\./g, "zoom.");
content = content.replace(/interaction\.interaction\./g, "interaction.");

fs.writeFileSync('components/ui/Editor.tsx', content);
console.log('Refactoring complete');
