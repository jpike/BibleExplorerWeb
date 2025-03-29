import React from 'react';
import { Book, ChevronRight } from 'lucide-react';
import { useBibleStore } from '../store/bibleStore';

export function BibleNavigation() {
  const { currentReference } = useBibleStore();
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Book className="h-6 w-6 text-indigo-600" />
          <div className="flex items-center space-x-2 ml-4 text-gray-600">
            <span>{currentReference.book}</span>
            <ChevronRight className="h-4 w-4" />
            <span>Chapter {currentReference.chapter}</span>
            {currentReference.verse && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span>Verse {currentReference.verse}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}