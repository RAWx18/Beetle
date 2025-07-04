import { UserCasesData, Book } from './UseCasesTypes';

export const userCasesData: UserCasesData = {
  Marketers: {
    title: 'Save and find quotes & highlights',
    subtitle: 'that inspire you.',
    description: "nature scene now feels like a stimulation. We are overloaded with digital imagery. The internet has delivered the world to us on a silver platter from the glacial landscapes of Greenland to the cracks lining the Sahara desert. We've seen the deep ocean, microscopic bacteria, the insides of our own bodies.",
    quote: "True change is within.",
    background: 'bg-primary',
    textColor: 'text-primary-foreground',
    ctaText: 'SAVE TO MY MIND'
  },
  Designers: {
    title: 'Create instant, boundless',
    subtitle: 'visual moodboards.',
    description: '',
    quote: '',
    background: 'bg-secondary',
    textColor: 'text-foreground',
    ctaText: '',
    showImageGrid: true
  },
  Writers: {
    title: 'Write without',
    subtitle: 'distractions.',
    description: '',
    quote: '',
    background: 'bg-accent',
    textColor: 'text-foreground',
    ctaText: 'ADD NEW NOTE',
    showNotepad: true
  },
  Researchers: {
    title: 'Collect all your research &',
    subtitle: 'references in one place.',
    description: '',
    quote: '',
    background: 'bg-muted',
    textColor: 'text-foreground',
    ctaText: '',
    showBrain: true
  },
  Developers: {
    title: 'Your private',
    subtitle: 'resource & reference hub.',
    description: '',
    quote: '',
    background: 'bg-background',
    textColor: 'text-foreground',
    ctaText: '',
    showDevTools: true
  },
  Everyone: {
    title: 'A place for everything',
    subtitle: 'you want to remember.',
    description: '',
    quote: '',
    background: 'bg-muted',
    textColor: 'text-foreground',
    ctaText: '',
    showTags: true
  }
};

export const booksData: Book[] = [{
  title: "The Creative Mind",
  author: "Maria Johnson",
  coverColor: "bg-primary",
  textColor: "text-primary-foreground"
}, {
  title: "Design Patterns",
  author: "Alex Thompson",
  coverColor: "bg-secondary",
  textColor: "text-foreground"
}, {
  title: "The Art of Focus",
  author: "Sarah Williams",
  coverColor: "bg-accent",
  textColor: "text-foreground"
}, {
  title: "Digital Minimalism",
  author: "Cal Newport",
  coverColor: "bg-muted",
  textColor: "text-foreground"
}, {
  title: "Atomic Habits",
  author: "James Clear",
  coverColor: "bg-primary",
  textColor: "text-primary-foreground"
}];
