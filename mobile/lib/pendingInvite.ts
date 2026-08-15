let pendingInviteCode: string | null = null;

export function setPendingInviteCode(code: string): void {
  pendingInviteCode = code.trim().toUpperCase();
}

export function getPendingInviteCode(): string | null {
  return pendingInviteCode;
}

export function clearPendingInviteCode(): void {
  pendingInviteCode = null;
}
