/**
 * Configuration validation utility for security settings
 * Ensures all required security environment variables are properly configured
 */

const crypto = require('crypto');

/**
 * Validates security configuration and environment variables
 * @returns {object} - Validation result with status and details
 */
function validateSecurityConfiguration() {
  const validationResult = {
    valid: true,
    errors: [],
    warnings: [],
    summary: {}
  };

  // Required environment variables
  const requiredVars = {
    JWT_SECRET: {
      validator: (value) => value && value.length >= 32,
      error: 'JWT_SECRET must be at least 32 characters long for security'
    },
    GITHUB_CLIENT_ID: {
      validator: (value) => value && value.length > 0,
      error: 'GITHUB_CLIENT_ID is required for OAuth authentication'
    },
    GITHUB_CLIENT_SECRET: {
      validator: (value) => value && value.length > 0,
      error: 'GITHUB_CLIENT_SECRET is required for OAuth authentication'
    },
    GITHUB_CALLBACK_URL: {
      validator: (value) => {
        try {
          const url = new URL(value);
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
          return false;
        }
      },
      error: 'GITHUB_CALLBACK_URL must be a valid URL'
    }
  };

  // Optional but recommended environment variables
  const recommendedVars = {
    GITHUB_WEBHOOK_SECRET: {
      validator: (value) => value && value.length >= 16,
      warning: 'GITHUB_WEBHOOK_SECRET recommended for webhook security (min 16 chars)'
    },
    ALLOWED_ORIGINS: {
      validator: (value) => {
        if (!value) return false;
        try {
          const origins = value.split(',').map(o => o.trim());
          return origins.every(origin => {
            try {
              new URL(origin);
              return true;
            } catch {
              return false;
            }
          });
        } catch {
          return false;
        }
      },
      warning: 'ALLOWED_ORIGINS should be set for production security'
    },
    NODE_ENV: {
      validator: (value) => value === 'production' || value === 'development' || value === 'test',
      warning: 'NODE_ENV should be set to production, development, or test'
    }
  };

  // Validate required variables
  Object.keys(requiredVars).forEach(varName => {
    const value = process.env[varName];
    const config = requiredVars[varName];
    
    if (!config.validator(value)) {
      validationResult.valid = false;
      validationResult.errors.push({
        variable: varName,
        message: config.error,
        value: value ? '[SET BUT INVALID]' : '[NOT SET]'
      });
    } else {
      validationResult.summary[varName] = '✅ Valid';
    }
  });

  // Validate recommended variables
  Object.keys(recommendedVars).forEach(varName => {
    const value = process.env[varName];
    const config = recommendedVars[varName];
    
    if (!config.validator(value)) {
      validationResult.warnings.push({
        variable: varName,
        message: config.warning,
        value: value ? '[SET BUT INVALID]' : '[NOT SET]'
      });
      validationResult.summary[varName] = '⚠️ Not recommended';
    } else {
      validationResult.summary[varName] = '✅ Valid';
    }
  });

  // Additional security checks
  performSecurityChecks(validationResult);

  return validationResult;
}

/**
 * Performs additional security checks
 * @param {object} validationResult - The validation result to update
 */
function performSecurityChecks(validationResult) {
  // Check if JWT_SECRET appears to be weak
  if (process.env.JWT_SECRET) {
    const secret = process.env.JWT_SECRET;
    
    // Check for common weak patterns
    const weakPatterns = [
      'secret',
      'password',
      '123456',
      'qwerty',
      'admin',
      'test',
      'development'
    ];
    
    const hasWeakPattern = weakPatterns.some(pattern => 
      secret.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (hasWeakPattern) {
      validationResult.warnings.push({
        variable: 'JWT_SECRET',
        message: 'JWT_SECRET appears to contain common weak patterns',
        value: '[CONTAINS WEAK PATTERN]'
      });
    }
    
    // Check entropy (basic check)
    const uniqueChars = new Set(secret).size;
    if (uniqueChars < 16) {
      validationResult.warnings.push({
        variable: 'JWT_SECRET',
        message: 'JWT_SECRET has low entropy (consider using more diverse characters)',
        value: '[LOW ENTROPY]'
      });
    }
  }

  // Check HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.GITHUB_CALLBACK_URL && !process.env.GITHUB_CALLBACK_URL.startsWith('https://')) {
      validationResult.warnings.push({
        variable: 'GITHUB_CALLBACK_URL',
        message: 'Production callback URL should use HTTPS',
        value: '[HTTP IN PRODUCTION]'
      });
    }
    
    if (process.env.ALLOWED_ORIGINS) {
      const origins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
      const hasHttp = origins.some(origin => origin.startsWith('http://'));
      if (hasHttp) {
        validationResult.warnings.push({
          variable: 'ALLOWED_ORIGINS',
          message: 'Production origins should use HTTPS',
          value: '[HTTP IN PRODUCTION]'
        });
      }
    }
  }

  // Check for localhost in production
  if (process.env.NODE_ENV === 'production') {
    const checkVars = ['GITHUB_CALLBACK_URL', 'ALLOWED_ORIGINS'];
    checkVars.forEach(varName => {
      const value = process.env[varName];
      if (value && (value.includes('localhost') || value.includes('127.0.0.1'))) {
        validationResult.warnings.push({
          variable: varName,
          message: 'Production configuration should not include localhost',
          value: '[LOCALHOST IN PRODUCTION]'
        });
      }
    });
  }
}

/**
 * Prints a formatted security configuration report
 * @param {object} validationResult - The validation result
 */
function printSecurityConfigurationReport(validationResult) {
  console.log('\n🔒 Security Configuration Report');
  console.log('='.repeat(50));
  
  // Print summary
  console.log('\n📋 Configuration Summary:');
  Object.keys(validationResult.summary).forEach(varName => {
    console.log(`  ${varName}: ${validationResult.summary[varName]}`);
  });
  
  // Print errors
  if (validationResult.errors.length > 0) {
    console.log('\n❌ Configuration Errors:');
    validationResult.errors.forEach(error => {
      console.log(`  ❌ ${error.variable}: ${error.message}`);
      console.log(`     Current value: ${error.value}`);
    });
  }
  
  // Print warnings
  if (validationResult.warnings.length > 0) {
    console.log('\n⚠️  Configuration Warnings:');
    validationResult.warnings.forEach(warning => {
      console.log(`  ⚠️  ${warning.variable}: ${warning.message}`);
      console.log(`     Current value: ${warning.value}`);
    });
  }
  
  // Overall status
  console.log('\n🎯 Overall Status:');
  if (validationResult.valid) {
    console.log('  ✅ Configuration is valid - application can start securely');
    if (validationResult.warnings.length > 0) {
      console.log('  ⚠️  Some recommendations should be addressed for optimal security');
    }
  } else {
    console.log('  ❌ Configuration has errors - application may not start or be insecure');
    console.log('  🔧 Please fix the errors above before proceeding');
  }
  
  console.log('='.repeat(50));
}

/**
 * Generates secure random values for configuration
 * @returns {object} - Generated secure values
 */
function generateSecureConfigValues() {
  return {
    JWT_SECRET: crypto.randomBytes(64).toString('base64'),
    GITHUB_WEBHOOK_SECRET: crypto.randomBytes(32).toString('base64')
  };
}

/**
 * Validates configuration on startup (non-blocking)
 */
function validateOnStartup() {
  try {
    const result = validateSecurityConfiguration();
    printSecurityConfigurationReport(result);
    
    // Exit if critical errors in production
    if (!result.valid && process.env.NODE_ENV === 'production') {
      console.error('\n🚨 Critical security configuration errors in production environment');
      console.error('Application will not start. Please fix the configuration errors.');
      process.exit(1);
    }
    
    return result;
  } catch (error) {
    console.error('Error validating security configuration:', error);
    return { valid: false, errors: [{ message: 'Configuration validation failed' }] };
  }
}

module.exports = {
  validateSecurityConfiguration,
  printSecurityConfigurationReport,
  generateSecureConfigValues,
  validateOnStartup
};