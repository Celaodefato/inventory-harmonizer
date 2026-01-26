import { Endpoint } from '@/types/inventory';

export const mockVicariusEndpoints: Endpoint[] = [
  { id: 'v1', hostname: 'srv-web-01', ip: '192.168.1.10', uuid: 'uuid-001', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T10:30:00Z', source: 'vicarius' },
  { id: 'v2', hostname: 'srv-db-01', ip: '192.168.1.20', uuid: 'uuid-002', os: 'CentOS 8', lastSeen: '2024-01-25T10:25:00Z', source: 'vicarius' },
  { id: 'v3', hostname: 'srv-app-01', ip: '192.168.1.30', uuid: 'uuid-003', os: 'Windows Server 2022', lastSeen: '2024-01-25T10:20:00Z', source: 'vicarius' },
  { id: 'v4', hostname: 'ws-dev-01', ip: '192.168.2.10', uuid: 'uuid-004', os: 'Windows 11', lastSeen: '2024-01-25T09:45:00Z', source: 'vicarius' },
  { id: 'v5', hostname: 'srv-mail-01', ip: '192.168.1.40', uuid: 'uuid-005', os: 'Ubuntu 20.04', lastSeen: '2024-01-25T10:15:00Z', source: 'vicarius' },
  { id: 'v6', hostname: 'srv-backup-01', ip: '192.168.1.50', uuid: 'uuid-006', os: 'Debian 11', lastSeen: '2024-01-25T08:00:00Z', source: 'vicarius' },
  { id: 'v7', hostname: 'srv-proxy-01', ip: '192.168.1.60', uuid: 'uuid-007', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T10:28:00Z', source: 'vicarius' },
];

export const mockCortexEndpoints: Endpoint[] = [
  { id: 'c1', hostname: 'srv-web-01', ip: '192.168.1.10', uuid: 'uuid-001', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T10:32:00Z', source: 'cortex' },
  { id: 'c2', hostname: 'srv-db-01', ip: '192.168.1.20', uuid: 'uuid-002', os: 'CentOS 8', lastSeen: '2024-01-25T10:28:00Z', source: 'cortex' },
  { id: 'c3', hostname: 'srv-app-01', ip: '192.168.1.30', uuid: 'uuid-003', os: 'Windows Server 2022', lastSeen: '2024-01-25T10:22:00Z', source: 'cortex' },
  { id: 'c4', hostname: 'ws-dev-01', ip: '192.168.2.10', uuid: 'uuid-004', os: 'Windows 11', lastSeen: '2024-01-25T09:50:00Z', source: 'cortex' },
  { id: 'c5', hostname: 'srv-analytics-01', ip: '192.168.1.70', uuid: 'uuid-008', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T10:10:00Z', source: 'cortex' },
  { id: 'c6', hostname: 'srv-cache-01', ip: '192.168.1.80', uuid: 'uuid-009', os: 'Redis OS', lastSeen: '2024-01-25T10:05:00Z', source: 'cortex' },
];

export const mockWarpEndpoints: Endpoint[] = [
  { id: 'w1', hostname: 'srv-web-01', ip: '192.168.1.10', uuid: 'uuid-001', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T10:31:00Z', source: 'warp' },
  { id: 'w2', hostname: 'srv-db-01', ip: '192.168.1.20', uuid: 'uuid-002', os: 'CentOS 8', lastSeen: '2024-01-25T10:26:00Z', source: 'warp' },
  { id: 'w3', hostname: 'ws-dev-01', ip: '192.168.2.10', uuid: 'uuid-004', os: 'Windows 11', lastSeen: '2024-01-25T09:48:00Z', source: 'warp' },
  { id: 'w4', hostname: 'srv-vpn-01', ip: '192.168.1.90', uuid: 'uuid-010', os: 'pfSense', lastSeen: '2024-01-25T10:00:00Z', source: 'warp' },
  { id: 'w5', hostname: 'srv-dns-01', ip: '192.168.1.100', uuid: 'uuid-011', os: 'Ubuntu 22.04', lastSeen: '2024-01-25T09:55:00Z', source: 'warp' },
];
