export interface A11opsOptions {
  baseUrl?: string;
  region?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface AlertPayload {
  title?: string;
  message?: string;
  body?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp?: string;
  [key: string]: any;
}

export interface MetricsOptions {
  workspaceId?: string;
  region?: string;
  startDate?: string;
  endDate?: string;
}

export interface SLAOptions {
  workspaceId?: string;
  period?: '24h' | '7d' | '30d';
}

export interface DeliveryMetrics {
  total: number;
  delivered: number;
  failed: number;
  pending: number;
  avgLatency: number;
  p99Latency: number;
  p95Latency: number;
  byRegion: Record<string, {
    total: number;
    delivered: number;
    failed: number;
    avgLatency: number;
  }>;
  raw: any[];
}

export interface SLACompliance {
  period: string;
  compliance: Array<{
    workspace_id: string;
    workspace_name: string;
    total_alerts: number;
    delivered_alerts: number;
    delivery_rate: number;
    avg_latency_ms: number;
    p99_latency_compliance: number;
    uptime_compliance: number;
    sla_met: boolean;
  }>;
  summary: {
    total_workspaces: number;
    meeting_sla: number;
    overall_delivery_rate: number;
  };
}

declare class A11ops {
  constructor(apiKey: string, options?: A11opsOptions);
  
  alert(payload: AlertPayload): Promise<any>;
  batchAlert(alerts: AlertPayload[]): Promise<any>;
  getMetrics(options?: MetricsOptions): Promise<DeliveryMetrics>;
  getSLACompliance(options?: SLAOptions): Promise<SLACompliance>;
}

// Simple API types
export interface SimpleAlertPayload {
  title?: string;
  message?: string;
  body?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp?: string;
  [key: string]: any;
}

export interface SimpleA11opsInstance {
  alert(payload: SimpleAlertPayload): Promise<any>;
  critical(title: string, message?: string): Promise<any>;
  critical(payload: SimpleAlertPayload): Promise<any>;
  error(title: string, message?: string): Promise<any>;
  error(payload: SimpleAlertPayload): Promise<any>;
  warning(title: string, message?: string): Promise<any>;
  warning(payload: SimpleAlertPayload): Promise<any>;
  info(title: string, message?: string): Promise<any>;
  info(payload: SimpleAlertPayload): Promise<any>;
  configure(options: { apiKey?: string }): SimpleA11opsInstance;
}

// Export the simple API instance
export const a11ops: SimpleA11opsInstance;

// Default export is the class
export default A11ops;