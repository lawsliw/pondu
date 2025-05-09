import React, { useState, useEffect } from 'react';
import './Hangman.css';
import { collection, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { FacebookAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import winSound from './sounds/win.mp3';
import loseSound from './sounds/lose.mp3';
import clickSound from './sounds/click.mp3';

const Hangman = () => {
  const winAudio = new Audio(winSound);
  const loseAudio = new Audio(loseSound);
  const clickAudio = new Audio(clickSound);
  const [score, setScore] = useState(0);
  const [user, setUser] = useState(null); // utilisateur connecté
  const [wordToGuess, setWordToGuess] = useState('');
  const [wordDefinition, setWordDefinition] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const maxAttempts = 6;

  // Charger un mot aléatoire avec sa définition depuis Firebase
  const fetchRandomWord = async () => {
    try {
      const wordsCollection = collection(db, 'dictionary');
      const wordsSnapshot = await getDocs(wordsCollection); // 🔧 correction ici : getDocs au lieu de getDoc  
      const wordsList = wordsSnapshot.docs.map(doc => doc.data());

      if (wordsList.length > 0) {
        const randomIndex = Math.floor(Math.random() * wordsList.length);
        const randomWord = wordsList[randomIndex];
        setWordToGuess(randomWord.word.toLowerCase());
        setWordDefinition(randomWord.definition);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du mot :', error);
    }
  };

  // 🔑 Connexion et enregistrement utilisateur

  useEffect(() => {
    // Charger un mot au hasard
    fetchRandomWord();
  
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        const provider = new FacebookAuthProvider();
        try {
          const result = await signInWithPopup(auth, provider);
          const loggedInUser = result.user;
          setUser(loggedInUser);
  
          const userRef = doc(db, 'users', loggedInUser.uid);
          const userSnap = await getDocs(userRef);
  
          if (!userSnap.exists()) {
            await setDoc(userRef,{
                score: 0,
                user: loggedInUser.displayName || 'Anonyme',
            });
            setScore(0);
          }else{
            setScore(userSnap.data().score || 0);
          }
        } catch (error) {
          console.error('Erreur de connexion Facebook:', error);
        }
      } else {
        setUser(currentUser);
  
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
  
        // 🔧 À MODIFIER ICI AUSSI (si jamais l’utilisateur est reconnu mais pas encore dans Firestore)
        if (!userSnap.exists()) {
            await setDoc(userRef, {
              score: 0,
              user: currentUser.displayName || 'Anonyme',
            });
            setScore(0);
          } else {
            setScore(userSnap.data().score || 0);
          }
        }
      });
  
    return () => unsubscribe();
  }, []);
  
  // ✅ Vérification de lettres
  const checkLetter = (letter) => {
    clickAudio.play();
    if (gameOver || guessedLetters.includes(letter)) return;

    setGuessedLetters([...guessedLetters, letter]);

    if (!wordToGuess.includes(letter)) {
      setAttempts(prev => prev + 1);
    }
  };

  // 🔡 Affichage du mot avec lettres devinées
  const updateWordDisplay = () => {
    return wordToGuess.split('').map((letter, index) => (
      <span key={index}>{guessedLetters.includes(letter) ? letter : '_'}</span>
    ));
  };

  // 🪓 Pendu
  const drawHangman = () => {
    const attemptsRemaining = maxAttempts - attempts;
    return <div className="attempts-remaining">Tentatives restantes : {attemptsRemaining}</div>;
  };

  // 🎉 Gérer fin de partie et victoire
  useEffect(() => {
    if (attempts >= maxAttempts) {
      setGameOver(true);
      setShowAnimation(true);
      loseAudio.play(); // 🔊 Son de défaite
    } else if (
      wordToGuess &&
      wordToGuess.split('').every((letter) => guessedLetters.includes(letter))
    ) {
      setGameOver(true);
      setShowWinAnimation(true);
      winAudio.play(); // 🔊 Son de victoire
        updateUserScore();
    }
  }, [attempts, guessedLetters, wordToGuess]);

  // 📊 Mise à jour du score
  const updateUserScore = async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, { score: score + 1 }, { merge: true });
        setScore(score + 1);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du score :', error);
      }
    }
  };
  
  // 🔁 Redémarrer la partie
  const restartGame = () => {
    setGuessedLetters([]);
    setAttempts(0);
    setGameOver(false);
    setShowAnimation(false);
    setShowWinAnimation(false);
    fetchRandomWord(); // Recharger un nouveau mot
  };

  return (
    <div className="hangman-container">
      <h1>Jeu du Pendu</h1>
      {user && <p>Connecté en tant que : {user.displayName}</p>}
      <div className="score-display">Score : {score}</div>


      {/* Mot à deviner */}
      <div className="word-display">
        {updateWordDisplay()}
      </div>

      {/* Tentatives restantes */}
      <div className="hangman">
        {drawHangman()}
      </div>

      {/* Lettres à cliquer */}
      <div className="letter-buttons">
        {'abcdefghijklmnopqrstuvwxyz'.split('').map((letter) => (
          <button
            key={letter}
            onClick={() => checkLetter(letter)}
            disabled={gameOver || guessedLetters.includes(letter)}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Animation de défaite */}
      {showAnimation && (
        <div className="animation loss game-over-message">
          <p>Vous avez perdu !</p>
          <p>Le mot était : <strong>{wordToGuess}</strong></p>
          <p>Définition : {wordDefinition}</p>
          <button onClick={restartGame}>Rejouer</button>
        </div>
      )}

      {/* Animation de victoire */}
      {showWinAnimation && (
        <div className="animation win game-over-message">
          <p>Félicitations, vous avez gagné !</p>
          <p>Le mot était : <strong>{wordToGuess}</strong></p>
          <p>Définition : {wordDefinition}</p>
          <button onClick={restartGame}>Rejouer</button>
        </div>
      )}
    </div>
  );
};

export default Hangman;
