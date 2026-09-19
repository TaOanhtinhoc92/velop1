import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppScreen, Drawing, DrawingTool } from './types';
import {
  getAllDrawings,
  saveDrawing,
  updateDrawingMetadata,
  deleteDrawing,
  getDraft,
  saveDraft,
  clearDraft,
  seedInitialSampleDrawingsIfEmpty,
} from './services/db';
import { HomeScreen } from './components/HomeScreen';
import { DrawingToolbar } from './components/DrawingToolbar';
import { DrawingCanvas } from './components/DrawingCanvas';
import { SubmissionSuccessModal } from './components/SubmissionSuccessModal';
import { ClearConfirmModal } from './components/ClearConfirmModal';
import { TeacherPortal } from './components/TeacherPortal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { TeacherPasswordModal } from './components/TeacherPasswordModal';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [draftImage, setDraftImage] = useState<string | undefined>(undefined);

  // Drawing state
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#EF4444');
  const [currentStrokeSize, setCurrentStrokeSize] = useState<number>(12);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [undoTrigger, setUndoTrigger] = useState(0);
  const [redoTrigger, setRedoTrigger] = useState(0);
  const [clearTrigger, setClearTrigger] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Teacher Password Protection Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Submission celebration state
  const [submissionData, setSubmissionData] = useState<{
    isOpen: boolean;
    drawingId: string;
    imageData: string;
  }>({
    isOpen: false,
    drawingId: '',
    imageData: '',
  });

  // Print preview state
  const [selectedForPrint, setSelectedForPrint] = useState<Drawing[]>([]);

  // Canvas ref for reading dataUrl directly
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load initial data and check for drafts
  const refreshDrawings = useCallback(async () => {
    try {
      const all = await getAllDrawings();
      setDrawings(all);
    } catch (err) {
      console.error('Failed to load drawings', err);
    }
  }, []);

  const checkDraft = useCallback(async () => {
    try {
      const draft = await getDraft();
      if (draft && draft.imageData) {
        setHasDraft(true);
        setDraftImage(draft.imageData);
      } else {
        setHasDraft(false);
        setDraftImage(undefined);
      }
    } catch {
      setHasDraft(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await seedInitialSampleDrawingsIfEmpty();
      await refreshDrawings();
      await checkDraft();
    }
    init();
  }, [refreshDrawings, checkDraft]);

  // Draft auto-save handler from canvas
  const handleDraftAutoSave = useCallback((dataUrl: string) => {
    saveDraft(dataUrl);
    setHasDraft(true);
  }, []);

  // Clear draft
  const handleClearDraft = async () => {
    await clearDraft();
    setHasDraft(false);
    setDraftImage(undefined);
  };

  // Start Drawing button from Home
  const handleStartDrawing = (resumeDraft: boolean = false) => {
    if (!resumeDraft) {
      setDraftImage(undefined);
    }
    setScreen('draw');
  };

  // Save current drawing (Manual Save)
  const handleSaveDrawing = async () => {
    if (!canvasRef.current || isSaving) return;
    setIsSaving(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const saved = await saveDrawing({
        imageData: dataUrl,
        status: 'saved',
      });
      await refreshDrawings();
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    } catch (err) {
      console.error('Save drawing failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Submit current drawing
  const handleSubmitDrawing = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const saved = await saveDrawing({
        imageData: dataUrl,
        status: 'submitted',
      });
      await refreshDrawings();
      await clearDraft();
      setHasDraft(false);
      setDraftImage(undefined);

      setSubmissionData({
        isOpen: true,
        drawingId: saved.id,
        imageData: dataUrl,
      });
    } catch (err) {
      console.error('Submit drawing failed', err);
    }
  };

  // When child starts a new drawing from celebration modal
  const handleNewDrawingAfterSubmission = () => {
    setSubmissionData({ isOpen: false, drawingId: '', imageData: '' });
    setClearTrigger((prev) => prev + 1);
    setScreen('draw');
  };

  // Teacher portal handlers
  const handleUpdateDrawing = async (
    id: string,
    updates: { studentName: string; className: string; notes?: string }
  ) => {
    await updateDrawingMetadata(id, updates);
    await refreshDrawings();
  };

  const handleDeleteDrawing = async (id: string) => {
    await deleteDrawing(id);
    await refreshDrawings();
  };

  const handleBatchDelete = async (ids: string[]) => {
    for (const id of ids) {
      await deleteDrawing(id);
    }
    await refreshDrawings();
  };

  const handleOpenPrintPreview = (selected: Drawing[]) => {
    setSelectedForPrint(selected);
    setScreen('print-preview');
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-100 flex flex-col font-['Nunito',sans-serif]">
      {/* 1. HOME SCREEN */}
      {screen === 'home' && (
        <HomeScreen
          onStartDrawing={handleStartDrawing}
          onOpenTeacherPortal={() => setIsPasswordModalOpen(true)}
          hasDraft={hasDraft}
          onClearDraft={handleClearDraft}
        />
      )}

      {/* 2. DRAWING SCREEN */}
      {screen === 'draw' && (
        <div className="w-full h-full flex flex-col overflow-hidden">
          <DrawingToolbar
            currentTool={currentTool}
            onSelectTool={setCurrentTool}
            currentColor={currentColor}
            onSelectColor={setCurrentColor}
            currentStrokeSize={currentStrokeSize}
            onSelectStrokeSize={setCurrentStrokeSize}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={() => setUndoTrigger((prev) => prev + 1)}
            onRedo={() => setRedoTrigger((prev) => prev + 1)}
            onClear={() => setIsClearModalOpen(true)}
            onSave={handleSaveDrawing}
            onSubmit={handleSubmitDrawing}
            onGoHome={() => setScreen('home')}
            isSaving={isSaving}
            saveFeedback={saveFeedback}
          />

          <DrawingCanvas
            currentTool={currentTool}
            currentColor={currentColor}
            currentStrokeSize={currentStrokeSize}
            onCanUndoChange={setCanUndo}
            onCanRedoChange={setCanRedo}
            onDraftAutoSave={handleDraftAutoSave}
            initialImageData={draftImage}
            canvasRefOut={canvasRef}
            undoTrigger={undoTrigger}
            redoTrigger={redoTrigger}
            clearTrigger={clearTrigger}
          />
        </div>
      )}

      {/* 3. TEACHER PORTAL */}
      {screen === 'teacher' && (
        <div className="w-full h-full overflow-y-auto">
          <TeacherPortal
            drawings={drawings}
            onBackToApp={() => setScreen('home')}
            onOpenDrawingRoom={() => setScreen('draw')}
            onUpdateDrawing={handleUpdateDrawing}
            onDeleteDrawing={handleDeleteDrawing}
            onBatchDeleteDrawings={handleBatchDelete}
            onOpenPrintPreview={handleOpenPrintPreview}
          />
        </div>
      )}

      {/* 4. PRINT PREVIEW SCREEN */}
      {screen === 'print-preview' && (
        <div className="w-full h-full overflow-y-auto">
          <PrintPreviewModal
            selectedDrawings={selectedForPrint}
            onBack={() => setScreen('teacher')}
          />
        </div>
      )}

      {/* MODALS */}
      {/* Teacher Password Modal */}
      <TeacherPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => {
          setIsPasswordModalOpen(false);
          setScreen('teacher');
        }}
      />

      {/* Clear Drawing Confirmation */}
      <ClearConfirmModal
        isOpen={isClearModalOpen}
        onConfirm={() => {
          setIsClearModalOpen(false);
          setClearTrigger((prev) => prev + 1);
        }}
        onCancel={() => setIsClearModalOpen(false)}
      />

      {/* Submission Celebration Modal */}
      <SubmissionSuccessModal
        isOpen={submissionData.isOpen}
        drawingId={submissionData.drawingId}
        imageData={submissionData.imageData}
        onNewDrawing={handleNewDrawingAfterSubmission}
        onGoHome={() => {
          setSubmissionData({ isOpen: false, drawingId: '', imageData: '' });
          setScreen('home');
        }}
      />
    </div>
  );
}
