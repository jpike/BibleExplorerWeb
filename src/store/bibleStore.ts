import { create } from 'zustand';
import type { BibleReference } from '../types/bible';

interface BibleState {
  currentReference: BibleReference;
  translations: string[];
  setCurrentReference: (ref: BibleReference) => void;
  addTranslation: (translation: string) => void;
  removeTranslation: (translation: string) => void;
}

export const useBibleStore = create<BibleState>((set) => ({
  currentReference: {
    book: 'Genesis',
    chapter: 1,
    verse: 1,
    translation: 'KJV'
  },
  translations: ['KJV'],
  setCurrentReference: (ref) => set({ currentReference: ref }),
  addTranslation: (translation) => 
    set((state) => ({
      translations: [...state.translations, translation]
    })),
  removeTranslation: (translation) =>
    set((state) => ({
      translations: state.translations.filter(t => t !== translation)
    }))
}));