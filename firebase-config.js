import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDyaszv21lwLUvkS8jz2OFsnLzska4ybCo",
  authDomain: "doroi-75de8.firebaseapp.com",
  databaseURL: "https://doroi-75de8-default-rtdb.firebaseio.com",
  projectId: "doroi-75de8",
  storageBucket: "doroi-75de8.firebasestorage.app",
  messagingSenderId: "957949324821",
  appId: "1:957949324821:web:3d08c7fc6a364546ef681c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut
};