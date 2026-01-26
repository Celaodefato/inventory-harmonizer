export interface Endpoint {
  id: string;
  hostname: string;
  ip: string;
  uuid: string;
  os?: string;
  lastSeen?: string;
  source: 'vicarius' | 'cortex' | 'warp';
}

export interface NormalizedEndpoint {
  hostname: string;
  ip: string;
  uuid: string;
  os?: string;
  lastSeen?: string;
  sources: ('vicarius' | 'cortex' | 'warp')[];
}

export interface ComparisonResult {
  allEndpoints: NormalizedEndpoint[];
  onlyVicarius: NormalizedEndpoint[];
  onlyCortex: NormalizedEndpoint[];
  onlyWarp: NormalizedEndpoint[];
  inAllSources: NormalizedEndpoint[];
  missingFromVicarius: NormalizedEndpoint[];
  missingFromCortex: NormalizedEndpoint[];
  missingFromWarp: NormalizedEndpoint[];
}

export interface ApiConfig {
  vicarius: {
    baseUrl: string;
    apiKey: string;
  };
  cortex: {
    baseUrl: string;
    apiToken: string;
  };
  warp: {
    baseUrl: string;
    apiToken: string;
  };
}

export interface SyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'error' | 'partial';
  message: string;
  details?: string;
  endpointCounts?: {
    vicarius: number;
    cortex: number;
    warp: number;
  };
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  source?: string;
}

export interface SyncStatus {
  isLoading: boolean;
  lastSync: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  message?: string;
}
