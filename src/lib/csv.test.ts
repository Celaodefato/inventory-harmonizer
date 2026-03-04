
import { describe, it, expect } from 'vitest';
import { parseCsv } from './csv';

describe('CSV Parser', () => {
    it('should return error for empty content', () => {
        const result = parseCsv('', 'vicarius');
        expect(result.error).toBe('Arquivo CSV vazio ou sem cabeçalho.');
        expect(result.data).toHaveLength(0);
    });

    it('should validate required headers (hostname or ip)', () => {
        // Valid with hostname
        const valid1 = parseCsv('hostname,another\nhost1,val2', 'vicarius');
        expect(valid1.error).toBeUndefined();
        expect(valid1.data[0].hostname).toBe('host1');

        // Valid with ip (generates hostname)
        const valid2 = parseCsv('ip,another\n1.1.1.1,val2', 'vicarius');
        expect(valid2.error).toBeUndefined();
        expect(valid2.data[0].hostname).toBe('device-1-1-1-1');

        // Invalid (no hostname or ip)
        const invalid = parseCsv('random,column\nval1,val2', 'vicarius');
        expect(invalid.error).toContain('Nenhuma coluna de Hostname ou IP');
    });

    it('should accept and use uuid headers (uuid, id, device_id) if present', () => {
        const result1 = parseCsv('hostname,ip,id\nhost1,1.1.1.1,id1', 'vicarius');
        expect(result1.error).toBeUndefined();
        expect(result1.data[0].uuid).toBe('id1');

        const result2 = parseCsv('hostname,ip,device_id\nhost1,1.1.1.1,dev1', 'vicarius');
        expect(result2.error).toBeUndefined();
        expect(result2.data[0].uuid).toBe('dev1');
    });

    it('should parse data correctly and normalize quotes', () => {
        const csv = `hostname,ip,uuid,os
"host1",192.168.1.1,"uuid-1",Windows
host2,192.168.1.2,uuid-2,"Linux"`;

        const result = parseCsv(csv, 'vicarius');
        expect(result.data).toHaveLength(2);
        expect(result.data[0].hostname).toBe('host1');
        expect(result.data[1].os).toBe('Linux');
    });

    it('should ignore extra columns', () => {
        const csv = `hostname,ip,uuid,extra
host1,1.1.1.1,id1,value`;
        const result = parseCsv(csv, 'vicarius');
        expect(result.error).toBeUndefined();
        expect(result.data[0].hostname).toBe('host1');
        expect((result.data[0] as any).extra).toBeUndefined();
    });

    it('should assign source correctly', () => {
        const result = parseCsv('hostname,ip,uuid\nh1,i1,u1', 'cortex');
        expect(result.data[0].source).toBe('cortex');
    });
});
