import { createStore } from 'zustand/vanilla';

export const markerTypes = {
  ERYTHEMA_MARGIN: 'Erythema Margin', ACTIVE_INDURATION: 'Active Induration',
  FOLLICULAR_PAPULE: 'Follicular Papule', PIGMENTATION_BORDER: 'Pigmentation Border', SCAR_ATROPHY: 'Scar / Atrophy',
} as const;
export type MarkerType = keyof typeof markerTypes;
export type LesionMarker = { id: string; imageId: string; type: MarkerType; x: number; y: number; note?: string; label?: string; createdAt: string; updatedAt: string };
export type LesionImage = {
  id: string; assetId?: string; src: string; file?: File; name: string; type: string; size: number;
  width: number; height: number; uploadedAt: string; source: 'UPLOAD' | 'WEBCAM';
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'error'; uploadProgress: number; error?: string;
};
export type PhotographyDocument = {
  consultationId: string; images: Omit<LesionImage, 'file'>[]; markers: LesionMarker[];
  selectedImageId: string | null; beforeImageId: string | null; afterImageId: string | null;
  comparisonPosition: number; efficacyPercentage: number | null; efficacySource: 'MANUAL' | null;
};
type UI = {
  selectedMarkerId: string | null; selectedMarkerType: MarkerType; annotationMode: boolean;
  dragTarget: 'upload' | 'before' | 'after' | null; zoom: number; previewImageId: string | null;
  clearConfirmation: boolean; webcamStatus: 'closed' | 'initializing' | 'ready';
  loadStatus: 'loading' | 'ready' | 'error'; saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  errors: string[]; revision: number; savedRevision: number; savingRevision: number | null;
};
export type PhotographyState = Omit<PhotographyDocument, 'images'> & UI & {
  images: LesionImage[];
  addImages: (images: LesionImage[]) => void; removeImage: (id: string) => void;
  updateImage: (id: string, patch: Partial<LesionImage>) => void;
  selectImage: (id: string) => void; setBeforeImage: (id: string) => void; setAfterImage: (id: string) => void;
  swapBeforeAfter: () => void; useAnnotated: (target: 'before' | 'after') => void;
  addMarker: (x: number, y: number) => void;
  updateMarker: (id: string, patch: Partial<Pick<LesionMarker, 'type' | 'note' | 'label' | 'x' | 'y'>>) => void;
  moveMarker: (id: string, x: number, y: number) => void; deleteMarker: (id: string) => void;
  clearAllMarkers: () => void; selectMarker: (id: string | null) => void;
  setSelectedMarkerType: (type: MarkerType) => void; setComparisonPosition: (position: number) => void;
  setEfficacy: (value: number | null) => void; setUI: (patch: Partial<Omit<UI, 'revision' | 'savedRevision'>>) => void;
  reportError: (message: string) => void; hydrate: (document: PhotographyDocument) => void;
  resetStore: () => void;
};
const clamp = (n: number, max = 1) => Math.max(0, Math.min(max, Number.isFinite(n) ? n : 0));
const revoke = (src: string) => { if (src.startsWith('blob:')) URL.revokeObjectURL(src); };
const initial = (consultationId: string): PhotographyDocument & UI => ({
  consultationId, images: [], markers: [], selectedImageId: null, beforeImageId: null, afterImageId: null,
  comparisonPosition: 50, efficacyPercentage: null, efficacySource: null, selectedMarkerId: null,
  selectedMarkerType: 'ERYTHEMA_MARGIN', annotationMode: false, dragTarget: null, zoom: 1,
  previewImageId: null, clearConfirmation: false, webcamStatus: 'closed', loadStatus: 'loading',
  saveStatus: 'idle', errors: [], revision: 0, savedRevision: 0, savingRevision: null,
});

// One instance per mounted consultation provider; no singleton or localStorage persistence.
export function createLesionPhotographyStore(consultationId: string) {
  return createStore<PhotographyState>()((set, get) => {
    const change = (patch: Partial<PhotographyState>) => set(s => ({ ...patch, revision: s.revision + 1, saveStatus: 'idle' }));
    const assign = (id: string, target: 'before' | 'after') => {
      if (!get().images.some(i => i.id === id)) return;
      change({ [target === 'before' ? 'beforeImageId' : 'afterImageId']: id, efficacyPercentage: null, efficacySource: null });
    };
    return {
      ...initial(consultationId),
      addImages: images => change({ images: [...get().images, ...images], selectedImageId: get().selectedImageId ?? images[0]?.id ?? null }),
      updateImage: (id, patch) => set(s => ({ images: s.images.map(i => i.id === id ? { ...i, ...patch, id } : i) })),
      removeImage: id => {
        const s = get(); const image = s.images.find(i => i.id === id); if (!image) return;
        revoke(image.src);
        change({ images: s.images.filter(i => i.id !== id), markers: s.markers.filter(m => m.imageId !== id),
          selectedImageId: s.selectedImageId === id ? s.images.find(i => i.id !== id)?.id ?? null : s.selectedImageId,
          beforeImageId: s.beforeImageId === id ? null : s.beforeImageId, afterImageId: s.afterImageId === id ? null : s.afterImageId,
          selectedMarkerId: null, previewImageId: null, efficacyPercentage: null, efficacySource: null });
      },
      selectImage: id => { if (get().images.some(i => i.id === id)) change({ selectedImageId: id, selectedMarkerId: null, zoom: 1 }); },
      setBeforeImage: id => assign(id, 'before'), setAfterImage: id => assign(id, 'after'),
      swapBeforeAfter: () => { const s = get(); change({ beforeImageId: s.afterImageId, afterImageId: s.beforeImageId, efficacyPercentage: null, efficacySource: null }); },
      useAnnotated: target => {
        const s = get(); if (!s.selectedImageId || !s.markers.some(m => m.imageId === s.selectedImageId)) {
          s.reportError('Select an image with at least one annotation first.'); return;
        }
        assign(s.selectedImageId, target);
      },
      addMarker: (x, y) => {
        const s = get(); if (!s.selectedImageId || !s.annotationMode) return;
        const id = crypto.randomUUID(); const now = new Date().toISOString();
        change({ markers: [...s.markers, { id, imageId: s.selectedImageId, type: s.selectedMarkerType, x: clamp(x), y: clamp(y), createdAt: now, updatedAt: now }], selectedMarkerId: id });
      },
      updateMarker: (id, patch) => change({ markers: get().markers.map(m => m.id === id ? { ...m, ...patch,
        x: clamp(patch.x ?? m.x), y: clamp(patch.y ?? m.y), updatedAt: new Date().toISOString() } : m) }),
      moveMarker: (id, x, y) => get().updateMarker(id, { x, y }),
      deleteMarker: id => change({ markers: get().markers.filter(m => m.id !== id), selectedMarkerId: null }),
      clearAllMarkers: () => change({ markers: [], selectedMarkerId: null, clearConfirmation: false }),
      selectMarker: selectedMarkerId => set({ selectedMarkerId }),
      setSelectedMarkerType: selectedMarkerType => set({ selectedMarkerType }),
      setComparisonPosition: position => change({ comparisonPosition: clamp(position, 100) }),
      setEfficacy: value => change({ efficacyPercentage: value === null ? null : clamp(value, 100), efficacySource: value === null ? null : 'MANUAL' }),
      setUI: patch => set(patch), reportError: message => set(s => ({ errors: [...s.errors.slice(-9), message] })),
      hydrate: document => {
        if (document.consultationId !== consultationId) throw new Error('Photography consultation does not match this route.');
        set({ ...document, loadStatus: 'ready', saveStatus: 'saved', revision: 0, savedRevision: 0 });
      },
      resetStore: () => { get().images.forEach(i => revoke(i.src)); set(initial(consultationId)); },
    };
  });
}
export type PhotographyStore = ReturnType<typeof createLesionPhotographyStore>;
export const selectors = {
  markerCount: (s: PhotographyState) => s.markers.length,
  selectedImage: (s: PhotographyState) => s.images.find(i => i.id === s.selectedImageId),
  beforeImage: (s: PhotographyState) => s.images.find(i => i.id === s.beforeImageId),
  afterImage: (s: PhotographyState) => s.images.find(i => i.id === s.afterImageId),
  annotatedImages: (s: PhotographyState) => s.images.filter(i => s.markers.some(m => m.imageId === i.id)),
  selectedImageMarkers: (s: PhotographyState) => s.markers.filter(m => m.imageId === s.selectedImageId),
  efficacyPercentage: (s: PhotographyState) => s.efficacyPercentage,
  hasBefore: (s: PhotographyState) => s.images.some(i => i.id === s.beforeImageId),
  hasAfter: (s: PhotographyState) => s.images.some(i => i.id === s.afterImageId),
  canCompare: (s: PhotographyState) => s.images.some(i => i.id === s.beforeImageId) && s.images.some(i => i.id === s.afterImageId),
  uploadingImages: (s: PhotographyState) => s.images.filter(i => i.uploadStatus === 'uploading' || i.uploadStatus === 'pending'),
  saveStatus: (s: PhotographyState) => s.saveStatus,
};
