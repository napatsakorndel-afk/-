import { initializeApp } from "firebase/app";
import { initializeFirestore, setLogLevel } from "firebase/firestore";

// Suppress benign stream cancellation noise
setLogLevel("error");

const firebaseConfig = {
  apiKey: "AIzaSyBWtJ0COzNmGKWmbGotCDvVbgLiCJnFRnI",
  authDomain: "natural-operand-mfs6l.firebaseapp.com",
  projectId: "natural-operand-mfs6l",
  storageBucket: "natural-operand-mfs6l.firebasestorage.app",
  messagingSenderId: "605399316499",
  appId: "1:605399316499:web:ea5d227ea922070bcc67e6"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalAutoDetectLongPolling: true
}, "ai-studio-lsedrunning2569-a9736ca5-e9f6-446e-8815-2ce4dfe58c8a");
