#!/usr/bin/env python3
"""
Simple test script to verify that all imports work correctly
"""
import os
import sys
from pathlib import Path

# Add the backend src directory to the Python path
backend_src = Path(__file__).parent / "src"
sys.path.insert(0, str(backend_src.resolve()))

def test_imports():
    """Test that all required modules can be imported"""
    print("Testing imports...")
    
    try:
        # Test importing the main modules
        from ai.pipeline_bridge import PipelineBridge
        print("✅ PipelineBridge imported successfully")
        
        from ai.controllers.pipeline_controller import PipelineController, PipelineConfig
        print("✅ PipelineController imported successfully")
        
        from ai.models.document import RawDocument, NormalizedDocument, SearchQuery
        print("✅ Document models imported successfully")
        
        from ai.agents.github_fetcher import GitHubFetcher, GitHubFetcherConfig
        print("✅ GitHubFetcher imported successfully")
        
        from ai.agents.embedding_agent import EmbeddingAgent, EmbeddingAgentConfig
        print("✅ EmbeddingAgent imported successfully")
        
        from ai.agents.retrieval_agent import RetrievalAgent, RetrievalAgentConfig
        print("✅ RetrievalAgent imported successfully")
        
        from ai.agents.answering_agent import AnsweringAgent, AnsweringAgentConfig
        print("✅ AnsweringAgent imported successfully")
        
        print("\n🎉 All imports successful!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1) 