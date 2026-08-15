import { useFamilyMembers } from "../data/useData";
import { capabilitiesForRole, NO_CAREGIVER_CAPABILITIES } from "./caregiverCapabilities";

export function useCaregiverCapabilities() {
  const members = useFamilyMembers();
  const role = members.status === "ready" ? members.data.find((member) => member.isSelf)?.role : undefined;
  return {
    members,
    role,
    capabilities: role ? capabilitiesForRole(role) : NO_CAREGIVER_CAPABILITIES,
  };
}
