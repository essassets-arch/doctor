import { create } from 'zustand';
import { persist } from './persistence';
import type { PhotographyDocument } from './lesion-photography';
export const usePhotographyDocuments = create<{ documents: Record<string, PhotographyDocument>; save: (document: PhotographyDocument) => void }>()(persist((set) => ({
  documents: {},
  save: document => set(s => ({ documents: { ...s.documents, [document.consultationId]: document } })),
}), { name: 'doctor-photography' }));
