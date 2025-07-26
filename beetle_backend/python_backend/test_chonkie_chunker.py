#!/usr/bin/env python3
"""
Test script for the new Chonkie-based chunker.
Run this to verify the chunker works with different strategies.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag.preprocessing.chunker import TextChunker, get_text_chunker
from models.api.file_models import FileType


def test_chunking_strategies():
    """Test different chunking strategies with sample content."""
    
    # Sample text content
    sample_text = """
    This is a sample document for testing chunking strategies.
    
    It contains multiple paragraphs with different content types.
    
    Here's a Python function example:
    def hello_world():
        print("Hello, World!")
        return "success"
    
    And some JavaScript code:
    function greet(name) {
        console.log(`Hello, ${name}!`);
        return true;
    }
    
    Finally, some regular text content that should be chunked appropriately.
    """
    
    # Sample code content
    sample_code = """
    import os
    from typing import List, Optional
    
    class DataProcessor:
        def __init__(self, data: List[str]):
            self.data = data
            self.processed = False
        
        def process(self) -> bool:
            try:
                for item in self.data:
                    if self._validate_item(item):
                        self._transform_item(item)
                self.processed = True
                return True
            except Exception as e:
                print(f"Processing failed: {e}")
                return False
        
        def _validate_item(self, item: str) -> bool:
            return len(item) > 0
        
        def _transform_item(self, item: str) -> None:
            # Transform the item
            transformed = item.upper()
            print(f"Transformed: {transformed}")
    """
    
    print("🧪 Testing Chonkie-based Chunker")
    print("=" * 50)
    
    # Test different strategies
    strategies = ["recursive", "sentence", "token", "code"]
    
    for strategy in strategies:
        print(f"\n📋 Testing {strategy.upper()} strategy:")
        print("-" * 30)
        
        try:
            # Create chunker with specific strategy
            chunker = TextChunker(
                chunk_size=200,
                chunk_overlap=50,
                strategy=strategy,
                language="python" if strategy == "code" else None
            )
            
            # Test with text content
            if strategy == "code":
                content = sample_code
                file_type = FileType.CODE
                language = "python"
            else:
                content = sample_text
                file_type = FileType.TEXT
                language = None
            
            chunks = chunker.chunk_text(
                text=content,
                file_id="test_file_001",
                file_type=file_type,
                language=language,
                filename=f"test_{strategy}.txt"
            )
            
            print(f"✅ Generated {len(chunks)} chunks")
            
            # Show first few chunks
            for i, chunk in enumerate(chunks[:3]):
                print(f"  Chunk {i+1}: {len(chunk.content)} chars")
                print(f"    Preview: {chunk.content[:100]}...")
                print(f"    Metadata: {chunk.metadata.chunk_type}, lines {chunk.metadata.start_line}-{chunk.metadata.end_line}")
                print()
            
            if len(chunks) > 3:
                print(f"  ... and {len(chunks) - 3} more chunks")
                
        except Exception as e:
            print(f"❌ Error with {strategy} strategy: {e}")
    
    # Test global instance
    print(f"\n🌐 Testing global instance:")
    print("-" * 30)
    
    try:
        global_chunker = get_text_chunker()
        chunks = global_chunker.chunk_text(
            text=sample_text,
            file_id="test_global",
            file_type=FileType.TEXT,
            filename="test_global.txt"
        )
        print(f"✅ Global chunker generated {len(chunks)} chunks")
    except Exception as e:
        print(f"❌ Error with global chunker: {e}")


if __name__ == "__main__":
    test_chunking_strategies() 