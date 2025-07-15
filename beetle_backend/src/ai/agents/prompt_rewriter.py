import re
from typing import Dict, List, Any, Optional
from datetime import datetime
from ..models.document import SearchResult, ChatRequest, ChatMessage
from .base_agent import BaseAgent, AgentConfig, AgentResult


class PromptRewriterConfig(AgentConfig):
    """Configuration for prompt rewriter agent"""
    max_context_length: int = 4000
    max_sources: int = 5
    include_citations: bool = True
    include_confidence: bool = True
    style_guide: str = "concise and professional"
    system_prompt_template: str = """You are a helpful AI assistant that answers questions based on the provided context. 
Your responses should be:
- Accurate and based on the provided sources
- Concise and well-structured
- Professional in tone
- Include citations when referencing specific information
- Say "I don't have enough information to answer this question" if the context doesn't contain relevant information

Context sources: {sources}

Question: {question}

Answer:"""
    context_format: str = "Source {index}: {content} (from {source_type})"
    citation_format: str = "[Source {index}]"


class PromptRewriter(BaseAgent):
    """Agent for rewriting prompts with context for chat models"""
    
    def __init__(self, config: PromptRewriterConfig):
        super().__init__(config)
        self.config = config
    
    def format_context_sources(self, search_results: List[SearchResult]) -> str:
        """Format search results as context sources"""
        if not search_results:
            return "No relevant sources found."
        
        # Limit number of sources
        limited_results = search_results[:self.config.max_sources]
        
        formatted_sources = []
        for i, result in enumerate(limited_results, 1):
            source_type = result.source_type.value
            content = result.content.strip()
            
            # Truncate content if too long
            if len(content) > 500:
                content = content[:500] + "..."
            
            formatted_source = self.config.context_format.format(
                index=i,
                content=content,
                source_type=source_type
            )
            formatted_sources.append(formatted_source)
        
        return "\n\n".join(formatted_sources)
    
    def extract_key_information(self, search_results: List[SearchResult]) -> Dict[str, Any]:
        """Extract key information from search results"""
        if not search_results:
            return {}
        
        # Analyze search results for key patterns
        all_content = " ".join([r.content.lower() for r in search_results])
        
        # Extract common topics
        topics = []
        if "function" in all_content or "method" in all_content:
            topics.append("code functions")
        if "api" in all_content or "endpoint" in all_content:
            topics.append("API documentation")
        if "config" in all_content or "setting" in all_content:
            topics.append("configuration")
        if "error" in all_content or "bug" in all_content:
            topics.append("error handling")
        if "test" in all_content:
            topics.append("testing")
        
        # Calculate average relevance
        avg_score = sum(r.similarity_score for r in search_results) / len(search_results)
        
        return {
            'topics': topics,
            'average_relevance': avg_score,
            'source_types': list(set(r.source_type.value for r in search_results)),
            'total_sources': len(search_results)
        }
    
    def determine_response_style(self, query: str, context_info: Dict[str, Any]) -> str:
        """Determine the appropriate response style based on query and context"""
        query_lower = query.lower()
        
        # Technical questions
        if any(word in query_lower for word in ['how', 'implement', 'code', 'function', 'api']):
            return "technical and detailed"
        
        # Definition questions
        if any(word in query_lower for word in ['what is', 'define', 'explain', 'meaning']):
            return "explanatory and clear"
        
        # Problem-solving questions
        if any(word in query_lower for word in ['error', 'bug', 'issue', 'problem', 'fix']):
            return "diagnostic and solution-oriented"
        
        # General questions
        return "informative and helpful"
    
    def create_system_prompt(self, query: str, search_results: List[SearchResult]) -> str:
        """Create system prompt for the chat model"""
        # Format context sources
        sources_text = self.format_context_sources(search_results)
        
        # Extract key information
        context_info = self.extract_key_information(search_results)
        
        # Determine response style
        response_style = self.determine_response_style(query, context_info)
        
        # Create enhanced system prompt
        enhanced_prompt = self.config.system_prompt_template.format(
            sources=sources_text,
            question=query
        )
        
        # Add style-specific instructions
        if response_style == "technical and detailed":
            enhanced_prompt += "\n\nProvide specific code examples and implementation details when relevant."
        elif response_style == "explanatory and clear":
            enhanced_prompt += "\n\nUse clear, simple language and provide examples to illustrate concepts."
        elif response_style == "diagnostic and solution-oriented":
            enhanced_prompt += "\n\nFocus on identifying the root cause and providing step-by-step solutions."
        
        return enhanced_prompt
    
    def create_user_prompt(self, query: str, conversation_history: List[ChatMessage]) -> str:
        """Create user prompt with conversation context"""
        if not conversation_history:
            return query
        
        # Include recent conversation context
        recent_messages = conversation_history[-4:]  # Last 4 messages
        
        context_lines = []
        for msg in recent_messages:
            role = "User" if msg.role == "user" else "Assistant"
            context_lines.append(f"{role}: {msg.content}")
        
        context_text = "\n".join(context_lines)
        
        return f"Previous conversation:\n{context_text}\n\nCurrent question: {query}"
    
    def add_citation_instructions(self, prompt: str) -> str:
        """Add citation instructions to the prompt"""
        if not self.config.include_citations:
            return prompt
        
        citation_instruction = f"""
When referencing information from the provided sources, use the format {self.config.citation_format} where the number corresponds to the source index.

For example: "According to the documentation {self.config.citation_format.format(index=1)}, the function requires two parameters."
"""
        
        return prompt + citation_instruction
    
    def add_confidence_instructions(self, prompt: str, context_info: Dict[str, Any]) -> str:
        """Add confidence-related instructions to the prompt"""
        if not self.config.include_confidence:
            return prompt
        
        avg_relevance = context_info.get('average_relevance', 0.0)
        
        if avg_relevance < 0.5:
            confidence_note = "\n\nNote: The available sources have low relevance to the question. If you cannot provide a confident answer based on the context, clearly state this."
        elif avg_relevance < 0.7:
            confidence_note = "\n\nNote: The available sources have moderate relevance. Provide the best answer possible but indicate any uncertainties."
        else:
            confidence_note = "\n\nNote: The available sources are highly relevant. You can provide confident answers based on this context."
        
        return prompt + confidence_note
    
    def validate_prompt_length(self, prompt: str) -> bool:
        """Validate that prompt is within length limits"""
        return len(prompt) <= self.config.max_context_length
    
    def truncate_prompt(self, prompt: str) -> str:
        """Truncate prompt if it exceeds length limits"""
        if len(prompt) <= self.config.max_context_length:
            return prompt
        
        # Try to truncate from the middle, keeping system prompt and user query
        lines = prompt.split('\n')
        
        # Find system prompt and user query sections
        system_lines = []
        user_lines = []
        in_system = True
        
        for line in lines:
            if line.startswith("Current question:"):
                in_system = False
                user_lines.append(line)
            elif in_system:
                system_lines.append(line)
            else:
                user_lines.append(line)
        
        # Calculate available space for context
        system_text = '\n'.join(system_lines)
        user_text = '\n'.join(user_lines)
        available_space = self.config.max_context_length - len(system_text) - len(user_text) - 100  # Buffer
        
        if available_space < 100:
            # If still too long, truncate more aggressively
            return system_text + "\n\nContext sources: [Truncated due to length]\n\n" + user_text
        
        return prompt[:self.config.max_context_length] + "\n\n[Prompt truncated due to length]"
    
    def process(self, chat_request: ChatRequest) -> Dict[str, Any]:
        """Process chat request and create enhanced prompt"""
        self.log_info("Starting prompt rewriting", query_length=len(chat_request.query))
        
        # Extract key information from context
        context_info = self.extract_key_information(chat_request.context_results)
        
        # Create system prompt
        system_prompt = self.create_system_prompt(chat_request.query, chat_request.context_results)
        
        # Create user prompt
        user_prompt = self.create_user_prompt(chat_request.query, chat_request.conversation_history)
        
        # Add citation instructions
        if self.config.include_citations:
            system_prompt = self.add_citation_instructions(system_prompt)
        
        # Add confidence instructions
        if self.config.include_confidence:
            system_prompt = self.add_confidence_instructions(system_prompt, context_info)
        
        # Combine prompts
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        # Validate and truncate if necessary
        if not self.validate_prompt_length(full_prompt):
            full_prompt = self.truncate_prompt(full_prompt)
        
        # Create enhanced chat request
        enhanced_request = {
            'system_prompt': system_prompt,
            'user_prompt': user_prompt,
            'full_prompt': full_prompt,
            'context_info': context_info,
            'original_request': chat_request,
            'prompt_length': len(full_prompt),
            'sources_count': len(chat_request.context_results),
            'conversation_length': len(chat_request.conversation_history)
        }
        
        self.log_info("Prompt rewriting completed", 
                     prompt_length=len(full_prompt),
                     sources_count=len(chat_request.context_results),
                     context_topics=context_info.get('topics', []))
        
        return enhanced_request
    
    def run(self, input_data: ChatRequest) -> AgentResult:
        """Run prompt rewriter with error handling"""
        try:
            enhanced_request = self.process(input_data)
            return AgentResult(
                success=True,
                data=enhanced_request,
                metadata={
                    'query_length': len(input_data.query),
                    'sources_count': len(input_data.context_results),
                    'conversation_length': len(input_data.conversation_history),
                    'prompt_length': enhanced_request['prompt_length'],
                    'context_topics': enhanced_request['context_info'].get('topics', [])
                }
            )
        except Exception as e:
            return AgentResult(
                success=False,
                error_message=str(e),
                metadata={
                    'query_length': len(input_data.query),
                    'sources_count': len(input_data.context_results)
                }
            ) 