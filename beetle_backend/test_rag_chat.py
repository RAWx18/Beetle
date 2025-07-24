import os
import sys
import json
import asyncio
import aiohttp
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Configuration
JS_BACKEND_URL = os.getenv('JS_BACKEND_URL', 'http://localhost:3000')
PYTHON_BACKEND_URL = os.getenv('PYTHON_BACKEND_URL', 'http://localhost:8000')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
TEST_REPO_PATH = "path/to/your/test/repo"  # Update this with a test repository path

async def test_rag_chat():
    """Test the complete RAG chat flow."""
    session = aiohttp.ClientSession()
    
    try:
        # Step 1: Process test files
        print("\n=== Step 1: Processing test files ===")
        test_files = []
        for root, _, files in os.walk(TEST_REPO_PATH):
            for file in files:
                if file.endswith(('.py', '.md', '.txt')):  # Only process certain file types
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        test_files.append({
                            'path': os.path.relpath(file_path, TEST_REPO_PATH),
                            'content': content,
                            'size': len(content)
                        })
                    except Exception as e:
                        print(f"Error reading {file_path}: {str(e)}")
        
        if not test_files:
            print("No test files found. Please update TEST_REPO_PATH.")
            return
            
        print(f"Found {len(test_files)} test files.")
        
        # Step 2: Send files to backend for processing
        print("\n=== Step 2: Sending files to backend ===")
        process_url = f"{JS_BACKEND_URL}/api/ai/process-repo"
        process_data = {
            "repository": "test-repo",
            "repository_id": "test-repo-123",
            "branch": "main",
            "source_type": "local",
            "files": test_files
        }
        
        async with session.post(process_url, json=process_data) as resp:
            if resp.status != 200:
                print(f"Error processing files: {await resp.text()}")
                return
            
            process_result = await resp.json()
            print(f"Processing result: {json.dumps(process_result, indent=2)}")
            
            if not process_result.get('success'):
                print("Failed to process files")
                return
                
            session_id = process_result.get('session_id')
            if not session_id:
                print("No session ID returned")
                return
                
        # Step 3: Test chat functionality
        print("\n=== Step 3: Testing chat ===")
        chat_url = f"{JS_BACKEND_URL}/api/ai/chat"
        
        test_queries = [
            "What is the main purpose of this codebase?",
            "Can you explain the key components?",
            "Show me an example of how to use the main functionality."
        ]
        
        for query in test_queries:
            print(f"\nSending query: {query}")
            chat_data = {
                "session_id": session_id,
                "message": query
            }
            
            async with session.post(chat_url, json=chat_data) as chat_resp:
                if chat_resp.status != 200:
                    print(f"Chat error: {await chat_resp.text()}")
                    continue
                    
                chat_result = await chat_resp.json()
                print("\nResponse:")
                print(chat_result.get('message', 'No response'))
                
                if 'sources' in chat_result and chat_result['sources']:
                    print("\nSources:")
                    for i, source in enumerate(chat_result['sources'][:3]):  # Show top 3 sources
                        print(f"{i+1}. Score: {source.get('score', 0):.3f}")
                        print(f"   File: {source.get('metadata', {}).get('file_path', 'N/A')}")
                        print(f"   Snippet: {source.get('content', '')[:200]}...")
    
    except Exception as e:
        print(f"Error during test: {str(e)}")
        import traceback
        traceback.print_exc()
        
    finally:
        await session.close()

if __name__ == "__main__":
    if not GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY environment variable is not set")
        sys.exit(1)
        
    if not os.path.exists(TEST_REPO_PATH):
        print(f"Error: Test repository path not found: {TEST_REPO_PATH}")
        print("Please update TEST_REPO_PATH in the script.")
        sys.exit(1)
        
    asyncio.run(test_rag_chat())
