import { JumpCloudUser, WarpUser, UserComparison, TerminatedEmployee, UserComplianceStatus } from '@/types/inventory';

/**
 * Compares users from JumpCloud and Warp to identify compliance gaps
 */
export function compareUsers(
    jumpCloudUsers: JumpCloudUser[],
    warpUsers: WarpUser[],
    terminatedEmployees: TerminatedEmployee[]
): UserComparison[] {
    const userMap = new Map<string, UserComparison>();

    // Normalize terminated emails for quick lookup
    const terminatedEmails = new Set(
        terminatedEmployees.map(emp => emp.email.toLowerCase())
    );

    // Process JumpCloud users
    jumpCloudUsers.forEach(jcUser => {
        const email = jcUser.email.toLowerCase();
        const name = `${jcUser.firstname} ${jcUser.lastname}`.trim();
        const isTerminated = terminatedEmails.has(email);

        let jumpCloudStatus: 'active' | 'suspended' | 'terminated' = 'active';
        if (jcUser.state === 'SUSPENDED') {
            jumpCloudStatus = 'suspended';
        } else if (jcUser.state !== 'ACTIVATED') {
            jumpCloudStatus = 'terminated';
        }

        userMap.set(email, {
            email: jcUser.email,
            name,
            inJumpCloud: true,
            inWarp: false,
            jumpCloudStatus,
            warpDeviceCount: 0,
            isTerminated,
            complianceStatus: 'missing_warp' // Will be updated if found in Warp
        });
    });

    // Process Warp users
    warpUsers.forEach(warpUser => {
        const email = warpUser.email.toLowerCase();
        const existing = userMap.get(email);
        const isTerminated = terminatedEmails.has(email);

        if (existing) {
            // User exists in both systems
            existing.inWarp = true;
            existing.warpDeviceCount = warpUser.activeDeviceCount;

            // Update compliance status
            if (isTerminated) {
                existing.complianceStatus = 'terminated_active';
            } else {
                existing.complianceStatus = 'compliant';
            }
        } else {
            // User only in Warp
            userMap.set(email, {
                email: warpUser.email,
                name: warpUser.email.split('@')[0], // Use email prefix as name
                inJumpCloud: false,
                inWarp: true,
                warpDeviceCount: warpUser.activeDeviceCount,
                isTerminated,
                complianceStatus: isTerminated ? 'terminated_active' : 'missing_jumpcloud'
            });
        }
    });

    // Final pass: mark terminated users who are still active
    userMap.forEach((user, email) => {
        if (user.isTerminated && (user.inJumpCloud || user.inWarp)) {
            user.complianceStatus = 'terminated_active';
        }
    });

    return Array.from(userMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );
}

/**
 * Calculate user compliance statistics
 */
export function calculateUserStats(users: UserComparison[]) {
    const stats = {
        total: users.length,
        compliant: 0,
        missingWarp: 0,
        missingJumpCloud: 0,
        terminatedActive: 0
    };

    users.forEach(user => {
        switch (user.complianceStatus) {
            case 'compliant':
                stats.compliant++;
                break;
            case 'missing_warp':
                stats.missingWarp++;
                break;
            case 'missing_jumpcloud':
                stats.missingJumpCloud++;
                break;
            case 'terminated_active':
                stats.terminatedActive++;
                break;
        }
    });

    return stats;
}

/**
 * Export users to CSV format
 */
export function exportUsersToCSV(users: UserComparison[]): string {
    const headers = ['Nome', 'Email', 'JumpCloud', 'Warp', 'Status JumpCloud', 'Dispositivos Warp', 'Status Compliance'];
    const rows = users.map(user => [
        user.name,
        user.email,
        user.inJumpCloud ? 'Sim' : 'Não',
        user.inWarp ? 'Sim' : 'Não',
        user.jumpCloudStatus || 'N/A',
        user.warpDeviceCount?.toString() || '0',
        getComplianceLabel(user.complianceStatus)
    ]);

    return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
}

function getComplianceLabel(status: UserComplianceStatus): string {
    switch (status) {
        case 'compliant':
            return 'Compliant';
        case 'missing_warp':
            return 'Faltando Warp';
        case 'missing_jumpcloud':
            return 'Faltando JumpCloud';
        case 'terminated_active':
            return 'Desligado Ativo';
    }
}
