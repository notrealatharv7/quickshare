export type ContentType = 'text' | 'file';

export interface SharedContent {
  type: ContentType;
  content: string; // Text content or base64 encoded file
  filename?: string;
  mimetype?: string;
}

interface StoredItem extends SharedContent {
  expiresAt: number;
}

const EXPIRY_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const storage = new Map<string, StoredItem>();

export function setContent(id: string, item: SharedContent): void {
  const expiresAt = Date.now() + EXPIRY_DURATION;
  storage.set(id, { ...item, expiresAt });
}

export function getContent(id: string): SharedContent | null {
  const item = storage.get(id);

  if (!item) {
    return null;
  }

  if (Date.now() > item.expiresAt) {
    storage.delete(id);
    return null;
  }

  return {
    type: item.type,
    content: item.content,
    filename: item.filename,
    mimetype: item.mimetype,
  };
}

// Optional: clean up expired items periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, item] of storage.entries()) {
    if (now > item.expiresAt) {
      storage.delete(id);
    }
  }
}, 60 * 60 * 1000); // every hour
