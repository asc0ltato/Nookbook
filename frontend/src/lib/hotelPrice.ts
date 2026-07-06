export function getHotelMinPrice(
  hotel: {
    price?: number;
    pricePerNight?: number;
    Price?: number;
  },
  rooms?: Array<{ price?: number; pricePerNight?: number; roomType?: string; type?: string; id?: number | string }>,
): number {
  const base = Number(hotel.price ?? hotel.pricePerNight ?? (hotel as { Price?: number }).Price ?? 0);

  if (!rooms?.length) {
    return Number.isFinite(base) && base > 0 ? base : 0;
  }

  const minByType = new Map<string, number>();
  rooms.forEach((room) => {
    const key = (room.roomType || room.type || `type-${room.id}`).trim();
    const price = Number(room.price ?? room.pricePerNight ?? 0);
    if (!Number.isFinite(price) || price <= 0) return;
    const prev = minByType.get(key);
    if (prev === undefined || price < prev) {
      minByType.set(key, price);
    }
  });

  if (!minByType.size) {
    return Number.isFinite(base) && base > 0 ? base : 0;
  }

  return Math.min(...Array.from(minByType.values()));
}
