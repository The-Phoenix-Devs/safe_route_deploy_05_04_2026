/** Roles that may use the school admin web console */
export function isAdminPanelUser(userType: string | undefined | null): boolean {
  return userType === "admin" || userType === "guardian_admin";
}
