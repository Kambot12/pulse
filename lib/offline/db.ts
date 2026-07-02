import Dexie, { type Table } from "dexie";

/**
 * Local, offline-first store. Mirrors the small slice of data the student needs
 * when there's no network: their dashboard snapshot and passport, plus a queue
 * of mutations to replay when connectivity returns.
 */
export interface CachedItem<T = unknown> {
  id: string;
  data: T;
  updatedAt: number;
}

export interface SyncItem {
  id?: number;
  action: string;
  payload: unknown;
  createdAt: number;
}

class PulseDB extends Dexie {
  cache!: Table<CachedItem, string>;
  syncQueue!: Table<SyncItem, number>;

  constructor() {
    super("pulse");
    this.version(1).stores({
      cache: "id",
      syncQueue: "++id",
    });
  }
}

// Only construct in the browser (Dexie needs IndexedDB).
export const offlineDB: PulseDB | null =
  typeof window !== "undefined" ? new PulseDB() : null;

export async function saveCache<T>(id: string, data: T): Promise<void> {
  if (!offlineDB) return;
  await offlineDB.cache.put({ id, data, updatedAt: Date.now() });
}

export async function readCache<T>(id: string): Promise<CachedItem<T> | undefined> {
  if (!offlineDB) return undefined;
  return offlineDB.cache.get(id) as Promise<CachedItem<T> | undefined>;
}

export async function enqueueSync(action: string, payload: unknown): Promise<void> {
  if (!offlineDB) return;
  await offlineDB.syncQueue.add({ action, payload, createdAt: Date.now() });
}
