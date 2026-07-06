export function toLocalDateOnly(value: string | Date): Date {
  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  }
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isCheckInDayReached(checkInDate: string | Date): boolean {
  const checkIn = toLocalDateOnly(checkInDate);
  const today = toLocalDateOnly(new Date());
  return checkIn.getTime() <= today.getTime();
}
