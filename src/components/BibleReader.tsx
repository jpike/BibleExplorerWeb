import React, { useEffect, useState } from 'react';
import { useBibleStore } from '../store/bibleStore';
import { bibleService } from '../services/bibleService';
import type { Chapter } from '../types/bible';
import { Loader2, BookOpen } from 'lucide-react';

export function BibleReader() {
  const { currentReference, currentTranslation, setCurrentTranslation } = useBibleStore();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableTranslations = bibleService.getAvailableTranslations();

  useEffect(() => {
    async function loadChapter() {
      setLoading(true);
      setError(null);
      try {
        const chapterData = await bibleService.getChapter({ 
          ...currentReference, 
          translation: currentTranslation 
        });
        setChapter(chapterData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapter');
        setChapter(null);
      } finally {
        setLoading(false);
      }
    }

    loadChapter();
  }, [currentReference, currentTranslation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!chapter) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          <span className="text-gray-700">Translation:</span>
        </div>
        <select
          value={currentTranslation}
          onChange={(e) => setCurrentTranslation(e.target.value)}
          className="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        >
          {availableTranslations.map(translation => (
            <option key={translation} value={translation}>
              {translation}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentTranslation}
          </h2>
          <p className="text-sm text-gray-600">
            {currentReference.book} {currentReference.chapter}
            {currentReference.verse ? `:${currentReference.verse}` : ''}
          </p>
        </div>
        <div className="p-6 prose max-w-none">
          {chapter.verses.map((verse) => (
            <p key={verse.reference.verse} className="mb-4">
              <span className="text-indigo-600 font-medium mr-2">
                {verse.reference.verse}
              </span>
              {verse.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}