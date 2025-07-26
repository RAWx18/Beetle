import re
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class PromptUtils:
    """Utility functions for prompt management and generation"""
    
    def __init__(self):
        self.prompt_templates = self._load_default_templates()
        self.system_prompts = self._load_system_prompts()
    
    def _load_default_templates(self) -> Dict[str, str]:
        """Load default prompt templates"""
        return {
            "rag_query": """
Context: {context}

Question: {query}

Please provide a comprehensive answer based on the provided context. If the context doesn't contain enough information to answer the question, please say so clearly.

Answer:""",
            
            "code_analysis": """
Analyze the following {language} code and provide insights about {analysis_type}:

```{language}
{code}
```

Analysis:""",
            
            "code_review": """
Review the following {language} code for best practices, potential issues, and improvements:

```{language}
{code}
```

Please provide:
1. Code quality assessment
2. Potential issues or bugs
3. Security considerations
4. Performance optimizations
5. Best practices recommendations

Review:""",
            
            "documentation_generation": """
Generate {doc_type} documentation for the following {language} code:

```{language}
{code}
```

Please provide clear, comprehensive documentation that includes:
- Purpose and functionality
- Parameters and return values
- Usage examples
- Important notes or warnings

Documentation:""",
            
            "bug_fix_suggestion": """
The following {language} code has a bug or issue:

```{language}
{code}
```

Issue: {issue_description}

Please provide:
1. Analysis of the problem
2. Suggested fix
3. Explanation of why the fix works

Fix:""",
            
            "code_optimization": """
Analyze the following {language} code for optimization opportunities:

```{language}
{code}
```

Please identify:
1. Performance bottlenecks
2. Memory usage optimizations
3. Algorithm improvements
4. Code efficiency suggestions

Optimization suggestions:""",
            
            "test_generation": """
Generate {test_type} tests for the following {language} function:

```{language}
{code}
```

Please provide comprehensive tests that cover:
- Normal cases
- Edge cases
- Error conditions
- Boundary values

Tests:""",
            
            "explain_code": """
Explain the following {language} code in detail:

```{language}
{code}
```

Please provide:
1. What the code does
2. How it works step by step
3. Key concepts and patterns used
4. Potential use cases

Explanation:""",
        }
    
    def _load_system_prompts(self) -> Dict[str, str]:
        """Load system prompts for different tasks"""
        return {
            "rag_assistant": """You are a helpful AI assistant that answers questions based on the provided context. 
Always cite your sources and provide accurate information. If you cannot answer the question based on the context, 
say so clearly. Be concise but comprehensive in your responses.""",
            
            "code_analyst": """You are an expert code analyst with deep knowledge of multiple programming languages. 
You provide insightful analysis of code quality, performance, security, and best practices. 
Your analysis should be practical and actionable.""",
            
            "code_reviewer": """You are an experienced code reviewer who provides thorough, constructive feedback. 
Focus on code quality, maintainability, security, and performance. Be specific and provide actionable suggestions.""",
            
            "technical_writer": """You are a skilled technical writer who creates clear, comprehensive documentation. 
Your documentation should be accessible to developers of varying skill levels and include practical examples.""",
            
            "debugger": """You are an expert debugger who can identify and fix code issues. 
You provide clear explanations of problems and practical solutions. Focus on root causes and prevention.""",
            
            "optimizer": """You are a performance optimization expert who identifies opportunities to improve code efficiency. 
You consider both time and space complexity, and provide practical optimization strategies.""",
            
            "tester": """You are a testing expert who creates comprehensive test suites. 
You understand testing best practices and can create tests for various scenarios including edge cases and error conditions.""",
            
            "educator": """You are a patient educator who explains complex code concepts clearly. 
You break down complex ideas into understandable parts and provide context for why things work the way they do.""",
        }
    
    def build_prompt(
        self,
        template_name: str,
        variables: Dict[str, Any],
        system_prompt: Optional[str] = None
    ) -> str:
        """Build a prompt from template and variables"""
        if template_name not in self.prompt_templates:
            raise ValueError(f"Unknown prompt template: {template_name}")
        
        template = self.prompt_templates[template_name]
        
        # Format template with variables
        try:
            formatted_prompt = template.format(**variables)
        except KeyError as e:
            raise ValueError(f"Missing required variable for template {template_name}: {e}")
        
        # Add system prompt if provided
        if system_prompt:
            formatted_prompt = f"{system_prompt}\n\n{formatted_prompt}"
        
        return formatted_prompt.strip()
    
    def build_rag_prompt(
        self,
        query: str,
        context: List[Dict[str, Any]],
        system_prompt: Optional[str] = None
    ) -> str:
        """Build RAG prompt with context"""
        if not system_prompt:
            system_prompt = self.system_prompts["rag_assistant"]
        
        # Format context
        context_text = self._format_context(context)
        
        variables = {
            "context": context_text,
            "query": query
        }
        
        return self.build_prompt("rag_query", variables, system_prompt)
    
    def build_code_analysis_prompt(
        self,
        code: str,
        language: str,
        analysis_type: str = "general",
        system_prompt: Optional[str] = None
    ) -> str:
        """Build code analysis prompt"""
        if not system_prompt:
            system_prompt = self.system_prompts["code_analyst"]
        
        variables = {
            "code": code,
            "language": language,
            "analysis_type": analysis_type
        }
        
        return self.build_prompt("code_analysis", variables, system_prompt)
    
    def build_code_review_prompt(
        self,
        code: str,
        language: str,
        system_prompt: Optional[str] = None
    ) -> str:
        """Build code review prompt"""
        if not system_prompt:
            system_prompt = self.system_prompts["code_reviewer"]
        
        variables = {
            "code": code,
            "language": language
        }
        
        return self.build_prompt("code_review", variables, system_prompt)
    
    def build_documentation_prompt(
        self,
        code: str,
        language: str,
        doc_type: str = "function",
        system_prompt: Optional[str] = None
    ) -> str:
        """Build documentation generation prompt"""
        if not system_prompt:
            system_prompt = self.system_prompts["technical_writer"]
        
        variables = {
            "code": code,
            "language": language,
            "doc_type": doc_type
        }
        
        return self.build_prompt("documentation_generation", variables, system_prompt)
    
    def build_bug_fix_prompt(
        self,
        code: str,
        language: str,
        issue_description: str,
        system_prompt: Optional[str] = None
    ) -> str:
        """Build bug fix suggestion prompt"""
        if not system_prompt:
            system_prompt = self.system_prompts["debugger"]
        
        variables = {
            "code": code,
            "language": language,
            "issue_description": issue_description
        }
        
        return self.build_prompt("bug_fix_suggestion", variables, system_prompt)
    
    def build_optimization_prompt(
        self,
        code: str,
        language: str,
        system_prompt: Optional[str] = None
    ) -> str:
        """Build code optimization prompt"""
        if not system_prompt:
            system_prompt = self.system_prompts["optimizer"]
        
        variables = {
            "code": code,
            "language": language
        }
        
        return self.build_prompt("code_optimization", variables, system_prompt)
    
    def build_test_generation_prompt(
        self,
        code: str,
        language: str,
        test_type: str = "unit",
        system_prompt: Optional[str] = None
    ) -> str:
        """Build test generation prompt"""
        if not system_prompt:
            system_prompt = self.system_prompts["tester"]
        
        variables = {
            "code": code,
            "language": language,
            "test_type": test_type
        }
        
        return self.build_prompt("test_generation", variables, system_prompt)
    
    def build_explanation_prompt(
        self,
        code: str,
        language: str,
        system_prompt: Optional[str] = None
    ) -> str:
        """Build code explanation prompt"""
        if not system_prompt:
            system_prompt = self.system_prompts["educator"]
        
        variables = {
            "code": code,
            "language": language
        }
        
        return self.build_prompt("explain_code", variables, system_prompt)
    
    def _format_context(self, context: List[Dict[str, Any]]) -> str:
        """Format context for RAG prompts"""
        if not context:
            return "No context provided."
        
        formatted_contexts = []
        for i, ctx in enumerate(context, 1):
            content = ctx.get("content", "")
            source = ctx.get("source", f"Source {i}")
            metadata = ctx.get("metadata", {})
            
            # Add metadata if available
            metadata_str = ""
            if metadata:
                metadata_items = []
                for key, value in metadata.items():
                    if key in ["file_path", "line_number", "language", "chunk_type"]:
                        metadata_items.append(f"{key}: {value}")
                if metadata_items:
                    metadata_str = f" ({', '.join(metadata_items)})"
            
            formatted_context = f"Source {i}{metadata_str}:\n{content}"
            formatted_contexts.append(formatted_context)
        
        return "\n\n".join(formatted_contexts)
    
    def extract_code_blocks(self, text: str) -> List[Dict[str, Any]]:
        """Extract code blocks from text"""
        code_blocks = []
        
        # Pattern for markdown code blocks
        pattern = r'```(\w+)?\n(.*?)\n```'
        matches = re.finditer(pattern, text, re.DOTALL)
        
        for match in matches:
            language = match.group(1) or "text"
            code = match.group(2).strip()
            
            code_blocks.append({
                "language": language,
                "code": code,
                "start": match.start(),
                "end": match.end()
            })
        
        return code_blocks
    
    def extract_queries(self, text: str) -> List[str]:
        """Extract potential queries from text"""
        queries = []
        
        # Look for question patterns
        question_patterns = [
            r'[^.!?]*\?',  # Lines ending with question mark
            r'How\s+.*?[.!]',  # How questions
            r'What\s+.*?[.!]',  # What questions
            r'Why\s+.*?[.!]',  # Why questions
            r'When\s+.*?[.!]',  # When questions
            r'Where\s+.*?[.!]',  # Where questions
            r'Which\s+.*?[.!]',  # Which questions
        ]
        
        for pattern in question_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            queries.extend([match.strip() for match in matches if len(match.strip()) > 10])
        
        return list(set(queries))  # Remove duplicates
    
    def sanitize_prompt(self, prompt: str) -> str:
        """Sanitize prompt for safety"""
        # Remove potentially harmful patterns
        harmful_patterns = [
            r'system:',  # System prompt injection
            r'user:',    # User prompt injection
            r'assistant:',  # Assistant prompt injection
        ]
        
        sanitized = prompt
        for pattern in harmful_patterns:
            sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
        
        # Remove excessive whitespace
        sanitized = re.sub(r'\s+', ' ', sanitized).strip()
        
        return sanitized
    
    def estimate_tokens(self, text: str) -> int:
        """Estimate token count for text"""
        # Rough estimation: 1 token ≈ 4 characters for English text
        return len(text) // 4
    
    def truncate_prompt(self, prompt: str, max_tokens: int) -> str:
        """Truncate prompt to fit within token limit"""
        estimated_tokens = self.estimate_tokens(prompt)
        
        if estimated_tokens <= max_tokens:
            return prompt
        
        # Calculate how many characters to keep
        max_chars = max_tokens * 4
        
        # Truncate and add ellipsis
        truncated = prompt[:max_chars-3] + "..."
        
        return truncated
    
    def create_few_shot_prompt(
        self,
        examples: List[Dict[str, str]],
        query: str,
        system_prompt: Optional[str] = None
    ) -> str:
        """Create few-shot learning prompt"""
        if not system_prompt:
            system_prompt = self.system_prompts["rag_assistant"]
        
        prompt_parts = [system_prompt]
        
        # Add examples
        for example in examples:
            input_text = example.get("input", "")
            output_text = example.get("output", "")
            
            prompt_parts.append(f"Input: {input_text}")
            prompt_parts.append(f"Output: {output_text}")
            prompt_parts.append("")  # Empty line between examples
        
        # Add current query
        prompt_parts.append(f"Input: {query}")
        prompt_parts.append("Output:")
        
        return "\n".join(prompt_parts)
    
    def create_chain_of_thought_prompt(
        self,
        query: str,
        context: Optional[str] = None
    ) -> str:
        """Create chain-of-thought prompt"""
        system_prompt = """You are a helpful AI assistant. When answering questions, please think through the problem step by step:

1. First, understand what is being asked
2. Consider the relevant information or context
3. Break down the problem into smaller parts
4. Work through each part logically
5. Provide a clear, well-reasoned answer

Let's work through this step by step:"""
        
        prompt_parts = [system_prompt]
        
        if context:
            prompt_parts.append(f"Context: {context}")
        
        prompt_parts.append(f"Question: {query}")
        prompt_parts.append("Let me think through this step by step:")
        
        return "\n\n".join(prompt_parts)
    
    def create_structured_prompt(
        self,
        sections: Dict[str, str],
        system_prompt: Optional[str] = None
    ) -> str:
        """Create structured prompt with sections"""
        if not system_prompt:
            system_prompt = self.system_prompts["rag_assistant"]
        
        prompt_parts = [system_prompt]
        
        for section_name, section_content in sections.items():
            prompt_parts.append(f"{section_name.upper()}:")
            prompt_parts.append(section_content)
            prompt_parts.append("")  # Empty line between sections
        
        return "\n".join(prompt_parts)
    
    def get_system_prompt(self, task_type: str) -> str:
        """Get system prompt for task type"""
        return self.system_prompts.get(task_type, self.system_prompts["rag_assistant"])
    
    def register_template(self, name: str, template: str):
        """Register a new prompt template"""
        self.prompt_templates[name] = template
    
    def register_system_prompt(self, name: str, prompt: str):
        """Register a new system prompt"""
        self.system_prompts[name] = prompt
    
    def list_templates(self) -> List[str]:
        """List available prompt templates"""
        return list(self.prompt_templates.keys())
    
    def list_system_prompts(self) -> List[str]:
        """List available system prompts"""
        return list(self.system_prompts.keys())


# Global prompt utils instance
prompt_utils = PromptUtils()


def get_prompt_utils() -> PromptUtils:
    """Get the global prompt utils instance"""
    return prompt_utils 