# Chonkie-Based Text Chunking System

This document describes the new Chonkie-based chunking system that replaces the legacy text chunker in the Beetle RAG pipeline.

## Overview

The new `TextChunker` class is a drop-in replacement for the legacy chunker that internally delegates to specialized Chonkie chunkers based on the selected strategy. This provides more robust and optimized chunking for different content types.

## Features

### Multiple Chunking Strategies

The chunker supports six different strategies, each optimized for specific use cases:

1. **`recursive`** (default) - Recursive character-based chunking with smart separators
2. **`sentence`** - Sentence-aware chunking that preserves semantic boundaries
3. **`token`** - Token-based chunking using tiktoken for precise token counting
4. **`code`** - Language-aware code chunking that preserves function/class boundaries
5. **`semantic`** - Semantic chunking using embeddings for meaning-aware splits
6. **`late`** - Late fusion chunking for combining multiple strategies

### Key Improvements

- **Better Code Handling**: Language-specific code chunking that understands syntax
- **Semantic Boundaries**: Preserves meaning and context in text chunks
- **Token Accuracy**: Precise token counting for LLM compatibility
- **Flexible Configuration**: Easy strategy switching and parameter tuning
- **Metadata Preservation**: Rich metadata including line numbers, chunk types, and positions

## Usage

### Basic Usage

```python
from rag.preprocessing.chunker import TextChunker, get_text_chunker

# Use global instance (recommended)
chunker = get_text_chunker()

# Or create custom instance
chunker = TextChunker(
    chunk_size=1024,
    chunk_overlap=100,
    strategy="recursive"
)
```

### Chunking Text

```python
chunks = chunker.chunk_text(
    text="Your text content here...",
    file_id="unique_file_id",
    file_type=FileType.TEXT,
    filename="document.txt"
)
```

### Chunking Code

```python
chunks = chunker.chunk_text(
    text="def hello_world():\n    print('Hello!')",
    file_id="code_file_001",
    file_type=FileType.CODE,
    language="python",
    filename="script.py"
)
```

### Strategy Selection

```python
# For general text
text_chunker = TextChunker(strategy="recursive")

# For code files
code_chunker = TextChunker(strategy="code", language="python")

# For semantic analysis
semantic_chunker = TextChunker(strategy="semantic")

# For precise token control
token_chunker = TextChunker(strategy="token")
```

## Configuration

### Environment Variables

The chunker respects these environment variables:

- `MAX_CHUNK_SIZE` - Maximum chunk size (default: 1000)
- `CHUNK_OVERLAP` - Overlap between chunks (default: 200)

### Strategy-Specific Parameters

Each strategy has optimized defaults:

| Strategy | Default Size | Default Overlap | Best For |
|----------|-------------|-----------------|----------|
| recursive | 1024 | 100 | General text |
| sentence | 1024 | 100 | Documents with clear sentences |
| token | 1024 | 100 | LLM token limits |
| code | 1024 | 100 | Source code files |
| semantic | 1024 | 100 | Meaning-aware retrieval |
| late | 1024 | 100 | Complex content |

## Migration from Legacy Chunker

The new chunker is a drop-in replacement. No changes needed to existing code:

```python
# Old way (still works)
chunks = text_chunker.chunk_text(
    text=content,
    file_id=file_id,
    file_type=file_type,
    language=language,
    filename=filename
)

# New way (same API)
chunks = text_chunker.chunk_text(
    text=content,
    file_id=file_id,
    file_type=file_type,
    language=language,
    filename=filename
)
```

## Output Format

The chunker returns `DocumentChunk` objects with rich metadata:

```python
DocumentChunk(
    chunk_id="unique_chunk_id",
    file_id="file_id",
    content="chunk content...",
    metadata=ChunkMetadata(
        chunk_id="unique_chunk_id",
        file_id="file_id",
        chunk_index=0,
        start_line=1,
        end_line=10,
        start_char=0,
        end_char=500,
        chunk_type="function",  # For code chunks
        language="python",      # For code chunks
        complexity_score=None,
        created_at=datetime.now(),
        filename="script.py"
    ),
    created_at=datetime.now()
)
```

## Testing

Run the test script to verify functionality:

```bash
cd beetle_backend/python_backend
python test_chonkie_chunker.py
```

This will test all strategies with sample content and show chunk generation results.

## Dependencies

The new chunker requires the `chonkie` library:

```bash
pip install chonkie>=0.1.0
```

## Performance

- **Recursive**: Fast, good for general text
- **Sentence**: Moderate speed, preserves semantics
- **Token**: Slower due to tokenization, but precise
- **Code**: Fast for code, slower for large files
- **Semantic**: Slowest due to embedding computation
- **Late**: Variable depending on sub-strategies

## Best Practices

1. **Use `recursive` for general text** - Good balance of speed and quality
2. **Use `code` for source files** - Preserves code structure
3. **Use `token` for LLM integration** - Ensures token limits
4. **Use `semantic` for complex documents** - Better retrieval quality
5. **Adjust chunk size based on content** - Smaller for code, larger for text
6. **Use overlap for better retrieval** - 10-20% overlap recommended

## Troubleshooting

### Common Issues

1. **Import Error**: Ensure `chonkie` is installed
2. **Strategy Not Found**: Check strategy name spelling
3. **Language Not Supported**: Use supported language codes for code chunking
4. **Memory Issues**: Reduce chunk size for large files

### Debug Mode

Enable debug logging to see chunking details:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Future Enhancements

- [ ] Add more language support for code chunking
- [ ] Implement adaptive chunk sizes based on content complexity
- [ ] Add support for multi-modal content (text + images)
- [ ] Integrate with external complexity analysis tools
- [ ] Add chunk quality scoring and filtering 