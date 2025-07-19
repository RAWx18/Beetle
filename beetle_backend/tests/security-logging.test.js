const { oauthEvents, clearActiveSession, getActiveSession } = require('../src/utils/security-logger.cjs');

describe('Security Logging - Duplicate Login Prevention', () => {
  beforeEach(() => {
    // Clear any existing active sessions before each test
    const sessions = require('../src/utils/security-logger.cjs').getAllActiveSessions();
    sessions.forEach(([userId]) => clearActiveSession(userId));
  });

  test('should log new login for first authentication', () => {
    const userId = 'test-user-123';
    const clientIp = '192.168.1.1';
    const sessionId = 'session-123';
    
    // Mock console.log to capture logs
    const logSpy = jest.spyOn(console, 'log');
    
    // First login should be logged as new login
    oauthEvents.authSuccess(userId, clientIp, sessionId, true);
    
    // Verify that oauth_auth_success was logged (not oauth_session_refresh)
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SECURITY INFO] oauth_auth_success:'),
      expect.any(String)
    );
    
    logSpy.mockRestore();
  });

  test('should log session refresh for duplicate login within time window', (done) => {
    const userId = 'test-user-456';
    const clientIp = '192.168.1.1';
    const sessionId1 = 'session-456-1';
    const sessionId2 = 'session-456-2';
    
    // Mock console.log to capture logs
    const logSpy = jest.spyOn(console, 'log');
    
    // First login
    oauthEvents.authSuccess(userId, clientIp, sessionId1, true);
    
    // Clear the spy to focus on the second call
    logSpy.mockClear();
    
    // Second login within time window (should be treated as refresh)
    setTimeout(() => {
      oauthEvents.authSuccess(userId, clientIp, sessionId2, true);
      
      // Verify that oauth_session_refresh was logged (not oauth_auth_success)
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY INFO] oauth_session_refresh:'),
        expect.any(String)
      );
      
      logSpy.mockRestore();
      done();
    }, 100); // Small delay to ensure timing
  });

  test('should track active sessions correctly', () => {
    const userId = 'test-user-789';
    const clientIp = '192.168.1.1';
    const sessionId = 'session-789';
    
    // Initially no active session
    expect(getActiveSession(userId)).toBeUndefined();
    
    // After login, should track session
    oauthEvents.authSuccess(userId, clientIp, sessionId, true);
    
    const activeSession = getActiveSession(userId);
    expect(activeSession).toBeDefined();
    expect(activeSession.sessionId).toBe(sessionId);
    expect(activeSession.clientIp).toBe(clientIp);
    expect(activeSession.loginTime).toBeDefined();
  });

  test('should clear active session tracking', () => {
    const userId = 'test-user-clear';
    const clientIp = '192.168.1.1';
    const sessionId = 'session-clear';
    
    // Create active session
    oauthEvents.authSuccess(userId, clientIp, sessionId, true);
    expect(getActiveSession(userId)).toBeDefined();
    
    // Clear session
    clearActiveSession(userId);
    expect(getActiveSession(userId)).toBeUndefined();
  });

  test('should allow new login after sufficient time gap', (done) => {
    const userId = 'test-user-time';
    const clientIp = '192.168.1.1';
    const sessionId1 = 'session-time-1';
    const sessionId2 = 'session-time-2';
    
    // Mock console.log to capture logs
    const logSpy = jest.spyOn(console, 'log');
    
    // First login
    oauthEvents.authSuccess(userId, clientIp, sessionId1, true);
    
    // Manually adjust the login time to simulate time passage
    const activeSession = getActiveSession(userId);
    if (activeSession) {
      activeSession.loginTime = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
    }
    
    // Clear the spy to focus on the second call
    logSpy.mockClear();
    
    // Second login after time gap (should be treated as new login)
    setTimeout(() => {
      oauthEvents.authSuccess(userId, clientIp, sessionId2, true);
      
      // Verify that oauth_auth_success was logged (not oauth_session_refresh)
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY INFO] oauth_auth_success:'),
        expect.any(String)
      );
      
      logSpy.mockRestore();
      done();
    }, 100);
  });

  test('should log session validation for existing sessions', () => {
    const userId = 'test-user-validate';
    const clientIp = '192.168.1.1';
    const sessionId = 'session-validate';
    
    // Mock console.log to capture logs
    const logSpy = jest.spyOn(console, 'log');
    
    // Call with isNewLogin = false (session validation)
    oauthEvents.authSuccess(userId, clientIp, sessionId, false);
    
    // Verify that oauth_session_validated was logged
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SECURITY INFO] oauth_session_validated:'),
      expect.any(String)
    );
    
    logSpy.mockRestore();
  });
});