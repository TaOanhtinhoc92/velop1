import { Drawing } from '../types';

const DB_NAME = 'DrawingClassroomDB';
const DB_VERSION = 1;
const DRAWINGS_STORE = 'drawings';
const DRAFT_STORE = 'drafts';
const DRAFT_KEY = 'current_active_draft';

// Fallback memory/localStorage keys
const LS_DRAWINGS_KEY = 'goc_ve_drawings_fallback';
const LS_DRAFT_KEY = 'goc_ve_draft_fallback';

let dbInstance: IDBDatabase | null = null;

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error('IndexedDB not available'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DRAWINGS_STORE)) {
        db.createObjectStore(DRAWINGS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.warn('IndexedDB open error, using localStorage fallback', event);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Fallback helper for localStorage
function getLSFallbackDrawings(): Drawing[] {
  try {
    const raw = localStorage.getItem(LS_DRAWINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLSFallbackDrawings(drawings: Drawing[]) {
  try {
    localStorage.setItem(LS_DRAWINGS_KEY, JSON.stringify(drawings));
  } catch (err) {
    console.error('LocalStorage save error', err);
  }
}

export async function getAllDrawings(): Promise<Drawing[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DRAWINGS_STORE, 'readonly');
      const store = tx.objectStore(DRAWINGS_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = (req.result || []) as Drawing[];
        // Sort newest first
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    const items = getLSFallbackDrawings();
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  }
}

export async function getNextDrawingId(): Promise<string> {
  const drawings = await getAllDrawings();
  let maxId = 0;
  for (const d of drawings) {
    const match = d.id.match(/^DRAW-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxId) maxId = num;
    }
  }
  const nextNum = maxId + 1;
  return `DRAW-${String(nextNum).padStart(4, '0')}`;
}

export async function saveDrawing(drawingData: {
  imageData: string;
  status: 'saved' | 'submitted';
  id?: string;
  studentName?: string;
  className?: string;
}): Promise<Drawing> {
  const allDrawings = await getAllDrawings();
  const id = drawingData.id || (await getNextDrawingId());
  const now = new Date().toISOString();

  const existing = allDrawings.find((d) => d.id === id);
  const newDrawing: Drawing = {
    id,
    imageData: drawingData.imageData,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
    status: drawingData.status,
    studentName: drawingData.studentName ?? existing?.studentName ?? '',
    className: drawingData.className ?? existing?.className ?? '',
  };

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DRAWINGS_STORE, 'readwrite');
      const store = tx.objectStore(DRAWINGS_STORE);
      const req = store.put(newDrawing);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const filtered = allDrawings.filter((d) => d.id !== id);
    filtered.unshift(newDrawing);
    saveLSFallbackDrawings(filtered);
  }

  return newDrawing;
}

export async function updateDrawingMetadata(
  id: string,
  updates: { studentName?: string; className?: string; notes?: string }
): Promise<void> {
  const drawings = await getAllDrawings();
  const target = drawings.find((d) => d.id === id);
  if (!target) return;

  const updated: Drawing = {
    ...target,
    studentName: updates.studentName !== undefined ? updates.studentName : target.studentName,
    className: updates.className !== undefined ? updates.className : target.className,
    notes: updates.notes !== undefined ? updates.notes : target.notes,
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DRAWINGS_STORE, 'readwrite');
      const store = tx.objectStore(DRAWINGS_STORE);
      const req = store.put(updated);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const filtered = drawings.filter((d) => d.id !== id);
    filtered.unshift(updated);
    saveLSFallbackDrawings(filtered);
  }
}

export async function deleteDrawing(id: string): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DRAWINGS_STORE, 'readwrite');
      const store = tx.objectStore(DRAWINGS_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('IndexedDB delete error', err);
  }
  // Always clean from localStorage fallback to ensure synchronization
  try {
    const drawings = getLSFallbackDrawings().filter((d) => d.id !== id);
    saveLSFallbackDrawings(drawings);
  } catch {
    // ignore
  }
}

// Auto-save draft features
export interface DraftData {
  id: string;
  imageData: string;
  updatedAt: number;
}

export async function saveDraft(imageData: string): Promise<void> {
  const draft: DraftData = {
    id: DRAFT_KEY,
    imageData,
    updatedAt: Date.now(),
  };

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DRAFT_STORE, 'readwrite');
      const store = tx.objectStore(DRAFT_STORE);
      const req = store.put(draft);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }
}

export async function getDraft(): Promise<DraftData | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(DRAFT_STORE, 'readonly');
      const store = tx.objectStore(DRAFT_STORE);
      const req = store.get(DRAFT_KEY);
      req.onsuccess = () => {
        resolve((req.result as DraftData) || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    try {
      const raw = localStorage.getItem(LS_DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export async function clearDraft(): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(DRAFT_STORE, 'readwrite');
      const store = tx.objectStore(DRAFT_STORE);
      const req = store.delete(DRAFT_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    try {
      localStorage.removeItem(LS_DRAFT_KEY);
    } catch {
      // ignore
    }
  }
}

// Check if database needs initial sample data so teacher can immediately test printing 4 drawings
export async function seedInitialSampleDrawingsIfEmpty(): Promise<void> {
  const existing = await getAllDrawings();
  if (existing.length > 0) return;

  // Create 4 initial cheerful child-like drawing samples
  const createSampleCanvas = (color1: string, color2: string, text: string, type: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 600);

    // Decorative drawing
    if (type === 'sun') {
      // Sun
      ctx.fillStyle = '#EAB308';
      ctx.beginPath();
      ctx.arc(400, 240, 100, 0, Math.PI * 2);
      ctx.fill();

      // Rays
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x1 = 400 + Math.cos(angle) * 120;
        const y1 = 240 + Math.sin(angle) * 120;
        const x2 = 400 + Math.cos(angle) * 170;
        const y2 = 240 + Math.sin(angle) * 170;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Smile
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(400, 245, 50, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.arc(365, 210, 10, 0, Math.PI * 2);
      ctx.arc(435, 210, 10, 0, Math.PI * 2);
      ctx.fill();

      // Green grass
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(0, 500, 800, 100);
    } else if (type === 'house') {
      // Sky
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(0, 0, 800, 480);
      // Ground
      ctx.fillStyle = '#86EFAC';
      ctx.fillRect(0, 480, 800, 120);

      // House body
      ctx.fillStyle = '#FDBA74';
      ctx.fillRect(250, 260, 300, 220);

      // Roof
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(220, 260);
      ctx.lineTo(400, 120);
      ctx.lineTo(580, 260);
      ctx.closePath();
      ctx.fill();

      // Door
      ctx.fillStyle = '#92400E';
      ctx.fillRect(360, 360, 80, 120);

      // Window
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(280, 310, 60, 60);
      ctx.fillRect(460, 310, 60, 60);
    } else if (type === 'flower') {
      // Sky
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(0, 0, 800, 480);
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(0, 480, 800, 120);

      // Stem
      ctx.strokeStyle = '#15803D';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(400, 500);
      ctx.quadraticCurveTo(420, 380, 400, 280);
      ctx.stroke();

      // Leaves
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.ellipse(340, 420, 50, 25, -0.4, 0, Math.PI * 2);
      ctx.ellipse(460, 390, 50, 25, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Petals
      ctx.fillStyle = '#EC4899';
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const px = 400 + Math.cos(angle) * 70;
        const py = 250 + Math.sin(angle) * 70;
        ctx.beginPath();
        ctx.arc(px, py, 45, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flower center
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(400, 250, 45, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Rainbow
      ctx.fillStyle = '#F0FDF4';
      ctx.fillRect(0, 0, 800, 600);

      const colors = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#A855F7'];
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      for (let i = 0; i < colors.length; i++) {
        ctx.strokeStyle = colors[i];
        ctx.beginPath();
        ctx.arc(400, 540, 340 - i * 26, Math.PI, 0, false);
        ctx.stroke();
      }

      // Fluffy clouds
      ctx.fillStyle = '#93C5FD';
      ctx.beginPath();
      ctx.arc(140, 510, 60, 0, Math.PI * 2);
      ctx.arc(200, 480, 70, 0, Math.PI * 2);
      ctx.arc(260, 510, 55, 0, Math.PI * 2);
      ctx.arc(540, 510, 55, 0, Math.PI * 2);
      ctx.arc(600, 480, 70, 0, Math.PI * 2);
      ctx.arc(660, 510, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas.toDataURL('image/png');
  };

  const samples = [
    {
      id: 'DRAW-0001',
      type: 'sun',
      time: '08:15',
      name: 'Nguyễn Văn An',
      className: '1A1',
    },
    {
      id: 'DRAW-0002',
      type: 'house',
      time: '08:22',
      name: 'Trần Thị Mai',
      className: '1A1',
    },
    {
      id: 'DRAW-0003',
      type: 'flower',
      time: '08:35',
      name: '',
      className: '',
    },
    {
      id: 'DRAW-0004',
      type: 'rainbow',
      time: '08:40',
      name: 'Lê Hoàng Nam',
      className: '1A1',
    },
  ];

  for (const s of samples) {
    const img = createSampleCanvas('#FFF', '#000', s.id, s.type);
    if (img) {
      await saveDrawing({
        id: s.id,
        imageData: img,
        status: 'submitted',
        studentName: s.name,
        className: s.className,
      });
    }
  }
}
