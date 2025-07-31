// Using the new simple API - no initialization required!
const { a11ops } = require('@a11ops/sdk');

/**
 * Prometheus AlertManager Integration
 * Webhook receiver that transforms Prometheus alerts to a11ops
 */
async function handlePrometheusWebhook(req, res) {
  const { alerts } = req.body;
  
  try {
    const a11opsAlerts = alerts.map(alert => ({
      title: alert.labels.alertname,
      message: alert.annotations.description || alert.annotations.summary,
      severity: mapPrometheusSeverity(alert.labels.severity),
      source: 'prometheus',
      instance: alert.labels.instance,
      job: alert.labels.job,
      startsAt: alert.startsAt,
      endsAt: alert.endsAt,
      generatorURL: alert.generatorURL,
      fingerprint: alert.fingerprint,
      // Include all labels as custom fields
      ...alert.labels
    }));

    await a11ops.batchAlert(a11opsAlerts);
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Failed to forward Prometheus alerts:', error);
    res.status(500).json({ error: 'Failed to process alerts' });
  }
}

function mapPrometheusSeverity(severity) {
  const mapping = {
    'critical': 'critical',
    'warning': 'high',
    'info': 'info',
    'page': 'critical'
  };
  return mapping[severity] || 'medium';
}

/**
 * Grafana Integration
 * Handle Grafana alerting webhooks
 */
async function handleGrafanaWebhook(req, res) {
  const { alerts } = req.body;
  
  try {
    const a11opsAlerts = alerts.map(alert => ({
      title: alert.title || alert.name,
      message: alert.message || `${alert.metric} ${alert.state}`,
      severity: alert.state === 'alerting' ? 'high' : 'info',
      source: 'grafana',
      dashboardId: alert.dashboardId,
      panelId: alert.panelId,
      orgId: alert.orgId,
      evalMatches: alert.evalMatches,
      imageUrl: alert.imageUrl,
      ruleUrl: alert.ruleUrl,
      state: alert.state,
      tags: alert.tags
    }));

    await a11ops.batchAlert(a11opsAlerts);
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Failed to forward Grafana alerts:', error);
    res.status(500).json({ error: 'Failed to process alerts' });
  }
}

/**
 * Datadog Integration
 * Transform Datadog monitor alerts
 */
async function handleDatadogWebhook(req, res) {
  const alert = req.body;
  
  try {
    await a11ops.alert({
      title: alert.title,
      message: alert.body || alert.event_msg,
      severity: mapDatadogPriority(alert.priority),
      source: 'datadog',
      alertId: alert.id,
      alertType: alert.alert_type,
      eventType: alert.event_type,
      hostname: alert.hostname,
      aggregationKey: alert.aggregation_key,
      scope: alert.scope,
      tags: alert.tags,
      url: alert.url,
      snapshotUrl: alert.snapshot
    });

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Failed to forward Datadog alert:', error);
    res.status(500).json({ error: 'Failed to process alert' });
  }
}

function mapDatadogPriority(priority) {
  // Datadog uses 'normal' and 'low', map to our severity levels
  if (priority === 'normal') return 'high';
  if (priority === 'low') return 'medium';
  return 'info';
}

/**
 * AWS CloudWatch Integration
 * Handle SNS notifications from CloudWatch
 */
async function handleCloudWatchSNS(snsMessage) {
  const message = JSON.parse(snsMessage.Message);
  
  try {
    await a11ops.alert({
      title: `CloudWatch Alarm: ${message.AlarmName}`,
      message: message.AlarmDescription || message.NewStateReason,
      severity: message.NewStateValue === 'ALARM' ? 'high' : 'info',
      source: 'cloudwatch',
      alarmName: message.AlarmName,
      metricName: message.Trigger?.MetricName,
      namespace: message.Trigger?.Namespace,
      statistic: message.Trigger?.Statistic,
      region: message.Region,
      accountId: message.AWSAccountId,
      stateChangeTime: message.StateChangeTime,
      previousState: message.OldStateValue,
      currentState: message.NewStateValue
    });

    console.log('CloudWatch alarm forwarded successfully');
  } catch (error) {
    console.error('Failed to forward CloudWatch alarm:', error);
    throw error;
  }
}

/**
 * Generic Webhook Handler
 * For custom monitoring tools
 */
async function handleGenericWebhook(req, res) {
  const { title, message, severity, ...customFields } = req.body;
  
  try {
    await a11ops.alert({
      title: title || 'Alert',
      message: message || 'No message provided',
      severity: severity || 'medium',
      source: 'webhook',
      timestamp: new Date().toISOString(),
      ...customFields
    });

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Failed to forward webhook alert:', error);
    res.status(500).json({ error: 'Failed to process alert' });
  }
}

/**
 * Express.js middleware for automatic error alerting
 */
function createErrorAlertMiddleware(options = {}) {
  const {
    includeStackTrace = false,
    includeRequestData = true,
    severityMap = {}
  } = options;

  return async (err, req, res, next) => {
    try {
      const alertData = {
        title: `API Error: ${err.message}`,
        message: `${req.method} ${req.path} - ${err.message}`,
        severity: severityMap[err.status] || (err.status >= 500 ? 'high' : 'medium'),
        source: 'api',
        error: {
          message: err.message,
          status: err.status || 500,
          code: err.code
        }
      };

      if (includeStackTrace && err.stack) {
        alertData.stackTrace = err.stack;
      }

      if (includeRequestData) {
        alertData.request = {
          method: req.method,
          path: req.path,
          query: req.query,
          headers: {
            'user-agent': req.headers['user-agent'],
            'x-forwarded-for': req.headers['x-forwarded-for']
          },
          userId: req.user?.id,
          ip: req.ip
        };
      }

      await a11ops.alert(alertData);
    } catch (alertError) {
      console.error('Failed to send error alert:', alertError);
    }

    // Continue with normal error handling
    next(err);
  };
}

module.exports = {
  handlePrometheusWebhook,
  handleGrafanaWebhook,
  handleDatadogWebhook,
  handleCloudWatchSNS,
  handleGenericWebhook,
  createErrorAlertMiddleware
};