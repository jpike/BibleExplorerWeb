import { create } from 'zustand';
import type { BibleReference } from '../types/bible';

interface BibleState {
  currentReference: BibleReference;
  currentTranslation: string;
  setCurrentReference: (ref: BibleReference) => void;
  setCurrentTranslation: (translation: string) => void;
}

export const useBibleStore = create<BibleState>((set) => ({
  currentReference: {
    book: 'Genesis',
    chapter: 1,
    verse: 1,
  },
  currentTranslation: 'KJV',
  setCurrentReference: (ref) => set({ currentReference: ref }),
  setCurrentTranslation: (translation) => set({ currentTranslation: translation })
}));