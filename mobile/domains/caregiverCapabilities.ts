export type CaregiverRole = "owner" | "partner" | "limited";

export type CaregiverCapabilities = {
  canLogCare: boolean;
  canEditCare: boolean;
  canViewCheckIn: boolean;
  canWriteCheckIn: boolean;
  canViewAudit: boolean;
  canInvite: boolean;
  canManageSeats: boolean;
  canExport: boolean;
  canDeleteAccount: boolean;
};

export const NO_CAREGIVER_CAPABILITIES: CaregiverCapabilities = {
  canLogCare: false,
  canEditCare: false,
  canViewCheckIn: false,
  canWriteCheckIn: false,
  canViewAudit: false,
  canInvite: false,
  canManageSeats: false,
  canExport: false,
  canDeleteAccount: false,
};

const OWNER_CAPABILITIES: CaregiverCapabilities = {
  canLogCare: true,
  canEditCare: true,
  canViewCheckIn: true,
  canWriteCheckIn: true,
  canViewAudit: true,
  canInvite: true,
  canManageSeats: true,
  canExport: true,
  canDeleteAccount: true,
};

const PARTNER_CAPABILITIES: CaregiverCapabilities = {
  canLogCare: true,
  canEditCare: true,
  canViewCheckIn: true,
  canWriteCheckIn: true,
  canViewAudit: true,
  canInvite: false,
  canManageSeats: true,
  canExport: true,
  canDeleteAccount: true,
};

const LIMITED_CAPABILITIES: CaregiverCapabilities = {
  canLogCare: true,
  canEditCare: true,
  canViewCheckIn: false,
  canWriteCheckIn: false,
  canViewAudit: false,
  canInvite: false,
  canManageSeats: false,
  canExport: true,
  canDeleteAccount: true,
};

export function capabilitiesForRole(role: CaregiverRole): CaregiverCapabilities {
  if (role === "owner") return OWNER_CAPABILITIES;
  if (role === "limited") return LIMITED_CAPABILITIES;
  return PARTNER_CAPABILITIES;
}
