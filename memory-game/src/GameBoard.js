import React, { useState, useEffect } from 'react';
import './GameBoard.css';
import confetti from 'canvas-confetti';

// Trigger confetti animation
const triggerConfetti = () => {
  confetti({
    zIndex: 1000,
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
};

// Trigger win confetti animation (longer than regular confetti)
const triggerWinConfetti = () => {
  const duration = 15 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
};

// List of emojis to use for the game
const emojis = ["😀", "🎉", "🎄", "🍕", "🚀", "👾", "🧩", "🏀", "🐱", "🦊", "🐼", "🦄", "🐔", "🦖", "🍀", "🍎", "🌈", "🚗"];

// Generate cards based on the game size
const generateCards = (size) => {
  const totalEmojis = emojis.slice(0, (size * size) / 2);
  const doubleEmojis = [...totalEmojis, ...totalEmojis];
  return doubleEmojis
    .sort(() => Math.random() - 0.5)
    .map((emoji) => ({ id: Math.random(), emoji, matched: false }));
};

/*
  Get leaderboard from local storage (because app is on client side only..) 
  Used here async/await (better way of promise since ES6 entoduced)
  Promises are not really needed here, because there is no API fetches or anything that demands asyncronous operations, but as reqquested...
*/
const getLeaderboard = async (size) => {
  const data = localStorage.getItem(`leaderboard_${size}x${size}`);
  return await JSON.parse(data) || [];
};

// Update leaderboard in local storage
const updateLeaderboard = (size, leaderboard) => {
  localStorage.setItem(`leaderboard_${size}x${size}`, JSON.stringify(leaderboard));
};

// GameBoard component
function GameBoard() {
  const [cards, setCards] = useState([]);
  const [turns, setTurns] = useState(0);
  const [choiceOne, setChoiceOne] = useState(null);
  const [choiceTwo, setChoiceTwo] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameSize, setGameSize] = useState(4);
  const [tempPlayerName, setTempPlayerName] = useState('');
  const [numberOfWins, setNumberOfWins] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  // render leaderboard and number of wins on every change
  useEffect(() => {
    (async () => {
      const lb = await getLeaderboard(gameSize);
      setLeaderboard(lb);  
    })();
  }, [gameSize]);

  useEffect(() => {
    const wins = leaderboard.filter(entry => entry.name === playerName).length;
    setNumberOfWins(wins);
  }, [leaderboard, playerName]);

  // Check if all cards are matched - if so, handle win 
  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.matched)) {
      const newEntry = { name: playerName, turns };
      setLeaderboard(prevLeaderboard => {
        const updatedLeaderboard = [...prevLeaderboard, newEntry]
          .sort((a, b) => a.turns - b.turns)
          .slice(0, 10);
    
        updateLeaderboard(gameSize, updatedLeaderboard);
    
        return updatedLeaderboard;
      });
      
      triggerWinConfetti();

      setShowWinModal(true);
    }
  }, [cards, playerName, gameSize]);
  
  
  
  // Shuffle cards on game size change
  useEffect(() => {
    shuffleCards(); // Initialize the game with cards
  }, [gameSize]); // Re-shuffle when game size changes

  // Handle card choice (match or not match?)
  const handleChoice = (card) => {
    if (disabled || card === choiceOne || card.matched) return;
    choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
  };

  // Check if two cards are chosen
  useEffect(() => {
    if (!choiceOne || !choiceTwo) return;
    setDisabled(true);

    if (choiceOne.emoji === choiceTwo.emoji) {
      setCards(prevCards => prevCards.map(card => card.emoji === choiceOne.emoji ? { ...card, matched: true } : card));
      setTimeout(resetTurn, 1000);
      triggerConfetti();
    } else {
      setTimeout(resetTurn, 1000);
    }
  }, [choiceOne, choiceTwo]);

  // Shuffle cards
  const shuffleCards = () => {
    setTurns(0);
    setIsShuffling(true); // Begin shuffle
  
    setTimeout(() => {
      // Perform the state updates for shuffling cards here
      setCards(generateCards(gameSize));
  
      setTimeout(() => {
        setIsShuffling(false); // End shuffle
      }, 1000); // Adjust based on your animation lengths
    }, 500);
  };
  
  // Reload page (Look like it go back to enter name when pressing GO BACK button)
  const renderPage = () => {
    window.location.reload();
  };

  // Reset turn after two cards are chosen
  const resetTurn = () => {
    setChoiceOne(null);
    setChoiceTwo(null);
    setDisabled(false);
    setTurns(prevTurns => prevTurns + 1);
  };

  // Move to game after correctly entering name
  const startGame = () => {
    const name = tempPlayerName.trim();
    if (!name) {
      alert('Please enter your name');
      return;
    }
    setPlayerName(name);
    shuffleCards();
  };

  // If player name is not set, show input field
  if (!playerName) {
    return (
      <div className="name-input">
        <input type="text" placeholder="Enter your name" onChange={(e) => setTempPlayerName(e.target.value)} />
        <button onClick={startGame}>Start Game</button>
        <select onChange={(e) => setGameSize(parseInt(e.target.value))}>
          <option value="4">4x4</option>
          <option value="6">6x6</option>
        </select>
      </div>
    );
  }

  // jsx for the game board
  return (
    <div className="game-container">
      {showWinModal && (
        <div className="win-modal">
          <div className="win-modal-content">
            <h2>Congratulations, {playerName}!</h2>
            <p>You won the game in {turns} turns!</p>
            <button onClick={() => setShowWinModal(false)}>Close</button>
          </div>
        </div>
      )}
      <div className="user">
        <h1>Hello, {playerName}!</h1>
        <h2>Number of wins: {numberOfWins}</h2>
      </div>
      <div className="leaderboard">
        <h2>Leaderboard ({gameSize}x{gameSize})</h2>
        <ol>
          {leaderboard.map((entry, index) => (
            <li key={index}>{entry.name}: {entry.turns} turns</li>
          ))}
        </ol>
      </div>
      <div className="game">
        <h2>Memory Game</h2>
        <div class="button-container">
          <button className="new-game-btn" onClick={shuffleCards}>New Game</button>
          <button className="new-game-btn" onClick={renderPage}>Go Back</button>
        </div>
        <div className={`card-grid ${gameSize === 6 ? 'six-grid' : ''}`}>
          {cards.map((card, index) => (
            <div
              className={`card ${card === choiceOne || card === choiceTwo || card.matched ? "flip" : ""} ${isShuffling ? (index % 2 === 0 ? 'card-shuffle-1' : 'card-shuffle-2') : ''}`}
              key={card.id}
              onClick={() => handleChoice(card)}
            >
            <div className="card-content">
              <div className="card-front">
                {card.emoji}
              </div>
              <div className="card-back">❓</div>
            </div>
          </div>
        ))}
        </div>
        <p className="turns-counter">Turns: {turns}</p>
      </div>
    </div>
  );
}

// Export the GameBoard component to be used in App.js
export default GameBoard;
