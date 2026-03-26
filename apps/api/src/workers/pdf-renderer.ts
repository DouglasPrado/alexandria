/**
 * PDF Renderer — renderiza primeira página de um PDF como PNG via pdfjs-dist + canvas.
 * Produz preview real da primeira página, semelhante ao Google Drive.
 * Fonte: docs/blueprint/04-domain-model.md (RN-P5)
 *
 * Stack: pdfjs-dist v4 (Mozilla PDF.js) + node-canvas para render server-side.
 * Sem dependências de poppler/pdfium/ghostscript.
 */
import { createCanvas, type Canvas } from 'canvas';

// pdfjs-dist v4 legacy build — CJS-compatible
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

/**
 * CanvasFactory para pdfjs-dist em Node.js.
 * Obrigatório para PDFs com imagens, masks ou patterns embeddados —
 * pdfjs-dist cria canvases internamente para composição e o nome do parâmetro
 * na v4+ é `CanvasFactory` (com C maiúsculo).
 */
class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    return { canvas, context: canvas.getContext('2d') };
  }

  reset(pair: { canvas: Canvas }, width: number, height: number) {
    pair.canvas.width = width;
    pair.canvas.height = height;
  }

  destroy(pair: { canvas: Canvas }) {
    pair.canvas.width = 0;
    pair.canvas.height = 0;
  }
}

/**
 * Renderiza a primeira página do PDF como PNG com largura alvo.
 * @param pdfBuffer  Conteúdo binário do PDF
 * @param targetWidth Largura alvo em px (padrão: 300)
 * @returns Buffer PNG pronto para armazenamento
 */
export async function renderPdfPage(pdfBuffer: Buffer, targetWidth = 300): Promise<Buffer> {
  const data = new Uint8Array(pdfBuffer);
  // pdfjs-dist v4: CanvasFactory recebe a CLASSE (não instância)
  const doc = await pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    CanvasFactory: NodeCanvasFactory,
  }).promise;

  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1.0 });

  const scale = targetWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale });

  const canvas = createCanvas(
    Math.floor(scaledViewport.width),
    Math.floor(scaledViewport.height),
  );
  const ctx = canvas.getContext('2d');

  // Fundo branco — PDFs com fundo transparente aparecem preto sem isso
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

  await doc.destroy();
  return canvas.toBuffer('image/png');
}

/**
 * Extrai o número total de páginas do PDF.
 */
export async function getPdfPageCount(pdfBuffer: Buffer): Promise<number> {
  const data = new Uint8Array(pdfBuffer);
  const doc = await pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    CanvasFactory: NodeCanvasFactory,
  }).promise;
  const count = doc.numPages as number;
  await doc.destroy();
  return count;
}
