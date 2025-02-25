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

let currentData = "";
let isRunning = false;
let miningParams = null;

self.onmessage = async (e) => {
  const { type } = e.data;

  if (type === 'start') {
    // Start new mining process
    isRunning = true;
    miningParams = e.data;
    currentData = miningParams.data;
    startMining();
  } else if (type === 'updateData') {
    // Update the current data being mined
    currentData = e.data.data;
  } else if (type === 'stop') {
    isRunning = false;
  }
};

const startMining = async () => {
  let nonce = 0;
  let hash = "";
  let hashCounter = 0;
  const startTime = Date.now();

  while (isRunning) {
    // Use the current data which may have been updated
    hash = calculateHash(
      miningParams.index,
      miningParams.timestamp,
      currentData,
      miningParams.previousHash,
      nonce
    );
    hashCounter++;

    // Send progress update every 100 hashes
    if (hashCounter % 100 === 0) {
      self.postMessage({
        type: 'progress',
        hashCount: hashCounter,
        currentNonce: nonce,
        currentHash: hash,
        hashRate: Math.floor(hashCounter / ((Date.now() - startTime) / 1000))
      });
    }

    if (hashMeetsDifficulty(hash, miningParams.difficulty)) {
      self.postMessage({
        type: 'success',
        nonce,
        hash,
        hashCount: hashCounter,
        finalData: currentData  // Send back the final data
      });
      isRunning = false;
      return;
    }

    nonce++;
    await new Promise(resolve => setTimeout(resolve, 10)); // Keep the delay for visualization
  }
}; 