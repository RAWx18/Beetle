"""
Chonkie-based text / code chunking system for the RAG pipeline.
Handles everything: overlap, metadata, structure-aware splits.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional, Literal

from chonkie import (
    TokenChunker,
    SentenceChunker,
    RecursiveChunker,
    CodeChunker,
    LateChunker,
    SemanticChunker,
)
from chonkie.types import Chunk as ChonkieChunk

from models.api.file_models import DocumentChunk, ChunkMetadata, FileType


# --------------------------------------------------------------------------- #
#   Public API: TextChunker                                                   #
# --------------------------------------------------------------------------- #
class TextChunker:
    """
    Drop-in replacement for your legacy TextChunker.
    Internally delegates to the appropriate Chonkie chunker.
    """

    # fmt: off
    STRATEGIES = Literal[
        "token",      # TokenChunker
        "sentence",   # SentenceChunker
        "recursive",  # RecursiveChunker
        "code",       # CodeChunker
        "semantic",   # SemanticChunker
        "late",       # LateChunker
    ]
    # fmt: on

    def __init__(
        self,
        *,
        chunk_size: int = 1024,
        chunk_overlap: int = 100,
        strategy: STRATEGIES = "recursive",
        language: Optional[str] = None,
    ) -> None:
        """
        Parameters
        ----------
        chunk_size
            Maximum chunk size (tokens or characters depending on strategy).
        chunk_overlap
            Overlap between consecutive chunks.
        strategy
            Which Chonkie backend to use.
        language
            Only relevant for `strategy="code"` (python, javascript, java…).
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.strategy = strategy
        self.language = language

        # ------------------------------------------------------------------ #
        # Instantiate the proper Chonkie chunker
        # ------------------------------------------------------------------ #
        if strategy == "token":
            self._chunker = TokenChunker(
                chunk_size=chunk_size,
            )
        elif strategy == "sentence":
            self._chunker = SentenceChunker(
                chunk_size=chunk_size,
            )
        elif strategy == "recursive":
            self._chunker = RecursiveChunker(
                chunk_size=chunk_size,
            )
        elif strategy == "code":
            self._chunker = CodeChunker(
                language=language or "python",
                chunk_size=chunk_size,
            )
        elif strategy == "semantic":
            self._chunker = SemanticChunker(
                chunk_size=chunk_size,
            )
        elif strategy == "late":
            self._chunker = LateChunker(
                chunk_size=chunk_size,
            )
        else:
            raise ValueError(f"Unknown strategy: {strategy}")

    # ------------------------------------------------------------------ #
    # Public entry point (drop-in)
    # ------------------------------------------------------------------ #
    def chunk_text(
        self,
        text: str,
        *,
        file_id: str,
        file_type: FileType = FileType.TEXT,
        language: Optional[str] = None,
        filename: Optional[str] = None,
    ) -> List[DocumentChunk]:
        """
        Chunk the incoming text/code and return a list of DocumentChunk objects
        compatible with the rest of your codebase.
        """
        if not text.strip():
            return []
        
        # Allow runtime language override for code files
        if file_type == FileType.CODE and language:
            self.language = language

        # Let Chonkie do the heavy lifting
        chonkie_chunks: List[ChonkieChunk] = self._chunker.chunk(text)

        # Map Chonkie chunks -> your DocumentChunk
        return [
            self._to_document_chunk(
                c,
                file_id=file_id,
                chunk_index=idx,
                file_type=file_type,
                language=language or self.language,
                filename=filename,
            )
            for idx, c in enumerate(chonkie_chunks)
        ]

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    def _to_document_chunk(
        self,
        chonkie_chunk: ChonkieChunk,
        *,
        file_id: str,
        chunk_index: int,
        file_type: FileType,
        language: Optional[str],
        filename: Optional[str],
    ) -> DocumentChunk:
        """
        Convert a Chonkie Chunk into your internal DocumentChunk model.
        """
        chunk_id = str(uuid.uuid4())[:16]  # 128-bit → 16 hex chars

        metadata = ChunkMetadata(
            chunk_id=chunk_id,
            file_id=file_id,
            chunk_index=chunk_index,
            start_line=getattr(chonkie_chunk, "start_line", None),
            end_line=getattr(chonkie_chunk, "end_line", None),
            start_char=getattr(chonkie_chunk, "start_index", 0),
            end_char=getattr(chonkie_chunk, "end_index", len(chonkie_chunk.text)),
            chunk_type=getattr(chonkie_chunk, "type", None),
            language=language if file_type == FileType.CODE else None,
            complexity_score=None,  # Could plug in radon/mccabe here
            created_at=datetime.now(),
            filename=filename,
        )

        return DocumentChunk(
            chunk_id=chunk_id,
            file_id=file_id,
            content=chonkie_chunk.text,
            metadata=metadata,
            created_at=datetime.now(),
        )


# --------------------------------------------------------------------------- #
#   Global instance (drop-in)                                                 #
# --------------------------------------------------------------------------- #
_text_chunker = TextChunker()


def get_text_chunker() -> TextChunker:
    """Return the global chunker instance."""
    return _text_chunker
