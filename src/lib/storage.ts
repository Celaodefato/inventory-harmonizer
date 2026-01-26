import { ApiConfig, SyncLog, Alert } from '@/types/inventory';

const STORAGE_KEYS = {
  API_CONFIG: 'inventory_api_config',
  SYNC_LOGS: 'inventory_sync_logs',
  ALERTS: 'inventory_alerts',
  LAST_SYNC: 'inventory_last_sync',
};

const defaultApiConfig: ApiConfig = {
  vicarius: { baseUrl: '', apiKey: '' },
  cortex: { baseUrl: '', apiToken: '' },
  warp: { baseUrl: '', apiToken: '' },
};

export function getApiConfig(): ApiConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading API config from localStorage:', error);
  }
  return defaultApiConfig;
}

export function saveApiConfig(config: ApiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving API config to localStorage:', error);
  }
}

export function getSyncLogs(): SyncLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SYNC_LOGS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading sync logs from localStorage:', error);
  }
  return [];
}

export function addSyncLog(log: SyncLog): void {
  try {
    const logs = getSyncLogs();
    logs.unshift(log);
    // Keep only last 100 logs
    const trimmedLogs = logs.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Error saving sync log to localStorage:', error);
  }
}

export function getAlerts(): Alert[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading alerts from localStorage:', error);
  }
  return [];
}

export function saveAlerts(alerts: Alert[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  } catch (error) {
    console.error('Error saving alerts to localStorage:', error);
  }
}

export function clearAlerts(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
  } catch (error) {
    console.error('Error clearing alerts from localStorage:', error);
  }
}

export function getLastSync(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  } catch (error) {
    console.error('Error reading last sync from localStorage:', error);
    return null;
  }
}

export function setLastSync(timestamp: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
  } catch (error) {
    console.error('Error saving last sync to localStorage:', error);
  }
}

export function isApiConfigured(tool: 'vicarius' | 'cortex' | 'warp'): boolean {
  const config = getApiConfig();
  if (tool === 'vicarius') {
    return !!(config.vicarius.baseUrl && config.vicarius.apiKey);
  } else if (tool === 'cortex') {
    return !!(config.cortex.baseUrl && config.cortex.apiToken);
  } else {
    return !!(config.warp.baseUrl && config.warp.apiToken);
  }
}

export function isAnyApiConfigured(): boolean {
  return isApiConfigured('vicarius') || isApiConfigured('cortex') || isApiConfigured('warp');
}
