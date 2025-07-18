const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.cjs');
const githubRoutes = require('./routes/github.cjs');
const analyticsRoutes = require('./routes/analytics.cjs');
const projectsRoutes = require('./routes/projects.cjs');
const aiRoutes = require('./routes/ai.cjs');
const aggregatedRoutes = require('./routes/aggregated.cjs');
const webhookRoutes = require('./routes/webhooks.cjs');

// Import environment utilities
const { printEnvStatus } = require('./utils/env.cjs');

// Import security configuration validator
const { validateOnStartup } = require('./utils/config-validator.cjs');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler.cjs');
const { authMiddleware } = require('./middleware/auth.cjs');

// Import database initialization
const { initDatabase } = require('./utils/database.cjs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Validate security configuration on startup
validateOnStartup();

// __dirname is already available in CommonJS

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://coming_soon.com'] // TODO: Change to frontend domain
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/public', express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    memory: process.memoryUsage(),
    pid: process.pid
  });
});

// GitHub OAuth callback route (direct mount for GitHub OAuth compatibility)
app.use('/auth/github/callback', (req, res, next) => {
  // Forward to the actual auth route handler
  req.url = '/github/callback' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
  authRoutes(req, res, next);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/github', authMiddleware, githubRoutes);
app.use('/api/aggregated', authMiddleware, aggregatedRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/projects', authMiddleware, projectsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/webhooks', webhookRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Beetle Backend API',
    version: '1.0.0',
    description: 'Git-based collaboration with Branch-Level Intelligence',
    endpoints: {
      auth: '/api/auth',
      github: '/api/github',
      aggregated: '/api/aggregated',
      analytics: '/api/analytics',
      projects: '/api/projects',
      ai: '/api/ai',
      webhooks: '/api/webhooks'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    console.log('✅ Database initialized successfully');
    
    // Print environment configuration status
    printEnvStatus();
    
    app.listen(PORT, () => {
      console.log(`🚀 Beetle Backend server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🤖 AI Pipeline: http://localhost:${PORT}/api/ai/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; 