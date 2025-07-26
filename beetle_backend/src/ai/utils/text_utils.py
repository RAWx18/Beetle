import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter
import unicodedata
import string

logger = logging.getLogger(__name__)


class TextUtils:
    """Utility functions for text processing and analysis"""
    
    def __init__(self):
        self.stop_words = self._load_stop_words()
        self.punctuation = string.punctuation
    
    def _load_stop_words(self) -> set:
        """Load common stop words"""
        # Basic English stop words - can be expanded with NLTK or other libraries
        stop_words = {
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'i', 'you', 'your', 'they', 'have',
            'this', 'but', 'not', 'or', 'what', 'all', 'were', 'we', 'when',
            'there', 'can', 'an', 'said', 'each', 'which', 'she', 'do', 'how',
            'their', 'if', 'up', 'out', 'many', 'then', 'them', 'these', 'so',
            'some', 'her', 'would', 'make', 'like', 'into', 'him', 'time', 'two',
            'more', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been',
            'call', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did',
            'get', 'come', 'made', 'may', 'part'
        }
        return stop_words
    
    def clean_text(self, text: str, remove_punctuation: bool = True, remove_numbers: bool = False, 
                   normalize_whitespace: bool = True, lowercase: bool = True) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Convert to lowercase
        if lowercase:
            text = text.lower()
        
        # Normalize unicode characters
        text = unicodedata.normalize('NFKC', text)
        
        # Remove punctuation
        if remove_punctuation:
            text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remove numbers
        if remove_numbers:
            text = re.sub(r'\d+', ' ', text)
        
        # Normalize whitespace
        if normalize_whitespace:
            text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def extract_keywords(self, text: str, max_keywords: int = 10, 
                        remove_stop_words: bool = True, min_length: int = 3) -> List[str]:
        """Extract keywords from text"""
        if not text:
            return []
        
        # Clean text
        cleaned_text = self.clean_text(text, remove_punctuation=True, remove_numbers=True)
        
        # Split into words
        words = cleaned_text.split()
        
        # Filter words
        filtered_words = []
        for word in words:
            if len(word) >= min_length:
                if not remove_stop_words or word not in self.stop_words:
                    filtered_words.append(word)
        
        # Count word frequencies
        word_counts = Counter(filtered_words)
        
        # Return top keywords
        keywords = [word for word, count in word_counts.most_common(max_keywords)]
        
        return keywords
    
    def extract_sentences(self, text: str) -> List[str]:
        """Extract sentences from text"""
        if not text:
            return []
        
        # Simple sentence splitting - can be enhanced with NLTK
        sentences = re.split(r'[.!?]+', text)
        
        # Clean and filter sentences
        cleaned_sentences = []
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence and len(sentence) > 10:  # Minimum sentence length
                cleaned_sentences.append(sentence)
        
        return cleaned_sentences
    
    def extract_paragraphs(self, text: str) -> List[str]:
        """Extract paragraphs from text"""
        if not text:
            return []
        
        # Split by double newlines
        paragraphs = re.split(r'\n\s*\n', text)
        
        # Clean and filter paragraphs
        cleaned_paragraphs = []
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if paragraph and len(paragraph) > 20:  # Minimum paragraph length
                cleaned_paragraphs.append(paragraph)
        
        return cleaned_paragraphs
    
    def calculate_text_statistics(self, text: str) -> Dict[str, Any]:
        """Calculate various text statistics"""
        if not text:
            return {
                "characters": 0,
                "words": 0,
                "sentences": 0,
                "paragraphs": 0,
                "unique_words": 0,
                "average_word_length": 0,
                "average_sentence_length": 0,
                "readability_score": 0,
            }
        
        # Basic statistics
        characters = len(text)
        words = len(text.split())
        sentences = len(self.extract_sentences(text))
        paragraphs = len(self.extract_paragraphs(text))
        
        # Unique words
        cleaned_text = self.clean_text(text, remove_punctuation=True, remove_numbers=True)
        unique_words = len(set(cleaned_text.split()))
        
        # Average word length
        word_lengths = [len(word) for word in cleaned_text.split() if word]
        average_word_length = sum(word_lengths) / len(word_lengths) if word_lengths else 0
        
        # Average sentence length
        average_sentence_length = words / sentences if sentences > 0 else 0
        
        # Simple readability score (Flesch Reading Ease approximation)
        readability_score = self._calculate_readability_score(words, sentences, characters)
        
        return {
            "characters": characters,
            "words": words,
            "sentences": sentences,
            "paragraphs": paragraphs,
            "unique_words": unique_words,
            "average_word_length": round(average_word_length, 2),
            "average_sentence_length": round(average_sentence_length, 2),
            "readability_score": round(readability_score, 2),
        }
    
    def _calculate_readability_score(self, words: int, sentences: int, characters: int) -> float:
        """Calculate a simple readability score"""
        if words == 0 or sentences == 0:
            return 0
        
        # Simplified Flesch Reading Ease
        avg_sentence_length = words / sentences
        avg_syllables_per_word = characters / words * 0.3  # Rough approximation
        
        score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
        return max(0, min(100, score))
    
    def detect_language(self, text: str) -> Optional[str]:
        """Detect language of text using simple heuristics"""
        if not text:
            return None
        
        # Language detection patterns
        patterns = {
            "english": [
                r'\b(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use)\b',
            ],
            "spanish": [
                r'\b(el|la|de|que|y|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|al|del|los|las|una|como|más|pero|sus|me|hasta|hay|donde|han|quien|están|estado|desde|todo|nos|durante|todos|uno|les|ni|contra|otros|ese|eso|ante|ellos|e|esto|mí|antes|algunos|qué|unos|yo|otro|otras|otra|él|tanto|esa|estos|mucho|quienes|nada|muchos|cual|poco|ella|estar|estas|algunas|algo|nosotros)\b',
            ],
            "french": [
                r'\b(le|de|un|être|et|en|avoir|il|ne|pas|se|des|son|que|qui|ce|dans|une|au|du|par|pour|ne|ce|sur|qui|est|sont|avec|sa|ses|mais|comme|on|était|tout|nous|avait|à|y|fait|aussi|elle|deux|même|encore|cette|depuis|parce|sans|entre|moins|peut|tous|leur|selon|deux|premier|déjà|plusieurs|vers|non|cette|faire|dire|elle|nous|aux|même|votre|leur|peu|très|mon|nous|tout|nous|faire|dire|elle|nous|aux|même|votre|leur|peu|très|mon|nous|tout)\b',
            ],
            "german": [
                r'\b(der|die|und|in|den|von|zu|das|mit|sich|des|auf|für|ist|im|dem|nicht|ein|eine|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei|einer|um|am|noch|wie|einem|über|einen|so|zum|war|haben|nur|oder|aber|vor|zur|bis|mehr|durch|man|sein|wird|bei|einer|um|am|noch|wie|einem|über|einen|so|zum|war|haben|nur|oder|aber|vor|zur|bis|mehr|durch|man|sein)\b',
            ],
            "italian": [
                r'\b(il|la|di|che|e|in|un|è|per|sono|con|non|ha|dal|dal|su|si|al|del|le|da|una|anche|ma|come|più|questo|nella|nella|tra|gli|della|della|delle|delle|degli|degli|dello|dello|della|della|delle|delle|degli|degli|dello|dello|della|della|delle|delle|degli|degli|dello|dello|della|della|delle|delle|degli|degli|dello|dello)\b',
            ],
        }
        
        # Count matches for each language
        language_scores = {}
        
        for language, language_patterns in patterns.items():
            score = 0
            for pattern in language_patterns:
                matches = re.findall(pattern, text.lower())
                score += len(matches)
            language_scores[language] = score
        
        # Return language with highest score
        if language_scores:
            best_language = max(language_scores, key=language_scores.get)
            if language_scores[best_language] > 5:  # Minimum threshold
                return best_language
        
        return None
    
    def calculate_similarity(self, text1: str, text2: str, method: str = "cosine") -> float:
        """Calculate similarity between two texts"""
        if not text1 or not text2:
            return 0.0
        
        if method == "cosine":
            return self._cosine_similarity(text1, text2)
        elif method == "jaccard":
            return self._jaccard_similarity(text1, text2)
        elif method == "levenshtein":
            return self._levenshtein_similarity(text1, text2)
        else:
            raise ValueError(f"Unknown similarity method: {method}")
    
    def _cosine_similarity(self, text1: str, text2: str) -> float:
        """Calculate cosine similarity between two texts"""
        # Clean and tokenize texts
        words1 = set(self.clean_text(text1, remove_punctuation=True).split())
        words2 = set(self.clean_text(text2, remove_punctuation=True).split())
        
        # Calculate intersection and union
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        if not union:
            return 0.0
        
        return len(intersection) / len(union)
    
    def _jaccard_similarity(self, text1: str, text2: str) -> float:
        """Calculate Jaccard similarity between two texts"""
        # Clean and tokenize texts
        words1 = set(self.clean_text(text1, remove_punctuation=True).split())
        words2 = set(self.clean_text(text2, remove_punctuation=True).split())
        
        # Calculate intersection and union
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        if not union:
            return 0.0
        
        return len(intersection) / len(union)
    
    def _levenshtein_similarity(self, text1: str, text2: str) -> float:
        """Calculate Levenshtein similarity between two texts"""
        def levenshtein_distance(s1: str, s2: str) -> int:
            if len(s1) < len(s2):
                return levenshtein_distance(s2, s1)
            
            if len(s2) == 0:
                return len(s1)
            
            previous_row = list(range(len(s2) + 1))
            for i, c1 in enumerate(s1):
                current_row = [i + 1]
                for j, c2 in enumerate(s2):
                    insertions = previous_row[j + 1] + 1
                    deletions = current_row[j] + 1
                    substitutions = previous_row[j] + (c1 != c2)
                    current_row.append(min(insertions, deletions, substitutions))
                previous_row = current_row
            
            return previous_row[-1]
        
        distance = levenshtein_distance(text1, text2)
        max_length = max(len(text1), len(text2))
        
        if max_length == 0:
            return 1.0
        
        return 1.0 - (distance / max_length)
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract basic entities from text using regex patterns"""
        entities = {
            "emails": [],
            "urls": [],
            "phone_numbers": [],
            "dates": [],
            "numbers": [],
        }
        
        # Extract emails
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        entities["emails"] = re.findall(email_pattern, text)
        
        # Extract URLs
        url_pattern = r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?'
        entities["urls"] = re.findall(url_pattern, text)
        
        # Extract phone numbers
        phone_pattern = r'(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        entities["phone_numbers"] = re.findall(phone_pattern, text)
        
        # Extract dates
        date_patterns = [
            r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',
            r'\d{4}[/-]\d{1,2}[/-]\d{1,2}',
            r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b',
        ]
        for pattern in date_patterns:
            entities["dates"].extend(re.findall(pattern, text, re.IGNORECASE))
        
        # Extract numbers
        number_pattern = r'\b\d+(?:\.\d+)?\b'
        entities["numbers"] = re.findall(number_pattern, text)
        
        return entities
    
    def summarize_text(self, text: str, max_sentences: int = 3) -> str:
        """Create a simple summary of text"""
        if not text:
            return ""
        
        # Extract sentences
        sentences = self.extract_sentences(text)
        
        if not sentences:
            return text[:200] + "..." if len(text) > 200 else text
        
        # Simple scoring based on word frequency
        word_freq = Counter()
        for sentence in sentences:
            words = self.clean_text(sentence, remove_punctuation=True).split()
            word_freq.update(words)
        
        # Score sentences
        sentence_scores = []
        for sentence in sentences:
            words = self.clean_text(sentence, remove_punctuation=True).split()
            score = sum(word_freq[word] for word in words)
            sentence_scores.append((sentence, score))
        
        # Sort by score and take top sentences
        sentence_scores.sort(key=lambda x: x[1], reverse=True)
        top_sentences = sentence_scores[:max_sentences]
        
        # Sort by original order
        top_sentences.sort(key=lambda x: sentences.index(x[0]))
        
        # Join sentences
        summary = " ".join(sentence for sentence, _ in top_sentences)
        
        return summary
    
    def extract_topics(self, text: str, num_topics: int = 5) -> List[str]:
        """Extract main topics from text"""
        if not text:
            return []
        
        # Extract keywords
        keywords = self.extract_keywords(text, max_keywords=num_topics * 2)
        
        # Group related keywords (simple approach)
        topics = []
        for keyword in keywords:
            if len(topics) >= num_topics:
                break
            
            # Check if keyword is similar to existing topics
            is_similar = False
            for topic in topics:
                if self.calculate_similarity(keyword, topic) > 0.7:
                    is_similar = True
                    break
            
            if not is_similar:
                topics.append(keyword)
        
        return topics[:num_topics]
    
    def normalize_text(self, text: str) -> str:
        """Normalize text for consistent processing"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Normalize unicode
        text = unicodedata.normalize('NFKC', text)
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove extra punctuation
        text = re.sub(r'[^\w\s]', ' ', text)
        
        return text 