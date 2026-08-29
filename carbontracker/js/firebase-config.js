// firebase-config.js — initializes Firebase for the Carbon Footprint Tracker project

const firebaseConfig = {
  apiKey: "AIzaSyDU2kEiivIJ-yisZm6k621j5jKdp6MvWgw",
  authDomain: "carbon-tracker-a3887.firebaseapp.com",
  projectId: "carbon-tracker-a3887",
  storageBucket: "carbon-tracker-a3887.firebasestorage.app",
  messagingSenderId: "327850110344",
  appId: "1:327850110344:web:f6fbeec906aaf8db3a5e3d",
  measurementId: "G-D94LJJEZJL"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();