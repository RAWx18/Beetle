from typing import Type, Dict

class AgentRegistry:
    _agents: Dict[str, Type] = {}

    @classmethod
    def register(cls, name: str):
        def decorator(agent_cls):
            cls._agents[name] = agent_cls
            return agent_cls
        return decorator

    @classmethod
    def get_agent_class(cls, name: str):
        return cls._agents.get(name)

    @classmethod
    def all_agents(cls):
        return dict(cls._agents) 