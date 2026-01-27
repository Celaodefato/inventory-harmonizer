
export interface ParsedCsvResult {
    data: any[];
    error?: string;
    count: number;
}

export function parseCsv(content: string, source: string): ParsedCsvResult {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
        return { data: [], count: 0, error: 'Arquivo CSV vazio ou sem cabeçalho.' };
    }

    // Header validation - only hostname is required
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    if (!headers.includes('hostname')) {
        return {
            data: [],
            count: 0,
            error: `Formato inválido. Coluna obrigatória: hostname. Encontrado: ${headers.join(', ')}`
        };
    }

    const hostnameIdx = headers.indexOf('hostname');
    const ipIdx = headers.indexOf('ip');
    const uuidIdx = headers.indexOf('uuid') !== -1 ? headers.indexOf('uuid') :
        headers.indexOf('id') !== -1 ? headers.indexOf('id') :
            headers.indexOf('device_id') !== -1 ? headers.indexOf('device_id') :
                headers.indexOf('_id') !== -1 ? headers.indexOf('_id') : -1;

    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, '')); // Basic quote removal
        if (row.length < headers.length) continue; // Skip malformed lines

        const hostname = row[hostnameIdx];
        if (!hostname) continue; // Skip rows without hostname

        const item: any = {
            hostname: hostname,
            // Generate default IP if not present
            ip: ipIdx !== -1 && row[ipIdx] ? row[ipIdx] : `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
            // Generate default UUID if not present
            uuid: uuidIdx !== -1 && row[uuidIdx] ? row[uuidIdx] : `uuid-${hostname.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
            source: source,
            origin: 'csv',
            lastSeen: new Date().toISOString(), // Default validation
            os: 'Unknown (CSV)' // Default
        };

        // Try to grab extra common fields if they exist
        if (headers.includes('os')) item.os = row[headers.indexOf('os')];
        if (headers.includes('useremail')) item.userEmail = row[headers.indexOf('useremail')];
        if (headers.includes('email')) item.userEmail = row[headers.indexOf('email')];

        data.push(item);
    }

    return { data, count: data.length };
}
