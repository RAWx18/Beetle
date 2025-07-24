#!/usr/bin/env python3
"""
Bridge script to connect Node.js requests to the Python multi-agent pipeline
"""

import sys
import json
import asyncio
import os
from pathlib import Path
from typing import Dict, Any, List

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
        self.initialize_pipeline()
    
    def initialize_pipeline(self):
        """Initialize the multi-agent pipeline"""
        try:
            # Get configuration from environment variables
            config = PipelineConfig(
                github_token=os.getenv('GITHUB_TOKEN', ''),
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
                    qdrant_url=os.getenv('QDRANT_URL', 'localhost'),
                    qdrant_port=int(os.getenv('QDRANT_PORT', '6333')),
                    collection_name="documents"
                ),
                retrieval_config=RetrievalAgentConfig(
                    name="retrieval_agent",
                    model_name="sentence-transformers/all-MiniLM-L6-v2",
                    qdrant_url=os.getenv('QDRANT_URL', 'localhost'),
                    qdrant_port=int(os.getenv('QDRANT_PORT', '6333')),
                    collection_name="documents"
                ),
                prompt_rewriter_config=PromptRewriterConfig(
                    name="prompt_rewriter",
                    model_name="gpt-3.5-turbo",
                    api_key=os.getenv('OPENAI_API_KEY', ''),
                    max_tokens=500
                ),
                answering_config=AnsweringAgentConfig(
                    name="answering_agent",
                    api_key=os.getenv('GEMINI_API_KEY', ''),
                    model_name="gemini-2.0-flash"
                )
            )
            
            self.pipeline = PipelineController(config)
            print("Pipeline initialized successfully", file=sys.stderr)
            
        except Exception as e:
            print(f"Error initializing pipeline: {e}", file=sys.stderr)
            raise
    
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
        """Handle GitHub data import including file imports"""
        try:
            repository_id = data.get('repository_id', 'default')
            branch = data.get('branch', 'main')
            data_types = data.get('data_types', [])
            github_token = data.get('github_token')
            files_to_import = data.get('files', [])
            source_type = data.get('source_type', 'github')
            
            if not github_token:
                return {
                    'success': False,
                    'error': 'GitHub token is required'
                }
            
            # Handle file imports if files are specified
            if files_to_import and 'files' not in data_types:
                data_types.append('files')
            
            # Prepare GitHub ingestion data
            ingestion_data = {
                'github': {
                    'repository_id': repository_id,
                    'branch': branch,
                    'data_types': data_types,
                    'max_items': 100,
                    'files': files_to_import if files_to_import else None
                }
            }
            
            # Run the full pipeline with the token
            results = await self.pipeline.run_full_pipeline(ingestion_data, github_token)
            
            # Check if all stages succeeded
            success = all(result.success for result in results)
            
            if success:
                # Collect statistics about the import
                stats = {
                    'repository_id': repository_id,
                    'branch': branch,
                    'data_types': data_types,
                    'stages_completed': len(results),
                    'source_type': source_type
                }
                
                # Add file import stats if applicable
                if files_to_import:
                    stats['files_imported'] = len(files_to_import)
                
                return {
                    'success': True,
                    'data': stats
                }
            else:
                failed_stages = [result.stage for result in results if not result.success]
                return {
                    'success': False,
                    'error': f'Pipeline failed at stages: {failed_stages}'
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