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
from utils.prompt_loader import render_prompt, render_prompt_with_fallback
import instructor

logger = structlog.get_logger(__name__)
settings = get_settings()


# Enhanced Pydantic models for query classification and response generation
class QueryClassification(BaseModel):
    """Query classification result."""
    query_type: str = Field(description="Type of query: casual_conversation, technical_question, code_analysis, debugging, file_specific, documentation, architecture, meta_question, ambiguous")
    response_style: str = Field(description="Response style: conversational, technical, educational, concise, comprehensive")
    confidence: float = Field(description="Confidence level 0-1")
    key_indicators: List[str] = Field(description="Factors that led to this classification")
    suggested_context: List[str] = Field(default_factory=list, description="Additional context that would be helpful")
    followup_questions: List[str] = Field(default_factory=list, description="Clarifying questions if needed")
    user_intent: str = Field(description="Detected user intent")


class ConversationContext(BaseModel):
    """Conversation context information."""
    session_id: str = Field(description="Session identifier")
    conversation_history: List[Dict[str, str]] = Field(default_factory=list, description="Recent conversation messages")
    user_preferences: Dict[str, Any] = Field(default_factory=dict, description="User preferences and settings")
    current_topic: str = Field(default="", description="Current conversation topic")
    context_files: List[str] = Field(default_factory=list, description="Files currently in context")


class ResponseQualityMetrics(BaseModel):
    """Response quality assessment."""
    relevance_score: float = Field(description="How well the response addresses the query (0-1)")
    accuracy_score: float = Field(description="Technical accuracy of the response (0-1)")
    clarity_score: float = Field(description="Clarity and understandability (0-1)")
    completeness_score: float = Field(description="Completeness of the response (0-1)")
    actionability_score: float = Field(description="How actionable the response is (0-1)")
    overall_score: float = Field(description="Overall quality score (0-1)")
    improvement_suggestions: List[str] = Field(default_factory=list, description="Suggestions for improvement")


# Existing models...
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
    """Enhanced RAG response generation system with intelligent query classification and context-aware responses."""
    
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
        
        self.vector_retriever = get_enhanced_vector_retriever()
        self.default_model = settings.default_llm_model
        
        # Query classification cache
        self._classification_cache: Dict[str, QueryClassification] = {}
    
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
            prompt = (
                "Based on the following context, provide a response in valid JSON format.\n\n"
                "Context:\n{}\n\nQuery: {}\n\nPlease respond with a valid JSON object that matches this structure:\n{}\n\nResponse (JSON only):".format(
                    context,
                    query,
                    self._get_json_schema(response_model)
                )
            )

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
    
    async def classify_query(
        self, 
        query: str, 
        conversation_history: List[Dict[str, str]] = None,
        context_files: List[str] = None
    ) -> QueryClassification:
        """Classify user query to determine intent and appropriate response style."""
        try:
            # Check cache first
            cache_key = f"{query}_{hash(str(conversation_history))}_{hash(str(context_files))}"
            if cache_key in self._classification_cache:
                return self._classification_cache[cache_key]
            
            # Prepare context for classification
            context = {
                "query": query,
                "conversation_history": self._format_conversation_history(conversation_history or []),
                "available_files": ", ".join(context_files or [])
            }
            
            # Use query classifier prompt
            classification_prompt = render_prompt("query_classifier.j2", context)
            
            # Generate classification using LLM
            llm_request = LLMRequest(
                    messages=[
                    {"role": "system", "content": "You are an expert at analyzing user queries to determine their intent and appropriate response style."},
                    {"role": "user", "content": classification_prompt}
                ],
                model=self.default_model,
                temperature=0.1,  # Low temperature for consistent classification
                max_tokens=500,
                stream=False
            )
            
            response = await self.llm_provider.generate(llm_request)
            
            # Parse classification from response
            classification = self._parse_classification_response(response.content)
            
            # Cache the result
            self._classification_cache[cache_key] = classification
            
            logger.info("Query classified", 
                       query=query[:50], 
                       classification=classification.query_type,
                       confidence=classification.confidence)
            
            return classification
                
        except Exception as e:
            logger.error("Query classification failed", error=str(e), query=query[:50])
            # Return default classification
            return QueryClassification(
                query_type="ambiguous",
                response_style="conversational",
                confidence=0.0,
                key_indicators=["classification_failed"],
                user_intent="unknown"
            )
    
    def _format_conversation_history(self, history: List[Dict[str, str]]) -> str:
        """Format conversation history for classification."""
        if not history:
            return "No previous conversation"
        
        formatted = []
        for msg in history[-5:]:  # Last 5 messages
            role = msg.get("role", "unknown")
            content = msg.get("content", "")[:100]  # Truncate long messages
            formatted.append(f"{role}: {content}")
        
        return "\n".join(formatted)
    
    def _parse_classification_response(self, response: str) -> QueryClassification:
        """Parse classification response from LLM output with enhanced pattern matching."""
        try:
            # Extract classification from response using regex patterns
            import re
            
            # Default values
            query_type = "ambiguous"
            response_style = "conversational"
            confidence = 0.5
            key_indicators = []
            user_intent = "unknown"
            
            # Enhanced pattern matching for query types
            response_lower = response.lower()
            
            # Casual conversation patterns
            casual_patterns = [
                r"query type:\s*casual_conversation",
                r"casual_conversation",
                r"greeting",
                r"hi\b", r"hello\b", r"hey\b", r"how are you",
                r"good morning", r"good afternoon", r"good evening",
                r"what's up", r"how's it going", r"nice to meet you"
            ]
            
            # Technical question patterns
            technical_patterns = [
                r"query type:\s*technical_question",
                r"technical_question",
                r"how do i", r"what is", r"explain", r"describe",
                r"algorithm", r"data structure", r"design pattern",
                r"framework", r"library", r"api", r"database",
                r"optimization", r"performance", r"scalability"
            ]
            
            # Code analysis patterns
            code_analysis_patterns = [
                r"query type:\s*code_analysis",
                r"code_analysis",
                r"review this code", r"analyze this", r"code review",
                r"what's wrong with", r"how can i improve",
                r"best practices", r"code quality", r"refactoring"
            ]
            
            # Debugging patterns
            debugging_patterns = [
                r"query type:\s*debugging",
                r"debugging",
                r"error", r"bug", r"fix", r"doesn't work",
                r"problem", r"issue", r"troubleshoot",
                r"exception", r"crash", r"fail"
            ]
            
            # File-specific patterns
            file_specific_patterns = [
                r"query type:\s*file_specific",
                r"file_specific",
                r"this file", r"in this file", r"file:", r".py", r".js", r".java",
                r"function", r"class", r"method", r"line \d+"
            ]
            
            # Documentation patterns
            documentation_patterns = [
                r"query type:\s*documentation",
                r"documentation",
                r"document", r"readme", r"comment", r"explain",
                r"write documentation", r"create docs"
            ]
            
            # Architecture patterns
            architecture_patterns = [
                r"query type:\s*architecture",
                r"architecture",
                r"design", r"structure", r"pattern", r"system design",
                r"microservices", r"monolith", r"distributed",
                r"scalable", r"maintainable"
            ]
            
            # Meta question patterns
            meta_patterns = [
                r"query type:\s*meta_question",
                r"meta_question",
                r"what can you do", r"your capabilities", r"how do you work",
                r"system", r"ai", r"assistant", r"yourself"
            ]
            
            # Determine query type based on patterns
            if any(re.search(pattern, response_lower) for pattern in casual_patterns):
                query_type = "casual_conversation"
                response_style = "conversational"
                confidence = 0.9
                key_indicators = ["greeting", "casual_tone", "social_interaction"]
                user_intent = "casual_interaction"
            elif any(re.search(pattern, response_lower) for pattern in technical_patterns):
                query_type = "technical_question"
                response_style = "technical"
                confidence = 0.8
                key_indicators = ["technical_terms", "programming_concepts", "learning_request"]
                user_intent = "technical_help"
            elif any(re.search(pattern, response_lower) for pattern in code_analysis_patterns):
                query_type = "code_analysis"
                response_style = "comprehensive"
                confidence = 0.8
                key_indicators = ["code_review", "analysis_request", "improvement_seeking"]
                user_intent = "code_analysis"
            elif any(re.search(pattern, response_lower) for pattern in debugging_patterns):
                query_type = "debugging"
                response_style = "educational"
                confidence = 0.8
                key_indicators = ["error", "problem", "fix", "troubleshooting"]
                user_intent = "debugging_help"
            elif any(re.search(pattern, response_lower) for pattern in file_specific_patterns):
                query_type = "file_specific"
                response_style = "technical"
                confidence = 0.7
                key_indicators = ["file_reference", "specific_code", "context_aware"]
                user_intent = "file_analysis"
            elif any(re.search(pattern, response_lower) for pattern in documentation_patterns):
                query_type = "documentation"
                response_style = "educational"
                confidence = 0.7
                key_indicators = ["documentation", "explain", "writing_help"]
                user_intent = "documentation_help"
            elif any(re.search(pattern, response_lower) for pattern in architecture_patterns):
                query_type = "architecture"
                response_style = "comprehensive"
                confidence = 0.7
                key_indicators = ["architecture", "design", "structure", "system_design"]
                user_intent = "architecture_help"
            elif any(re.search(pattern, response_lower) for pattern in meta_patterns):
                query_type = "meta_question"
                response_style = "conversational"
                confidence = 0.6
                key_indicators = ["system_question", "meta", "capability_inquiry"]
                user_intent = "system_inquiry"
            
            # Extract confidence from response if available
            confidence_match = re.search(r"confidence:\s*([\d.]+)", response_lower)
            if confidence_match:
                try:
                    extracted_confidence = float(confidence_match.group(1))
                    if 0 <= extracted_confidence <= 1:
                        confidence = extracted_confidence
                except ValueError:
                    pass
            
            # Extract response style from response if available
            style_match = re.search(r"response style:\s*(\w+)", response_lower)
            if style_match:
                extracted_style = style_match.group(1)
                if extracted_style in ["conversational", "technical", "educational", "concise", "comprehensive"]:
                    response_style = extracted_style
            
            return QueryClassification(
                query_type=query_type,
                response_style=response_style,
                confidence=confidence,
                key_indicators=key_indicators,
                user_intent=user_intent
            )
            
        except Exception as e:
            logger.error("Failed to parse classification response", error=str(e))
            return QueryClassification(
                query_type="ambiguous",
                response_style="conversational",
                confidence=0.0,
                key_indicators=["parsing_error"],
                user_intent="unknown"
            )
    
    async def generate_response_with_classification(
        self, 
        query: str, 
        conversation_history: List[Dict[str, str]] = None,
        context_files: List[str] = None,
        context_chunks: List[Dict[str, Any]] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """Generate response with intelligent query classification and context-aware prompting."""
        try:
            # Step 1: Classify the query with enhanced context awareness
            classification = await self.classify_query(query, conversation_history, context_files)
            
            # Step 2: Intelligent context selection based on classification
            if not context_chunks:
                if classification.query_type in ["casual_conversation", "meta_question"]:
                    # No technical context needed for casual conversations
                    context_chunks = []
                elif classification.query_type == "file_specific":
                    # Get context specifically for mentioned files
                    context_chunks = await self._get_file_specific_context(query, context_files)
                else:
                    # Get general relevant context
                    context_chunks = await self.vector_retriever.retrieve_relevant_chunks(query)
            
            # Step 3: Dynamic prompt selection and context preparation
            if classification.query_type == "casual_conversation":
                # Use casual conversation template with enhanced context
                context = {
                    "conversation_history": self._format_conversation_history(conversation_history or []),
                    "user_context": f"Query: {query}",
                    "response_style": classification.response_style,
                    "confidence": classification.confidence
                }
                system_prompt = render_prompt("casual_conversation.j2", context)
                # Adjust temperature for more natural conversation
                adjusted_temperature = min(temperature + 0.1, 0.9)
                adjusted_max_tokens = min(max_tokens, 300)  # Shorter responses for casual chat
            else:
                # Use enhanced code chat template with classification-aware context
                context = {
                    "context": self._prepare_code_context(context_chunks or []),
                    "conversation_history": self._format_conversation_history(conversation_history or []),
                    "user_intent": classification.user_intent,
                    "query_type": classification.query_type,
                    "response_style": classification.response_style,
                    "confidence": classification.confidence,
                    "key_indicators": classification.key_indicators
                }
                system_prompt = render_prompt("code_chat_system.j2", context)
                # Adjust parameters based on query type
                adjusted_temperature = temperature
                adjusted_max_tokens = max_tokens
                
                # Adjust for specific query types
                if classification.query_type == "debugging":
                    adjusted_temperature = max(temperature - 0.1, 0.3)  # More focused for debugging
                    adjusted_max_tokens = max(max_tokens, 1500)  # Longer for detailed debugging
                elif classification.query_type == "code_analysis":
                    adjusted_max_tokens = max(max_tokens, 2000)  # Longer for comprehensive analysis
            
            # Step 4: Generate response with optimized parameters
            llm_request = LLMRequest(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                model=self.default_model,
                temperature=adjusted_temperature,
                max_tokens=adjusted_max_tokens,
                stream=False
            )
            
            response = await self.llm_provider.generate(llm_request)
            
            # Step 5: Post-process response based on classification
            processed_response = self._post_process_response(
                response.content, 
                classification, 
                query
            )
            
            # Step 6: Return comprehensive result with enhanced metadata
            return {
                "response": processed_response,
                "classification": classification,
                "context_chunks": context_chunks or [],
                "metadata": {
                    "query_type": classification.query_type,
                    "response_style": classification.response_style,
                    "confidence": classification.confidence,
                    "user_intent": classification.user_intent,
                    "key_indicators": classification.key_indicators,
                    "temperature_used": adjusted_temperature,
                    "max_tokens_used": adjusted_max_tokens,
                    "context_chunks_count": len(context_chunks or []),
                    "conversation_history_length": len(conversation_history or [])
                }
            }
            
        except Exception as e:
            logger.error("Response generation with classification failed", error=str(e))
            return {
                "response": f"Sorry, I encountered an error: {str(e)}",
                "classification": QueryClassification(
                    query_type="ambiguous",
                    response_style="conversational",
                    confidence=0.0,
                    key_indicators=["error_occurred"],
                    user_intent="error_recovery"
                ),
                "context_chunks": [],
                "metadata": {
                    "query_type": "ambiguous",
                    "response_style": "conversational",
                    "confidence": 0.0,
                    "user_intent": "error_recovery",
                    "error": str(e)
                }
            }
    
    async def _get_file_specific_context(self, query: str, context_files: List[str]) -> List[Dict[str, Any]]:
        """Get context specifically for files mentioned in the query."""
        try:
            # Extract file references from query
            import re
            file_patterns = [
                r'file[:\s]+([^\s]+)',
                r'([^/\s]+\.(py|js|java|cpp|c|ts|jsx|tsx|html|css|json|yaml|yml|md|txt))',
                r'in\s+([^/\s]+\.(py|js|java|cpp|c|ts|jsx|tsx|html|css|json|yaml|yml|md|txt))',
                r'([a-zA-Z_][a-zA-Z0-9_]*\.(py|js|java|cpp|c|ts|jsx|tsx|html|css|json|yaml|yml|md|txt))'
            ]
            
            mentioned_files = []
            for pattern in file_patterns:
                matches = re.findall(pattern, query, re.IGNORECASE)
                for match in matches:
                    if isinstance(match, tuple):
                        mentioned_files.extend([f for f in match if f])
                    else:
                        mentioned_files.append(match)
            
            # Get context for mentioned files
            context_chunks = []
            for file_path in mentioned_files:
                try:
                    file_chunks = await self.vector_retriever.retrieve_relevant_chunks(f"file: {file_path}")
                    context_chunks.extend(file_chunks)
                except Exception as e:
                    logger.warning(f"Failed to get context for file {file_path}", error=str(e))
            
            return context_chunks
            
        except Exception as e:
            logger.error("File-specific context retrieval failed", error=str(e))
            return []
    
    def _post_process_response(self, response: str, classification: QueryClassification, original_query: str) -> str:
        """Post-process response based on classification and query type."""
        try:
            # For casual conversations, ensure natural flow
            if classification.query_type == "casual_conversation":
                # Remove any technical jargon that might have slipped in
                technical_terms = [
                    "function", "method", "class", "variable", "algorithm", "data structure",
                    "API", "endpoint", "database", "framework", "library", "dependency"
                ]
                
                for term in technical_terms:
                    if term.lower() in response.lower() and term.lower() not in original_query.lower():
                        # Replace with more conversational alternatives
                        response = response.replace(f" {term} ", " ")
                        response = response.replace(f"{term} ", "")
                        response = response.replace(f" {term}", "")
                
                # Ensure response is conversational
                if not any(word in response.lower() for word in ["hi", "hello", "hey", "good", "great", "nice", "thanks", "welcome"]):
                    # Add a friendly prefix if response seems too technical
                    if len(response) > 100 and not response.startswith(("Hi", "Hello", "Hey")):
                        response = f"Hi there! {response}"
            
            # For debugging responses, ensure step-by-step structure
            elif classification.query_type == "debugging":
                if "step" not in response.lower() and "first" not in response.lower():
                    # Add structure if missing
                    lines = response.split('\n')
                    if len(lines) > 3:
                        structured_response = "Let me help you debug this step by step:\n\n"
                        for i, line in enumerate(lines, 1):
                            if line.strip():
                                structured_response += f"{i}. {line.strip()}\n"
                        response = structured_response
            
            # For code analysis, ensure comprehensive structure
            elif classification.query_type == "code_analysis":
                if "analysis" not in response.lower() and "review" not in response.lower():
                    # Add analysis structure if missing
                    if len(response) > 200:
                        response = f"Here's my analysis of your code:\n\n{response}"
            
            # Ensure proper code formatting
            if "```" in response:
                # Ensure code blocks have language specification
                response = response.replace("```\n", "```python\n")
                response = response.replace("```\r\n", "```python\r\n")
            
            return response.strip()
            
        except Exception as e:
            logger.error("Response post-processing failed", error=str(e))
            return response
    
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
            prompt = (
                                "Please provide a comprehensive analysis of the following code:\n\n"
                                + code_context
                                + "\n\nAnalysis Requirements:\n"
                                    "1. Provide a concise summary of what the code does\n"
                                    "2. Explain the detailed functionality\n"
                                    "3. Identify key programming concepts used\n"
                                    "4. Assess complexity level (simple/moderate/complex)\n"
                                    "5. Identify potential issues or areas for improvement\n"
                                    "6. Provide practical usage examples\n\n"
                                    "Code Analysis:"
                        )
            
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
                prompt = (
                    "Generate comprehensive docstring documentation for:\n\n"
                    + code_context
                    + "\n\nInclude:\n"
                      "1. Overview of functionality\n"
                      "2. Detailed description\n"
                      "3. Parameter documentation (if applicable)\n"
                      "4. Return value documentation (if applicable)\n"
                      "5. Usage examples\n"
                      "6. Important notes\n"
                      "7. Related concepts"
                )
            elif doc_type == "readme":
                prompt = (
                    "Generate README documentation for:\n\n"
                    + code_context
                    + "\n\nInclude:\n"
                      "1. High-level overview\n"
                      "2. Installation/usage instructions\n"
                      "3. API documentation\n"
                      "4. Code examples\n"
                      "5. Dependencies\n"
                      "6. Best practices"
                )
            else:
                prompt = "Generate documentation for:\n\n{}".format(code_context)
            
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
            prompt = (
                "Analyze this query to determine the best response approach:\n\n"
                "Query: {}\n\nAvailable Context: {} relevant chunks found\n\nPlease analyze:\n"
                "1. Query type (code explanation, debugging, documentation, etc.)\n"
                "2. What specific context is needed\n"
                "3. Confidence level for response\n"
                "4. Suggested follow-up questions".format(
                    query,
                    len(context_chunks)
                )
            )
            
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
        return (
            "Based on the following context, provide a structured response that matches the expected format.\n\n"
            "Context:\n{}\n\nQuery: {}\n\nPlease provide a response that strictly follows the expected JSON schema structure.".format(
                context,
                query
            )
        )
    
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
