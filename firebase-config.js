import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getDatabase, ref, get, set, update, onValue 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDejlLtvFPTFOJoXMFGjpuhImn6oYFCAxM",
  authDomain: "darshang-8f99d.firebaseapp.com",
  databaseURL: "https://darshang-8f99d-default-rtdb.firebaseio.com",
  projectId: "darshang-8f99d",
  storageBucket: "darshang-8f99d.firebasestorage.app",
  messagingSenderId: "199221437404",
  appId: "1:199221437404:web:e9c42331f2879378f6e519"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Path to the profile node: /profiles/darshang404
const PROFILE_PATH = "profiles/darshang404";
const PROFILE_REF = ref(db, PROFILE_PATH);

export { db, PROFILE_REF, ref, get, set, update, onValue };