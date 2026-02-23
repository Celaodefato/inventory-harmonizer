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
        other: { activeDeviceCount: ['active device count'], email: ['email'] }
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
        other: {
            state: ['state', 'account_locked'],
            email: ['email'],
            firstname: ['firstname', 'first name'],
            lastname: ['lastname', 'last name']
        }
    },
    pam: {
        hostname: ['asset name', 'name', 'hostname'],
        ip: ['ip address', 'ip'],
        os: ['operating system', 'os'],
        lastSeen: ['last access']
    },
    generic: {
        hostname: ['hostname', 'name'],
        ip: ['ip', 'ip address'],
        os: ['os', 'operating system'],
        lastSeen: ['last seen']
    }
};

export function parseCsv(content: string, requestedTool: string): ParsedCsvResult {
    if (!content || !content.trim()) {
        return { data: [], count: 0, error: 'Arquivo CSV vazio ou sem cabeçalho.' };
    }

    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
        return { data: [], count: 0, error: 'Arquivo CSV vazio ou sem cabeçalho.' };
    }

    // 1. Detect Delimiter (Comma or Semicolon)
    const firstLine = lines[0];
    const clean = (str: string) => str?.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, '') || '';

    const countSemi = (firstLine.match(/;/g) || []).length;
    const countComma = (firstLine.match(/,/g) || []).length;
    const delimiter = countSemi > countComma ? ';' : ',';

    const rawHeaders = firstLine.split(delimiter).map(clean);
    const headers = rawHeaders.map(h => h.toLowerCase());

    // Basic validation: need at least one identifier column
    const validIdentifiers = ['hostname', 'displayname', 'asset name', 'endpoint name', 'email', 'username'];
    const hasIdentifier = validIdentifiers.some(id => headers.includes(id));
    if (!hasIdentifier) {
        return { data: [], count: 0, error: 'Formato inválido: Coluna de identificação não encontrada (hostname, email ou username).' };
    }

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

    // Identify UUID column once
    const uuidCol = headers.find(h => ['uuid', 'id', 'device_id', 'agent id'].includes(h));
    if (!uuidCol && detectedType !== 'jumpcloud_users' && detectedType !== 'warp') {
        return { data: [], count: 0, error: 'Formato inválido: Coluna uuid não encontrada.' };
    }

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
        let hostname = getValue(row, headers, 'hostname');

        if (!hostname && config) {
            for (const col of config.hostname) {
                const val = getValue(row, headers, col);
                if (val) { hostname = val; break; }
            }
        }

        if (!hostname && (detectedType === 'warp' || detectedType === 'jumpcloud_users')) {
            hostname = getValue(row, headers, 'email');
        }

        if (!hostname) hostname = getValue(row, headers, 'name');

        if (!hostname) continue;

        item.hostname = hostname;

        // UUID
        if (uuidCol) {
            item.uuid = getValue(row, headers, uuidCol);
        } else {
            item.uuid = `csv-${detectedType}-${hostname.replace(/[^a-z0-9]/gi, '-')}`;
        }

        // B. Other Fields (IP, OS, LastSeen)
        // Try config first
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
        }

        // Fallback or generic if not found in config
        if (!item.ip || item.ip === '') {
            item.ip = getValue(row, headers, 'ip') || getValue(row, headers, 'ip address');
        }
        if (!item.os || item.os === 'Unknown') {
            item.os = getValue(row, headers, 'os') || getValue(row, headers, 'operating system');
        }
        if (!item.lastSeen || item.lastSeen === now) {
            const ls = getValue(row, headers, 'last seen') || getValue(row, headers, 'timestamp');
            if (ls) item.lastSeen = ls;
        }

        // Clean IP
        if (item.ip && item.ip.includes(',')) item.ip = item.ip.split(',')[0].trim();

        data.push(item);
    }

    return {
        data,
        count: data.length,
        detectedType,
        error: data.length === 0 ? 'Nenhum registro válido encontrado.' : undefined
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

// ─── Dedicated User CSV Parsers ─────────────────────────────────────────────

/**
 * Parses a generic CSV content into an array of objects keyed by lowercased header names.
 * Used as the base for user-specific parsers.
 */
function parseGenericCsv(content: string): { headers: string[]; rows: Record<string, string>[] } | null {
    if (!content || !content.trim()) return null;

    const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) return null;

    const firstLine = lines[0];
    const clean = (s: string) => s?.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, '') || '';

    const countSemi = (firstLine.match(/;/g) || []).length;
    const countComma = (firstLine.match(/,/g) || []).length;
    const delimiter = countSemi > countComma ? ';' : ',';

    const rawHeaders = firstLine.split(delimiter).map(clean);
    const headers = rawHeaders.map(h => h.toLowerCase());

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
        const cells = parseRow(lines[i], delimiter);
        if (cells.length < 1) continue;
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
            obj[h] = cells[idx] ?? '';
        });
        rows.push(obj);
    }

    return { headers, rows };
}

/**
 * Parse a JumpCloud Users CSV export.
 * Expected columns: email (or username), firstname (or first name), lastname (or last name), state
 */
export function parseJumpCloudUsersCsv(content: string): ParsedCsvResult {
    const parsed = parseGenericCsv(content);
    if (!parsed) return { data: [], count: 0, error: 'Arquivo CSV vazio ou inválido.' };

    const { headers, rows } = parsed;

    // Find email column (case insensitive)
    const emailCol = headers.find(h => ['email', 'e-mail', 'e_mail'].includes(h));
    const usernameCol = headers.find(h => ['username', 'user', 'login'].includes(h));

    if (!emailCol && !usernameCol) {
        return { data: [], count: 0, error: 'CSV de usuários JumpCloud deve ter coluna "Email" ou "Username".' };
    }

    const firstnameCol = headers.find(h => ['firstname', 'first name', 'first_name', 'nome'].includes(h));
    const lastnameCol = headers.find(h => ['lastname', 'last name', 'last_name', 'sobrenome'].includes(h));
    const stateCol = headers.find(h => ['state', 'status', 'account_locked', 'activated'].includes(h));

    const data = rows
        .map(row => ({
            email: (emailCol ? row[emailCol] : '') || (usernameCol ? row[usernameCol] : ''),
            firstname: firstnameCol ? row[firstnameCol] : '',
            lastname: lastnameCol ? row[lastnameCol] : '',
            state: stateCol ? row[stateCol] : 'ACTIVATED',
            source: 'jumpcloud_users',
            origin: 'csv',
        }))
        .filter(u => u.email);

    if (data.length === 0) {
        return { data: [], count: 0, error: 'Nenhum usuário válido encontrado. Verifique se a coluna "Email" existe no arquivo.' };
    }

    return { data, count: data.length, detectedType: 'jumpcloud_users' };
}

/**
 * Parse a Warp Users CSV export.
 * Expected columns: email (or username), active device count
 */
export function parseWarpUsersCsv(content: string): ParsedCsvResult {
    const parsed = parseGenericCsv(content);
    if (!parsed) return { data: [], count: 0, error: 'Arquivo CSV vazio ou inválido.' };

    const { headers, rows } = parsed;

    const emailCol = headers.find(h => ['email', 'e-mail', 'e_mail', 'user', 'username'].includes(h));
    if (!emailCol) {
        return { data: [], count: 0, error: 'CSV do Warp deve ter coluna "Email".' };
    }

    const deviceCountCol = headers.find(h =>
        ['active device count', 'device count', 'devices', 'activedevicecount'].includes(h)
    );

    const data = rows
        .map(row => ({
            email: row[emailCol] || '',
            activeDeviceCount: deviceCountCol ? parseInt(row[deviceCountCol] || '0', 10) : 0,
            source: 'warp',
            origin: 'csv',
        }))
        .filter(u => u.email);

    if (data.length === 0) {
        return { data: [], count: 0, error: 'Nenhum usuário válido encontrado. Verifique se a coluna "Email" existe no arquivo.' };
    }

    return { data, count: data.length, detectedType: 'warp' };
}
