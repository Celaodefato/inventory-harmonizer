import { Endpoint } from '@/types/inventory';

export interface ParsedCsvResult {
    data: any[];
    error?: string;
    count: number;
    detectedType?: string;
}

// Configuration: Defines how to map CSV columns to our data model for each tool
const UNIVERSAL_HOSTNAME = ['hostname', 'name', 'asset name', 'endpoint name', 'displayname', 'host', 'servidor', 'device', 'system name', 'login'];
const UNIVERSAL_IP = ['ip address', 'ip', 'remoteip', 'internal ip address', 'external ip address', 'endereço ip', 'ip_address'];

const CSV_CONFIG: Record<string, { hostname: string[]; ip: string[]; os: string[]; lastSeen: string[]; other?: Record<string, string[]> }> = {
    cortex: {
        hostname: UNIVERSAL_HOSTNAME,
        ip: UNIVERSAL_IP,
        os: ['operating system', 'os', 'platform'],
        lastSeen: ['last seen'],
        other: {
            endpointStatus: ['endpoint status', 'status'],
            endpointType: ['endpoint type', 'type']
        }
    },
    vicarius: {
        hostname: UNIVERSAL_HOSTNAME,
        ip: UNIVERSAL_IP,
        os: ['operating system', 'os'],
        lastSeen: ['last contacted', 'last reported']
    },
    warp: {
        hostname: UNIVERSAL_HOSTNAME,
        ip: UNIVERSAL_IP,
        os: [],
        lastSeen: [],
        other: { email: ['email', 'user'] }
    },
    jumpcloud: {
        hostname: UNIVERSAL_HOSTNAME,
        ip: UNIVERSAL_IP,
        os: ['os', 'osfamily'],
        lastSeen: ['lastcontact', 'last_seen']
    },
    jumpcloud_users: {
        hostname: ['email', 'username', ...UNIVERSAL_HOSTNAME],
        ip: UNIVERSAL_IP,
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
        hostname: UNIVERSAL_HOSTNAME,
        ip: UNIVERSAL_IP,
        os: ['operating system', 'os', 'sistema operacional'],
        lastSeen: ['last access', 'último acesso']
    },
    hacker_ranger: {
        hostname: ['email', 'username'],
        ip: [],
        os: [],
        lastSeen: [],
        other: {
            name: ['nome', 'name', 'fullname'],
            status: ['status', 'situação', 'situacao']
        }
    },
    base_rh: {
        hostname: ['email', 'username'],
        ip: [],
        os: [],
        lastSeen: [],
        other: {
            name: ['nome', 'name', 'fullname'],
            status: ['status', 'situação', 'situacao', 'estado'],
            department: ['departamento', 'setor', 'department', 'área', 'area']
        }
    },
    generic: {
        hostname: UNIVERSAL_HOSTNAME,
        ip: UNIVERSAL_IP,
        os: ['os', 'operating system'],
        lastSeen: ['last seen']
    }
};

function splitCsvText(content: string): string[] {
    const rows: string[] = [];
    let currentRow = '';
    let inQuote = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];

        if (char === '"') {
            inQuote = !inQuote;
        }

        if ((char === '\n' || char === '\r') && !inQuote) {
            if (char === '\r' && content[i + 1] === '\n') {
                i++; // skip \n of \r\n flag
            }
            if (currentRow.trim() !== '') {
                rows.push(currentRow);
            }
            currentRow = '';
        } else {
            currentRow += char;
        }
    }
    if (currentRow.trim() !== '') {
        rows.push(currentRow);
    }
    return rows;
}

export function parseCsv(content: string, requestedTool: string): ParsedCsvResult {
    if (!content || !content.trim()) {
        return { data: [], count: 0, error: 'Arquivo CSV vazio ou sem cabeçalho.' };
    }

    const lines = splitCsvText(content);
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
    console.log('[CSV Debug] Raw Headers:', rawHeaders);
    console.log('[CSV Debug] Lowercase Headers:', headers);
    console.log('[CSV Debug] Delimiter used:', delimiter);

    // Helper to check if a header matches our aliases safely
    const matchHeader = (h: string, id: string) => {
        if (h === id) return true;
        if (id.length <= 2) return new RegExp(`(^|[\\s_\\-])${id}([\\s_\\-]|$)`).test(h);
        return h.includes(id);
    };

    // Basic validation: need at least one identifier column (Hostname or IP)
    const hasHostname = UNIVERSAL_HOSTNAME.some(id => headers.some(h => matchHeader(h, id)));
    const hasIP = UNIVERSAL_IP.some(id => headers.some(h => matchHeader(h, id)));

    if (!hasHostname && !hasIP) {
        console.warn('[CSV Debug] No hostname or IP found in headers:', headers);
        return {
            data: [],
            count: 0,
            error: `Erro de Formato: Nenhuma coluna de Hostname ou IP encontrada. Colunas detectadas: ${headers.join(', ')}`
        };
    }

    // 2. Identify Tool (Explicit or Auto-Detect)
    let detectedType = '';

    if (requestedTool && requestedTool !== 'generic') {
        // Always trust the UI button the user clicked
        detectedType = requestedTool.toLowerCase();
    } else {
        // Auto-detection using unique columns (only used if uploaded via a generic area)
        if (headers.includes('endpoint name') && headers.includes('endpoint type')) detectedType = 'cortex';
        else if (headers.includes('asset groups') || headers.includes('attributes')) detectedType = 'vicarius';
        else if (headers.includes('displayname') && headers.includes('_id')) detectedType = 'jumpcloud';
        else if (headers.includes('hostname') && headers.includes('email') && headers.includes('grupo')) detectedType = 'warp';
        else if (headers.includes('active device count') && headers.includes('email')) detectedType = 'warp';
        else if (headers.includes('displayname') && headers.includes('osfamily')) detectedType = 'jumpcloud';
        else if (headers.includes('state') && headers.includes('email')) detectedType = 'jumpcloud_users';

        if (!detectedType) {
            // Loose detection for generic/auto-only mode
            if (headers.includes('hostname') && (headers.includes('ip address') || headers.includes('last access') || headers.length < 8)) {
                detectedType = 'pam';
            } else {
                detectedType = 'generic';
            }
        }
    }

    const data: any[] = [];
    const now = new Date().toISOString();
    const config = CSV_CONFIG[detectedType];

    // Identify UUID column once
    const uuidCol = headers.find(h => ['uuid', 'id', 'device_id', 'agent id'].includes(h));

    for (let i = 1; i < lines.length; i++) {
        // Parse row with custom delimiter logic
        const row = parseRow(lines[i], delimiter);
        if (i === 1) console.log('[CSV Debug] First data row sample:', row);

        if (row.length < headers.length * 0.3) continue; // Skip malformed (relaxed from 0.5)

        const item: any = {
            source: detectedType,
            origin: 'csv',
            lastSeen: now,
            ip: '',
            os: 'Unknown'
        };

        // 3. Extract Data

        // A. Hostname (Universal Priority)
        let hostname = '';
        for (const col of UNIVERSAL_HOSTNAME) {
            const val = getValue(row, headers, col);
            if (val) { hostname = val; break; }
        }

        // B. IP (Universal Priority)
        let ip = '';
        for (const col of UNIVERSAL_IP) {
            const val = getValue(row, headers, col);
            if (val) { ip = val; break; }
        }

        if (!hostname) {
            if (ip) hostname = `device-${ip.replace(/\./g, '-')}`; // Fallback if only IP exists
            else continue;
        }

        item.hostname = hostname;
        item.ip = ip;

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
                        if (val) {
                            if (key === 'email') {
                                item.userEmail = val;
                            } else {
                                item[key] = val;
                            }
                            break;
                        }
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
    const search = colName.toLowerCase();

    // 1. Exact match
    let idx = headers.indexOf(search);
    if (idx !== -1 && row[idx]) return row[idx].trim();

    // 2. Loose match
    idx = headers.findIndex(h => {
        if (search.length <= 2) return new RegExp(`(^|[\\s_\\-])${search}([\\s_\\-]|$)`).test(h);
        return h.includes(search);
    });

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

    const lines = splitCsvText(content);
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

/**
 * Parse a Hacker Rangers Users CSV export.
 */
export function parseHackerRangersCsv(content: string): ParsedCsvResult {
    const parsed = parseGenericCsv(content);
    if (!parsed) return { data: [], count: 0, error: 'Arquivo CSV vazio ou inválido.' };

    const { headers, rows } = parsed;

    const emailCol = headers.find(h => ['email', 'e-mail', 'e_mail', 'usuário', 'usuario'].includes(h));
    if (!emailCol) {
        return { data: [], count: 0, error: 'CSV do Hacker Rangers deve ter coluna "Email".' };
    }

    const nameCol = headers.find(h => ['nome', 'name', 'fullname', 'nome completo'].includes(h));
    const statusCol = headers.find(h => ['status', 'situação', 'situacao'].includes(h));

    const data = rows
        .map(row => ({
            email: row[emailCol] || '',
            name: nameCol ? row[nameCol] : '',
            status: statusCol ? row[statusCol] : 'Ativo',
            source: 'hacker_ranger',
            origin: 'csv',
        }))
        .filter(u => u.email);

    return { data, count: data.length, detectedType: 'hacker_ranger' };
}

/**
 * Parse a BASE RH Users CSV export.
 */
export function parseBaseRhCsv(content: string): ParsedCsvResult {
    const parsed = parseGenericCsv(content);
    if (!parsed) return { data: [], count: 0, error: 'Arquivo CSV vazio ou inválido.' };

    const { headers, rows } = parsed;

    const emailCol = headers.find(h => ['email', 'e-mail', 'e_mail', 'usuário', 'usuario'].includes(h));
    if (!emailCol) {
        return { data: [], count: 0, error: 'CSV do BASE RH deve ter coluna "Email".' };
    }

    const nameCol = headers.find(h => ['nome', 'name', 'fullname', 'nome completo'].includes(h));
    const statusCol = headers.find(h => ['status', 'situação', 'situacao', 'estado'].includes(h));
    const departmentCol = headers.find(h => ['departamento', 'setor', 'department', 'área', 'area'].includes(h));

    const data = rows
        .map(row => ({
            email: row[emailCol] || '',
            name: nameCol ? row[nameCol] : '',
            status: statusCol ? row[statusCol] : 'Ativo',
            department: departmentCol ? row[departmentCol] : '',
            source: 'base_rh',
            origin: 'csv',
        }))
        .filter(u => u.email);

    return { data, count: data.length, detectedType: 'base_rh' };
}
