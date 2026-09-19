import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Save, Download, Trash2, Calendar, User, BookOpen, ZoomIn } from 'lucide-react';
import { Drawing } from '../types';
import { playClickSound } from '../utils/audio';

interface TeacherDetailModalProps {
  isOpen: boolean;
  drawing: Drawing | null;
  onClose: () => void;
  onSaveInfo: (id: string, updates: { studentName: string; className: string; notes?: string }) => void;
  onDelete: (id: string) => void;
}

export const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({
  isOpen,
  drawing,
  onClose,
  onSaveInfo,
  onDelete,
}) => {
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [notes, setNotes] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (drawing) {
      setStudentName(drawing.studentName || '');
      setClassName(drawing.className || '');
      setNotes(drawing.notes || '');
      setSavedSuccess(false);
      setIsZoomed(false);
      setIsConfirmingDelete(false);
    }
  }, [drawing]);

  if (!isOpen || !drawing) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${hours}:${mins} – ${day}/${month}/${year}`;
    } catch {
      return isoString;
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    onSaveInfo(drawing.id, {
      studentName: studentName.trim(),
      className: className.trim(),
      notes: notes.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDownload = () => {
    playClickSound();
    const link = document.createElement('a');
    const nameSlug = studentName.trim() ? `_${studentName.trim().replace(/\s+/g, '_')}` : '';
    link.download = `${drawing.id}${nameSlug}.png`;
    link.href = drawing.imageData;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl max-w-4xl w-full border-2 border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl sm:text-2xl font-black flex items-center gap-2">
              <span>Mã bài:</span>
              <span className="font-mono bg-white/20 px-3 py-0.5 rounded-lg">{drawing.id}</span>
            </h3>
            <p className="text-sky-100 text-sm mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Thời gian: {formatDate(drawing.createdAt)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body: Left Drawing Preview, Right Teacher Info Form */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Drawing Viewer */}
          <div className="md:col-span-7 flex flex-col items-center">
            <div className="relative w-full aspect-4/3 bg-slate-50 rounded-2xl border-2 border-slate-200 shadow-inner flex items-center justify-center p-3 overflow-hidden group">
              <img
                src={drawing.imageData}
                alt={`Bài vẽ ${drawing.id}`}
                className={`max-w-full max-h-full object-contain rounded-lg transition-transform duration-300 ${
                  isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
              />
              <button
                type="button"
                onClick={() => setIsZoomed(!isZoomed)}
                className="absolute top-3 right-3 bg-white/90 hover:bg-white text-slate-700 p-2 rounded-xl shadow-md text-xs font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
              >
                <ZoomIn className="w-4 h-4" />
                <span>{isZoomed ? 'Thu nhỏ' : 'Phóng to'}</span>
              </button>
            </div>

            {!isConfirmingDelete ? (
              <div className="flex items-center gap-3 mt-4 w-full">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4 text-sky-600" />
                  <span>Tải ảnh về máy</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsConfirmingDelete(true);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm border border-rose-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa bài này</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 w-full p-3 bg-rose-50 border-2 border-rose-200 rounded-2xl flex flex-col gap-2">
                <p className="text-xs font-black text-rose-700 text-center">
                  ⚠️ Thầy/Cô có chắc chắn muốn xóa vĩnh viễn bài vẽ này?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      onDelete(drawing.id);
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>XÁC NHẬN XÓA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsConfirmingDelete(false);
                    }}
                    className="py-2 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Teacher Information Input */}
          <div className="md:col-span-5 bg-slate-50/80 rounded-2xl p-5 border border-slate-200">
            <h4 className="text-lg font-black text-slate-800 mb-1">
              Bổ sung thông tin học sinh
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Học sinh không phải nhập. Giáo viên có thể nhập tên và lớp tại đây (không bắt buộc).
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-sky-600" />
                  <span>Tên học sinh:</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border-2 border-slate-300 focus:border-sky-500 focus:ring-3 focus:ring-sky-200 text-slate-800 font-bold text-base outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  <span>Lớp:</span>
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ví dụ: 1A1, 1A2"
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border-2 border-slate-300 focus:border-sky-500 focus:ring-3 focus:ring-sky-200 text-slate-800 font-bold text-base outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Ghi chú / Đánh giá của giáo viên:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhận xét tranh (màu sắc tươi sáng, nét vẽ tự nhiên...)"
                  className="w-full px-3.5 py-2 bg-white rounded-xl border-2 border-slate-300 focus:border-sky-500 focus:ring-3 focus:ring-sky-200 text-slate-800 font-semibold text-sm outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-xl font-black text-base shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                  savedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                }`}
              >
                <Save className="w-5 h-5" />
                <span>{savedSuccess ? '✓ ĐÃ LƯU THÀNH CÔNG!' : '💾 LƯU THÔNG TIN'}</span>
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 space-y-1">
              <p>• Trạng thái: <span className="font-bold text-slate-700">{drawing.status === 'submitted' ? 'Đã nộp bài' : 'Bản nháp'}</span></p>
              <p>• Nếu không nhập tên, bài vẽ vẫn lưu và in dưới tên bài tự động.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
