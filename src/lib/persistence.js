// Autosave / session-recovery storage. Uses IndexedDB (via idb) rather than
// localStorage because the original PDF's arrayBuffer can be tens of MB —
// well past localStorage's ~5-10MB string-only quota, and IndexedDB stores
// binary data natively with no base64 inflation.
import { openDB } from 'idb';

const DB_NAME = 'pdfeditor';
const STORE = 'session';
const KEY = 'current';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

let dbPromise;
function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE);
      },
    });
  }
  return dbPromise;
}

/** @param {{fileName:string, arrayBuffer:ArrayBuffer, overlays:any[], fieldValues:object}} record */
export async function saveSession(record) {
  const db = await getDb();
  await db.put(STORE, { ...record, savedAt: Date.now() }, KEY);
}

export async function loadSession() {
  const db = await getDb();
  const record = await db.get(STORE, KEY);
  if (!record) return null;
  if (Date.now() - record.savedAt > MAX_AGE_MS) {
    await clearSession();
    return null;
  }
  return record;
}

export async function clearSession() {
  const db = await getDb();
  await db.delete(STORE, KEY);
}
