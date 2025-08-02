// Mock axios globally
jest.mock('axios');

// Mock readline for interactive prompts
jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    question: jest.fn((prompt, callback) => {
      // Immediately call the callback with a test API key
      callback('test-api-key');
    }),
    close: jest.fn()
  }))
}));

// Set default environment variables
process.env.NODE_ENV = 'test';
process.env.A11OPS_API_KEY = 'test-api-key';