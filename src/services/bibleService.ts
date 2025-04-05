import { XMLParser } from 'fast-xml-parser';
import type { BibleReference, Verse, Chapter } from '../types/bible';
import { bibleBooks } from '../data/books';

// Interface for Bible text providers
interface BibleTextProvider {
  getVerse: (reference: BibleReference) => Promise<Verse>;
  getChapter: (reference: BibleReference) => Promise<Chapter>;
  getVerseRange: (start: BibleReference, end: BibleReference) => Promise<Verse[]>;
}

// OSIS XML provider for KJV
class OSISProvider implements BibleTextProvider {
  private xmlData: any = null;
  private parser: XMLParser;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '_text',
      isArray: (name) => ['div', 'chapter', 'verse'].includes(name),
    });
  }

  private async initialize() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const response = await fetch('/data/kjv.xml');
        const xmlText = await response.text();
        this.xmlData = this.parser.parse(xmlText);
        this.initialized = true;
      } catch (error) {
        console.error('Failed to load Bible data:', error);
        throw new Error('Failed to load Bible data');
      }
    })();

    return this.initPromise;
  }

  private getBookAbbreviation(bookName: string): string {
    // Convert full book names to OSIS abbreviations
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
    const bookAbbr = this.getBookAbbreviation(reference.book);
    const osisID = `${bookAbbr}.${reference.chapter}.${reference.verse}`;
    
    const book = this.xmlData.osis.osisText.div.find(
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
    const bookAbbr = this.getBookAbbreviation(reference.book);
    const book = this.xmlData.osis.osisText.div.find(
      (div: any) => div.osisID === bookAbbr
    );
    
    if (!book) return null;

    const chapter = book.chapter.find(
      (ch: any) => ch.osisID === `${bookAbbr}.${reference.chapter}`
    );
    
    return chapter;
  }

  async getVerse(reference: BibleReference): Promise<Verse> {
    await this.initialize();

    const verse = this.findVerseInXML(reference);
    if (!verse) {
      throw new Error(`Verse not found: ${reference.book} ${reference.chapter}:${reference.verse}`);
    }

    return {
      reference: { ...reference, translation: 'KJV' },
      text: verse._text
    };
  }

  async getChapter(reference: BibleReference): Promise<Chapter> {
    await this.initialize();

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
          translation: 'KJV'
        },
        text: v._text
      };
    });

    return {
      reference: { ...reference, translation: 'KJV' },
      verses
    };
  }

  async getVerseRange(start: BibleReference, end: BibleReference): Promise<Verse[]> {
    await this.initialize();

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
            translation: 'KJV'
          },
          text: verse._text
        });
      }
    }

    return verses;
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
}

// Create and export default instance with OSIS XML provider
export const bibleService = new BibleService(new OSISProvider());