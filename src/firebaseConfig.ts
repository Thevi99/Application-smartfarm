// import firebase from '@react-native-firebase/app';
// import '@react-native-firebase/database';

// const firebaseConfig = {
//   apiKey: "AIzaSyAxsUWKyhHLWKeg--R3M2NmbFKUg5NX_5k",
//   authDomain: "smartfarm-258eb.firebaseapp.com",
//   databaseURL: "https://smartfarm-258eb-default-rtdb.asia-southeast1.firebasedatabase.app",
//   projectId: "smartfarm-258eb",
//   storageBucket: "smartfarm-258eb.appspot.com",
//   messagingSenderId: "491885291358",
//   appId: "1:491885291358:android:9a876ca62627a5e35911cf"
// };

// // ตรวจสอบว่า Firebase ถูก initialize หรือยัง
// if (!firebase.apps.length) {
//   firebase.initializeApp(firebaseConfig);
// }

// const database = firebase.database();

// export { database };


// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAxsUWKyhHLWKeg--R3M2NmbFKUg5NX_5k",
  authDomain: "smartfarm-258eb.firebaseapp.com",
  databaseURL: "https://smartfarm-258eb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartfarm-258eb",
  storageBucket: "smartfarm-258eb.appspot.com",
  messagingSenderId: "491885291358",
  appId: "1:491885291358:android:9a876ca62627a5e35911cf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };