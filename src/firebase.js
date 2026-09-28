import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

export const app = initializeApp(firebaseConfigured ? config : { apiKey: "missing", projectId: "missing", appId: "missing" });
export const auth = getAuth(app);
export const db = getFirestore(app);

/* npm run dev:emulator -> talk to the local Firebase emulators instead of the real project */
export const USE_EMULATORS = String(import.meta.env.VITE_USE_EMULATORS).toLowerCase() === "true";
if (USE_EMULATORS) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8085);
}

export const ADMIN_EMAIL_DOMAIN = import.meta.env.VITE_ADMIN_EMAIL_DOMAIN || "lcc-bsit.app";
export const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE).toLowerCase() === "true";
