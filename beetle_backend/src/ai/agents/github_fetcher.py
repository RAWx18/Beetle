import os
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
import base64
from github import Github, GithubException
from models.document import RawDocument, SourceType, DocumentStatus
from .base_agent import BaseAgent, AgentConfig, AgentResult


class GitHubFetcherConfig(AgentConfig):
    """Configuration for GitHub fetcher agent"""
    github_token: str
    max_file_size: int = 1024 * 1024  # 1MB
    supported_extensions: List[str] = [
        '.md', '.txt', '.py', '.js', '.ts', '.jsx', '.tsx', 
        '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb',
        '.go', '.rs', '.swift', '.kt', '.scala', '.r',
        '.sql', '.yaml', '.yml', '.json', '.xml', '.html',
        '.css', '.scss', '.sass', '.less', '.sh', '.bash',
        '.dockerfile', '.gitignore', '.readme'
    ]
    exclude_patterns: List[str] = [
        'node_modules', '.git', '__pycache__', '.pytest_cache',
        'dist', 'build', 'target', 'bin', 'obj', '.vscode',
        '.idea', '.DS_Store', '*.log', '*.tmp', '*.temp'
    ]


class GitHubFetcher(BaseAgent):
    """Agent for fetching content from GitHub repositories"""
    
    def __init__(self, config: GitHubFetcherConfig):
        super().__init__(config)
        self.github = Github(config.github_token) if config.github_token else None
        self.config = config
    
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate GitHub input data"""
        if not self.github:
            return False
            
        required_fields = ['repository', 'branch', 'paths']
        return all(field in input_data for field in required_fields)
    
    def should_exclude_path(self, path: str) -> bool:
        """Check if path should be excluded"""
        path_lower = path.lower()
        for pattern in self.config.exclude_patterns:
            if pattern in path_lower:
                return True
        return False
    
    def is_supported_file(self, path: str) -> bool:
        """Check if file is supported"""
        _, ext = os.path.splitext(path.lower())
        return ext in self.config.supported_extensions or path.lower().endswith(tuple(self.config.supported_extensions))
    
    def fetch_file_content(self, repo, path: str, branch: str) -> Optional[Dict[str, Any]]:
        """Fetch content of a single file"""
        try:
            file_content = repo.get_contents(path, ref=branch)
            
            # Check file size
            if file_content.size > self.config.max_file_size:
                self.log_warning(f"File too large, skipping", path=path, size=file_content.size)
                return None
            
            # Decode content
            if file_content.encoding == 'base64':
                content = base64.b64decode(file_content.content).decode('utf-8', errors='ignore')
            else:
                content = file_content.content
            
            return {
                'path': path,
                'content': content,
                'size': file_content.size,
                'sha': file_content.sha,
                'url': file_content.html_url,
                'download_url': file_content.download_url
            }
            
        except GithubException as e:
            self.log_error(f"Error fetching file", path=path, error=e)
            return None
        except Exception as e:
            self.log_error(f"Unexpected error fetching file", path=path, error=e)
            return None
    
    def fetch_directory_contents(self, repo, path: str, branch: str) -> List[Dict[str, Any]]:
        """Recursively fetch contents of a directory"""
        files = []
        
        try:
            contents = repo.get_contents(path, ref=branch)
            
            for item in contents:
                if item.type == 'file':
                    if self.is_supported_file(item.path) and not self.should_exclude_path(item.path):
                        file_data = self.fetch_file_content(repo, item.path, branch)
                        if file_data:
                            files.append(file_data)
                elif item.type == 'dir':
                    # Recursively fetch subdirectory contents
                    sub_files = self.fetch_directory_contents(repo, item.path, branch)
                    files.extend(sub_files)
                    
        except GithubException as e:
            self.log_error(f"Error fetching directory", path=path, error=e)
        except Exception as e:
            self.log_error(f"Unexpected error fetching directory", path=path, error=e)
        
        return files
    
    def process(self, input_data: Dict[str, Any]) -> List[RawDocument]:
        """Process GitHub repository data"""
        repository = input_data['repository']
        branch = input_data['branch']
        paths = input_data.get('paths', [''])
        repository_id = input_data.get('repository_id')
        specific_files = input_data.get('files', [])
        
        self.log_info("Starting GitHub content fetch", 
                     repository=repository, 
                     branch=branch, 
                     paths=paths,
                     specific_files_count=len(specific_files) if specific_files else 0)
        
        try:
            # Get repository
            repo = self.github.get_repo(repository)
            documents = []
            
            # Handle specific files if provided
            if specific_files:
                self.log_info("Processing specific files", count=len(specific_files))
                for file_path in specific_files:
                    if not isinstance(file_path, str):
                        file_path = file_path.get('path', '') if hasattr(file_path, 'get') else str(file_path)
                    
                    if not file_path:
                        continue
                        
                    try:
                        file_data = self.fetch_file_content(repo, file_path, branch)
                        if file_data and file_data['content']:
                            document = RawDocument(
                                id=f"{repository_id}:{branch}:{file_path}",
                                source_type=SourceType.GITHUB,
                                source_url=file_data['url'],
                                content=file_data['content'],
                                metadata={
                                    'path': file_data['path'],
                                    'size': file_data['size'],
                                    'sha': file_data['sha'],
                                    'download_url': file_data['download_url'],
                                    'repository': repository,
                                    'branch': branch,
                                    'imported_at': datetime.utcnow().isoformat()
                                },
                                repository_id=repository_id,
                                branch=branch,
                                status=DocumentStatus.RAW
                            )
                            documents.append(document)
                    except Exception as e:
                        self.log_error(f"Error processing file", path=file_path, error=str(e))
                
                return documents
            
            # Handle directory/path based imports
            for path in paths:
                self.log_info("Fetching content from path", path=path)
                
                if path == '' or path == '/':
                    # Fetch all files in repository
                    files = self.fetch_directory_contents(repo, '', branch)
                else:
                    # Fetch specific path
                    try:
                        contents = repo.get_contents(path, ref=branch)
                        if isinstance(contents, list):
                            # Directory
                            files = self.fetch_directory_contents(repo, path, branch)
                        else:
                            # Single file
                            file_data = self.fetch_file_content(repo, path, branch)
                            files = [file_data] if file_data else []
                    except GithubException:
                        self.log_warning(f"Path not found, skipping", path=path)
                        files = []
                
                # Convert files to documents
                for file_data in files:
                    if file_data and file_data['content']:
                        document = RawDocument(
                            id=f"{repository_id}:{branch}:{file_data['path']}",
                            source_type=SourceType.GITHUB,
                            source_url=file_data['url'],
                            content=file_data['content'],
                            metadata={
                                'path': file_data['path'],
                                'size': file_data['size'],
                                'sha': file_data['sha'],
                                'download_url': file_data['download_url'],
                                'repository': repository,
                                'branch': branch,
                                'imported_at': datetime.utcnow().isoformat()
                            },
                            repository_id=repository_id,
                            branch=branch,
                            status=DocumentStatus.RAW
                        )
                        documents.append(document)
            
            self.log_info("GitHub content fetch completed", 
                         documents_count=len(documents), repository=repository)
            
            return documents
            
        except GithubException as e:
            self.log_error("GitHub API error", error=e, repository=repository)
            raise
        except Exception as e:
            self.log_error("Unexpected error in GitHub fetcher", error=e, repository=repository)
            raise
    
    def run(self, input_data: Dict[str, Any]) -> AgentResult:
        """Run GitHub fetcher with error handling"""
        try:
            documents = self.process(input_data)
            return AgentResult(
                success=True,
                data=documents,
                metadata={
                    'repository': input_data.get('repository'),
                    'branch': input_data.get('branch'),
                    'documents_count': len(documents)
                }
            )
        except Exception as e:
            return AgentResult(
                success=False,
                error_message=str(e),
                metadata={
                    'repository': input_data.get('repository'),
                    'branch': input_data.get('branch')
                }
            ) 