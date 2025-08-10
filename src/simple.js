const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

class SimpleA11ops {
  constructor() {
    this.apiKey = null;
    this.baseUrl = process.env.A11OPS_API_URL || 'https://api.a11ops.com';
    this.configPath = path.join(os.homedir(), '.a11ops', 'config.json');
    
    // Auto-load configuration
    this._loadConfig();
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '@a11ops/sdk/1.2.0'
      }
    });
  }

  _loadConfig() {
    // Try environment variables first
    if (process.env.A11OPS_API_KEY) {
      this.apiKey = process.env.A11OPS_API_KEY;
      return;
    }
    
    // Try to load from config file
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        this.apiKey = config.apiKey;
      }
    } catch (error) {
      // Config not found or invalid, will prompt on first use
    }
  }

  _saveConfig(apiKey) {
    const configDir = path.dirname(this.configPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Save configuration
    fs.writeFileSync(this.configPath, JSON.stringify({
      apiKey,
      createdAt: new Date().toISOString()
    }, null, 2));
  }

  async _ensureAuthenticated() {
    if (this.apiKey) return;
    
    // Check if running in a CI/production environment
    if (process.env.CI || process.env.NODE_ENV === 'production') {
      throw new Error(
        'A11OPS_API_KEY environment variable is required. ' +
        'Get your API key from https://a11ops.com/dashboard'
      );
    }
    
    // Interactive setup for development
    console.log('\n🚀 Welcome to a11ops! Let\'s get you set up.\n');
    console.log('You\'ll need your API key from your workspace.');
    console.log('Get it at: https://a11ops.com/dashboard\n');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve, reject) => {
      readline.question('Enter your API key: ', (apiKey) => {
        readline.close();
        
        if (!apiKey) {
          reject(new Error('API key is required'));
          return;
        }
        
        this.apiKey = apiKey.trim();
        
        // Save for future use
        this._saveConfig(this.apiKey);
        
        console.log('\n✅ Configuration saved! You\'re all set.\n');
        resolve();
      });
    });
  }

  async alert(payload) {
    // Ensure we have authentication
    await this._ensureAuthenticated();
    
    if (!payload || typeof payload !== 'object') {
      throw new Error('Alert payload must be an object');
    }

    // Map 'priority' to 'severity' for backwards compatibility
    if (payload.priority && !payload.severity) {
      payload.severity = payload.priority;
    }

    // Prepare the alert payload
    const alertPayload = {
      title: payload.title || 'Alert',
      message: payload.message || payload.body || '',
      severity: payload.severity || 'info',
      timestamp: payload.timestamp || new Date().toISOString(),
      ...payload
    };

    // Remove duplicate fields
    delete alertPayload.priority;
    delete alertPayload.body;
    delete alertPayload.workspace; // Remove workspace - it's determined by API key

    try {
      const response = await this.client.post(`/alerts/${this.apiKey}`, alertPayload);
      return response.data;
    } catch (error) {
      if (error.response) {
        const err = new Error(
          error.response.data.message || 
          `Alert failed with status ${error.response.status}`
        );
        err.status = error.response.status;
        err.response = error.response.data;
        throw err;
      } else if (error.request) {
        throw new Error('No response from a11ops API. Check your internet connection.');
      } else {
        throw error;
      }
    }
  }

  // Convenience methods for different severity levels
  async critical(titleOrPayload, message) {
    if (typeof titleOrPayload === 'string') {
      return this.alert({ title: titleOrPayload, message, severity: 'critical' });
    }
    return this.alert({ ...titleOrPayload, severity: 'critical' });
  }

  async error(titleOrPayload, message) {
    if (typeof titleOrPayload === 'string') {
      return this.alert({ title: titleOrPayload, message, severity: 'high' });
    }
    return this.alert({ ...titleOrPayload, severity: 'high' });
  }

  async warning(titleOrPayload, message) {
    if (typeof titleOrPayload === 'string') {
      return this.alert({ title: titleOrPayload, message, severity: 'medium' });
    }
    return this.alert({ ...titleOrPayload, severity: 'medium' });
  }

  async info(titleOrPayload, message) {
    if (typeof titleOrPayload === 'string') {
      return this.alert({ title: titleOrPayload, message, severity: 'info' });
    }
    return this.alert({ ...titleOrPayload, severity: 'info' });
  }

  // Configure method for explicit setup
  configure(options) {
    if (options.apiKey) {
      this.apiKey = options.apiKey;
      this._saveConfig(this.apiKey);
    }
    return this;
  }
}

// Export a singleton instance for the simple API
const a11ops = new SimpleA11ops();

module.exports = { a11ops };