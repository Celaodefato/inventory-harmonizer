
export interface License {
    id: string;
    tool: string;
    vendor: string;
    type: 'per-device' | 'per-user' | 'flat' | 'subscription';
    totalLicenses: number;
    usedLicenses: number;
    costPerUnit?: number;
    currency?: string;
    renewalDate?: string;
    notes?: string;
    status: 'healthy' | 'warning' | 'critical' | 'expired';
}
