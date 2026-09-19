import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { Sparkles, Home, Play, Download } from 'lucide-react';
import { playCelebrationFanfare, playClickSound } from '../utils/audio';

interface SubmissionSuccessModalProps {
  isOpen: boolean;
  drawingId: string;
  imageData: string;
  onNewDrawing: () => void;
  onGoHome: () => void;
}

export const SubmissionSuccessModal: React.FC<SubmissionSuccessModalProps> = ({
  isOpen,
  drawingId,
  imageData,
  onNewDrawing,
  onGoHome,
}) => {
  useEffect(() => {
    if (isOpen) {
      playCelebrationFanfare();

      // Launch cheerful confetti bursts
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 300);
      } catch {
        // ignore if confetti fails
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = () => {
    playClickSound();
    const link = document.createElement('a');
    link.download = `${drawingId}.png`;
    link.href = imageData;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border-4 border-amber-300 shadow-2xl text-center flex flex-col items-center"
      >
        {/* Celebration icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-300 flex items-center justify-center text-4xl mb-3 shadow-inner">
          🎉
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-emerald-800 mb-1 flex items-center justify-center gap-2">
          <span>Bài vẽ đã được nộp!</span>
        </h2>

        <p className="text-slate-600 font-bold text-base sm:text-lg mb-4">
          Bức tranh của em thật tuyệt vời! ✨
        </p>

        {/* Thumbnail preview of the submitted drawing */}
        <div className="relative w-full max-w-xs aspect-4/3 bg-slate-50 rounded-2xl border-3 border-slate-200 overflow-hidden shadow-md mb-3 flex items-center justify-center">
          {imageData ? (
            <img
              src={imageData}
              alt="Bài vẽ vừa nộp"
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <div className="text-slate-400">Tranh vẽ</div>
          )}
          <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-xs font-mono font-bold px-2 py-1 rounded-md">
            Mã: {drawingId}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full mt-3">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onNewDrawing();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xl sm:text-2xl shadow-lg hover:shadow-xl border-3 border-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span className="text-2xl">🎨</span>
            <span>BẮT ĐẦU VẼ BÀI MỚI</span>
          </button>

          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onGoHome();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-base border-2 border-amber-300 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-5 h-5" />
              <span>Về trang chủ</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base border-2 border-slate-300 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Tải ảnh về máy"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Tải ảnh</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
