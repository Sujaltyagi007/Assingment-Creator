export function canvasToPNGBlob(canvas: HTMLCanvasElement, highCompression = false): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (highCompression) {
      // WebP at 85% quality achieves peak compression while remaining virtually indistinguishable from PNG,
      // without having to downscale the image (which ruins the quality).
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to encode canvas as WebP"));
      }, "image/webp", 0.85);
    } else {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to encode canvas as PNG"));
      }, "image/png");
    }
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
