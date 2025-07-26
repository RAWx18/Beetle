import ast
import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import tokenize
from io import StringIO

logger = logging.getLogger(__name__)


class CodeUtils:
    """Utility functions for code analysis and processing"""
    
    def __init__(self):
        self.language_extensions = {
            "python": [".py", ".pyw", ".pyx", ".pxd"],
            "javascript": [".js", ".jsx", ".mjs"],
            "typescript": [".ts", ".tsx"],
            "java": [".java"],
            "cpp": [".cpp", ".cc", ".cxx", ".hpp", ".hh", ".hxx"],
            "c": [".c", ".h"],
            "go": [".go"],
            "rust": [".rs"],
            "php": [".php"],
            "ruby": [".rb"],
            "swift": [".swift"],
            "kotlin": [".kt", ".kts"],
            "scala": [".scala"],
            "r": [".r", ".R"],
            "matlab": [".m"],
            "sql": [".sql"],
            "shell": [".sh", ".bash", ".zsh", ".fish"],
            "yaml": [".yaml", ".yml"],
            "json": [".json"],
            "xml": [".xml"],
            "html": [".html", ".htm"],
            "css": [".css", ".scss", ".sass", ".less"],
        }
    
    def detect_language_from_filename(self, filename: str) -> Optional[str]:
        """Detect programming language from filename"""
        if not filename:
            return None
        
        file_path = Path(filename)
        extension = file_path.suffix.lower()
        
        for language, extensions in self.language_extensions.items():
            if extension in extensions:
                return language
        
        return None
    
    def detect_language_from_content(self, content: str) -> Optional[str]:
        """Detect programming language from content patterns"""
        if not content:
            return None
        
        # Language-specific patterns
        patterns = {
            "python": [
                r'def\s+\w+\s*\(',
                r'import\s+\w+',
                r'from\s+\w+\s+import',
                r'class\s+\w+.*:',
                r'if\s+__name__\s*==\s*[\'"]__main__[\'"]',
                r'print\s*\(',
            ],
            "javascript": [
                r'function\s+\w+',
                r'const\s+\w+',
                r'let\s+\w+',
                r'var\s+\w+',
                r'console\.log',
                r'export\s+default',
                r'import\s+.*\s+from',
            ],
            "typescript": [
                r'interface\s+\w+',
                r'type\s+\w+',
                r':\s*\w+\[\]',
                r'Promise<\w+>',
                r'export\s+interface',
            ],
            "java": [
                r'public\s+class',
                r'private\s+\w+',
                r'public\s+static\s+void\s+main',
                r'import\s+java\.',
                r'System\.out\.println',
            ],
            "cpp": [
                r'#include\s*<',
                r'std::',
                r'namespace\s+\w+',
                r'class\s+\w+\s*{',
                r'cout\s*<<',
            ],
            "c": [
                r'#include\s*<',
                r'int\s+main\s*\(',
                r'printf\s*\(',
                r'struct\s+\w+',
            ],
            "go": [
                r'package\s+\w+',
                r'func\s+\w+',
                r'import\s*\(',
                r'fmt\.',
            ],
            "rust": [
                r'fn\s+\w+',
                r'use\s+\w+',
                r'pub\s+fn',
                r'let\s+mut\s+\w+',
            ],
            "php": [
                r'<\?php',
                r'function\s+\w+',
                r'\$\w+',
                r'echo\s+',
            ],
            "ruby": [
                r'def\s+\w+',
                r'class\s+\w+',
                r'puts\s+',
                r'require\s+',
            ],
            "swift": [
                r'func\s+\w+',
                r'class\s+\w+',
                r'import\s+\w+',
                r'print\s*\(',
            ],
            "kotlin": [
                r'fun\s+\w+',
                r'class\s+\w+',
                r'import\s+\w+',
                r'println\s*\(',
            ],
            "scala": [
                r'def\s+\w+',
                r'class\s+\w+',
                r'import\s+\w+',
                r'println\s*\(',
            ],
            "r": [
                r'function\s*\(',
                r'library\s*\(',
                r'print\s*\(',
                r'cat\s*\(',
            ],
            "matlab": [
                r'function\s+\w+',
                r'fprintf\s*\(',
                r'disp\s*\(',
            ],
            "sql": [
                r'SELECT\s+',
                r'INSERT\s+INTO',
                r'UPDATE\s+',
                r'CREATE\s+TABLE',
            ],
            "shell": [
                r'#!/bin/',
                r'echo\s+',
                r'if\s+\[\s*',
                r'for\s+\w+\s+in',
            ],
        }
        
        # Count matches for each language
        language_scores = {}
        
        for language, language_patterns in patterns.items():
            score = 0
            for pattern in language_patterns:
                matches = re.findall(pattern, content, re.MULTILINE | re.IGNORECASE)
                score += len(matches)
            language_scores[language] = score
        
        # Return language with highest score
        if language_scores:
            best_language = max(language_scores, key=language_scores.get)
            if language_scores[best_language] > 0:
                return best_language
        
        return None
    
    def parse_python_ast(self, content: str) -> Dict[str, Any]:
        """Parse Python code and extract AST information"""
        try:
            tree = ast.parse(content)
            return self._extract_ast_info(tree)
        except SyntaxError as e:
            logger.warning(f"Failed to parse Python AST: {e}")
            return {"error": str(e), "valid": False}
        except Exception as e:
            logger.error(f"Unexpected error parsing Python AST: {e}")
            return {"error": str(e), "valid": False}
    
    def _extract_ast_info(self, tree: ast.AST) -> Dict[str, Any]:
        """Extract information from Python AST"""
        info = {
            "valid": True,
            "functions": [],
            "classes": [],
            "imports": [],
            "variables": [],
            "total_lines": 0,
        }
        
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                func_info = {
                    "name": node.name,
                    "lineno": node.lineno,
                    "end_lineno": getattr(node, 'end_lineno', node.lineno),
                    "args": self._extract_function_args(node),
                    "decorators": [self._get_decorator_name(d) for d in node.decorator_list],
                    "has_docstring": ast.get_docstring(node) is not None,
                    "is_async": isinstance(node, ast.AsyncFunctionDef),
                }
                info["functions"].append(func_info)
            
            elif isinstance(node, ast.ClassDef):
                class_info = {
                    "name": node.name,
                    "lineno": node.lineno,
                    "end_lineno": getattr(node, 'end_lineno', node.lineno),
                    "bases": [self._get_base_name(base) for base in node.bases],
                    "decorators": [self._get_decorator_name(d) for d in node.decorator_list],
                    "has_docstring": ast.get_docstring(node) is not None,
                    "methods": self._extract_class_methods(node),
                }
                info["classes"].append(class_info)
            
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                import_info = {
                    "lineno": node.lineno,
                    "names": self._extract_import_names(node),
                    "is_from": isinstance(node, ast.ImportFrom),
                }
                info["imports"].append(import_info)
            
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        var_info = {
                            "name": target.id,
                            "lineno": node.lineno,
                            "value_type": type(node.value).__name__,
                        }
                        info["variables"].append(var_info)
            
            # Track total lines
            if hasattr(node, 'lineno'):
                info["total_lines"] = max(info["total_lines"], node.lineno)
        
        return info
    
    def _extract_function_args(self, node: ast.FunctionDef) -> List[Dict[str, Any]]:
        """Extract function arguments information"""
        args = []
        
        # Positional arguments
        for arg in node.args.args:
            arg_info = {
                "name": arg.arg,
                "type": "positional",
                "has_default": False,
                "annotation": self._get_annotation_name(arg.annotation) if arg.annotation else None,
            }
            args.append(arg_info)
        
        # Keyword arguments
        for arg in node.args.kwonlyargs:
            arg_info = {
                "name": arg.arg,
                "type": "keyword",
                "has_default": False,
                "annotation": self._get_annotation_name(arg.annotation) if arg.annotation else None,
            }
            args.append(arg_info)
        
        # Default values
        defaults = node.args.defaults
        kw_defaults = node.args.kw_defaults
        
        # Assign defaults to positional args
        for i, default in enumerate(defaults):
            if i < len(args):
                args[-(i + 1)]["has_default"] = True
        
        # Assign defaults to keyword args
        for i, default in enumerate(kw_defaults):
            if i < len(args):
                args[-(i + 1)]["has_default"] = True
        
        return args
    
    def _extract_class_methods(self, node: ast.ClassDef) -> List[Dict[str, Any]]:
        """Extract class methods information"""
        methods = []
        
        for child in node.body:
            if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
                method_info = {
                    "name": child.name,
                    "lineno": child.lineno,
                    "end_lineno": getattr(child, 'end_lineno', child.lineno),
                    "args": self._extract_function_args(child),
                    "decorators": [self._get_decorator_name(d) for d in child.decorator_list],
                    "has_docstring": ast.get_docstring(child) is not None,
                    "is_async": isinstance(child, ast.AsyncFunctionDef),
                }
                methods.append(method_info)
        
        return methods
    
    def _extract_import_names(self, node: ast.Import) -> List[str]:
        """Extract import names"""
        if isinstance(node, ast.Import):
            return [alias.name for alias in node.names]
        elif isinstance(node, ast.ImportFrom):
            return [alias.name for alias in node.names]
        return []
    
    def _get_decorator_name(self, decorator: ast.expr) -> str:
        """Get decorator name"""
        if isinstance(decorator, ast.Name):
            return decorator.id
        elif isinstance(decorator, ast.Attribute):
            return f"{self._get_attribute_name(decorator.value)}.{decorator.attr}"
        elif isinstance(decorator, ast.Call):
            return self._get_decorator_name(decorator.func)
        return "unknown"
    
    def _get_attribute_name(self, node: ast.expr) -> str:
        """Get attribute name"""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._get_attribute_name(node.value)}.{node.attr}"
        return "unknown"
    
    def _get_base_name(self, base: ast.expr) -> str:
        """Get base class name"""
        if isinstance(base, ast.Name):
            return base.id
        elif isinstance(base, ast.Attribute):
            return f"{self._get_attribute_name(base.value)}.{base.attr}"
        return "unknown"
    
    def _get_annotation_name(self, annotation: ast.expr) -> str:
        """Get type annotation name"""
        if isinstance(annotation, ast.Name):
            return annotation.id
        elif isinstance(annotation, ast.Attribute):
            return f"{self._get_attribute_name(annotation.value)}.{annotation.attr}"
        elif isinstance(annotation, ast.Subscript):
            return f"{self._get_annotation_name(annotation.value)}[{self._get_annotation_name(annotation.slice)}]"
        return "unknown"
    
    def extract_code_structure(self, content: str, language: str) -> Dict[str, Any]:
        """Extract code structure for various languages"""
        if language == "python":
            return self.parse_python_ast(content)
        else:
            return self._extract_generic_structure(content, language)
    
    def _extract_generic_structure(self, content: str, language: str) -> Dict[str, Any]:
        """Extract structure for non-Python languages using regex patterns"""
        structure = {
            "language": language,
            "functions": [],
            "classes": [],
            "imports": [],
            "total_lines": len(content.split('\n')),
        }
        
        lines = content.split('\n')
        
        # Language-specific patterns
        patterns = {
            "javascript": {
                "function": r'function\s+(\w+)\s*\(',
                "class": r'class\s+(\w+)',
                "import": r'import\s+(.+?)(?:from|;)',
            },
            "typescript": {
                "function": r'(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?\([^)]*\)\s*[:=]\s*(?:async\s+)?\w+)',
                "class": r'class\s+(\w+)',
                "import": r'import\s+(.+?)(?:from|;)',
            },
            "java": {
                "function": r'(?:public|private|protected)?\s*(?:static\s+)?\w+\s+(\w+)\s*\(',
                "class": r'class\s+(\w+)',
                "import": r'import\s+(.+?);',
            },
            "cpp": {
                "function": r'(?:void|int|string|bool|double|float)\s+(\w+)\s*\(',
                "class": r'class\s+(\w+)',
                "import": r'#include\s*[<"](.+?)[>"]',
            },
        }
        
        if language in patterns:
            lang_patterns = patterns[language]
            
            for i, line in enumerate(lines, 1):
                # Check for functions
                if "function" in lang_patterns:
                    func_match = re.search(lang_patterns["function"], line)
                    if func_match:
                        func_name = func_match.group(1) or func_match.group(2)
                        structure["functions"].append({
                            "name": func_name,
                            "lineno": i,
                            "line": line.strip(),
                        })
                
                # Check for classes
                if "class" in lang_patterns:
                    class_match = re.search(lang_patterns["class"], line)
                    if class_match:
                        class_name = class_match.group(1)
                        structure["classes"].append({
                            "name": class_name,
                            "lineno": i,
                            "line": line.strip(),
                        })
                
                # Check for imports
                if "import" in lang_patterns:
                    import_match = re.search(lang_patterns["import"], line)
                    if import_match:
                        import_name = import_match.group(1)
                        structure["imports"].append({
                            "name": import_name,
                            "lineno": i,
                            "line": line.strip(),
                        })
        
        return structure
    
    def validate_syntax(self, content: str, language: str) -> Dict[str, Any]:
        """Validate code syntax"""
        result = {
            "valid": False,
            "errors": [],
            "warnings": [],
        }
        
        if language == "python":
            return self._validate_python_syntax(content)
        else:
            return self._validate_generic_syntax(content, language)
    
    def _validate_python_syntax(self, content: str) -> Dict[str, Any]:
        """Validate Python syntax"""
        result = {
            "valid": False,
            "errors": [],
            "warnings": [],
        }
        
        try:
            # Try to parse the AST
            ast.parse(content)
            result["valid"] = True
        except SyntaxError as e:
            result["errors"].append({
                "type": "SyntaxError",
                "message": str(e),
                "lineno": e.lineno,
                "offset": e.offset,
            })
        except Exception as e:
            result["errors"].append({
                "type": "Error",
                "message": str(e),
            })
        
        return result
    
    def _validate_generic_syntax(self, content: str, language: str) -> Dict[str, Any]:
        """Validate syntax for other languages using basic checks"""
        result = {
            "valid": True,
            "errors": [],
            "warnings": [],
        }
        
        lines = content.split('\n')
        
        # Basic bracket matching
        brackets = {'(': ')', '{': '}', '[': ']'}
        stack = []
        
        for i, line in enumerate(lines, 1):
            for char in line:
                if char in brackets:
                    stack.append((char, i))
                elif char in brackets.values():
                    if not stack:
                        result["errors"].append({
                            "type": "SyntaxError",
                            "message": f"Unmatched closing bracket '{char}'",
                            "lineno": i,
                        })
                        result["valid"] = False
                    else:
                        open_bracket, open_line = stack.pop()
                        if brackets[open_bracket] != char:
                            result["errors"].append({
                                "type": "SyntaxError",
                                "message": f"Mismatched brackets: '{open_bracket}' and '{char}'",
                                "lineno": i,
                            })
                            result["valid"] = False
        
        # Check for unmatched opening brackets
        for bracket, line in stack:
            result["errors"].append({
                "type": "SyntaxError",
                "message": f"Unmatched opening bracket '{bracket}'",
                "lineno": line,
            })
            result["valid"] = False
        
        return result
    
    def extract_comments(self, content: str, language: str) -> List[Dict[str, Any]]:
        """Extract comments from code"""
        comments = []
        
        if language == "python":
            return self._extract_python_comments(content)
        else:
            return self._extract_generic_comments(content, language)
    
    def _extract_python_comments(self, content: str) -> List[Dict[str, Any]]:
        """Extract Python comments"""
        comments = []
        
        try:
            tokens = tokenize.generate_tokens(StringIO(content).readline)
            
            for token_type, token_string, start, end, line in tokens:
                if token_type == tokenize.COMMENT:
                    comments.append({
                        "type": "comment",
                        "content": token_string,
                        "lineno": start[0],
                        "start_col": start[1],
                        "end_col": end[1],
                    })
                elif token_type == tokenize.STRING and token_string.startswith('"""'):
                    comments.append({
                        "type": "docstring",
                        "content": token_string,
                        "lineno": start[0],
                        "start_col": start[1],
                        "end_col": end[1],
                    })
        except Exception as e:
            logger.warning(f"Failed to extract Python comments: {e}")
        
        return comments
    
    def _extract_generic_comments(self, content: str, language: str) -> List[Dict[str, Any]]:
        """Extract comments for other languages"""
        comments = []
        
        comment_patterns = {
            "javascript": [
                (r'//(.+)', "single_line"),
                (r'/\*([^*]|\*(?!/))*\*/', "multi_line"),
            ],
            "typescript": [
                (r'//(.+)', "single_line"),
                (r'/\*([^*]|\*(?!/))*\*/', "multi_line"),
            ],
            "java": [
                (r'//(.+)', "single_line"),
                (r'/\*([^*]|\*(?!/))*\*/', "multi_line"),
            ],
            "cpp": [
                (r'//(.+)', "single_line"),
                (r'/\*([^*]|\*(?!/))*\*/', "multi_line"),
            ],
            "c": [
                (r'//(.+)', "single_line"),
                (r'/\*([^*]|\*(?!/))*\*/', "multi_line"),
            ],
            "go": [
                (r'//(.+)', "single_line"),
                (r'/\*([^*]|\*(?!/))*\*/', "multi_line"),
            ],
            "rust": [
                (r'//(.+)', "single_line"),
                (r'/\*([^*]|\*(?!/))*\*/', "multi_line"),
            ],
            "php": [
                (r'//(.+)', "single_line"),
                (r'#(.+)', "single_line"),
                (r'/\*([^*]|\*(?!/))*\*/', "multi_line"),
            ],
            "ruby": [
                (r'#(.+)', "single_line"),
                (r'=begin(.+?)=end', "multi_line"),
            ],
        }
        
        if language in comment_patterns:
            patterns = comment_patterns[language]
            
            for pattern, comment_type in patterns:
                matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)
                
                for match in matches:
                    # Calculate line number
                    line_start = content[:match.start()].count('\n') + 1
                    
                    comments.append({
                        "type": comment_type,
                        "content": match.group(1) if match.groups() else match.group(0),
                        "lineno": line_start,
                        "start_col": match.start() - content.rfind('\n', 0, match.start()) - 1,
                        "end_col": match.end() - content.rfind('\n', 0, match.end()) - 1,
                    })
        
        return comments 