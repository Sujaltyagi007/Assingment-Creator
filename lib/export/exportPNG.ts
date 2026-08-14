export function canvasToPNGBlob(canvas: HTMLCanvasElement, highCompression = false): Promise<Blob> {
  const src = highCompression ? downscale(canvas, 0.6) : canvas;
  return new Promise((resolve, reject) => {
    src.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to encode canvas as PNG"));
    }, "image/png");
  });
}

function downscale(canvas: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width  = Math.round(canvas.width  * scale);
  out.height = Math.round(canvas.height * scale);
  const ctx = out.getContext("2d");
  if (ctx) ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
