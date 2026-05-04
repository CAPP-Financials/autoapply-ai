/**
 * PDF text extraction via pdfjs-dist. Server-only — pdfjs needs a Node
 * environment for its workers when invoked here.
 *
 * We avoid pdfjs's worker thread by using the legacy build's
 * `getDocument` directly with disabled worker.
 */
type PDFPageProxy = {
  getTextContent(): Promise<{ items: { str?: string; transform?: unknown }[] }>;
};

type PDFDocumentProxy = {
  numPages: number;
  getPage(n: number): Promise<PDFPageProxy>;
  destroy(): Promise<void>;
};

export async function extractPdfText(buf: Uint8Array): Promise<{
  text: string;
  pages: number;
  chars: number;
}> {
  // Lazy import — keeps pdfjs out of the routes that don't touch PDFs.
  // The legacy build avoids the worker thread, which is fragile in
  // serverless environments.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: buf,
    isEvalSupported: false,
    useSystemFonts: false,
    disableFontFace: true,
  });
  const doc: PDFDocumentProxy = await loadingTask.promise;
  const out: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items.map((it) => it.str ?? "").join(" ");
    out.push(text);
  }
  await doc.destroy();
  const text = out.join("\n\n");
  return { text, pages: doc.numPages, chars: text.length };
}
