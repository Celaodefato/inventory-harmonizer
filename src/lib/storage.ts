import { ApiConfig, SyncLog, Alert, TerminatedEmployee } from '@/types/inventory';

const STORAGE_KEYS = {
  API_CONFIG: 'inventory_api_config',
  SYNC_LOGS: 'inventory_sync_logs',
  ALERTS: 'inventory_alerts',
  LAST_SYNC: 'inventory_last_sync',
  TERMINATED_EMPLOYEES: 'inventory_terminated_employees',
};

const defaultApiConfig: ApiConfig = {
  vicarius: { baseUrl: '', apiKey: '' },
  cortex: { baseUrl: '', apiToken: '' },
  warp: { baseUrl: '', apiToken: '' },
  pam: { baseUrl: '', apiToken: '' },
  jumpcloud: { baseUrl: '', apiToken: '' },
};

export function getApiConfig(): ApiConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure new fields exist
      return { ...defaultApiConfig, ...parsed };
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

export function isApiConfigured(tool: 'vicarius' | 'cortex' | 'warp' | 'pam' | 'jumpcloud'): boolean {
  const config = getApiConfig();
  if (tool === 'vicarius') {
    return !!(config.vicarius.baseUrl && config.vicarius.apiKey);
  } else if (tool === 'cortex') {
    return !!(config.cortex.baseUrl && config.cortex.apiToken);
  } else if (tool === 'warp') {
    return !!(config.warp.baseUrl && config.warp.apiToken);
  } else if (tool === 'pam') {
    return !!(config.pam.baseUrl && config.pam.apiToken);
  } else {
    return !!(config.jumpcloud.baseUrl && config.jumpcloud.apiToken);
  }
}

export function isAnyApiConfigured(): boolean {
  return (
    isApiConfigured('vicarius') ||
    isApiConfigured('cortex') ||
    isApiConfigured('warp') ||
    isApiConfigured('pam') ||
    isApiConfigured('jumpcloud')
  );
}

// Terminated Employees functions
export function getTerminatedEmployees(): TerminatedEmployee[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TERMINATED_EMPLOYEES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading terminated employees from localStorage:', error);
  }
  return [];
}

export function saveTerminatedEmployees(employees: TerminatedEmployee[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TERMINATED_EMPLOYEES, JSON.stringify(employees));
  } catch (error) {
    console.error('Error saving terminated employees to localStorage:', error);
  }
}

export function addTerminatedEmployee(employee: TerminatedEmployee): void {
  const employees = getTerminatedEmployees();
  employees.unshift(employee);
  saveTerminatedEmployees(employees);
}

export function deleteTerminatedEmployee(id: string): void {
  const employees = getTerminatedEmployees();
  const filtered = employees.filter((e) => e.id !== id);
  saveTerminatedEmployees(filtered);
}

export function updateTerminatedEmployee(employee: TerminatedEmployee): void {
  const employees = getTerminatedEmployees();
  const index = employees.findIndex((e) => e.id === employee.id);
  if (index !== -1) {
    employees[index] = employee;
    saveTerminatedEmployees(employees);
  }
}
