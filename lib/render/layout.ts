export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const MARGIN_PRESETS: Record<"standard" | "cbse" | "custom", PageMargins> = {
  standard: { top: 60, right: 0, bottom: 60, left: 0 },
  cbse: { top: 70, right: 0, bottom: 70, left: 0 },
  custom: { top: 60, right: 0, bottom: 60, left: 0 },
};

export function getMargins(preset: "standard" | "cbse" | "custom"): PageMargins {
  return MARGIN_PRESETS[preset] || MARGIN_PRESETS.standard;
}

export interface LayoutGlyph {
  char: string;
  x: number;
  y: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  highlight?: boolean;
  strikethrough?: boolean;
  color?: string;
}

export interface LayoutLine {
  glyphs: LayoutGlyph[];
  pageIndex: number;
}

export interface TextLayoutOptions {
  content: string;
  fontSize: number;
  lineSpacing: number;
  pageWidth: number;
  pageHeight: number;
  margins: PageMargins;
  measureChar: (char: string, bold?: boolean, italic?: boolean) => number;
  wordSpacing?: number;
}

interface StyledChar {
  char: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  highlight: boolean;
  strikethrough: boolean;
  color: string;
}

/**
 * Parses BBCode style formatting: [b], [i], [u], [h], [s], [color=#hex]
 */
function parseStyledText(content: string): StyledChar[] {
  const chars: StyledChar[] = [];
  let bold = false;
  let italic = false;
  let underline = false;
  let highlight = false;
  let strikethrough = false;
  const colorStack: string[] = [];

  let i = 0;
  while (i < content.length) {
    if (content[i] === "[") {
      const closeIdx = content.indexOf("]", i);
      if (closeIdx !== -1) {
        const tag = content.substring(i + 1, closeIdx);
        if (tag === "b") { bold = true; i = closeIdx + 1; continue; }
        if (tag === "/b") { bold = false; i = closeIdx + 1; continue; }
        if (tag === "i") { italic = true; i = closeIdx + 1; continue; }
        if (tag === "/i") { italic = false; i = closeIdx + 1; continue; }
        if (tag === "u") { underline = true; i = closeIdx + 1; continue; }
        if (tag === "/u") { underline = false; i = closeIdx + 1; continue; }
        if (tag === "h") { highlight = true; i = closeIdx + 1; continue; }
        if (tag === "/h") { highlight = false; i = closeIdx + 1; continue; }
        if (tag === "s") { strikethrough = true; i = closeIdx + 1; continue; }
        if (tag === "/s") { strikethrough = false; i = closeIdx + 1; continue; }
        if (tag.startsWith("color=")) {
          colorStack.push(tag.substring(6));
          i = closeIdx + 1;
          continue;
        }
        if (tag === "/color") {
          colorStack.pop();
          i = closeIdx + 1;
          continue;
        }
      }
    }

    chars.push({
      char: content[i],
      bold,
      italic,
      underline,
      highlight,
      strikethrough,
      color: colorStack[colorStack.length - 1] || "",
    });
    i++;
  }

  return chars;
}

export function layoutText(options: TextLayoutOptions): LayoutLine[] {
  const { content, fontSize, lineSpacing, pageWidth, pageHeight, margins, measureChar, wordSpacing = 1.0 } = options;
  const maxWidth = pageWidth - margins.left - margins.right;
  const lineHeight = fontSize * lineSpacing;
  const lines: LayoutLine[] = [];
  let cursorY = margins.top + fontSize;
  let currentPageIndex = 0;

  const getCharWidth = (ch: string, bold: boolean, italic: boolean) => {
    const width = measureChar(ch, bold, italic);
    return ch === " " ? width * wordSpacing : width;
  };

  const allChars = parseStyledText(content);
  
  const paragraphs: StyledChar[][] = [];
  let currentParagraph: StyledChar[] = [];
  for (const c of allChars) {
    if (c.char === "\n") {
      paragraphs.push(currentParagraph);
      currentParagraph = [];
    } else {
      currentParagraph.push(c);
    }
  }
  paragraphs.push(currentParagraph);

  for (const paragraph of paragraphs) {
    // Group characters into words
    const words: StyledChar[][] = [];
    let currentWord: StyledChar[] = [];
    for (let i = 0; i < paragraph.length; i++) {
      const c = paragraph[i];
      currentWord.push(c);
      if (c.char === " " || i === paragraph.length - 1) {
        words.push(currentWord);
        currentWord = [];
      }
    }

    let currentLine: LayoutGlyph[] = [];
    let cursorX = margins.left;

    const pushLine = () => {
      lines.push({ glyphs: currentLine, pageIndex: currentPageIndex });
      currentLine = [];
      cursorX = margins.left;
      cursorY += lineHeight;
      if (cursorY > pageHeight - margins.bottom) {
        cursorY = margins.top + fontSize;
        currentPageIndex++;
      }
    };

    words.forEach((word) => {
      const wordWidth = word.reduce((sum, c) => sum + getCharWidth(c.char, c.bold, c.italic), 0);

      if (cursorX + wordWidth > margins.left + maxWidth && currentLine.length > 0) {
        pushLine();
      }

      for (const c of word) {
        const chWidth = getCharWidth(c.char, c.bold, c.italic);
        if (cursorX + chWidth > margins.left + maxWidth && currentLine.length > 0) {
          pushLine();
        }
        currentLine.push({
          char: c.char,
          x: cursorX,
          y: cursorY,
          bold: c.bold,
          italic: c.italic,
          underline: c.underline,
          highlight: c.highlight,
          strikethrough: c.strikethrough,
          color: c.color,
        });
        cursorX += chWidth;
      }
    });

    pushLine();
  }

  if (lines.length > 1 && lines[lines.length - 1].glyphs.length === 0) lines.pop();
  return lines;
}
