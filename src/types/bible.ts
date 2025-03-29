export interface BibleReference {
  book: string;
  chapter: number;
  verse?: number;
  translation?: string;
}

export interface Verse {
  reference: BibleReference;
  text: string;
}

export interface Chapter {
  reference: BibleReference;
  verses: Verse[];
}

export interface Book {
  name: string;
  chapters: number;
  testament: 'old' | 'new';
}