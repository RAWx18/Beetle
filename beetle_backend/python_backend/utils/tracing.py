import json, time, os

def trace(event: str, payload: dict):
    trace_file = os.getenv("TRACE_FILE")
    if trace_file:
        with open(trace_file, "a") as f:
            f.write(json.dumps({"ts": time.time(), "event": event, **payload}) + "\n") 