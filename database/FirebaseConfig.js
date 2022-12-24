const { initializeApp } = require("firebase/app");
const { getDatabase } = require("firebase/database");

const firebaseConfig = {
  apiKey: "AIzaSyDBOjUWeivTYZxcdG_w2iGEJIewpNflqyU",
  authDomain: "aier-d5661.firebaseapp.com",
  databaseURL: "https://aier-d5661-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aier-d5661",
  storageBucket: "aier-d5661.appspot.com",
  messagingSenderId: "601256107623",
  appId: "1:601256107623:web:31a4f5b580592fdeb7bec2",
  measurementId: "G-6FP2S30CQB"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

module.exports = db;
