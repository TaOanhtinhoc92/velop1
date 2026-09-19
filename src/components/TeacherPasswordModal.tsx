import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, KeyRound, X, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface TeacherPasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

const DEFAULT_PASSWORD = '1234';
const STORAGE_KEY = 'teacher_portal_password';

export function getTeacherPassword(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_PASSWORD;
  } catch {
    return DEFAULT_PASSWORD;
  }
}

export function setTeacherPassword(newPass: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, newPass);
  } catch {
    // ignore
  }
}

export const TeacherPasswordModal: React.FC<TeacherPasswordModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassInput, setNewPassInput] = useState('');
  const [changeSuccessMsg, setChangeSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    const correctPassword = getTeacherPassword();

    if (passwordInput.trim() === correctPassword) {
      setErrorMsg('');
      setPasswordInput('');
      onSuccess();
    } else {
      setErrorMsg('Mật khẩu chưa đúng. Vui lòng thử lại!');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!newPassInput.trim()) {
      setErrorMsg('Mật khẩu mới không được để trống!');
      return;
    }
    setTeacherPassword(newPassInput.trim());
    setChangeSuccessMsg('Đã đổi mật khẩu mới thành công!');
    setNewPassInput('');
    setTimeout(() => {
      setChangeSuccessMsg('');
      setIsChangingPass(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-4 border-sky-300 shadow-2xl relative"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 border-2 border-sky-300 flex items-center justify-center text-3xl mb-3 shadow-inner">
            👩‍🏫
          </div>
          <h3 className="text-2xl font-black text-slate-800 flex items-center gap-1.5">
            <Lock className="w-5 h-5 text-sky-600" />
            <span>Khu vực Giáo viên</span>
          </h3>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Vui lòng nhập mật khẩu để quản lý và in bài vẽ
          </p>
        </div>

        {!isChangingPass ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Nhập mật khẩu..."
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-center text-xl font-bold tracking-wider text-slate-800 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password hint for the teacher */}
              <p className="text-xs text-center text-slate-400 font-semibold mt-2">
                💡 Mật khẩu mặc định: <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">1234</span>
              </p>

              {errorMsg && (
                <p className="text-sm font-bold text-rose-600 text-center mt-2 animate-bounce">
                  ⚠️ {errorMsg}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-lg shadow-md border-2 border-sky-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-5 h-5" />
              <span>XÁC NHẬN VÀO</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPass(true);
                  setErrorMsg('');
                }}
                className="text-xs text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer"
              >
                Đổi mật khẩu mới
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                Nhập mật khẩu mới bạn muốn đặt:
              </label>
              <input
                type="text"
                autoFocus
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                placeholder="Ví dụ: 2026 hoặc abcd"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-2xl text-center text-lg font-bold text-slate-800 focus:border-sky-500 focus:bg-white outline-none"
              />
              {changeSuccessMsg && (
                <p className="text-sm font-bold text-emerald-600 text-center mt-2">
                  ✓ {changeSuccessMsg}
                </p>
              )}
              {errorMsg && (
                <p className="text-sm font-bold text-rose-600 text-center mt-2">
                  ⚠️ {errorMsg}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow cursor-pointer"
              >
                Lưu mật khẩu mới
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPass(false);
                  setErrorMsg('');
                }}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
              >
                Quay lại
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
