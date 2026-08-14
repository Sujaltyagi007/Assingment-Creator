import type { RealismSettings } from "@/lib/types";

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GlyphTransform {
  dx: number;
  dy: number;
  rotation: number;
  opacity: number;
}

export function createJitterGenerator(realism: RealismSettings): () => GlyphTransform {
  const random = mulberry32(realism.seed);
  const slantRad = (realism.slant * Math.PI) / 180;

  return function nextGlyphTransform(): GlyphTransform {
    if (Number(realism.seed) <= 1) {
      return {
        dx: 0,
        dy: 0,
        rotation: slantRad,
        opacity: 1 - random() * realism.pressureVariance,
      };
    }
    const dx = (random() - 0.5) * 2 * realism.jitterX;
    const dy = (random() - 0.5) * 2 * realism.jitterY;
    const rotationJitter = (random() - 0.5) * 2 * (Math.PI / 180) * 3; 
    const opacity = 1 - random() * realism.pressureVariance;
    return {
      dx,
      dy,
      rotation: slantRad + rotationJitter,
      opacity,
    };
  };
}
