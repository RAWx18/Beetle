
export type CortexItem = {
  id: string;
  title: string;
  url: string;
  type: string;
  createdDate: string;
  source: string;
  keywords: string[];
  pitch: string;
  writer: string;
};

export const cortexItems: CortexItem[] = [
  {
    id: '1',
    title: 'Neural networks fundamentals',
    url: '/cortex/neural-networks',
    type: 'Article',
    createdDate: '2023-04-15',
    source: 'Research Paper',
    keywords: ['AI', 'Machine Learning', 'Deep Learning'],
    pitch: 'Foundational knowledge on neural networks',
    writer: 'Alex Johnson'
  },
  {
    id: '2',
    title: 'Cloud architecture patterns',
    url: '/cortex/cloud-patterns',
    type: 'Guide',
    createdDate: '2023-05-22',
    source: 'Internal Knowledge',
    keywords: ['Cloud', 'Architecture', 'Patterns'],
    pitch: 'Best practices for cloud systems',
    writer: 'Sarah Miller'
  },
  {
    id: '3',
    title: 'UX research methods',
    url: '/cortex/ux-research',
    type: 'Collection',
    createdDate: '2023-06-10',
    source: 'External Website',
    keywords: ['UX', 'Research', 'Design'],
    pitch: 'Comprehensive guide to UX research',
    writer: 'David Chen'
  },
  {
    id: '4',
    title: 'Product strategy',
    url: '/cortex/product-strategy',
    type: 'Template',
    createdDate: '2023-07-05',
    source: 'Team Workshop',
    keywords: ['Product', 'Strategy', 'Management'],
    pitch: 'Framework for product strategy',
    writer: 'Emily Rodriguez'
  },
  {
    id: '5',
    title: 'JavaScript patterns',
    url: '/cortex/js-patterns',
    type: 'Code',
    createdDate: '2023-08-18',
    source: 'Book',
    keywords: ['JavaScript', 'Patterns', 'Development'],
    pitch: 'Effective JavaScript patterns and practices',
    writer: 'Michael Park'
  }
];

export const columns = [
  { id: 'title', name: 'Title', sortable: true },
  { id: 'url', name: 'URL', sortable: false },
  { id: 'type', name: 'Type', sortable: true },
  { id: 'createdDate', name: 'Created Date', sortable: true },
  { id: 'keywords', name: 'Keywords', sortable: false },
  { id: 'source', name: 'Source', sortable: true },
  { id: 'pitch', name: 'Pitch', sortable: false },
  { id: 'writer', name: 'Writer', sortable: true },
];
