import { JumpCloudUser, WarpUser, HackerRangerUser, BaseRhUser, UserComparison, TerminatedEmployee, UserComplianceStatus } from '@/types/inventory';

/**
 * Compares users from multiple sources to identify compliance gaps.
 * Logic:
 * - BASE RH is the primary source of truth for active employees.
 * - BASE RH -> Hacker Rangers: Ensure training.
 * - BASE RH -> Jumpcloud: Ensure directory account.
 * - Jumpcloud -> BASE RH: Detect zombie accounts.
 */
export function compareUsers(
    jumpCloudUsers: JumpCloudUser[],
    warpUsers: WarpUser[],
    hackerRangerUsers: HackerRangerUser[],
    baseRhUsers: BaseRhUser[],
    terminatedEmployees: TerminatedEmployee[]
): UserComparison[] {
    const userMap = new Map<string, UserComparison>();

    const terminatedEmails = new Set(
        terminatedEmployees.map(emp => emp.email.toLowerCase())
    );

    // 1. Process BASE RH (Primary Source of Truth)
    baseRhUsers.forEach(rhUser => {
        const email = rhUser.email.toLowerCase();
        const isTerminated = terminatedEmails.has(email);

        userMap.set(email, {
            email: rhUser.email,
            name: rhUser.name,
            inBaseRh: true,
            inJumpCloud: false,
            inWarp: false,
            inHackerRanger: false,
            baseRhStatus: rhUser.status,
            isTerminated,
            complianceStatus: 'compliant' // Default, will be downgraded
        });
    });

    // 2. Process JumpCloud
    jumpCloudUsers.forEach(jcUser => {
        const email = jcUser.email.toLowerCase();
        const existing = userMap.get(email);
        const isTerminated = terminatedEmails.has(email);

        let jumpCloudStatus: 'active' | 'suspended' | 'terminated' = 'active';
        if (jcUser.state === 'SUSPENDED') jumpCloudStatus = 'suspended';
        else if (jcUser.state !== 'ACTIVATED') jumpCloudStatus = 'terminated';

        if (existing) {
            existing.inJumpCloud = true;
            existing.jumpCloudStatus = jumpCloudStatus;
        } else {
            userMap.set(email, {
                email: jcUser.email,
                name: `${jcUser.firstname} ${jcUser.lastname}`.trim() || jcUser.email.split('@')[0],
                inBaseRh: false,
                inJumpCloud: true,
                inWarp: false,
                inHackerRanger: false,
                jumpCloudStatus,
                isTerminated,
                complianceStatus: 'ghost_account'
            });
        }
    });

    // 3. Process Hacker Rangers
    hackerRangerUsers.forEach(hrUser => {
        const email = hrUser.email.toLowerCase();
        const existing = userMap.get(email);
        if (existing) {
            existing.inHackerRanger = true;
            existing.hackerRangerStatus = hrUser.status;
        } else {
            userMap.set(email, {
                email: hrUser.email,
                name: hrUser.name || hrUser.email.split('@')[0],
                inBaseRh: false,
                inJumpCloud: false,
                inWarp: false,
                inHackerRanger: true,
                hackerRangerStatus: hrUser.status,
                isTerminated: terminatedEmails.has(email),
                complianceStatus: 'ghost_account'
            });
        }
    });

    // 4. Process Warp
    warpUsers.forEach(warpUser => {
        const email = warpUser.email.toLowerCase();
        const existing = userMap.get(email);
        if (existing) {
            existing.inWarp = true;
            existing.warpDeviceCount = warpUser.activeDeviceCount;
        } else {
            userMap.set(email, {
                email: warpUser.email,
                name: warpUser.email.split('@')[0],
                inBaseRh: false,
                inJumpCloud: false,
                inWarp: true,
                inHackerRanger: false,
                warpDeviceCount: warpUser.activeDeviceCount,
                isTerminated: terminatedEmails.has(email),
                complianceStatus: 'ghost_account'
            });
        }
    });

    // 5. Calculate Final Compliance Status
    userMap.forEach((user) => {
        if (user.isTerminated && (user.inJumpCloud || user.inWarp || user.inHackerRanger)) {
            user.complianceStatus = 'terminated_active';
            return;
        }

        if (user.inBaseRh) {
            if (!user.inJumpCloud) {
                user.complianceStatus = 'missing_jumpcloud';
            } else if (!user.inHackerRanger) {
                user.complianceStatus = 'missing_hacker_ranger';
            } else if (!user.inWarp) {
                user.complianceStatus = 'missing_warp';
            } else {
                user.complianceStatus = 'compliant';
            }
        } else {
            // Not in RH but in other systems
            user.complianceStatus = 'ghost_account';
        }
    });

    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
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
        missingHackerRanger: 0,
        terminatedActive: 0,
        ghostAccounts: 0
    };

    users.forEach(user => {
        switch (user.complianceStatus) {
            case 'compliant': stats.compliant++; break;
            case 'missing_warp': stats.missingWarp++; break;
            case 'missing_jumpcloud': stats.missingJumpCloud++; break;
            case 'missing_hacker_ranger': stats.missingHackerRanger++; break;
            case 'terminated_active': stats.terminatedActive++; break;
            case 'ghost_account': stats.ghostAccounts++; break;
        }
    });

    return stats;
}

/**
 * Export users to CSV format
 */
export function exportUsersToCSV(users: UserComparison[]): string {
    const headers = ['Nome', 'Email', 'BASE RH', 'JumpCloud', 'Warp', 'Hacker Rangers', 'Status Compliance'];
    const rows = users.map(user => [
        user.name,
        user.email,
        user.inBaseRh ? 'Sim' : 'Não',
        user.inJumpCloud ? 'Sim' : 'Não',
        user.inWarp ? 'Sim' : 'Não',
        user.inHackerRanger ? 'Sim' : 'Não',
        getComplianceLabel(user.complianceStatus)
    ]);

    return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
}

function getComplianceLabel(status: UserComplianceStatus): string {
    switch (status) {
        case 'compliant': return 'Compliant';
        case 'missing_warp': return 'Faltando Warp';
        case 'missing_jumpcloud': return 'Faltando JumpCloud';
        case 'missing_hacker_ranger': return 'Faltando treinamento (Hacker Rangers)';
        case 'missing_base_rh': return 'Ausente no BASE RH';
        case 'terminated_active': return 'Desligado Ativo';
        case 'ghost_account': return 'Conta Zumbi (Fora do RH)';
        default: return status;
    }
}
