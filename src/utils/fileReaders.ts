import * as pdfjsLib from 'pdfjs-dist';
import ePub from 'epubjs';
import { DocumentFile, SupportedFileType } from '../types/documents';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const getSupportedFileType = (file: File): SupportedFileType => {
  const extension = file.name.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'epub':
      return 'epub';
    case 'txt':
      return 'txt';
    case 'azw3':
      return 'azw3';
    default:
      return 'unsupported';
  }
};

export const readTextFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
};

export const readPDFFile = async (file: File): Promise<string> => {
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
        
        const pdf = await loadingTask.promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ') + '\n\n';
          fullText += pageText;
        }
        
        resolve(fullText);
      } catch (error) {
        console.error('PDF reading error:', error);
        reject(new Error('Failed to read PDF file. The file may be corrupted or password-protected.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
};

export const readEPUBFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const book = ePub(arrayBuffer);
        
        let fullText = '';
        const spine = await book.loaded.spine;
        
        for (const item of spine.spineItems) {
          try {
            const doc = await book.load(item.href);
            // Better text extraction for EPUB
            const textNodes = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div');
            for (const node of textNodes) {
              const text = node.textContent?.trim();
              if (text) {
                fullText += text + '\n\n';
              }
            }
          } catch (itemError) {
            console.warn('Failed to load EPUB item:', item.href, itemError);
          }
        }
        
        resolve(fullText);
      } catch (error) {
        console.error('EPUB reading error:', error);
        reject(new Error('Failed to read EPUB file. The file may be corrupted or DRM-protected.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read EPUB file'));
    reader.readAsArrayBuffer(file);
  });
};

export const readDocumentFile = async (file: File): Promise<DocumentFile> => {
  const fileType = getSupportedFileType(file);
  let content = '';
  
  try {
    switch (fileType) {
      case 'txt':
        content = await readTextFile(file);
        break;
      case 'pdf':
        content = await readPDFFile(file);
        break;
      case 'epub':
        content = await readEPUBFile(file);
        break;
      case 'azw3':
        throw new Error('AZW3 format is not supported due to DRM restrictions. Please convert to EPUB first.');
      default:
        throw new Error('Unsupported file format. Please use PDF, EPUB, or TXT files.');
    }
    
    return {
      name: file.name,
      type: fileType,
      size: file.size,
      content,
      file
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};