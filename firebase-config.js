const firebaseConfig = {
  apiKey: "AIzaSyCyrQUpOlHrY3t7GtxFXD5zCweKtYYX5wI",
  databaseURL: "https://darbarhigh-4c642-default-rtdb.firebaseio.com",
  projectId: "darbarhigh-4c642",
  storageBucket: "darbarhigh-4c642.firebasestorage.app",
  messagingSenderId: "451147040929",
  appId: "1:451147040929:android:b9e5260cf6aef19b05c8e0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

const CLOUDINARY = {
  cloudName: "",
  uploadPreset: ""
};

const SUBJECTS = ["Economic", "Account", "Computer Science", "English", "Nepali"];

const IS_AUTH_PAGE = /(^|\/)auth(\.html)?$/.test(location.pathname);

if (!IS_AUTH_PAGE) {
  document.documentElement.style.visibility = "hidden";
  auth.onAuthStateChanged(function (user) {
    if (user) {
      document.documentElement.style.visibility = "";
      return;
    }
    const here = location.pathname + location.search + location.hash;
    location.replace("/auth.html?next=" + encodeURIComponent(here));
  });
}

function logout() {
  return auth.signOut().then(function () {
    location.replace("/auth.html");
  });
}

function sanitizeKey(rawKey) {
  return rawKey
    .replaceAll(".", "_")
    .replaceAll("#", "_")
    .replaceAll("$", "_")
    .replaceAll("[", "_")
    .replaceAll("]", "_");
}

function unitsRef(subjectKey) {
  return db.ref("units").child(sanitizeKey(subjectKey));
}

function notesRef(subjectKey, unitId) {
  return db.ref("units").child(sanitizeKey(subjectKey)).child(unitId).child("notes");
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}