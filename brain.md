# Assignment Creator Brain

## Overview
Assignment Creator is a Next.js web application designed to convert typed text into realistic handwritten assignments. It provides a rich text editor that maps formatted text onto a virtual piece of paper (rendered on an HTML5 Canvas), applying jitter, slants, and pressure variance to mimic natural handwriting. Users can customize paper styles, ink colors, handwriting realism, margins, and export the result to PNG or PDF.

## Tech Stack
- **Framework:** Next.js (App Router, v16.3.0), React (v19.2.8)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion (for animations), Lucide React (icons)
- **State Management:** React Context API + `useReducer`
- **Build/Run:** `pnpm dev` (development), `pnpm build` (production)
- **Key Libraries:** `tw-animate-css` (animations), `clsx` & `tailwind-merge` (class management)

## Architecture
**Data Flow:**
Input Text (`HomeTextArea.tsx`) -> BBCode String (`[b]text[/b]`) -> State (`DocumentContext`) -> Layout Engine (`layout.ts`) -> Canvas Rendering (`canvasBackend.ts`) -> Export (PNG/PDF)

**Rendering Pipeline:**
1. The `HomeTextArea` captures rich text input from a `contenteditable` div and normalizes it to a raw BBCode-like string.
2. `layout.ts` parses this string into an array of `StyledChar` objects and reflows them into lines and pages (`LayoutLine`).
3. `canvasBackend.ts` takes these lines and draws them onto a 2D canvas, applying per-character jitter, slant, and opacity via a seeded random number generator (`jitter.ts`).

## Directory Map
- `/app`: Next.js App Router entry points (`page.tsx`, `layout.tsx`, global styles).
- `/components`: UI and feature components.
  - `/ui`: Shared UI elements and the main `Editor.tsx` wrapper.
  - `/WriteTab`: Editor components (like the main text area).
  - `/OptionTab` & `/StyleTab`: Settings panels for adjusting paper, ink, and realism.
- `/hooks`: Custom React hooks (e.g., `useEditorLogic.ts`, formatting hooks).
- `/lib`: Core domain logic.
  - `/render`: Canvas drawing (`canvasBackend.ts`) and text layout (`layout.ts`) engines.
  - `/handwriting`: Jitter and realism math algorithms.
  - `/export`: PNG and PDF generation logic.
  - `/state`: Global document state, types, and reducer (`documentReducer.ts`).

## Core Modules & Tools

### Editor (`components/ui/Editor.tsx` & `hooks/useEditorLogic.ts`)
- **What it does:** The main interface wrapper containing the sidebar and the canvas preview area. Handles zooming, panning, and responsive layout switching (mobile edit vs preview).
- **How it works:** It uses `DocumentContext` to maintain global state. It renders interactive thumbnails for each page and a main active canvas. Complex interaction logic (zoom math, touch panning) is abstracted into `useEditorLogic.ts`.

### Text Editor & BBCode (`components/WriteTab/HomeTextArea.tsx`)
- **What it does:** A `contenteditable` div that users type into. It translates HTML formatting (bold, center, fonts) into a clean BBCode string for the backend.
- **How it works:** Uses `document.execCommand` for formatting. Two-way binds the content by converting HTML to BBCode (`htmlToBbcode`) on input, and BBCode to HTML (`bbcodeToHtml`) on render.
- **Gotchas:** It hijacks paste events to strip unwanted HTML, converts LaTeX-like symbols to unicode, and prompts the user (via custom toast) before removing `$` symbols. It also intercepts the `Enter` key to explicitly enforce left-alignment on new lines.

### Layout Engine (`lib/render/layout.ts`)
- **What it does:** Computes word-wrapping, pagination, and text alignment for the canvas.
- **How it works:** 
  1. Parses the BBCode string into `StyledChar` objects, tracking active styles via a stack.
  2. Iterates over characters, measuring their width via `measureChar` (which uses canvas `measureText`).
  3. Wraps text at the page margins, forms words, and pushes lines to new pages when the Y-coordinate exceeds the page limit. Handles center/right alignment by offsetting `X` coordinates after computing line width.

### Canvas Renderer (`lib/render/canvasBackend.ts`)
- **What it does:** Draws the pre-calculated layout onto an HTML5 canvas.
- **How it works:** Loops through the `LayoutLine`s. For each character, it uses a seeded random generator (`mulberry32`) to calculate `dx`, `dy`, `rotation`, `slant`, and `opacity` (simulating pen pressure). It also draws backgrounds (ruled, graph), headers, watermarks, and post-processing scanner effects.
- **Gotchas:** To maintain 60FPS while typing, text rendering is cached on an offscreen canvas (`textCache`) keyed by the layout and settings string.

## Conventions & Patterns
- **State Management:** Strictly uses React `useReducer` (`documentReducer.ts`) wrapped in a Context. State mutations are purely action-driven.
- **Styling:** Tailwind CSS is used extensively, with a robust dark mode implementation utilizing `dark:` variants and dynamic CSS variables.
- **Canvas Units:** The canvas operates on a fixed logical resolution (`PAGE_WIDTH_PX = 794`, `PAGE_HEIGHT_PX = 1123` - representing A4 at 96 DPI). Zooming is handled by scaling the canvas CSS or context transform, keeping the logical coordinate system stable.

## Known Issues / Gotchas
- **Font Loading:** Text measurement in `layout.ts` depends on fonts being fully loaded. If a font is swapped or slow to load, text might wrap incorrectly until the next render cycle.
- **BBCode Translation Constraints:** The round-trip between contenteditable HTML and BBCode can occasionally lose extremely complex nested formatting.
- **Cursor Synchronization:** To prevent the canvas preview from scrolling to the wrong page during edits, `htmlToBbcode` now computes and returns the cursor's `bbcodeIndex` (matching the HTML selection offset) to accurately synchronize the edited word's position in `useEditorLogic.ts`.

## Last Updated
- 2026-08-22: Updated `htmlToBbcode` to return exact cursor coordinates to fix unpredictable page scrolling. Enforced specific DOM-element removal on Enter key to ensure new lines are strictly left-aligned.
