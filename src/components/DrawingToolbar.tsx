import React from 'react';
import {
  Undo2,
  Redo2,
  Trash2,
  Home,
  Check,
  Square as SquareIcon,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
} from 'lucide-react';
import { DrawingTool, StrokeOption } from '../types';
import { playClickSound, playUndoPing } from '../utils/audio';

export const COLOR_PALETTE = [
  { name: 'Đỏ', hex: '#EF4444' },
  { name: 'Cam', hex: '#F97316' },
  { name: 'Vàng', hex: '#FACC15' },
  { name: 'Xanh lá', hex: '#22C55E' },
  { name: 'Xanh dương', hex: '#3B82F6' },
  { name: 'Tím', hex: '#A855F7' },
  { name: 'Hồng', hex: '#EC4899' },
  { name: 'Nâu', hex: '#854D0E' },
  { name: 'Đen', hex: '#0F172A' },
  { name: 'Trắng', hex: '#FFFFFF' },
];

export const STROKE_OPTIONS: StrokeOption[] = [
  { id: 'small', label: 'Nhỏ', size: 5 },
  { id: 'medium', label: 'Vừa', size: 12 },
  { id: 'large', label: 'To', size: 22 },
  { id: 'huge', label: 'Rất to', size: 38 },
];

interface DrawingToolbarProps {
  currentTool: DrawingTool;
  onSelectTool: (tool: DrawingTool) => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
  currentStrokeSize: number;
  onSelectStrokeSize: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onSubmit: () => void;
  onGoHome: () => void;
  isSaving: boolean;
  saveFeedback: boolean;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  currentTool,
  onSelectTool,
  currentColor,
  onSelectColor,
  currentStrokeSize,
  onSelectStrokeSize,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onSubmit,
  onGoHome,
  isSaving,
  saveFeedback,
}) => {
  return (
    <div className="w-full bg-white/95 border-b-2 border-slate-200 shadow-sm px-2.5 py-1.5 sm:px-4 sm:py-2 select-none z-20">
      {/* Top row: Primary navigation & action buttons */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-1.5 sm:gap-2.5">
        {/* Left: Home & Main Tools (Pen, Shapes, Eraser) */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {/* Home button */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onGoHome();
            }}
            title="Quay về trang chủ"
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Pen button */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onSelectTool('pen');
            }}
            title="Bút vẽ tự do"
            className={`flex items-center gap-1.5 px-3 sm:px-4 h-10 sm:h-12 rounded-xl font-black text-base sm:text-lg border-2 transition-all active:scale-95 cursor-pointer ${
              currentTool === 'pen'
                ? 'bg-sky-500 text-white border-sky-600 shadow-md scale-105 ring-3 ring-sky-200'
                : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
            }`}
          >
            <span className="text-lg sm:text-xl">🖍️</span>
            <span>BÚT</span>
          </button>

          {/* Square / Rectangle Shape */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onSelectTool('rectangle');
            }}
            title="Vẽ hình vuông / hình chữ nhật"
            className={`flex items-center gap-1 px-2.5 sm:px-3.5 h-10 sm:h-12 rounded-xl font-extrabold text-sm sm:text-base border-2 transition-all active:scale-95 cursor-pointer ${
              currentTool === 'rectangle'
                ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105 ring-3 ring-amber-200'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <SquareIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            <span>VUÔNG</span>
          </button>

          {/* Circle / Oval Shape */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onSelectTool('circle');
            }}
            title="Vẽ hình tròn / hình bầu dục"
            className={`flex items-center gap-1 px-2.5 sm:px-3.5 h-10 sm:h-12 rounded-xl font-extrabold text-sm sm:text-base border-2 transition-all active:scale-95 cursor-pointer ${
              currentTool === 'circle'
                ? 'bg-purple-500 text-white border-purple-600 shadow-md scale-105 ring-3 ring-purple-200'
                : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
            }`}
          >
            <CircleIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            <span>TRÒN</span>
          </button>

          {/* Triangle Shape */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onSelectTool('triangle');
            }}
            title="Vẽ hình tam giác"
            className={`flex items-center gap-1 px-2.5 sm:px-3.5 h-10 sm:h-12 rounded-xl font-extrabold text-sm sm:text-base border-2 transition-all active:scale-95 cursor-pointer ${
              currentTool === 'triangle'
                ? 'bg-teal-500 text-white border-teal-600 shadow-md scale-105 ring-3 ring-teal-200'
                : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
            }`}
          >
            <TriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            <span>TAM GIÁC</span>
          </button>

          {/* Eraser button */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onSelectTool('eraser');
            }}
            title="Cục tẩy để xóa nét vẽ"
            className={`flex items-center gap-1.5 px-3 sm:px-4 h-10 sm:h-12 rounded-xl font-black text-base sm:text-lg border-2 transition-all active:scale-95 cursor-pointer ${
              currentTool === 'eraser'
                ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-105 ring-3 ring-rose-200'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span className="text-lg sm:text-xl">🧽</span>
            <span>TẨY</span>
          </button>
        </div>

        {/* Middle: Undo, Redo, Clear */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            disabled={!canUndo}
            onClick={() => {
              playUndoPing();
              onUndo();
            }}
            title="Lùi lại một nét vẽ (Hoàn tác)"
            className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl border-2 font-bold transition-all ${
              canUndo
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 active:scale-95 cursor-pointer shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            disabled={!canRedo}
            onClick={() => {
              playUndoPing();
              onRedo();
            }}
            title="Làm lại nét vừa xóa"
            className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl border-2 font-bold transition-all ${
              canRedo
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 active:scale-95 cursor-pointer shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClear();
            }}
            title="Xóa hết vẽ lại từ đầu"
            className="flex items-center gap-1 px-2.5 sm:px-3 h-10 sm:h-11 rounded-xl bg-amber-50 hover:bg-rose-50 text-amber-800 hover:text-rose-700 border-2 border-amber-200 hover:border-rose-300 font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden lg:inline">XÓA TRANH</span>
          </button>
        </div>

        {/* Right: Save & Submit buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Save button */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              playClickSound();
              onSave();
            }}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 h-10 sm:h-12 rounded-xl font-black text-sm sm:text-base border-2 transition-all active:scale-95 cursor-pointer ${
              saveFeedback
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-3 ring-emerald-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-sm'
            }`}
          >
            {saveFeedback ? (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                <span>ĐÃ LƯU!</span>
              </>
            ) : (
              <>
                <span className="text-base sm:text-lg">💾</span>
                <span>LƯU</span>
              </>
            )}
          </button>

          {/* Submit button (Large and prominent) */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onSubmit();
            }}
            className="flex items-center gap-2 px-4 sm:px-6 h-10 sm:h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-base sm:text-xl border-2 border-emerald-600 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer ring-3 ring-emerald-200/60"
          >
            <span className="text-lg sm:text-xl">📤</span>
            <span>NỘP BÀI</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Color Palette & Stroke Sizes */}
      <div className="max-w-7xl mx-auto mt-1.5 pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        {/* Color Palette: 10 large buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <div className="text-slate-700 font-extrabold text-xs sm:text-sm mr-1 flex items-center gap-1">
            <span>🎨</span>
            <span className="hidden sm:inline">MÀU:</span>
          </div>
          {COLOR_PALETTE.map((color) => {
            const isSelected = currentColor.toLowerCase() === color.hex.toLowerCase() && currentTool !== 'eraser';
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => {
                  playClickSound();
                  onSelectColor(color.hex);
                  if (currentTool === 'eraser') onSelectTool('pen');
                }}
                aria-label={`Chọn màu ${color.name}`}
                title={`Màu ${color.name}`}
                className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 transition-all active:scale-90 cursor-pointer shadow-2xs flex items-center justify-center ${
                  isSelected
                    ? 'scale-115 ring-3 ring-amber-400 z-10 border-white'
                    : 'hover:scale-105 border-slate-300'
                }`}
                style={{ backgroundColor: color.hex }}
              >
                {isSelected && (
                  <Check
                    className={`w-5 h-5 stroke-[3] ${
                      color.hex === '#FFFFFF' || color.hex === '#FACC15' ? 'text-slate-900' : 'text-white'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Stroke Size Options */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="text-slate-700 font-extrabold text-xs sm:text-sm mr-1 flex items-center gap-1">
            <span>📏</span>
            <span className="hidden sm:inline">NÉT:</span>
          </div>
          {STROKE_OPTIONS.map((stroke) => {
            const isSelected = currentStrokeSize === stroke.size;
            return (
              <button
                key={stroke.id}
                type="button"
                onClick={() => {
                  playClickSound();
                  onSelectStrokeSize(stroke.size);
                }}
                title={`Cỡ nét ${stroke.label}`}
                className={`flex flex-col items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl border-2 transition-all active:scale-90 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-200 font-black text-amber-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-bold'
                }`}
              >
                <div
                  className="rounded-full bg-slate-800"
                  style={{
                    width: Math.min(stroke.size, 20),
                    height: Math.min(stroke.size, 20),
                    backgroundColor: currentTool === 'eraser' ? '#EF4444' : currentColor,
                  }}
                />
                <span className="text-[9px] sm:text-[10px] leading-none mt-0.5 font-bold">
                  {stroke.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
