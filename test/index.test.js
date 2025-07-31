const a11ops = require('../src/index');

describe('a11ops SDK', () => {
  let client;

  beforeEach(() => {
    client = new a11ops('test-api-key', {
      baseUrl: 'http://localhost:3000',
      retries: 1,
      retryDelay: 100
    });
  });

  describe('Constructor', () => {
    test('throws error without API key', () => {
      expect(() => new a11ops()).toThrow('API key is required');
    });

    test('sets default options', () => {
      const defaultClient = new a11ops('test-key');
      expect(defaultClient.baseUrl).toBe('https://api.a11ops.com');
      expect(defaultClient.region).toBe('auto');
      expect(defaultClient.timeout).toBe(30000);
      expect(defaultClient.retries).toBe(3);
    });

    test('accepts custom options', () => {
      const customClient = new a11ops('test-key', {
        baseUrl: 'https://custom.api.com',
        region: 'eu-west-1',
        timeout: 10000,
        retries: 5
      });
      expect(customClient.baseUrl).toBe('https://custom.api.com');
      expect(customClient.region).toBe('eu-west-1');
      expect(customClient.timeout).toBe(10000);
      expect(customClient.retries).toBe(5);
    });
  });

  describe('alert()', () => {
    test('throws error without payload', async () => {
      await expect(client.alert()).rejects.toThrow('Alert payload is required');
    });

    test('adds default fields to payload', async () => {
      const mockRequest = jest.spyOn(client, '_request').mockResolvedValue({ success: true });
      
      await client.alert({ message: 'Test' });
      
      expect(mockRequest).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          title: 'Alert',
          message: 'Test',
          severity: 'info',
          timestamp: expect.any(String)
        })
      );
    });

    test('preserves custom fields', async () => {
      const mockRequest = jest.spyOn(client, '_request').mockResolvedValue({ success: true });
      
      await client.alert({
        title: 'Custom Title',
        message: 'Custom Message',
        severity: 'critical',
        customField: 'value'
      });
      
      expect(mockRequest).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          title: 'Custom Title',
          message: 'Custom Message',
          severity: 'critical',
          customField: 'value'
        })
      );
    });

    test('adds region when specified', async () => {
      client.region = 'us-west-2';
      const mockRequest = jest.spyOn(client, '_request').mockResolvedValue({ success: true });
      
      await client.alert({ message: 'Test' });
      
      expect(mockRequest).toHaveBeenCalledWith(
        '/alerts/test-api-key',
        expect.objectContaining({
          region: 'us-west-2'
        })
      );
    });
  });

  describe('batchAlert()', () => {
    test('throws error without alerts array', async () => {
      await expect(client.batchAlert()).rejects.toThrow('Alerts array is required');
      await expect(client.batchAlert([])).rejects.toThrow('must not be empty');
    });

    test('processes multiple alerts', async () => {
      const mockRequest = jest.spyOn(client, '_request').mockResolvedValue({ success: true });
      
      await client.batchAlert([
        { title: 'Alert 1' },
        { title: 'Alert 2' },
        { title: 'Alert 3' }
      ]);
      
      expect(mockRequest).toHaveBeenCalledWith(
        '/alerts/test-api-key/batch',
        {
          alerts: [
            expect.objectContaining({ title: 'Alert 1' }),
            expect.objectContaining({ title: 'Alert 2' }),
            expect.objectContaining({ title: 'Alert 3' })
          ]
        }
      );
    });
  });

  describe('getMetrics()', () => {
    test('builds query string correctly', async () => {
      const mockRequest = jest.spyOn(client, '_request').mockResolvedValue({ total: 100 });
      
      await client.getMetrics({
        workspaceId: 'ws-123',
        region: 'us-east-1',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
      
      expect(mockRequest).toHaveBeenCalledWith(
        '/v1/metrics/delivery?workspaceId=ws-123&region=us-east-1&startDate=2024-01-01&endDate=2024-01-31',
        null,
        'GET'
      );
    });
  });

  describe('_request()', () => {
    test('retries on server errors', async () => {
      let attempts = 0;
      jest.spyOn(client.client, 'request').mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          const error = new Error('Server Error');
          error.response = { status: 500, data: { message: 'Internal Server Error' } };
          return Promise.reject(error);
        }
        return Promise.resolve({ data: { success: true } });
      });

      const result = await client._request('/test', {});
      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    test('does not retry on client errors', async () => {
      const error = new Error('Bad Request');
      error.response = { status: 400, data: { message: 'Invalid payload' } };
      
      jest.spyOn(client.client, 'request').mockRejectedValue(error);

      await expect(client._request('/test', {})).rejects.toThrow('Invalid payload');
    });

    test('formats errors correctly', async () => {
      const error = new Error('Network Error');
      error.request = {};
      
      jest.spyOn(client.client, 'request').mockRejectedValue(error);

      try {
        await client._request('/test', {});
      } catch (err) {
        expect(err.message).toBe('No response received from a11ops API');
        expect(err.code).toBe('ENORESPONSE');
      }
    });
  });
});