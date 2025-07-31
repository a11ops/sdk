// Examples showing how @a11ops/sdk works everywhere

import { a11ops } from '@a11ops/sdk';

// 1. Regular Node.js Application
async function nodeExample() {
  console.log('=== Node.js Example ===');
  
  await a11ops.alert({
    title: "Node.js App Started",
    message: "Application running on port 3000",
    priority: "info",
    metadata: {
      environment: "development",
      node_version: process.version,
      platform: process.platform
    }
  });
}

// 2. AWS Lambda Function
export async function handler(event, context) {
  console.log('=== AWS Lambda Example ===');
  
  try {
    // Process your Lambda event
    const result = await processEvent(event);
    
    // Alert on successful processing
    await a11ops.info({
      title: "Lambda Execution Complete",
      message: `Processed ${event.Records?.length || 0} records`,
      metadata: {
        requestId: context.requestId,
        functionName: context.functionName,
        remainingTime: context.getRemainingTimeInMillis()
      }
    });
    
    return result;
  } catch (error) {
    // Alert on errors
    await a11ops.error({
      title: "Lambda Function Error",
      message: error.message,
      metadata: {
        requestId: context.requestId,
        stack: error.stack
      }
    });
    
    throw error;
  }
}

// 3. Vercel/Next.js API Route
export async function GET(request) {
  console.log('=== Vercel Edge Function Example ===');
  
  try {
    const data = await fetchData();
    
    await a11ops.info({
      title: "API Request Handled",
      message: `GET ${request.url}`,
      metadata: {
        region: process.env.VERCEL_REGION,
        deployment: process.env.VERCEL_URL
      }
    });
    
    return Response.json(data);
  } catch (error) {
    await a11ops.critical({
      title: "Vercel API Error",
      message: error.message,
      metadata: {
        url: request.url,
        headers: Object.fromEntries(request.headers)
      }
    });
    
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 4. Docker Container
async function dockerExample() {
  console.log('=== Docker Container Example ===');
  
  await a11ops.alert({
    title: "Container Started",
    message: `Service ready in ${process.env.NODE_ENV} mode`,
    priority: "info",
    metadata: {
      container_id: process.env.HOSTNAME,
      image: process.env.DOCKER_IMAGE || 'unknown',
      memory_limit: process.env.CONTAINER_MEMORY_LIMIT
    }
  });
  
  // Health check endpoint
  setInterval(async () => {
    const health = await checkHealth();
    
    if (!health.healthy) {
      await a11ops.warning({
        title: "Container Health Check Failed",
        message: health.reason,
        metadata: health.details
      });
    }
  }, 60000); // Every minute
}

// 5. Kubernetes Pod
async function kubernetesExample() {
  console.log('=== Kubernetes Example ===');
  
  await a11ops.info({
    title: "Pod Started",
    message: "Application ready to receive traffic",
    metadata: {
      pod_name: process.env.HOSTNAME,
      namespace: process.env.POD_NAMESPACE,
      node_name: process.env.NODE_NAME,
      service_account: process.env.SERVICE_ACCOUNT
    }
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await a11ops.warning({
      title: "Pod Terminating",
      message: "Received SIGTERM, starting graceful shutdown",
      metadata: {
        pod_name: process.env.HOSTNAME
      }
    });
    
    await gracefulShutdown();
    process.exit(0);
  });
}

// 6. Google Cloud Functions
export async function gcfExample(req, res) {
  console.log('=== Google Cloud Function Example ===');
  
  try {
    const result = await processRequest(req);
    
    await a11ops.info({
      title: "Cloud Function Executed",
      message: `${req.method} ${req.path}`,
      metadata: {
        function_name: process.env.K_SERVICE,
        revision: process.env.K_REVISION,
        memory: process.env.FUNCTION_MEMORY_MB
      }
    });
    
    res.json(result);
  } catch (error) {
    await a11ops.error({
      title: "Cloud Function Error",
      message: error.message,
      metadata: {
        execution_id: req.headers['function-execution-id']
      }
    });
    
    res.status(500).json({ error: 'Function failed' });
  }
}

// 7. Azure Functions
module.exports = async function (context, req) {
  console.log('=== Azure Function Example ===');
  
  try {
    const result = await processAzureRequest(context, req);
    
    await a11ops.info({
      title: "Azure Function Completed",
      message: "Request processed successfully",
      metadata: {
        invocation_id: context.invocationId,
        function_name: context.executionContext.functionName,
        region: process.env.REGION_NAME
      }
    });
    
    context.res = {
      status: 200,
      body: result
    };
  } catch (error) {
    await a11ops.critical({
      title: "Azure Function Failed",
      message: error.message,
      metadata: {
        invocation_id: context.invocationId,
        trace: context.traceContext
      }
    });
    
    context.res = {
      status: 500,
      body: "Internal Server Error"
    };
  }
};

// Helper functions (stubs for the example)
async function processEvent(event) {
  return { processed: true };
}

async function fetchData() {
  return { data: 'example' };
}

async function checkHealth() {
  return { healthy: true };
}

async function gracefulShutdown() {
  console.log('Shutting down gracefully...');
}

async function processRequest(req) {
  return { success: true };
}

async function processAzureRequest(context, req) {
  return { success: true };
}

// Run the appropriate example based on environment
if (require.main === module) {
  const environment = process.env.RUNTIME_ENV || 'node';
  
  switch (environment) {
    case 'docker':
      dockerExample();
      break;
    case 'kubernetes':
      kubernetesExample();
      break;
    default:
      nodeExample();
  }
}