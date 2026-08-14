import { Caveat, Kalam, Patrick_Hand, Shadows_Into_Light, Indie_Flower, Gochi_Hand } from "next/font/google";

export const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caveat",
});

export const kalam = Kalam({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-kalam",
});

export const patrickHand = Patrick_Hand({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-patrick-hand",
});

export const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-shadows-into-light",
});

export const indieFlower = Indie_Flower({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-indie-flower",
});

export const gochiHand = Gochi_Hand({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-gochi-hand",
});

export const fontsMap = {
  Caveat: caveat,
  Kalam: kalam,
  "Patrick Hand": patrickHand,
  "Shadows Into Light": shadowsIntoLight,
  "Indie Flower": indieFlower,
  "Gochi Hand": gochiHand,
} as const;

export type FontKey = keyof typeof fontsMap;

/**
 * Registers a user-uploaded font file (.ttf/.otf/.woff/.woff2) into the
 * browser's FontFace registry so it can be used on the canvas.
 * Returns the font family name to store in GlobalSettings.font.
 */
export async function registerCustomFont(file: File): Promise<string> {
  const fontName = file.name.replace(/\.(ttf|otf|woff2?)$/i, "");
  const buffer = await file.arrayBuffer();
  const fontFace = new FontFace(fontName, buffer);
  await fontFace.load();
  // Replace any existing registration with the same name
  document.fonts.forEach((f) => { if (f.family === fontName) document.fonts.delete(f); });
  document.fonts.add(fontFace);
  return fontName;
}
