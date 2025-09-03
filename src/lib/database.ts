/**
 * @fileOverview This file defines the storage provider interface and provides an in-memory implementation.
 * To use a different storage solution (e.g., MongoDB), create a new class that implements
 * the `StorageProvider` interface and export an instance of it as the `storageProvider`.
 */
import {nanoid} from 'nanoid';

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

/**
 * Defines the contract for a storage provider.
 * Implement this interface to connect a different database like MongoDB.
 */
export interface StorageProvider {
  /**
   * Stores content and returns a unique ID.
   * @param item The content to store.
   * @returns A promise that resolves to the unique ID for the stored content.
   */
  setContent(item: SharedContent): Promise<string>;

  /**
   * Retrieves content by its ID.
   * @param id The ID of the content to retrieve.
   * @returns A promise that resolves to the content, or null if not found or expired.
   */
  getContent(id: string): Promise<SharedContent | null>;
}

// --- In-Memory Storage Implementation (Default) ---
// Replace this with your preferred database implementation.

class InMemoryStorage implements StorageProvider {
  private storage = new Map<string, StoredItem>();

  constructor() {
    // Periodically clean up expired items.
    setInterval(() => {
      const now = Date.now();
      for (const [id, item] of this.storage.entries()) {
        if (now > item.expiresAt) {
          this.storage.delete(id);
        }
      }
    }, 60 * 60 * 1000); // every hour
  }

  async setContent(item: SharedContent): Promise<string> {
    const id = nanoid(8);
    const expiresAt = Date.now() + EXPIRY_DURATION;
    this.storage.set(id, {...item, expiresAt});
    return id;
  }

  async getContent(id: string): Promise<SharedContent | null> {
    const item = this.storage.get(id);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.storage.delete(id);
      return null;
    }

    return {
      type: item.type,
      content: item.content,
      filename: item.filename,
      mimetype: item.mimetype,
    };
  }
}

/**
 * The single instance of the storage provider used throughout the application.
 *
 * TO CONNECT MONGODB:
 * 1. Create a `MongoDbStorage` class that implements `StorageProvider`.
 * 2. Implement the `setContent` and `getContent` methods using the MongoDB driver.
 * 3. Replace the line below to export an instance of your new class:
 *    export const storageProvider = new MongoDbStorage();
 */
export const storageProvider: StorageProvider = new InMemoryStorage();
