import { a11ops } from '@a11ops/sdk';

// Note: Set your API key as an environment variable:
// export A11OPS_API_KEY='your-api-key-here'
// Or pass it directly to each method call

async function sendBasicAlert() {
  try {
    // Send a simple alert
    const result = await a11ops.alert({
      title: 'Server CPU High',
      message: 'CPU usage exceeded 90% on production server',
      severity: 'high'
    });
    
    console.log('Alert sent successfully:', result);
  } catch (error) {
    console.error('Failed to send alert:', error.message);
  }
}

async function sendCriticalAlert() {
  try {
    // Send a critical alert with custom fields using convenience method
    const result = await a11ops.critical({
      title: 'Database Connection Lost',
      message: 'Unable to connect to primary database cluster',
      server: 'db-primary-01',
      region: 'us-east-1',
      connectionAttempts: 5,
      lastError: 'Connection timeout after 30s'
    });
    
    console.log('Critical alert sent:', result);
  } catch (error) {
    console.error('Failed to send critical alert:', error.message);
  }
}

async function sendBatchAlerts() {
  try {
    // Send multiple alerts at once
    const results = await a11ops.batchAlert([
      {
        title: 'Disk Space Warning',
        message: '/var/log is 85% full',
        severity: 'medium',
        server: 'web-01'
      },
      {
        title: 'Memory Usage High',
        message: 'Memory usage at 92%',
        severity: 'high',
        server: 'web-02'
      },
      {
        title: 'SSL Certificate Expiring',
        message: 'SSL certificate expires in 7 days',
        severity: 'medium',
        domain: 'api.example.com'
      }
    ]);
    
    console.log('Batch alerts sent:', results);
  } catch (error) {
    console.error('Failed to send batch alerts:', error.message);
  }
}

async function sendVariousSeverities() {
  try {
    // Using convenience methods for different severities
    await a11ops.info({
      title: 'Deployment Started',
      message: 'Deploying version 2.0.1 to production'
    });

    await a11ops.warning({
      title: 'API Rate Limit Warning',
      message: 'API rate limit at 80% capacity'
    });

    await a11ops.error({
      title: 'Payment Processing Failed',
      message: 'Failed to process payment for order #12345',
      orderId: '12345',
      amount: 99.99
    });

    console.log('Various severity alerts sent');
  } catch (error) {
    console.error('Failed to send alerts:', error.message);
  }
}

// Run examples
async function runExamples() {
  console.log('a11ops SDK Basic Examples\n');
  console.log('=============================\n');
  
  console.log('1. Sending basic alert...');
  await sendBasicAlert();
  
  console.log('\n2. Sending critical alert...');
  await sendCriticalAlert();
  
  console.log('\n3. Sending batch alerts...');
  await sendBatchAlerts();
  
  console.log('\n4. Sending various severity levels...');
  await sendVariousSeverities();
  
  console.log('\n✅ All examples completed!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}

export {
  sendBasicAlert,
  sendCriticalAlert,
  sendBatchAlerts,
  sendVariousSeverities
};