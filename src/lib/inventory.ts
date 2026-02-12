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
      id: item.id,
      hostname: item.hostname,
      ip: item.ip_address,
      uuid: item.id,
      os: item.os,
      lastSeen: item.last_seen,
      source: 'jumpcloud' as const,
      origin: 'api' as const,
      userEmail: item.user_email,
    }));
  } catch (error) {
    console.error('Error fetching from JumpCloud:', error);
    throw error;
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
      const h = normalizeHostname(ep.hostname);
      const uuid = ep.hostname.toLowerCase(); // Simple unique key for now

      if (!map.has(uuid)) {
        map.set(uuid, {
          hostname: ep.hostname, // Keep original case for display
          ip: ep.ip,
          uuid: uuid,
          os: ep.os,
          lastSeen: ep.lastSeen,
          sources: [source],
          sourceOrigins: { [source]: ep.origin },
          userEmail: ep.userEmail,
          userId: ep.userId,
          riskLevel: 'none'
        });
      } else {
        const existing = map.get(uuid)!;
        if (!existing.sources.includes(source)) {
          existing.sources.push(source);
          existing.sourceOrigins[source] = ep.origin;
        }
        // Enrich data
        if (!existing.ip && ep.ip) existing.ip = ep.ip;
        if (!existing.os && ep.os) existing.os = ep.os;
        if (!existing.lastSeen && ep.lastSeen) existing.lastSeen = ep.lastSeen;
        if (!existing.userEmail && ep.userEmail) existing.userEmail = ep.userEmail;
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
    // Categorize
    if (isServer(ep.hostname)) {
      servers.push(ep);

      // Server Compliance Rule
      const hasCortex = ep.sources.includes('cortex');
      const hasVicarius = ep.sources.includes('vicarius');

      if (!hasCortex || !hasVicarius) {
        ep.riskLevel = 'high';
        ep.riskReason = 'Servidor Fora de Compliance: Requer Cortex e Vicarius.';
        if (!hasCortex) ep.riskReason += ' [Faltando Cortex]';
        if (!hasVicarius) ep.riskReason += ' [Faltando Vicarius]';
        nonCompliant.push(ep);
      }
    } else {
      // It's a Workstation (or intended to be)
      workstations.push(ep);

      // 1. Naming Convention Check
      if (!isValidWorkstationName(ep.hostname)) {
        // It failed strict workstation check, but wasn't classified as Server
        // This means it starts with EXA-ARK... but maybe not the right suffix?
        // Or it matched the loose "Not Server" logic but failed strict check.
        ep.riskLevel = 'medium';
        ep.riskReason = (ep.riskReason || '') + 'Violação de Nomenclatura (Padrão: EXA-ARKLX/NT/MAC)';
        namingViolations.push(ep);
      }

      // 2. Tool Compliance Rule
      const hasWarp = ep.sources.includes('warp');
      if (!hasWarp) {
        ep.riskLevel = 'medium';
        ep.riskReason = (ep.riskReason ? ep.riskReason + '; ' : '') + 'Ausente no Warp';
        if (!nonCompliant.includes(ep)) nonCompliant.push(ep);

        userViolations.push({
          userEmail: ep.userEmail || ep.hostname,
          riskReason: 'Workstation Ativa sem Warp',
          sources: ep.sources
        });
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
