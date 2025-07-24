"""
Test script for GitHub file import and RAG pipeline integration.

This script tests the end-to-end flow of importing files from GitHub,
processing them through the RAG pipeline, and querying the results.
"""
import os
import sys
import asyncio
import json
from pathlib import Path
from typing import Dict, Any, List, Optional

# Add the backend src directory to the Python path
backend_src = Path(__file__).parent / "src"
sys.path.insert(0, str(backend_src.resolve()))

# Load environment variables before importing modules
from dotenv import load_dotenv
load_dotenv()

# Now import the local modules
from ai.pipeline_bridge import PipelineBridge

# Configuration
TEST_REPO = "openai/openai-python"  # Using a public repo for testing
TEST_BRANCH = "main"
TEST_FILES = [
    "openai/__init__.py",
    "README.md"
]

def print_section(title: str, char: str = "="):
    """Print a section header for better test output."""
    print(f"\n{char * 10} {title} {char * 10}")

async def test_github_import():
    """Test GitHub file import and RAG pipeline integration."""
    print_section("🚀 Starting GitHub Import Test")
    
    try:
        # Initialize the pipeline bridge
        print("🔧 Initializing pipeline bridge...")
        bridge = PipelineBridge()
        print("✅ Pipeline bridge initialized successfully")
        
        # Get GitHub token from environment or prompt user
        github_token = os.getenv("GITHUB_TOKEN")
        if not github_token:
            print("⚠️  GITHUB_TOKEN not found in environment")
            github_token = input("Please enter your GitHub token (with 'repo' scope): ").strip()
            if not github_token:
                print("❌ No GitHub token provided. Test aborted.")
                return False
        
        # Test data for GitHub import
        import_data = {
            "repository": TEST_REPO,
            "branch": TEST_BRANCH,
            "files": [{"path": path, "branch": TEST_BRANCH} for path in TEST_FILES],
            "github_token": github_token,
            "source_type": "github"
        }
    except Exception as e:
        print(f"❌ Failed to initialize test environment: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    try:
        # Step 1: Import files from GitHub
        print_section("📥 Importing Files from GitHub")
        print(f"Repository: {TEST_REPO}")
        print(f"Branch: {TEST_BRANCH}")
        print(f"Files to import: {', '.join(TEST_FILES) if TEST_FILES else 'All files'}")
        
        print("\n🚀 Starting import process...")
        import_result = await bridge.handle_import_github(import_data)
        
        if not import_result.get('success'):
            print(f"\n❌ Import failed: {import_result.get('error')}")
            if 'details' in import_result:
                print("\n📋 Error Details:")
                print(json.dumps(import_result.get('details'), indent=2, default=str))
            return False
        
        # Print import success details
        print("\n✅ Import Successful!")
        print(f"• Files imported: {import_result.get('data', {}).get('files_imported', 0)}")
        print(f"• Repository ID: {import_result.get('data', {}).get('repository_id')}")
        print(f"• Data types: {', '.join(import_result.get('data', {}).get('data_types', []))}")
        
        # Step 2: Test chat with the imported context
        repository_id = import_result.get('data', {}).get('repository_id')
        if not repository_id:
            print("\n❌ No repository ID found in import result")
            return False
        
        print_section("💬 Testing Chat with Imported Context")
        
        # Test queries with different aspects to verify RAG pipeline
        test_queries = [
            {
                "question": "What is the main purpose of this repository?",
                "description": "Testing repository understanding"
            },
            {
                "question": "What version of the package is this?",
                "description": "Testing version information retrieval"
            },
            {
                "question": "What are the main components or modules in this project?",
                "description": "Testing module/component understanding"
            },
            {
                "question": "How do I install this package?",
                "description": "Testing installation instructions retrieval"
            }
        ]
        
        for i, test_case in enumerate(test_queries, 1):
            query = test_case["question"]
            print(f"\n🔍 Test {i}/{len(test_queries)}: {test_case['description']}")
            print(f"   💬 Query: {query}")
            
            try:
                chat_result = await bridge.handle_chat({
                    "message": query,
                    "repository_id": repository_id,
                    "branch": TEST_BRANCH,
                    "chat_history": []  # Start with fresh chat history for each query
                })
                
                if chat_result.get('success'):
                    print(f"   ✅ Success!")
                    print(f"   🤖 Response: {chat_result.get('data', {}).get('answer', 'No response')[:200]}...")
                    
                    # Show sources if available
                    sources = chat_result.get('data', {}).get('sources', [])
                    if sources:
                        print(f"\n   📚 Sources (Top 3):")
                        for j, source in enumerate(sources[:3], 1):
                            print(f"      {j}. {source}")
                else:
                    print(f"   ❌ Chat failed: {chat_result.get('error', 'Unknown error')}")
                    if 'details' in chat_result:
                        print(f"      Details: {json.dumps(chat_result.get('details'), indent=6, default=str)}")
                        
            except Exception as e:
                print(f"   ⚠️  Error during chat: {str(e)}")
                import traceback
                traceback.print_exc()
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(test_github_import())
