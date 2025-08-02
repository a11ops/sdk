const axios = require('axios');

class A11ops {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.a11ops.com';
    this.region = options.region || 'auto';
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '@a11ops/sdk/1.1.1'
      }
    });
  }

  async alert(payload) {
    if (!payload) {
      throw new Error('Alert payload is required');
    }

    // Ensure payload has required fields
    const alertPayload = {
      title: payload.title || 'Alert',
      message: payload.message || payload.body || '',
      severity: payload.severity || 'info',
      timestamp: payload.timestamp || new Date().toISOString(),
      ...payload
    };

    // Add region if specified
    if (this.region !== 'auto') {
      alertPayload.region = this.region;
    }

    return this._request(`/alerts/${this.apiKey}`, alertPayload);
  }

  async batchAlert(alerts) {
    if (!Array.isArray(alerts) || alerts.length === 0) {
      throw new Error('Alerts array is required and must not be empty');
    }

    const batchPayload = {
      alerts: alerts.map(alert => ({
        title: alert.title || 'Alert',
        message: alert.message || alert.body || '',
        severity: alert.severity || 'info',
        timestamp: alert.timestamp || new Date().toISOString(),
        ...alert
      }))
    };

    if (this.region !== 'auto') {
      batchPayload.region = this.region;
    }

    return this._request(`/alerts/${this.apiKey}/batch`, batchPayload);
  }

  async getMetrics(options = {}) {
    const params = new URLSearchParams();
    if (options.workspaceId) params.append('workspaceId', options.workspaceId);
    if (options.region) params.append('region', options.region);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    return this._request(`/v1/metrics/delivery?${params.toString()}`, null, 'GET');
  }

  async getSLACompliance(options = {}) {
    const params = new URLSearchParams();
    if (options.workspaceId) params.append('workspaceId', options.workspaceId);
    if (options.period) params.append('period', options.period);

    return this._request(`/v1/metrics/sla?${params.toString()}`, null, 'GET');
  }

  async _request(endpoint, data, method = 'POST') {
    let lastError;
    
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const response = await this.client({
          method,
          url: endpoint,
          data,
          headers: {
            'X-API-Key': this.apiKey
          }
        });

        return response.data;
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          throw this._formatError(error);
        }

        // Exponential backoff for retries
        if (attempt < this.retries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw this._formatError(lastError);
  }

  _formatError(error) {
    if (error.response) {
      const err = new Error(error.response.data.message || `Request failed with status ${error.response.status}`);
      err.status = error.response.status;
      err.response = error.response.data;
      return err;
    } else if (error.request) {
      const err = new Error('No response received from a11ops API');
      err.code = 'ENORESPONSE';
      return err;
    } else {
      return error;
    }
  }
}

// Export the traditional class-based API
module.exports = A11ops;

// Also export the simple API
const { a11ops } = require('./simple');
module.exports.a11ops = a11ops;

// For ES6 imports
module.exports.default = A11ops;