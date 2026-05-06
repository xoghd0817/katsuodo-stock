import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBWnADwE4aefK_gTK-_jA_xuU1xLu07V1E",
  authDomain: "katsuodo-fb868.firebaseapp.com",
  projectId: "katsuodo-fb868",
  storageBucket: "katsuodo-fb868.firebasestorage.app",
  messagingSenderId: "914497775345",
  appId: "1:914497775345:web:3d3634a1c3de2145a82b50",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
