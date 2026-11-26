export function isRetiredDutyOfficerRole(role: string) {
  return role === 'DUTY_OFFICER' || role === 'SPECIAL_UNIT_DUTY_OFFICER';
}

export const INVESTIGATING_OFFICER_LABEL = 'Investigating Officer (IO)';

export function isMhcOrMmRole(role?: string) {
  return role === 'MHC_GD_INCHARGE' || role === 'MM';
}
