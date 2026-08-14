export interface RealismSettings {
  slant: number;
  jitterX: number;
  jitterY: number;
  pressureVariance: number;
  seed: number;
}

export interface GlobalSettings {
  font: string;
  /** "builtin" = loaded via next/font, "custom" = uploaded by user via FontFace API */
  fontSource: "builtin" | "custom";
  bold: boolean;
  italic: boolean;
  underline: boolean;
  highlight: boolean;
  strikethrough: boolean;
  fontSize: number;
  inkColor: string;
  paperStyle: "ruled" | "blank" | "graph" | "four-line";
  lineSpacing: number;
  marginPreset: "standard" | "cbse" | "custom";
  realism: RealismSettings;
  wordSpacing: number;
  topMargin: number;
  leftMargin: number;
  headerLeft: string;
  headerRight: string;
  watermarkText: string;
  showDatePageNo: boolean;
  autoCorrect: boolean;
  performanceMode: boolean;
  antiCopyPattern: boolean;
  smartQA: boolean;
  autoHeadings: boolean;
  paperTexture: boolean;
  inkBleed: boolean;
  scannerEffect: boolean;
  exportBackground: boolean;
  exportQuality: "standard" | "fullhd" | "ultrahd";
  highCompression: boolean;
  exportFormat: "png" | "pdf";
}

export type Filter =
  | { type: "brightness" | "contrast" | "sepia" | "blur"; intensity: number }
  | { type: "grain" | "inkBleed" | "antiCopyNoise"; intensity: number };

export interface TextElement {
  type: "text";
  id: string;
  content: string;
  x: number;
  y: number;
  fontOverride?: string;
}

export interface ImageElement {
  type: "image";
  id: string;
  src: string; // object URL or base64 
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  filters: Filter[];
}

export type PageElement = TextElement | ImageElement;

export interface Page {
  id: string;
  elements: PageElement[];
  settingsOverride?: Partial<GlobalSettings>;
}

export interface Document {
  id: string;
  pages: Page[];
  globalSettings: GlobalSettings;
}
