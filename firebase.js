const firebaseConfig = {
  apiKey: "AIzaSyBv7MKmb2aevcaFOajr02DmBF7JNxNxIDw",
  authDomain: "dozo-3ad6f.firebaseapp.com",
  databaseURL: "https://dozo-3ad6f-default-rtdb.firebaseio.com",
  projectId: "dozo-3ad6f",
  storageBucket: "dozo-3ad6f.firebasestorage.app",
  messagingSenderId: "843093561816",
  appId: "1:843093561816:web:6ab6a609c0c393a50b62ad"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();