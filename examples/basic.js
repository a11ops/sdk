const a11ops = require('../src/index');

// Initialize the client with your API key
const a11ops = new a11ops('your-api-key-here');

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
    // Send a critical alert with custom fields
    const result = await a11ops.alert({
      title: 'Database Connection Lost',
      message: 'Unable to connect to primary database cluster',
      severity: 'critical',
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

async function checkMetrics() {
  try {
    // Get delivery metrics for the last 24 hours
    const metrics = await a11ops.getMetrics({
      period: '24h'
    });
    
    console.log('Delivery Metrics:');
    console.log(`- Total alerts: ${metrics.total}`);
    console.log(`- Delivered: ${metrics.delivered}`);
    console.log(`- Failed: ${metrics.failed}`);
    console.log(`- Average latency: ${metrics.avgLatency}ms`);
    console.log(`- P99 latency: ${metrics.p99Latency}ms`);
  } catch (error) {
    console.error('Failed to get metrics:', error.message);
  }
}

// Run examples
async function runExamples() {
  console.log('a11ops Node.js SDK Examples\n');
  
  console.log('1. Sending basic alert...');
  await sendBasicAlert();
  
  console.log('\n2. Sending critical alert...');
  await sendCriticalAlert();
  
  console.log('\n3. Sending batch alerts...');
  await sendBatchAlerts();
  
  console.log('\n4. Checking delivery metrics...');
  await checkMetrics();
}

// Run if called directly
if (require.main === module) {
  runExamples().catch(console.error);
}

module.exports = {
  sendBasicAlert,
  sendCriticalAlert,
  sendBatchAlerts,
  checkMetrics
};