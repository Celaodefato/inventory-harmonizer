
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as inventory from './inventory';
import * as storage from './storage';

// Mock storage module
vi.mock('./storage', () => ({
    getApiConfig: vi.fn(),
    isApiConfigured: vi.fn(),
    getCsvData: vi.fn(),
    getTerminatedEmployees: vi.fn(() => []), // mocked
}));

describe('Inventory Source Priority', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should use Mock data when API is NOT configured and NO CSV data', async () => {
        vi.mocked(storage.isApiConfigured).mockReturnValue(false);
        vi.mocked(storage.getCsvData).mockReturnValue({ vicarius: null } as any);

        const result = await inventory.fetchVicariusEndpoints();
        // Mocks usually have "v1" etc in mockData.ts
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].id).toBe('v1');
    });

    it('should use CSV data when API is NOT configured but CSV EXISTS', async () => {
        vi.mocked(storage.isApiConfigured).mockReturnValue(false);
        const csvItem = { id: 'csv-1', hostname: 'host-csv', ip: '1.2.3.4', uuid: 'u1', source: 'vicarius', origin: 'csv' };
        vi.mocked(storage.getCsvData).mockReturnValue({ vicarius: [csvItem] } as any);

        const result = await inventory.fetchVicariusEndpoints();
        expect(result).toHaveLength(1);
        expect(result[0].hostname).toBe('host-csv');
    });

    it('should ignore CSV data when API IS configured', async () => {
        // Setup API Configured
        vi.mocked(storage.isApiConfigured).mockReturnValue(true);
        vi.mocked(storage.getApiConfig).mockReturnValue({
            vicarius: { baseUrl: 'http://test.com', apiKey: 'key' }
        } as any);

        // Setup CSV Data that should be IGNORED
        const csvItem = { id: 'csv-ignored', hostname: 'ignored', ip: '0.0.0.0', uuid: 'u0', source: 'vicarius' };
        vi.mocked(storage.getCsvData).mockReturnValue({ vicarius: [csvItem] } as any);

        // Mock global fetch
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ([
                { id: 'api-1', hostname: 'host-api', ip: '10.0.0.1', uuid: 'uuid-api', lastSeen: 'now', os: 'linux' }
            ])
        });

        const result = await inventory.fetchVicariusEndpoints();

        // Should return API data
        expect(result).toHaveLength(1);
        expect(result[0].hostname).toBe('host-api');
        // Verify fetch was called
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('http://test.com'), expect.any(Object));
    });
});
