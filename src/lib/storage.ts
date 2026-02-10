import { ApiConfig, SyncLog, Alert, TerminatedEmployee, OffboardingAlert } from '@/types/inventory';
import { apiClient } from './api';

const STORAGE_KEYS = {
  API_CONFIG: 'inventory_api_config',
  SYNC_LOGS: 'inventory_sync_logs',
  ALERTS: 'inventory_alerts',
  LAST_SYNC: 'inventory_last_sync',
  TERMINATED_EMPLOYEES: 'inventory_terminated_employees',
  CSV_DATA: 'inventory_csv_data',
  OFFBOARDING_ALERTS: 'inventory_offboarding_alerts',
};

const defaultApiConfig: ApiConfig = {
  vicarius: { baseUrl: '', apiKey: '' },
  cortex: { baseUrl: '', apiToken: '' },
  warp: { baseUrl: '', apiToken: '' },
  pam: { baseUrl: '', apiToken: '' },
  jumpcloud: { baseUrl: '', apiToken: '' },
};

const defaultCsvData = {
  vicarius: null,
  cortex: null,
  warp: null,
  pam: null,
  jumpcloud: null,
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

export async function getSyncLogs(): Promise<SyncLog[]> {
  try {
    // Try backend first
    try {
      return await apiClient.get('/logs');
    } catch (apiError) {
      console.warn('Backend logs unreachable, falling back to localStorage');
    }

    const stored = localStorage.getItem(STORAGE_KEYS.SYNC_LOGS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading sync logs:', error);
  }
  return [];
}

export async function addSyncLog(log: SyncLog): Promise<void> {
  try {
    // Save to backend
    try {
      await apiClient.post('/logs', log);
    } catch (apiError) {
      console.warn('Failed to save log to backend');
    }

    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNC_LOGS) || '[]');
    logs.unshift(log);
    const trimmedLogs = logs.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Error saving sync log:', error);
  }
}

export async function getAlerts(): Promise<Alert[]> {
  try {
    // Try backend first
    try {
      return await apiClient.get('/alerts');
    } catch (apiError) {
      console.warn('Backend alerts unreachable, falling back to localStorage');
    }

    const stored = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading alerts:', error);
  }
  return [];
}

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  try {
    // We only save new alerts to the backend individually in practice, 
    // but for compatibility with existing code that saves the whole list:
    for (const alert of alerts) {
      // In v2.0, we might want a bulk endpoint, but for now:
      try {
        await apiClient.post('/alerts', alert);
      } catch (e) { }
    }

    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  } catch (error) {
    console.error('Error saving alerts:', error);
  }
}

export async function clearAlerts(): Promise<void> {
  try {
    try {
      await apiClient.delete('/alerts');
    } catch (e) { }
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
  } catch (error) {
    console.error('Error clearing alerts:', error);
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

  // Automatically create offboarding alert
  const offboardingAlert: OffboardingAlert = {
    id: `oa-${Date.now()}`,
    employeeId: employee.id,
    employeeName: employee.name,
    employeeEmail: employee.email,
    createdAt: new Date().toISOString(),
    status: 'pending',
    checklist: {
      adDisabled: false,
      adMoved: false,
      googleDisabled: false,
      googlePasswordChanged: false,
      autoReplySet: false,
      googleTakeoutDone: false,
      machineCollected: false,
      machineBackup: false,
      glpiUpdated: false,
      licensesRemoved: false,
      licensesConfirmed: false,
    },
  };
  addOffboardingAlert(offboardingAlert);
}

export function getOffboardingAlerts(): OffboardingAlert[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.OFFBOARDING_ALERTS);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading offboarding alerts:', error);
  }
  return [];
}

export function saveOffboardingAlerts(alerts: OffboardingAlert[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OFFBOARDING_ALERTS, JSON.stringify(alerts));
  } catch (error) {
    console.error('Error saving offboarding alerts:', error);
  }
}

export function addOffboardingAlert(alert: OffboardingAlert): void {
  const alerts = getOffboardingAlerts();
  alerts.unshift(alert);
  saveOffboardingAlerts(alerts);
}

export function cleanupOrphanedOffboardingAlerts(): void {
  const alerts = getOffboardingAlerts();
  const employees = getTerminatedEmployees();
  const employeeIds = new Set(employees.map(e => e.id));

  const filteredAlerts = alerts.filter(a => employeeIds.has(a.employeeId));
  if (filteredAlerts.length !== alerts.length) {
    saveOffboardingAlerts(filteredAlerts);
  }
}

export function updateOffboardingAlert(alert: OffboardingAlert): void {
  const alerts = getOffboardingAlerts();
  const index = alerts.findIndex((a) => a.id === alert.id);
  if (index !== -1) {
    alerts[index] = alert;
    saveOffboardingAlerts(alerts);
  }
}

export function deleteTerminatedEmployee(id: string): void {
  const employees = getTerminatedEmployees();
  const filtered = employees.filter((e) => e.id !== id);
  saveTerminatedEmployees(filtered);

  // Also remove associated offboarding alert
  const alerts = getOffboardingAlerts();
  const filteredAlerts = alerts.filter((a) => a.employeeId !== id);
  saveOffboardingAlerts(filteredAlerts);
}

export function updateTerminatedEmployee(employee: TerminatedEmployee): void {
  const employees = getTerminatedEmployees();
  const index = employees.findIndex((e) => e.id === employee.id);
  if (index !== -1) {
    employees[index] = employee;
    saveTerminatedEmployees(employees);
  }
}

// CSV Data functions
export interface CsvData {
  vicarius: any[] | null;
  cortex: any[] | null;
  warp: any[] | null;
  pam: any[] | null;
  jumpcloud: any[] | null;
}

export interface CsvMetadata {
  tool: keyof CsvData;
  filename: string;
  timestamp: string;
  count: number;
}

export function getCsvData(): CsvData {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CSV_DATA);
    if (stored) {
      return { ...defaultCsvData, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error reading CSV data from localStorage:', error);
  }
  return defaultCsvData;
}

export function saveCsvData(tool: keyof CsvData, data: any[] | null, metadata?: CsvMetadata | null): void {
  try {
    const current = getCsvData();
    const updated = { ...current, [tool]: data };
    localStorage.setItem(STORAGE_KEYS.CSV_DATA, JSON.stringify(updated));

    if (metadata !== undefined) {
      const allMeta = getCsvMetadata();
      allMeta[tool] = metadata;
      localStorage.setItem('inventory_csv_metadata', JSON.stringify(allMeta));
    }
  } catch (error) {
    console.error('Error saving CSV data to localStorage:', error);
  }
}

export function getCsvMetadata(): Record<string, CsvMetadata | null> {
  try {
    const stored = localStorage.getItem('inventory_csv_metadata');
    if (stored) return JSON.parse(stored);
  } catch (e) { console.error(e); }
  return { vicarius: null, cortex: null, warp: null, pam: null, jumpcloud: null };
}
