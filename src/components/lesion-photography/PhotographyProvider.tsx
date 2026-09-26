'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { createLesionPhotographyStore, markerTypes, type PhotographyDocument, type PhotographyState, type PhotographyStore, type LesionImage } from '@/store/lesion-photography';

const Context = createContext<{ store: PhotographyStore; controller: ReturnType<typeof createController> } | null>(null);
export function usePhotographySession() {
  const context = useContext(Context); if (!context) throw new Error('PhotographyProvider is required'); return context;
}
export function useLesionPhotographyStore<T>(selector: (state: PhotographyState) => T): T {
  return useStore(usePhotographySession().store, selector);
}

export function PhotographyProvider({ consultationId, children }: { consultationId: string; children: ReactNode }) {
  const [session] = useState(() => { const store = createLesionPhotographyStore(consultationId); return { store, controller: createController(store) }; });
  useEffect(() => session.controller.start(), [session]);
  return <Context.Provider value={session}>{children}</Context.Provider>;
}

function validateDocument(value: unknown, consultationId: string): PhotographyDocument {
  const d = value as PhotographyDocument;
  if (!d || d.consultationId !== consultationId || !Array.isArray(d.images) || !Array.isArray(d.markers)) throw new Error('Invalid photography response. Existing data has not been replaced.');
  const ids = new Set<string>();
  for (const i of d.images) {
    if (!i.id || ids.has(i.id) || !i.assetId || !safeAssetUrl(i.src) || !(i.width > 0 && i.height > 0) || typeof i.name !== 'string') throw new Error('Invalid image metadata from photography service.');
    ids.add(i.id);
  }
  const markerIds = new Set<string>();
  for (const m of d.markers) {
    if (!m.id || markerIds.has(m.id) || !ids.has(m.imageId) || !(m.type in markerTypes) || !Number.isFinite(m.x) || !Number.isFinite(m.y) || m.x < 0 || m.x > 1 || m.y < 0 || m.y > 1) throw new Error('Invalid annotation data from photography service.');
    markerIds.add(m.id);
  }
  for (const id of [d.beforeImageId, d.afterImageId, d.selectedImageId]) if (id !== null && !ids.has(id)) throw new Error('Invalid image association.');
  if (!Number.isFinite(d.comparisonPosition) || d.comparisonPosition < 0 || d.comparisonPosition > 100 ||
    (d.efficacyPercentage !== null && (!Number.isFinite(d.efficacyPercentage) || d.efficacyPercentage < 0 || d.efficacyPercentage > 100 || d.efficacySource !== 'MANUAL'))) throw new Error('Invalid comparison data.');
  // Whitelist persisted fields. Never hydrate action methods or UI flags from a response.
  return { consultationId, images: d.images.map(i => ({ id: i.id, assetId: i.assetId, src: i.src, name: i.name, type: i.type,
    size: i.size, width: i.width, height: i.height, uploadedAt: i.uploadedAt, source: i.source, uploadStatus: 'uploaded', uploadProgress: 100 })),
    markers: d.markers.map(m => ({ id: m.id, imageId: m.imageId, type: m.type, x: m.x, y: m.y, note: m.note, label: m.label, createdAt: m.createdAt, updatedAt: m.updatedAt })),
    selectedImageId: d.selectedImageId, beforeImageId: d.beforeImageId, afterImageId: d.afterImageId,
    comparisonPosition: d.comparisonPosition, efficacyPercentage: d.efficacyPercentage, efficacySource: d.efficacyPercentage === null ? null : 'MANUAL' };
}
const safeAssetUrl = (src: unknown): src is string => typeof src === 'string' && ((src.startsWith('/') && !src.startsWith('//')) || src.startsWith('https://'));

function createController(store: PhotographyStore) {
  const endpoint = `/api/consultation/${encodeURIComponent(store.getState().consultationId)}/lesion-photography`;
  let active = false; let generation = 0; let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingSave: Promise<boolean> | null = null;
  const requests = new Set<XMLHttpRequest>();
  let loadAbort: AbortController | null = null;
  const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Photography request failed.';

  async function load() {
    const current = generation;
    loadAbort?.abort(); loadAbort = new AbortController();
    store.getState().setUI({ loadStatus: 'loading' });
    try {
      const response = await fetch(endpoint, { cache: 'no-store', signal: loadAbort.signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to load photography.');
      if (!active || generation !== current) return;
      const document = validateDocument(payload.photography, store.getState().consultationId);
      if (store.getState().revision > 0) throw new Error('Unsaved local work exists. Reload cannot replace it. Keep this page open and resolve the service connection before continuing.');
      store.getState().hydrate(document);
    } catch (error) {
      if (!active || generation !== current || (error instanceof DOMException && error.name === 'AbortError')) return;
      store.getState().setUI({ loadStatus: 'error' }); store.getState().reportError(errorMessage(error));
    }
  }

  async function save(): Promise<boolean> {
    clearTimeout(timer);
    if (pendingSave) { const ok = await pendingSave; if (!ok) return false; return save(); }
    const s = store.getState();
    if (s.loadStatus !== 'ready') { s.setUI({ saveStatus: 'error' }); return false; }
    if (s.images.some(i => i.uploadStatus !== 'uploaded')) { s.setUI({ saveStatus: 'error' }); return false; }
    if (s.revision === s.savedRevision) return true;
    const revision = s.revision; const current = generation;
    const document: PhotographyDocument = { consultationId: s.consultationId,
      images: s.images.map(({ file: _file, ...i }) => i), markers: s.markers, selectedImageId: s.selectedImageId,
      beforeImageId: s.beforeImageId, afterImageId: s.afterImageId, comparisonPosition: s.comparisonPosition,
      efficacyPercentage: s.efficacyPercentage, efficacySource: s.efficacySource };
    s.setUI({ saveStatus: 'saving', savingRevision: revision });
    pendingSave = (async () => {
      try {
        const response = await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(document) });
        if (!response.ok) { const payload = await response.json(); throw new Error(payload.error || 'Photography save failed.'); }
        if (!active || generation !== current) return false;
        store.setState({ savedRevision: revision, savingRevision: null, saveStatus: store.getState().revision === revision ? 'saved' : 'idle' });
        return true;
      } catch (error) {
        if (active && generation === current) { store.getState().setUI({ saveStatus: 'error', savingRevision: null }); store.getState().reportError(errorMessage(error)); }
        return false;
      } finally { pendingSave = null; }
    })();
    return pendingSave;
  }

  async function upload(id: string) {
    const image = store.getState().images.find(i => i.id === id);
    if (!image?.file || image.uploadStatus === 'uploading') return;
    const current = generation;
    store.getState().updateImage(id, { uploadStatus: 'uploading', uploadProgress: 0, error: undefined });
    const xhr = new XMLHttpRequest(); requests.add(xhr);
    try {
      const payload = await new Promise<{ assetId: string; src: string }>((resolve, reject) => {
        xhr.open('POST', endpoint); xhr.timeout = 120000;
        xhr.upload.onprogress = e => { if (active && e.lengthComputable) store.getState().updateImage(id, { uploadProgress: Math.round(e.loaded / e.total * 100) }); };
        xhr.onload = () => { try { const data = JSON.parse(xhr.responseText); if (xhr.status < 200 || xhr.status >= 300) throw new Error(data.error || 'Image upload failed.'); resolve(data); } catch (e) { reject(e); } };
        xhr.onerror = () => reject(new Error('Image upload failed. Check your connection and retry.'));
        xhr.ontimeout = () => reject(new Error('Image upload timed out. Retry this image.'));
        xhr.onabort = () => reject(new Error('Image upload cancelled.'));
        const body = new FormData(); body.append('file', image.file!); body.append('imageId', image.id); xhr.send(body);
      });
      if (!payload.assetId || !safeAssetUrl(payload.src)) throw new Error('Upload did not return a stored asset ID and URL.');
      if (!active || generation !== current || !store.getState().images.some(i => i.id === id)) return;
      store.getState().updateImage(id, { assetId: payload.assetId, src: payload.src, file: undefined, uploadStatus: 'uploaded', uploadProgress: 100 });
      URL.revokeObjectURL(image.src);
      schedule();
    } catch (error) {
      if (active && generation === current) store.getState().updateImage(id, { uploadStatus: 'error', error: errorMessage(error) });
    } finally { requests.delete(xhr); }
  }

  async function addFiles(files: File[], source: LesionImage['source'] = 'UPLOAD') {
    const current = generation;
    for (const file of files) {
      if (!active || generation !== current) return;
      let src = '';
      try {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use JPG, JPEG, PNG, or WEBP.');
        if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('Images must be nonempty and no larger than 10 MB.');
        src = URL.createObjectURL(file);
        const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
          const image = new Image(); image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
          image.onerror = () => reject(new Error('This file could not be decoded as an image.')); image.src = src;
        });
        if (dimensions.width * dimensions.height > 40_000_000) throw new Error('Image resolution exceeds 40 megapixels. Resize it before uploading.');
        if (!active || generation !== current) { URL.revokeObjectURL(src); return; }
        const id = Date.now().toString() + Math.random().toString(36).substring(2);
        store.getState().addImages([{ id, file, src, name: file.name, type: file.type, size: file.size, ...dimensions,
          source, uploadedAt: new Date().toISOString(), uploadStatus: 'pending', uploadProgress: 0 }]);
        void upload(id);
      } catch (error) { if (src) URL.revokeObjectURL(src); if (active && current === generation) store.getState().reportError(`${file.name}: ${errorMessage(error)}`); }
    }
  }
  function schedule() {
    clearTimeout(timer);
    if (!active) return;
    timer = setTimeout(() => { if (store.getState().revision !== store.getState().savedRevision) void save(); }, 700);
  }
  function start() {
    active = true; generation++;
    void load();
    const unsubscribe = store.subscribe((s, prev) => { if (s.revision !== prev.revision) schedule(); });
    const beforeUnload = (event: BeforeUnloadEvent) => { const s = store.getState(); if (s.revision !== s.savedRevision) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      active = false; generation++; clearTimeout(timer); loadAbort?.abort(); unsubscribe();
      requests.forEach(xhr => xhr.abort()); requests.clear();
      window.removeEventListener('beforeunload', beforeUnload);
      store.getState().resetStore();
    };
  }
  return { start, load, save, addFiles, retryUpload: upload };
}
