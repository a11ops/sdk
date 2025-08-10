# @a11ops/sdk

Official Node.js SDK for [a11ops](https://a11ops.com) - Enterprise-grade push notification infrastructure for critical alerts.

## Installation

```bash
npm install @a11ops/sdk
```

## Quick Start - 2 Lines of Code!

```javascript
import { a11ops } from "@a11ops/sdk";

// That's it. Send critical alerts instantly.
await a11ops.alert({
  title: "Database CPU at 95%",
  priority: "critical",
  workspace: "production",
});
```

## Zero Configuration Setup

The SDK automatically handles authentication for you:

1. **First time?** Run your code and follow the interactive setup
2. **CI/Production?** Set the `A11OPS_API_KEY` environment variable
3. **Already configured?** Just start sending alerts!

## Usage Examples

### Simple Alerts

```javascript
import { a11ops } from "@a11ops/sdk";

// Send alerts with different priorities
await a11ops.critical("Payment gateway down!");
await a11ops.error("Failed to process order", "Order ID: 12345");
await a11ops.warning("High memory usage", "Server using 85% RAM");
await a11ops.info("Deployment completed", "Version 2.0.1 live");
```

### Detailed Alerts

```javascript
await a11ops.alert({
  title: "Database Connection Lost",
  message: "Primary database unreachable",
  priority: "critical",
  workspace: "production",
  metadata: {
    server: "db-primary-01",
    region: "us-east-1",
    connectionPool: 0,
  },
});
```

### Error Monitoring

```javascript
process.on("uncaughtException", async (error) => {
  await a11ops.critical({
    title: `Uncaught Exception: ${error.message}`,
    message: error.stack,
    workspace: "production",
  });
});
```

### Express.js Integration

```javascript
app.use(async (err, req, res, next) => {
  await a11ops.error({
    title: "API Error",
    message: `${req.method} ${req.path}: ${err.message}`,
    metadata: {
      statusCode: err.status || 500,
      userId: req.user?.id,
      requestId: req.id,
    },
  });

  res.status(500).json({ error: "Internal Server Error" });
});
```

## Configuration

### Environment Variables

```bash
# Set your API key (required in production)
A11OPS_API_KEY=your-api-key

# Optional: Set default workspace
A11OPS_DEFAULT_WORKSPACE=production

# Optional: Custom API endpoint
A11OPS_API_URL=https://api.a11ops.com
```

### Programmatic Configuration

```javascript
import { a11ops } from "@a11ops/sdk";

// Configure once in your app initialization
a11ops.configure({
  apiKey: "your-api-key", // Optional if set via env
});
```

## Traditional API (Class-based)

For more control, you can use the class-based API:

```javascript
import A11ops from "@a11ops/sdk";

const client = new A11ops("your-api-key", {
  baseUrl: "https://api.a11ops.com",
  region: "us-west-2",
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
});

await client.alert({
  title: "Alert Title",
  severity: "critical",
});

// Batch alerts
await client.batchAlert([
  { title: "Alert 1" },
  { title: "Alert 2" },
  { title: "Alert 3" },
]);

// Get metrics
const metrics = await client.getMetrics({
  workspaceId: "workspace-123",
  period: "7d",
});
```

## TypeScript

Full TypeScript support with type definitions included:

```typescript
import { a11ops } from "@a11ops/sdk";

interface CustomAlert {
  userId: string;
  action: string;
  timestamp: Date;
}

await a11ops.alert<CustomAlert>({
  title: "User Action",
  priority: "info",
  metadata: {
    userId: "user-123",
    action: "login",
    timestamp: new Date(),
  },
});
```

## Priority Levels

- `critical` - Immediate attention required
- `high` - High priority issues
- `medium` - Warning conditions
- `low` - Low priority notifications
- `info` - Informational messages

## Error Handling

```javascript
try {
  await a11ops.alert({ title: "Test Alert" });
} catch (error) {
  if (error.status === 429) {
    console.log("Rate limit exceeded");
  } else {
    console.error("Failed to send alert:", error.message);
  }
}
```

### Log Monitoring

a11ops includes comprehensive log monitoring capabilities. Automatically capture and track errors with rich context, breadcrumbs, and user information.

### Quick Start

```javascript
import A11ops from "@a11ops/sdk";

const client = new A11ops("your-api-key", {
  logMonitoring: true, // Enable log monitoring
  environment: "production",
  release: "1.0.0",
});

// Errors are now automatically captured!
// Manual capture also available:
client.captureError(new Error("Something went wrong"), {
  level: "error",
  tags: { module: "payment" },
  user: { id: "123", email: "user@example.com" },
});
```

### Automatic Error Capture

```javascript
// Browser: Automatically captures unhandled errors and promise rejections
window.addEventListener("error", (e) => {
  /* Handled automatically */
});

// Node.js: Automatically captures uncaught exceptions
process.on("uncaughtException", (e) => {
  /* Handled automatically */
});
```

### Breadcrumbs & Context

```javascript
// Add breadcrumbs for debugging
client.addBreadcrumb({
  message: "User clicked checkout",
  category: "user-action",
  level: "info",
});

// Set user context
client.setUser({
  id: "user-123",
  email: "user@example.com",
  username: "johndoe",
});

// Set additional context
client.setContext("subscription", {
  plan: "enterprise",
  seats: 50,
});

// Set tags for filtering
client.setTag("release", "2.0.1");
client.setTag("environment", "production");
```

### Express.js Error Tracking

```javascript
app.use((err, req, res, next) => {
  // Capture error with request context
  client.captureError(err, {
    level: "error",
    user: req.user,
    extra: {
      method: req.method,
      url: req.url,
      ip: req.ip,
    },
    tags: {
      endpoint: `${req.method} ${req.path}`,
    },
  });

  res.status(500).json({ error: "Internal Server Error" });
});
```

### Capture Messages

```javascript
// Capture informational messages
client.captureMessage("Payment processed successfully", "info", {
  extra: { amount: 99.99, currency: "USD" },
});
```

## Local Development

The SDK stores configuration in `~/.a11ops/config.json` in your home directory (not your project directory) after initial setup.

### Security Notes

- **Configuration location**: `~/.a11ops/config.json` is stored in your home directory, not your project
- **API keys**: Never commit API keys to version control
- **Environment variables**: Use `A11OPS_API_KEY` in production instead of config files
- **CI/CD**: Always use environment variables, never config files

### Reset Configuration

To reset your local configuration:

```bash
rm -rf ~/.a11ops
```

### Best Practices

1. **Development**: Use the interactive setup for local development
2. **Production**: Always use environment variables:
   ```bash
   export A11OPS_API_KEY=your-api-key
   ```
3. **Version Control**: Add to `.gitignore` if you ever store keys in your project:
   ```gitignore
   # A11ops configuration
   .a11ops/
   *.a11ops.json
   ```

## Support

- 📚 Documentation: [https://a11ops.com/docs](https://a11ops.com/docs)
- 🐛 Issues: [https://github.com/a11ops/sdk/issues](https://github.com/a11ops/sdk/issues)
- 💬 Discord: [https://discord.gg/ywZvTAHT8N](https://discord.gg/ywZvTAHT8N)
- 📧 Email: ali@a11ops.com

## License

MIT
