import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawingTool } from '../types';
import { playEraserSound, playPencilTick } from '../utils/audio';

interface Point {
  x: number;
  y: number;
}

interface DrawingCanvasProps {
  currentTool: DrawingTool;
  currentColor: string;
  currentStrokeSize: number;
  onCanUndoChange: (canUndo: boolean) => void;
  onCanRedoChange: (canRedo: boolean) => void;
  onDraftAutoSave: (dataUrl: string) => void;
  initialImageData?: string;
  canvasRefOut: React.MutableRefObject<HTMLCanvasElement | null>;
  undoTrigger: number;
  redoTrigger: number;
  clearTrigger: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  currentTool,
  currentColor,
  currentStrokeSize,
  onCanUndoChange,
  onCanRedoChange,
  onDraftAutoSave,
  initialImageData,
  canvasRefOut,
  undoTrigger,
  redoTrigger,
  clearTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<Point | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const pointsRef = useRef<Point[]>([]);
  // Offscreen snapshot for shape live preview
  const shapeSnapshotRef = useRef<ImageData | null>(null);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Sync canvasRef with outer ref
  useEffect(() => {
    canvasRefOut.current = canvasRef.current;
  }, [canvasRefOut]);

  // Update undo/redo availability to parent
  useEffect(() => {
    onCanUndoChange(historyIndex > 0);
    onCanRedoChange(historyIndex < history.length - 1);
  }, [historyIndex, history.length, onCanUndoChange, onCanRedoChange]);

  // Save current canvas state to history
  const pushState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    setHistory((prev) => {
      // Cut off any redo states if we drew after an undo
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(dataUrl);
      if (newHistory.length > 25) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 24));

    // Trigger auto-save draft
    onDraftAutoSave(dataUrl);
  }, [historyIndex, onDraftAutoSave]);

  // Initialize canvas size and default white background
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Fill maximum available space in container
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);

    if (width <= 0 || height <= 0) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    if (initialImageData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png');
        setHistory([dataUrl]);
        setHistoryIndex(0);
      };
      img.src = initialImageData;
    } else {
      const dataUrl = canvas.toDataURL('image/png');
      setHistory([dataUrl]);
      setHistoryIndex(0);
    }
  }, [initialImageData]);

  // Setup on mount and resize
  useEffect(() => {
    initCanvas();

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const currentSnapshot = canvas.toDataURL('image/png');
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (width <= 0 || height <= 0) return;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = currentSnapshot;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  // Restore canvas to a given history index
  const restoreToState = useCallback((targetIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas || targetIndex < 0 || targetIndex >= history.length) return;

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const container = containerRef.current;
      const width = container ? container.clientWidth : canvas.width;
      const height = container ? container.clientHeight : canvas.height;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      const dpr = window.devicePixelRatio || 1;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
    };
    img.src = history[targetIndex];
    setHistoryIndex(targetIndex);
    onDraftAutoSave(history[targetIndex]);
  }, [history, onDraftAutoSave]);

  // Handle parent Undo trigger
  useEffect(() => {
    if (undoTrigger > 0 && historyIndex > 0) {
      restoreToState(historyIndex - 1);
    }
  }, [undoTrigger, historyIndex, restoreToState]);

  // Handle parent Redo trigger
  useEffect(() => {
    if (redoTrigger > 0 && historyIndex < history.length - 1) {
      restoreToState(historyIndex + 1);
    }
  }, [redoTrigger, historyIndex, history.length, restoreToState]);

  // Handle parent Clear trigger
  useEffect(() => {
    if (clearTrigger > 0) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      pushState();
    }
  }, [clearTrigger, pushState]);

  // Get coordinate relative to canvas in CSS pixels
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Draw shape helper
  const drawShapeOnContext = (
    ctx: CanvasRenderingContext2D,
    tool: DrawingTool,
    start: Point,
    end: Point,
    color: string,
    size: number
  ) => {
    ctx.lineWidth = size;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'rectangle') {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      ctx.beginPath();
      ctx.strokeRect(x, y, w, h);
    } else if (tool === 'circle') {
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      const cx = Math.min(start.x, end.x) + rx;
      const cy = Math.min(start.y, end.y) + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === 'triangle') {
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);
      const topX = (minX + maxX) / 2;
      const topY = minY;

      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(maxX, maxY);
      ctx.lineTo(minX, maxY);
      ctx.closePath();
      ctx.stroke();
    }
  };

  // Pointer event handlers for Mouse, Touchpad, and Touchscreen
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    isDrawingRef.current = true;
    const pt = getCanvasPoint(e);
    startPointRef.current = pt;
    lastPointRef.current = pt;
    pointsRef.current = [pt];

    if (currentTool === 'eraser') {
      playEraserSound();
    } else {
      playPencilTick();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isShapeTool =
      currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'triangle';

    if (isShapeTool) {
      // Save canvas snapshot to allow live dragging preview
      shapeSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
      // Draw single point immediately in case of quick tap
      ctx.beginPath();
      const strokeColor = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
      const size = currentTool === 'eraser' ? currentStrokeSize * 1.6 : currentStrokeSize;
      ctx.fillStyle = strokeColor;
      ctx.arc(pt.x, pt.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = getCanvasPoint(e);
    const isShapeTool =
      currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'triangle';

    if (isShapeTool) {
      // Restore previous snapshot, then render updated live preview of shape
      if (shapeSnapshotRef.current && startPointRef.current) {
        ctx.putImageData(shapeSnapshotRef.current, 0, 0);
        drawShapeOnContext(
          ctx,
          currentTool,
          startPointRef.current,
          pt,
          currentColor,
          currentStrokeSize
        );
      }
    } else {
      // Freeform Pen or Eraser
      const points = pointsRef.current;
      points.push(pt);

      ctx.lineWidth = currentTool === 'eraser' ? currentStrokeSize * 1.6 : currentStrokeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;

      if (points.length >= 3) {
        const p0 = points[points.length - 3];
        const p1 = points[points.length - 2];
        const p2 = points[points.length - 1];

        const mid1x = (p0.x + p1.x) / 2;
        const mid1y = (p0.y + p1.y) / 2;
        const mid2x = (p1.x + p2.x) / 2;
        const mid2y = (p1.y + p2.y) / 2;

        ctx.beginPath();
        ctx.moveTo(mid1x, mid1y);
        ctx.quadraticCurveTo(p1.x, p1.y, mid2x, mid2y);
        ctx.stroke();
      } else if (lastPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }

      lastPointRef.current = pt;
    }
  };

  const finishDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const isShapeTool =
      currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'triangle';

    if (isShapeTool && ctx && shapeSnapshotRef.current && startPointRef.current) {
      const pt = getCanvasPoint(e);
      // Restore clean snapshot and draw final committed shape
      ctx.putImageData(shapeSnapshotRef.current, 0, 0);
      drawShapeOnContext(
        ctx,
        currentTool,
        startPointRef.current,
        pt,
        currentColor,
        currentStrokeSize
      );
      shapeSnapshotRef.current = null;
    }

    pointsRef.current = [];
    lastPointRef.current = null;
    startPointRef.current = null;

    if (canvas && e.pointerId) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    pushState();
  };

  // Descriptive tool labels for kids
  const getToolLabel = () => {
    switch (currentTool) {
      case 'eraser':
        return { icon: '🧽', text: 'Đang dùng Tẩy' };
      case 'rectangle':
        return { icon: '🔲', text: 'Vẽ Hình Vuông' };
      case 'circle':
        return { icon: '⭕', text: 'Vẽ Hình Tròn' };
      case 'triangle':
        return { icon: '🔺', text: 'Vẽ Hình Tam Giác' };
      case 'pen':
      default:
        return { icon: '🖍️', text: 'Đang dùng Bút' };
    }
  };

  const toolInfo = getToolLabel();

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full flex items-center justify-center p-1 sm:p-2.5 bg-slate-200/60 overflow-hidden"
    >
      {/* Canvas Paper Container: Expanded to maximize drawing area ("chỗ vẽ to ra") */}
      <div className="relative w-full h-full max-w-[99.5%] max-h-[99%] bg-white rounded-xl sm:rounded-2xl shadow-xl border-3 sm:border-4 border-amber-300 ring-2 sm:ring-4 ring-amber-100 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrawing}
          onPointerCancel={finishDrawing}
          className="touch-none cursor-crosshair bg-white w-full h-full block"
        />

        {/* Floating Tool Indicator in top-left corner */}
        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm border-2 border-slate-200 px-3 py-1.5 rounded-full shadow-md flex items-center gap-2 pointer-events-none select-none z-10">
          <span className="text-xl">{toolInfo.icon}</span>
          <span className="text-xs sm:text-sm font-black text-slate-800">
            {toolInfo.text}
          </span>
          <div
            className="w-3.5 h-3.5 rounded-full border border-slate-300"
            style={{ backgroundColor: currentTool === 'eraser' ? '#FFFFFF' : currentColor }}
          />
        </div>
      </div>
    </div>
  );
};
