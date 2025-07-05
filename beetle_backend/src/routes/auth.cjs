const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { 
  createUser, 
  getUser, 
  updateUser, 
  createSession, 
  deleteSession 
} = require('../utils/database.cjs');
const { getUserProfile } = require('../utils/github.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');

const router = express.Router();

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;

// Generate GitHub OAuth URL
router.get('/github/url', (req, res) => {
  const state = uuidv4(); // Generate random state for security
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${GITHUB_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&` +
    `scope=repo,user,read:org&` +
    `state=${state}`;

  res.json({
    authUrl: githubAuthUrl,
    state: state
  });
});

// GitHub OAuth callback
router.get('/github/callback', asyncHandler(async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({
      error: 'Authorization code required',
      message: 'GitHub authorization code is missing'
    });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: GITHUB_CALLBACK_URL
    }, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const { access_token, error, error_description } = tokenResponse.data;

    if (error) {
      return res.status(400).json({
        error: 'GitHub OAuth Error',
        message: error_description || 'Failed to exchange code for access token'
      });
    }

    if (!access_token) {
      return res.status(400).json({
        error: 'Access token missing',
        message: 'GitHub did not return an access token'
      });
    }

    // Get user profile from GitHub
    const userProfile = await getUserProfile(access_token);

    // Create or update user in database
    let user = await getUser(userProfile.id);
    
    if (!user) {
      user = await createUser(userProfile.id, {
        githubId: userProfile.id,
        login: userProfile.login,
        name: userProfile.name,
        email: userProfile.email,
        avatar_url: userProfile.avatar_url,
        bio: userProfile.bio,
        location: userProfile.location,
        company: userProfile.company,
        blog: userProfile.blog,
        twitter_username: userProfile.twitter_username,
        public_repos: userProfile.public_repos,
        followers: userProfile.followers,
        following: userProfile.following,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at
      });
    } else {
      // Update existing user
      user = await updateUser(userProfile.id, {
        name: userProfile.name,
        email: userProfile.email,
        avatar_url: userProfile.avatar_url,
        bio: userProfile.bio,
        location: userProfile.location,
        company: userProfile.company,
        blog: userProfile.blog,
        twitter_username: userProfile.twitter_username,
        public_repos: userProfile.public_repos,
        followers: userProfile.followers,
        following: userProfile.following,
        updated_at: userProfile.updated_at,
        lastLogin: new Date().toISOString()
      });
    }

    // Create session
    const sessionId = uuidv4();
    const session = await createSession(sessionId, {
      githubId: userProfile.id,
      login: userProfile.login,
      name: userProfile.name,
      avatar_url: userProfile.avatar_url,
      accessToken: access_token
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        sessionId: sessionId,
        githubId: userProfile.id,
        login: userProfile.login
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Redirect to frontend with token
    const frontendUrl = process.env.NODE_ENV === 'production'
      ? 'https://your-frontend-domain.com'
      : 'http://localhost:3000';

    res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userProfile))}`);

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Failed to complete GitHub authentication'
    });
  }
}));

// Validate token
router.get('/validate', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Please provide a valid Bearer token'
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUser(decoded.githubId);
    
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    res.json({
      valid: true,
      user: {
        id: user.githubId,
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        email: user.email,
        bio: user.bio,
        location: user.location,
        company: user.company,
        blog: user.blog,
        twitter_username: user.twitter_username,
        public_repos: user.public_repos,
        followers: user.followers,
        following: user.following,
        created_at: user.created_at,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      error: 'Invalid token',
      message: 'The provided token is invalid or expired'
    });
  }
}));

// Logout
router.post('/logout', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Please provide a valid Bearer token'
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Delete session
    await deleteSession(decoded.sessionId);
    
    res.json({
      message: 'Successfully logged out',
      success: true
    });
  } catch (error) {
    // Even if token is invalid, consider logout successful
    res.json({
      message: 'Successfully logged out',
      success: true
    });
  }
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Please provide a valid Bearer token'
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    // Generate new token
    const newToken = jwt.sign(
      { 
        sessionId: decoded.sessionId,
        githubId: decoded.githubId,
        login: decoded.login
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token: newToken,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    res.status(401).json({
      error: 'Invalid token',
      message: 'Cannot refresh invalid token'
    });
  }
}));

// Get current user profile
router.get('/profile', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Please provide a valid Bearer token'
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUser(decoded.githubId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      user: {
        id: user.githubId,
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        email: user.email,
        bio: user.bio,
        location: user.location,
        company: user.company,
        blog: user.blog,
        twitter_username: user.twitter_username,
        public_repos: user.public_repos,
        followers: user.followers,
        following: user.following,
        created_at: user.created_at,
        lastLogin: user.lastLogin,
        analytics: user.analytics
      }
    });
  } catch (error) {
    res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid or expired'
    });
  }
}));

// Update user profile
router.put('/profile', [
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('bio').optional().isString().trim().isLength({ max: 500 }),
  body('location').optional().isString().trim().isLength({ max: 100 }),
  body('company').optional().isString().trim().isLength({ max: 100 }),
  body('blog').optional().isURL().trim(),
  body('twitter_username').optional().isString().trim().isLength({ max: 50 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Please provide a valid Bearer token'
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await updateUser(decoded.githubId, req.body);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.githubId,
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        email: user.email,
        bio: user.bio,
        location: user.location,
        company: user.company,
        blog: user.blog,
        twitter_username: user.twitter_username,
        public_repos: user.public_repos,
        followers: user.followers,
        following: user.following,
        created_at: user.created_at,
        lastLogin: user.lastLogin,
        analytics: user.analytics
      }
    });
  } catch (error) {
    res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid or expired'
    });
  }
}));

module.exports = router; 