import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  push,
  query,
  limitToLast,
  onValue,
  onChildAdded,
  onChildRemoved,
  onDisconnect,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDejlLtvFPTFOJoXMFGjpuhImn6oYFCAxM",
  authDomain: "darshang-8f99d.firebaseapp.com",
  databaseURL: "https://darshang-8f99d-default-rtdb.firebaseio.com",
  projectId: "darshang-8f99d",
  storageBucket: "darshang-8f99d.firebasestorage.app",
  messagingSenderId: "199221437404",
  appId: "1:199221437404:web:e9c42331f2879378f6e519"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export {
  ref,
  get,
  set,
  update,
  remove,
  push,
  query,
  limitToLast,
  onValue,
  onChildAdded,
  onChildRemoved,
  onDisconnect,
  serverTimestamp,
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
  signOut
};