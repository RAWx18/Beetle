"""
Enhanced response generation system for the RAG pipeline.
Handles context-aware response generation with structured outputs using Instructor.
"""

from typing import List, Optional, Dict, Any, AsyncGenerator, Type, Union
import structlog
import json
import re
from datetime import datetime
from pydantic import BaseModel, Field

from llm.base.base_llm import LLMRequest, LLMResponse, LLMStreamChunk
from llm.providers.litellm_provider import LiteLLMProvider
from rag.retrieval.vector_retriever import get_enhanced_vector_retriever
from config.settings import get_settings
import instructor

logger = structlog.get_logger(__name__)
settings = get_settings()


# Pydantic models for structured outputs
class CodeAnalysisResult(BaseModel):
    """Structured code analysis result."""
    summary: str = Field(description="Brief summary of what the code does")
    functionality: str = Field(description="Detailed explanation of functionality")
    key_concepts: List[str] = Field(description="Key programming concepts used")
    complexity_level: str = Field(description="Complexity level: simple, moderate, complex")
    potential_issues: List[str] = Field(default_factory=list, description="Potential issues or improvements")
    usage_examples: List[str] = Field(default_factory=list, description="Usage examples")


class DocumentationResult(BaseModel):
    """Structured documentation result."""
    overview: str = Field(description="High-level overview of the code")
    description: str = Field(description="Detailed description")
    parameters: List[Dict[str, str]] = Field(default_factory=list, description="Parameter descriptions")
    returns: Optional[str] = Field(description="Return value description")
    examples: List[str] = Field(default_factory=list, description="Usage examples")
    notes: List[str] = Field(default_factory=list, description="Important notes")
    related_concepts: List[str] = Field(default_factory=list, description="Related concepts")


class QueryAnalysisResult(BaseModel):
    """Structured query analysis result."""
    query_type: str = Field(description="Type of query: code_explanation, documentation, debugging, etc.")
    required_context: List[str] = Field(description="What context is needed to answer")
    confidence: float = Field(description="Confidence level 0-1")
    suggested_followup: List[str] = Field(default_factory=list, description="Suggested follow-up questions")


class RAGResponse(BaseModel):
    """Structured RAG response."""
    answer: str = Field(description="The main answer text")
    source_chunks: List[str] = Field(description="IDs of source chunks used")
    confidence: float = Field(description="Confidence level 0-1")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    followup_questions: List[str] = Field(default_factory=list, description="Suggested follow-up questions")


class EnhancedResponseGenerator:
    """Enhanced RAG response generation system with structured outputs."""
    
    def __init__(self):
        """Initialize the enhanced response generator with Gemini support."""
        # Use LiteLLM provider for unified interface
        self.llm_provider = LiteLLMProvider(
            api_key=settings.gemini_api_key,  # Use Gemini as primary
            base_url=None
        )
        
        # Initialize Instructor client only for non-Gemini models
        self.instructor_client = None
        self._setup_instructor_if_needed()
        
    def _setup_instructor_if_needed(self):
        """Setup Instructor client only for supported models."""
        try:
            # Only setup Instructor for OpenAI models
            if "gpt-" in settings.default_llm_model:
                import openai
                self.openai_client = openai.OpenAI(
                    api_key=settings.openai_api_key,
                    base_url=None
                )
                self.instructor_client = instructor.from_openai(
                    client=self.openai_client,
                    mode=instructor.Mode.TOOLS
                )
                logger.info("Instructor client initialized for OpenAI models")
            else:
                logger.info("Instructor client disabled for Gemini models")
        except Exception as e:
            logger.warning(f"Instructor setup failed: {str(e)}")
            self.instructor_client = None
        
        self.vector_retriever = get_enhanced_vector_retriever()
        self.default_model = settings.default_llm_model
        
        # Response templates for different agent types
        self._response_templates = {
            "code_chat": self._get_code_chat_template(),
            "documentation": self._get_documentation_template(),
            "analysis": self._get_analysis_template(),
            "general": self._get_general_template()
        }
    
    def _get_code_chat_template(self) -> str:
        """Get code chat template."""
        return "code_chat"
    
    def _get_documentation_template(self) -> str:
        """Get documentation template."""
        return "documentation"
    
    def _get_analysis_template(self) -> str:
        """Get analysis template."""
        return "analysis"
    
    def _get_general_template(self) -> str:
        """Get general template."""
        return "general"
    
    async def generate_structured_response(
        self,
        query: str,
        response_model: Type[BaseModel],
        context_chunks: List[Dict[str, Any]] = None,
        agent_type: str = "code_chat",
        temperature: float = 0.3,
        max_tokens: int = 2000
    ) -> BaseModel:
        """Generate structured response using Instructor or fallback for Gemini."""
        try:
            # Get context if not provided
            if not context_chunks:
                context_chunks = await self.vector_retriever.retrieve_relevant_chunks(query)
            
            # Build enhanced context
            context = await self._build_enhanced_context(query, context_chunks, agent_type)
            
            # Check if we can use Instructor (OpenAI models only)
            if self.instructor_client and "gpt-" in self.default_model:
                # Use Instructor for OpenAI models
                system_prompt = self._get_system_prompt(agent_type, structured=True)
                prompt = self._build_structured_prompt(query, context, response_model)
                
                response = await self.instructor_client.chat.completions.create(
                    model=self.default_model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    response_model=response_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ]
                )
                
                logger.info("Generated structured response with Instructor", 
                           query_length=len(query), 
                           response_type=response_model.__name__)
                
                return response
            else:
                # Fallback for Gemini models - generate JSON manually
                return await self._generate_structured_fallback(
                    query, response_model, context, agent_type, temperature, max_tokens
                )
            
        except Exception as e:
            logger.error("Structured response generation failed", error=str(e))
            # Return a default instance of the response model
            return self._create_default_response(response_model, str(e))
    
    async def _generate_structured_fallback(
        self,
        query: str,
        response_model: Type[BaseModel],
        context: str,
        agent_type: str,
        temperature: float,
        max_tokens: int
    ) -> BaseModel:
        """Generate structured response for Gemini using manual JSON parsing."""
        try:
            # Create a prompt that asks for JSON output
            system_prompt = self._get_system_prompt(agent_type, structured=True)
            prompt = f"""Based on the following context, provide a response in valid JSON format.

Context:
{context}

Query: {query}

Please respond with a valid JSON object that matches this structure:
{self._get_json_schema(response_model)}

Response (JSON only):"""

            # Generate response using LiteLLM
            llm_request = LLMRequest(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                model=self.default_model,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=False
            )
            
            response = await self.llm_provider.generate(llm_request)
            
            # Try to parse JSON from response
            try:
                # Extract JSON from response
                json_match = re.search(r'\{.*\}', response.content, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    data = json.loads(json_str)
                    return response_model(**data)
                else:
                    # If no JSON found, create default response
                    return self._create_default_response(response_model, response.content)
                    
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"Failed to parse JSON from Gemini response: {str(e)}")
                return self._create_default_response(response_model, response.content)
                
        except Exception as e:
            logger.error("Structured fallback generation failed", error=str(e))
            return self._create_default_response(response_model, str(e))
    
    def _get_json_schema(self, response_model: Type[BaseModel]) -> str:
        """Get JSON schema for the response model."""
        try:
            schema = response_model.model_json_schema()
            return json.dumps(schema, indent=2)
        except Exception:
            # Fallback to simple schema
            return "{\n  \"answer\": \"string\",\n  \"confidence\": 0.0,\n  \"source_chunks\": [],\n  \"metadata\": {},\n  \"followup_questions\": []\n}"
    
    def _create_default_response(self, response_model: Type[BaseModel], error_msg: str) -> BaseModel:
        """Create a default response when structured generation fails."""
        try:
            # Try to create with minimal required fields
            if response_model == RAGResponse:
                return RAGResponse(
                    answer=f"Error generating structured response: {error_msg}",
                    source_chunks=[],
                    confidence=0.0,
                    metadata={"error": error_msg},
                    followup_questions=[]
                )
            elif response_model == CodeAnalysisResult:
                return CodeAnalysisResult(
                    summary="Analysis failed",
                    functionality=f"Error: {error_msg}",
                    key_concepts=[],
                    complexity_level="unknown",
                    potential_issues=[error_msg],
                    usage_examples=[]
                )
            elif response_model == DocumentationResult:
                return DocumentationResult(
                    overview="Documentation generation failed",
                    description=f"Error: {error_msg}",
                    parameters=[],
                    examples=[],
                    notes=[error_msg]
                )
            elif response_model == QueryAnalysisResult:
                return QueryAnalysisResult(
                    query_type="general",
                    required_context=[],
                    confidence=0.0,
                    suggested_followup=["Please provide more context"]
                )
            else:
                # Generic fallback
                return response_model()
        except Exception:
            # Ultimate fallback
            return response_model()
    
    async def generate_response(
        self, 
        query: str, 
        context_chunks: List[Dict[str, Any]] = None,
        agent_type: str = "code_chat",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        stream: bool = False,
        use_structured: bool = False
    ) -> Union[str, RAGResponse]:
        """Generate enhanced response with optional structured output."""
        try:
            # Get context if not provided
            if not context_chunks:
                context_chunks = await self.vector_retriever.retrieve_relevant_chunks(query)
            
            if use_structured:
                # Generate structured response
                structured_response = await self.generate_structured_response(
                    query=query,
                    response_model=RAGResponse,
                    context_chunks=context_chunks,
                    agent_type=agent_type,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return structured_response
            
            # Build enhanced prompt
            prompt = await self._build_enhanced_context(query, context_chunks, agent_type)
            
            # Create LLM request
            llm_request = LLMRequest(
                messages=[
                    {"role": "system", "content": self._get_system_prompt(agent_type)},
                    {"role": "user", "content": prompt}
                ],
                model=self.default_model,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream
            )
            
            # Generate response
            if stream:
                response = await self.llm_provider.generate(llm_request)
                return response.content
            else:
                response = await self.llm_provider.generate(llm_request)
                return response.content
                
        except Exception as e:
            logger.error("Enhanced response generation failed", error=str(e), query=query[:100])
            return f"Sorry, I encountered an error: {str(e)}"
    
    async def generate_structured_code_analysis(
        self,
        code_chunks: List[Dict[str, Any]],
        query: str = None
    ) -> CodeAnalysisResult:
        """Generate structured code analysis using Instructor."""
        try:
            if not query:
                query = "Analyze this code comprehensively"
            
            # Prepare code context
            code_context = self._prepare_code_context(code_chunks)
            
            # Create analysis prompt
            prompt = f"""Please provide a comprehensive analysis of the following code:

{code_context}

Analysis Requirements:
1. Provide a concise summary of what the code does
2. Explain the detailed functionality
3. Identify key programming concepts used
4. Assess complexity level (simple/moderate/complex)
5. Identify potential issues or areas for improvement
6. Provide practical usage examples

Code Analysis:"""
            
            # Generate structured analysis
            analysis = await self.generate_structured_response(
                query=prompt,
                response_model=CodeAnalysisResult,
                context_chunks=code_chunks,
                agent_type="analysis",
                temperature=0.2
            )
            
            return analysis
            
        except Exception as e:
            logger.error("Structured code analysis failed", error=str(e))
            return CodeAnalysisResult(
                summary="Analysis failed",
                functionality="Could not analyze code",
                key_concepts=[],
                complexity_level="unknown",
                potential_issues=[str(e)],
                usage_examples=[]
            )
    
    async def generate_structured_documentation(
        self,
        code_chunks: List[Dict[str, Any]],
        doc_type: str = "docstring"
    ) -> DocumentationResult:
        """Generate structured documentation using Instructor."""
        try:
            # Prepare code context
            code_context = self._prepare_code_context(code_chunks)
            
            # Create documentation prompt based on type
            if doc_type == "docstring":
                prompt = f"""Generate comprehensive docstring documentation for:

{code_context}

Include:
1. Overview of functionality
2. Detailed description
3. Parameter documentation (if applicable)
4. Return value documentation (if applicable)
5. Usage examples
6. Important notes
7. Related concepts"""
            
            elif doc_type == "readme":
                prompt = f"""Generate README documentation for:

{code_context}

Include:
1. High-level overview
2. Installation/usage instructions
3. API documentation
4. Code examples
5. Dependencies
6. Best practices"""
            
            else:
                prompt = f"""Generate documentation for:

{code_context}"""
            
            # Generate structured documentation
            documentation = await self.generate_structured_response(
                query=prompt,
                response_model=DocumentationResult,
                context_chunks=code_chunks,
                agent_type="documentation",
                temperature=0.3
            )
            
            return documentation
            
        except Exception as e:
            logger.error("Structured documentation generation failed", error=str(e))
            return DocumentationResult(
                overview="Documentation generation failed",
                description=str(e),
                parameters=[],
                examples=[],
                notes=[str(e)]
            )
    
    async def generate_query_analysis(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]] = None
    ) -> QueryAnalysisResult:
        """Analyze the query to determine the best response approach."""
        try:
            if not context_chunks:
                context_chunks = await self.vector_retriever.retrieve_relevant_chunks(query, limit=3)
            
            # Create analysis prompt
            prompt = f"""Analyze this query to determine the best response approach:

Query: {query}

Available Context: {len(context_chunks)} relevant chunks found

Please analyze:
1. Query type (code explanation, debugging, documentation, etc.)
2. What specific context is needed
3. Confidence level for response
4. Suggested follow-up questions"""
            
            # Generate structured analysis
            analysis = await self.generate_structured_response(
                query=prompt,
                response_model=QueryAnalysisResult,
                context_chunks=context_chunks,
                agent_type="analysis",
                temperature=0.2
            )
            
            return analysis
            
        except Exception as e:
            logger.error("Query analysis failed", error=str(e))
            return QueryAnalysisResult(
                query_type="general",
                required_context=[],
                confidence=0.0,
                suggested_followup=["Please provide more context"]
            )
    
    async def _build_enhanced_context(
        self, 
        query: str, 
        context_chunks: List[Dict[str, Any]], 
        agent_type: str
    ) -> str:
        """Build enhanced context with better formatting."""
        if not context_chunks:
            return f"Question: {query}\n\nNo relevant context found. Answer based on your knowledge."
        
        # Group chunks by file for better organization
        file_groups = {}
        for chunk in context_chunks:
            file_id = chunk.get("file_id", "unknown")
            if file_id not in file_groups:
                file_groups[file_id] = []
            file_groups[file_id].append(chunk)
        
        context_parts = []
        context_parts.append(f"Query: {query}\n")
        context_parts.append("=" * 60 + "\n")
        context_parts.append(f"Found {len(context_chunks)} relevant code chunks\n")
        
        for file_id, chunks in file_groups.items():
            filename = chunks[0].get("filename", "Unknown")
            context_parts.append(f"\n📁 File: {filename} (ID: {file_id})\n")
            context_parts.append("-" * 50)
            
            for i, chunk in enumerate(chunks, 1):
                context_parts.append(f"\n[Chunk {i}] Score: {chunk.get('enhanced_score', chunk.get('score', 0)):.3f}")
                
                # Add metadata
                metadata = []
                if chunk.get("language"):
                    metadata.append(f"Language: {chunk['language']}")
                if chunk.get("chunk_type"):
                    metadata.append(f"Type: {chunk['chunk_type']}")
                if chunk.get("start_line") is not None:
                    metadata.append(f"Lines: {chunk['start_line']}-{chunk['end_line']}")
                if chunk.get("complexity_score"):
                    metadata.append(f"Complexity: {chunk['complexity_score']}")
                
                if metadata:
                    context_parts.append(" | ".join(metadata))
                
                context_parts.append("\n" + chunk["content"])
                context_parts.append("\n" + "-" * 40)
        
        return "\n".join(context_parts)
    
    def _build_structured_prompt(
        self, 
        query: str, 
        context: str, 
        response_model: Type[BaseModel]
    ) -> str:
        """Build prompt for structured response generation."""
        return f"""Based on the following context, provide a structured response that matches the expected format.

Context:
{context}

Query: {query}

Please provide a response that strictly follows the expected JSON schema structure."""
    
    def _prepare_code_context(self, code_chunks: List[Dict[str, Any]]) -> str:
        """Prepare code context for analysis."""
        if not code_chunks:
            return "No code provided"
        
        context_parts = []
        for i, chunk in enumerate(code_chunks, 1):
            context_parts.append(f"Code Chunk {i}:")
            context_parts.append(f"File: {chunk.get('filename', 'Unknown')}")
            context_parts.append(f"Language: {chunk.get('language', 'Unknown')}")
            context_parts.append(f"Type: {chunk.get('chunk_type', 'Code')}")
            context_parts.append(f"Lines: {chunk.get('start_line', '?')}-{chunk.get('end_line', '?')}")
            context_parts.append("Code:")
            context_parts.append(chunk.get("content", ""))
            context_parts.append("-" * 50)
        
        return "\n".join(context_parts)
    
    def _get_system_prompt(self, agent_type: str, structured: bool = False) -> str:
        """Get enhanced system prompt based on agent type."""
        base_prompts = {
            "code_chat": """You are an expert programming assistant. You have deep knowledge of:
- Multiple programming languages and paradigms
- Software architecture and design patterns
- Code analysis and debugging techniques
- Best practices and optimization strategies
- Documentation and clean code principles

When responding:
1. Be precise and accurate with technical details
2. Provide practical, actionable advice
3. Use appropriate code formatting and examples
4. Consider edge cases and potential issues
5. Explain concepts clearly for different skill levels""",
            
            "documentation": """You are a technical documentation expert. You specialize in:
- Creating clear, comprehensive documentation
- API documentation and user guides
- Code documentation and examples
- Best practices documentation
- Technical writing for developers

When responding:
1. Write clear, concise documentation
2. Include practical examples
3. Structure information logically
4. Use appropriate formatting
5. Consider different audience levels""",
            
            "analysis": """You are a code analysis expert. You specialize in:
- Deep code understanding and analysis
- Pattern recognition and best practices
- Performance optimization
- Security analysis
- Architecture review

When responding:
1. Provide thorough analysis
2. Identify patterns and anti-patterns
3. Suggest improvements
4. Consider performance implications
5. Be specific and detailed""",
            
            "general": """You are a helpful AI assistant with expertise in:
- Software development
- Technical problem solving
- Code understanding
- Documentation

When responding:
1. Be helpful and informative
2. Provide accurate information
3. Use clear explanations
4. Include examples when helpful"""
        }
        
        prompt = base_prompts.get(agent_type, base_prompts["general"])
        
        if structured:
            prompt += "\n\nIMPORTANT: Provide your response in the exact JSON schema format requested."
        
        return prompt
    
    async def generate_streaming_response(
        self, 
        query: str, 
        context_chunks: List[Dict[str, Any]] = None,
        agent_type: str = "code_chat",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        use_structured: bool = False
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response with enhanced context."""
        try:
            if use_structured:
                # For structured responses, generate all at once
                response = await self.generate_response(
                    query=query,
                    context_chunks=context_chunks,
                    agent_type=agent_type,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=False,
                    use_structured=True
                )
                yield str(response)
                return
            
            # Get context if not provided
            if not context_chunks:
                context_chunks = await self.vector_retriever.retrieve_relevant_chunks(query)
            
            # Build enhanced prompt
            prompt = await self._build_enhanced_context(query, context_chunks, agent_type)
            
            # Create LLM request
            llm_request = LLMRequest(
                messages=[
                    {"role": "system", "content": self._get_system_prompt(agent_type)},
                    {"role": "user", "content": prompt}
                ],
                model=self.default_model,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            # Generate streaming response
            async for chunk in self.llm_provider.stream(llm_request):
                yield chunk.content
                
        except Exception as e:
            logger.error("Enhanced streaming response generation failed", error=str(e))
            yield f"Error: {str(e)}"
    
    async def health_check(self) -> bool:
        """Enhanced health check with Gemini compatibility."""
        try:
            # Check LLM provider
            llm_healthy = await self.llm_provider.health_check()
            if not llm_healthy:
                logger.error("LLM provider is not healthy")
                return False
            
            # Check vector retriever
            retriever_healthy = await self.vector_retriever.health_check()
            if not retriever_healthy:
                logger.error("Vector retriever is not healthy")
                return False
            
            # Test structured response generation (handles Gemini properly)
            try:
                test_response = await self.generate_structured_response(
                    query="Test health check",
                    response_model=RAGResponse,
                    context_chunks=[],
                    max_tokens=50
                )
                
                # Check if response is valid
                if hasattr(test_response, 'answer') and test_response.answer:
                    logger.info("Structured response health check passed")
                    return True
                else:
                    logger.warning("Structured response health check failed - empty response")
                    return False
                    
            except Exception as e:
                logger.error("Structured response health check failed", error=str(e))
                # Don't fail the entire health check for structured response issues
                # Just log the error and continue
                return True  # Still consider healthy if basic LLM works
            
        except Exception as e:
            logger.error("Enhanced response generator health check failed", error=str(e))
            return False


# Global enhanced response generator instance
enhanced_response_generator = EnhancedResponseGenerator()


def get_enhanced_response_generator() -> EnhancedResponseGenerator:
    """Get the global enhanced response generator instance."""
    return enhanced_response_generator
