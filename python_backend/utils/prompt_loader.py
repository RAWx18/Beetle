from jinja2 import Environment, FileSystemLoader
import os

PROMPT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts")
env = Environment(loader=FileSystemLoader(PROMPT_DIR))

def render_prompt(template_name: str, context: dict) -> str:
    template = env.get_template(template_name)
    return template.render(**context) 