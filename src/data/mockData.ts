import { Endpoint, TerminatedEmployee } from '@/types/inventory';

export const mockVicariusEndpoints: Endpoint[] = [
  { id: 'v1', hostname: 'EXA-ARKLX-001', ip: '192.168.1.10', uuid: 'uuid-001', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T10:30:00Z', source: 'vicarius', origin: 'mock' },
  { id: 'v2', hostname: 'EXA-ARKNT-002', ip: '192.168.1.20', uuid: 'uuid-002', os: 'CentOS 8', lastSeen: '2024-01-25T10:25:00Z', source: 'vicarius', origin: 'mock' },
  { id: 'v3', hostname: 'SRV-DB-001', ip: '192.168.1.30', uuid: 'uuid-003', os: 'Windows Server 2022', lastSeen: '2024-01-25T10:20:00Z', source: 'vicarius', origin: 'mock' },
  { id: 'v4', hostname: 'EXA-MAC-004', ip: '192.168.2.10', uuid: 'uuid-004', os: 'Windows 11', lastSeen: '2024-01-25T09:45:00Z', source: 'vicarius', origin: 'mock', userEmail: 'user.a@example.com' },
  { id: 'v5', hostname: 'host-005', ip: '192.168.1.40', uuid: 'uuid-005', os: 'Ubuntu 20.04', lastSeen: '2024-01-25T10:15:00Z', source: 'vicarius', origin: 'mock' },
  { id: 'v6', hostname: 'host-006', ip: '192.168.1.50', uuid: 'uuid-006', os: 'Debian 11', lastSeen: '2024-01-25T08:00:00Z', source: 'vicarius', origin: 'mock' },
  { id: 'v7', hostname: 'host-007', ip: '192.168.1.60', uuid: 'uuid-007', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T10:28:00Z', source: 'vicarius', origin: 'mock' },
  { id: 'v8', hostname: 'host-008', ip: '192.168.2.50', uuid: 'uuid-020', os: 'Windows 11', lastSeen: '2024-01-25T09:00:00Z', source: 'vicarius', origin: 'mock', userEmail: 'user.b@example.com' },
];

export const mockCortexEndpoints: Endpoint[] = [
  { id: 'c1', hostname: 'host-001', ip: '192.168.1.10', uuid: 'uuid-001', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T10:32:00Z', source: 'cortex', origin: 'mock' },
  { id: 'c2', hostname: 'host-002', ip: '192.168.1.20', uuid: 'uuid-002', os: 'CentOS 8', lastSeen: '2024-01-25T10:28:00Z', source: 'cortex', origin: 'mock' },
  { id: 'c3', hostname: 'host-003', ip: '192.168.1.30', uuid: 'uuid-003', os: 'Windows Server 2022', lastSeen: '2024-01-25T10:22:00Z', source: 'cortex', origin: 'mock' },
  { id: 'c4', hostname: 'host-004', ip: '192.168.2.10', uuid: 'uuid-004', os: 'Windows 11', lastSeen: '2024-01-25T09:50:00Z', source: 'cortex', origin: 'mock', userEmail: 'user.a@example.com' },
  { id: 'c5', hostname: 'host-009', ip: '192.168.1.70', uuid: 'uuid-008', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T10:10:00Z', source: 'cortex', origin: 'mock' },
  { id: 'c6', hostname: 'host-010', ip: '192.168.1.80', uuid: 'uuid-009', os: 'Redis OS', lastSeen: '2024-01-25T10:05:00Z', source: 'cortex', origin: 'mock' },
];

export const mockWarpEndpoints: Endpoint[] = [
  { id: 'w1', hostname: 'host-001', ip: '192.168.1.10', uuid: 'uuid-001', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T10:31:00Z', source: 'warp', origin: 'mock' },
  { id: 'w2', hostname: 'host-002', ip: '192.168.1.20', uuid: 'uuid-002', os: 'CentOS 8', lastSeen: '2024-01-25T10:26:00Z', source: 'warp', origin: 'mock' },
  { id: 'w3', hostname: 'host-004', ip: '192.168.2.10', uuid: 'uuid-004', os: 'Windows 11', lastSeen: '2024-01-25T09:48:00Z', source: 'warp', origin: 'mock', userEmail: 'user.a@example.com' },
  { id: 'w4', hostname: 'host-011', ip: '192.168.1.90', uuid: 'uuid-010', os: 'pfSense', lastSeen: '2024-01-25T10:00:00Z', source: 'warp', origin: 'mock' },
  { id: 'w5', hostname: 'host-012', ip: '192.168.1.100', uuid: 'uuid-011', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T09:55:00Z', source: 'warp', origin: 'mock' },
];

export const mockPamEndpoints: Endpoint[] = [
  { id: 'p1', hostname: 'host-002', ip: '192.168.1.20', uuid: 'uuid-002', os: 'CentOS 8', lastSeen: '2024-01-25T10:30:00Z', source: 'pam', origin: 'mock', userEmail: 'admin@example.com' },
  { id: 'p2', hostname: 'host-003', ip: '192.168.1.30', uuid: 'uuid-003', os: 'Windows Server 2022', lastSeen: '2024-01-25T10:25:00Z', source: 'pam', origin: 'mock' },
  { id: 'p3', hostname: 'host-006', ip: '192.168.1.50', uuid: 'uuid-006', os: 'Debian 11', lastSeen: '2024-01-25T08:30:00Z', source: 'pam', origin: 'mock' },
  { id: 'p4', hostname: 'host-013', ip: '192.168.1.110', uuid: 'uuid-012', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T10:20:00Z', source: 'pam', origin: 'mock' },
  { id: 'p5', hostname: 'host-008', ip: '192.168.2.50', uuid: 'uuid-020', os: 'Windows 11', lastSeen: '2024-01-24T18:00:00Z', source: 'pam', origin: 'mock', userEmail: 'user.b@example.com' },
];

export const mockJumpcloudEndpoints: Endpoint[] = [
  { id: 'j1', hostname: 'host-001', ip: '192.168.1.10', uuid: 'uuid-001', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T10:33:00Z', source: 'jumpcloud', origin: 'mock', userEmail: 'devops@example.com' },
  { id: 'j2', hostname: 'host-004', ip: '192.168.2.10', uuid: 'uuid-004', os: 'Windows 11', lastSeen: '2024-01-25T09:52:00Z', source: 'jumpcloud', origin: 'mock', userEmail: 'user.a@example.com' },
  { id: 'j3', hostname: 'host-014', ip: '192.168.2.20', uuid: 'uuid-013', os: 'macOS Sonoma', lastSeen: '2024-01-25T10:15:00Z', source: 'jumpcloud', origin: 'mock', userEmail: 'user.c@example.com' },
  { id: 'j4', hostname: 'host-015', ip: '192.168.2.30', uuid: 'uuid-014', os: 'Windows 11', lastSeen: '2024-01-25T10:10:00Z', source: 'jumpcloud', origin: 'mock', userEmail: 'user.d@example.com' },
  { id: 'j5', hostname: 'host-016', ip: '192.168.2.40', uuid: 'uuid-015', os: 'macOS Sonoma', lastSeen: '2024-01-25T10:05:00Z', source: 'jumpcloud', origin: 'mock', userEmail: 'user.e@example.com' },
  { id: 'j6', hostname: 'host-008', ip: '192.168.2.50', uuid: 'uuid-020', os: 'Windows 11', lastSeen: '2024-01-25T09:30:00Z', source: 'jumpcloud', origin: 'mock', userEmail: 'user.b@example.com' },
];

export const mockTerminatedEmployees: TerminatedEmployee[] = [
  {
    id: 'te1',
    name: 'User B',
    email: 'user.b@example.com',
    terminationDate: '2024-01-20',
    notes: 'Resignation. Equipment to be returned.',
    createdAt: '2024-01-20T14:00:00Z',
  },
  {
    id: 'te2',
    name: 'User F',
    email: 'user.f@example.com',
    terminationDate: '2024-01-15',
    notes: 'Contract end.',
    createdAt: '2024-01-15T10:00:00Z',
  },
];
