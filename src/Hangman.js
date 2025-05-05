import React, { useState, useEffect } from 'react';
import './Hangman.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';


const Hangman = () => {
  const [wordToGuess, setWordToGuess] = useState(''); // Le mot à deviner
  const [guessedLetters, setGuessedLetters] = useState([]); // Lettres devinées
  const [attempts, setAttempts] = useState(0); // Nombre de tentatives
  const [gameOver, setGameOver] = useState(false); // Si le jeu est fini ou non
  const [showAnimation, setShowAnimation] = useState(false); // Animation perte
  const [showWinAnimation, setShowWinAnimation] = useState(false); // Animation victoire
  const maxAttempts = 6; // Nombre maximum de tentatives avant de perdre

  // Chargement d'un mot aléatoire depuis Firestore
  const fetchRandomWord = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'words'));
      const words = querySnapshot.docs.map(doc => doc.data().word);
      if (words.length > 0) {
        const randomIndex = Math.floor(Math.random() * words.length);
        const randomWord = words[randomIndex];
        setWordToGuess(randomWord.toLowerCase());
      } else {
        setWordToGuess('default'); // mot de secours
      }
    } catch (error) {
      console.error('Erreur de chargement des mots :', error);
      setWordToGuess('erreur');
    }
  };

  useEffect(() => {
    fetchRandomWord();
  }, []);


  // Fonction pour gérer les lettres devinées
  const checkLetter = (letter) => {
    if (gameOver || guessedLetters.includes(letter)) return;

    setGuessedLetters((prev) => [...prev, letter]);

    if (!wordToGuess.includes(letter)) {
      setAttempts(attempts + 1);
    }
  };

  // Fonction pour afficher le mot avec des lettres manquantes
  const updateWordDisplay = () => {
    return wordToGuess.split('').map((letter, index) => (
      <span key={index}>{guessedLetters.includes(letter) ? letter : '_'}</span>
    ));
  };

  // Fonction pour dessiner le pendu (afficher les tentatives restantes)
  const drawHangman = () => {
    const attemptsRemaining = maxAttempts - attempts;
    return <div className="attempts-remaining">Tentatives restantes : {attemptsRemaining}</div>;
  };

  // Vérifier la fin du jeu ou la victoire
  useEffect(() => {
    if (!wordToGuess) return;
    if (attempts >= maxAttempts) {
      setGameOver(true);
      setShowAnimation(true); // Afficher l'animation de perte
    }
    else if (
      wordToGuess.split('').every((letter) => guessedLetters.includes(letter))
    ) {
      setGameOver(true);
      setShowWinAnimation(true); // Afficher l'animation de victoire
    }
  }, [attempts, guessedLetters, wordToGuess]);

  // Fonction pour réinitialiser le jeu
  const restartGame = async () => {
    setGuessedLetters([]);
    setAttempts(0);
    setGameOver(false);
    setShowAnimation(false); // Cacher l'animation après redémarrage
    setShowWinAnimation(false); // Cacher l'animation de victoire
    await fetchRandomWord();
  };

  return (
    <div className="hangman-container">
      <h1>Jeu du Pendu</h1>

      {/* Section du mot à deviner */}
      <div className="word-display">
      {wordToGuess ? updateWordDisplay() : <p>Chargement du mot...</p>}
      </div>

      {/* Section du nombre de tentatives restantes */}
      <div className="hangman">
        {drawHangman()}
      </div>

      {/* Boutons de lettres */}
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

{/* Animation de perte avec bouton */}
{showAnimation && (
  <div className="animation loss game-over-message">
    <p>Vous avez perdu !</p>
    <button onClick={restartGame}>Rejouer</button>
  </div>
)}

{/* Animation de victoire avec bouton */}
{showWinAnimation && (
  <div className="animation win game-over-message">
    <p>Félicitations, vous avez gagné !</p>
    <button onClick={restartGame}>Rejouer</button>
  </div>
)}

    </div>
  );
};

export default Hangman;
