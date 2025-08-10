class A11opsLogMonitoring {
  constructor(client) {
    this.client = client;
    this.breadcrumbs = [];
    this.maxBreadcrumbs = 50;
    this.context = {};
    this.tags = {};
    this.user = {};

    if (typeof window !== 'undefined') {
      this.setupBrowserErrorHandlers();
    } else if (typeof process !== 'undefined') {
      this.setupNodeErrorHandlers();
    }
  }

  /**
   * Capture an error manually
   */
  captureError(error, options = {}) {
    const errorData = this.prepareErrorData(error, options);
    return this.client._request(`/api/logs/${this.client.apiKey}`, errorData);
  }

  /**
   * Capture a message as an error
   */
  captureMessage(message, level = 'info', options = {}) {
    const errorData = {
      message,
      level,
      type: 'Message',
      ...this.prepareErrorData(new Error(message), options)
    };
    return this.client._request(`/api/logs/${this.client.apiKey}`, errorData);
  }

  /**
   * Capture a log entry (general purpose logging)
   * @param {Error|string|Object} log - The log data to capture
   * @param {Object} options - Additional options
   * @returns {Promise} 
   * 
   * Examples:
   *   captureLog(new Error('Something went wrong'))  // Error object
   *   captureLog('User action completed')            // String message
   *   captureLog({ message: 'Custom log', data: {} }) // Custom object
   */
  captureLog(log, options = {}) {
    // Handle different input types
    if (typeof log === 'string') {
      // String message - treat as info log
      return this.captureMessage(log, options.level || 'info', options);
    } else if (log instanceof Error) {
      // Error object - use captureError
      return this.captureError(log, options);
    } else if (log && typeof log === 'object') {
      // Custom object - extract message and treat as log
      const message = log.message || JSON.stringify(log);
      const level = log.level || options.level || 'info';
      return this.captureMessage(message, level, {
        ...options,
        extra: { ...log, ...options.extra }
      });
    }
    
    // Fallback to error capture for unknown types
    return this.captureError(new Error(String(log)), options);
  }

  /**
   * Add breadcrumb for context
   */
  addBreadcrumb(breadcrumb) {
    this.breadcrumbs.push({
      timestamp: Date.now(),
      ...breadcrumb
    });

    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Set user context
   */
  setUser(user) {
    this.user = user;
  }

  /**
   * Set additional context
   */
  setContext(key, value) {
    this.context[key] = value;
  }

  /**
   * Set tags
   */
  setTag(key, value) {
    this.tags[key] = value;
  }

  /**
   * Prepare error data for sending
   */
  prepareErrorData(error, options = {}) {
    const stackTrace = error.stack || '';
    const errorType = error.name || 'Error';
    const errorMessage = error.message || String(error);

    const data = {
      type: errorType,
      message: errorMessage,
      stack_trace: stackTrace,
      level: options.level || 'error',
      platform: this.getPlatform(),
      environment: options.environment || this.client.environment || 'production',
      release: options.release || this.client.release,
      timestamp: new Date().toISOString(),

      // Context
      contexts: {
        ...this.context,
        ...this.collectContexts()
      },

      // User data
      user: options.user || this.user,

      // Tags
      tags: {
        ...this.tags,
        ...options.tags
      },

      // Breadcrumbs
      breadcrumbs: this.breadcrumbs,

      // Additional data
      extra: options.extra || {},

      // Custom fingerprint for grouping
      fingerprint: options.fingerprint
    };

    // Add request context if available
    if (typeof window !== 'undefined') {
      data.request = {
        url: window.location.href,
        headers: {
          'User-Agent': navigator.userAgent
        }
      };
    }

    return data;
  }

  /**
   * Setup browser error handlers
   */
  setupBrowserErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      if (this.client.options.autoCaptureErrors !== false) {
        this.captureError(event.error || new Error(event.message), {
          extra: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        });
      }
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.client.options.autoCaptureErrors !== false) {
        this.captureError(new Error(event.reason), {
          type: 'UnhandledPromiseRejection'
        });
      }
    });

    // Auto breadcrumbs for navigation
    if (this.client.options.autoBreadcrumbs !== false) {
      this.setupAutoBreadcrumbs();
    }
  }

  /**
   * Setup Node.js error handlers
   */
  setupNodeErrorHandlers() {
    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      if (this.client.options.autoCaptureErrors !== false) {
        this.captureError(error, { level: 'fatal' });
      }
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      if (this.client.options.autoCaptureErrors !== false) {
        this.captureError(new Error(reason), {
          type: 'UnhandledPromiseRejection'
        });
      }
    });
  }

  /**
   * Setup automatic breadcrumb collection
   */
  setupAutoBreadcrumbs() {
    // Console breadcrumbs
    ['log', 'warn', 'error', 'info', 'debug'].forEach(level => {
      const originalConsoleMethod = console[level];
      console[level] = (...args) => {
        this.addBreadcrumb({
          type: 'console',
          category: 'console',
          level,
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ')
        });
        originalConsoleMethod.apply(console, args);
      };
    });

    // XHR breadcrumbs
    if (typeof XMLHttpRequest !== 'undefined') {
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._breadcrumbData = { method, url };
        return originalOpen.apply(this, [method, url, ...args]);
      };

      XMLHttpRequest.prototype.send = function(...args) {
        const startTime = Date.now();
        
        this.addEventListener('loadend', () => {
          if (this._breadcrumbData) {
            this.addBreadcrumb({
              type: 'http',
              category: 'xhr',
              data: {
                ...this._breadcrumbData,
                status_code: this.status,
                duration: Date.now() - startTime
              }
            });
          }
        });

        return originalSend.apply(this, args);
      };
    }

    // Fetch breadcrumbs
    if (typeof fetch !== 'undefined') {
      const originalFetch = fetch;
      window.fetch = (...args) => {
        const startTime = Date.now();
        const [url, options = {}] = args;

        return originalFetch(...args).then(response => {
          this.addBreadcrumb({
            type: 'http',
            category: 'fetch',
            data: {
              url: typeof url === 'string' ? url : url.url,
              method: options.method || 'GET',
              status_code: response.status,
              duration: Date.now() - startTime
            }
          });
          return response;
        }).catch(error => {
          this.addBreadcrumb({
            type: 'http',
            category: 'fetch',
            level: 'error',
            data: {
              url: typeof url === 'string' ? url : url.url,
              method: options.method || 'GET',
              error: error.message,
              duration: Date.now() - startTime
            }
          });
          throw error;
        });
      };
    }

    // Navigation breadcrumbs
    if (typeof window !== 'undefined' && window.history) {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = (...args) => {
        this.addBreadcrumb({
          type: 'navigation',
          category: 'navigation',
          data: {
            from: window.location.href,
            to: args[2]
          }
        });
        return originalPushState.apply(history, args);
      };

      history.replaceState = (...args) => {
        this.addBreadcrumb({
          type: 'navigation',
          category: 'navigation',
          data: {
            from: window.location.href,
            to: args[2]
          }
        });
        return originalReplaceState.apply(history, args);
      };

      window.addEventListener('popstate', () => {
        this.addBreadcrumb({
          type: 'navigation',
          category: 'navigation',
          data: {
            to: window.location.href
          }
        });
      });
    }

    // Click breadcrumbs
    if (typeof document !== 'undefined') {
      document.addEventListener('click', (event) => {
        const target = event.target;
        const tagName = target.tagName.toLowerCase();
        
        if (tagName === 'button' || tagName === 'a' || tagName === 'input') {
          this.addBreadcrumb({
            type: 'user',
            category: 'click',
            data: {
              tagName,
              text: target.textContent || target.value || target.id || target.className,
              id: target.id,
              className: target.className
            }
          });
        }
      }, true);
    }
  }

  /**
   * Get platform name
   */
  getPlatform() {
    if (typeof window !== 'undefined') {
      return 'browser';
    } else if (typeof process !== 'undefined') {
      return 'node';
    }
    return 'unknown';
  }

  /**
   * Collect platform-specific contexts
   */
  collectContexts() {
    const contexts = {};

    if (typeof window !== 'undefined') {
      // Browser context
      contexts.browser = {
        name: this.getBrowserName(),
        version: this.getBrowserVersion(),
        userAgent: navigator.userAgent
      };

      // OS context
      contexts.os = {
        name: this.getOSName()
      };

      // Device context
      contexts.device = {
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      };
    } else if (typeof process !== 'undefined') {
      // Node.js context
      contexts.runtime = {
        name: 'node',
        version: process.version
      };

      contexts.os = {
        name: process.platform,
        version: process.release ? process.release.name : undefined
      };
    }

    return contexts;
  }

  /**
   * Get browser name
   */
  getBrowserName() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.indexOf('Firefox') > -1) {
      return 'Firefox';
    } else if (userAgent.indexOf('Chrome') > -1) {
      return 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
      return 'Safari';
    } else if (userAgent.indexOf('Edge') > -1) {
      return 'Edge';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
      return 'Opera';
    }
    
    return 'Unknown';
  }

  /**
   * Get browser version
   */
  getBrowserVersion() {
    const userAgent = navigator.userAgent;
    let match;

    if ((match = userAgent.match(/Firefox\/(\d+)/))) {
      return match[1];
    } else if ((match = userAgent.match(/Chrome\/(\d+)/))) {
      return match[1];
    } else if ((match = userAgent.match(/Version\/(\d+).*Safari/))) {
      return match[1];
    } else if ((match = userAgent.match(/Edge\/(\d+)/))) {
      return match[1];
    }

    return 'Unknown';
  }

  /**
   * Get OS name
   */
  getOSName() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.indexOf('Windows') > -1) {
      return 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
      return 'MacOS';
    } else if (userAgent.indexOf('Linux') > -1) {
      return 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
      return 'Android';
    } else if (userAgent.indexOf('iOS') > -1) {
      return 'iOS';
    }
    
    return 'Unknown';
  }
}

module.exports = A11opsLogMonitoring;