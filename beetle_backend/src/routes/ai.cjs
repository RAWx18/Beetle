const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.cjs');
const { getAIConfig, validateAIConfig, printEnvStatus } = require('../utils/env.cjs');

// TODO: Implement a bridge to the Python AI pipeline (via HTTP or child_process) if needed.
// For now, AI endpoints will return a 501 Not Implemented error.
router.all('*', (req, res) => {
  res.status(501).json({
    error: 'AI pipeline is not available in this build. Please implement a Node.js bridge to the Python AI pipeline.'
  });
});

module.exports = router; 