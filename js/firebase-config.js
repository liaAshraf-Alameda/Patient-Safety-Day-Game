/**
 * Firebase configuration and initialization, shared by the game (index.html)
 * and the live host/leaderboard screen (host.html).
 *
 * Uses the Firebase compat SDK so it can be used from plain (non-module)
 * scripts like game.js and host.js.
 */
const firebaseConfig = {
  apiKey: "AIzaSyC7p20fN2SIBxw2BbeKWXtd022T7USA18E",
  authDomain: "patient-safety-day-game.firebaseapp.com",
  databaseURL: "https://patient-safety-day-game-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "patient-safety-day-game",
  storageBucket: "patient-safety-day-game.firebasestorage.app",
  messagingSenderId: "13527538896",
  appId: "1:13527538896:web:cadea90d3f515e48a552d5",
  measurementId: "G-B0GLTWSM21"
};

let firebaseDb = null;
try {
  firebase.initializeApp(firebaseConfig);
  firebaseDb = firebase.database();
} catch (err) {
  console.warn("Firebase initialization failed. Live scores will be disabled.", err);
}
