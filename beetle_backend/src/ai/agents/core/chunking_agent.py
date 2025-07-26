import re
import ast
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from agents.base_agent import BaseAgent, AgentConfig, AgentResult
from models.rag_models import ChunkedDocument, ChunkingStrategy
from utils.code_utils import CodeUtils
from utils.text_utils import TextUtils


class ChunkingAgentConfig(AgentConfig):
    """Configuration for chunking agent"""
    chunk_size: int = 1000
    chunk_overlap: int = 200
    chunking_strategy: ChunkingStrategy = ChunkingStrategy.HYBRID
    preserve_code_blocks: bool = True
    preserve_markdown_structure: bool = True
    min_chunk_size: int = 100
    max_chunk_size: int = 2000
    language_detection: bool = True
    semantic_boundaries: bool = True


class ChunkingAgent(BaseAgent):
    """Agent for intelligent document chunking with semantic boundaries"""
    
    def __init__(self, config: ChunkingAgentConfig):
        super().__init__(config)
        self.config = config
        self.code_utils = CodeUtils()
        self.text_utils = TextUtils()
    
    def process(self, input_data: Dict[str, Any]) -> AgentResult:
        """Process document chunking"""
        try:
            self.start_processing()
            
            # Extract input data
            document_id = input_data.get("document_id")
            content = input_data.get("content", "")
            source_type = input_data.get("source_type", "text")
            metadata = input_data.get("metadata", {})
            
            if not content:
                return AgentResult(
                    success=False,
                    error_message="No content provided for chunking",
                    processing_time=self.end_processing()
                )
            
            # Detect content type and language
            content_type = self._detect_content_type(content, source_type)
            language = None
            if self.config.language_detection:
                language = self._detect_language(content, content_type)
            
            # Choose chunking strategy
            if content_type == "code":
                chunks = self._chunk_code(content, document_id, language, metadata)
            elif content_type == "markdown":
                chunks = self._chunk_markdown(content, document_id, metadata)
            elif content_type == "text":
                chunks = self._chunk_text(content, document_id, metadata)
            else:
                chunks = self._chunk_hybrid(content, document_id, content_type, language, metadata)
            
            # Validate chunks
            valid_chunks = self._validate_chunks(chunks)
            
            processing_time = self.end_processing()
            
            return AgentResult(
                success=True,
                data={
                    "chunks": valid_chunks,
                    "total_chunks": len(valid_chunks),
                    "content_type": content_type,
                    "language": language,
                    "metadata": {
                        "chunking_strategy": self.config.chunking_strategy.value,
                        "chunk_size": self.config.chunk_size,
                        "chunk_overlap": self.config.chunk_overlap
                    }
                },
                processing_time=processing_time
            )
            
        except Exception as e:
            self.log_error("Chunking processing failed", error=e)
            return AgentResult(
                success=False,
                error_message=str(e),
                processing_time=self.end_processing()
            )
    
    def _detect_content_type(self, content: str, source_type: str) -> str:
        """Detect content type based on content and source type"""
        if source_type in ["github", "branch"]:
            # Check for code indicators
            if self._is_code_content(content):
                return "code"
            elif self._is_markdown_content(content):
                return "markdown"
            else:
                return "text"
        elif source_type == "web":
            if self._is_markdown_content(content):
                return "markdown"
            else:
                return "text"
        else:
            return "text"
    
    def _is_code_content(self, content: str) -> bool:
        """Check if content is code"""
        # Check for code file extensions in metadata or content patterns
        code_patterns = [
            r'def\s+\w+\s*\(',
            r'class\s+\w+',
            r'import\s+\w+',
            r'from\s+\w+\s+import',
            r'function\s+\w+',
            r'const\s+\w+',
            r'let\s+\w+',
            r'var\s+\w+',
            r'public\s+class',
            r'private\s+\w+',
            r'#include\s*<',
            r'package\s+\w+',
        ]
        
        for pattern in code_patterns:
            if re.search(pattern, content, re.MULTILINE):
                return True
        
        return False
    
    def _is_markdown_content(self, content: str) -> bool:
        """Check if content is markdown"""
        markdown_patterns = [
            r'^#\s+',
            r'^\*\*.*\*\*$',
            r'^\*.*\*$',
            r'^```',
            r'^\[.*\]\(.*\)',
            r'^>\s+',
            r'^\|\s+.*\s+\|',
        ]
        
        lines = content.split('\n')
        markdown_lines = 0
        
        for line in lines:
            for pattern in markdown_patterns:
                if re.match(pattern, line):
                    markdown_lines += 1
                    break
        
        return markdown_lines > len(lines) * 0.1  # At least 10% markdown patterns
    
    def _detect_language(self, content: str, content_type: str) -> Optional[str]:
        """Detect programming language for code content"""
        if content_type != "code":
            return None
        
        # Language detection patterns
        language_patterns = {
            "python": [
                r'def\s+\w+\s*\(',
                r'import\s+\w+',
                r'from\s+\w+\s+import',
                r'class\s+\w+.*:',
                r'if\s+__name__\s*==\s*[\'"]__main__[\'"]',
            ],
            "javascript": [
                r'function\s+\w+',
                r'const\s+\w+',
                r'let\s+\w+',
                r'var\s+\w+',
                r'console\.log',
                r'export\s+default',
            ],
            "typescript": [
                r'interface\s+\w+',
                r'type\s+\w+',
                r':\s*\w+\[\]',
                r'Promise<\w+>',
            ],
            "java": [
                r'public\s+class',
                r'private\s+\w+',
                r'public\s+static\s+void\s+main',
                r'import\s+java\.',
            ],
            "cpp": [
                r'#include\s*<',
                r'std::',
                r'namespace\s+\w+',
                r'class\s+\w+\s*{',
            ],
            "c": [
                r'#include\s*<',
                r'int\s+main\s*\(',
                r'printf\s*\(',
                r'struct\s+\w+',
            ],
            "go": [
                r'package\s+\w+',
                r'func\s+\w+',
                r'import\s*\(',
                r'fmt\.',
            ],
            "rust": [
                r'fn\s+\w+',
                r'use\s+\w+',
                r'pub\s+fn',
                r'let\s+mut\s+\w+',
            ],
        }
        
        for language, patterns in language_patterns.items():
            for pattern in patterns:
                if re.search(pattern, content, re.MULTILINE):
                    return language
        
        return None
    
    def _chunk_code(self, content: str, document_id: str, language: str, metadata: Dict[str, Any]) -> List[ChunkedDocument]:
        """Chunk code content with AST-aware boundaries"""
        chunks = []
        
        if language == "python":
            chunks = self._chunk_python_code(content, document_id, metadata)
        else:
            chunks = self._chunk_generic_code(content, document_id, language, metadata)
        
        return chunks
    
    def _chunk_python_code(self, content: str, document_id: str, metadata: Dict[str, Any]) -> List[ChunkedDocument]:
        """Chunk Python code using AST analysis"""
        try:
            tree = ast.parse(content)
            chunks = []
            chunk_index = 0
            
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                    # Extract function/class with its docstring and body
                    start_line = node.lineno
                    end_line = node.end_lineno if hasattr(node, 'end_lineno') else start_line
                    
                    # Get the source lines for this node
                    lines = content.split('\n')
                    node_content = '\n'.join(lines[start_line-1:end_line])
                    
                    # Create chunk
                    chunk = ChunkedDocument(
                        id=str(uuid.uuid4()),
                        document_id=document_id,
                        content=node_content,
                        chunk_index=chunk_index,
                        chunk_type="code_function" if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) else "code_class",
                        language="python",
                        metadata={
                            **metadata,
                            "node_type": type(node).__name__,
                            "node_name": node.name,
                            "start_line": start_line,
                            "end_line": end_line,
                            "has_docstring": ast.get_docstring(node) is not None,
                        },
                        start_line=start_line,
                        end_line=end_line,
                        token_count=len(node_content.split()),
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    chunks.append(chunk)
                    chunk_index += 1
            
            # If no functions/classes found, chunk by lines
            if not chunks:
                chunks = self._chunk_by_lines(content, document_id, "python", metadata)
            
            return chunks
            
        except SyntaxError:
            # Fallback to line-based chunking if AST parsing fails
            self.log_warning("AST parsing failed, falling back to line-based chunking")
            return self._chunk_by_lines(content, document_id, "python", metadata)
    
    def _chunk_generic_code(self, content: str, document_id: str, language: str, metadata: Dict[str, Any]) -> List[ChunkedDocument]:
        """Chunk generic code using pattern-based boundaries"""
        chunks = []
        chunk_index = 0
        
        # Split by function/class boundaries
        if language in ["javascript", "typescript"]:
            # Function/class patterns for JS/TS
            patterns = [
                r'(function\s+\w+\s*\([^)]*\)\s*{[^}]*})',
                r'(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{[^}]*})',
                r'(class\s+\w+\s*{[^}]*})',
            ]
        elif language in ["java", "cpp", "c"]:
            # Function/class patterns for Java/C++
            patterns = [
                r'(public\s+class\s+\w+\s*{[^}]*})',
                r'(private\s+\w+\s+\w+\s*\([^)]*\)\s*{[^}]*})',
                r'(public\s+\w+\s+\w+\s*\([^)]*\)\s*{[^}]*})',
            ]
        else:
            # Generic patterns
            patterns = [
                r'(def\s+\w+\s*\([^)]*\)\s*:[^:]*:)',
                r'(class\s+\w+\s*:[^:]*:)',
                r'(function\s+\w+\s*\([^)]*\)\s*{[^}]*})',
            ]
        
        # Find all matches
        all_matches = []
        for pattern in patterns:
            matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)
            all_matches.extend(matches)
        
        # Sort by position
        all_matches.sort(key=lambda x: x.start())
        
        # Create chunks from matches
        for match in all_matches:
            chunk_content = match.group(1)
            
            # Calculate line numbers
            start_line = content[:match.start()].count('\n') + 1
            end_line = content[:match.end()].count('\n') + 1
            
            chunk = ChunkedDocument(
                id=str(uuid.uuid4()),
                document_id=document_id,
                content=chunk_content,
                chunk_index=chunk_index,
                chunk_type="code_function",
                language=language,
                metadata={
                    **metadata,
                    "pattern_matched": True,
                    "start_line": start_line,
                    "end_line": end_line,
                },
                start_line=start_line,
                end_line=end_line,
                token_count=len(chunk_content.split()),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            chunks.append(chunk)
            chunk_index += 1
        
        # If no patterns matched, chunk by lines
        if not chunks:
            chunks = self._chunk_by_lines(content, document_id, language, metadata)
        
        return chunks
    
    def _chunk_markdown(self, content: str, document_id: str, metadata: Dict[str, Any]) -> List[ChunkedDocument]:
        """Chunk markdown content preserving structure"""
        chunks = []
        chunk_index = 0
        
        # Split by headers
        header_pattern = r'^(#{1,6})\s+(.+)$'
        lines = content.split('\n')
        current_chunk = []
        current_header = None
        
        for line in lines:
            header_match = re.match(header_pattern, line)
            
            if header_match:
                # Save previous chunk if exists
                if current_chunk:
                    chunk_content = '\n'.join(current_chunk)
                    chunk = ChunkedDocument(
                        id=str(uuid.uuid4()),
                        document_id=document_id,
                        content=chunk_content,
                        chunk_index=chunk_index,
                        chunk_type="markdown_section",
                        metadata={
                            **metadata,
                            "header": current_header,
                            "header_level": len(current_header.split('#')[0]) if current_header else 0,
                        },
                        token_count=len(chunk_content.split()),
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    chunks.append(chunk)
                    chunk_index += 1
                
                # Start new chunk
                current_chunk = [line]
                current_header = line
            else:
                current_chunk.append(line)
        
        # Add final chunk
        if current_chunk:
            chunk_content = '\n'.join(current_chunk)
            chunk = ChunkedDocument(
                id=str(uuid.uuid4()),
                document_id=document_id,
                content=chunk_content,
                chunk_index=chunk_index,
                chunk_type="markdown_section",
                metadata={
                    **metadata,
                    "header": current_header,
                    "header_level": len(current_header.split('#')[0]) if current_header else 0,
                },
                token_count=len(chunk_content.split()),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            chunks.append(chunk)
        
        return chunks
    
    def _chunk_text(self, content: str, document_id: str, metadata: Dict[str, Any]) -> List[ChunkedDocument]:
        """Chunk text content with semantic boundaries"""
        chunks = []
        chunk_index = 0
        
        # Split by paragraphs first
        paragraphs = re.split(r'\n\s*\n', content)
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
            
            # If paragraph is too long, split by sentences
            if len(paragraph.split()) > self.config.chunk_size:
                sentences = self._split_sentences(paragraph)
                current_chunk = []
                current_tokens = 0
                
                for sentence in sentences:
                    sentence_tokens = len(sentence.split())
                    
                    if current_tokens + sentence_tokens > self.config.chunk_size and current_chunk:
                        # Save current chunk
                        chunk_content = ' '.join(current_chunk)
                        chunk = ChunkedDocument(
                            id=str(uuid.uuid4()),
                            document_id=document_id,
                            content=chunk_content,
                            chunk_index=chunk_index,
                            chunk_type="text_semantic",
                            metadata={
                                **metadata,
                                "boundary_type": "sentence",
                            },
                            token_count=current_tokens,
                            created_at=datetime.utcnow(),
                            updated_at=datetime.utcnow()
                        )
                        chunks.append(chunk)
                        chunk_index += 1
                        
                        # Start new chunk with overlap
                        overlap_sentences = current_chunk[-2:] if len(current_chunk) >= 2 else current_chunk
                        current_chunk = overlap_sentences + [sentence]
                        current_tokens = sum(len(s.split()) for s in current_chunk)
                    else:
                        current_chunk.append(sentence)
                        current_tokens += sentence_tokens
                
                # Add final chunk
                if current_chunk:
                    chunk_content = ' '.join(current_chunk)
                    chunk = ChunkedDocument(
                        id=str(uuid.uuid4()),
                        document_id=document_id,
                        content=chunk_content,
                        chunk_index=chunk_index,
                        chunk_type="text_semantic",
                        metadata={
                            **metadata,
                            "boundary_type": "sentence",
                        },
                        token_count=current_tokens,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    chunks.append(chunk)
                    chunk_index += 1
            else:
                # Paragraph fits in one chunk
                chunk = ChunkedDocument(
                    id=str(uuid.uuid4()),
                    document_id=document_id,
                    content=paragraph,
                    chunk_index=chunk_index,
                    chunk_type="text_paragraph",
                    metadata={
                        **metadata,
                        "boundary_type": "paragraph",
                    },
                    token_count=len(paragraph.split()),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                chunks.append(chunk)
                chunk_index += 1
        
        return chunks
    
    def _chunk_hybrid(self, content: str, document_id: str, content_type: str, language: str, metadata: Dict[str, Any]) -> List[ChunkedDocument]:
        """Hybrid chunking strategy"""
        if content_type == "code":
            return self._chunk_code(content, document_id, language, metadata)
        elif content_type == "markdown":
            return self._chunk_markdown(content, document_id, metadata)
        else:
            return self._chunk_text(content, document_id, metadata)
    
    def _chunk_by_lines(self, content: str, document_id: str, language: str, metadata: Dict[str, Any]) -> List[ChunkedDocument]:
        """Fallback chunking by lines"""
        chunks = []
        chunk_index = 0
        
        lines = content.split('\n')
        current_chunk = []
        current_tokens = 0
        
        for line in lines:
            line_tokens = len(line.split())
            
            if current_tokens + line_tokens > self.config.chunk_size and current_chunk:
                # Save current chunk
                chunk_content = '\n'.join(current_chunk)
                chunk = ChunkedDocument(
                    id=str(uuid.uuid4()),
                    document_id=document_id,
                    content=chunk_content,
                    chunk_index=chunk_index,
                    chunk_type="code_lines",
                    language=language,
                    metadata={
                        **metadata,
                        "boundary_type": "line",
                    },
                    token_count=current_tokens,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                chunks.append(chunk)
                chunk_index += 1
                
                # Start new chunk with overlap
                overlap_lines = current_chunk[-5:] if len(current_chunk) >= 5 else current_chunk
                current_chunk = overlap_lines + [line]
                current_tokens = sum(len(l.split()) for l in current_chunk)
            else:
                current_chunk.append(line)
                current_tokens += line_tokens
        
        # Add final chunk
        if current_chunk:
            chunk_content = '\n'.join(current_chunk)
            chunk = ChunkedDocument(
                id=str(uuid.uuid4()),
                document_id=document_id,
                content=chunk_content,
                chunk_index=chunk_index,
                chunk_type="code_lines",
                language=language,
                metadata={
                    **metadata,
                    "boundary_type": "line",
                },
                token_count=current_tokens,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            chunks.append(chunk)
        
        return chunks
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting - can be enhanced with NLP libraries
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _validate_chunks(self, chunks: List[ChunkedDocument]) -> List[ChunkedDocument]:
        """Validate and filter chunks"""
        valid_chunks = []
        
        for chunk in chunks:
            # Check minimum size
            if len(chunk.content.split()) < self.config.min_chunk_size:
                continue
            
            # Check maximum size
            if len(chunk.content.split()) > self.config.max_chunk_size:
                # Split large chunks
                sub_chunks = self._split_large_chunk(chunk)
                valid_chunks.extend(sub_chunks)
            else:
                valid_chunks.append(chunk)
        
        return valid_chunks
    
    def _split_large_chunk(self, chunk: ChunkedDocument) -> List[ChunkedDocument]:
        """Split a large chunk into smaller ones"""
        sub_chunks = []
        content = chunk.content
        words = content.split()
        
        for i in range(0, len(words), self.config.chunk_size):
            sub_content = ' '.join(words[i:i + self.config.chunk_size])
            sub_chunk = ChunkedDocument(
                id=str(uuid.uuid4()),
                document_id=chunk.document_id,
                content=sub_content,
                chunk_index=chunk.chunk_index,
                chunk_type=f"{chunk.chunk_type}_sub",
                language=chunk.language,
                metadata={
                    **chunk.metadata,
                    "original_chunk_id": chunk.id,
                    "is_sub_chunk": True,
                },
                start_line=chunk.start_line,
                end_line=chunk.end_line,
                token_count=len(sub_content.split()),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            sub_chunks.append(sub_chunk)
        
        return sub_chunks 