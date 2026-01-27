
import { describe, it, expect } from 'vitest';
import { parseCsv } from './csv';

describe('CSV Parser', () => {
    it('should return error for empty content', () => {
        const result = parseCsv('', 'vicarius');
        expect(result.error).toBe('Arquivo CSV vazio ou sem cabeçalho.');
        expect(result.data).toHaveLength(0);
    });

    it('should return error for missing header', () => {
        const result = parseCsv('hostname,another\nval1,val2', 'vicarius');
        expect(result.error).toContain('Formato inválido');
    });

    it('should validate required headers (hostname, ip, uuid)', () => {
        // Valid
        const valid = parseCsv('hostname,ip,uuid\nhost1,1.1.1.1,id1', 'vicarius');
        expect(valid.error).toBeUndefined();

        // Invalid
        const invalid = parseCsv('hostname,ip\nval1,val2', 'vicarius');
        expect(invalid.error).toContain('uuid');
    });

    it('should accept alternative uuid headers (id, device_id)', () => {
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
