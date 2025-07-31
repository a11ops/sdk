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
  workspace: "production", // Default workspace
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

## Local Development

The SDK stores configuration in `~/.a11ops/config.json` after initial setup. To reset:

```bash
rm -rf ~/.a11ops
```

## Support

- 📚 Documentation: [https://docs.a11ops.com](https://docs.a11ops.com)
- 🐛 Issues: [https://github.com/a11ops/sdk/issues](https://github.com/a11ops/sdk/issues)
- 💬 Discord: [https://discord.gg/a11ops](https://discord.gg/a11ops)
- 📧 Email: ali@a11ops.com

## License

MIT
