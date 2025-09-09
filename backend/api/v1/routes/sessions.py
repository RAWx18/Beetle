import json
from datetime import datetime

SESSIONS_FILE = "user_sessions.json"

user_sessions = {}

class DateTimeEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)

def save_sessions():
    with open(SESSIONS_FILE, "w") as f:
        json.dump(user_sessions, f, cls=DateTimeEncoder)

def load_sessions():
    global user_sessions
    try:
        with open(SESSIONS_FILE, "r") as f:
            user_sessions = json.load(f)
            for session_id, session_data in user_sessions.items():
                if 'created_at' in session_data and isinstance(session_data['created_at'], str):
                    session_data['created_at'] = datetime.fromisoformat(session_data['created_at'])
                if 'last_activity' in session_data and isinstance(session_data['last_activity'], str):
                    session_data['last_activity'] = datetime.fromisoformat(session_data['last_activity'])
    except (FileNotFoundError, json.JSONDecodeError):
        pass

load_sessions()
