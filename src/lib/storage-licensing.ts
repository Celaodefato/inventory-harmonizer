
import { supabase } from './supabase';
import { License } from '@/types/licensing';

const STORAGE_KEY = 'exa_inventory_licenses';

export async function getLicenses(): Promise<License[]> {
    try {
        const { data, error } = await supabase
            .from('inventory_data')
            .select('data')
            .eq('tool', 'licenses')
            .order('updated_at', { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) {
            // Fallback to localStorage
            const local = localStorage.getItem(STORAGE_KEY);
            return local ? JSON.parse(local) : getDefaultLicenses();
        }

        return data[0].data as License[];
    } catch {
        const local = localStorage.getItem(STORAGE_KEY);
        return local ? JSON.parse(local) : getDefaultLicenses();
    }
}

export async function saveLicenses(licenses: License[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(licenses));

    try {
        const { data: existing } = await supabase
            .from('inventory_data')
            .select('id')
            .eq('tool', 'licenses')
            .limit(1);

        if (existing && existing.length > 0) {
            await supabase
                .from('inventory_data')
                .update({ data: licenses, updated_at: new Date().toISOString() })
                .eq('tool', 'licenses');
        } else {
            await supabase
                .from('inventory_data')
                .insert({ tool: 'licenses', data: licenses, updated_at: new Date().toISOString() });
        }
    } catch {
        // Silently fail, localStorage is fallback
    }
}

function getDefaultLicenses(): License[] {
    return [
        {
            id: 'lic-vicarius',
            tool: 'Vicarius',
            vendor: 'Vicarius',
            type: 'per-device',
            totalLicenses: 300,
            usedLicenses: 0,
            renewalDate: '',
            notes: 'Gerenciamento de vulnerabilidades',
            status: 'healthy',
        },
        {
            id: 'lic-cortex',
            tool: 'Cortex XDR',
            vendor: 'Palo Alto Networks',
            type: 'per-device',
            totalLicenses: 300,
            usedLicenses: 0,
            renewalDate: '',
            notes: 'Detecção e resposta a ameaças',
            status: 'healthy',
        },
        {
            id: 'lic-warp',
            tool: 'Warp',
            vendor: 'Cloudflare',
            type: 'per-user',
            totalLicenses: 250,
            usedLicenses: 0,
            renewalDate: '',
            notes: 'VPN zero-trust corporativo',
            status: 'healthy',
        },
        {
            id: 'lic-jumpcloud',
            tool: 'JumpCloud',
            vendor: 'JumpCloud',
            type: 'per-user',
            totalLicenses: 250,
            usedLicenses: 0,
            renewalDate: '',
            notes: 'Identity & Device Management',
            status: 'healthy',
        },
        {
            id: 'lic-pam',
            tool: 'SenhaSegura (PAM)',
            vendor: 'Segura',
            type: 'per-device',
            totalLicenses: 200,
            usedLicenses: 0,
            renewalDate: '',
            notes: 'Gerenciamento de acesso privilegiado',
            status: 'healthy',
        },
    ];
}
