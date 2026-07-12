import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBgdey5bi_TFPwxzG3eM0xkwdHAvBMWyAM",
  authDomain: "edumind-1276b.firebaseapp.com",
  projectId: "edumind-1276b",
  storageBucket: "edumind-1276b.firebasestorage.app",
  messagingSenderId: "607523299064",
  appId: "1:607523299064:web:094c9422dc86e365e5a50d"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
