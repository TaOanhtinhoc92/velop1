import React from 'react';
import { motion } from 'motion/react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Drawing } from '../types';
import { playClickSound } from '../utils/audio';

interface TeacherDeleteModalProps {
  isOpen: boolean;
  drawingToDelete?: Drawing | null;
  batchCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const TeacherDeleteModal: React.FC<TeacherDeleteModalProps> = ({
  isOpen,
  drawingToDelete,
  batchCount,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isBatch = Boolean(batchCount && batchCount > 1);

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border-4 border-rose-200 shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playClickSound();
            onCancel();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 border-2 border-rose-300 flex items-center justify-center text-rose-600 mb-3 shadow-inner">
            <Trash2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800">
            {isBatch ? `Xóa ${batchCount} bài vẽ?` : 'Xác nhận xóa bài vẽ?'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
            Hành động này sẽ xóa vĩnh viễn và không thể khôi phục.
          </p>
        </div>

        {/* Single item info preview */}
        {drawingToDelete && !isBatch && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-5 flex items-center gap-3">
            <div className="w-16 h-12 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-1 shrink-0">
              <img
                src={drawingToDelete.imageData}
                alt="Thumbnail"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xs font-black text-slate-800">
                {drawingToDelete.id}
              </div>
              <div className="text-xs font-bold text-slate-600 truncate">
                {drawingToDelete.studentName || 'Chưa đặt tên học sinh'}
              </div>
            </div>
          </div>
        )}

        {/* Batch warning message */}
        {isBatch && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5 flex items-center gap-2.5 text-amber-800 text-xs font-bold">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
            <span>Thầy/Cô đang chọn xóa {batchCount} bài cùng một lúc.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onConfirm();
            }}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-base shadow-md border-2 border-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-5 h-5" />
            <span>XÓA BÀI VẼ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onCancel();
            }}
            className="py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-base border border-slate-300 active:scale-95 transition-all cursor-pointer"
          >
            HỦY
          </button>
        </div>
      </motion.div>
    </div>
  );
};
