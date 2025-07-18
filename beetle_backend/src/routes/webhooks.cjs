const express = require('express');
const { verifyGitHubSignature } = require('../utils/security.cjs');
const { webhookEvents, securityEvents } = require('../utils/security-logger.cjs');
const { webhookLimit } = require('../middleware/oauth-rate-limit.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');

const router = express.Router();

// Middleware to capture raw body for signature verification
const captureRawBody = (req, res, next) => {
  req.rawBody = '';
  req.setEncoding('utf8');
  
  req.on('data', (chunk) => {
    req.rawBody += chunk;
  });
  
  req.on('end', () => {
    next();
  });
};

// Webhook signature verification middleware
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.get('X-Hub-Signature-256');
  const delivery = req.get('X-GitHub-Delivery');
  const event = req.get('X-GitHub-Event');
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  
  // Log webhook received
  webhookEvents.received(event, delivery, req.ip);
  
  if (!webhookSecret) {
    console.warn('⚠️ GITHUB_WEBHOOK_SECRET not configured - skipping signature verification');
    return next();
  }
  
  if (!signature) {
    console.error('❌ Webhook signature missing');
    webhookEvents.signatureVerified(event, delivery, false);
    return res.status(401).json({
      error: 'Signature required',
      message: 'X-Hub-Signature-256 header is required'
    });
  }
  
  const isValid = verifyGitHubSignature(req.rawBody, signature, webhookSecret);
  
  webhookEvents.signatureVerified(event, delivery, isValid);
  
  if (!isValid) {
    console.error('❌ Invalid webhook signature');
    securityEvents.suspiciousActivity('invalid_webhook_signature', req.ip, {
      event,
      delivery,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(401).json({
      error: 'Invalid signature',
      message: 'Webhook signature verification failed'
    });
  }
  
  console.log('✅ Webhook signature verified');
  next();
};

// GitHub webhook endpoint
router.post('/github', 
  webhookLimit,
  captureRawBody,
  verifyWebhookSignature,
  asyncHandler(async (req, res) => {
    const event = req.get('X-GitHub-Event');
    const delivery = req.get('X-GitHub-Delivery');
    const payload = JSON.parse(req.rawBody);
    
    console.log(`📥 GitHub webhook received: ${event} (${delivery})`);
    
    try {
      // Process different webhook events
      switch (event) {
        case 'push':
          await handlePushEvent(payload);
          break;
        case 'pull_request':
          await handlePullRequestEvent(payload);
          break;
        case 'issues':
          await handleIssuesEvent(payload);
          break;
        case 'repository':
          await handleRepositoryEvent(payload);
          break;
        case 'star':
          await handleStarEvent(payload);
          break;
        case 'fork':
          await handleForkEvent(payload);
          break;
        case 'ping':
          console.log('🏓 Webhook ping received');
          break;
        default:
          console.log(`📝 Unhandled webhook event: ${event}`);
      }
      
      webhookEvents.processed(event, delivery, true);
      
      res.status(200).json({
        message: 'Webhook processed successfully',
        event,
        delivery
      });
      
    } catch (error) {
      console.error(`❌ Error processing webhook ${event}:`, error);
      webhookEvents.processed(event, delivery, false, error);
      
      res.status(500).json({
        error: 'Webhook processing failed',
        message: error.message,
        event,
        delivery
      });
    }
  })
);

// Webhook event handlers
async function handlePushEvent(payload) {
  const { repository, ref, commits } = payload;
  console.log(`📤 Push to ${repository.full_name} on ${ref}: ${commits.length} commits`);
  
  // Here you could update local cache, trigger AI analysis, etc.
  // For now, just log the event
}

async function handlePullRequestEvent(payload) {
  const { action, pull_request, repository } = payload;
  console.log(`🔀 Pull request ${action} in ${repository.full_name}: #${pull_request.number}`);
  
  // Here you could update PR status, trigger reviews, etc.
}

async function handleIssuesEvent(payload) {
  const { action, issue, repository } = payload;
  console.log(`🐛 Issue ${action} in ${repository.full_name}: #${issue.number}`);
  
  // Here you could update issue status, trigger notifications, etc.
}

async function handleRepositoryEvent(payload) {
  const { action, repository } = payload;
  console.log(`📚 Repository ${action}: ${repository.full_name}`);
  
  // Here you could update repository cache, permissions, etc.
}

async function handleStarEvent(payload) {
  const { action, repository, starred_at } = payload;
  console.log(`⭐ Repository ${action === 'created' ? 'starred' : 'unstarred'}: ${repository.full_name}`);
  
  // Here you could update star counts, analytics, etc.
}

async function handleForkEvent(payload) {
  const { forkee, repository } = payload;
  console.log(`🍴 Repository forked: ${repository.full_name} -> ${forkee.full_name}`);
  
  // Here you could update fork counts, analytics, etc.
}

// Webhook health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Webhook endpoint is healthy',
    timestamp: new Date().toISOString(),
    signatureVerification: !!process.env.GITHUB_WEBHOOK_SECRET
  });
});

// List supported webhook events
router.get('/events', (req, res) => {
  res.json({
    supportedEvents: [
      'push',
      'pull_request',
      'issues',
      'repository',
      'star',
      'fork',
      'ping'
    ],
    signatureVerification: !!process.env.GITHUB_WEBHOOK_SECRET,
    rateLimiting: true
  });
});

module.exports = router;