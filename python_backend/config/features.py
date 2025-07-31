import yaml
import os

FEATURES_PATH = os.path.join(os.path.dirname(__file__), "features.yaml")

with open(FEATURES_PATH, "r") as f:
    features = yaml.safe_load(f)

def is_agent_enabled(agent_name: str) -> bool:
    return features.get("agents", {}).get(agent_name, False)

def is_provider_enabled(provider_name: str) -> bool:
    return features.get("providers", {}).get(provider_name, False) 