const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.cjs');
const { getAIConfig, validateAIConfig, printEnvStatus } = require('../utils/env.cjs');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const os = require('os'); // Add this at the top if not already imported

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../data/uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Helper function to make API call to Python backend
async function callPythonBackend(endpoint, data) {
  try {
    // Default to localhost:8000 if PYTHON_SERVER is not set
    const pythonServer = process.env.PYTHON_SERVER || 'http://localhost:8000';
    const url = endpoint === 'process-repo' 
      ? `${pythonServer}/process-repo`
      : `${pythonServer}/api/${endpoint}`;
      
    console.log(`Calling Python backend at: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.error || errorMsg;
      } catch (e) {
        // If we can't parse JSON, use the status text
        errorMsg = response.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling Python backend:', error);
    throw new Error(`Failed to communicate with AI service: ${error.message}`);
  }
}

// Import files and embed them in vector database
router.post('/import', authMiddleware, upload.array('files'), async (req, res) => {
  try {
    const { repository_id, branch, source_type } = req.body;
    const files = req.files || [];
    
    if (!Array.isArray(files)) {
      return res.status(400).json({ error: 'Invalid files parameter: must be an array' });
    }
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }
    
    // Prepare data for Python pipeline
    const importData = {
      repository_id: repository_id || 'default',
      branch: branch || 'main',
      source_type: source_type || 'file',
      files: files.map(file => ({
        path: file.path,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }))
    };
    
    // Call Python embedding pipeline
    const result = await callPythonBackend('import', importData);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Successfully imported and embedded ${files.length} files`,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to import files'
      });
    }
    
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to check if a repository is public
async function isRepoPublic(owner, repo) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Beetle-AI'
      }
    });
    
    if (!response.ok) {
      // If we get 404, the repo might be private or doesn't exist
      if (response.status === 404) return false;
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const repoData = await response.json();
    return !repoData.private;
  } catch (error) {
    console.error('Error checking repository visibility:', error);
    return false; // Default to private on error
  }
}

// Helper function to get GitHub token from beetle_db.json
async function getGitHubToken(userId) {
  try {
    const dbPath = path.join(__dirname, '../../data/beetle_db.json');
    const dbData = await fs.readFile(dbPath, 'utf8');
    const db = JSON.parse(dbData);
    
    // Find user's GitHub token
    const user = db.users?.find(u => u.id === userId);
    return user?.githubToken || null;
  } catch (error) {
    console.error('Error reading beetle_db.json:', error);
    return null;
  }
}

// Helper function to fetch file content from GitHub
async function fetchGitHubFileContent(url, githubToken, isPublic) {
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'Beetle-AI'
    };

    // Only add authorization header for private repos or if explicitly provided
    if (!isPublic && githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      let errorMsg = `GitHub API error: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.message) {
          errorMsg += ` - ${errorBody.message}`;
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
      throw new Error(errorMsg);
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching file from GitHub:', error);
    throw new Error(`Failed to fetch file from GitHub: ${error.message}`);
  }
}

// Import files from public GitHub repositories and process with Python backend
router.post('/import-github', authMiddleware, async (req, res) => {
  try {
    console.log('Received GitHub import request:', req.body);

    const { 
      repository_id: repoFullName, // Format: owner/repo
      branch = 'main',
      files = [],
      source_type = 'github'
    } = req.body;

    // Validate required fields
    if (!repoFullName) {
      return res.status(400).json({ 
        success: false,
        error: 'Repository name is required (format: owner/repo)' 
      });
    }

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No files specified for import' 
      });
    }

    // Extract owner and repo from repository_id
    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid repository format. Expected format: owner/repo' 
      });
    }

    console.log(`Starting import from public repository: ${owner}/${repo}`);

    // Check if repository is public
    const isPublic = await isRepoPublic(owner, repo);
    if (!isPublic) {
      return res.status(400).json({
        success: false,
        error: 'Only public GitHub repositories are supported'
      });
    }

    // Process each file
    const processedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        const filePath = file.path;
        const fileBranch = file.branch || branch;
        
        console.log(`Processing file: ${filePath} from ${fileBranch}`);
        
        // Construct GitHub API URL for the file
        const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(fileBranch)}`;
        
        // Fetch file content without authentication (public repo)
        const content = await fetchGitHubFileContent(fileUrl);
        console.log("content: " , content);
        
        processedFiles.push({
          path: filePath,
          branch: fileBranch,
          content: content,
          size: content.length,
          is_public: true
        });
      } catch (error) {
        errors.push({
          path: file.path,
          error: error.message
        });
        console.error(`Error processing file ${file.path}:`, error);
      }
    }

    if (processedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Failed to process any files',
        errors: errors
      });
    }

    // Prepare data for Python backend
    const payload = {
      repository: repoFullName,
      repository_id: repoFullName.replace(/[^a-zA-Z0-9_-]/g, '_'),
      branch: branch,
      source_type: source_type,
      files: processedFiles,
      timestamp: new Date().toISOString()
    };

    console.log(`Sending ${processedFiles.length} files to Python backend for processing`);

    try {
      console.log("payload: ", payload);
      // Send to Python backend for RAG processing
      const result = await callPythonBackend('process-repo', payload);
      
      return res.json({
        success: true,
        message: `Successfully processed ${processedFiles.length} files from GitHub`,
        data: {
          repository: repoFullName,
          branch: branch,
          files_processed: processedFiles.length,
          files_failed: errors.length,
          timestamp: new Date().toISOString()
        },
        warnings: errors.length > 0 ? errors : undefined
      });
      
    } catch (error) {
      console.error('Error processing files with Python backend:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process files with AI service',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        files_processed: processedFiles.length,
        files_failed: errors.length
      });
    }
    
  } catch (error) {
    console.error('GitHub import error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Chat endpoint using multi-agent system with RAG integration
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, repository_id, branch, context_results, chat_history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Prepare chat request for Python pipeline
    const chatData = {
      message: message,
      repository_id: repository_id || 'default',
      branch: branch || 'main',
      context_results: context_results || [],
      chat_history: chat_history || [],
      max_tokens: 500,
      temperature: 0.7
    };
    
    console.log('Processing chat request with data:', {
      repository_id: chatData.repository_id,
      branch: chatData.branch,
      message_length: message.length,
      context_results_count: chatData.context_results?.length || 0,
      chat_history_length: chatData.chat_history?.length || 0
    });
    
    // Call Python chat pipeline
    const result = await callPythonPipeline('chat', chatData);
    
    if (result.success) {
      // Add metadata to the response
      const response = {
        success: true,
        message: result.data.answer,
        sources: result.data.sources || [],
        context: result.data.context || [],
        metadata: {
          model: result.data.metadata?.model || 'gemini-2.0-flash',
          tokens_used: result.data.metadata?.tokens_used || 0,
          processing_time: result.data.metadata?.processing_time || 0
        }
      };
      
      console.log('Chat response prepared:', {
        response_length: response.message?.length || 0,
        sources_count: response.sources?.length || 0,
        context_count: response.context?.length || 0
      });
      
      res.json(response);
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to process chat message',
        details: result.details
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.details
    });
  }
});

// Search endpoint for retrieving relevant documents
router.post('/search', authMiddleware, async (req, res) => {
  try {
    const { query, repository_id, branch, max_results, similarity_threshold } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Prepare search request for Python pipeline
    const searchData = {
      query: query,
      repository_id: repository_id || 'default',
      branch: branch || 'main',
      max_results: max_results || 10,
      similarity_threshold: similarity_threshold || 0.3
    };
    
    // Call Python search pipeline
    const result = await callPythonPipeline('search', searchData);
    
    if (result.success) {
      res.json({
        success: true,
        results: result.data.results,
        total_found: result.data.total_found
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to search'
      });
    }
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get AI system status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const result = await callPythonPipeline('status', {});
    
    if (result.success) {
      res.json({
        success: true,
        status: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to get status'
      });
    }
    
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 