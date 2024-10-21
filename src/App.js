import React, { useState } from 'react';
import sha256 from 'js-sha256';
import './App.css';

const BitcoinMiningSimulator = () => {
  const [nonce, setNonce] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [blockData, setBlockData] = useState('');
  const [hashResult, setHashResult] = useState('');
  const [minedMessage, setMinedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const mineBlock = () => {
    if (!nonce || !difficulty || !blockData) {
      setErrorMessage('Please enter all fields.');
      return;
    }

    const targetDifficulty = '0'.repeat(difficulty);
    console.log('Nonce:', nonce);
    console.log('Difficulty:', difficulty);
    console.log('Block Data:', blockData);
    console.log('Target Difficulty:', targetDifficulty);

    const hash = sha256(blockData + nonce);
    console.log('Hash:', hash);
    setHashResult(`Hash: ${hash}`);
    setErrorMessage('');

    if (hash.startsWith(targetDifficulty)) {
      setMinedMessage(`Success! Block mined with nonce: ${nonce}`);
    } else {
      setMinedMessage('');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Mine a Bitcoin Block</h1>
      <p>Guess the correct nonce to mine the block!</p>

      <div style={{ padding: '10px' }}>
        <label htmlFor="nonce">Enter Nonce Guess: </label>
        <input
          type="number"
          id="nonce"
          placeholder="Enter a number"
          value={nonce}
          onChange={(e) => setNonce(e.target.value)}
        />
      </div>
      <div style={{ padding: '10px' }}>
        <label htmlFor="difficulty">Enter Difficulty (number of leading zeros): </label>
        <input
          type="number"
          id="difficulty"
          placeholder="Enter difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        />
      </div>
      <div style={{ padding: '10px' }}>
        <label htmlFor="block-data">Enter Block Data: </label>
        <input
          type="text"
          id="block-data"
          placeholder="Enter block data"
          value={blockData}
          onChange={(e) => setBlockData(e.target.value)}
        />
      </div>
      <button onClick={mineBlock} style={{ margin: '20px'}}>
        Mine Block
      </button>

      <div id="current-difficulty">Current Difficulty: {difficulty}</div>
      <div id="hash-result">{hashResult}</div>
      <div id="mined-message">{minedMessage}</div>
      <div id="error-message">{errorMessage}</div>
    </div>
  );
};

export default BitcoinMiningSimulator;