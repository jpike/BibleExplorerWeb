import { XMLParser } from 'fast-xml-parser';
import type { BibleReference, Verse, Chapter } from '../types/bible';
import { bibleBooks } from '../data/books';

// Interface for Bible text providers
interface BibleTextProvider {
  getVerse: (reference: BibleReference) => Promise<Verse>;
  getChapter: (reference: BibleReference) => Promise<Chapter>;
  getVerseRange: (start: BibleReference, end: BibleReference) => Promise<Verse[]>;
}

// OSIS XML provider for Bible translations
class OSISProvider implements BibleTextProvider {
  private xmlData: Record<string, any> = {};
  private parser: XMLParser;
  private initialized: Record<string, boolean> = {};
  private initPromises: Record<string, Promise<void>> = {};
  private translationPaths: Record<string, string> = {
    'KJV': '/data/kjv.xml',
    'WEB': '/data/web.xml',
    'YLT': '/data/ylt.xml'
  };

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '_text',
      isArray: (name) => ['div', 'chapter', 'verse'].includes(name),
    });
  }

  private async initialize(translation: string) {
    if (this.initialized[translation]) return;
    if (this.initPromises[translation]) return this.initPromises[translation];

    const path = this.translationPaths[translation];
    if (!path) {
      throw new Error(`Translation ${translation} not supported`);
    }

    this.initPromises[translation] = (async () => {
      try {
        const response = await fetch(path);
        const xmlText = await response.text();
        this.xmlData[translation] = this.parser.parse(xmlText);
        this.initialized[translation] = true;
      } catch (error) {
        console.error(`Failed to load Bible data for ${translation}:`, error);
        throw new Error(`Failed to load Bible data for ${translation}`);
      }
    })();

    return this.initPromises[translation];
  }

  private getBookAbbreviation(bookName: string): string {
    const abbreviations: Record<string, string> = {
      // Old Testament
      'Genesis': 'Gen',
      'Exodus': 'Exod',
      'Leviticus': 'Lev',
      'Numbers': 'Num',
      'Deuteronomy': 'Deut',
      'Joshua': 'Josh',
      'Judges': 'Judg',
      'Ruth': 'Ruth',
      '1 Samuel': '1Sam',
      '2 Samuel': '2Sam',
      '1 Kings': '1Kgs',
      '2 Kings': '2Kgs',
      '1 Chronicles': '1Chr',
      '2 Chronicles': '2Chr',
      'Ezra': 'Ezra',
      'Nehemiah': 'Neh',
      'Esther': 'Esth',
      'Job': 'Job',
      'Psalms': 'Ps',
      'Proverbs': 'Prov',
      'Ecclesiastes': 'Eccl',
      'Song of Solomon': 'Song',
      'Isaiah': 'Isa',
      'Jeremiah': 'Jer',
      'Lamentations': 'Lam',
      'Ezekiel': 'Ezek',
      'Daniel': 'Dan',
      'Hosea': 'Hos',
      'Joel': 'Joel',
      'Amos': 'Amos',
      'Obadiah': 'Obad',
      'Jonah': 'Jonah',
      'Micah': 'Mic',
      'Nahum': 'Nah',
      'Habakkuk': 'Hab',
      'Zephaniah': 'Zeph',
      'Haggai': 'Hag',
      'Zechariah': 'Zech',
      'Malachi': 'Mal',
      
      // New Testament
      'Matthew': 'Matt',
      'Mark': 'Mark',
      'Luke': 'Luke',
      'John': 'John',
      'Acts': 'Acts',
      'Romans': 'Rom',
      '1 Corinthians': '1Cor',
      '2 Corinthians': '2Cor',
      'Galatians': 'Gal',
      'Ephesians': 'Eph',
      'Philippians': 'Phil',
      'Colossians': 'Col',
      '1 Thessalonians': '1Thess',
      '2 Thessalonians': '2Thess',
      '1 Timothy': '1Tim',
      '2 Timothy': '2Tim',
      'Titus': 'Titus',
      'Philemon': 'Phlm',
      'Hebrews': 'Heb',
      'James': 'Jas',
      '1 Peter': '1Pet',
      '2 Peter': '2Pet',
      '1 John': '1John',
      '2 John': '2John',
      '3 John': '3John',
      'Jude': 'Jude',
      'Revelation': 'Rev'
    };
    return abbreviations[bookName] || bookName;
  }

  private findVerseInXML(reference: BibleReference) {
    if (!reference.translation) {
      throw new Error('Translation must be specified');
    }

    const bookAbbr = this.getBookAbbreviation(reference.book);
    const osisID = `${bookAbbr}.${reference.chapter}.${reference.verse}`;
    
    const book = this.xmlData[reference.translation].osis.osisText.div.find(
      (div: any) => div.osisID === bookAbbr
    );
    
    if (!book) return null;

    const chapter = book.chapter.find(
      (ch: any) => ch.osisID === `${bookAbbr}.${reference.chapter}`
    );
    
    if (!chapter) return null;

    const verse = chapter.verse.find(
      (v: any) => v.osisID === osisID
    );
    
    return verse;
  }

  private findChapterInXML(reference: BibleReference) {
    if (!reference.translation) {
      throw new Error('Translation must be specified');
    }

    const bookAbbr = this.getBookAbbreviation(reference.book);
    const book = this.xmlData[reference.translation].osis.osisText.div.find(
      (div: any) => div.osisID === bookAbbr
    );
    
    if (!book) return null;

    const chapter = book.chapter.find(
      (ch: any) => ch.osisID === `${bookAbbr}.${reference.chapter}`
    );
    
    return chapter;
  }

  async getVerse(reference: BibleReference): Promise<Verse> {
    if (!reference.translation) {
      throw new Error('Translation must be specified');
    }

    await this.initialize(reference.translation);

    const verse = this.findVerseInXML(reference);
    if (!verse) {
      throw new Error(`Verse not found: ${reference.book} ${reference.chapter}:${reference.verse}`);
    }

    return {
      reference,
      text: verse._text
    };
  }

  async getChapter(reference: BibleReference): Promise<Chapter> {
    if (!reference.translation) {
      throw new Error('Translation must be specified');
    }

    await this.initialize(reference.translation);

    const chapter = this.findChapterInXML(reference);
    if (!chapter) {
      throw new Error(`Chapter not found: ${reference.book} ${reference.chapter}`);
    }

    const verses = chapter.verse.map((v: any) => {
      const [book, chapter, verse] = v.osisID.split('.');
      return {
        reference: {
          book: reference.book,
          chapter: parseInt(chapter),
          verse: parseInt(verse),
          translation: reference.translation
        },
        text: v._text
      };
    });

    return {
      reference,
      verses
    };
  }

  async getVerseRange(start: BibleReference, end: BibleReference): Promise<Verse[]> {
    if (!start.translation || !end.translation) {
      throw new Error('Translation must be specified');
    }

    if (start.translation !== end.translation) {
      throw new Error('Start and end references must use the same translation');
    }

    await this.initialize(start.translation);

    if (start.book !== end.book) {
      throw new Error('Verse range must be within the same book');
    }

    const verses: Verse[] = [];
    const chapter = this.findChapterInXML(start);
    
    if (!chapter) {
      throw new Error(`Chapter not found: ${start.book} ${start.chapter}`);
    }

    const startVerse = start.verse || 1;
    const endVerse = end.verse || chapter.verse.length;

    for (const verse of chapter.verse) {
      const [, , verseNum] = verse.osisID.split('.');
      const verseNumber = parseInt(verseNum);
      
      if (verseNumber >= startVerse && verseNumber <= endVerse) {
        verses.push({
          reference: {
            book: start.book,
            chapter: start.chapter,
            verse: verseNumber,
            translation: start.translation
          },
          text: verse._text
        });
      }
    }

    return verses;
  }

  getAvailableTranslations(): string[] {
    return Object.keys(this.translationPaths);
  }
}

// API.Bible provider (stubbed)
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
    throw new Error('Not implemented');
  }

  async getChapter(reference: BibleReference): Promise<Chapter> {
    throw new Error('Not implemented');
  }

  async getVerseRange(start: BibleReference, end: BibleReference): Promise<Verse[]> {
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

  getAvailableTranslations(): string[] {
    return (this.provider as OSISProvider).getAvailableTranslations?.() || [];
  }
}

// Create and export default instance with OSIS XML provider
export const bibleService = new BibleService(new OSISProvider());