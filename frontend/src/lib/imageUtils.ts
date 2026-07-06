const HOTEL_PLACEHOLDER = "/assets/hotels/block.jpg";
const ROOM_PLACEHOLDER = "/assets/rooms/block.jpg";

export function isLocalAssetPath(imageUrl?: string | null): boolean {
  if (!imageUrl) return false;
  if (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) {
    return true;
  }
  if (imageUrl.startsWith("/assets/")) {
    return true;
  }
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    try {
      return new URL(imageUrl).pathname.startsWith("/assets/");
    } catch {
      return false;
    }
  }
  return false;
}

export function resolvePublicAssetUrl(imageUrl?: string | null): string {
  if (!imageUrl) return imageUrl ?? "";

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("blob:") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  if (typeof window !== "undefined" && imageUrl.startsWith("/")) {
    return `${window.location.origin}${imageUrl}`;
  }

  return imageUrl;
}

export function isPlaceholderHotelImage(imageUrl?: string | null): boolean {
  if (!imageUrl) return true;
  return imageUrl.includes("block.jpg");
}

export function isPlaceholderRoomImage(imageUrl?: string | null): boolean {
  if (!imageUrl) return true;
  return imageUrl.includes("block.jpg");
}

export function toRelativeAssetPath(imageUrl: string): string {
  if (!imageUrl || imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    try {
      return new URL(imageUrl).pathname;
    } catch {
      return imageUrl;
    }
  }
  return imageUrl;
}

export function getHotelGalleryImages(images?: string[] | null, imageUrl?: string | null): string[] {
  const source = images?.length ? images : imageUrl ? [imageUrl] : [];
  return source.filter((img) => img && !isPlaceholderHotelImage(img));
}

export function normalizeHotelImagesForApi(images?: string[] | null, imageUrl?: string | null): string[] {
  return getHotelGalleryImages(images, imageUrl).map(toRelativeAssetPath);
}

export function getHotelCarouselImages(images?: string[] | null, imageUrl?: string | null): string[] {
  const gallery = getHotelGalleryImages(images, imageUrl);
  return gallery.length > 0 ? gallery : [HOTEL_PLACEHOLDER];
}

export function getRoomGalleryImages(images?: string[] | null, imageUrl?: string | null): string[] {
  const source = images?.length ? images : imageUrl ? [imageUrl] : [];
  return source.filter((img) => img && !isPlaceholderRoomImage(img));
}

export function getRoomCarouselImages(images?: string[] | null, imageUrl?: string | null): string[] {
  const gallery = getRoomGalleryImages(images, imageUrl);
  return gallery.length > 0 ? gallery : [ROOM_PLACEHOLDER];
}

function normalizeUnderAssets(
  imageUrl: string,
  assetsPrefix: "/assets/hotels/" | "/assets/rooms/" | "/assets/cities/",
  legacyPrefix: string
): string {
  let path = imageUrl.trim();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      path = new URL(path).pathname;
    } catch {
      return imageUrl;
    }
  }

  if (path.startsWith(legacyPrefix)) {
    return path.replace(legacyPrefix, assetsPrefix);
  }
  if (path.startsWith(assetsPrefix)) {
    return path;
  }
  if (!path.startsWith("/")) {
    return `${assetsPrefix}${path}`;
  }
  return path;
}

export function normalizeHotelImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return resolvePublicAssetUrl(HOTEL_PLACEHOLDER);

  if (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const normalized = normalizeUnderAssets(imageUrl, "/assets/hotels/", "/hotels/");
  return resolvePublicAssetUrl(normalized);
}

export function normalizeRoomImageUrl(imageUrl?: string | null): string {
  if (!imageUrl || imageUrl.trim() === "") return resolvePublicAssetUrl(ROOM_PLACEHOLDER);

  if (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  if (isPlaceholderRoomImage(imageUrl)) {
    return resolvePublicAssetUrl(ROOM_PLACEHOLDER);
  }

  const normalized = normalizeUnderAssets(imageUrl, "/assets/rooms/", "/rooms/");
  return resolvePublicAssetUrl(normalized);
}

export function normalizeIconAssetUrl(imageUrl?: string | null): string {
  if (!imageUrl) return "";

  if (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const normalized = imageUrl.startsWith("/") ? imageUrl : `/assets/icons/${imageUrl}`;
  return resolvePublicAssetUrl(normalized);
}

export function normalizeCityImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return resolvePublicAssetUrl("/assets/cities/block.jpg");

  if (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const normalized = normalizeUnderAssets(imageUrl, "/assets/cities/", "/cities/");
  return resolvePublicAssetUrl(normalized);
}
