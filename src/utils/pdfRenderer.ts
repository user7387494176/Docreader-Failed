import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PDFPageData {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  textContent: string;
  width: number;
  height: number;
}

export class PDFRenderer {
  private pdf: pdfjsLib.PDFDocumentProxy | null = null;
  private pages: Map<number, PDFPageData> = new Map();

  async loadPDF(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const loadingTask = pdfjsLib.getDocument({ 
            data: arrayBuffer,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
            cMapPacked: true
          });
          
          this.pdf = await loadingTask.promise;
          resolve();
        } catch (error) {
          reject(new Error('Failed to load PDF file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  async renderPage(pageNumber: number, scale: number = 1.5): Promise<PDFPageData> {
    if (!this.pdf) {
      throw new Error('PDF not loaded');
    }

    // Check if page is already rendered at this scale
    const cacheKey = pageNumber;
    if (this.pages.has(cacheKey)) {
      return this.pages.get(cacheKey)!;
    }

    const page = await this.pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    // Extract text content
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    const pageData: PDFPageData = {
      pageNumber,
      canvas,
      textContent: pageText,
      width: viewport.width,
      height: viewport.height
    };

    this.pages.set(cacheKey, pageData);
    return pageData;
  }

  getPageCount(): number {
    return this.pdf?.numPages || 0;
  }

  async getAllTextContent(): Promise<string> {
    if (!this.pdf) return '';
    
    let fullText = '';
    for (let i = 1; i <= this.pdf.numPages; i++) {
      const page = await this.pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ') + '\n\n';
      fullText += pageText;
    }
    return fullText;
  }

  clearCache(): void {
    this.pages.clear();
  }
}