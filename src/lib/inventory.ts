import { Endpoint, NormalizedEndpoint, ComparisonResult, Alert } from '@/types/inventory';
import { mockVicariusEndpoints, mockCortexEndpoints, mockWarpEndpoints } from '@/data/mockData';
import { getApiConfig, isApiConfigured } from './storage';

// Normalize hostname for comparison (lowercase, trim)
function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().trim();
}

// Normalize endpoint data from any source
export function normalizeEndpoint(endpoint: Endpoint): NormalizedEndpoint {
  return {
    hostname: normalizeHostname(endpoint.hostname),
    ip: endpoint.ip.trim(),
    uuid: endpoint.uuid.trim(),
    os: endpoint.os,
    lastSeen: endpoint.lastSeen,
    sources: [endpoint.source],
  };
}

// Fetch endpoints from Vicarius API (or mock)
export async function fetchVicariusEndpoints(): Promise<Endpoint[]> {
  if (!isApiConfigured('vicarius')) {
    // Return mock data if not configured
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    return mockVicariusEndpoints;
  }

  const config = getApiConfig();
  try {
    const response = await fetch(`${config.vicarius.baseUrl}/api/endpoints`, {
      headers: {
        'Authorization': `Bearer ${config.vicarius.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Vicarius API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id || item.uuid,
      hostname: item.hostname || item.name,
      ip: item.ip || item.ipAddress,
      uuid: item.uuid || item.id,
      os: item.os || item.operatingSystem,
      lastSeen: item.lastSeen || item.lastSeenAt,
      source: 'vicarius' as const,
    }));
  } catch (error) {
    console.error('Error fetching from Vicarius:', error);
    throw error;
  }
}

// Fetch endpoints from Cortex API (or mock)
export async function fetchCortexEndpoints(): Promise<Endpoint[]> {
  if (!isApiConfigured('cortex')) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockCortexEndpoints;
  }

  const config = getApiConfig();
  try {
    const response = await fetch(`${config.cortex.baseUrl}/api/v1/endpoints`, {
      headers: {
        'X-API-Token': config.cortex.apiToken,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Cortex API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id || item.endpoint_id,
      hostname: item.hostname || item.endpoint_name,
      ip: item.ip || item.ip_address,
      uuid: item.uuid || item.endpoint_id,
      os: item.os || item.platform,
      lastSeen: item.lastSeen || item.last_seen,
      source: 'cortex' as const,
    }));
  } catch (error) {
    console.error('Error fetching from Cortex:', error);
    throw error;
  }
}

// Fetch endpoints from Warp API (or mock)
export async function fetchWarpEndpoints(): Promise<Endpoint[]> {
  if (!isApiConfigured('warp')) {
    await new Promise(resolve => setTimeout(resolve, 550));
    return mockWarpEndpoints;
  }

  const config = getApiConfig();
  try {
    const response = await fetch(`${config.warp.baseUrl}/v1/devices`, {
      headers: {
        'Authorization': `Token ${config.warp.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Warp API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id || item.device_id,
      hostname: item.hostname || item.device_name,
      ip: item.ip || item.ipv4,
      uuid: item.uuid || item.device_id,
      os: item.os || item.os_type,
      lastSeen: item.lastSeen || item.last_connected,
      source: 'warp' as const,
    }));
  } catch (error) {
    console.error('Error fetching from Warp:', error);
    throw error;
  }
}

// Compare inventories and find differences
export function compareInventories(
  vicariusEndpoints: Endpoint[],
  cortexEndpoints: Endpoint[],
  warpEndpoints: Endpoint[]
): ComparisonResult {
  const endpointMap = new Map<string, NormalizedEndpoint>();

  // Helper to get unique key for endpoint
  const getKey = (endpoint: Endpoint): string => {
    return normalizeHostname(endpoint.hostname);
  };

  // Process Vicarius endpoints
  vicariusEndpoints.forEach(endpoint => {
    const key = getKey(endpoint);
    const normalized = normalizeEndpoint(endpoint);
    endpointMap.set(key, normalized);
  });

  // Process Cortex endpoints
  cortexEndpoints.forEach(endpoint => {
    const key = getKey(endpoint);
    const existing = endpointMap.get(key);
    if (existing) {
      existing.sources.push('cortex');
    } else {
      const normalized = normalizeEndpoint(endpoint);
      endpointMap.set(key, normalized);
    }
  });

  // Process Warp endpoints
  warpEndpoints.forEach(endpoint => {
    const key = getKey(endpoint);
    const existing = endpointMap.get(key);
    if (existing) {
      existing.sources.push('warp');
    } else {
      const normalized = normalizeEndpoint(endpoint);
      endpointMap.set(key, normalized);
    }
  });

  const allEndpoints = Array.from(endpointMap.values());

  const onlyVicarius = allEndpoints.filter(
    e => e.sources.length === 1 && e.sources.includes('vicarius')
  );

  const onlyCortex = allEndpoints.filter(
    e => e.sources.length === 1 && e.sources.includes('cortex')
  );

  const onlyWarp = allEndpoints.filter(
    e => e.sources.length === 1 && e.sources.includes('warp')
  );

  const inAllSources = allEndpoints.filter(
    e => e.sources.includes('vicarius') && e.sources.includes('cortex') && e.sources.includes('warp')
  );

  const missingFromVicarius = allEndpoints.filter(
    e => !e.sources.includes('vicarius')
  );

  const missingFromCortex = allEndpoints.filter(
    e => !e.sources.includes('cortex')
  );

  const missingFromWarp = allEndpoints.filter(
    e => !e.sources.includes('warp')
  );

  return {
    allEndpoints,
    onlyVicarius,
    onlyCortex,
    onlyWarp,
    inAllSources,
    missingFromVicarius,
    missingFromCortex,
    missingFromWarp,
  };
}

// Generate alerts from comparison results
export function generateAlerts(comparison: ComparisonResult): Alert[] {
  const alerts: Alert[] = [];
  const timestamp = new Date().toISOString();

  if (comparison.missingFromVicarius.length > 0) {
    alerts.push({
      id: `alert-vic-${Date.now()}`,
      type: 'warning',
      title: 'Endpoints ausentes no Vicarius',
      message: `${comparison.missingFromVicarius.length} máquina(s) não encontrada(s) no Vicarius`,
      timestamp,
      source: 'vicarius',
    });
  }

  if (comparison.missingFromCortex.length > 0) {
    alerts.push({
      id: `alert-ctx-${Date.now()}`,
      type: 'warning',
      title: 'Endpoints ausentes no Cortex',
      message: `${comparison.missingFromCortex.length} máquina(s) não encontrada(s) no Cortex`,
      timestamp,
      source: 'cortex',
    });
  }

  if (comparison.missingFromWarp.length > 0) {
    alerts.push({
      id: `alert-wrp-${Date.now()}`,
      type: 'warning',
      title: 'Endpoints ausentes no Warp',
      message: `${comparison.missingFromWarp.length} máquina(s) não encontrada(s) no Warp`,
      timestamp,
      source: 'warp',
    });
  }

  if (comparison.onlyVicarius.length > 0) {
    alerts.push({
      id: `alert-only-vic-${Date.now()}`,
      type: 'info',
      title: 'Exclusivos do Vicarius',
      message: `${comparison.onlyVicarius.length} máquina(s) existe(m) apenas no Vicarius`,
      timestamp,
      source: 'vicarius',
    });
  }

  if (comparison.onlyCortex.length > 0) {
    alerts.push({
      id: `alert-only-ctx-${Date.now()}`,
      type: 'info',
      title: 'Exclusivos do Cortex',
      message: `${comparison.onlyCortex.length} máquina(s) existe(m) apenas no Cortex`,
      timestamp,
      source: 'cortex',
    });
  }

  if (comparison.onlyWarp.length > 0) {
    alerts.push({
      id: `alert-only-wrp-${Date.now()}`,
      type: 'info',
      title: 'Exclusivos do Warp',
      message: `${comparison.onlyWarp.length} máquina(s) existe(m) apenas no Warp`,
      timestamp,
      source: 'warp',
    });
  }

  if (comparison.inAllSources.length > 0) {
    alerts.push({
      id: `alert-all-${Date.now()}`,
      type: 'info',
      title: 'Endpoints sincronizados',
      message: `${comparison.inAllSources.length} máquina(s) presente(s) em todas as ferramentas`,
      timestamp,
    });
  }

  return alerts;
}

// Export comparison to CSV
export function exportToCSV(endpoints: NormalizedEndpoint[], filename: string): void {
  const headers = ['Hostname', 'IP', 'UUID', 'OS', 'Última vez visto', 'Fontes'];
  const rows = endpoints.map(e => [
    e.hostname,
    e.ip,
    e.uuid,
    e.os || '',
    e.lastSeen || '',
    e.sources.join(', '),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}
