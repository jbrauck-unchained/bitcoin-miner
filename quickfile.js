import React, { useState } from 'react';
import sha256 from 'js-sha256';

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
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Mine a Bitcoin Block</h1>
      <p>Guess the correct nonce to mine the block!</p>

      <div>
        <label htmlFor="nonce">Enter Nonce Guess:</label>
        <input
          type="number"
          id="nonce"
          placeholder="Enter a number"
          value={nonce}
          onChange={(e) => setNonce(e.target.value)}
          style={{ width: '200px', padding: '10px' }}
        />
      </div>
      <div>
        <label htmlFor="difficulty">Enter Difficulty (number of leading zeros):</label>
        <input
          type="number"
          id="difficulty"
          placeholder="Enter difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={{ width: '200px', padding: '10px' }}
        />
      </div>
      <div>
        <label htmlFor="block-data">Enter Block Data:</label>
        <input
          type="text"
          id="block-data"
          placeholder="Enter block data"
          value={blockData}
          onChange={(e) => setBlockData(e.target.value)}
          style={{ width: '200px', padding: '10px' }}
        />
      </div>
      <button onClick={mineBlock} style={{ padding: '10px 20px', fontSize: '16px', marginTop: '10px' }}>
        Mine Block
      </button>

      <div id="hash-result" style={{ marginTop: '20px' }}>{hashResult}</div>
      <div id="mined-message" style={{ color: 'green', fontWeight: 'bold' }}>{minedMessage}</div>
      <div id="error-message" style={{ color: 'red' }}>{errorMessage}</div>
    </div>
  );
};

export default BitcoinMiningSimulator;