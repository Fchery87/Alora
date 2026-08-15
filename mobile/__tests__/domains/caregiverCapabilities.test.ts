import { capabilitiesForRole, type CaregiverRole } from "../../domains/caregiverCapabilities";

describe("caregiver capabilities", () => {
  test.each<[CaregiverRole, boolean, boolean, boolean, boolean, boolean, boolean, boolean]>([
    ["owner", true, true, true, true, true, true, true],
    ["partner", true, true, true, true, false, true, true],
    ["limited", true, true, false, false, false, false, false],
  ])(
    "%s maps every trust capability",
    (role, canLogCare, canEditCare, canViewCheckIn, canWriteCheckIn, canInvite, canManageSeats, canViewAudit) => {
      expect(capabilitiesForRole(role)).toMatchObject({
        canLogCare,
        canEditCare,
        canViewCheckIn,
        canWriteCheckIn,
        canInvite,
        canManageSeats,
        canViewAudit,
      });
    },
  );
});
