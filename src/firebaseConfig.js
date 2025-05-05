import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAN1vuwOkr0BkxTR7CguB0KylunxEnX2p0",
    authDomain: "hangman-bf456.firebaseapp.com",
    projectId: "hangman-bf456",
    storageBucket: "hangman-bf456.firebasestorage.app",
    messagingSenderId: "461514459529",
    appId: "1:461514459529:web:cfe7efbc985789b149f958",
    measurementId: "G-622QM9C1L8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
