export interface DocumentFile {
  name: string;
  type: string;
  size: number;
  content: string;
  file: File;
  pages?: string[];
  totalPages?: number;
}

export interface ReaderState {
  currentDocument: DocumentFile | null;
  isReading: boolean;
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  viewMode: 'single' | 'double';
  fitMode: 'width' | 'height' | 'page' | 'custom';
}

export interface AnnotationData {
  id: string;
  type: 'highlight' | 'drawing' | 'comment';
  page: number;
  position: { x: number; y: number; width?: number; height?: number };
  content?: string;
  color?: string;
  path?: {x: number, y: number}[];
}

export interface SearchResult {
  page: number;
  text: string;
  position: { x: number; y: number };
}

export type SupportedFileType = 'pdf' | 'epub' | 'txt' | 'azw3' | 'unsupported';

export interface ConversionJob {
  id: string;
  inputFile: File;
  inputFormat: string;
  outputFormat: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  outputUrl?: string;
  error?: string;
}