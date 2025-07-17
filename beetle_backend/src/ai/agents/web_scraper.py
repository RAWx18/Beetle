import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio
from playwright.async_api import async_playwright, Browser, Page
import trafilatura
from urllib.parse import urljoin, urlparse
from ..models.document import RawDocument, SourceType, DocumentStatus
from .base_agent import BaseAgent, AgentConfig, AgentResult


class WebScraperConfig(AgentConfig):
    """Configuration for web scraper agent"""
    max_pages: int = 10
    max_depth: int = 2
    timeout: int = 30000  # 30 seconds
    user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    wait_for_selector: Optional[str] = None
    extract_links: bool = True
    follow_same_domain: bool = True
    content_selectors: List[str] = [
        'article', 'main', '.content', '.post', '.entry',
        'div[role="main"]', '.article', '.blog-post'
    ]
    exclude_selectors: List[str] = [
        'nav', 'header', 'footer', '.sidebar', '.menu',
        '.advertisement', '.ads', '.social', '.comments'
    ]


class WebScraper(BaseAgent):
    """Agent for scraping content from websites"""
    
    def __init__(self, config: WebScraperConfig):
        super().__init__(config)
        self.config = config
        self.browser: Optional[Browser] = None
        self.visited_urls = set()
    
    async def setup_browser(self):
        """Setup Playwright browser"""
        if not self.browser:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
    
    async def cleanup_browser(self):
        """Cleanup browser resources"""
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()
    
    def is_same_domain(self, base_url: str, url: str) -> bool:
        """Check if URL is from the same domain"""
        if not self.config.follow_same_domain:
            return True
        
        base_domain = urlparse(base_url).netloc
        url_domain = urlparse(url).netloc
        return base_domain == url_domain
    
    def extract_links(self, page: Page, base_url: str) -> List[str]:
        """Extract links from page"""
        if not self.config.extract_links:
            return []
        
        try:
            links = page.query_selector_all('a[href]')
            urls = []
            
            for link in links:
                href = link.get_attribute('href')
                if href:
                    full_url = urljoin(base_url, href)
                    if self.is_same_domain(base_url, full_url):
                        urls.append(full_url)
            
            return list(set(urls))  # Remove duplicates
            
        except Exception as e:
            self.log_error("Error extracting links", error=e, url=base_url)
            return []
    
    def clean_content(self, content: str) -> str:
        """Clean extracted content"""
        if not content:
            return ""
        
        # Remove extra whitespace
        content = ' '.join(content.split())
        
        # Remove very short content
        if len(content) < 50:
            return ""
        
        return content
    
    async def scrape_page(self, page: Page, url: str) -> Optional[Dict[str, Any]]:
        """Scrape content from a single page"""
        try:
            self.log_info("Scraping page", url=url)
            
            # Navigate to page
            await page.goto(url, timeout=self.config.timeout)
            
            # Wait for content to load
            if self.config.wait_for_selector:
                try:
                    await page.wait_for_selector(self.config.wait_for_selector, timeout=5000)
                except:
                    pass  # Continue even if selector not found
            
            # Get page title
            title = await page.title()
            
            # Extract content using trafilatura
            html_content = await page.content()
            extracted_content = trafilatura.extract(html_content)
            
            if not extracted_content:
                # Fallback: try content selectors
                for selector in self.config.content_selectors:
                    try:
                        element = page.query_selector(selector)
                        if element:
                            extracted_content = await element.inner_text()
                            break
                    except:
                        continue
            
            if not extracted_content:
                # Last resort: get body text
                try:
                    body = page.query_selector('body')
                    if body:
                        extracted_content = await body.inner_text()
                except:
                    pass
            
            # Clean content
            cleaned_content = self.clean_content(extracted_content)
            
            if not cleaned_content:
                self.log_warning("No content extracted", url=url)
                return None
            
            # Extract links if enabled
            links = self.extract_links(page, url) if self.config.extract_links else []
            
            return {
                'url': url,
                'title': title,
                'content': cleaned_content,
                'links': links,
                'html': html_content
            }
            
        except Exception as e:
            self.log_error("Error scraping page", error=e, url=url)
            return None
    
    async def scrape_recursive(self, page: Page, url: str, depth: int = 0) -> List[Dict[str, Any]]:
        """Recursively scrape pages"""
        if depth > self.config.max_depth or url in self.visited_urls:
            return []
        
        self.visited_urls.add(url)
        pages = []
        
        # Scrape current page
        page_data = await self.scrape_page(page, url)
        if page_data:
            pages.append(page_data)
        
        # Follow links if within depth limit
        if depth < self.config.max_depth and page_data and page_data.get('links'):
            for link in page_data['links'][:self.config.max_pages]:
                if link not in self.visited_urls:
                    sub_pages = await self.scrape_recursive(page, link, depth + 1)
                    pages.extend(sub_pages)
        
        return pages
    
    async def process_async(self, input_data: Dict[str, Any]) -> List[RawDocument]:
        """Async process method"""
        urls = input_data.get('urls', [])
        repository_id = input_data.get('repository_id')
        branch = input_data.get('branch')
        
        if not urls:
            return []
        
        await self.setup_browser()
        
        try:
            page = await self.browser.new_page()
            await page.set_user_agent(self.config.user_agent)
            
            documents = []
            
            for url in urls:
                self.log_info("Starting web scraping", url=url)
                
                # Reset visited URLs for each starting URL
                self.visited_urls.clear()
                
                # Scrape pages
                pages = await self.scrape_recursive(page, url)
                
                # Convert to documents
                for page_data in pages:
                    document = RawDocument(
                        id=str(uuid.uuid4()),
                        source_type=SourceType.WEB,
                        source_url=page_data['url'],
                        content=page_data['content'],
                        metadata={
                            'title': page_data['title'],
                            'links': page_data['links'],
                            'scraped_at': datetime.utcnow().isoformat()
                        },
                        repository_id=repository_id,
                        branch=branch,
                        status=DocumentStatus.RAW
                    )
                    documents.append(document)
            
            await page.close()
            return documents
            
        finally:
            await self.cleanup_browser()
    
    def process(self, input_data: Dict[str, Any]) -> List[RawDocument]:
        """Process web scraping data"""
        # Run async process in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.process_async(input_data))
        finally:
            loop.close()
    
    def run(self, input_data: Dict[str, Any]) -> AgentResult:
        """Run web scraper with error handling"""
        try:
            documents = self.process(input_data)
            return AgentResult(
                success=True,
                data=documents,
                metadata={
                    'urls': input_data.get('urls', []),
                    'documents_count': len(documents)
                }
            )
        except Exception as e:
            return AgentResult(
                success=False,
                error_message=str(e),
                metadata={
                    'urls': input_data.get('urls', [])
                }
            ) 