/**
 * Zero-dependency PDF assembler.
 * Each canvas is embedded as a JPEG image. Output is a valid multi-page PDF Blob.
 */

const PT_W = 595.28; // A4 width  in PDF user units
const PT_H = 841.89; // A4 height in PDF user units

function canvasToJpegB64(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL("image/jpeg", quality).split(",")[1];
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const enc = (s: string) => new TextEncoder().encode(s);

/**
 * Assemble a PDF Blob from an array of canvases (one per page).
 * @param canvases - Rendered page canvases in order.
 * @param highCompression - true = JPEG quality 0.70, false = 0.95
 */
export async function exportCanvasesToPDF(
  canvases: HTMLCanvasElement[],
  highCompression: boolean,
): Promise<Blob> {
  // 0.82 is a sweet spot for JPEG where it achieves excellent compression 
  // without introducing the heavy, unacceptable artifacts seen at 0.70.
  const quality = highCompression ? 0.82 : 0.98;

  const chunks: Uint8Array[] = [];
  let bytePos = 0;

  const push = (u: Uint8Array) => { chunks.push(u); bytePos += u.length; };
  const pushStr = (s: string) => push(enc(s));

  // PDF object offsets (1-indexed, offset[i] = byte position of object i+1)
  const offsets: number[] = [];

  const beginObj = (id: number) => {
    offsets[id - 1] = bytePos;
    pushStr(`${id} 0 obj\n`);
  };
  const endObj = () => pushStr("endobj\n");

  pushStr("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");

  const n = canvases.length;

  // Object id plan:
  //   1        = catalog
  //   2        = page tree
  //   3..2+n   = page dicts         (pageId = 3 + i)
  //   3+n..2+2n = image XObjects    (imgId  = 3 + n + i)
  //   3+2n..2+3n = content streams  (csId   = 3 + 2n + i)

  const pageId = (i: number) => 3 + i;
  const imgId  = (i: number) => 3 + n + i;
  const csId   = (i: number) => 3 + 2 * n + i;
  const totalObjs = 3 * n + 2;

  // obj 1 — catalog
  beginObj(1);
  pushStr(`<< /Type /Catalog /Pages 2 0 R >>\n`);
  endObj();

  // obj 2 — page tree
  const kids = Array.from({ length: n }, (_, i) => `${pageId(i)} 0 R`).join(" ");
  beginObj(2);
  pushStr(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>\n`);
  endObj();

  // per-page objects
  for (let i = 0; i < n; i++) {
    const canvas = canvases[i];
    const imgBytes = b64ToBytes(canvasToJpegB64(canvas, quality));

    // page dict
    beginObj(pageId(i));
    pushStr(
      `<< /Type /Page /Parent 2 0 R\n` +
      `   /MediaBox [0 0 ${PT_W} ${PT_H}]\n` +
      `   /Contents ${csId(i)} 0 R\n` +
      `   /Resources << /XObject << /Im${i} ${imgId(i)} 0 R >> >>\n` +
      `>>\n`
    );
    endObj();

    // image XObject
    beginObj(imgId(i));
    pushStr(
      `<< /Type /XObject /Subtype /Image\n` +
      `   /Width ${canvas.width} /Height ${canvas.height}\n` +
      `   /ColorSpace /DeviceRGB /BitsPerComponent 8\n` +
      `   /Filter /DCTDecode /Length ${imgBytes.length} >>\n` +
      `stream\n`
    );
    push(imgBytes);
    pushStr(`\nendstream\n`);
    endObj();

    // content stream: scale image to fill page
    const content = `q ${PT_W} 0 0 ${PT_H} 0 0 cm /Im${i} Do Q`;
    const contentBytes = enc(content);
    beginObj(csId(i));
    pushStr(`<< /Length ${contentBytes.length} >>\nstream\n`);
    push(contentBytes);
    pushStr(`\nendstream\n`);
    endObj();
  }

  // xref
  const xrefOffset = bytePos;
  let xref = `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`;
  for (let i = 0; i < totalObjs; i++) {
    xref += String(offsets[i] ?? 0).padStart(10, "0") + " 00000 n \n";
  }
  xref += `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  pushStr(xref);

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}
