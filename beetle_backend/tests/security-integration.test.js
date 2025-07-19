const { oauthEvents, clearActiveSession } = require('../src/utils/security-logger.cjs');

describe('Security Logging - Integration Tests', () => {
  beforeEach(() => {
    // Clear console logs and active sessions
    jest.clearAllMocks();
    
    // Clear active sessions
    const { getAllActiveSessions } = require('../src/utils/security-logger.cjs');
    const sessions = getAllActiveSessions();
    sessions.forEach(([userId]) => clearActiveSession(userId));
  });

  test('OAuth flow should prevent duplicate login logs within time window', async () => {
    const userId = 'integration-test-user';
    const clientIp = '192.168.1.100';
    const sessionId1 = 'integration-session-1';
    const sessionId2 = 'integration-session-2';
    
    // Mock console.log to capture security events
    const originalLog = console.log;
    const logOutput = [];
    console.log = jest.fn((message, details) => {
      if (message.includes('[SECURITY')) {
        logOutput.push({ message, details });
      }
      originalLog(message, details);
    });

    // Simulate first OAuth success (new login)
    oauthEvents.authSuccess(userId, clientIp, sessionId1, true);
    
    // Simulate immediate second OAuth success (should be treated as refresh)
    oauthEvents.authSuccess(userId, clientIp, sessionId2, true);
    
    // Verify logging behavior
    expect(logOutput).toHaveLength(2);
    
    // First should be auth_success
    expect(logOutput[0].message).toContain('oauth_auth_success');
    
    // Second should be session_refresh (duplicate prevention)
    expect(logOutput[1].message).toContain('oauth_session_refresh');
    
    // Restore console.log
    console.log = originalLog;
  });

  test('Session validation should use different log event', async () => {
    const userId = 'validation-test-user';
    const clientIp = '192.168.1.101';
    const sessionId = 'validation-session';
    
    // Mock console.log
    const originalLog = console.log;
    const logOutput = [];
    console.log = jest.fn((message, details) => {
      if (message.includes('[SECURITY')) {
        logOutput.push({ message, details });
      }
      originalLog(message, details);
    });

    // Simulate session validation (not a new login)
    oauthEvents.authSuccess(userId, clientIp, sessionId, false);
    
    // Verify it logs as session validation
    expect(logOutput).toHaveLength(1);
    expect(logOutput[0].message).toContain('oauth_session_validated');
    
    console.log = originalLog;
  });

  test('Multiple rapid authentication attempts should be handled correctly', async () => {
    const userId = 'rapid-test-user';
    const clientIp = '192.168.1.102';
    
    // Mock console.log
    const originalLog = console.log;
    const logOutput = [];
    console.log = jest.fn((message, details) => {
      if (message.includes('[SECURITY')) {
        logOutput.push({ message, details });
      }
      originalLog(message, details);
    });

    // Simulate rapid authentication attempts (like page refreshes during OAuth)
    for (let i = 0; i < 3; i++) {
      const sessionId = `rapid-session-${i}`;
      oauthEvents.authSuccess(userId, clientIp, sessionId, true);
      
      // Small delay to ensure timing is captured
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Should have: 1 auth_success + 2 session_refresh events
    expect(logOutput).toHaveLength(3);
    expect(logOutput[0].message).toContain('oauth_auth_success');
    expect(logOutput[1].message).toContain('oauth_session_refresh');
    expect(logOutput[2].message).toContain('oauth_session_refresh');
    
    console.log = originalLog;
  });

  test('Authentication after time window should create new login log', async () => {
    const userId = 'timeout-test-user';
    const clientIp = '192.168.1.103';
    const sessionId1 = 'timeout-session-1';
    const sessionId2 = 'timeout-session-2';
    
    // Mock console.log
    const originalLog = console.log;
    const logOutput = [];
    console.log = jest.fn((message, details) => {
      if (message.includes('[SECURITY')) {
        logOutput.push({ message, details });
      }
      originalLog(message, details);
    });

    // First authentication
    oauthEvents.authSuccess(userId, clientIp, sessionId1, true);
    
    // Manually simulate time passage by modifying the active session
    const { getActiveSession } = require('../src/utils/security-logger.cjs');
    const activeSession = getActiveSession(userId);
    if (activeSession) {
      // Set login time to 2 hours ago
      activeSession.loginTime = Date.now() - (2 * 60 * 60 * 1000);
    }
    
    // Second authentication after "time window"
    oauthEvents.authSuccess(userId, clientIp, sessionId2, true);
    
    // Should have 2 auth_success events (both treated as new logins)
    expect(logOutput).toHaveLength(2);
    expect(logOutput[0].message).toContain('oauth_auth_success');
    expect(logOutput[1].message).toContain('oauth_auth_success');
    
    console.log = originalLog;
  });
});