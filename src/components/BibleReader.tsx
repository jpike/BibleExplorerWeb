import React, { useEffect, useState } from 'react';
import { useBibleStore } from '../store/bibleStore';
import { bibleService } from '../services/bibleService';
import type { Chapter } from '../types/bible';
import { Loader2 } from 'lucide-react';

export function BibleReader() {
  const { currentReference, translations } = useBibleStore();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadChapter() {
      setLoading(true);
      setError(null);
      try {
        const chapterData = await bibleService.getChapter(currentReference);
        setChapter(chapterData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapter');
        setChapter(null);
      } finally {
        setLoading(false);
      }
    }

    loadChapter();
  }, [currentReference]);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {translations.map((translation) => (
        <div 
          key={translation}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {translation}
            </h2>
            <p className="text-sm text-gray-600">
              {currentReference.book} {currentReference.chapter}
              {currentReference.verse ? `:${currentReference.verse}` : ''}
            </p>
          </div>
          <div className="prose max-w-none">
            {chapter?.verses.map((verse) => (
              <p key={verse.reference.verse} className="mb-4">
                <span className="text-indigo-600 font-medium mr-2">
                  {verse.reference.verse}
                </span>
                {verse.text}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}