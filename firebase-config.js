// Firebase config copied from the Durbar Android app (google-services.json)
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

// Same subject list as Subjects.ALL in Subject.kt
const SUBJECTS = ["Economic", "Account", "Computer Science", "English", "Nepali"];

// Same key sanitizing as FirebaseUtils.sanitizeKey()
function sanitizeKey(rawKey) {
  return rawKey
    .replaceAll(".", "_")
    .replaceAll("#", "_")
    .replaceAll("$", "_")
    .replaceAll("[", "_")
    .replaceAll("]", "_");
}

// Same as FirebaseUtils.unitsRef(subjectKey)
function unitsRef(subjectKey) {
  return db.ref("units").child(sanitizeKey(subjectKey));
}

// Same as FirebaseUtils.unitsRef(subjectKey).child(unitId).child("notes")
function notesRef(subjectKey, unitId) {
  return db.ref("units").child(sanitizeKey(subjectKey)).child(unitId).child("notes");
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}