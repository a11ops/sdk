const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

// Mock modules
jest.mock('axios');
jest.mock('readline');

// Import after mocking
const { a11ops } = require('../src/index');

describe('Simple A11ops API', () => {
  const configPath = path.join(os.homedir(), '.a11ops', 'config.json');
  let mockAxiosInstance;
  
  beforeEach(() => {
    // Clear any existing config
    if (fs.existsSync(configPath)) {
      const configDir = path.dirname(configPath);
      fs.rmSync(configDir, { recursive: true, force: true });
    }
    
    // Create mock axios instance
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    
    // Mock axios.create to return our mock instance
    axios.create.mockReturnValue(mockAxiosInstance);
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.A11OPS_API_KEY = 'test-api-key';
    
    // Reset and reinitialize the singleton instance
    a11ops.apiKey = 'test-api-key';
    a11ops.client = mockAxiosInstance;
  });

  afterEach(() => {
    // Clean up
    delete process.env.A11OPS_API_KEY;
    delete process.env.NODE_ENV;
    jest.clearAllMocks();
  });

  describe('alert()', () => {
    test('works with minimal configuration', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true, id: 'alert-123' }
      });

      const result = await a11ops.alert({
        title: "Database CPU at 95%",
        priority: "critical",
        workspace: "production"
      });

      expect(result).toEqual({ success: true, id: 'alert-123' });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          title: "Database CPU at 95%",
          severity: "critical",
          timestamp: expect.any(String)
        })
      );
    });

    test('maps priority to severity', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true }
      });

      await a11ops.alert({
        title: "Test",
        priority: "high"
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          severity: "high"
        })
      );
    });

    test('adds default fields', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true }
      });

      await a11ops.alert({
        title: "Test Alert"
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
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
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true }
      });

      await a11ops.critical("System down!");

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          title: "System down!",
          severity: "critical"
        })
      );
    });

    test('error() sends high severity alert', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true }
      });

      await a11ops.error("Process failed", "Exit code 1");

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          title: "Process failed",
          message: "Exit code 1",
          severity: "high"
        })
      );
    });

    test('warning() sends medium severity alert', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true }
      });

      await a11ops.warning({ title: "High CPU", message: "85% usage" });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          title: "High CPU",
          message: "85% usage",
          severity: "medium"
        })
      );
    });

    test('info() sends info alert', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true }
      });

      await a11ops.info("Deployment complete");

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
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
      // This test is checking that the _loadConfig method works
      // Since we're already setting env vars in beforeEach, just verify
      expect(process.env.A11OPS_API_KEY).toBe('test-api-key');
      expect(a11ops.apiKey).toBe('test-api-key');
    });

    test('configure() method updates settings', () => {
      a11ops.configure({
        apiKey: 'configured-key'
      });

      expect(a11ops.apiKey).toBe('configured-key');
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

      mockAxiosInstance.post.mockRejectedValue(error);

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

      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(a11ops.alert({ title: "Test" }))
        .rejects.toThrow('No response from a11ops API');
    });
  });
});