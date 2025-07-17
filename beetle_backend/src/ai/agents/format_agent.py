import re
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
import html
from bs4 import BeautifulSoup
import langdetect
from ..models.document import RawDocument, NormalizedDocument, SourceType, DocumentStatus
from .base_agent import BaseAgent, AgentConfig, AgentResult


class FormatAgentConfig(AgentConfig):
    """Configuration for format agent"""
    min_content_length: int = 50
    max_content_length: int = 100000
    remove_html: bool = True
    remove_urls: bool = False
    remove_emails: bool = False
    remove_phone_numbers: bool = False
    normalize_whitespace: bool = True
    detect_language: bool = True
    generate_summary: bool = True
    summary_max_length: int = 200
    extract_tags: bool = True
    common_tags: List[str] = [
        'code', 'documentation', 'readme', 'api', 'config', 'test',
        'frontend', 'backend', 'database', 'deployment', 'security',
        'performance', 'bug', 'feature', 'refactor', 'docs'
    ]


class FormatAgent(BaseAgent):
    """Agent for normalizing and cleaning raw documents"""
    
    def __init__(self, config: FormatAgentConfig):
        super().__init__(config)
        self.config = config
    
    def clean_html(self, content: str) -> str:
        """Remove HTML tags and entities"""
        if not self.config.remove_html:
            return content
        
        # Decode HTML entities
        content = html.unescape(content)
        
        # Remove HTML tags
        soup = BeautifulSoup(content, 'html.parser')
        content = soup.get_text()
        
        return content
    
    def clean_urls(self, content: str) -> str:
        """Remove URLs from content"""
        if not self.config.remove_urls:
            return content
        
        # Remove URLs
        url_pattern = r'https?://[^\s]+'
        content = re.sub(url_pattern, '', content)
        
        return content
    
    def clean_emails(self, content: str) -> str:
        """Remove email addresses from content"""
        if not self.config.remove_emails:
            return content
        
        # Remove email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        content = re.sub(email_pattern, '', content)
        
        return content
    
    def clean_phone_numbers(self, content: str) -> str:
        """Remove phone numbers from content"""
        if not self.config.remove_phone_numbers:
            return content
        
        # Remove phone numbers
        phone_pattern = r'(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        content = re.sub(phone_pattern, '', content)
        
        return content
    
    def normalize_whitespace(self, content: str) -> str:
        """Normalize whitespace in content"""
        if not self.config.normalize_whitespace:
            return content
        
        # Replace multiple whitespace with single space
        content = re.sub(r'\s+', ' ', content)
        
        # Remove leading/trailing whitespace
        content = content.strip()
        
        return content
    
    def detect_language(self, content: str) -> Optional[str]:
        """Detect language of content"""
        if not self.config.detect_language:
            return None
        
        try:
            # Use first 1000 characters for language detection
            sample = content[:1000]
            if len(sample) < 50:
                return None
            
            lang = langdetect.detect(sample)
            return lang
        except:
            return None
    
    def generate_summary(self, content: str) -> Optional[str]:
        """Generate a summary of the content"""
        if not self.config.generate_summary:
            return None
        
        # Simple summary: first few sentences
        sentences = re.split(r'[.!?]+', content)
        summary = '. '.join(sentences[:3]).strip()
        
        if len(summary) > self.config.summary_max_length:
            summary = summary[:self.config.summary_max_length] + '...'
        
        return summary if summary else None
    
    def extract_tags(self, content: str, metadata: Dict[str, Any]) -> List[str]:
        """Extract tags from content and metadata"""
        if not self.config.extract_tags:
            return []
        
        tags = set()
        content_lower = content.lower()
        
        # Extract from common tags
        for tag in self.config.common_tags:
            if tag.lower() in content_lower:
                tags.add(tag)
        
        # Extract from file extensions
        if 'path' in metadata:
            path = metadata['path'].lower()
            if path.endswith('.md'):
                tags.add('markdown')
            elif path.endswith('.py'):
                tags.add('python')
            elif path.endswith(('.js', '.jsx')):
                tags.add('javascript')
            elif path.endswith(('.ts', '.tsx')):
                tags.add('typescript')
            elif path.endswith('.json'):
                tags.add('json')
            elif path.endswith('.yaml') or path.endswith('.yml'):
                tags.add('yaml')
            elif path.endswith('.sql'):
                tags.add('sql')
            elif path.endswith('.html'):
                tags.add('html')
            elif path.endswith('.css'):
                tags.add('css')
        
        # Extract from source type
        if metadata.get('source_type') == SourceType.GITHUB:
            tags.add('github')
        elif metadata.get('source_type') == SourceType.WEB:
            tags.add('web')
        
        # Extract from content patterns
        if re.search(r'function\s+\w+\s*\(', content):
            tags.add('function')
        if re.search(r'class\s+\w+', content):
            tags.add('class')
        if re.search(r'import\s+', content):
            tags.add('import')
        if re.search(r'#\s+', content):
            tags.add('heading')
        if re.search(r'```', content):
            tags.add('code-block')
        
        return list(tags)
    
    def extract_title(self, content: str, metadata: Dict[str, Any]) -> Optional[str]:
        """Extract title from content or metadata"""
        # Try to get title from metadata first
        if 'title' in metadata:
            return metadata['title']
        
        # Extract from first heading
        heading_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        if heading_match:
            return heading_match.group(1).strip()
        
        # Extract from first line if it looks like a title
        lines = content.split('\n')
        if lines and len(lines[0].strip()) < 100 and not lines[0].strip().startswith('#'):
            return lines[0].strip()
        
        return None
    
    def count_words(self, content: str) -> int:
        """Count words in content"""
        words = re.findall(r'\b\w+\b', content)
        return len(words)
    
    def validate_content(self, content: str) -> bool:
        """Validate content meets requirements"""
        if not content:
            return False
        
        if len(content) < self.config.min_content_length:
            return False
        
        if len(content) > self.config.max_content_length:
            return False
        
        return True
    
    def process(self, raw_documents: List[RawDocument]) -> List[NormalizedDocument]:
        """Process raw documents and normalize them"""
        self.log_info("Starting document normalization", count=len(raw_documents))
        
        normalized_documents = []
        
        for raw_doc in raw_documents:
            try:
                # Clean content
                content = raw_doc.content
                content = self.clean_html(content)
                content = self.clean_urls(content)
                content = self.clean_emails(content)
                content = self.clean_phone_numbers(content)
                content = self.normalize_whitespace(content)
                
                # Validate content
                if not self.validate_content(content):
                    self.log_warning("Content validation failed, skipping", 
                                   doc_id=raw_doc.id, content_length=len(content))
                    continue
                
                # Extract metadata
                title = self.extract_title(content, raw_doc.metadata)
                language = self.detect_language(content)
                summary = self.generate_summary(content)
                tags = self.extract_tags(content, raw_doc.metadata)
                word_count = self.count_words(content)
                
                # Create normalized document
                normalized_doc = NormalizedDocument(
                    id=raw_doc.id,
                    source_type=raw_doc.source_type,
                    source_url=raw_doc.source_url,
                    title=title,
                    content=content,
                    summary=summary,
                    tags=tags,
                    language=language,
                    word_count=word_count,
                    metadata={
                        **raw_doc.metadata,
                        'normalized_at': datetime.utcnow().isoformat(),
                        'original_length': len(raw_doc.content),
                        'cleaned_length': len(content)
                    },
                    timestamp=datetime.utcnow(),
                    repository_id=raw_doc.repository_id,
                    branch=raw_doc.branch,
                    status=DocumentStatus.NORMALIZED
                )
                
                normalized_documents.append(normalized_doc)
                
            except Exception as e:
                self.log_error("Error normalizing document", error=e, doc_id=raw_doc.id)
                # Create error document
                error_doc = NormalizedDocument(
                    id=raw_doc.id,
                    source_type=raw_doc.source_type,
                    source_url=raw_doc.source_url,
                    content="",
                    word_count=0,
                    metadata=raw_doc.metadata,
                    timestamp=datetime.utcnow(),
                    repository_id=raw_doc.repository_id,
                    branch=raw_doc.branch,
                    status=DocumentStatus.ERROR,
                    error_message=str(e)
                )
                normalized_documents.append(error_doc)
        
        self.log_info("Document normalization completed", 
                     input_count=len(raw_documents),
                     output_count=len(normalized_documents))
        
        return normalized_documents
    
    def run(self, input_data: List[RawDocument]) -> AgentResult:
        """Run format agent with error handling"""
        try:
            normalized_docs = self.process(input_data)
            return AgentResult(
                success=True,
                data=normalized_docs,
                metadata={
                    'input_count': len(input_data),
                    'output_count': len(normalized_docs),
                    'successful_count': len([d for d in normalized_docs if d.status == DocumentStatus.NORMALIZED])
                }
            )
        except Exception as e:
            return AgentResult(
                success=False,
                error_message=str(e),
                metadata={
                    'input_count': len(input_data) if input_data else 0
                }
            ) 