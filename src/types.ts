export interface Drawing {
  id: string; // e.g. "DRAW-0001"
  imageData: string; // Base64 data URL
  createdAt: string; // ISO format
  updatedAt: string; // ISO format
  status: 'saved' | 'submitted';
  studentName?: string; // Optional, added by teacher
  className?: string; // Optional, added by teacher
  notes?: string;
}

export type DrawingTool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'triangle';

export type AppScreen = 'home' | 'draw' | 'teacher' | 'print-preview';

export type PageOrientation = 'portrait' | 'landscape';

export interface StrokeOption {
  id: string;
  label: string;
  size: number;
}
