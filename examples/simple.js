// Simple usage example
import { a11ops } from '@a11ops/sdk';

// That's it. Send critical alerts instantly.
await a11ops.alert({
  title: "Database CPU at 95%",
  priority: "critical",
  workspace: "production"
});

// More examples of the simple API

// Quick alerts with severity helpers
await a11ops.critical("Payment system down!");
await a11ops.error("Failed to send email", "SMTP connection timeout");
await a11ops.warning("High memory usage detected");
await a11ops.info("Deployment completed successfully");

// Detailed alert with metadata
await a11ops.alert({
  title: "Order Processing Failed",
  message: "Unable to charge customer card",
  priority: "high",
  metadata: {
    orderId: "ORD-12345",
    customerId: "CUST-67890",
    amount: 299.99,
    error: "Card declined",
    retryCount: 3
  }
});

// Error handling
try {
  await a11ops.alert({
    title: "Test Alert",
    priority: "info"
  });
  console.log("✅ Alert sent successfully!");
} catch (error) {
  console.error("❌ Failed to send alert:", error.message);
}