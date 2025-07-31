const { a11ops } = require('../src/index');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Simple a11ops API', () => {
  const configPath = path.join(os.homedir(), '.a11ops', 'config.json');
  
  beforeEach(() => {
    // Clear any existing config
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    
    // Reset the singleton instance
    a11ops.apiKey = null;
    a11ops.workspaceKey = null;
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.A11OPS_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    // Clean up
    delete process.env.A11OPS_API_KEY;
    delete process.env.NODE_ENV;
  });

  describe('alert()', () => {
    test('works with minimal configuration', async () => {
      const mockPost = jest.spyOn(a11ops.client, 'post').mockResolvedValue({
        data: { success: true, id: 'alert-123' }
      });

      const result = await a11ops.alert({
        title: "Database CPU at 95%",
        priority: "critical",
        workspace: "production"
      });

      expect(result).toEqual({ success: true, id: 'alert-123' });
      expect(mockPost).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          title: "Database CPU at 95%",
          severity: "critical",
          workspace: "production"
        })
      );
    });

    test('maps priority to severity', async () => {
      const mockPost = jest.spyOn(a11ops.client, 'post').mockResolvedValue({
        data: { success: true }
      });

      await a11ops.alert({
        title: "Test",
        priority: "high"
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          severity: "high"
        })
      );
    });

    test('adds default fields', async () => {
      const mockPost = jest.spyOn(a11ops.client, 'post').mockResolvedValue({
        data: { success: true }
      });

      await a11ops.alert({
        title: "Test Alert"
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          title: "Test Alert",
          message: "",
          severity: "info",
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('severity helpers', () => {
    test('critical() sends critical alert', async () => {
      const mockPost = jest.spyOn(a11ops.client, 'post').mockResolvedValue({
        data: { success: true }
      });

      await a11ops.critical("System down!");

      expect(mockPost).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          title: "System down!",
          severity: "critical"
        })
      );
    });

    test('error() sends high severity alert', async () => {
      const mockPost = jest.spyOn(a11ops.client, 'post').mockResolvedValue({
        data: { success: true }
      });

      await a11ops.error("Process failed", "Exit code 1");

      expect(mockPost).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          title: "Process failed",
          message: "Exit code 1",
          severity: "high"
        })
      );
    });

    test('warning() sends medium severity alert', async () => {
      const mockPost = jest.spyOn(a11ops.client, 'post').mockResolvedValue({
        data: { success: true }
      });

      await a11ops.warning({ title: "High CPU", message: "85% usage" });

      expect(mockPost).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          title: "High CPU",
          message: "85% usage",
          severity: "medium"
        })
      );
    });

    test('info() sends info alert', async () => {
      const mockPost = jest.spyOn(a11ops.client, 'post').mockResolvedValue({
        data: { success: true }
      });

      await a11ops.info("Deployment complete");

      expect(mockPost).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          title: "Deployment complete",
          severity: "info"
        })
      );
    });
  });

  describe('configuration', () => {
    test('loads from environment variable', () => {
      process.env.A11OPS_API_KEY = 'env-api-key';
      a11ops._loadConfig();
      
      expect(a11ops.apiKey).toBe('env-api-key');
    });

    test('configure() method updates settings', () => {
      a11ops.configure({
        apiKey: 'configured-key',
        workspace: 'dev'
      });

      expect(a11ops.apiKey).toBe('configured-key');
      expect(a11ops.workspaceKey).toBe('dev');
    });

    test('throws error in production without API key', async () => {
      delete process.env.A11OPS_API_KEY;
      process.env.NODE_ENV = 'production';
      a11ops.apiKey = null;

      await expect(a11ops.alert({ title: "Test" }))
        .rejects.toThrow('A11OPS_API_KEY environment variable is required');
    });
  });

  describe('error handling', () => {
    test('handles API errors correctly', async () => {
      const error = new Error('Request failed');
      error.response = {
        status: 429,
        data: { message: 'Rate limit exceeded' }
      };

      jest.spyOn(a11ops.client, 'post').mockRejectedValue(error);

      try {
        await a11ops.alert({ title: "Test" });
      } catch (err) {
        expect(err.message).toBe('Rate limit exceeded');
        expect(err.status).toBe(429);
      }
    });

    test('handles network errors', async () => {
      const error = new Error('Network error');
      error.request = {};

      jest.spyOn(a11ops.client, 'post').mockRejectedValue(error);

      await expect(a11ops.alert({ title: "Test" }))
        .rejects.toThrow('No response from a11ops API');
    });
  });
});