# Example Dockerfile showing @a11ops/sdk usage in containers
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including @a11ops/sdk
RUN npm ci --only=production

# Copy application code
COPY . .

# Set the API key via environment variable
# In production, use secrets management:
# - Docker Swarm secrets
# - Kubernetes secrets
# - AWS ECS task definitions
# - etc.
ENV A11OPS_API_KEY=${A11OPS_API_KEY}

# Your app is ready! The SDK will automatically use the env var
CMD ["node", "server.js"]

# server.js example:
# import { a11ops } from '@a11ops/sdk';
# 
# // Notify when container starts
# await a11ops.info({
#   title: "Container Started",
#   message: `Service running on port ${PORT}`,
#   metadata: {
#     container_id: process.env.HOSTNAME,
#     node_version: process.version
#   }
# });
# 
# // Monitor health
# setInterval(async () => {
#   const health = await checkHealth();
#   if (!health.ok) {
#     await a11ops.warning("Health Check Failed", health.message);
#   }
# }, 60000);