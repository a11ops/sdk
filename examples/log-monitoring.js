/**
 * Example: Log Monitoring with a11ops SDK
 * 
 * This example demonstrates how to use the log monitoring
 * features of the a11ops SDK.
 * 
 * Note: For log monitoring features, you need to instantiate
 * the client with configuration options.
 */

import { a11ops } from '@a11ops/sdk';
import A11ops from '@a11ops/sdk';

// For advanced log monitoring features, create a configured client
const client = new A11ops(process.env.A11OPS_API_KEY || 'your-workspace-api-key', {
  baseUrl: process.env.A11OPS_API_URL || 'https://api.a11ops.com',
  logMonitoring: true,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.APP_VERSION || '1.0.0',
  autoCaptureErrors: true,
  autoBreadcrumbs: true
});

// Set user context (optional)
client.setUser({
  id: 'user-123',
  email: 'user@example.com',
  username: 'johndoe'
});

// Set additional context (optional)
client.setContext('app', {
  version: '1.0.0',
  locale: 'en-US'
});

// Set tags (optional)
client.setTag('feature', 'payment');
client.setTag('customer', 'premium');

// Example 1: Capture an error manually
function exampleErrorCapture() {
  try {
    // Some code that might throw an error
    throw new Error('Something went wrong in payment processing');
  } catch (error) {
    client.captureError(error, {
      level: 'error',
      extra: {
        order_id: '12345',
        amount: 99.99
      }
    });
  }
}

// Example 2: Capture a message
function exampleMessageCapture() {
  client.captureMessage('User completed checkout', 'info', {
    extra: {
      items_count: 3,
      total: 299.97
    }
  });
}

// Example 3: Add breadcrumbs for context
function exampleBreadcrumbs() {
  client.addBreadcrumb({
    type: 'user',
    category: 'click',
    message: 'User clicked checkout button',
    level: 'info',
    data: {
      button_id: 'checkout-btn'
    }
  });
  
  client.addBreadcrumb({
    type: 'navigation',
    category: 'navigation',
    message: 'Navigated to checkout',
    data: {
      from: '/cart',
      to: '/checkout'
    }
  });
  
  client.addBreadcrumb({
    type: 'http',
    category: 'fetch',
    message: 'Payment API call',
    data: {
      url: '/api/payment',
      method: 'POST',
      status_code: 200,
      duration: 1230
    }
  });
}

// Example 4: Capture different log levels
function exampleLogLevels() {
  client.captureMessage('Debug information', 'debug');
  client.captureMessage('User logged in', 'info');
  client.captureMessage('API rate limit approaching', 'warning');
  client.captureError(new Error('Database connection failed'), { level: 'error' });
  client.captureError(new Error('Payment gateway unreachable'), { level: 'critical' });
}

// Example 5: Using the generic captureLog method
function exampleCaptureLog() {
  client.captureLog(new Error('Generic log entry'), {
    level: 'warning',
    fingerprint: ['payment', 'timeout'], // Custom grouping
    extra: {
      retry_count: 3,
      last_attempt: new Date().toISOString()
    }
  });
}

// Example 6: Simple API for quick alerts (no log monitoring)
async function exampleSimpleAlerts() {
  // You can still use the simple API for quick alerts
  await a11ops.critical('Database is down!');
  await a11ops.error('Failed to process payment', 'Payment gateway timeout');
  await a11ops.warning('High memory usage detected');
  await a11ops.info('Deployment completed');
}

// Example 7: Unhandled errors are automatically captured
function demonstrateAutomaticCapture() {
  // This will be automatically captured by the configured client
  setTimeout(() => {
    throw new Error('Unhandled error example - automatically captured');
  }, 1000);
  
  // Promise rejections are also automatically captured
  Promise.reject('Unhandled promise rejection - automatically captured');
}

// Example 8: Express.js error handler integration
function expressErrorHandler(err, req, res, next) {
  // Capture error with request context
  client.captureError(err, {
    level: err.statusCode >= 500 ? 'error' : 'warning',
    extra: {
      url: req.url,
      method: req.method,
      ip: req.ip,
      user_agent: req.get('user-agent')
    },
    user: req.user ? {
      id: req.user.id,
      email: req.user.email
    } : undefined
  });
  
  res.status(err.statusCode || 500).json({
    error: 'Internal Server Error'
  });
}

// Run examples
async function runExamples() {
  console.log('a11ops Log Monitoring Examples\n');
  console.log('================================\n');
  
  console.log('1. Capturing errors...');
  exampleErrorCapture();
  
  console.log('2. Capturing messages...');
  exampleMessageCapture();
  
  console.log('3. Adding breadcrumbs...');
  exampleBreadcrumbs();
  
  console.log('4. Different log levels...');
  exampleLogLevels();
  
  console.log('5. Generic log capture...');
  exampleCaptureLog();
  
  console.log('6. Simple alerts (without log monitoring)...');
  await exampleSimpleAlerts();
  
  console.log('7. Demonstrating automatic capture...');
  demonstrateAutomaticCapture();
  
  console.log('\n✅ Log monitoring examples executed');
  console.log('Check your a11ops dashboard to see the captured logs');
  
  // Keep the process alive to capture async errors
  setTimeout(() => {
    console.log('\nExiting...');
    process.exit(0);
  }, 5000);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}

export {
  client,
  exampleErrorCapture,
  exampleMessageCapture,
  exampleBreadcrumbs,
  exampleLogLevels,
  exampleCaptureLog,
  exampleSimpleAlerts,
  expressErrorHandler
};