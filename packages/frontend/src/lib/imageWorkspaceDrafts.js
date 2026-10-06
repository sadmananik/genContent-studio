const DATABASE_NAME = "gencontent-image-workspace";
const STORE_NAME = "drafts";
const DATABASE_VERSION = 1;

function openDraftDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is unavailable in this browser."));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "projectId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open image drafts."));
    request.onblocked = () => reject(new Error("Image draft storage is blocked."));
  });
}

async function readDraft(draftId) {
  const database = await openDraftDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(String(draftId));
    request.onsuccess = () => resolve(request.result?.payload || null);
    request.onerror = () => reject(request.error || new Error("Could not read image draft."));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
  });
}

async function writeDraft(draftId, payload) {
  const database = await openDraftDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({
      projectId: String(draftId),
      payload,
      updatedAt: Date.now()
    });
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      const error = transaction.error || new Error("Could not save image draft.");
      database.close();
      reject(error);
    };
    transaction.onabort = () => {
      const error = transaction.error || new Error("Could not save image draft.");
      database.close();
      reject(error);
    };
  });
}

export async function saveWorkspaceDraft(draftId, payload, legacyKey) {
  try {
    await writeDraft(draftId, payload);
  } catch (indexedDbError) {
    if (!legacyKey) {
      throw indexedDbError;
    }

    try {
      window.localStorage.setItem(legacyKey, payload);
    } catch {
      throw indexedDbError;
    }
  }
}

export async function loadWorkspaceDraft(draftId, legacyKey) {
  try {
    const savedDraft = await readDraft(draftId);
    if (savedDraft) {
      return savedDraft;
    }
  } catch {
    // Fall back to drafts saved by older versions or browsers without IndexedDB.
  }

  if (!legacyKey) {
    return null;
  }

  let legacyDraft;
  try {
    legacyDraft = window.localStorage.getItem(legacyKey);
  } catch {
    return null;
  }

  if (!legacyDraft) {
    return null;
  }

  try {
    await writeDraft(draftId, legacyDraft);
    window.localStorage.removeItem(legacyKey);
  } catch {
    // Keep the existing local draft available when migration cannot complete.
  }

  return legacyDraft;
}

export function saveImageWorkspaceDraft(projectId, payload) {
  return saveWorkspaceDraft(projectId, payload, getLegacyDraftKey(projectId));
}

export function loadImageWorkspaceDraft(projectId) {
  return loadWorkspaceDraft(projectId, getLegacyDraftKey(projectId));
}

function getLegacyDraftKey(projectId) {
  return `gencontent-image-workspace-v2-${projectId}`;
}
