import type { BibleReference, Verse, Chapter } from '../types/bible';
import { bibleBooks } from '../data/books';

// Interface for Bible text providers
interface BibleTextProvider {
  getVerse: (reference: BibleReference) => Promise<Verse>;
  getChapter: (reference: BibleReference) => Promise<Chapter>;
  getVerseRange: (start: BibleReference, end: BibleReference) => Promise<Verse[]>;
}

// Local KJV provider
class KJVProvider implements BibleTextProvider {
  private async loadBookData(book: string) {
    try {
      // Dynamic import of book data
      const module = await import(`../data/kjv/${book.toLowerCase()}.ts`);
      return module.default;
    } catch (error) {
      console.error(`Failed to load book data for ${book}:`, error);
      throw new Error(`Book data not available for ${book}`);
    }
  }

  private isValidReference(reference: BibleReference): boolean {
    const book = bibleBooks.find(b => b.name === reference.book);
    if (!book) return false;
    
    if (reference.chapter < 1 || reference.chapter > book.chapters) return false;
    
    // Verse validation would require knowing the number of verses in each chapter
    // For now, we'll just ensure it's a positive number if provided
    if (reference.verse !== undefined && reference.verse < 1) return false;
    
    return true;
  }

  async getVerse(reference: BibleReference): Promise<Verse> {
    if (!this.isValidReference(reference)) {
      throw new Error(`Invalid reference: ${reference.book} ${reference.chapter}:${reference.verse}`);
    }

    const bookData = await this.loadBookData(reference.book);
    const verse = bookData[reference.chapter]?.[reference.verse];
    
    if (!verse) {
      throw new Error(`Verse not found: ${reference.book} ${reference.chapter}:${reference.verse}`);
    }

    return {
      reference: { ...reference, translation: 'KJV' },
      text: verse
    };
  }

  async getChapter(reference: BibleReference): Promise<Chapter> {
    if (!this.isValidReference(reference)) {
      throw new Error(`Invalid reference: ${reference.book} ${reference.chapter}`);
    }

    const bookData = await this.loadBookData(reference.book);
    const chapterData = bookData[reference.chapter];
    
    if (!chapterData) {
      throw new Error(`Chapter not found: ${reference.book} ${reference.chapter}`);
    }

    const verses = Object.entries(chapterData).map(([verseNum, text]) => ({
      reference: {
        book: reference.book,
        chapter: reference.chapter,
        verse: parseInt(verseNum, 10),
        translation: 'KJV'
      },
      text: text as string
    }));

    return {
      reference: { ...reference, translation: 'KJV' },
      verses
    };
  }

  async getVerseRange(start: BibleReference, end: BibleReference): Promise<Verse[]> {
    if (!this.isValidReference(start) || !this.isValidReference(end)) {
      throw new Error('Invalid verse range reference');
    }

    if (start.book !== end.book) {
      throw new Error('Verse range must be within the same book');
    }

    const bookData = await this.loadBookData(start.book);
    const verses: Verse[] = [];

    for (let chapter = start.chapter; chapter <= end.chapter; chapter++) {
      const chapterData = bookData[chapter];
      if (!chapterData) continue;

      const startVerse = chapter === start.chapter ? start.verse || 1 : 1;
      const endVerse = chapter === end.chapter ? end.verse || Object.keys(chapterData).length : Object.keys(chapterData).length;

      for (let verse = startVerse; verse <= endVerse; verse++) {
        if (chapterData[verse]) {
          verses.push({
            reference: {
              book: start.book,
              chapter,
              verse,
              translation: 'KJV'
            },
            text: chapterData[verse]
          });
        }
      }
    }

    return verses;
  }
}

// API.Bible provider
class APIBibleProvider implements BibleTextProvider {
  private apiKey: string;
  private baseUrl = 'https://api.scripture.api.bible/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchFromAPI(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'api-key': this.apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`API.Bible request failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getVerse(reference: BibleReference): Promise<Verse> {
    // TODO: Implement API.Bible verse lookup
    // Example endpoint: /bibles/{bibleId}/verses/{verseId}
    throw new Error('Not implemented');
  }

  async getChapter(reference: BibleReference): Promise<Chapter> {
    // TODO: Implement API.Bible chapter lookup
    // Example endpoint: /bibles/{bibleId}/chapters/{chapterId}
    throw new Error('Not implemented');
  }

  async getVerseRange(start: BibleReference, end: BibleReference): Promise<Verse[]> {
    // TODO: Implement API.Bible verse range lookup
    throw new Error('Not implemented');
  }
}

// Bible service that can use different providers
export class BibleService {
  private provider: BibleTextProvider;

  constructor(provider: BibleTextProvider) {
    this.provider = provider;
  }

  async getVerse(reference: BibleReference): Promise<Verse> {
    return this.provider.getVerse(reference);
  }

  async getChapter(reference: BibleReference): Promise<Chapter> {
    return this.provider.getChapter(reference);
  }

  async getVerseRange(start: BibleReference, end: BibleReference): Promise<Verse[]> {
    return this.provider.getVerseRange(start, end);
  }
}

// Create and export default instance with KJV provider
export const bibleService = new BibleService(new KJVProvider());