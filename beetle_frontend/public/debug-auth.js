// Debug authentication state
console.log('=== AUTHENTICATION DEBUG ===');
console.log('Token from localStorage:', localStorage.getItem('beetle_token'));
console.log('Auto demo mode:', localStorage.getItem('auto_demo_mode'));
console.log('Is authenticated:', localStorage.getItem('isAuthenticated'));

// Function to clear demo mode and force real GitHub auth
function clearDemoMode() {
  localStorage.removeItem('beetle_token');
  localStorage.removeItem('auto_demo_mode');
  localStorage.removeItem('isAuthenticated');
  console.log('Demo mode cleared! Refreshing page...');
  window.location.reload();
}

// Function to check current auth state
function checkAuthState() {
  console.log('=== Current Auth State ===');
  console.log('Token:', localStorage.getItem('beetle_token'));
  console.log('Auto demo:', localStorage.getItem('auto_demo_mode'));
  console.log('Is authenticated:', localStorage.getItem('isAuthenticated'));
}

// Add functions to window for easy access in console
window.clearDemoMode = clearDemoMode;
window.checkAuthState = checkAuthState;

console.log('Run clearDemoMode() to exit demo mode');
console.log('Run checkAuthState() to see current state');
