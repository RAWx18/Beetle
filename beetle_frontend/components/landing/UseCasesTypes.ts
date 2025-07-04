
export type UserType = 'Marketers' | 'Designers' | 'Writers' | 'Researchers' | 'Developers' | 'Everyone';

export interface Book {
  title: string;
  author: string;
  coverColor: string;
  textColor: string;
}

export interface UserCase {
  title: string;
  subtitle: string;
  description: string;
  quote: string;
  background: string;
  textColor: string;
  ctaText: string;
  showImageGrid?: boolean;
  showNotepad?: boolean;
  showBrain?: boolean;
  showDevTools?: boolean;
  showTags?: boolean;
}

export interface UserCasesData {
  [key: string]: UserCase;
}
