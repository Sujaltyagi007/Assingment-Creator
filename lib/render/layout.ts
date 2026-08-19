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
  srcIndex: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  highlight?: boolean;
  strikethrough?: boolean;
  color?: string;
  align?: "left" | "center";
  fontSize?: number;
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
  measureChar: (char: string, bold?: boolean, italic?: boolean, charFontSize?: number) => number;
  wordSpacing?: number;
}

interface StyledChar {
  char: string;
  srcIndex: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  highlight: boolean;
  strikethrough: boolean;
  color: string;
  align: "left" | "center";
  fontSize?: number;
}

/**
 * Parses BBCode style formatting: [b], [i], [u], [h], [s], [center], [color=#hex], [size=N]
 */
function parseStyledText(content: string): StyledChar[] {
  const chars: StyledChar[] = [];
  let b = false, i = false, u = false, h = false, s = false, align: "left" | "center" = "left";
  const cStack: string[] = [];
  const sStack: number[] = [];
  for (let idx = 0; idx < content.length; ) {
    const srcIndex = idx;
    if (content[idx] === "[") {
      const cIdx = content.indexOf("]", idx);
      if (cIdx !== -1) {
        const t = content.substring(idx + 1, cIdx), n = cIdx + 1;
        if (t === "b") { b = true; idx = n; continue; }
        if (t === "/b") { b = false; idx = n; continue; }
        if (t === "i") { i = true; idx = n; continue; }
        if (t === "/i") { i = false; idx = n; continue; }
        if (t === "u") { u = true; idx = n; continue; }
        if (t === "/u") { u = false; idx = n; continue; }
        if (t === "h") { h = true; idx = n; continue; }
        if (t === "/h") { h = false; idx = n; continue; }
        if (t === "s") { s = true; idx = n; continue; }
        if (t === "/s") { s = false; idx = n; continue; }
        if (t === "center") { align = "center"; idx = n; continue; }
        if (t === "/center") { align = "left"; idx = n; continue; }
        if (t.startsWith("color=")) { cStack.push(t.substring(6)); idx = n; continue; }
        if (t === "/color") { cStack.pop(); idx = n; continue; }
        if (t.startsWith("size=")) { sStack.push(parseInt(t.substring(5), 10)); idx = n; continue; }
        if (t === "/size") { sStack.pop(); idx = n; continue; }
      }
    }
    chars.push({
      char: content[idx++],
      srcIndex,
      bold: b,
      italic: i,
      underline: u,
      highlight: h,
      strikethrough: s,
      color: cStack[cStack.length - 1] || "",
      align,
      fontSize: sStack[sStack.length - 1]
    });
  }
  return chars;
}

const LIST_PREFIX_REGEX = /^\s*(\([a-zA-Z0-9ivxlcdmIVXLCDM]+\.?\)|\d{1,3}[\.\)]+|[a-zA-Z][\.\)]+|[ivxlcdmIVXLCDM]{1,4}[\.\)]+|[•\-\*\>])(\s*)/;

export function layoutText(opts: TextLayoutOptions): LayoutLine[] {
  const { content, fontSize, lineSpacing, pageWidth, pageHeight, margins, measureChar, wordSpacing = 1.0 } = opts;
  const maxW = pageWidth - margins.left - margins.right, lineH = fontSize * lineSpacing, lines: LayoutLine[] = [];
  let curY = margins.top + fontSize, pageIdx = 0;

  const cache = new Map<string, number>();
  const getW = (c: {char: string, bold?: boolean, italic?: boolean, fontSize?: number}) => {
    const k = `${c.char}-${c.bold}-${c.italic}-${c.fontSize || fontSize}`;
    if (!cache.has(k)) cache.set(k, measureChar(c.char, c.bold, c.italic, c.fontSize || fontSize) * (c.char === " " ? wordSpacing : 1));
    return cache.get(k)!;
  };

  const pushLine = (line: LayoutGlyph[], isCenter: boolean) => {
    if (isCenter && line.length) {
      const lineWidth = line[line.length - 1].x + getW(line[line.length - 1]) - line[0].x;
      const targetStartX = (pageWidth - lineWidth) / 2;
      const shiftX = targetStartX - line[0].x;
      line.forEach(g => g.x += shiftX);
    }
    lines.push({ glyphs: line, pageIndex: pageIdx });
    if ((curY += lineH) > pageHeight - margins.bottom) { curY = margins.top + fontSize; pageIdx++; }
  };

  const paras: StyledChar[][] = [[]];
  parseStyledText(content).forEach(c => c.char === "\n" ? paras.push([]) : paras[paras.length - 1].push(c));

  paras.forEach(para => {
    if (!para.length) return pushLine([], false);
    const isCenter = para.some(c => c.align === "center");
    let pref: StyledChar[] = [], body = para, line: LayoutGlyph[] = [], curX = margins.left, pGlyphs: LayoutGlyph[] = [];

    if (!isCenter) {
      const m = para.map(c => c.char).join("").match(LIST_PREFIX_REGEX);
      if (m?.[0]) {
        const ls = Math.max(0, para.findIndex(c => c.char !== " "));
        pref = para.slice(ls, ls + m[1].trim().length);
        body = para.slice(m[0].length);
      }
    }

    if (pref.length) {
      const pW = pref.reduce((s, c) => s + getW(c), 0), gL = 15, gR = Math.max(35, margins.left - 18);
      let pX = Math.min(Math.max(gL, gR - pW), gL + Math.max(0, (gR - gL - pW) / 2));
      pGlyphs = pref.map(c => ({ ...c, x: pX, y: curY, pX: pX += getW(c) })).map(({ pX, ...g }) => g);
    }

    if (!body.length && pGlyphs.length) return pushLine(pGlyphs, false);

    body.reduce((acc, c) => (c.char === " " ? acc.push([c]) : acc[acc.length - 1].push(c), acc), [[]] as StyledChar[][]).forEach((w, i) => {
      if (curX + w.reduce((s, c) => s + getW(c), 0) > margins.left + maxW && line.length) { pushLine(line, isCenter); line = []; curX = margins.left; }
      if (i === 0 && pGlyphs.length && !line.length) line.push(...pGlyphs);
      w.forEach(c => {
        const cW = getW(c);
        if (curX + cW > margins.left + maxW && line.length) { pushLine(line, isCenter); line = []; curX = margins.left; }
        line.push({ ...c, x: curX, y: curY });
        curX += cW;
      });
    });
    if (line.length || pGlyphs.length) pushLine(line.length ? line : pGlyphs, isCenter);
  });

  if (lines.length > 1 && !lines[lines.length - 1].glyphs.length) lines.pop();
  return lines;
}
