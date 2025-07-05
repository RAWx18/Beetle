const { join } = require('path');
const fs = require('fs');

// Dynamic imports for ESM-only lowdb
let Low, JSONFile;
(async () => {
  const lowdb = await import('lowdb');
  const lowdbNode = await import('lowdb/node');
  Low = lowdb.Low;
  JSONFile = lowdbNode.JSONFile;
})();

const path = require('path');
// __dirname is already available in CommonJS

// Ensure data directory exists
const dataDir = join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || join(dataDir, 'beetle_db.json');

// Initialize database with default structure
const defaultData = {
  users: {},
  repositories: {},
  analytics: {},
  projects: {},
  branches: {},
  issues: {},
  pullRequests: {},
  commits: {},
  userSessions: {},
  cache: {},
  metadata: {
    lastUpdated: new Date().toISOString(),
    version: '1.0.0'
  }
};

let db;

const initDatabase = async () => {
  try {
    // Wait for dynamic imports to complete
    if (!Low || !JSONFile) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!Low || !JSONFile) {
        throw new Error('Failed to load lowdb modules');
      }
    }
    
    const adapter = new JSONFile(dbPath);
    db = new Low(adapter, defaultData);
    
    await db.read();
    
    // Initialize with default data if database is empty
    if (!db.data || Object.keys(db.data).length === 0) {
      await db.write();
      console.log('📁 Database initialized with default structure');
    }
    
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

const saveDatabase = async () => {
  try {
    if (db) {
      db.data.metadata.lastUpdated = new Date().toISOString();
      await db.write();
    }
  } catch (error) {
    console.error('❌ Failed to save database:', error);
    throw error;
  }
};

// User management
const createUser = async (githubId, userData) => {
  const database = getDatabase();
  database.data.users[githubId] = {
    ...userData,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    repositories: [],
    analytics: {
      totalCommits: 0,
      totalPRs: 0,
      totalIssues: 0,
      activeRepositories: 0
    }
  };
  await saveDatabase();
  return database.data.users[githubId];
};

const getUser = async (githubId) => {
  const database = getDatabase();
  return database.data.users[githubId] || null;
};

const updateUser = async (githubId, updates) => {
  const database = getDatabase();
  if (database.data.users[githubId]) {
    database.data.users[githubId] = {
      ...database.data.users[githubId],
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    await saveDatabase();
    return database.data.users[githubId];
  }
  return null;
};

// Repository management
const saveRepository = async (repoId, repoData) => {
  const database = getDatabase();
  database.data.repositories[repoId] = {
    ...repoData,
    lastUpdated: new Date().toISOString(),
    branches: repoData.branches || [],
    issues: repoData.issues || [],
    pullRequests: repoData.pullRequests || []
  };
  await saveDatabase();
  return database.data.repositories[repoId];
};

const getRepository = async (repoId) => {
  const database = getDatabase();
  return database.data.repositories[repoId] || null;
};

const getUserRepositories = async (githubId) => {
  const database = getDatabase();
  const user = database.data.users[githubId];
  if (!user) return [];
  
  return user.repositories.map(repoId => database.data.repositories[repoId]).filter(Boolean);
};

// Analytics management
const saveAnalytics = async (userId, analyticsData) => {
  const database = getDatabase();
  database.data.analytics[userId] = {
    ...analyticsData,
    lastUpdated: new Date().toISOString()
  };
  await saveDatabase();
  return database.data.analytics[userId];
};

const getAnalytics = async (userId) => {
  const database = getDatabase();
  return database.data.analytics[userId] || null;
};

// Project management
const saveProject = async (projectId, projectData) => {
  const database = getDatabase();
  database.data.projects[projectId] = {
    ...projectData,
    lastUpdated: new Date().toISOString()
  };
  await saveDatabase();
  return database.data.projects[projectId];
};

const getProject = async (projectId) => {
  const database = getDatabase();
  return database.data.projects[projectId] || null;
};

// Cache management
const setCache = async (key, value, ttl = 3600) => {
  const database = getDatabase();
  database.data.cache[key] = {
    value,
    expiresAt: new Date(Date.now() + ttl * 1000).toISOString()
  };
  await saveDatabase();
};

const getCache = async (key) => {
  const database = getDatabase();
  const cached = database.data.cache[key];
  
  if (!cached) return null;
  
  if (new Date(cached.expiresAt) < new Date()) {
    delete database.data.cache[key];
    await saveDatabase();
    return null;
  }
  
  return cached.value;
};

const clearCache = async () => {
  const database = getDatabase();
  database.data.cache = {};
  await saveDatabase();
};

// Session management
const createSession = async (sessionId, userData) => {
  const database = getDatabase();
  database.data.userSessions[sessionId] = {
    ...userData,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };
  await saveDatabase();
  return database.data.userSessions[sessionId];
};

const getSession = async (sessionId) => {
  const database = getDatabase();
  return database.data.userSessions[sessionId] || null;
};

const updateSession = async (sessionId, updates) => {
  const database = getDatabase();
  if (database.data.userSessions[sessionId]) {
    database.data.userSessions[sessionId] = {
      ...database.data.userSessions[sessionId],
      ...updates,
      lastActivity: new Date().toISOString()
    };
    await saveDatabase();
    return database.data.userSessions[sessionId];
  }
  return null;
};

const deleteSession = async (sessionId) => {
  const database = getDatabase();
  if (database.data.userSessions[sessionId]) {
    delete database.data.userSessions[sessionId];
    await saveDatabase();
    return true;
  }
  return false;
};

// Cleanup expired sessions
const cleanupExpiredSessions = async () => {
  const database = getDatabase();
  const now = new Date();
  const expiredSessions = [];
  
  Object.keys(database.data.userSessions).forEach(sessionId => {
    const session = database.data.userSessions[sessionId];
    const lastActivity = new Date(session.lastActivity);
    const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
    
    if (hoursSinceActivity > 24) { // Expire after 24 hours of inactivity
      expiredSessions.push(sessionId);
    }
  });
  
  expiredSessions.forEach(sessionId => {
    delete database.data.userSessions[sessionId];
  });
  
  if (expiredSessions.length > 0) {
    await saveDatabase();
    console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

// Export all functions
module.exports = {
  initDatabase,
  getDatabase,
  saveDatabase,
  createUser,
  getUser,
  updateUser,
  saveRepository,
  getRepository,
  getUserRepositories,
  saveAnalytics,
  getAnalytics,
  saveProject,
  getProject,
  setCache,
  getCache,
  clearCache,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  cleanupExpiredSessions
}; 