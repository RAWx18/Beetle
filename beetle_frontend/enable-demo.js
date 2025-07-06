// Simple script to enable auto demo mode for development
// Run this in the browser console to enable auto demo mode

if (typeof window !== 'undefined') {
  localStorage.setItem('auto_demo_mode', 'true');
  console.log('✅ Auto demo mode enabled!');
  console.log('🔄 Please refresh the page to see the changes.');
} else {
  console.log('❌ This script must be run in a browser environment');
} 