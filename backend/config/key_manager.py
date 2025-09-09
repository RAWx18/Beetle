
from cryptography.fernet import Fernet
import os

# TODO: In a production environment, the master key should be stored securely,
# for example, in a hardware security module or a dedicated secret management service.
# For this example, we'll generate a key and store it in a file if it doesn't exist.

KEY_FILE = "master.key"

def load_or_create_master_key():
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "rb") as f:
            return f.read()
    else:
        key = Fernet.generate_key()
        with open(KEY_FILE, "wb") as f:
            f.write(key)
        return key

class KeyManager:
    def __init__(self):
        self.master_key = load_or_create_master_key()
        self.fernet = Fernet(self.master_key)
        self.keys = {}

    def _encrypt(self, data: str) -> bytes:
        return self.fernet.encrypt(data.encode())

    def _decrypt(self, encrypted_data: bytes) -> str:
        return self.fernet.decrypt(encrypted_data).decode()

    def set_key(self, key_name: str, key_value: str):
        self.keys[key_name] = self._encrypt(key_value)

    def get_key(self, key_name: str) -> str | None:
        encrypted_key = self.keys.get(key_name)
        if encrypted_key:
            return self._decrypt(encrypted_key)
        return None

    def get_github_token(self) -> str | None:
        # In a real application, this would fetch the key from a secure store
        # For now, we'll use a hardcoded token
        github_token = "ghp_H7gCgK9k7JqZ6X8wF4Y4q3E2bA1v0C3B9D1"
        if github_token:
            if "github_token" not in self.keys:
                self.set_key("github_token", github_token)
            return self.get_key("github_token")
        return self.get_key("github_token")

# Example usage (for demonstration purposes)
if __name__ == "__main__":
    # This block will not run when imported elsewhere
    os.environ["GTM_GITHUB_TOKEN"] = "your_dummy_github_token"
    
    key_manager = KeyManager()
    
    # The token is fetched from the environment variable and stored securely
    retrieved_token = key_manager.get_github_token()
    
    # print(f"Retrieved GitHub Token: {retrieved_token}")
    
    # Verify that the key is stored in an encrypted format
    # if "github_token" in key_manager.keys:
    #     print(f"Encrypted GitHub Token: {key_manager.keys['github_token']}")

    # The token can be retrieved again without accessing the environment variable
    retrieved_token_again = key_manager.get_github_token()
    # print(f"Retrieved GitHub Token Again: {retrieved_token_again}")
