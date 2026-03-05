
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
    return [];
}
