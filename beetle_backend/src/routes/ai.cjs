const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.cjs');
const { getAIConfig, validateAIConfig, printEnvStatus } = require('../utils/env.cjs');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

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

// Helper function to call Python AI pipeline
async function callPythonPipeline(endpoint, data) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ai/pipeline_bridge.py');
    const child = spawn('python3', [pythonScript, endpoint, JSON.stringify(data)]);
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Python response: ${error.message}`));
        }
      } else {
        reject(new Error(`Python process failed with code ${code}: ${stderr}`));
      }
    });
    
    child.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

// Import files and embed them in vector database
router.post('/import', authMiddleware, upload.array('files'), async (req, res) => {
  try {
    const { repository_id, branch, source_type } = req.body;
    const files = req.files || [];
    
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
    const result = await callPythonPipeline('import', importData);
    
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

// Import GitHub data (PRs, issues, etc.)
router.post('/import-github', authMiddleware, async (req, res) => {
  try {
    const { repository_id, branch, data_types, github_token } = req.body;
    
    if (!github_token) {
      return res.status(400).json({ error: 'GitHub token is required' });
    }
    
    // Prepare data for Python pipeline
    const importData = {
      repository_id: repository_id || 'default',
      branch: branch || 'main',
      data_types: data_types || ['pull_requests', 'issues', 'activities'],
      github_token: github_token
    };
    
    // Call Python GitHub ingestion pipeline
    const result = await callPythonPipeline('import-github', importData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Successfully imported GitHub data',
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to import GitHub data'
      });
    }
    
  } catch (error) {
    console.error('GitHub import error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Chat endpoint using multi-agent system
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, repository_id, branch, context_results } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Prepare chat request for Python pipeline
    const chatData = {
      message: message,
      repository_id: repository_id || 'default',
      branch: branch || 'main',
      context_results: context_results || []
    };
    
    // Call Python chat pipeline
    const result = await callPythonPipeline('chat', chatData);
    
    if (result.success) {
      res.json({
        success: true,
        answer: result.data.answer,
        sources: result.data.sources,
        confidence: result.data.confidence
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate response'
      });
    }
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
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