import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Printer,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  Filter,
  Calendar,
  Layers,
  UserCheck,
  UserX,
  Palette,
  KeyRound,
} from 'lucide-react';
import { Drawing } from '../types';
import { TeacherDetailModal } from './TeacherDetailModal';
import { TeacherPasswordModal } from './TeacherPasswordModal';
import { TeacherDeleteModal } from './TeacherDeleteModal';
import { playClickSound } from '../utils/audio';

interface TeacherPortalProps {
  drawings: Drawing[];
  onBackToApp: () => void;
  onOpenDrawingRoom: () => void;
  onUpdateDrawing: (id: string, updates: { studentName: string; className: string; notes?: string }) => void;
  onDeleteDrawing: (id: string) => void;
  onBatchDeleteDrawings: (ids: string[]) => void;
  onOpenPrintPreview: (selectedDrawings: Drawing[]) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  drawings,
  onBackToApp,
  onOpenDrawingRoom,
  onUpdateDrawing,
  onDeleteDrawing,
  onBatchDeleteDrawings,
  onOpenPrintPreview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'named' | 'unnamed'>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingDrawing, setViewingDrawing] = useState<Drawing | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    drawingToDelete?: Drawing | null;
    batchCount?: number;
  }>({
    isOpen: false,
  });

  // Extract unique dates for filtering
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    drawings.forEach((d) => {
      try {
        const dateStr = new Date(d.createdAt).toLocaleDateString('vi-VN');
        dates.add(dateStr);
      } catch {
        // ignore
      }
    });
    return Array.from(dates);
  }, [drawings]);

  // Filtered drawings
  const filteredDrawings = useMemo(() => {
    return drawings.filter((d) => {
      // Search text in ID, studentName, className
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.id.toLowerCase().includes(q) ||
        (d.studentName && d.studentName.toLowerCase().includes(q)) ||
        (d.className && d.className.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'named' && (!d.studentName || !d.studentName.trim())) return false;
      if (statusFilter === 'unnamed' && Boolean(d.studentName && d.studentName.trim())) return false;

      // Date filter
      if (dateFilter !== 'all') {
        const itemDate = new Date(d.createdAt).toLocaleDateString('vi-VN');
        if (itemDate !== dateFilter) return false;
      }

      return true;
    });
  }, [drawings, searchQuery, statusFilter, dateFilter]);

  // Selection handlers
  const toggleSelectOne = (id: string) => {
    playClickSound();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectCount = (count: number) => {
    playClickSound();
    const idsToSelect = filteredDrawings.slice(0, count).map((d) => d.id);
    setSelectedIds(new Set(idsToSelect));
  };

  const handleSelectAll = () => {
    playClickSound();
    setSelectedIds(new Set(filteredDrawings.map((d) => d.id)));
  };

  const handleDeselectAll = () => {
    playClickSound();
    setSelectedIds(new Set());
  };

  // Format date helper: "10:25 19/09"
  const formatCardDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${hours}:${mins} ${day}/${month}`;
    } catch {
      return '';
    }
  };

  const selectedDrawingsList = useMemo(() => {
    return drawings.filter((d) => selectedIds.has(d.id));
  }, [drawings, selectedIds]);

  const handleBatchPrint = () => {
    if (selectedDrawingsList.length === 0) return;
    playClickSound();
    onOpenPrintPreview(selectedDrawingsList);
  };

  const handleBatchDelete = () => {
    if (selectedDrawingsList.length === 0) return;
    playClickSound();
    setDeleteModalState({
      isOpen: true,
      batchCount: selectedDrawingsList.length,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteModalState.batchCount && deleteModalState.batchCount > 1) {
      onBatchDeleteDrawings(Array.from(selectedIds));
      setSelectedIds(new Set());
    } else if (deleteModalState.drawingToDelete) {
      onDeleteDrawing(deleteModalState.drawingToDelete.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteModalState.drawingToDelete!.id);
        return next;
      });
    }
    setDeleteModalState({ isOpen: false });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none">
      {/* Teacher Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Back to Home & Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onBackToApp();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm border border-slate-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Trang chủ</span>
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                <span>👩‍🏫 KHU VỰC GIÁO VIÊN</span>
              </h1>
              <p className="text-xs text-slate-500 font-bold">
                Quản lý bài vẽ, đặt tên học sinh và ghép in khổ A4 (2×2)
              </p>
            </div>
          </div>

          {/* Actions: Change Password & Drawing screen */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsPasswordModalOpen(true);
              }}
              title="Đổi mật khẩu cổng giáo viên"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm border border-slate-300 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Đổi mật khẩu</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenDrawingRoom();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-sm transition-colors cursor-pointer"
            >
              <Palette className="w-4 h-4" />
              <span>Màn hình vẽ</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-100/80 border-t border-slate-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã bài (DRAW-0001) hoặc tên..."
                className="w-full pl-9 pr-3.5 py-2 bg-white rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-slate-800 text-sm font-bold outline-none"
              />
            </div>

            {/* Date filter */}
            {uniqueDates.length > 0 && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-white px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm outline-none cursor-pointer"
                >
                  <option value="all">Tất cả các ngày</option>
                  {uniqueDates.map((dateStr) => (
                    <option key={dateStr} value={dateStr}>
                      Ngày {dateStr}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status filters */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-sky-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Tất cả ({drawings.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('named')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'named'
                    ? 'bg-sky-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Đã đặt tên
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('unnamed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'unnamed'
                    ? 'bg-sky-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Chưa có tên
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col">
        {/* Bulk Selection Bar (Specs: Chọn 4 bài, 8 bài, 12 bài, 16 bài...) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Quick select shortcuts */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-extrabold text-slate-700 flex items-center gap-1">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Chọn nhanh:</span>
            </span>

            <button
              type="button"
              onClick={() => handleSelectCount(4)}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-extrabold text-xs border border-sky-200 transition-colors cursor-pointer"
            >
              4 bài (1 trang A4)
            </button>
            <button
              type="button"
              onClick={() => handleSelectCount(8)}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-extrabold text-xs border border-sky-200 transition-colors cursor-pointer"
            >
              8 bài (2 trang A4)
            </button>
            <button
              type="button"
              onClick={() => handleSelectCount(12)}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-extrabold text-xs border border-sky-200 transition-colors cursor-pointer"
            >
              12 bài (3 trang)
            </button>
            <button
              type="button"
              onClick={() => handleSelectCount(16)}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-extrabold text-xs border border-sky-200 transition-colors cursor-pointer"
            >
              16 bài (4 trang)
            </button>

            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Chọn tất cả
            </button>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Bỏ chọn
              </button>
            )}
          </div>

          {/* Right: Selected Count and Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 font-black text-sm sm:text-base">
              Đã chọn: <span className="text-amber-700">{selectedIds.size}</span> bài
              {selectedIds.size > 0 && (
                <span className="text-xs text-amber-800 font-bold ml-1.5">
                  ({Math.ceil(selectedIds.size / 4)} trang A4)
                </span>
              )}
            </div>

            {/* Print 4-grid A4 button */}
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleBatchPrint}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm sm:text-base shadow-md transition-all active:scale-95 ${
                selectedIds.size > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              <Printer className="w-5 h-5" />
              <span>🖨️ GHÉP 4 BÀI A4</span>
            </button>

            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleBatchDelete}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm border border-rose-200 transition-colors cursor-pointer shadow-xs"
                title="Xóa các bài đã chọn"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa {selectedIds.size} bài đã chọn</span>
              </button>
            )}
          </div>
        </div>

        {/* Drawings Grid Display */}
        {filteredDrawings.length === 0 ? (
          <div className="flex-1 bg-white rounded-3xl p-12 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-4xl mb-3">
              🎨
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-1">
              Chưa có bài vẽ nào phù hợp
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mb-6">
              Học sinh chưa nộp bài hoặc bộ lọc hiện tại không tìm thấy kết quả.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-sky-100 text-sky-800 font-bold text-sm hover:bg-sky-200 cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredDrawings.map((drawing) => {
              const isSelected = selectedIds.has(drawing.id);
              const hasName = Boolean(drawing.studentName && drawing.studentName.trim());

              return (
                <div
                  key={drawing.id}
                  className={`bg-white rounded-2xl border-2 transition-all shadow-sm hover:shadow-md flex flex-col overflow-hidden ${
                    isSelected
                      ? 'border-sky-500 ring-4 ring-sky-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header: Checkbox for selection */}
                  <div
                    onClick={() => toggleSelectOne(drawing.id)}
                    className="p-3 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <span className="text-xs font-extrabold text-slate-700">
                        {isSelected ? 'Đã chọn' : 'Chọn bài'}
                      </span>
                    </label>

                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                      {drawing.id}
                    </span>
                  </div>

                  {/* Thumbnail Image */}
                  <div
                    onClick={() => {
                      playClickSound();
                      setViewingDrawing(drawing);
                    }}
                    className="relative w-full aspect-4/3 bg-slate-50 p-2 flex items-center justify-center cursor-pointer group overflow-hidden"
                  >
                    <img
                      src={drawing.imageData}
                      alt={`Bài vẽ ${drawing.id}`}
                      className="max-w-full max-h-full object-contain rounded transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white/95 text-slate-800 text-xs font-black px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem chi tiết</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Footer info matching specs: ID, Time, [XEM] */}
                  <div className="p-3 bg-white flex flex-col gap-2 flex-1 justify-between border-t border-slate-100">
                    <div>
                      {/* Student info if entered by teacher */}
                      {hasName ? (
                        <div className="text-sm font-extrabold text-slate-900 truncate">
                          <span>{drawing.studentName}</span>
                          {drawing.className && (
                            <span className="text-xs text-sky-700 font-bold ml-1">
                              ({drawing.className})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-slate-400 italic">
                          Chưa có tên học sinh
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {formatCardDate(drawing.createdAt)}
                      </div>
                    </div>

                    {/* Action buttons: [XEM], [XÓA] */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setViewingDrawing(drawing);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-extrabold text-xs border border-sky-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>XEM</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setDeleteModalState({
                            isOpen: true,
                            drawingToDelete: drawing,
                          });
                        }}
                        className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Xóa bài vẽ này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>XÓA</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail Modal for Teacher to view and enter name/class */}
      {viewingDrawing && (
        <TeacherDetailModal
          isOpen={Boolean(viewingDrawing)}
          drawing={viewingDrawing}
          onClose={() => setViewingDrawing(null)}
          onSaveInfo={(id, updates) => {
            onUpdateDrawing(id, updates);
            // Refresh local state of viewingDrawing
            setViewingDrawing((prev) => (prev ? { ...prev, ...updates } : null));
          }}
          onDelete={(id) => {
            onDeleteDrawing(id);
            setViewingDrawing(null);
          }}
        />
      )}
      {/* Password Management Modal */}
      <TeacherPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => setIsPasswordModalOpen(false)}
      />

      {/* Teacher Deletion Confirmation Modal */}
      <TeacherDeleteModal
        isOpen={deleteModalState.isOpen}
        drawingToDelete={deleteModalState.drawingToDelete}
        batchCount={deleteModalState.batchCount}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false })}
      />
    </div>
  );
};
