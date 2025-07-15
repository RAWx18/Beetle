import time
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
import google.generativeai as genai
from ..models.document import ChatResponse, SearchResult
from .base_agent import BaseAgent, AgentConfig, AgentResult


class AnsweringAgentConfig(AgentConfig):
    """Configuration for answering agent"""
    api_key: str
    model_name: str = "gemini-2.0-flash"
    max_tokens: int = 1000
    temperature: float = 0.7
    top_p: float = 0.9
    top_k: int = 40
    safety_settings: List[Dict[str, Any]] = [
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        }
    ]
    retry_on_error: bool = True
    max_retries: int = 3
    confidence_threshold: float = 0.3


class AnsweringAgent(BaseAgent):
    """Agent for generating answers using Google Gemini API"""
    
    def __init__(self, config: AnsweringAgentConfig):
        super().__init__(config)
        self.config = config
        self.model = None
        self.setup_gemini()
    
    def setup_gemini(self):
        """Setup Google Gemini API"""
        try:
            genai.configure(api_key=self.config.api_key)
            self.model = genai.GenerativeModel(
                model_name=self.config.model_name,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=self.config.max_tokens,
                    temperature=self.config.temperature,
                    top_p=self.config.top_p,
                    top_k=self.config.top_k
                ),
                safety_settings=self.config.safety_settings
            )
            self.log_info("Gemini API setup completed", model=self.config.model_name)
        except Exception as e:
            self.log_error("Error setting up Gemini API", error=e)
            raise
    
    def extract_citations(self, response_text: str) -> List[Dict[str, Any]]:
        """Extract citations from response text"""
        citations = []
        
        # Look for citation patterns like [Source 1], [Source 2], etc.
        citation_pattern = r'\[Source (\d+)\]'
        matches = re.finditer(citation_pattern, response_text)
        
        for match in matches:
            source_index = int(match.group(1))
            citations.append({
                'source_index': source_index,
                'position': match.start(),
                'text': match.group(0)
            })
        
        return citations
    
    def calculate_confidence(self, response_text: str, context_results: List[SearchResult]) -> float:
        """Calculate confidence score based on response and context"""
        if not context_results:
            return 0.0
        
        # Check if response contains citations
        citations = self.extract_citations(response_text)
        citation_score = min(len(citations) / len(context_results), 1.0) * 0.3
        
        # Check if response acknowledges lack of information
        uncertainty_indicators = [
            "i don't know", "i don't have", "not enough information",
            "cannot answer", "unclear", "uncertain", "no information"
        ]
        
        response_lower = response_text.lower()
        uncertainty_score = 0.0
        for indicator in uncertainty_indicators:
            if indicator in response_lower:
                uncertainty_score = 0.5
                break
        
        # Check response length (longer responses might be more confident)
        length_score = min(len(response_text) / 500, 1.0) * 0.2
        
        # Check if response contains specific details
        detail_score = 0.0
        if any(word in response_lower for word in ['function', 'method', 'api', 'config', 'example']):
            detail_score = 0.3
        
        # Calculate average relevance of context
        avg_relevance = sum(r.similarity_score for r in context_results) / len(context_results)
        relevance_score = avg_relevance * 0.2
        
        # Combine scores
        total_confidence = citation_score + length_score + detail_score + relevance_score - uncertainty_score
        
        return max(0.0, min(1.0, total_confidence))
    
    def count_tokens(self, text: str) -> int:
        """Estimate token count for text"""
        # Rough estimation: 1 token ≈ 4 characters
        return len(text) // 4
    
    def validate_response(self, response_text: str) -> bool:
        """Validate response quality"""
        if not response_text or len(response_text.strip()) < 10:
            return False
        
        # Check for error indicators
        error_indicators = [
            "i'm sorry, i cannot", "i'm unable to", "error occurred",
            "api error", "model error", "generation failed"
        ]
        
        response_lower = response_text.lower()
        for indicator in error_indicators:
            if indicator in response_lower:
                return False
        
        return True
    
    def generate_response(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Generate response using Gemini API"""
        try:
            start_time = time.time()
            
            # Create chat session
            chat = self.model.start_chat(history=[])
            
            # Send system prompt
            system_response = chat.send_message(system_prompt)
            
            # Send user prompt
            user_response = chat.send_message(user_prompt)
            
            processing_time = time.time() - start_time
            
            response_text = user_response.text
            
            return {
                'response': response_text,
                'processing_time': processing_time,
                'tokens_used': self.count_tokens(system_prompt + user_prompt + response_text),
                'success': True
            }
            
        except Exception as e:
            self.log_error("Error generating response with Gemini", error=e)
            return {
                'response': f"I apologize, but I encountered an error while generating a response: {str(e)}",
                'processing_time': 0.0,
                'tokens_used': 0,
                'success': False,
                'error': str(e)
            }
    
    def process(self, enhanced_request: Dict[str, Any]) -> ChatResponse:
        """Process enhanced request and generate answer"""
        self.log_info("Starting answer generation", 
                     prompt_length=enhanced_request['prompt_length'],
                     sources_count=enhanced_request['sources_count'])
        
        system_prompt = enhanced_request['system_prompt']
        user_prompt = enhanced_request['user_prompt']
        context_results = enhanced_request['original_request'].context_results
        
        # Generate response
        generation_result = self.generate_response(system_prompt, user_prompt)
        
        if not generation_result['success']:
            # Return error response
            return ChatResponse(
                answer=generation_result['response'],
                sources=[],
                confidence=0.0,
                model_used=self.config.model_name,
                processing_time=generation_result['processing_time'],
                tokens_used=generation_result['tokens_used']
            )
        
        response_text = generation_result['response']
        
        # Validate response
        if not self.validate_response(response_text):
            response_text = "I apologize, but I was unable to generate a proper response to your question. Please try rephrasing your query or providing more context."
        
        # Extract citations
        citations = self.extract_citations(response_text)
        
        # Create sources list
        sources = []
        for citation in citations:
            source_index = citation['source_index'] - 1  # Convert to 0-based index
            if 0 <= source_index < len(context_results):
                source = context_results[source_index]
                sources.append({
                    'index': citation['source_index'],
                    'title': source.title,
                    'url': source.source_url,
                    'type': source.source_type.value,
                    'relevance_score': source.similarity_score
                })
        
        # Calculate confidence
        confidence = self.calculate_confidence(response_text, context_results)
        
        # Create chat response
        chat_response = ChatResponse(
            answer=response_text,
            sources=sources,
            confidence=confidence,
            model_used=self.config.model_name,
            processing_time=generation_result['processing_time'],
            tokens_used=generation_result['tokens_used']
        )
        
        self.log_info("Answer generation completed", 
                     answer_length=len(response_text),
                     confidence=confidence,
                     sources_count=len(sources),
                     processing_time=generation_result['processing_time'])
        
        return chat_response
    
    def run(self, input_data: Dict[str, Any]) -> AgentResult:
        """Run answering agent with error handling"""
        try:
            chat_response = self.process(input_data)
            return AgentResult(
                success=True,
                data=chat_response,
                metadata={
                    'answer_length': len(chat_response.answer),
                    'confidence': chat_response.confidence,
                    'sources_count': len(chat_response.sources),
                    'processing_time': chat_response.processing_time,
                    'tokens_used': chat_response.tokens_used,
                    'model_used': chat_response.model_used
                }
            )
        except Exception as e:
            return AgentResult(
                success=False,
                error_message=str(e),
                metadata={
                    'prompt_length': input_data.get('prompt_length', 0),
                    'sources_count': input_data.get('sources_count', 0)
                }
            ) 