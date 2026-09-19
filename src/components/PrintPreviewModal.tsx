import React, { useState } from 'react';
import { ArrowLeft, Printer, FileText, Download, LayoutGrid, CheckCircle } from 'lucide-react';
import { Drawing, PageOrientation } from '../types';
import { playClickSound } from '../utils/audio';

interface PrintPreviewModalProps {
  selectedDrawings: Drawing[];
  onBack: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  selectedDrawings,
  onBack,
}) => {
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [showPrintTip, setShowPrintTip] = useState(false);

  // Group drawings into chunks of 4 (4 drawings per A4 page)
  const pages: Drawing[][] = [];
  for (let i = 0; i < selectedDrawings.length; i += 4) {
    pages.push(selectedDrawings.slice(i, i + 4));
  }

  const handlePrint = () => {
    playClickSound();
    window.print();
  };

  const handleDownloadPDFGuide = () => {
    playClickSound();
    setShowPrintTip(true);
    // Directly trigger print which has "Save as PDF"
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Export composite A4 canvas as PNG
  const handleExportA4Image = (pageIndex: number) => {
    playClickSound();
    const pageDrawings = pages[pageIndex];
    if (!pageDrawings) return;

    const canvas = document.createElement('canvas');
    // Standard A4 at 300 DPI: 2480 x 3508 (Portrait) or 3508 x 2480 (Landscape)
    const isPortrait = orientation === 'portrait';
    canvas.width = isPortrait ? 2480 : 3508;
    canvas.height = isPortrait ? 3508 : 2480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Margins and cell dimensions
    const margin = 100;
    const gap = 80;
    const gridW = (canvas.width - margin * 2 - gap) / 2;
    const gridH = (canvas.height - margin * 2 - gap) / 2;

    const loadPromises = pageDrawings.map((drawing, idx) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const cellX = margin + col * (gridW + gap);
          const cellY = margin + row * (gridH + gap);

          // Card outline
          ctx.strokeStyle = '#CBD5E1';
          ctx.lineWidth = 4;
          ctx.strokeRect(cellX, cellY, gridW, gridH);

          // Footer label height
          const footerH = 120;
          const imgAreaW = gridW - 40;
          const imgAreaH = gridH - footerH - 40;

          // Compute aspect ratio fit
          const imgRatio = img.width / img.height;
          const areaRatio = imgAreaW / imgAreaH;
          let drawW = imgAreaW;
          let drawH = imgAreaH;
          let drawX = cellX + 20;
          let drawY = cellY + 20;

          if (imgRatio > areaRatio) {
            drawW = imgAreaW;
            drawH = imgAreaW / imgRatio;
            drawY = cellY + 20 + (imgAreaH - drawH) / 2;
          } else {
            drawH = imgAreaH;
            drawW = imgAreaH * imgRatio;
            drawX = cellX + 20 + (imgAreaW - drawW) / 2;
          }

          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          // Label
          ctx.fillStyle = '#1E293B';
          ctx.font = 'bold 36px Nunito, sans-serif';
          ctx.textAlign = 'center';
          const labelY = cellY + gridH - 50;

          if (drawing.studentName && drawing.studentName.trim()) {
            const classText = drawing.className ? ` - Lớp: ${drawing.className}` : '';
            ctx.fillText(`Học sinh: ${drawing.studentName}${classText}`, cellX + gridW / 2, labelY);
          } else {
            ctx.fillStyle = '#64748B';
            ctx.font = 'bold 30px Nunito, sans-serif';
            ctx.fillText(`Mã bài: ${drawing.id}`, cellX + gridW / 2, labelY);
          }

          resolve();
        };
        img.src = drawing.imageData;
      });
    });

    Promise.all(loadPromises).then(() => {
      const link = document.createElement('a');
      link.download = `Trang_A4_${pageIndex + 1}_GhepHinh.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${String(
        d.getDate()
      ).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Controls Bar (Hidden during printing) */}
      <div className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Back button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onBack();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm sm:text-base border border-slate-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>↩️ Quay lại</span>
            </button>

            <div className="hidden sm:block">
              <h2 className="text-lg font-black text-slate-800">
                XEM TRƯỚC TRANG A4
              </h2>
              <p className="text-xs text-slate-500">
                Tổng cộng: <span className="font-bold text-sky-600">{selectedDrawings.length} bài</span> ({pages.length} trang A4)
              </p>
            </div>
          </div>

          {/* Orientation Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 px-2 hidden md:inline">Khổ giấy:</span>
            <button
              type="button"
              onClick={() => setOrientation('portrait')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                orientation === 'portrait'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📄 A4 Dọc
            </button>
            <button
              type="button"
              onClick={() => setOrientation('landscape')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                orientation === 'landscape'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📑 A4 Ngang
            </button>
          </div>

          {/* Action Buttons: In A4, Tải PDF */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-md border-2 border-emerald-700 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-5 h-5" />
              <span>🖨️ In A4</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDFGuide}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm sm:text-base shadow-md border-2 border-sky-700 transition-all active:scale-95 cursor-pointer"
              title="Xuất hoặc lưu thành file PDF"
            >
              <FileText className="w-5 h-5" />
              <span>📄 Tải PDF</span>
            </button>
          </div>
        </div>

        {/* Helpful print tip banner if clicked PDF */}
        {showPrintTip && (
          <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 text-center text-xs sm:text-sm text-amber-900 font-bold flex items-center justify-center gap-2">
            <span>💡 Mẹo: Trong cửa sổ in hiện ra, tại mục <b>Máy in đích (Destination)</b>, chọn <b>"Lưu dưới dạng PDF" (Save as PDF)</b> để lưu file PDF vào máy tính!</span>
            <button
              type="button"
              onClick={() => setShowPrintTip(false)}
              className="text-amber-700 underline font-extrabold ml-2"
            >
              Đã hiểu
            </button>
          </div>
        )}
      </div>

      {/* Main Printable Sheets Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 flex flex-col items-center gap-8 print-area-container">
        {pages.map((pageDrawings, pageIdx) => (
          <div key={pageIdx} className="w-full flex flex-col items-center">
            {/* Sheet Page Label (Screen only) */}
            <div className="no-print w-full max-w-[210mm] flex items-center justify-between mb-2 px-1 text-slate-500 text-xs sm:text-sm font-extrabold">
              <span>Trang {pageIdx + 1} / {pages.length} (Bố cục 2 × 2)</span>
              <button
                type="button"
                onClick={() => handleExportA4Image(pageIdx)}
                className="flex items-center gap-1 text-sky-600 hover:text-sky-800 underline cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải ảnh trang {pageIdx + 1}</span>
              </button>
            </div>

            {/* A4 Sheet Container */}
            <div
              className={`print-sheet bg-white shadow-xl rounded-md border border-slate-300 p-6 flex flex-col justify-between box-border ${
                orientation === 'portrait'
                  ? 'w-full max-w-[210mm] aspect-[210/297]'
                  : 'w-full max-w-[297mm] aspect-[297/210]'
              }`}
            >
              {/* 2x2 Grid */}
              <div className="print-grid-2x2 grid grid-cols-2 grid-rows-2 gap-4 w-full h-full">
                {pageDrawings.map((drawing) => {
                  const hasStudentInfo = Boolean(drawing.studentName && drawing.studentName.trim());
                  return (
                    <div
                      key={drawing.id}
                      className="print-card-cell border-2 border-slate-300 rounded-lg p-2.5 flex flex-col items-center justify-between overflow-hidden bg-white"
                    >
                      {/* Drawing Image: ratio preserved, no distortion */}
                      <div className="print-image-container flex-1 w-full min-h-0 flex items-center justify-center p-1">
                        <img
                          src={drawing.imageData}
                          alt={`Bài vẽ ${drawing.id}`}
                          className="print-drawing-image max-w-full max-h-full object-contain"
                        />
                      </div>

                      {/* Card Info Footer */}
                      <div className="w-full pt-1.5 mt-1 border-t border-slate-200 text-center select-none">
                        {hasStudentInfo ? (
                          <div className="text-slate-900 font-extrabold text-sm sm:text-base leading-tight">
                            <span>Học sinh: {drawing.studentName}</span>
                            {drawing.className && (
                              <span className="text-slate-700 ml-1.5 font-bold">
                                - Lớp: {drawing.className}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-600 font-bold text-xs sm:text-sm">
                            <span>Mã bài: {drawing.id}</span>
                            <span className="text-slate-400 text-[11px] ml-2 font-mono">
                              ({formatDate(drawing.createdAt)})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Fill empty cells if page has less than 4 drawings */}
                {Array.from({ length: 4 - pageDrawings.length }).map((_, emptyIdx) => (
                  <div
                    key={`empty-${emptyIdx}`}
                    className="print-card-cell border-2 border-dashed border-slate-200 rounded-lg p-4 flex items-center justify-center text-slate-300 font-bold text-sm bg-slate-50/50"
                  >
                    <span>Ô trống</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};
