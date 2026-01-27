import { Endpoint, NormalizedEndpoint, ComparisonResult, Alert, TerminatedEmployee } from '@/types/inventory';
import {
  mockVicariusEndpoints,
  mockCortexEndpoints,
  mockWarpEndpoints,
  mockPamEndpoints,
  mockJumpcloudEndpoints
} from '@/data/mockData';
import { getApiConfig, isApiConfigured, getTerminatedEmployees, getCsvData } from './storage';

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().trim();
}

export function normalizeEndpoint(endpoint: Endpoint): NormalizedEndpoint {
  return {
    hostname: normalizeHostname(endpoint.hostname),
    ip: endpoint.ip.trim(),
    uuid: endpoint.uuid.trim(),
    os: endpoint.os,
    lastSeen: endpoint.lastSeen,
    sources: [endpoint.source],
    sourceOrigins: { [endpoint.source]: endpoint.origin },
    userId: endpoint.userId,
    userEmail: endpoint.userEmail,
  };
}

export async function fetchVicariusEndpoints(): Promise<Endpoint[]> {
  if (!isApiConfigured('vicarius')) {
    const csvData = getCsvData().vicarius;
    if (csvData && csvData.length > 0) return csvData;

    // Return empty instead of mock data
    return [];
  }

  const config = getApiConfig();
  try {
    const response = await fetch(`${config.vicarius.baseUrl}/api/endpoints`, {
      headers: {
        'Authorization': `Bearer ${config.vicarius.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`Vicarius API error: ${response.status}`);

    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id || item.uuid,
      hostname: item.hostname || item.name,
      ip: item.ip || item.ipAddress,
      uuid: item.uuid || item.id,
      os: item.os || item.operatingSystem,
      lastSeen: item.lastSeen || item.lastSeenAt,
      source: 'vicarius' as const,
      origin: 'api' as const,
      userEmail: item.userEmail || item.user_email,
    }));
  } catch (error) {
    console.error('Error fetching from Vicarius:', error);
    throw error;
  }
}

export async function fetchCortexEndpoints(): Promise<Endpoint[]> {
  if (!isApiConfigured('cortex')) {
    const csvData = getCsvData().cortex;
    if (csvData && csvData.length > 0) return csvData;

    return [];
  }

  const config = getApiConfig();
  try {
    const response = await fetch(`${config.cortex.baseUrl}/api/v1/endpoints`, {
      headers: {
        'X-API-Token': config.cortex.apiToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`Cortex API error: ${response.status}`);

    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id || item.endpoint_id,
      hostname: item.hostname || item.endpoint_name,
      ip: item.ip || item.ip_address,
      uuid: item.uuid || item.endpoint_id,
      os: item.os || item.platform,
      lastSeen: item.lastSeen || item.last_seen,
      source: 'cortex' as const,
      origin: 'api' as const,
      userEmail: item.userEmail || item.user_email,
    }));
  } catch (error) {
    console.error('Error fetching from Cortex:', error);
    throw error;
  }
}

export async function fetchWarpEndpoints(): Promise<Endpoint[]> {
  if (!isApiConfigured('warp')) {
    const csvData = getCsvData().warp;
    if (csvData && csvData.length > 0) return csvData;

    return [];
  }

  const config = getApiConfig();
  try {
    const response = await fetch(`${config.warp.baseUrl}/v1/devices`, {
      headers: {
        'Authorization': `Token ${config.warp.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`Warp API error: ${response.status}`);

    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id || item.device_id,
      hostname: item.hostname || item.device_name,
      ip: item.ip || item.ipv4,
      uuid: item.uuid || item.device_id,
      os: item.os || item.os_type,
      lastSeen: item.lastSeen || item.last_connected,
      source: 'warp' as const,
      origin: 'api' as const,
      userEmail: item.userEmail || item.user_email,
    }));
  } catch (error) {
    console.error('Error fetching from Warp:', error);
    throw error;
  }
}

export async function fetchPamEndpoints(): Promise<Endpoint[]> {
  if (!isApiConfigured('pam')) {
    const csvData = getCsvData().pam;
    if (csvData && csvData.length > 0) return csvData;

    return [];
  }

  const config = getApiConfig();
  try {
    const response = await fetch(`${config.pam.baseUrl}/api/assets`, {
      headers: {
        'Authorization': `Bearer ${config.pam.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`PAM API error: ${response.status}`);

    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id || item.asset_id,
      hostname: item.hostname || item.asset_name || item.name || '',
      ip: item.ip || item.ip_address || '',
      uuid: item.uuid || item.asset_id || item.id,
      os: item.os || item.operating_system,
      lastSeen: item.lastSeen || item.last_access,
      source: 'pam' as const,
      origin: 'api' as const,
      userEmail: item.userEmail || item.owner_email,
    }));
  } catch (error) {
    console.error('Error fetching from PAM:', error);
    throw error;
  }
}

export async function fetchJumpcloudEndpoints(): Promise<Endpoint[]> {
  if (!isApiConfigured('jumpcloud')) {
    const csvData = getCsvData().jumpcloud;
    if (csvData && csvData.length > 0) return csvData;

    return [];
  }

  const config = getApiConfig();
  try {
    const response = await fetch(`${config.jumpcloud.baseUrl}/api/systems`, {
      headers: {
        'x-api-key': config.jumpcloud.apiToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`JumpCloud API error: ${response.status}`);

    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id || item._id,
      hostname: item.hostname || item.displayName,
      ip: item.ip || item.primaryIp || item.remoteIP || '',
      uuid: item.uuid || item._id || item.id,
      os: item.os || item.osFamily,
      lastSeen: item.lastSeen || item.lastContact,
      source: 'jumpcloud' as const,
      origin: 'api' as const,
      userEmail: item.userEmail || item.primaryEmail,
    }));
  } catch (error) {
    console.error('Error fetching from JumpCloud:', error);
    throw error;
  }
}

export function compareInventories(
  vicariusEndpoints: Endpoint[],
  cortexEndpoints: Endpoint[],
  warpEndpoints: Endpoint[],
  pamEndpoints: Endpoint[],
  jumpcloudEndpoints: Endpoint[],
  terminatedEmployees: TerminatedEmployee[]
): ComparisonResult {
  const endpointMap = new Map<string, NormalizedEndpoint>();
  const terminatedEmails = new Set(terminatedEmployees.map(e => e.email.toLowerCase()));

  const getKey = (endpoint: Endpoint): string => {
    return normalizeHostname(endpoint.hostname);
  };

  const processEndpoints = (endpoints: Endpoint[], source: 'vicarius' | 'cortex' | 'warp' | 'pam' | 'jumpcloud') => {
    endpoints.forEach(endpoint => {
      if (!endpoint.hostname) return; // Skip if no hostname

      const key = getKey(endpoint);
      const existing = endpointMap.get(key);

      if (existing) {
        if (!existing.sources.includes(source)) {
          existing.sources.push(source);
          existing.sourceOrigins[source] = endpoint.origin;
        }
        if (endpoint.userEmail && !existing.userEmail) {
          existing.userEmail = endpoint.userEmail;
        }
      } else {
        const normalized = normalizeEndpoint(endpoint);
        endpointMap.set(key, normalized);
      }
    });
  };

  processEndpoints(vicariusEndpoints, 'vicarius');
  processEndpoints(cortexEndpoints, 'cortex');
  processEndpoints(warpEndpoints, 'warp');
  processEndpoints(pamEndpoints, 'pam');
  processEndpoints(jumpcloudEndpoints, 'jumpcloud');

  const allEndpoints = Array.from(endpointMap.values());

  // Check for terminated employees with active endpoints
  allEndpoints.forEach(endpoint => {
    if (endpoint.userEmail && terminatedEmails.has(endpoint.userEmail.toLowerCase())) {
      endpoint.riskLevel = 'high';
      endpoint.riskReason = 'Colaborador desligado com endpoint ativo';
    }
  });

  const terminatedWithActiveEndpoints = allEndpoints.filter(e => e.riskLevel === 'high');

  // Find terminated employees still in JumpCloud
  const jumpcloudEmails = new Set(jumpcloudEndpoints.map(e => e.userEmail?.toLowerCase()).filter(Boolean));
  const terminatedInJumpcloud = terminatedEmployees.filter(te =>
    jumpcloudEmails.has(te.email.toLowerCase())
  );

  // Find terminated employees still in PAM
  const pamEmails = new Set(pamEndpoints.map(e => e.userEmail?.toLowerCase()).filter(Boolean));
  const terminatedInPam = terminatedEmployees.filter(te =>
    pamEmails.has(te.email.toLowerCase())
  );

  return {
    allEndpoints,
    onlyVicarius: allEndpoints.filter(e => e.sources.length === 1 && e.sources.includes('vicarius')),
    onlyCortex: allEndpoints.filter(e => e.sources.length === 1 && e.sources.includes('cortex')),
    onlyWarp: allEndpoints.filter(e => e.sources.length === 1 && e.sources.includes('warp')),
    onlyPam: allEndpoints.filter(e => e.sources.length === 1 && e.sources.includes('pam')),
    onlyJumpcloud: allEndpoints.filter(e => e.sources.length === 1 && e.sources.includes('jumpcloud')),
    inAllSources: allEndpoints.filter(e =>
      e.sources.includes('vicarius') &&
      e.sources.includes('cortex') &&
      e.sources.includes('warp') &&
      e.sources.includes('pam') &&
      e.sources.includes('jumpcloud')
    ),
    missingFromVicarius: allEndpoints.filter(e => !e.sources.includes('vicarius')),
    missingFromCortex: allEndpoints.filter(e => !e.sources.includes('cortex')),
    missingFromWarp: allEndpoints.filter(e => !e.sources.includes('warp')),
    missingFromPam: allEndpoints.filter(e => !e.sources.includes('pam')),
    missingFromJumpcloud: allEndpoints.filter(e => !e.sources.includes('jumpcloud')),
    terminatedWithActiveEndpoints,
    terminatedInJumpcloud,
    terminatedInPam,
  };
}

export function generateAlerts(comparison: ComparisonResult): Alert[] {
  const alerts: Alert[] = [];
  const timestamp = new Date().toISOString();

  // High priority - terminated employee alerts
  if (comparison.terminatedWithActiveEndpoints.length > 0) {
    alerts.push({
      id: `alert-term-endpoints-${Date.now()}`,
      type: 'error',
      title: '⚠️ Risco: Endpoints de desligados ativos',
      message: `${comparison.terminatedWithActiveEndpoints.length} endpoint(s) associado(s) a colaboradores desligados`,
      timestamp,
      source: 'security',
    });
  }

  if (comparison.terminatedInJumpcloud.length > 0) {
    alerts.push({
      id: `alert-term-jc-${Date.now()}`,
      type: 'error',
      title: 'Desligados ainda no JumpCloud',
      message: `${comparison.terminatedInJumpcloud.length} usuário(s) desligado(s) ainda presente(s) no JumpCloud`,
      timestamp,
      source: 'jumpcloud',
    });
  }

  if (comparison.terminatedInPam.length > 0) {
    alerts.push({
      id: `alert-term-pam-${Date.now()}`,
      type: 'error',
      title: 'Desligados ainda no PAM',
      message: `${comparison.terminatedInPam.length} usuário(s) desligado(s) com acesso ao PAM`,
      timestamp,
      source: 'pam',
    });
  }

  // Standard missing alerts
  if (comparison.missingFromVicarius.length > 0) {
    alerts.push({
      id: `alert-vic-${Date.now()}`,
      type: 'warning',
      title: 'Ausentes no Vicarius',
      message: `${comparison.missingFromVicarius.length} máquina(s) não encontrada(s) no Vicarius`,
      timestamp,
      source: 'vicarius',
    });
  }

  if (comparison.missingFromCortex.length > 0) {
    alerts.push({
      id: `alert-ctx-${Date.now()}`,
      type: 'warning',
      title: 'Ausentes no Cortex',
      message: `${comparison.missingFromCortex.length} máquina(s) não encontrada(s) no Cortex`,
      timestamp,
      source: 'cortex',
    });
  }

  if (comparison.missingFromJumpcloud.length > 0) {
    alerts.push({
      id: `alert-jc-${Date.now()}`,
      type: 'warning',
      title: 'Ausentes no JumpCloud',
      message: `${comparison.missingFromJumpcloud.length} endpoint(s) sem registro no JumpCloud`,
      timestamp,
      source: 'jumpcloud',
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

export function exportToCSV(endpoints: NormalizedEndpoint[], filename: string): void {
  const headers = ['Hostname', 'IP', 'UUID', 'OS', 'Última vez visto', 'Email Usuário', 'Fontes', 'Risco'];
  const rows = endpoints.map(e => [
    e.hostname,
    e.ip,
    e.uuid,
    e.os || '',
    e.lastSeen || '',
    e.userEmail || '',
    e.sources.join(', '),
    e.riskLevel || 'none',
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
