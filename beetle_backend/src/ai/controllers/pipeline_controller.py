import asyncio
import time
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

from models.document import (
    RawDocument, NormalizedDocument, EmbeddedDocument,
    SearchQuery, SearchResult, ChatRequest, ChatResponse
)
from agents.github_fetcher import GitHubFetcher, GitHubFetcherConfig
from agents.web_scraper import WebScraper, WebScraperConfig
from agents.format_agent import FormatAgent, FormatAgentConfig
from agents.embedding_agent import EmbeddingAgent, EmbeddingAgentConfig
from agents.retrieval_agent import RetrievalAgent, RetrievalAgentConfig
from agents.prompt_rewriter import PromptRewriter, PromptRewriterConfig
from agents.answering_agent import AnsweringAgent, AnsweringAgentConfig


class PipelineStage(str, Enum):
    INGESTION = "ingestion"
    NORMALIZATION = "normalization"
    EMBEDDING = "embedding"
    RETRIEVAL = "retrieval"
    PROMPT_REWRITING = "prompt_rewriting"
    ANSWERING = "answering"


@dataclass
class PipelineConfig:
    """Configuration for the AI pipeline"""
    # GitHub configuration
    github_token: str
    
    # Web scraping configuration
    web_scraper_config: WebScraperConfig
    
    # Format agent configuration
    format_config: FormatAgentConfig
    
    # Embedding configuration
    embedding_config: EmbeddingAgentConfig
    
    # Retrieval configuration
    retrieval_config: RetrievalAgentConfig
    
    # Prompt rewriting configuration
    prompt_rewriter_config: PromptRewriterConfig
    
    # Answering configuration
    answering_config: AnsweringAgentConfig
    
    # Pipeline settings
    enable_logging: bool = True
    parallel_processing: bool = True
    max_concurrent_agents: int = 3


@dataclass
class PipelineResult:
    """Result from pipeline execution"""
    success: bool
    stage: PipelineStage
    data: Any
    error_message: Optional[str] = None
    processing_time: float = 0.0
    metadata: Dict[str, Any] = None


class PipelineController:
    """Controller for orchestrating the AI pipeline"""
    
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.agents = {}
        self.initialize_agents()
    
    def initialize_agents(self):
        """Initialize all agents"""
        # GitHub fetcher
        github_config = GitHubFetcherConfig(
            name="github_fetcher",
            github_token=self.config.github_token
        )
        self.agents['github_fetcher'] = GitHubFetcher(github_config)
        
        # Web scraper
        self.agents['web_scraper'] = WebScraper(self.config.web_scraper_config)
        
        # Format agent
        self.agents['format_agent'] = FormatAgent(self.config.format_config)
        
        # Embedding agent
        self.agents['embedding_agent'] = EmbeddingAgent(self.config.embedding_config)
        
        # Retrieval agent
        self.agents['retrieval_agent'] = RetrievalAgent(self.config.retrieval_config)
        
        # Prompt rewriter
        self.agents['prompt_rewriter'] = PromptRewriter(self.config.prompt_rewriter_config)
        
        # Answering agent
        self.agents['answering_agent'] = AnsweringAgent(self.config.answering_config)
    
    async def run_ingestion_pipeline(self, ingestion_data: Dict[str, Any], github_token: str = None) -> PipelineResult:
        """Run the ingestion pipeline (GitHub + Web scraping)"""
        start_time = time.time()
        
        try:
            raw_documents = []
            
            # GitHub ingestion
            if 'github' in ingestion_data:
                # Create a new GitHub fetcher with the provided token if available
                if github_token:
                    github_config = GitHubFetcherConfig(
                        name="github_fetcher",
                        github_token=github_token
                    )
                    github_fetcher = GitHubFetcher(github_config)
                    github_result = github_fetcher.run(ingestion_data['github'])
                else:
                    github_result = self.agents['github_fetcher'].run(ingestion_data['github'])
                
                if github_result.success:
                    raw_documents.extend(github_result.data)
                else:
                    print(f"GitHub ingestion failed: {github_result.error_message}")
            
            # Web scraping
            if 'web' in ingestion_data:
                web_result = self.agents['web_scraper'].run(ingestion_data['web'])
                if web_result.success:
                    raw_documents.extend(web_result.data)
                else:
                    print(f"Web scraping failed: {web_result.error_message}")
            
            processing_time = time.time() - start_time
            
            return PipelineResult(
                success=len(raw_documents) > 0,
                stage=PipelineStage.INGESTION,
                data=raw_documents,
                processing_time=processing_time,
                metadata={
                    'documents_count': len(raw_documents),
                    'github_success': 'github' in ingestion_data and github_result.success,
                    'web_success': 'web' in ingestion_data and web_result.success
                }
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            return PipelineResult(
                success=False,
                stage=PipelineStage.INGESTION,
                data=[],
                error_message=str(e),
                processing_time=processing_time
            )
    
    async def run_normalization_pipeline(self, raw_documents: List[RawDocument]) -> PipelineResult:
        """Run the normalization pipeline"""
        start_time = time.time()
        
        try:
            format_result = self.agents['format_agent'].run(raw_documents)
            
            processing_time = time.time() - start_time
            
            return PipelineResult(
                success=format_result.success,
                stage=PipelineStage.NORMALIZATION,
                data=format_result.data,
                error_message=format_result.error_message,
                processing_time=processing_time,
                metadata=format_result.metadata
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            return PipelineResult(
                success=False,
                stage=PipelineStage.NORMALIZATION,
                data=[],
                error_message=str(e),
                processing_time=processing_time
            )
    
    async def run_embedding_pipeline(self, normalized_documents: List[NormalizedDocument]) -> PipelineResult:
        """Run the embedding pipeline"""
        start_time = time.time()
        
        try:
            embedding_result = self.agents['embedding_agent'].run(normalized_documents)
            
            processing_time = time.time() - start_time
            
            return PipelineResult(
                success=embedding_result.success,
                stage=PipelineStage.EMBEDDING,
                data=embedding_result.data,
                error_message=embedding_result.error_message,
                processing_time=processing_time,
                metadata=embedding_result.metadata
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            return PipelineResult(
                success=False,
                stage=PipelineStage.EMBEDDING,
                data=[],
                error_message=str(e),
                processing_time=processing_time
            )
    
    async def run_search_pipeline(self, search_query: SearchQuery) -> PipelineResult:
        """Run the search pipeline (retrieval only)"""
        start_time = time.time()
        
        try:
            retrieval_result = self.agents['retrieval_agent'].run(search_query)
            
            processing_time = time.time() - start_time
            
            return PipelineResult(
                success=retrieval_result.success,
                stage=PipelineStage.RETRIEVAL,
                data=retrieval_result.data,
                error_message=retrieval_result.error_message,
                processing_time=processing_time,
                metadata=retrieval_result.metadata
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            return PipelineResult(
                success=False,
                stage=PipelineStage.RETRIEVAL,
                data=[],
                error_message=str(e),
                processing_time=processing_time
            )
    
    async def run_chat_pipeline(self, chat_request: ChatRequest) -> PipelineResult:
        """Run the complete chat pipeline (retrieval + prompt rewriting + answering)"""
        start_time = time.time()
        
        try:
            # Step 1: Retrieval
            search_query = SearchQuery(
                query=chat_request.query,
                repository_id=chat_request.repository_id,
                branch=chat_request.branch,
                max_results=10,
                similarity_threshold=0.5
            )
            
            retrieval_result = self.agents['retrieval_agent'].run(search_query)
            if not retrieval_result.success:
                return PipelineResult(
                    success=False,
                    stage=PipelineStage.RETRIEVAL,
                    data=None,
                    error_message=f"Retrieval failed: {retrieval_result.error_message}",
                    processing_time=time.time() - start_time
                )
            
            # Update chat request with retrieved context
            chat_request.context_results = retrieval_result.data
            
            # Step 2: Prompt rewriting
            prompt_result = self.agents['prompt_rewriter'].run(chat_request)
            if not prompt_result.success:
                return PipelineResult(
                    success=False,
                    stage=PipelineStage.PROMPT_REWRITING,
                    data=None,
                    error_message=f"Prompt rewriting failed: {prompt_result.error_message}",
                    processing_time=time.time() - start_time
                )
            
            # Step 3: Answering
            answer_result = self.agents['answering_agent'].run(prompt_result.data)
            if not answer_result.success:
                return PipelineResult(
                    success=False,
                    stage=PipelineStage.ANSWERING,
                    data=None,
                    error_message=f"Answering failed: {answer_result.error_message}",
                    processing_time=time.time() - start_time
                )
            
            processing_time = time.time() - start_time
            
            return PipelineResult(
                success=True,
                stage=PipelineStage.ANSWERING,
                data=answer_result.data,
                processing_time=processing_time,
                metadata={
                    'retrieval_results': len(retrieval_result.data),
                    'prompt_length': prompt_result.data['prompt_length'],
                    'answer_length': len(answer_result.data.answer),
                    'confidence': answer_result.data.confidence,
                    'sources_count': len(answer_result.data.sources)
                }
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            return PipelineResult(
                success=False,
                stage=PipelineStage.ANSWERING,
                data=None,
                error_message=str(e),
                processing_time=processing_time
            )
    
    async def run_full_pipeline(self, ingestion_data: Dict[str, Any], github_token: str = None) -> List[PipelineResult]:
        """Run the full pipeline from ingestion to embedding"""
        results = []
        
        # Step 1: Ingestion
        ingestion_result = await self.run_ingestion_pipeline(ingestion_data, github_token)
        results.append(ingestion_result)
        
        if not ingestion_result.success:
            return results
        
        # Step 2: Normalization
        normalization_result = await self.run_normalization_pipeline(ingestion_result.data)
        results.append(normalization_result)
        
        if not normalization_result.success:
            return results
        
        # Step 3: Embedding
        embedding_result = await self.run_embedding_pipeline(normalization_result.data)
        results.append(embedding_result)
        
        return results
    
    def get_pipeline_status(self) -> Dict[str, Any]:
        """Get status of all agents in the pipeline"""
        status = {}
        
        for agent_name, agent in self.agents.items():
            status[agent_name] = {
                'name': agent.config.name,
                'type': type(agent).__name__,
                'enabled': True
            }
        
        return status
    
    def get_agent(self, agent_name: str):
        """Get a specific agent by name"""
        return self.agents.get(agent_name)
    
    def test_agent(self, agent_name: str, test_data: Any) -> PipelineResult:
        """Test a specific agent"""
        if agent_name not in self.agents:
            return PipelineResult(
                success=False,
                stage=PipelineStage.INGESTION,  # Default stage
                data=None,
                error_message=f"Agent '{agent_name}' not found"
            )
        
        start_time = time.time()
        
        try:
            agent = self.agents[agent_name]
            result = agent.run(test_data)
            
            processing_time = time.time() - start_time
            
            return PipelineResult(
                success=result.success,
                stage=PipelineStage.INGESTION,  # Default stage
                data=result.data,
                error_message=result.error_message,
                processing_time=processing_time,
                metadata=result.metadata
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            return PipelineResult(
                success=False,
                stage=PipelineStage.INGESTION,  # Default stage
                data=None,
                error_message=str(e),
                processing_time=processing_time
            ) 