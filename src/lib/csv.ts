
export interface ParsedCsvResult {
    data: any[];
    error?: string;
    count: number;
}

import { Endpoint } from '@/types/inventory';

export interface ParsedCsvResult {
    data: any[]; // Returning simplified objects, not full strict Endpoint yet, but mapped partially
    error?: string;
    count: number;
    detectedType?: string;
}

// Helper to remove BOM and cleanup quotes
const clean = (str: string) => str?.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, '') || '';

export function parseCsv(content: string, requestedTool: string): ParsedCsvResult {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
        return { data: [], count: 0, error: 'Arquivo CSV vazio ou sem cabeçalho.' };
    }

    const rawHeaders = lines[0].split(',').map(clean);
    const headers = rawHeaders.map(h => h.toLowerCase());

    // Auto-detection logic (Case Insensitive)
    let detectedType = '';

    // Cortex: "Endpoint Status", "Endpoint Name", "Endpoint Type"
    if (headers.includes('endpoint name') && headers.includes('endpoint type')) detectedType = 'cortex';

    // Vicarius: "Name", "Attributes", "Vulnerabilities - Architecture"
    // Also check for "Asset Groups" separately just in case
    else if (headers.includes('asset groups') || (headers.includes('name') && headers.includes('attributes'))) detectedType = 'vicarius';

    // Warp: "Email", "Active Device Count"
    else if (headers.includes('active device count') && headers.includes('email')) detectedType = 'warp';

    // JumpCloud Devices: "displayName", "osFamily"
    else if (headers.includes('displayname') && headers.includes('osfamily')) detectedType = 'jumpcloud';

    // JumpCloud Users: "email", "state" (or account_locked)
    else if (headers.includes('email') && (headers.includes('account_locked') || headers.includes('state'))) detectedType = 'jumpcloud_users';

    // Fallback: If detection failed, assume the user knows what source card they clicked
    if (!detectedType) {
        detectedType = requestedTool;
    }

    const data: any[] = [];
    const now = new Date().toISOString();

    for (let i = 1; i < lines.length; i++) {
        // Handle CSV parsing with potentially quoted values containing commas (basic implementation)
        // For robust CSV, regex is better, but split is fast for simple cases. 
        // Given complexity, let's use a slightly smarter match or assume standard CSV without internal commas for now
        // or a simple regex splitter.
        const row = parseCsvLine(lines[i]);

        if (row.length < headers.length * 0.5) continue; // Skip heavily malformed lines

        let item: any = {
            source: detectedType,
            origin: 'csv',
            lastSeen: now,
            os: 'Unknown',
            ip: '',
        };

        try {
            if (detectedType === 'cortex') {
                // Cortex Mapping
                // Headers: Endpoint Status, Last Seen, Endpoint Name, Endpoint Type, Operating System, Agent Version, IP Address
                item.hostname = getValue(row, headers, 'endpoint name');
                item.ip = getValue(row, headers, 'ip address');
                item.os = getValue(row, headers, 'operating system');
                item.lastSeen = getValue(row, headers, 'last seen') || now;

            } else if (detectedType === 'vicarius') {
                // Vicarius Mapping
                // Headers: Name, IP Address, Operating System, Last Contacted Version? No "Last Contacted"
                item.hostname = getValue(row, headers, 'name');
                item.ip = getValue(row, headers, 'internal ip address') || getValue(row, headers, 'external ip address');
                item.os = getValue(row, headers, 'operating system');
                // Vicarius date might need parsing

            } else if (detectedType === 'warp') {
                // Warp Mapping (Users)
                // Headers: Name, Email, Active Device Count
                // Warp CSV is User-centric. We map Email to userEmail. 
                // For Hostname, we might not have one, or use Name.
                // Requirement: Users in JC must be in Warp.
                item.userEmail = getValue(row, headers, 'email');
                item.hostname = item.userEmail; // Temporary: Use email as ID for User-only lists
                item.deviceCount = getValue(row, headers, 'active device count');

            } else if (detectedType === 'jumpcloud') {
                // JC Devices
                // Headers: displayName, osFamily, lastContact
                item.hostname = getValue(row, headers, 'displayname');
                item.os = getValue(row, headers, 'osfamily') + ' ' + getValue(row, headers, 'os');
                item.lastSeen = getValue(row, headers, 'lastcontact') || now;

            } else if (detectedType === 'jumpcloud_users') {
                // JC Users
                // Headers: email, state
                item.userEmail = getValue(row, headers, 'email');
                item.hostname = item.userEmail; // Use email as ID
                item.status = getValue(row, headers, 'state');
            } else {
                // Fallback (Generic)
                item.hostname = getValue(row, headers, 'hostname');
                item.ip = getValue(row, headers, 'ip');
            }

            // Cleanup
            if (item.hostname) {
                // If it's a file path or URL, clean it? No, assume raw for now.
                // Clean IP
                if (item.ip && item.ip.includes(',')) item.ip = item.ip.split(',')[0].trim();

                // Generate ID/UUID
                item.uuid = `csv-${detectedType}-${item.hostname.replace(/[^a-z0-9]/gi, '-')}`;

                data.push(item);
            }
        } catch (e) {
            console.warn('Error parsing row', i, e);
        }
    }

    return {
        data,
        count: data.length,
        detectedType
    };
}

function getValue(row: string[], headers: string[], colName: string): string {
    const idx = headers.indexOf(colName.toLowerCase());
    if (idx !== -1 && row[idx]) return row[idx].trim();
    return '';
}

// Simple regex to handle quoted fields with commas
function parseCsvLine(text: string): string[] {
    let p = '', row = [''], i = 0, r = 0, s = !0, l;
    for (l of text) {
        if ('"' === l) {
            if (s && l === p) row[r] += l;
            s = !s;
        } else if (',' === l && s) l = row[++r] = '';
        else row[r] += l;
        p = l;
    }
    return row.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
}
