import pytest
from agents.registry import AgentRegistry
from agents.implementations.code_chat_agent import CodeChatAgent

@pytest.fixture
def code_chat_agent():
    return CodeChatAgent()

@pytest.mark.asyncio
async def test_code_chat_explanation(code_chat_agent):
    task = type('Task', (), {"task_type": "code_analysis", "input_data": {"query": "Explain this function"}, "parameters": {}})()
    result = await code_chat_agent.execute(task)
    assert "summary" in result.output or "functionality" in result.output 