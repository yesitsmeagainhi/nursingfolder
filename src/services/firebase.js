// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBmweuh4qTbQeHWsUQmv4K-jIO4umNzy0I",
  authDomain: "nursing-387c8.firebaseapp.com",
  projectId: "nursing-387c8",
  storageBucket: "nursing-387c8.firebasestorage.app",
  messagingSenderId: "944166342545",
  appId: "1:944166342545:web:5866d0c1d3c6781e499430",
  measurementId: "G-VPV6FT07EC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);