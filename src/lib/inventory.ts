import { Endpoint, NormalizedEndpoint, ComparisonResult, Alert, TerminatedEmployee, ApiConfig } from '@/types/inventory';
import {
  mockVicariusEndpoints,
  mockCortexEndpoints,
  mockWarpEndpoints,
  mockPamEndpoints,
  mockJumpcloudEndpoints
} from '@/data/mockData';
import { getApiConfig, getTerminatedEmployees, getCsvData } from './storage';

// Helper to check config sync-style (offline/mock check)
function isApiConfigured(config: ApiConfig, tool: keyof ApiConfig): boolean {
  if (tool === 'vicarius') return !!(config.vicarius.baseUrl && config.vicarius.apiKey);
  const toolConfig = config[tool] as { baseUrl: string; apiToken?: string };
  return !!(toolConfig?.baseUrl && toolConfig?.apiToken);
}

function normalizeHostname(hostname: string | null | undefined): string {
  if (!hostname) return 'unknown-device';
  // Rule: Lowercase and remove domain suffix
  return hostname.toLowerCase().split('.')[0].trim();
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
    endpointStatus: endpoint.endpointStatus,
    endpointType: endpoint.endpointType,
  };
}


export function isWorkstation(hostname: string, endpointType?: string): boolean {
  if (endpointType === 'Workstation') return true;
  if (endpointType === 'Server') return false;

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
  return endpoint.complianceStatus === 'COMPLETO';
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

export function getEndpointsByEmail(email: string, allEndpoints: NormalizedEndpoint[]): NormalizedEndpoint[] {
  if (!email || !allEndpoints) return [];
  const lowerEmail = email.toLowerCase();
  return allEndpoints.filter(e => e.userEmail?.toLowerCase() === lowerEmail);
}

export async function fetchVicariusEndpoints(config: ApiConfig): Promise<Endpoint[]> {
  const configured = isApiConfigured(config, 'vicarius');
  if (!configured) {
    const csvData = (await getCsvData()).vicarius;
    if (csvData && csvData.length > 0) return csvData;
    return mockVicariusEndpoints;
  }

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
      hostname: item.hostname || item.name || '',
      ip: item.ip || item.ipAddress || '',
      uuid: item.uuid || item.id || '',
      os: item.os || item.operatingSystem || '',
      lastSeen: item.lastSeen || item.lastSeenAt || '',
      source: 'vicarius' as const,
      origin: 'api' as const,
      userEmail: item.userEmail || item.user_email || '',
    }));
  } catch (error) {
    console.error('Error fetching from Vicarius:', error);
    return [];
  }
}

export async function fetchCortexEndpoints(config: ApiConfig): Promise<Endpoint[]> {
  const configured = isApiConfigured(config, 'cortex');
  if (!configured) {
    const csvData = (await getCsvData()).cortex;
    if (csvData && csvData.length > 0) return csvData;
    return mockCortexEndpoints;
  }

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
      id: item.id || item.endpoint_id || '',
      hostname: item.hostname || item.endpoint_name || '',
      ip: item.ip || item.ip_address || '',
      uuid: item.uuid || item.endpoint_id || '',
      os: item.os || item.platform || '',
      lastSeen: item.lastSeen || item.last_seen || '',
      source: 'cortex' as const,
      origin: 'api' as const,
      userEmail: item.userEmail || item.user_email || '',
    }));
  } catch (error) {
    console.error('Error fetching from Cortex:', error);
    return [];
  }
}

export async function fetchWarpEndpoints(config: ApiConfig): Promise<Endpoint[]> {
  const configured = isApiConfigured(config, 'warp');
  if (!configured) {
    const csvData = (await getCsvData()).warp;
    if (csvData && csvData.length > 0) return csvData;
    return mockWarpEndpoints;
  }

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
      id: item.id || item.device_id || '',
      hostname: item.hostname || item.device_name || '',
      ip: item.ip || item.ipv4 || '',
      uuid: item.uuid || item.device_id || '',
      os: item.os || item.os_type || '',
      lastSeen: item.lastSeen || item.last_connected || '',
      source: 'warp' as const,
      origin: 'api' as const,
      userEmail: item.userEmail || item.user_email || '',
    }));
  } catch (error) {
    console.error('Error fetching from Warp:', error);
    return [];
  }
}

export async function fetchPamEndpoints(config: ApiConfig): Promise<Endpoint[]> {
  const configured = isApiConfigured(config, 'pam');
  if (!configured) {
    const csvData = (await getCsvData()).pam;
    if (csvData && csvData.length > 0) return csvData;
    return mockPamEndpoints;
  }

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
      id: item.id || item.asset_id || '',
      hostname: item.hostname || item.asset_name || item.name || '',
      ip: item.ip || item.ip_address || '',
      uuid: item.uuid || item.asset_id || item.id || '',
      os: item.os || item.operating_system || '',
      lastSeen: item.lastSeen || item.last_access || '',
      source: 'pam' as const,
      origin: 'api' as const,
      userEmail: item.userEmail || item.owner_email || '',
    }));
  } catch (error) {
    console.error('Error fetching from PAM:', error);
    return [];
  }
}

export async function fetchJumpcloudEndpoints(config: ApiConfig): Promise<Endpoint[]> {
  const configured = isApiConfigured(config, 'jumpcloud');
  if (!configured) {
    const csvData = (await getCsvData()).jumpcloud;
    if (csvData && csvData.length > 0) return csvData;
    return mockJumpcloudEndpoints;
  }

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
      id: item.id || '',
      hostname: item.hostname || '',
      ip: item.ip_address || '',
      uuid: item.id || '',
      os: item.os || '',
      lastSeen: item.last_seen || '',
      source: 'jumpcloud' as const,
      origin: 'api' as const,
      userEmail: item.user_email || '',
    }));
  } catch (error) {
    console.error('Error fetching from JumpCloud:', error);
    return [];
  }
}

export function compareInventories(
  vicarius: Endpoint[],
  cortex: Endpoint[],
  warp: Endpoint[],
  pam: Endpoint[],
  jumpcloud: Endpoint[],
  terminatedEmployees: TerminatedEmployee[] = []
): ComparisonResult {
  const map = new Map<string, NormalizedEndpoint>();

  // 1. Normalize and Merge
  const processEndpoints = (endpoints: Endpoint[], source: 'vicarius' | 'cortex' | 'warp' | 'pam' | 'jumpcloud') => {
    endpoints.forEach(ep => {
      if (!ep.hostname || ep.hostname.trim() === '') return; // Skip invalid devices

      const h = normalizeHostname(ep.hostname);
      const uuid = h; // Use normalized hostname as key for merging

      if (!map.has(uuid)) {
        map.set(uuid, {
          hostname: ep.hostname, // Keep original case for display
          ip: ep.ip || '',
          uuid: uuid,
          os: ep.os || '',
          lastSeen: ep.lastSeen || '',
          sources: [source],
          sourceOrigins: { [source]: ep.origin },
          userEmail: ep.userEmail || '',
          userId: ep.userId,
          riskLevel: 'none'
        });
      } else {
        const existing = map.get(uuid)!;
        if (!existing.sources.includes(source)) {
          existing.sources.push(source);
          existing.sourceOrigins[source] = ep.origin;
        }
        // Enrich data - Priority for Cortex/Vicarius for some fields
        if (ep.ip && (!existing.ip || source === 'cortex')) existing.ip = ep.ip;
        if (ep.os && (!existing.os || source === 'vicarius')) existing.os = ep.os;
        if (ep.lastSeen && (!existing.lastSeen || source === 'vicarius')) existing.lastSeen = ep.lastSeen;
        if (ep.userEmail && (!existing.userEmail || source === 'warp')) existing.userEmail = ep.userEmail;
        if (ep.endpointStatus) existing.endpointStatus = ep.endpointStatus;
        if (ep.endpointType) existing.endpointType = ep.endpointType;
      }
    });
  };

  processEndpoints(vicarius, 'vicarius');
  processEndpoints(cortex, 'cortex');
  processEndpoints(warp, 'warp');
  processEndpoints(pam, 'pam');
  processEndpoints(jumpcloud, 'jumpcloud');

  const allEndpoints = Array.from(map.values());

  // --- Compliance Rules for Devices ---
  const nonCompliant: NormalizedEndpoint[] = [];
  const namingViolations: NormalizedEndpoint[] = [];
  const workstations: NormalizedEndpoint[] = [];
  const servers: NormalizedEndpoint[] = [];
  const userViolations: any[] = [];

  // Helper: Is Valid Workstation Hostname
  // Aceita qualquer hostname que comece com EXA-ARK, EXA-MAC, ou MACBOOKPRO
  const isValidWorkstationName = (hostname: string) => {
    const h = hostname.toUpperCase();
    return h.startsWith('EXA-ARK') ||
      h.startsWith('EXA-MAC') ||
      h.startsWith('MACBOOKPRO');
  };

  // Helper: Is Server
  // Servidores são dispositivos que NÃO seguem o padrão de workstation
  const isServer = (hostname: string) => {
    const upper = hostname.toUpperCase();
    // Se começa com padrão de workstation, não é servidor
    return !upper.startsWith('EXA-ARK') &&
      !upper.startsWith('EXA-MAC') &&
      !upper.startsWith('MACBOOKPRO');
  };

  allEndpoints.forEach(ep => {
    // 1. Classification
    // Rule: SERVIDORES if in SenhaSegura (pam) OR Endpoint Type in Cortex is 'Server'
    const inPam = ep.sources.includes('pam');
    const isCortexServer = ep.endpointType === 'Server';

    if (inPam || isCortexServer) {
      ep.classification = 'SERVIDORES';
      servers.push(ep);
    } else {
      ep.classification = 'WORKSTATIONS';
      workstations.push(ep);
    }

    // 2. Compliance Status
    const hasVicarius = ep.sources.includes('vicarius');
    const hasCortex = ep.sources.includes('cortex');
    const hasWarp = ep.sources.includes('warp');

    if (!hasVicarius || !hasCortex) {
      ep.complianceStatus = 'CRÍTICO';
      ep.riskLevel = 'high';
      ep.riskReason = !hasVicarius ? 'Ausente no Vicarius' : 'Ausente no Cortex XDR';
      nonCompliant.push(ep);
    } else {
      // Vicarius and Cortex present, check tool specific
      const toolOk = ep.classification === 'WORKSTATIONS' ? hasWarp : inPam;

      if (toolOk) {
        ep.complianceStatus = 'COMPLETO';
        ep.riskLevel = 'none';
      } else {
        ep.complianceStatus = 'PARCIAL';
        ep.riskLevel = 'medium';
        ep.riskReason = ep.classification === 'WORKSTATIONS' ? 'Faltando Warp' : 'Faltando SenhaSegura (PAM)';
        nonCompliant.push(ep);
      }
    }
  });

  // Terminated Employees Logic
  const terminatedWithActiveEndpoints: NormalizedEndpoint[] = [];
  const terminatedInJumpcloud: TerminatedEmployee[] = [];
  const terminatedInPam: TerminatedEmployee[] = [];

  terminatedEmployees.forEach(employee => {
    // Check active endpoints
    const active = allEndpoints.filter(ep =>
      (ep.userEmail && ep.userEmail.toLowerCase() === employee.email.toLowerCase()) ||
      (ep.hostname && ep.hostname.toLowerCase().includes(employee.name.toLowerCase().split(' ')[0]))
    );
    if (active.length > 0) {
      active.forEach(ep => {
        if (!terminatedWithActiveEndpoints.includes(ep)) {
          ep.riskLevel = 'high';
          ep.riskReason = `Usuário Desligado (${employee.email}) com acesso ativo`;
          terminatedWithActiveEndpoints.push(ep);
        }
      });
    }

    // Check JumpCloud
    const inJc = jumpcloud.find(ep => ep.userEmail === employee.email || ep.hostname === employee.email);
    if (inJc) {
      terminatedInJumpcloud.push(employee);
    }
  });

  return {
    allEndpoints,
    workstations,
    servers,
    namingViolations,
    onlyVicarius: allEndpoints.filter(e => e.sources.length === 1 && e.sources.includes('vicarius')),
    onlyCortex: allEndpoints.filter(e => e.sources.length === 1 && e.sources.includes('cortex')),
    onlyWarp: allEndpoints.filter(e => e.sources.length === 1 && e.sources.includes('warp')),
    onlyPam: allEndpoints.filter(e => e.sources.length === 1 && e.sources.includes('pam')),
    onlyJumpcloud: allEndpoints.filter(e => e.sources.length === 1 && e.sources.includes('jumpcloud')),
    inAllSources: allEndpoints.filter(e =>
      e.sources.includes('vicarius') &&
      e.sources.includes('cortex') &&
      e.sources.includes('warp') && // Warp back in
      e.sources.includes('jumpcloud')
    ),
    missingFromVicarius: allEndpoints.filter(e => !e.sources.includes('vicarius') && !isServer(e.hostname)),
    missingFromCortex: allEndpoints.filter(e => !e.sources.includes('cortex')),
    missingFromWarp: allEndpoints.filter(e => !isServer(e.hostname) && !e.sources.includes('warp')), // Workstations need Warp
    missingFromPam: allEndpoints.filter(e => !e.sources.includes('pam') && isServer(e.hostname)),
    missingFromJumpcloud: allEndpoints.filter(e => !e.sources.includes('jumpcloud')),
    terminatedWithActiveEndpoints,
    terminatedInJumpcloud,
    terminatedInPam,
    nonCompliant,
    userViolations
  };
}

export function generateAlerts(comparison: ComparisonResult): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  // 1. Gaps (Missing from Tools)
  if (comparison.missingFromVicarius.length > 0) {
    alerts.push({
      id: `alert-vicarius-${Date.now()}`,
      type: 'warning',
      title: 'Gap no Vicarius',
      message: `${comparison.missingFromVicarius.length} dispositivos ausentes no Vicarius`,
      timestamp: now,
      source: 'Vicarius'
    });
  }

  if (comparison.missingFromCortex.length > 0) {
    alerts.push({
      id: `alert-cortex-${Date.now()}`,
      type: 'error',
      title: 'Gap no Cortex XDR',
      message: `${comparison.missingFromCortex.length} dispositivos críticos sem proteção Cortex`,
      timestamp: now,
      source: 'Cortex'
    });
  }

  if (comparison.missingFromWarp.length > 0) {
    alerts.push({
      id: `alert-warp-${Date.now()}`,
      type: 'warning',
      title: 'Gap no Warp',
      message: `${comparison.missingFromWarp.length} workstations sem Warp ativo`,
      timestamp: now,
      source: 'Warp'
    });
  }

  // 2. Terminated Employees Risk
  if (comparison.terminatedWithActiveEndpoints.length > 0) {
    alerts.push({
      id: `alert-term-risk-${Date.now()}`,
      type: 'error',
      title: 'Risco Crítico: Usuários Desligados',
      message: `${comparison.terminatedWithActiveEndpoints.length} dispositivos ativos associados a ex-colaboradores`,
      timestamp: now,
      source: 'RH/Security'
    });
  }

  // 3. User & Workstation Violations (from verify loop)
  if (comparison.userViolations && comparison.userViolations.length > 0) {
    alerts.push({
      id: `alert-user-compliance-${Date.now()}`,
      type: 'warning',
      title: 'Workstations Fora de Compliance',
      message: `${comparison.userViolations.length} usuários com violação de segurança (ex: Sem Warp)`,
      timestamp: now,
      source: 'Compliance'
    });
  }

  // 4. Naming Violations
  if (comparison.namingViolations && comparison.namingViolations.length > 0) {
    alerts.push({
      id: `alert-naming-${Date.now()}`,
      type: 'info',
      title: 'Violação de Nomenclatura',
      message: `${comparison.namingViolations.length} dispositivos fora do padrão de hostname`,
      timestamp: now,
      source: 'Padronização'
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
