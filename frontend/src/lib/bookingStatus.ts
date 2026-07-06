export function normalizeBookingStatus(status?: string | null): string {
  const raw = (status ?? "pending").trim();
  const v = raw.replace(/_/g, "-").toLowerCase();
  if (v === "checkedin" || v === "checked-in" || v === "settled") return "checked-in";
  return v;
}
