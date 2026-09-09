export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const STORAGE_TARGETS = {
  "department-images": "departments",
  "event-images": "events",
} as const;

export type StorageBucket = keyof typeof STORAGE_TARGETS;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateStorageTarget(bucket: string, prefix: string): string | null {
  if (!(bucket in STORAGE_TARGETS)) {
    return "Storage target is not allowed.";
  }

  const allowedPrefix = STORAGE_TARGETS[bucket as StorageBucket];
  if (prefix !== allowedPrefix) {
    return "Storage path is not allowed.";
  }

  return null;
}

export function validateImageFile(file: Pick<File, "size" | "type">): string | null {
  if (!IMAGE_EXTENSIONS[file.type]) {
    return "Only JPEG, PNG, and WebP images are allowed.";
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Image must be between 1 byte and 5 MB.";
  }

  return null;
}

export function getImageExtension(contentType: string): string {
  return IMAGE_EXTENSIONS[contentType];
}

export function validateStoragePath(bucket: string, filePath: string): string | null {
  if (!(bucket in STORAGE_TARGETS)) {
    return "Storage target is not allowed.";
  }

  const prefix = STORAGE_TARGETS[bucket as StorageBucket];
  const expectedPrefix = `${prefix}/`;
  const fileName = filePath.slice(expectedPrefix.length);

  if (
    !filePath.startsWith(expectedPrefix) ||
    !fileName ||
    fileName.includes("/") ||
    fileName.includes("\\") ||
    fileName === "." ||
    fileName === ".."
  ) {
    return "Storage path is not allowed.";
  }

  return null;
}
