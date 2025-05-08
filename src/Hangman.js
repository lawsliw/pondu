import React, { useState, useEffect } from 'react';
import './Hangman.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { auth } from './firebaseConfig';
import { FacebookAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';


const Hangman = () => {
  const [user, setUser] = useState(null);
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
      const wordsSnapshot = await getDocs(wordsCollection);
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

  useEffect(() => {
    fetchRandomWord();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (!currentUser) {
          const provider = new FacebookAuthProvider();
          signInWithPopup(auth, provider)
            .then((result) => {
              setUser(result.user);
            })
            .catch((error) => {
              console.error('Erreur de connexion Facebook:', error);
            });
        } else {
          setUser(currentUser);
        }
      });
    
      return () => unsubscribe();
    
  }, []);

  const checkLetter = (letter) => {
    if (gameOver || guessedLetters.includes(letter)) return;

    setGuessedLetters([...guessedLetters, letter]);

    if (!wordToGuess.includes(letter)) {
      setAttempts(prev => prev + 1);
    }
  };

  const updateWordDisplay = () => {
    return wordToGuess.split('').map((letter, index) => (
      <span key={index}>{guessedLetters.includes(letter) ? letter : '_'}</span>
    ));
  };

  const drawHangman = () => {
    const attemptsRemaining = maxAttempts - attempts;
    return <div className="attempts-remaining">Tentatives restantes : {attemptsRemaining}</div>;
  };

  useEffect(() => {
    if (attempts >= maxAttempts) {
      setGameOver(true);
      setShowAnimation(true);
    } else if (
      wordToGuess &&
      wordToGuess.split('').every((letter) => guessedLetters.includes(letter))
    ) {
      setGameOver(true);
      setShowWinAnimation(true);
    }
  }, [attempts, guessedLetters, wordToGuess]);

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
