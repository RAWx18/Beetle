#!/usr/bin/env node

/**
 * Generate secure configuration values for Beetle application
 * This script helps generate cryptographically secure secrets for production use
 */

const { generateSecureConfigValues, validateSecurityConfiguration, printSecurityConfigurationReport } = require('./src/utils/config-validator.cjs');

console.log('🔐 Beetle Security Configuration Generator');
console.log('='.repeat(50));

// Generate secure values
const secureValues = generateSecureConfigValues();

console.log('\n🔑 Generated Secure Configuration Values:');
console.log('\n# Add these to your .env file or environment variables:');
console.log(`JWT_SECRET=${secureValues.JWT_SECRET}`);
console.log(`GITHUB_WEBHOOK_SECRET=${secureValues.GITHUB_WEBHOOK_SECRET}`);

console.log('\n📝 Additional Required Configuration:');
console.log('# Get these from your GitHub OAuth App:');
console.log('GITHUB_CLIENT_ID=your_github_client_id');
console.log('GITHUB_CLIENT_SECRET=your_github_client_secret');
console.log('GITHUB_CALLBACK_URL=https://your-domain.com/auth/github/callback');

console.log('\n🌐 Production Security Configuration:');
console.log('# Set these for production security:');
console.log('NODE_ENV=production');
console.log('ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com');

console.log('\n⚠️  Security Notes:');
console.log('- Keep these secrets secure and never commit them to version control');
console.log('- Use different secrets for different environments (dev/staging/prod)');
console.log('- Rotate secrets periodically for enhanced security');
console.log('- Use HTTPS in production for all URLs');

console.log('\n🧪 To validate your configuration after setup:');
console.log('npm run validate:security');

console.log('\n' + '='.repeat(50));

// If environment variables are already set, show current validation status
if (process.env.JWT_SECRET || process.env.GITHUB_CLIENT_ID) {
  console.log('\n📊 Current Configuration Status:');
  const currentConfig = validateSecurityConfiguration();
  printSecurityConfigurationReport(currentConfig);
}