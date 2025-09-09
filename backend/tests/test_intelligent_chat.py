"""
Comprehensive tests for the intelligent chat system with query classification.
"""

import pytest
import asyncio
from typing import Dict, Any, List

from rag.generation.response_generator import EnhancedResponseGenerator, QueryClassification
from agents.implementations.code_chat_agent import CodeChatAgent
from agents.base.base_agent import AgentTask


@pytest.fixture
def response_generator():
    """Create a response generator instance."""
    return EnhancedResponseGenerator()


@pytest.fixture
def code_chat_agent():
    """Create a code chat agent instance."""
    return CodeChatAgent()


class TestQueryClassification:
    """Test query classification functionality."""
    
    @pytest.mark.asyncio
    async def test_casual_conversation_classification(self, response_generator):
        """Test classification of casual conversation queries."""
        queries = [
            "hi",
            "hello",
            "how are you?",
            "good morning",
            "what's up?",
            "just checking in"
        ]
        
        for query in queries:
            classification = await response_generator.classify_query(query)
            assert classification.query_type == "casual_conversation"
            assert classification.response_style == "conversational"
            assert classification.confidence > 0.7
    
    @pytest.mark.asyncio
    async def test_technical_question_classification(self, response_generator):
        """Test classification of technical questions."""
        queries = [
            "How do I implement a binary search?",
            "What is dependency injection?",
            "Explain the difference between REST and GraphQL",
            "How to optimize database queries?",
            "What are design patterns?"
        ]
        
        for query in queries:
            classification = await response_generator.classify_query(query)
            assert classification.query_type == "technical_question"
            assert classification.response_style == "technical"
            assert classification.confidence > 0.6
    
    @pytest.mark.asyncio
    async def test_code_analysis_classification(self, response_generator):
        """Test classification of code analysis requests."""
        queries = [
            "Can you review this code?",
            "Analyze this function",
            "What's wrong with this code?",
            "How can I improve this?",
            "Code review please"
        ]
        
        for query in queries:
            classification = await response_generator.classify_query(query)
            assert classification.query_type == "code_analysis"
            assert classification.response_style == "comprehensive"
            assert classification.confidence > 0.6
    
    @pytest.mark.asyncio
    async def test_debugging_classification(self, response_generator):
        """Test classification of debugging requests."""
        queries = [
            "I'm getting an error",
            "This code doesn't work",
            "Help me debug this",
            "Why is this failing?",
            "Fix this bug"
        ]
        
        for query in queries:
            classification = await response_generator.classify_query(query)
            assert classification.query_type == "debugging"
            assert classification.response_style == "educational"
            assert classification.confidence > 0.6


class TestIntelligentResponseGeneration:
    """Test intelligent response generation with classification."""
    
    @pytest.mark.asyncio
    async def test_casual_response_generation(self, response_generator):
        """Test generation of casual conversation responses."""
        query = "hi"
        conversation_history = []
        
        result = await response_generator.generate_response_with_classification(
            query=query,
            conversation_history=conversation_history
        )
        
        assert "response" in result
        assert "classification" in result
        assert "metadata" in result
        
        classification = result["classification"]
        assert classification["query_type"] == "casual_conversation"
        assert classification["response_style"] == "conversational"
        
        response = result["response"]
        assert len(response) > 0
        assert "hi" in response.lower() or "hello" in response.lower() or "👋" in response
    
    @pytest.mark.asyncio
    async def test_technical_response_generation(self, response_generator):
        """Test generation of technical responses."""
        query = "What is a binary search?"
        conversation_history = []
        
        result = await response_generator.generate_response_with_classification(
            query=query,
            conversation_history=conversation_history
        )
        
        assert "response" in result
        assert "classification" in result
        
        classification = result["classification"]
        assert classification["query_type"] == "technical_question"
        assert classification["response_style"] == "technical"
        
        response = result["response"]
        assert len(response) > 0
        assert "binary" in response.lower() or "search" in response.lower()
    
    @pytest.mark.asyncio
    async def test_conversation_context_awareness(self, response_generator):
        """Test that responses are aware of conversation context."""
        conversation_history = [
            {"role": "user", "content": "I'm working on a Python project"},
            {"role": "assistant", "content": "That sounds interesting! What kind of project is it?"},
            {"role": "user", "content": "It's a web application"}
        ]
        
        query = "Can you help me with it?"
        
        result = await response_generator.generate_response_with_classification(
            query=query,
            conversation_history=conversation_history
        )
        
        assert "response" in result
        response = result["response"]
        assert len(response) > 0
        # Should reference the context of Python web application


class TestCodeChatAgent:
    """Test the enhanced code chat agent."""
    
    @pytest.mark.asyncio
    async def test_intelligent_code_chat_task(self, code_chat_agent):
        """Test the intelligent code chat task execution."""
        task = AgentTask(
            task_type="intelligent_code_chat",
            input_data={
                "query": "hi there!",
                "conversation_history": [],
                "context_files": []
            },
            parameters={
                "temperature": 0.7,
                "max_tokens": 500
            }
        )
        
        result = await code_chat_agent.execute(task)
        
        assert result.success
        assert "response" in result.output
        assert "classification" in result.output
        assert "metadata" in result.output
        
        response = result.output["response"]
        assert len(response) > 0
        
        classification = result.output["classification"]
        assert classification["query_type"] == "casual_conversation"
    
    @pytest.mark.asyncio
    async def test_code_analysis_task(self, code_chat_agent):
        """Test code analysis task execution."""
        task = AgentTask(
            task_type="code_analysis",
            input_data={
                "query": "Analyze this code: def hello(): return 'world'"
            },
            parameters={
                "max_context_chunks": 3
            }
        )
        
        result = await code_chat_agent.execute(task)
        
        assert result.success
        assert "analysis" in result.output
        assert "metadata" in result.output
        
        analysis = result.output["analysis"]
        assert "summary" in analysis
        assert "functionality" in analysis
    
    @pytest.mark.asyncio
    async def test_debugging_task(self, code_chat_agent):
        """Test debugging task execution."""
        task = AgentTask(
            task_type="debugging_assistance",
            input_data={
                "query": "I'm getting a syntax error in my Python code"
            },
            parameters={
                "max_context_chunks": 3
            }
        )
        
        result = await code_chat_agent.execute(task)
        
        assert result.success
        assert "debugging" in result.output
        assert "metadata" in result.output
        
        debugging = result.output["debugging"]
        assert "issue_identification" in debugging
        assert "suggested_fixes" in debugging


class TestResponseQuality:
    """Test response quality and consistency."""
    
    @pytest.mark.asyncio
    async def test_response_consistency(self, response_generator):
        """Test that similar queries get consistent classifications."""
        query = "hello"
        
        # Test multiple times
        classifications = []
        for _ in range(3):
            classification = await response_generator.classify_query(query)
            classifications.append(classification.query_type)
        
        # Should be consistent
        assert len(set(classifications)) == 1
        assert classifications[0] == "casual_conversation"
    
    @pytest.mark.asyncio
    async def test_response_length_appropriateness(self, response_generator):
        """Test that responses are appropriately sized for query type."""
        # Casual query should get short response
        casual_result = await response_generator.generate_response_with_classification("hi")
        casual_response = casual_result["response"]
        assert len(casual_response) < 200  # Should be brief
        
        # Technical query should get longer response
        technical_result = await response_generator.generate_response_with_classification(
            "Explain object-oriented programming"
        )
        technical_response = technical_result["response"]
        assert len(technical_response) > 100  # Should be more detailed


class TestErrorHandling:
    """Test error handling and fallbacks."""
    
    @pytest.mark.asyncio
    async def test_classification_fallback(self, response_generator):
        """Test that classification failures have proper fallbacks."""
        # Mock a failure scenario
        original_method = response_generator.classify_query
        
        async def failing_classification(*args, **kwargs):
            raise Exception("Classification failed")
        
        response_generator.classify_query = failing_classification
        
        try:
            result = await response_generator.generate_response_with_classification("test query")
            assert "response" in result
            assert "classification" in result
            assert result["classification"]["query_type"] == "ambiguous"
        finally:
            response_generator.classify_query = original_method
    
    @pytest.mark.asyncio
    async def test_response_generation_fallback(self, response_generator):
        """Test that response generation failures have proper fallbacks."""
        # This test ensures the system doesn't crash on errors
        result = await response_generator.generate_response_with_classification(
            "This is a test query that might cause issues"
        )
        
        assert "response" in result
        assert len(result["response"]) > 0
        assert "error" not in result["response"].lower() or "sorry" in result["response"].lower()


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
