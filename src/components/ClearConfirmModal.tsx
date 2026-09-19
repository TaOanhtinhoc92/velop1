import React from 'react';
import { motion } from 'motion/react';
import { Trash2, X, Check } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface ClearConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-4 border-rose-300 shadow-2xl text-center flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-full bg-rose-100 border-3 border-rose-300 flex items-center justify-center text-3xl mb-3">
          🗑️
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">
          Xóa bức tranh này?
        </h3>

        <p className="text-slate-600 font-bold text-base sm:text-lg mb-6">
          Em có muốn xóa sạch để vẽ lại từ đầu không?
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onConfirm();
            }}
            className="w-full sm:flex-1 py-3.5 px-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-lg shadow-md border-2 border-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-5 h-5" />
            <span>XÓA SẠCH</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onCancel();
            }}
            className="w-full sm:flex-1 py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-lg border-2 border-slate-300 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
            <span>GIỮ LẠI</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
