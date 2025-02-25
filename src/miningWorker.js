import { sha256 } from 'js-sha256';

// Calculate hash for a block
const calculateHash = (index, timestamp, data, previousHash, nonce) => {
  return sha256(index + timestamp + data + previousHash + nonce);
};

// Check if hash meets difficulty
const hashMeetsDifficulty = (hash, difficulty) => {
  const requiredPrefix = '0'.repeat(difficulty);
  return hash.startsWith(requiredPrefix);
};

// Add sleep function for delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

self.onmessage = async (e) => {
  const { index, timestamp, data, previousHash, difficulty } = e.data;
  let nonce = 0;
  let hash = "";
  let hashCounter = 0;
  const startTime = Date.now();

  while (true) {
    // Add a small delay for each hash calculation
    await sleep(10);  // 10ms delay per hash

    hash = calculateHash(index, timestamp, data, previousHash, nonce);
    hashCounter++;

    // Send progress update every 10 hashes
    if (hashCounter % 10 === 0) {
      self.postMessage({
        type: 'progress',
        hashCount: hashCounter,
        currentNonce: nonce,
        currentHash: hash,
        hashRate: Math.floor(hashCounter / ((Date.now() - startTime) / 1000))
      });
    }

    if (hashMeetsDifficulty(hash, difficulty)) {
      // Add extra delay before completing to ensure progress is visible
      await sleep(1000);
      
      self.postMessage({
        type: 'success',
        nonce,
        hash,
        hashCount: hashCounter
      });
      return;
    }

    nonce++;
  }
}; 