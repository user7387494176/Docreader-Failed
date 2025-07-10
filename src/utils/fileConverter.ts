import { jsPDF } from 'jspdf';
import ePub from 'epubjs';
import { ConversionJob } from '../types/documents';

export const convertFile = async (
  job: ConversionJob, 
  onProgress: (progress: number) => void
): Promise<string> => {
  onProgress(5);
  
  try {
    if (job.inputFormat === 'epub') {
      return await convertEpubToPdfAdvanced(job.inputFile, onProgress);
    } else if (job.inputFormat === 'azw3') {
      return await convertAzw3ToPdf(job.inputFile, onProgress);
    }
    
    throw new Error('Unsupported format');
  } catch (error) {
    throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const convertEpubToPdfAdvanced = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        onProgress(10);
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const book = ePub(arrayBuffer);
        
        onProgress(20);
        
        // Load book metadata and spine
        const [metadata, spine, navigation] = await Promise.all([
          book.loaded.metadata,
          book.loaded.spine,
          book.loaded.navigation
        ]);
        
        onProgress(30);
        
        // Create PDF using jsPDF for better browser compatibility
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Add title page
        pdf.setFontSize(24);
        pdf.text(metadata.title || 'Untitled', 105, 50, { align: 'center' });
        
        if (metadata.creator) {
          pdf.setFontSize(16);
          pdf.text(`by ${metadata.creator}`, 105, 70, { align: 'center' });
        }
        
        pdf.addPage();
        
        // Process each chapter/section
        const totalItems = spine.spineItems.length;
        let processedItems = 0;
        
        for (const item of spine.spineItems) {
          try {
            onProgress(30 + (processedItems / totalItems) * 60);
            
            const section = book.section(item.href);
            await section.load();
            
            // Extract and clean text content
            const textContent = await extractTextFromSection(section);
            
            if (textContent.trim()) {
              // Add chapter title if available
              const chapterTitle = getChapterTitle(item, navigation);
              if (chapterTitle) {
                pdf.setFontSize(18);
                pdf.text(chapterTitle, 20, pdf.internal.pageSize.height - 250);
                pdf.setFontSize(12);
              }
              
              // Add chapter content with proper formatting
              const lines = pdf.splitTextToSize(textContent, 170);
              pdf.text(lines, 20, pdf.internal.pageSize.height - 230);
              
              // Add page break between chapters (except for last)
              if (processedItems < totalItems - 1) {
                pdf.addPage();
              }
            }
            
            processedItems++;
          } catch (itemError) {
            console.warn('Failed to process EPUB section:', item.href, itemError);
            processedItems++;
          }
        }
        
        onProgress(95);
        
        // Generate PDF blob
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        
        onProgress(100);
        resolve(url);
        
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read EPUB file'));
    reader.readAsArrayBuffer(file);
  });
};

const extractTextFromSection = async (section: any): Promise<string> => {
  try {
    const doc = await section.load();
    
    // Remove script and style elements
    const scripts = doc.querySelectorAll('script, style');
    scripts.forEach((el: Element) => el.remove());
    
    // Extract text from paragraphs, headings, and other text elements
    const textElements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span, li, blockquote');
    const textParts: string[] = [];
    
    textElements.forEach((element: Element) => {
      const text = element.textContent?.trim();
      if (text && text.length > 0) {
        // Preserve some basic formatting cues
        const tagName = element.tagName.toLowerCase();
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          textParts.push(`\n\n### ${text}\n`);
        } else if (tagName === 'blockquote') {
          textParts.push(`\n"${text}"\n`);
        } else {
          textParts.push(text + '\n');
        }
      }
    });
    
    return textParts.join('').replace(/\n{3,}/g, '\n\n').trim();
  } catch (error) {
    console.warn('Failed to extract text from section:', error);
    return '';
  }
};

const getChapterTitle = (item: any, navigation: any): string => {
  try {
    // Try to find chapter title from navigation
    if (navigation && navigation.toc) {
      for (const tocItem of navigation.toc) {
        if (tocItem.href === item.href || tocItem.href.includes(item.href)) {
          return tocItem.label;
        }
      }
    }
    
    // Fallback to item id or href
    return item.id || item.href.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Chapter';
  } catch (error) {
    return 'Chapter';
  }
};

// Fallback conversion using jsPDF for simpler cases
const convertEpubToPdfSimple = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        onProgress(20);
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const book = ePub(arrayBuffer);
        
        onProgress(40);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        let pageCount = 0;
        const spine = await book.loaded.spine;
        const totalItems = spine.spineItems.length;
        
        // Add title page
        const metadata = await book.loaded.metadata;
        pdf.setFontSize(20);
        pdf.text(metadata.title || 'Untitled', 105, 50, { align: 'center' });
        
        if (metadata.creator) {
          pdf.setFontSize(14);
          pdf.text(`by ${metadata.creator}`, 105, 70, { align: 'center' });
        }
        
        pdf.addPage();
        pageCount++;
        
        for (let i = 0; i < totalItems; i++) {
          const item = spine.spineItems[i];
          const doc = await book.load(item.href);
          
          // Extract text content
          const textElements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div');
          let content = '';
          
          textElements.forEach((element: Element) => {
            const text = element.textContent?.trim();
            if (text) {
              content += text + '\n\n';
            }
          });
          
          if (content.trim()) {
            if (pageCount > 1) {
              pdf.addPage();
            }
            
            // Set font and add content
            pdf.setFontSize(12);
            const lines = pdf.splitTextToSize(content, 170);
            pdf.text(lines, 20, 20);
            pageCount++;
          }
          
          onProgress(40 + (i / totalItems) * 50);
        }
        
        onProgress(90);
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        
        onProgress(100);
        resolve(url);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read EPUB file'));
    reader.readAsArrayBuffer(file);
  });
};

const convertAzw3ToPdf = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
  // AZW3 files are typically DRM-protected
  // This is a more informative error message
  return new Promise((resolve, reject) => {
    onProgress(25);
    setTimeout(() => {
      onProgress(50);
      setTimeout(() => {
        onProgress(75);
        setTimeout(() => {
          reject(new Error(
            'AZW3 files are typically DRM-protected and cannot be converted directly. ' +
            'Please use DRM-free files or convert to EPUB first using tools like Calibre.'
          ));
        }, 500);
      }, 500);
    }, 500);
  });
};

// Enhanced conversion with better error handling and format detection
export const convertFileEnhanced = async (
  job: ConversionJob, 
  onProgress: (progress: number) => void
): Promise<string> => {
  onProgress(2);
  
  try {
    // Validate file format
    if (!['epub', 'azw3'].includes(job.inputFormat.toLowerCase())) {
      throw new Error(`Unsupported input format: ${job.inputFormat}`);
    }
    
    onProgress(5);
    
    // Check file size (warn for very large files)
    const fileSizeMB = job.inputFile.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      console.warn(`Large file detected (${fileSizeMB.toFixed(1)}MB). Conversion may take longer.`);
    }
    
    if (job.inputFormat === 'epub') {
      // Try advanced conversion first, fallback to simple if needed
      try {
        return await convertEpubToPdfAdvanced(job.inputFile, onProgress);
      } catch (advancedError) {
        console.warn('Advanced conversion failed, trying simple conversion:', advancedError);
        onProgress(10); // Reset progress for fallback
        return await convertEpubToPdfSimple(job.inputFile, onProgress);
      }
    } else if (job.inputFormat === 'azw3') {
      return await convertAzw3ToPdf(job.inputFile, onProgress);
    }
    
    throw new Error('Unsupported format');
  } catch (error) {
    throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};