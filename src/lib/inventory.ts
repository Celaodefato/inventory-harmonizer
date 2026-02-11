import { Endpoint, NormalizedEndpoint, ComparisonResult, Alert, TerminatedEmployee } from '@/types/inventory';
import {
  mockVicariusEndpoints,
  mockCortexEndpoints,
  mockWarpEndpoints,
  mockPamEndpoints,
  mockJumpcloudEndpoints
} from '@/data/mockData';
import { getApiConfig, getTerminatedEmployees, getCsvData } from './storage';

// Helper to check config async
async function isApiConfiguredAsync(tool: 'vicarius' | 'cortex' | 'warp' | 'pam' | 'jumpcloud'): Promise<boolean> {
  const config = await getApiConfig();
  if (tool === 'vicarius') return !!(config.vicarius.baseUrl && config.vicarius.apiKey);
  if (tool === 'cortex') return !!(config.cortex.baseUrl && config.cortex.apiToken);
  if (tool === 'warp') return !!(config.warp.baseUrl && config.warp.apiToken);
  if (tool === 'pam') return !!(config.pam.baseUrl && config.pam.apiToken);
  return !!(config.jumpcloud.baseUrl && config.jumpcloud.apiToken);
}

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

export function isWorkstation(hostname: string): boolean {
  const h = hostname.toUpperCase();
  return h.startsWith('EXA-ARKLX') ||
    h.startsWith('EXA-ARKNT') ||
    h.startsWith('EXA-ARKMAC') ||
    h.startsWith('EXA-MAC');
}

export function getRequiredSources(hostname: string): string[] {
  const h = hostname.toUpperCase();
  const isExaArk = h.startsWith('EXA-ARK');

  if (isWorkstation(hostname)) {
    if (isExaArk) {
      return ['vicarius', 'cortex', 'warp', 'jumpcloud'];
    }
    return ['vicarius', 'cortex', 'warp', 'pam', 'jumpcloud'];
  }
  return ['vicarius', 'cortex', 'warp']; // Servers only need Vicarius, Cortex (Warp included for inventory)
}

export function isEndpointCompliant(endpoint: NormalizedEndpoint): boolean {
  const required = getRequiredSources(endpoint.hostname);
  return required.every(s => endpoint.sources.includes(s as any));
}

export function getEndpointRiskDetails(endpoint: NormalizedEndpoint): { level: NormalizedEndpoint['riskLevel']; reason: string | null } {
  // Priority 1: Terminated Employee
  if (endpoint.riskLevel === 'high') {
    return { level: 'high', reason: endpoint.riskReason || 'Colaborador desligado com endpoint ativo' };
  }

  // Priority 2: Missing Tools
  const required = getRequiredSources(endpoint.hostname);
  const missing = required.filter(s => !endpoint.sources.includes(s as any));

  if (missing.length > 0) {
    const names = missing.map(s => s.charAt(0).toUpperCase() + s.slice(1));
    return {
      level: 'medium',
      reason: `Gaps de Inventário: Ausente em ${names.join(', ')}`
    };
  }

  return { level: 'none', reason: null };
}

export async function fetchVicariusEndpoints(): Promise<Endpoint[]> {
  const configured = await isApiConfiguredAsync('vicarius');
  if (!configured) {
    const csvData = getCsvData().vicarius;
    if (csvData && csvData.length > 0) return csvData;

    // Return empty instead of mock data
    return [];
  }

  const config = await getApiConfig();
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
  const configured = await isApiConfiguredAsync('cortex');
  if (!configured) {
    const csvData = getCsvData().cortex;
    if (csvData && csvData.length > 0) return csvData;

    return [];
  }

  const config = await getApiConfig();
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
  const configured = await isApiConfiguredAsync('warp');
  if (!configured) {
    const csvData = getCsvData().warp;
    if (csvData && csvData.length > 0) return csvData;

    return [];
  }

  const config = await getApiConfig();
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
  const configured = await isApiConfiguredAsync('pam');
  if (!configured) {
    const csvData = getCsvData().pam;
    if (csvData && csvData.length > 0) return csvData;

    return [];
  }

  const config = await getApiConfig();
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
  const configured = await isApiConfiguredAsync('jumpcloud');
  if (!configured) {
    const csvData = getCsvData().jumpcloud;
    if (csvData && csvData.length > 0) return csvData;

    return [];
  }

  const config = await getApiConfig();
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

  // Apply risk tagging and compliance checks
  allEndpoints.forEach(endpoint => {
    // First check for terminated employees (manual override for high risk)
    if (endpoint.userEmail && terminatedEmails.has(endpoint.userEmail.toLowerCase())) {
      endpoint.riskLevel = 'high';
      endpoint.riskReason = 'Colaborador desligado com endpoint ativo';
    }

    // Then refine with detailed risk logic
    const { level, reason } = getEndpointRiskDetails(endpoint);
    if (level !== 'none' && (!endpoint.riskLevel || endpoint.riskLevel === 'none' || level === 'high')) {
      endpoint.riskLevel = level;
      endpoint.riskReason = reason || undefined;
    }
  });

  const terminatedWithActiveEndpoints = allEndpoints.filter(e => e.riskLevel === 'high' && e.userEmail && terminatedEmails.has(e.userEmail.toLowerCase()));

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

  const nonCompliant: NormalizedEndpoint[] = [];

  // --- Compliance Rules ---

  // Rule 1: Server Identification & Protection
  // Servers: Hostname does NOT start with 'EXA-ARK' AND does NOT start with 'MACBOOKPRO' (case insensitive)
  // Requirement: Servers must have Cortex AND Vicarius
  const isServer = (hostname: string) => {
    const h = hostname.toUpperCase();
    return !h.startsWith('EXA-ARK') && !h.startsWith('MACBOOKPRO') && !h.startsWith('EXA-MAC');
  };

  // Rule 2: JumpCloud Users must be in Warp
  // This requires a separate check, confusingly mapped to endpoints?
  // We will attach a "risk" to the JumpCloud User endpoint if missing from Warp.
  // First, let's normalize JC Users and Warp Users
  const csvData = getCsvData(); // Assuming getCsvData is accessible here
  const jcUsers = csvData.jumpcloud_users || [];
  const warpUsers = csvData.warp || []; // Warp CSV is strictly users based on header mapping

  const warpEmails = new Set(warpUsers.map(u => u.userEmail?.toLowerCase()).filter(Boolean));

  // Process all normalized endpoints to apply Server Rule
  allEndpoints.forEach(ep => {
    if (isServer(ep.hostname)) {
      const hasCortex = ep.sources.includes('cortex');
      const hasVicarius = ep.sources.includes('vicarius');

      if (!hasCortex || !hasVicarius) {
        ep.riskLevel = 'high';
        ep.riskReason = 'Servidor Fora de Compliance: Requer Cortex e Vicarius.';
        if (!hasCortex) ep.riskReason += ' (Faltando Cortex)';
        if (!hasVicarius) ep.riskReason += ' (Faltando Vicarius)';
        nonCompliant.push(ep);
      }
    }
  });

  // Process User Compliance (JC Users vs Warp)
  // We create pseudo-endpoints for JC Users to show them in the dashboard if they are non-compliant
  jcUsers.forEach(jcUser => {
    const email = jcUser.userEmail;
    const status = jcUser.status; // 'ACTIVATED' etc.

    if (email && status === 'ACTIVATED') {
      const inWarp = warpEmails.has(email.toLowerCase());

      if (!inWarp) {
        // Check if we already have an endpoint for this user (unlikely if it's just a user list)
        // Create a violation entry
        const violation: NormalizedEndpoint = {
          hostname: email, // Use email as hostname for User Violations
          ip: 'N/A',
          uuid: `violation-user-${email}`,
          os: 'N/A',
          sources: ['jumpcloud'],
          sourceOrigins: { jumpcloud: 'csv' },
          userEmail: email,
          riskLevel: 'medium',
          riskReason: 'Usuário JumpCloud Ativo sem Warp',
          lastSeen: new Date().toISOString() // TODO: parse real date
        };

        // Avoid duplicates if this "user hostname" already exists?
        // Actually, if we mix User emails into Hostnames, it might be messy.
        // But for "Single View", user acts as the key.
        nonCompliant.push(violation);
        // Also add to allEndpoints so it shows up?
        // Maybe better to filter distinct User violations.
        // For now, push to nonCompliant is enough to trigger alert/list.
        allEndpoints.push(violation);
      }
    }
  });

  // Add existing non-compliant endpoints based on isEndpointCompliant
  allEndpoints.forEach(e => {
    if (!isEndpointCompliant(e) && !nonCompliant.includes(e)) {
      nonCompliant.push(e);
    }
  });

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
    missingFromWarp: allEndpoints.filter(e => isWorkstation(e.hostname) && !e.sources.includes('warp')),
    missingFromPam: allEndpoints.filter(e => {
      const h = e.hostname.toUpperCase();
      return isWorkstation(e.hostname) && !h.startsWith('EXA-ARK') && !e.sources.includes('pam');
    }),
    missingFromJumpcloud: allEndpoints.filter(e => isWorkstation(e.hostname) && !e.sources.includes('jumpcloud')),
    terminatedWithActiveEndpoints,
    terminatedInJumpcloud,
    terminatedInPam,
    nonCompliant: allEndpoints.filter(e => !isEndpointCompliant(e)),
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

  if (comparison.nonCompliant.length > 0) {
    alerts.push({
      id: `alert-non-compliant-${Date.now()}`,
      type: 'error',
      title: 'Máquinas Fora de Compliance',
      message: `${comparison.nonCompliant.length} máquina(s) não possuem todas as ferramentas obrigatórias instaladas`,
      timestamp,
    });
  }

  // Standard missing alerts - only show if there are actual gaps based on requirements
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

  if (comparison.missingFromWarp.length > 0) {
    alerts.push({
      id: `alert-warp-${Date.now()}`,
      type: 'warning',
      title: 'Ausentes no Warp',
      message: `${comparison.missingFromWarp.length} workstation(s) sem Warp`,
      timestamp,
      source: 'warp',
    });
  }

  if (comparison.missingFromJumpcloud.length > 0) {
    alerts.push({
      id: `alert-jc-${Date.now()}`,
      type: 'warning',
      title: 'Ausentes no JumpCloud',
      message: `${comparison.missingFromJumpcloud.length} workstation(s) sem registro no JumpCloud`,
      timestamp,
      source: 'jumpcloud',
    });
  }

  if (comparison.missingFromPam.length > 0) {
    alerts.push({
      id: `alert-pam-${Date.now()}`,
      type: 'warning',
      title: 'Ausentes no PAM',
      message: `${comparison.missingFromPam.length} workstation(s) (não EXA-ARK) sem acesso ao PAM`,
      timestamp,
      source: 'pam',
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
