// Test script to verify demo functionality
console.log('Testing demo functionality...');

// Simulate enabling demo mode
localStorage.setItem('beetle_token', 'demo-token');
localStorage.setItem('isAuthenticated', 'true');
localStorage.setItem('auto_demo_mode', 'true');

console.log('Demo mode enabled');
console.log('Token:', localStorage.getItem('beetle_token'));
console.log('Is authenticated:', localStorage.getItem('isAuthenticated'));

// Test API call
fetch('http://localhost:3001/api/github/repositories/demo-user/beetle-app/branches', {
  headers: {
    'Authorization': 'Bearer demo-token',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('API Response:', data);
  console.log('Number of branches:', data.branches?.length || 0);
  console.log('Branch names:', data.branches?.map(b => b.name) || []);
  
  // Test if we can access the branches
  if (data.branches && data.branches.length > 0) {
    console.log('✅ API is working correctly');
    console.log('Available branches:', data.branches.map(b => b.name));
  } else {
    console.log('❌ No branches returned from API');
  }
})
.catch(error => {
  console.error('API Error:', error);
});

// Test repository context setup
console.log('Testing repository context...');
const demoRepository = {
  name: 'beetle-app',
  full_name: 'demo-user/beetle-app',
  description: 'A demo repository for testing Beetle features',
  owner: {
    login: 'demo-user',
    avatar_url: 'https://github.com/github.png',
    type: 'User'
  },
  language: 'TypeScript',
  stargazers_count: 42,
  forks_count: 8,
  html_url: 'https://github.com/demo-user/beetle-app',
  clone_url: 'https://github.com/demo-user/beetle-app.git',
  default_branch: 'main',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: new Date().toISOString(),
  private: false,
  type: 'owned'
};

console.log('Demo repository data:', demoRepository); 