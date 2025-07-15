#!/usr/bin/env node

/**
 * Test script for the Beetle AI Pipeline
 * This script tests the basic functionality of the AI pipeline
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-token';

// Test configuration
const TEST_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  }
};

async function testHealthCheck() {
  console.log('🔍 Testing health check...');
  try {
    const response = await axios.get(`${BASE_URL}/api/ai/health`);
    const data = response.data;
    
    console.log('✅ Health check passed');
    console.log('   Status:', data.status);
    console.log('   Pipeline initialized:', data.pipeline_initialized);
    console.log('   Configuration valid:', data.configuration_valid);
    
    if (data.config) {
      console.log('   Configuration:');
      console.log('     Embedding Model:', data.config.embedding_model);
      console.log('     Chat Model:', data.config.chat_model);
      console.log('     Qdrant:', `${data.config.qdrant_url}:${data.config.qdrant_port}`);
      console.log('     Collection:', data.config.collection_name);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testPipelineStatus() {
  console.log('🔍 Testing pipeline status...');
  try {
    const response = await axios.get(`${BASE_URL}/api/ai/status`, TEST_CONFIG);
    console.log('✅ Pipeline status:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Pipeline status failed:', error.message);
    return false;
  }
}

async function testGitHubIngestion() {
  console.log('🔍 Testing GitHub ingestion...');
  try {
    const testData = {
      github: {
        repository: 'facebook/react',
        branch: 'main',
        paths: ['README.md']
      },
      repository_id: 'test-react-repo',
      branch: 'main'
    };

    const response = await axios.post(`${BASE_URL}/api/ai/ingest`, testData, TEST_CONFIG);
    console.log('✅ GitHub ingestion test:', response.data);
    return true;
  } catch (error) {
    console.error('❌ GitHub ingestion failed:', error.response?.data || error.message);
    return false;
  }
}

async function testSearch() {
  console.log('🔍 Testing search functionality...');
  try {
    const searchQuery = {
      query: 'React component lifecycle',
      repository_id: 'test-react-repo',
      branch: 'main',
      max_results: 5,
      similarity_threshold: 0.5
    };

    const response = await axios.post(`${BASE_URL}/api/ai/search`, searchQuery, TEST_CONFIG);
    console.log('✅ Search test:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Search failed:', error.response?.data || error.message);
    return false;
  }
}

async function testChat() {
  console.log('🔍 Testing chat functionality...');
  try {
    const chatRequest = {
      query: 'What is React?',
      repository_id: 'test-react-repo',
      branch: 'main',
      conversation_history: [],
      max_tokens: 500
    };

    const response = await axios.post(`${BASE_URL}/api/ai/chat`, chatRequest, TEST_CONFIG);
    console.log('✅ Chat test:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Chat failed:', error.response?.data || error.message);
    return false;
  }
}

async function testAgent() {
  console.log('🔍 Testing individual agent...');
  try {
    const testData = {
      repository: 'facebook/react',
      branch: 'main',
      paths: ['README.md']
    };

    const response = await axios.post(`${BASE_URL}/api/ai/test/github_fetcher`, testData, TEST_CONFIG);
    console.log('✅ Agent test:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Agent test failed:', error.response?.data || error.message);
    return false;
  }
}

async function testEnvironmentConfig() {
  console.log('🔍 Testing environment configuration...');
  try {
    const response = await axios.get(`${BASE_URL}/api/ai/config`, TEST_CONFIG);
    const data = response.data;
    
    if (data.success) {
      console.log('✅ Environment configuration test passed');
      console.log('   Configuration valid:', data.data.configuration_valid);
      
      if (data.data.missing_variables && data.data.missing_variables.length > 0) {
        console.log('   Missing variables:', data.data.missing_variables.join(', '));
      }
      
      const config = data.data.config;
      console.log('   Configuration details:');
      console.log('     GitHub Token:', config.github_token_set ? '✅ Set' : '❌ Missing');
      console.log('     Gemini API Key:', config.gemini_api_key_set ? '✅ Set' : '❌ Missing');
      console.log('     Qdrant:', `${config.qdrant_url}:${config.qdrant_port}`);
      console.log('     Embedding Model:', config.embedding_model);
      console.log('     Chat Model:', config.chat_model);
      console.log('     Batch Size:', config.batch_size);
      console.log('     Max Documents:', config.max_documents);
      console.log('     Hybrid Search:', config.use_hybrid_search ? 'Enabled' : 'Disabled');
      
      return data.data.configuration_valid;
    } else {
      console.error('❌ Environment configuration test failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Environment configuration test failed:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting AI Pipeline Tests...\n');

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Environment Config', fn: testEnvironmentConfig },
    { name: 'Pipeline Status', fn: testPipelineStatus },
    { name: 'GitHub Ingestion', fn: testGitHubIngestion },
    { name: 'Search', fn: testSearch },
    { name: 'Chat', fn: testChat },
    { name: 'Agent Test', fn: testAgent }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n📋 Running ${test.name}...`);
    const success = await test.fn();
    results.push({ name: test.name, success });
    
    if (!success) {
      console.log(`⚠️  ${test.name} failed, but continuing with other tests...`);
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! AI Pipeline is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the configuration and dependencies.');
  }
}

// Check if required environment variables are set
function checkEnvironment() {
  console.log('🔧 Checking environment configuration...');
  
  const required = [
    'GEMINI_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.log('\nPlease set these variables in your .env file or environment.');
    console.log('Note: GITHUB_TOKEN is not needed as the AI pipeline uses the user\'s GitHub access token from their OAuth session.');
    return false;
  }
  
  console.log('✅ Environment configuration looks good!');
  console.log('ℹ️  Note: GitHub token is not needed - AI pipeline uses user\'s OAuth token');
  return true;
}

// Main execution
async function main() {
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  try {
    await runAllTests();
  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  testHealthCheck,
  testPipelineStatus,
  testGitHubIngestion,
  testSearch,
  testChat,
  testAgent,
  runAllTests
}; 