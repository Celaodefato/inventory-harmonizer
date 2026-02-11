import { ApiConfig, SyncLog, Alert, TerminatedEmployee, OffboardingAlert } from '@/types/inventory';
import { supabase } from './supabase';
import { apiClient } from './api';

const STORAGE_KEYS = {
  CSV_DATA: 'inventory_csv_data',
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
  jumpcloud_users: null,
};

// API Config
export async function getApiConfig(): Promise<ApiConfig> {
  try {
    const { data, error } = await supabase.from('api_config').select('*');
    if (error) throw error;

    const config = { ...defaultApiConfig };
    data?.forEach((item: any) => {
      if (item.tool_name && config[item.tool_name as keyof ApiConfig]) {
        (config as any)[item.tool_name] = {
          baseUrl: item.base_url || '',
          apiKey: item.api_key || '', // For Vicarius
          apiToken: item.api_key || '', // For others (mapped to api_key col)
        };
      }
    });
    return config;
  } catch (error) {
    console.error('Error reading API config from Supabase:', error);
    return defaultApiConfig;
  }
}

export async function saveApiConfig(config: ApiConfig): Promise<void> {
  try {
    const updates = Object.entries(config).map(([toolName, toolConfig]) => ({
      tool_name: toolName,
      base_url: toolConfig.baseUrl,
      api_key: (toolConfig as any).apiKey || (toolConfig as any).apiToken,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('api_config').upsert(updates, { onConflict: 'tool_name' });
    if (error) throw error;
  } catch (error) {
    console.error('Error saving API config to Supabase:', error);
  }
}

// Sync Logs
export async function getSyncLogs(): Promise<SyncLog[]> {
  try {
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;

    return data.map((item: any) => ({
      ...item,
      endpointCounts: {
        vicarius: item.vicarius_count,
        cortex: item.cortex_count,
        warp: item.warp_count,
        pam: item.pam_count,
        jumpcloud: item.jumpcloud_count,
      }
    }));
  } catch (error) {
    console.error('Error reading sync logs:', error);
    return [];
  }
}

export async function addSyncLog(log: SyncLog): Promise<void> {
  try {
    const dbLog = {
      timestamp: log.timestamp,
      status: log.status,
      message: log.message,
      details: log.details,
      vicarius_count: log.endpointCounts?.vicarius || 0,
      cortex_count: log.endpointCounts?.cortex || 0,
      warp_count: log.endpointCounts?.warp || 0,
      pam_count: log.endpointCounts?.pam || 0,
      jumpcloud_count: log.endpointCounts?.jumpcloud || 0,
    };

    const { error } = await supabase.from('sync_logs').insert(dbLog);
    if (error) throw error;
  } catch (error) {
    console.error('Error saving sync log:', error);
  }
}

// Alerts
export async function getAlerts(): Promise<Alert[]> {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error reading alerts:', error);
    return [];
  }
}

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  try {
    // Only save alerts that don't exist logic would be complex here, 
    // assuming bulk insert of generated alerts.
    // Ideally we should resolve alerts on backend, but for now:

    // Convert to DB format (remove 'id' if we want DB to gen it, or keep it)
    // Here we can just insert them. To avoid duplicates, we might want to clear old open alerts?
    // For this simple version, let's trust the logic generates unique IDs based on timestamps

    // Filter out alerts already in DB? No, this is replacing local storage state.
    // But in a shared DB, we shouldn't just dump everything.
    // Strategy: We will INSERT new alerts. The UI will have to manage "Read" status.
    // For now, let's INSERT.

    const dbAlerts = alerts.map(a => ({
      // id: a.id, // Let DB generate or use provided if unique
      title: a.title,
      message: a.message,
      type: a.type,
      source: a.source,
      timestamp: a.timestamp,
      is_read: false
    }));

    if (dbAlerts.length > 0) {
      const { error } = await supabase.from('alerts').insert(dbAlerts);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving alerts:', error);
  }
}

export async function clearAlerts(): Promise<void> {
  try {
    const { error } = await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (error) throw error;
  } catch (error) {
    console.error('Error clearing alerts:', error);
  }
}

// Last Sync
export async function getLastSync(): Promise<string | null> {
  const logs = await getSyncLogs();
  if (logs.length > 0 && logs[0].timestamp) {
    return logs[0].timestamp;
  }
  return null;
}

export async function setLastSync(timestamp: string): Promise<void> {
  // This is now handled by adding a log entry
}

// Helper synchronous check is tricky now. 
// We'll migrate isApiConfigured to async or check local cache if we implement context.
// For now, let's keep it but it might return false initially.
// BETTER: The App should load config on start.

// Terminated Employees
export async function getTerminatedEmployees(): Promise<TerminatedEmployee[]> {
  try {
    const { data, error } = await supabase
      .from('terminated_employees')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      terminationDate: item.termination_date, // Map from DB
      status: item.status,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error('Error reading terminated employees:', error);
    return [];
  }
}

export async function addTerminatedEmployee(employee: TerminatedEmployee): Promise<void> {
  const dbEmployee = {
    name: employee.name,
    email: employee.email,
    termination_date: employee.terminationDate,
    status: 'active'
  };

  const { data, error } = await supabase.from('terminated_employees').insert(dbEmployee).select();
  if (error) throw error;

  if (data && data[0]) {
    // Create Offboarding Alert
    const newId = data[0].id;
    const offboardingAlert = {
      employee_id: newId,
      employee_name: employee.name,
      employee_email: employee.email,
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
      }
    };
    await supabase.from('offboarding_alerts').insert(offboardingAlert);
  }
}

export async function updateTerminatedEmployee(employee: TerminatedEmployee): Promise<void> {
  const { error } = await supabase
    .from('terminated_employees')
    .update({
      name: employee.name,
      email: employee.email,
      termination_date: employee.terminationDate
    })
    .eq('id', employee.id);
  if (error) console.error(error);
}

export async function deleteTerminatedEmployee(id: string): Promise<void> {
  // Delete auth offboarding alert first (FK constraint) - or CASCADE if set in DB
  // Assuming we need to delete manually or DB handles it.
  await supabase.from('offboarding_alerts').delete().eq('employee_id', id);
  await supabase.from('terminated_employees').delete().eq('id', id);
}

// Offboarding
export async function getOffboardingAlerts(): Promise<OffboardingAlert[]> {
  try {
    const { data, error } = await supabase
      .from('offboarding_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      employeeId: item.employee_id,
      employeeName: item.employee_name,
      employeeEmail: item.employee_email,
      createdAt: item.created_at,
      status: item.status,
      checklist: item.checklist
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function updateOffboardingAlert(alert: OffboardingAlert): Promise<void> {
  const { error } = await supabase
    .from('offboarding_alerts')
    .update({
      status: alert.status,
      checklist: alert.checklist,
      updated_at: new Date().toISOString()
    })
    .eq('id', alert.id);
  if (error) console.error(error);
}

export async function saveOffboardingAlerts(alerts: OffboardingAlert[]): Promise<void> {
  // Used for bulk saves, but we should use individual updates
}

export async function addOffboardingAlert(alert: OffboardingAlert): Promise<void> {
  // Direct Insert handled
}

export async function cleanupOrphanedOffboardingAlerts(): Promise<void> {
  // Handled by DB constraints or manual logic
}


// CSV Data functions (Keep LocalStorage for now as it's temporary/session based file data)
export interface CsvData {
  vicarius: any[] | null;
  cortex: any[] | null;
  warp: any[] | null;
  pam: any[] | null;
  jumpcloud: any[] | null;
  jumpcloud_users: any[] | null;
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
