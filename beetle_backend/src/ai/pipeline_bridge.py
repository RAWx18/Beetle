#!/usr/bin/env python3
"""
Bridge script to connect Node.js requests to the Python multi-agent pipeline
"""

# Suppress TensorFlow logging and oneDNN warnings
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # 0=INFO, 1=WARNING, 2=ERROR, 3=FATAL
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN optimizations

import sys
import json
import asyncio
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(stream=sys.stdout),
        logging.FileHandler('pipeline.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# Suppress TensorFlow and other library logs
logging.getLogger('tensorflow').setLevel(logging.ERROR)
logging.getLogger('transformers').setLevel(logging.ERROR)
logging.getLogger('urllib3').setLevel(logging.ERROR)

# Add the AI module to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from controllers.pipeline_controller import PipelineController, PipelineConfig
from agents.github_fetcher import GitHubFetcherConfig
from agents.web_scraper import WebScraperConfig
from agents.format_agent import FormatAgentConfig
from agents.embedding_agent import EmbeddingAgentConfig
from agents.retrieval_agent import RetrievalAgentConfig
from agents.prompt_rewriter import PromptRewriterConfig
from agents.answering_agent import AnsweringAgentConfig
from models.document import (
    RawDocument, NormalizedDocument, SearchQuery, 
    ChatRequest, SourceType, DocumentStatus
)


class PipelineBridge:
    """Bridge between Node.js and Python multi-agent pipeline"""
    
    def __init__(self):
        self.pipeline = None
        self.initialized = False
        self.error = None
        self.initialize_pipeline()
    
    def initialize_pipeline(self):
        """
        Initialize the multi-agent pipeline with comprehensive error handling and logging.
        Sets the initialized flag and error state appropriately.
        """
        try:
            logger.info("🚀 Starting multi-agent pipeline initialization...")
            
            # Configure Qdrant Cloud connection
            qdrant_url = os.getenv('QDRANT_URL')
            qdrant_api_key = os.getenv('QDRANT_API_KEY')
            
            if not qdrant_url or not qdrant_api_key:
                error_msg = "QDRANT_URL and QDRANT_API_KEY environment variables are required"
                logger.error(error_msg)
                self.error = error_msg
                return
                
            logger.info(f"🔌 Connecting to Qdrant Cloud at {qdrant_url}")
            
            # Validate required environment variables
            required_env_vars = ['QDRANT_URL', 'QDRANT_API_KEY']
            missing_vars = [var for var in required_env_vars if not os.getenv(var)]
            
            if missing_vars:
                error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
                logger.error(error_msg)
                self.error = error_msg
                return
            
            try:
                logger.info("🛠️  Creating pipeline configuration...")
                # Get configuration from environment variables
                config = PipelineConfig(
                    github_token=os.getenv('GITHUB_TOKEN', ''),  # Optional GitHub token
                    web_scraper_config=WebScraperConfig(
                        name="web_scraper",
                        max_retries=3,
                        timeout=30,
                        user_agent="Beetle-AI/1.0"
                    ),
                    format_config=FormatAgentConfig(
                        name="format_agent",
                        max_content_length=10000,
                        supported_languages=['en', 'python', 'javascript', 'typescript', 'markdown']
                    ),
                    embedding_config=EmbeddingAgentConfig(
                        name="embedding_agent",
                        model_name="sentence-transformers/all-MiniLM-L6-v2",
                        qdrant_url=qdrant_url,
                        qdrant_api_key=qdrant_api_key,
                        collection_name="documents"
                    ),
                    retrieval_config=RetrievalAgentConfig(
                        name="retrieval_agent",
                        model_name="sentence-transformers/all-MiniLM-L6-v2",
                        qdrant_url=qdrant_url,
                        qdrant_api_key=qdrant_api_key,
                        collection_name="documents"
                    ),
                    prompt_rewriter_config=PromptRewriterConfig(
                        name="prompt_rewriter",
                        model_name="gpt-3.5-turbo",
                        temperature=0.7
                    ),
                    answering_config=AnsweringAgentConfig(
                        name="answering_agent",
                        api_key=os.getenv('GEMINI_API_KEY', ''),  # Required for Gemini
                        model_name=os.getenv('GEMINI_MODEL', 'gemini-2.0-flash'),
                        temperature=float(os.getenv('GEMINI_TEMPERATURE', '0.7')),
                        max_tokens=int(os.getenv('GEMINI_MAX_TOKENS', '1000'))
                    )
                )
                
                logger.info("✅ Configuration created successfully")
                
                # Initialize the pipeline
                logger.info("🔄 Initializing pipeline controller...")
                self.pipeline = PipelineController(config)
                
                # Test the pipeline
                logger.info("🧪 Testing pipeline components...")
                # Add any necessary test calls here
                
                self.initialized = True
                self.error = None
                logger.info("🚀 Pipeline initialized successfully")
                
            except ImportError as ie:
                error_msg = f"Failed to import required module: {str(ie)}"
                logger.error(error_msg, exc_info=True)
                self.error = error_msg
                raise RuntimeError(error_msg) from ie
                
            except Exception as e:
                error_msg = f"Failed to initialize pipeline: {str(e)}"
                logger.error(error_msg, exc_info=True)
                self.error = error_msg
                raise RuntimeError(error_msg) from e
                
        except Exception as e:
            error_msg = f"Critical error during pipeline initialization: {str(e)}"
            logger.critical(error_msg, exc_info=True)
            self.error = error_msg
            self.initialized = False
            raise RuntimeError(error_msg) from e
    
    async def handle_import(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle file import and embedding"""
        try:
            repository_id = data.get('repository_id', 'default')
            branch = data.get('branch', 'main')
            source_type = data.get('source_type', 'file')
            files = data.get('files', [])
            
            # Create raw documents from uploaded files
            raw_documents = []
            for file_info in files:
                file_path = file_info['path']
                
                # Read file content
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Create raw document
                raw_doc = RawDocument(
                    id=f"{repository_id}_{branch}_{Path(file_path).name}",
                    source_type=SourceType.FILE,
                    source_url=file_path,
                    title=file_info['originalName'],
                    content=content,
                    metadata={
                        'repository_id': repository_id,
                        'branch': branch,
                        'file_size': file_info['size'],
                        'mime_type': file_info['mimetype']
                    }
                )
                raw_documents.append(raw_doc)
            
            if not raw_documents:
                return {
                    'success': False,
                    'error': 'No valid files to process'
                }
            
            # Run the full pipeline: normalization -> embedding
            norm_result = await self.pipeline.run_normalization_pipeline(raw_documents)
            if not norm_result.success:
                return {
                    'success': False,
                    'error': f'Normalization failed: {norm_result.error_message}'
                }
            
            embed_result = await self.pipeline.run_embedding_pipeline(norm_result.data)
            if not embed_result.success:
                return {
                    'success': False,
                    'error': f'Embedding failed: {embed_result.error_message}'
                }
            
            return {
                'success': True,
                'data': {
                    'documents_processed': len(raw_documents),
                    'documents_embedded': len(embed_result.data),
                    'repository_id': repository_id,
                    'branch': branch
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def handle_import_github(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle GitHub data import including file imports with RAG integration.
        
        Args:
            data: Dictionary containing:
                - repository: GitHub repository in format 'owner/repo'
                - repository_id: Unique ID for the repository
                - branch: Branch name (default: 'main')
                - github_token: GitHub access token with 'repo' scope
                - files: List of files to import with their paths and branches
                - source_type: Source type (default: 'github')
                
        Returns:
            Dictionary with import results including success status and details
        """
        try:
            # Extract and validate input parameters
            repository = data.get('repository', '')
            repository_id = data.get('repository_id', '')
            branch = data.get('branch', 'main')
            files_to_import = data.get('files', [])
            github_token = data.get('github_token')
            source_type = data.get('source_type', 'github')
            
            # Validate required fields
            if not github_token:
                return {
                    'success': False,
                    'error': 'GitHub token is required',
                    'details': 'No GitHub token provided in the request',
                    'status_code': 400
                }
                
            if not repository and not repository_id:
                return {
                    'success': False,
                    'error': 'Repository name or ID is required',
                    'details': 'Either repository or repository_id must be provided',
                    'status_code': 400
                }
                
            # Generate repository ID if not provided
            if not repository_id and repository:
                repository_id = repository.replace('/', '_').lower()
            elif not repository_id:
                repository_id = f"repo_{hash(repository) % 1000000}"
            
            # Validate files to import
            if not isinstance(files_to_import, list):
                return {
                    'success': False,
                    'error': 'Invalid files format',
                    'details': 'Files must be provided as a list of objects with path and branch',
                    'status_code': 400
                }
            
            # Prepare GitHub fetcher configuration
            github_config = GitHubFetcherConfig(
                name="github_fetcher",
                repository=repository,
                branch=branch,
                data_types=['files'],  # We're only handling file imports here
                max_items=len(files_to_import) if files_to_import else 100,
                file_extensions=['.py', '.js', '.ts', '.jsx', '.tsx', '.md', '.txt', '.json', '.yaml', '.yml'],
                exclude_dirs=['node_modules', '__pycache__', '.git', 'venv', '.github', '.idea'],
                max_file_size=5 * 1024 * 1024,  # 5MB
                include_files=[f.get('path') for f in files_to_import if f.get('path')] if files_to_import else None
            )
            
            # Prepare ingestion data for the pipeline
            ingestion_data = {
                'github': {
                    'repository': repository,
                    'repository_id': repository_id,
                    'branch': branch,
                    'data_types': ['files'],  # Only process files
                    'files': files_to_import,
                    'max_items': len(files_to_import) if files_to_import else 100,
                    'config': github_config.dict()
                },
                'source_type': source_type,
                'metadata': {
                    'imported_at': str(datetime.utcnow().isoformat()),
                    'imported_by': 'github_import_endpoint',
                    'file_count': len(files_to_import)
                }
            }
            
            print(f"\n🚀 Starting GitHub import for {repository or repository_id}")
            print(f"📌 Branch: {branch}")
            print(f"📂 Files to import: {len(files_to_import)}")
            if files_to_import:
                print("🔍 Selected files:")
                for i, file_info in enumerate(files_to_import[:5], 1):
                    print(f"   {i}. {file_info.get('path')} (branch: {file_info.get('branch', branch)})")
                if len(files_to_import) > 5:
                    print(f"   ... and {len(files_to_import) - 5} more files")
            
            # Run the full pipeline with the token
            print("\n🔄 Processing files through RAG pipeline...")
            start_time = time.time()
            results = await self.pipeline.run_full_pipeline(ingestion_data, github_token)
            processing_time = time.time() - start_time
            
            # Process results
            success = all(result.success for result in results) if results else False
            files_processed = 0
            chunks_generated = 0
            errors = []
            
            # Collect results and errors
            if results:
                for result in results:
                    if not result.success:
                        errors.append(getattr(result, 'error_message', 'Unknown error'))
                    if hasattr(result, 'data'):
                        files_processed += result.data.get('documents_processed', 0)
                        chunks_generated += result.data.get('chunks_generated', 0)
            
            # Prepare response data
            response_data = {
                'repository': repository,
                'repository_id': repository_id,
                'branch': branch,
                'source_type': source_type,
                'timestamp': datetime.utcnow().isoformat(),
                'processing_time_seconds': round(processing_time, 2),
                'files': {
                    'requested': len(files_to_import),
                    'processed': files_processed,
                    'chunks_generated': chunks_generated
                },
                'metadata': {
                    'pipeline_version': '1.0.0',
                    'imported_by': 'github_import_endpoint',
                    'environment': os.getenv('NODE_ENV', 'development')
                }
            }
            
            if success:
                # Successful import response
                print(f"\n✅ Successfully processed {files_processed} files in {processing_time:.2f}s")
                if chunks_generated > 0:
                    print(f"📊 Generated {chunks_generated} chunks for RAG")
                
                return {
                    'success': True,
                    'message': f'Successfully imported and processed {files_processed} files from GitHub',
                    'data': response_data
                }
            else:
                # Error response
                error_message = 'Failed to import GitHub data'
                error_details = '\n'.join(errors) if errors else 'Unknown error during processing'
                
                print(f"\n❌ Import failed after {processing_time:.2f}s")
                print(f"Error: {error_message}")
                print(f"Details: {error_details}")
                
                response_data.update({
                    'error': error_message,
                    'details': error_details,
                    'errors': errors
                })
                
                return {
                    'success': False,
                    'error': error_message,
                    'details': error_details,
                    'data': response_data
                }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def handle_chat(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle chat request using multi-agent system"""
        try:
            message = data.get('message')
            repository_id = data.get('repository_id', 'default')
            branch = data.get('branch', 'main')
            context_results = data.get('context_results', [])
            
            if not message:
                return {
                    'success': False,
                    'error': 'Message is required'
                }
            
            # Create search query
            search_query = SearchQuery(
                query=message,
                repository_id=repository_id,
                branch=branch,
                max_results=10,
                similarity_threshold=0.3
            )
            
            # Run search pipeline to get relevant documents
            search_result = await self.pipeline.run_search_pipeline(search_query)
            if not search_result.success:
                return {
                    'success': False,
                    'error': f'Search failed: {search_result.error_message}'
                }
            
            # Create chat request
            chat_request = ChatRequest(
                message=message,
                context_results=search_result.data,
                repository_id=repository_id,
                branch=branch
            )
            
            # Run chat pipeline
            chat_result = await self.pipeline.run_chat_pipeline(chat_request)
            if not chat_result.success:
                return {
                    'success': False,
                    'error': f'Chat failed: {chat_result.error_message}'
                }
            
            return {
                'success': True,
                'data': {
                    'answer': chat_result.data.answer,
                    'sources': [result.title for result in search_result.data],
                    'confidence': chat_result.data.confidence
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def handle_search(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle search request"""
        try:
            query = data.get('query')
            repository_id = data.get('repository_id', 'default')
            branch = data.get('branch', 'main')
            max_results = data.get('max_results', 10)
            similarity_threshold = data.get('similarity_threshold', 0.3)
            
            if not query:
                return {
                    'success': False,
                    'error': 'Query is required'
                }
            
            # Create search query
            search_query = SearchQuery(
                query=query,
                repository_id=repository_id,
                branch=branch,
                max_results=max_results,
                similarity_threshold=similarity_threshold
            )
            
            # Run search pipeline
            search_result = await self.pipeline.run_search_pipeline(search_query)
            if not search_result.success:
                return {
                    'success': False,
                    'error': f'Search failed: {search_result.error_message}'
                }
            
            return {
                'success': True,
                'data': {
                    'results': [
                        {
                            'title': result.title,
                            'content': result.content[:200] + '...' if len(result.content) > 200 else result.content,
                            'source_type': result.source_type.value,
                            'similarity_score': result.similarity_score
                        }
                        for result in search_result.data
                    ],
                    'total_found': len(search_result.data)
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def handle_status(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle status request"""
        try:
            status = self.pipeline.get_pipeline_status()
            return {
                'success': True,
                'data': status
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


async def main():
    """Main function to handle command line requests"""
    if len(sys.argv) != 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python pipeline_bridge.py <endpoint> <json_data>'
        }))
        sys.exit(1)
    
    endpoint = sys.argv[1]
    data = json.loads(sys.argv[2])
    
    try:
        bridge = PipelineBridge()
        
        if endpoint == 'import':
            result = await bridge.handle_import(data)
        elif endpoint == 'import-github':
            result = await bridge.handle_import_github(data)
        elif endpoint == 'chat':
            result = await bridge.handle_chat(data)
        elif endpoint == 'search':
            result = await bridge.handle_search(data)
        elif endpoint == 'status':
            result = await bridge.handle_status(data)
        else:
            result = {
                'success': False,
                'error': f'Unknown endpoint: {endpoint}'
            }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main()) 