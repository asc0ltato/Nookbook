export function isBookableUser(user: {
  role?: string;
  Role?: string;
  isManager?: boolean;
  IsManager?: boolean;
}): boolean {
  const role = String(user.role ?? user.Role ?? "").toLowerCase();
  if (role !== "user") return false;
  if (user.isManager === true || user.IsManager === true) return false;
  return true;
}
