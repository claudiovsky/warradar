import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length > 0) return getApp();

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }

  // Fallback for local dev: use project ID
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

let _adminApp: ReturnType<typeof getAdminApp> | undefined;
let _adminDb: ReturnType<typeof getFirestore> | undefined;

function getAdminAppInstance() {
  if (!_adminApp) {
    const isNew = getApps().length === 0;
    _adminApp = getAdminApp();
    _adminDb = getFirestore(_adminApp);
    if (isNew) {
      _adminDb.settings({ ignoreUndefinedProperties: true });
    }
  }
  return _adminApp;
}

function getAdminDb() {
  if (!_adminDb) {
    getAdminAppInstance();
  }
  return _adminDb!;
}

// Lazy getters — not initialized at import time
export const adminApp = new Proxy({} as ReturnType<typeof getAdminApp>, {
  get(_, prop) {
    return (getAdminAppInstance() as unknown as Record<string, unknown>)[prop as string];
  },
});

export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_, prop) {
    const db = getAdminDb();
    const value = (db as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") return value.bind(db);
    return value;
  },
});
