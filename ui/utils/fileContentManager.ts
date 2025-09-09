// File content management utilities
export interface FileContent {
  content: string;
  hash: string;
  timestamp: Date;
  error?: string;
  size?: number;
}

export interface FileContentCache {
  [key: string]: FileContent;
}

// Simple hash function for file content
export function getFileHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// Generate cache key for file
export function getFileCacheKey(branch: string, path: string): string {
  return `${branch}:${path}`;
}

// Check if file content has changed
export function hasFileContentChanged(oldHash: string, newContent: string): boolean {
  const newHash = getFileHash(newContent);
  return oldHash !== newHash;
}

// Check if cached content is still valid (within time limit)
export function isCachedContentValid(cachedContent: FileContent, maxAgeMinutes: number = 30): boolean {
  const now = new Date();
  const ageInMinutes = (now.getTime() - cachedContent.timestamp.getTime()) / (1000 * 60);
  return ageInMinutes < maxAgeMinutes;
}

// Lazy load file content with size limit
export function shouldLazyLoadFile(size: number, maxSizeBytes: number = 1024 * 1024): boolean {
  return size > maxSizeBytes;
}

// Get file size in human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Extract file extension for icon mapping
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Check if file type is supported for chat
export function isSupportedFileType(filename: string): boolean {
  const extension = getFileExtension(filename);
  const supportedExtensions = [
    'ts', 'tsx', 'js', 'jsx', 'json', 'md', 'txt', 'py', 'java', 'cpp', 'c',
    'html', 'css', 'scss', 'sass', 'less', 'xml', 'yaml', 'yml', 'toml',
    'ini', 'cfg', 'conf', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat',
    'sql', 'r', 'rb', 'php', 'go', 'rs', 'swift', 'kt', 'scala', 'clj'
  ];
  
  return supportedExtensions.includes(extension);
}

// Get estimated token count for file content
export function estimateTokenCount(content: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(content.length / 4);
}

// Check if file content is too large for processing
export function isFileTooLarge(content: string, maxTokens: number = 100000): boolean {
  return estimateTokenCount(content) > maxTokens;
}

// Truncate file content for preview
export function truncateFileContent(content: string, maxLength: number = 1000): string {
  if (content.length <= maxLength) return content;
  
  const truncated = content.substring(0, maxLength);
  const lastNewline = truncated.lastIndexOf('\n');
  
  if (lastNewline > maxLength * 0.8) {
    return truncated.substring(0, lastNewline) + '\n... (truncated)';
  }
  
  return truncated + '... (truncated)';
}

// Parse file content for code blocks
export function extractCodeBlocks(content: string): Array<{ language: string; code: string; startLine: number }> {
  const codeBlocks: Array<{ language: string; code: string; startLine: number }> = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let currentLanguage = '';
  let currentCode: string[] = [];
  let startLine = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        codeBlocks.push({
          language: currentLanguage,
          code: currentCode.join('\n'),
          startLine: startLine + 1
        });
        inCodeBlock = false;
        currentCode = [];
      } else {
        // Start of code block
        inCodeBlock = true;
        currentLanguage = line.slice(3).trim();
        startLine = i;
      }
    } else if (inCodeBlock) {
      currentCode.push(line);
    }
  }
  
  return codeBlocks;
}

// Get file statistics
export function getFileStats(content: string) {
  const lines = content.split('\n');
  const characters = content.length;
  const words = content.split(/\s+/).filter(word => word.length > 0).length;
  const codeBlocks = extractCodeBlocks(content);
  
  return {
    lines: lines.length,
    characters,
    words,
    codeBlocks: codeBlocks.length,
    estimatedTokens: estimateTokenCount(content)
  };
}
