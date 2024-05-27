// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAQM2z09riw2Dq2yPk9OjHXPm3zBfWKOzw",
  authDomain: "local-transport-slo.firebaseapp.com",
  projectId: "local-transport-slo",
  storageBucket: "local-transport-slo.appspot.com",
  messagingSenderId: "544984188847",
  appId: "1:544984188847:web:51b6dd3d644ee33a31915a",
  measurementId: "G-QQCCC5MMY1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { auth, app, analytics, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup };
