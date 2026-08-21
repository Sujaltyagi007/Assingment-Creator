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

function canvasToRGB(canvas: HTMLCanvasElement): Uint8Array {
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8Array(0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const rgb = new Uint8Array(canvas.width * canvas.height * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    rgb[j] = data[i];
    rgb[j + 1] = data[i + 1];
    rgb[j + 2] = data[i + 2];
  }
  return rgb;
}

async function compressFlate(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === "undefined") { return null }
  try {
    const stream = new Response(new Blob([data as BlobPart])).body!.pipeThrough(new CompressionStream("deflate"));
    const compressedBuffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(compressedBuffer);
  } catch (e) {
    console.error("CompressionStream failed, falling back to JPEG", e);
    return null;
  }
}

export async function exportCanvasesToPDF(canvases: HTMLCanvasElement[], highCompression: boolean): Promise<Blob> {
  const quality = highCompression ? 0.82 : 0.98;
  const chunks: Uint8Array[] = [];
  let bytePos = 0;
  const push = (u: Uint8Array) => { chunks.push(u); bytePos += u.length; };
  const pushStr = (s: string) => push(enc(s));
  const offsets: number[] = [];

  const beginObj = (id: number) => {
    offsets[id - 1] = bytePos;
    pushStr(`${id} 0 obj\n`);
  };
  const endObj = () => pushStr("endobj\n");
  pushStr("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");
  const n = canvases.length;
  const pageImages = await Promise.all(
    canvases.map(async (canvas) => {
      if (!highCompression) {
        const rgb = canvasToRGB(canvas);
        const flateBytes = await compressFlate(rgb);
        if (flateBytes) {
          return {
            bytes: flateBytes,
            filter: "/FlateDecode",
            width: canvas.width,
            height: canvas.height,
          };
        }
      }

      const imgBytes = b64ToBytes(canvasToJpegB64(canvas, quality));
      return {
        bytes: imgBytes,
        filter: "/DCTDecode",
        width: canvas.width,
        height: canvas.height,
      };
    })
  );


  const pageId = (i: number) => 3 + i;
  const imgId = (i: number) => 3 + n + i;
  const csId = (i: number) => 3 + 2 * n + i;
  const totalObjs = 3 * n + 2;
  beginObj(1);
  pushStr(`<< /Type /Catalog /Pages 2 0 R >>\n`);
  endObj();
  const kids = Array.from({ length: n }, (_, i) => `${pageId(i)} 0 R`).join(" ");
  beginObj(2);
  pushStr(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>\n`);
  endObj();

  // per-page objects
  for (let i = 0; i < n; i++) {
    const imgInfo = pageImages[i];

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
      `   /Width ${imgInfo.width} /Height ${imgInfo.height}\n` +
      `   /ColorSpace /DeviceRGB /BitsPerComponent 8\n` +
      `   /Filter ${imgInfo.filter} /Length ${imgInfo.bytes.length} >>\n` +
      `stream\n`
    );
    push(imgInfo.bytes);
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
