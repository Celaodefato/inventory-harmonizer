import { Endpoint } from '@/types/inventory';

export interface ParsedCsvResult {
    data: any[];
    error?: string;
    count: number;
    detectedType?: string;
}

// Configuration: Defines how to map CSV columns to our data model for each tool
const CSV_CONFIG: Record<string, { hostname: string[]; ip: string[]; os: string[]; lastSeen: string[]; other?: Record<string, string[]> }> = {
    cortex: {
        hostname: ['endpoint name', 'agent id'],
        ip: ['ip address', 'ip'],
        os: ['operating system', 'os'],
        lastSeen: ['last seen']
    },
    vicarius: {
        hostname: ['name', 'asset name'],
        ip: ['internal ip address', 'external ip address'],
        os: ['operating system'],
        lastSeen: []
    },
    warp: {
        hostname: ['email', 'device name'], // Warp fallback priority
        ip: [],
        os: [],
        lastSeen: [],
        other: { deviceCount: ['active device count'], userEmail: ['email'] }
    },
    jumpcloud: {
        hostname: ['displayname', 'system name'],
        ip: [],
        os: ['osfamily', 'os'],
        lastSeen: ['lastcontact']
    },
    jumpcloud_users: {
        hostname: ['email', 'username'],
        ip: [],
        os: [],
        lastSeen: [],
        other: { status: ['state', 'account_locked'], userEmail: ['email'] }
    },
    // Generic fallback handled by code
};

export function parseCsv(content: string, requestedTool: string): ParsedCsvResult {
    if (!content || !content.trim()) {
        return { data: [], count: 0, error: 'Arquivo vazio.' };
    }

    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
        return { data: [], count: 0, error: 'CSV inválido: Cabeçalho não encontrado.' };
    }

    // 1. Detect Delimiter (Comma or Semicolon)
    const firstLine = lines[0];
    const clean = (str: string) => str?.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, '') || '';

    const countSemi = (firstLine.match(/;/g) || []).length;
    const countComma = (firstLine.match(/,/g) || []).length;
    const delimiter = countSemi > countComma ? ';' : ',';

    const rawHeaders = firstLine.split(delimiter).map(clean);
    const headers = rawHeaders.map(h => h.toLowerCase());

    // 2. Identify Tool (Auto-Detect or Use Requested)
    let detectedType = '';

    // Auto-detection using unique columns
    if (headers.includes('endpoint name') && headers.includes('endpoint type')) detectedType = 'cortex';
    else if (headers.includes('asset groups') || (headers.includes('name') && headers.includes('attributes'))) detectedType = 'vicarius';
    else if (headers.includes('active device count') && headers.includes('email')) detectedType = 'warp';
    else if (headers.includes('displayname') && headers.includes('osfamily')) detectedType = 'jumpcloud';
    else if (headers.includes('state') && headers.includes('email')) detectedType = 'jumpcloud_users';

    // Fallback to requested tool if detection failed
    if (!detectedType) {
        detectedType = requestedTool ? requestedTool.toLowerCase() : 'generic';
    }

    const data: any[] = [];
    const now = new Date().toISOString();
    const config = CSV_CONFIG[detectedType];

    for (let i = 1; i < lines.length; i++) {
        // Parse row with custom delimiter logic
        const row = parseRow(lines[i], delimiter);
        if (row.length < headers.length * 0.5) continue; // Skip malformed

        const item: any = {
            source: detectedType,
            origin: 'csv',
            lastSeen: now,
            ip: '',
            os: 'Unknown'
        };

        // 3. Extract Data

        // A. Hostname (Universal Priority)
        // First, check explicit 'hostname' column
        let hostname = getValue(row, headers, 'hostname');

        // If not found, try tool-specific hostname columns
        if (!hostname && config) {
            for (const col of config.hostname) {
                const val = getValue(row, headers, col);
                if (val) {
                    hostname = val;
                    break;
                }
            }
        }

        // Warp specific: Use Email as hostname if still empty
        if (!hostname && detectedType === 'warp') {
            hostname = getValue(row, headers, 'email');
        }

        // Generic fallback
        if (!hostname) {
            hostname = getValue(row, headers, 'name'); // Common fallback
        }

        if (!hostname) continue; // Skip if no identifier found

        item.hostname = hostname;
        item.uuid = `csv-${detectedType}-${hostname.replace(/[^a-z0-9]/gi, '-')}`;

        // B. Other Fields (IP, OS, LastSeen)
        if (config) {
            // IP
            for (const col of config.ip) {
                const val = getValue(row, headers, col);
                if (val) { item.ip = val; break; }
            }
            // OS
            for (const col of config.os) {
                const val = getValue(row, headers, col);
                if (val) { item.os = val; break; }
            }
            // Last Seen
            for (const col of config.lastSeen) {
                const val = getValue(row, headers, col);
                if (val) { item.lastSeen = val; break; }
            }
            // Special Fields
            if (config.other) {
                Object.entries(config.other).forEach(([key, cols]) => {
                    for (const col of cols) {
                        const val = getValue(row, headers, col);
                        if (val) { item[key] = val; break; }
                    }
                });
            }
        } else {
            // Generic extract
            item.ip = getValue(row, headers, 'ip') || getValue(row, headers, 'ip address');
            item.os = getValue(row, headers, 'os') || getValue(row, headers, 'operating system');
        }

        // Clean IP
        if (item.ip && item.ip.includes(',')) item.ip = item.ip.split(',')[0].trim();

        data.push(item);
    }

    return {
        data,
        count: data.length,
        detectedType,
        error: data.length === 0 ? 'Nenhum registro válido encontrado. Verifique a coluna HOSTNAME.' : undefined
    };
}

function getValue(row: string[], headers: string[], colName: string): string {
    const idx = headers.indexOf(colName.toLowerCase());
    if (idx !== -1 && row[idx]) return row[idx].trim();
    return '';
}

function parseRow(text: string, delimiter: string): string[] {
    const row: string[] = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === delimiter && !inQuote) {
            row.push(current.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
            current = '';
        } else {
            current += char;
        }
    }
    row.push(current.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
    return row;
}
