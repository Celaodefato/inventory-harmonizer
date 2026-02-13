export interface Endpoint {
  id: string;
  hostname: string;
  ip: string;
  uuid: string;
  os?: string;
  lastSeen?: string;
  source: 'vicarius' | 'cortex' | 'warp' | 'pam' | 'jumpcloud';
  origin: 'api' | 'csv' | 'mock';
  userId?: string;
  userEmail?: string;
}

export interface NormalizedEndpoint {
  hostname: string;
  ip: string;
  uuid: string;
  os?: string;
  lastSeen?: string;
  sources: ('vicarius' | 'cortex' | 'warp' | 'pam' | 'jumpcloud')[];
  sourceOrigins: Record<string, 'api' | 'csv' | 'mock'>;
  userId?: string;
  userEmail?: string;
  riskLevel?: 'none' | 'low' | 'medium' | 'high';
  riskReason?: string;
}

export interface ComparisonResult {
  allEndpoints: NormalizedEndpoint[];
  onlyVicarius: NormalizedEndpoint[];
  onlyCortex: NormalizedEndpoint[];
  onlyWarp: NormalizedEndpoint[];
  onlyPam: NormalizedEndpoint[];
  onlyJumpcloud: NormalizedEndpoint[];
  inAllSources: NormalizedEndpoint[];
  missingFromVicarius: NormalizedEndpoint[];
  missingFromCortex: NormalizedEndpoint[];
  missingFromWarp: NormalizedEndpoint[];
  missingFromPam: NormalizedEndpoint[];
  missingFromJumpcloud: NormalizedEndpoint[];
  terminatedWithActiveEndpoints: NormalizedEndpoint[];
  terminatedInJumpcloud: TerminatedEmployee[];
  terminatedInPam: TerminatedEmployee[];
  nonCompliant: NormalizedEndpoint[];
  userViolations: any[];
  namingViolations: NormalizedEndpoint[];
  workstations: NormalizedEndpoint[];
  servers: NormalizedEndpoint[];
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
  pam: {
    baseUrl: string;
    apiToken: string;
  };
  jumpcloud: {
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
    pam: number;
    jumpcloud: number;
  };
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  source?: string;
  details?: string;
}

export interface SyncStatus {
  isLoading: boolean;
  lastSync: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  message?: string;
}

export type OffboardingStatus = 'pending' | 'in_progress' | 'completed';

export interface OffboardingChecklist {
  // Identidade & Acesso
  adDisabled: boolean;
  adMoved: boolean;
  googleDisabled: boolean;
  googlePasswordChanged: boolean;
  autoReplySet: boolean;
  googleTakeoutDone: boolean;
  // Ativos & Máquina
  machineCollected: boolean;
  machineBackup: boolean;
  glpiUpdated: boolean;
  // Licenças
  licensesRemoved: boolean;
  licensesConfirmed: boolean;
}

export interface OffboardingAlert {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  createdAt: string;
  status: OffboardingStatus;
  checklist: OffboardingChecklist;
  responsible?: string;
  notes?: string;
}

export interface TerminatedEmployee {
  id: string;
  name: string;
  email: string;
  terminationDate: string;
  notes?: string;
  createdAt: string;

  // Checklist de Offboarding
  adDisabled?: boolean;
  googlePasswordChanged?: boolean;
  autoReplySet?: boolean;
  takeoutCompleted?: boolean;
  machineBackup?: boolean;
  licenseRemovalRequested?: boolean;
  licenseRemoved?: boolean;
  movedToTerminatedOu?: boolean;
  machineCollected?: boolean;
  glpiUpdated?: boolean;
  responsible?: string;
}

// User Comparison Interfaces
export interface JumpCloudUser {
  email: string;
  firstname: string;
  lastname: string;
  state: string; // 'ACTIVATED', 'SUSPENDED', etc.
}

export interface WarpUser {
  email: string;
  activeDeviceCount: number;
}

export type UserComplianceStatus =
  | 'compliant'
  | 'missing_warp'
  | 'missing_jumpcloud'
  | 'terminated_active';

export interface UserComparison {
  email: string;
  name: string;
  inJumpCloud: boolean;
  inWarp: boolean;
  jumpCloudStatus?: 'active' | 'suspended' | 'terminated';
  warpDeviceCount?: number;
  isTerminated: boolean;
  complianceStatus: UserComplianceStatus;
}
