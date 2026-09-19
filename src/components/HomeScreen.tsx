import React from 'react';
import { Palette, Play, Volume2, VolumeX, GraduationCap, RotateCcw, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { playClickSound, isMuted, toggleAudioMute } from '../utils/audio';

interface HomeScreenProps {
  onStartDrawing: (resumeDraft?: boolean) => void;
  onOpenTeacherPortal: () => void;
  hasDraft: boolean;
  onClearDraft: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartDrawing,
  onOpenTeacherPortal,
  hasDraft,
  onClearDraft,
}) => {
  const [muted, setMuted] = React.useState(isMuted());

  const handleSoundToggle = () => {
    const newMuted = toggleAudioMute();
    setMuted(newMuted);
    if (!newMuted) playClickSound();
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-amber-50 via-sky-50 to-emerald-50 flex flex-col items-center justify-between p-4 sm:p-8 overflow-hidden select-none">
      {/* Background playful floating shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-yellow-200 blur-2xl animate-pulse" />
        <div className="absolute top-1/4 right-6 w-56 h-56 rounded-full bg-pink-200 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-blue-200 blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10">
        {/* Sound toggle button */}
        <button
          type="button"
          onClick={handleSoundToggle}
          aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/90 shadow-md hover:shadow-lg border-2 border-amber-200 text-amber-900 font-bold text-base transition-transform active:scale-95"
        >
          {muted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
          <span className="hidden sm:inline">{muted ? 'Bật tiếng' : 'Có tiếng'}</span>
        </button>

        {/* Teacher access button */}
        <button
          type="button"
          onClick={() => {
            playClickSound();
            onOpenTeacherPortal();
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 shadow-md hover:shadow-lg border-2 border-sky-300 text-sky-800 font-extrabold text-base transition-transform active:scale-95 hover:bg-sky-50"
        >
          <GraduationCap className="w-6 h-6 text-sky-600" />
          <span>👩‍🏫 GIÁO VIÊN</span>
        </button>
      </header>

      {/* Main Center Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center z-10 max-w-3xl my-6">
        {/* Big Animated Palette Icon */}
        <motion.div
          initial={{ scale: 0.8, rotate: -6 }}
          animate={{ scale: [0.95, 1.05, 1], rotate: [-4, 4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          className="relative mb-3 sm:mb-4"
        >
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-400 to-sky-400 p-1.5 shadow-xl flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center text-5xl sm:text-7xl">
              🎨
            </div>
          </div>
          {/* Sparkles decoration */}
          <span className="absolute -top-3 -right-3 text-3xl animate-bounce">✨</span>
          <span className="absolute -bottom-2 -left-2 text-2xl">🌟</span>
        </motion.div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-amber-900 drop-shadow-sm mb-3">
          GÓC VẼ TRANH
        </h1>

        {/* Subtitle */}
        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-800/90 mb-8 sm:mb-10 max-w-xl">
          "Hãy vẽ một bức tranh thật đẹp!"
        </p>

        {/* Giant Start Drawing Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          type="button"
          onClick={() => {
            playClickSound();
            onStartDrawing(false);
          }}
          className="w-full max-w-md py-6 sm:py-7 px-8 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-2xl sm:text-4xl shadow-2xl shadow-emerald-400/40 border-4 border-white flex items-center justify-center gap-4 transition-all duration-200 cursor-pointer"
        >
          <span className="text-3xl sm:text-4xl">🖍️</span>
          <span>BẮT ĐẦU VẼ</span>
        </motion.button>

        {/* Auto-save Draft Recovery Banner (if draft exists) */}
        {hasDraft && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 w-full max-w-md bg-white/95 rounded-2xl p-5 border-3 border-amber-300 shadow-xl flex flex-col items-center gap-3"
          >
            <p className="text-amber-900 font-extrabold text-lg sm:text-xl">
              🎨 Em có một bài vẽ chưa hoàn thành!
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onStartDrawing(true);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-base sm:text-lg shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <RotateCcw className="w-5 h-5" />
                <span>TIẾP TỤC VẼ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onClearDraft();
                }}
                className="py-3 px-4 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-base shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                title="Xóa bài nháp này"
              >
                <Trash2 className="w-5 h-5" />
                <span>XÓA</span>
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Simple Footer reassuring zero login or requirements */}
      <footer className="w-full text-center text-sm sm:text-base font-semibold text-slate-500 z-10 py-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/60 rounded-full">
          ✨ Vẽ tự do không cần đăng nhập • Dành cho học sinh lớp 1
        </span>
      </footer>
    </div>
  );
};
