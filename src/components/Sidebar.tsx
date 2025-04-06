import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { useBibleStore } from '../store/bibleStore';
import { bibleBooks } from '../data/books';
import clsx from 'clsx';

export function Sidebar() {
  const { currentReference, setCurrentReference, currentTranslation } = useBibleStore();
  const [expandedBook, setExpandedBook] = useState<string | null>(currentReference.book);

  const oldTestament = bibleBooks.filter(book => book.testament === 'old');
  const newTestament = bibleBooks.filter(book => book.testament === 'new');

  const handleChapterClick = async (book: string, chapter: number) => {
    setCurrentReference({ 
      book, 
      chapter, 
      verse: undefined,
    });
  };

  const renderChapters = (book: string, totalChapters: number) => {
    if (expandedBook !== book) return null;

    return (
      <div className="ml-6 grid grid-cols-6 gap-1 mt-1">
        {Array.from({ length: totalChapters }, (_, i) => i + 1).map((chapter) => (
          <button
            key={chapter}
            onClick={() => handleChapterClick(book, chapter)}
            className={clsx(
              "p-1 text-sm rounded hover:bg-indigo-100 transition-colors",
              currentReference.book === book && currentReference.chapter === chapter
                ? "bg-indigo-100 text-indigo-700 font-medium"
                : "text-gray-600"
            )}
          >
            {chapter}
          </button>
        ))}
      </div>
    );
  };

  const renderTestament = (title: string, books: typeof bibleBooks) => (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </h2>
      <div className="space-y-1">
        {books.map((book) => (
          <div key={book.name}>
            <button
              onClick={() => setExpandedBook(expandedBook === book.name ? null : book.name)}
              className={clsx(
                "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded transition-colors",
                currentReference.book === book.name
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                <span>{book.name}</span>
              </div>
              {expandedBook === book.name ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {renderChapters(book.name, book.chapters)}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      {renderTestament('Old Testament', oldTestament)}
      {renderTestament('New Testament', newTestament)}
    </div>
  );
}