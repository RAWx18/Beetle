"""
Enhanced file processing utilities using Unstructured library.
Handles all file types with comprehensive language and content detection.
"""

import os
import mimetypes
from typing import Optional, Dict, Any, List
from pathlib import Path
import structlog
from datetime import datetime

# Initialize logger first
logger = structlog.get_logger(__name__)

# Try to import unstructured components, but handle import errors gracefully
try:
    from unstructured.partition.auto import partition
    from unstructured.partition.text import partition_text
    from unstructured.partition.json import partition_json
    from unstructured.partition.csv import partition_csv
    from unstructured.partition.xml import partition_xml
    from unstructured.partition.html import partition_html
    from unstructured.partition.md import partition_md
    from unstructured.partition.docx import partition_docx
    from unstructured.partition.pptx import partition_pptx
    from unstructured.partition.xlsx import partition_xlsx
    from unstructured.partition.image import partition_image
    from unstructured.partition.email import partition_email
    from unstructured.partition.epub import partition_epub
    from unstructured.staging.base import convert_to_dict
    
    # Try to import PDF partitioner separately to handle version issues
    try:
        from unstructured.partition.pdf import partition_pdf
        PDF_AVAILABLE = True
    except ImportError:
        logger.warning("PDF processing not available due to import error")
        PDF_AVAILABLE = False
        partition_pdf = None
    
    UNSTRUCTURED_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Unstructured library not available: {e}")
    UNSTRUCTURED_AVAILABLE = False
    # Create dummy functions
    partition = None
    partition_text = None
    partition_json = None
    partition_csv = None
    partition_xml = None
    partition_html = None
    partition_md = None
    partition_docx = None
    partition_pptx = None
    partition_xlsx = None
    partition_image = None
    partition_email = None
    partition_epub = None
    convert_to_dict = None
    PDF_AVAILABLE = False
    partition_pdf = None

from models.api.file_models import FileType
from config.settings import get_settings

settings = get_settings()


# Language mapping for all programming languages
LANGUAGE_MAPPING = {
    # Python
    '.py': 'python',
    '.pyx': 'python',
    '.pyi': 'python',
    
    # JavaScript/TypeScript
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    
    # Java
    '.java': 'java',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.groovy': 'groovy',
    '.clj': 'clojure',
    
    # C/C++
    '.c': 'c',
    '.cpp': 'cpp',
    '.cxx': 'cpp',
    '.cc': 'cpp',
    '.c++': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.hxx': 'cpp',
    
    # C#
    '.cs': 'csharp',
    '.csx': 'csharp',
    '.vb': 'visualbasic',
    
    # Web
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    '.vue': 'vue',
    '.svelte': 'svelte',
    
    # Mobile
    '.swift': 'swift',
    '.m': 'objectivec',
    '.mm': 'objectivec',
    
    # Data
    '.sql': 'sql',
    '.plsql': 'sql',
    '.tsql': 'sql',
    
    # Scripting
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'zsh',
    '.fish': 'fish',
    '.ps1': 'powershell',
    '.psm1': 'powershell',
    '.bat': 'batch',
    
    # Configuration
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.ini': 'ini',
    '.cfg': 'ini',
    '.conf': 'ini',
    
    # Documentation
    '.md': 'markdown',
    '.rst': 'rst',
    '.txt': 'text',
    '.log': 'text',
    
    # Other
    '.r': 'r',
    '.go': 'go',
    '.rs': 'rust',
    '.php': 'php',
    '.rb': 'ruby',
    '.pl': 'perl',
    '.lua': 'lua',
    '.dart': 'dart',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.clj': 'clojure',
    '.hs': 'haskell',
    '.ml': 'ocaml',
    '.fs': 'fsharp',
    '.nim': 'nim',
    '.zig': 'zig',
    '.v': 'verilog',
    '.sv': 'systemverilog',
    '.vhdl': 'vhdl',
    '.asm': 'assembly',
    '.s': 'assembly',
    '.S': 'assembly'
}


class FileProcessor:
    """Enhanced file processor using Unstructured library."""
    
    def __init__(self):
        """Initialize the file processor."""
        self.supported_extensions = set(LANGUAGE_MAPPING.keys())
        self.max_file_size_mb = 100  # Maximum file size in MB
        
    async def process_file(self, file_path: str, **kwargs) -> Dict[str, Any]:
        """
        Process any file type using Unstructured.
        
        Args:
            file_path: Path to the file
            **kwargs: Additional processing options
            
        Returns:
            Dict containing processed content, metadata, and language info
        """
        try:
            file_path = Path(file_path)
            
            # Check if file exists
            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            # Check file size
            file_size_mb = get_file_size_mb(str(file_path))
            if file_size_mb > self.max_file_size_mb:
                raise ValueError(f"File too large: {file_size_mb}MB > {self.max_file_size_mb}MB")
            
            # Detect file type and language
            file_type = await self.detect_file_type(str(file_path))
            language = await self.detect_language(str(file_path))
            
            # Process based on file type
            elements = await self._process_with_unstructured(str(file_path), **kwargs)
            
            # Convert to dictionary format
            processed_content = {
                "file_path": str(file_path),
                "file_name": file_path.name,
                "file_type": file_type,
                "language": language,
                "file_size": file_size_mb,
                "mime_type": self.get_mime_type(str(file_path)),
                "content": self._extract_text_content(elements),
                "metadata": self._extract_metadata(elements),
                "elements": [self._convert_element_to_dict(element) for element in elements],
                "processed_at": datetime.now().isoformat()
            }
            
            logger.info(
                "File processed successfully",
                file_path=str(file_path),
                language=language,
                elements_count=len(elements)
            )
            
            return processed_content
            
        except Exception as e:
            logger.error("File processing failed", file_path=str(file_path), error=str(e))
            raise
    
    async def _process_with_unstructured(self, file_path: str, **kwargs) -> List[Any]:
        """Process file using appropriate Unstructured partitioner."""
        if not UNSTRUCTURED_AVAILABLE:
            logger.warning("Unstructured library not available, using fallback text processing")
            return self._fallback_text_processing(file_path)
        
        try:
            file_path = Path(file_path)
            suffix = file_path.suffix.lower()
            
            # Use appropriate partitioner based on file type
            if suffix == '.json' and partition_json:
                elements = partition_json(filename=str(file_path), **kwargs)
            elif suffix == '.csv' and partition_csv:
                elements = partition_csv(filename=str(file_path), **kwargs)
            elif suffix == '.xml' and partition_xml:
                elements = partition_xml(filename=str(file_path), **kwargs)
            elif suffix in ['.html', '.htm'] and partition_html:
                elements = partition_html(filename=str(file_path), **kwargs)
            elif suffix in ['.md', '.markdown'] and partition_md:
                elements = partition_md(filename=str(file_path), **kwargs)
            elif suffix == '.pdf' and PDF_AVAILABLE and partition_pdf:
                elements = partition_pdf(filename=str(file_path), **kwargs)
            elif suffix in ['.docx', '.doc'] and partition_docx:
                elements = partition_docx(filename=str(file_path), **kwargs)
            elif suffix in ['.pptx', '.ppt'] and partition_pptx:
                elements = partition_pptx(filename=str(file_path), **kwargs)
            elif suffix in ['.xlsx', '.xls'] and partition_xlsx:
                elements = partition_xlsx(filename=str(file_path), **kwargs)
            elif suffix in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp'] and partition_image:
                elements = partition_image(filename=str(file_path), **kwargs)
            elif suffix in ['.eml', '.msg'] and partition_email:
                elements = partition_email(filename=str(file_path), **kwargs)
            elif suffix == '.epub' and partition_epub:
                elements = partition_epub(filename=str(file_path), **kwargs)
            elif suffix == '.txt' or suffix == '':
                elements = self._fallback_text_processing(file_path)
            else:
                # Use auto-detection for unknown types
                if partition:
                    elements = partition(filename=str(file_path), **kwargs)
                else:
                    elements = self._fallback_text_processing(file_path)
            
            return elements
            
        except Exception as e:
            logger.error("Unstructured processing failed", file_path=str(file_path), error=str(e))
            # Fallback to text processing
            return self._fallback_text_processing(file_path)
    
    def _fallback_text_processing(self, file_path: str) -> List[Any]:
        """Fallback text processing when unstructured is not available."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Create a simple text element
            class SimpleTextElement:
                def __init__(self, text):
                    self.text = text
                    self.metadata = None
            
            return [SimpleTextElement(content)]
        except Exception as e:
            logger.error("Fallback text processing failed", file_path=str(file_path), error=str(e))
            return []
    
    def _convert_element_to_dict(self, element: Any) -> Dict[str, Any]:
        """Convert element to dictionary format."""
        if convert_to_dict and UNSTRUCTURED_AVAILABLE:
            try:
                return convert_to_dict(element)
            except Exception:
                pass
        
        # Fallback conversion
        try:
            return {
                "text": getattr(element, 'text', str(element)),
                "type": type(element).__name__,
                "metadata": getattr(element, 'metadata', None)
            }
        except Exception:
            return {
                "text": str(element),
                "type": "unknown",
                "metadata": None
            }
    
    async def detect_file_type(self, file_path: str) -> FileType:
        """Detect file type using MIME type and extension."""
        try:
            # Check MIME type
            mime_type, _ = mimetypes.guess_type(file_path)
            
            # Map MIME type to FileType
            if mime_type:
                if mime_type.startswith('text/'):
                    return FileType.CODE
                elif mime_type.startswith('application/'):
                    if 'json' in mime_type or 'xml' in mime_type or 'javascript' in mime_type:
                        return FileType.CODE
                    elif 'pdf' in mime_type:
                        return FileType.DOCUMENT
                    elif 'word' in mime_type or 'excel' in mime_type or 'powerpoint' in mime_type:
                        return FileType.DOCUMENT
                elif mime_type.startswith('image/'):
                    return FileType.IMAGE
            
            # Check extension
            extension = Path(file_path).suffix.lower()
            
            # Code files
            if extension in LANGUAGE_MAPPING:
                return FileType.CODE
            
            # Document files
            doc_extensions = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'}
            if extension in doc_extensions:
                return FileType.DOCUMENT
            
            # Image files
            img_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp'}
            if extension in img_extensions:
                return FileType.IMAGE
            
            return FileType.TEXT
            
        except Exception as e:
            logger.warning(f"Failed to detect file type for {file_path}", error=str(e))
            return FileType.UNKNOWN

    async def detect_language(self, file_path: str) -> Optional[str]:
        """Detect programming language from file path and content."""
        extension = Path(file_path).suffix.lower()
        
        # Check known extensions
        if extension in LANGUAGE_MAPPING:
            return LANGUAGE_MAPPING[extension]
        
        # Default to generic for text files
        if extension in ['.txt', '.log', '.md']:
            return 'generic'
        
        # Use MIME type as fallback
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type:
            if 'javascript' in mime_type:
                return 'javascript'
            elif 'python' in mime_type:
                return 'python'
            elif 'html' in mime_type:
                return 'html'
            elif 'css' in mime_type:
                return 'css'
        
        return 'generic'
    
    def get_mime_type(self, file_path: str) -> str:
        """Get MIME type for a file."""
        mime_type, _ = mimetypes.guess_type(file_path)
        return mime_type or 'application/octet-stream'
    
    def _extract_text_content(self, elements: List[Any]) -> str:
        """Extract text content from processed elements."""
        if not elements:
            return ""
        
        # Join text from all elements
        texts = [element.text for element in elements if hasattr(element, 'text') and element.text]
        return '\n\n'.join(texts).strip()
    
    def _extract_metadata(self, elements: List[Any]) -> Dict[str, Any]:
        """Extract metadata from processed elements."""
        metadata = {
            "total_elements": len(elements),
            "element_types": {},
            "languages": set(),
            "file_types": set()
        }
        
        for element in elements:
            element_type = type(element).__name__
            metadata["element_types"][element_type] = metadata["element_types"].get(element_type, 0) + 1
            
            # Extract language from metadata
            if hasattr(element, 'metadata') and element.metadata:
                if hasattr(element.metadata, 'languages'):
                    metadata["languages"].update(element.metadata.languages or [])
        
        metadata["languages"] = list(metadata["languages"])
        metadata["file_types"] = list(metadata["file_types"])
        
        return metadata
    
    def is_supported(self, file_path: str) -> bool:
        """Check if file type is supported."""
        extension = Path(file_path).suffix.lower()
        return extension in self.supported_extensions
    
    def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """Get comprehensive file information."""
        path = Path(file_path)
        
        return {
            "file_path": str(path),
            "file_name": path.name,
            "file_size": get_file_size_mb(str(path)),
            "extension": path.suffix.lower(),
            "mime_type": self.get_mime_type(str(path)),
            "created": datetime.fromtimestamp(path.stat().st_ctime).isoformat(),
            "modified": datetime.fromtimestamp(path.stat().st_mtime).isoformat(),
            "language": self.detect_language(str(path)),
            "is_text": self.is_text_file(str(path)),
            "is_supported": self.is_supported(str(path))
        }
    
    def is_text_file(self, file_path: str) -> bool:
        """Check if file is a text file."""
        extension = Path(file_path).suffix.lower()
        return extension in LANGUAGE_MAPPING
    
    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for safe storage."""
        try:
            unsafe_chars = '<>:"/\\|?*'
            sanitized = filename
            for char in unsafe_chars:
                sanitized = sanitized.replace(char, '_')
            sanitized = sanitized.strip(' .')
            return sanitized or 'unnamed_file'
        except Exception:
            return 'unnamed_file'


# Utility functions
def get_file_size_mb(file_path: str) -> float:
    """Get file size in megabytes."""
    try:
        return os.path.getsize(file_path) / (1024 * 1024)
    except Exception:
        return 0.0


# Global file processor instance
file_processor = FileProcessor()


def get_file_processor() -> FileProcessor:
    """Get the global file processor instance."""
    return file_processor


# Enhanced file processing with batch support
class BatchFileProcessor:
    """Process multiple files efficiently."""
    
    def __init__(self):
        self.processor = FileProcessor()
    
    async def process_batch(self, file_paths: List[str], **kwargs) -> List[Dict[str, Any]]:
        """Process multiple files in batch."""
        results = []
        for file_path in file_paths:
            try:
                result = await self.processor.process_file(file_path, **kwargs)
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to process {file_path}", error=str(e))
                results.append({
                    "file_path": file_path,
                    "error": str(e),
                    "success": False
                })
        return results
    
    async def process_directory(self, directory: str, **kwargs) -> List[Dict[str, Any]]:
        """Process all files in a directory."""
        directory = Path(directory)
        file_paths = []
        
        for file_path in directory.rglob('*'):
            if file_path.is_file() and file_path.suffix in LANGUAGE_MAPPING:
                file_paths.append(str(file_path))
        
        return await self.process_batch(file_paths, **kwargs)


# Global batch processor
batch_processor = BatchFileProcessor()


def get_batch_processor() -> BatchFileProcessor:
    """Get the global batch processor instance."""
    return batch_processor


# Convenience functions for backward compatibility
def detect_file_type(filename: str, content: str = "") -> FileType:
    """Detect file type from filename."""
    return file_processor.detect_file_type(filename)


def detect_language(filename: str, content: str = "") -> Optional[str]:
    """Detect language from filename."""
    return file_processor.detect_language(filename)


def is_text_file(filename: str) -> bool:
    """Check if file is a text file."""
    return file_processor.is_text_file(filename)


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage."""
    return file_processor.sanitize_filename(filename)
