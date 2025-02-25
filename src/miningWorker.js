import { sha256 } from 'js-sha256';

// Calculate hash for a block
const calculateHash = (index, timestamp, data, previousHash, nonce) => {
  return sha256(index + timestamp + data + previousHash + nonce);
};

// Check if hash meets difficulty (starts with at least the required number of zeros)
const hashMeetsDifficulty = (hash, difficulty) => {
  // Count leading zeros
  let leadingZeros = 0;
  for (let i = 0; i < hash.length; i++) {
    if (hash[i] === '0') {
      leadingZeros++;
    } else {
      break;
    }
  }
  return leadingZeros >= difficulty;
};

let currentData = "";
let isRunning = false;
let miningParams = null;
let miners = [];
let minerStats = {};
let simpleNonce = false;
let currentNonce = 0;

// Generate a random nonce
const getNextNonce = () => {
  if (simpleNonce) {
    return currentNonce++;
  }
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
};

self.onmessage = async (e) => {
  const { type } = e.data;

  if (type === 'start') {
    isRunning = true;
    miningParams = e.data;
    currentData = miningParams.data;
    miners = miningParams.miners;
    minerStats = {};
    simpleNonce = e.data.simpleNonce;
    currentNonce = 0; // Reset nonce counter for simple mode
    startMining();
  } else if (type === 'updateData') {
    currentData = e.data.data;
  } else if (type === 'updateMiners') {
    miners = e.data.miners;
    // Clean up stats for removed miners and initialize new ones
    const currentMinerIds = new Set(miners.map(m => m.id));
    
    // Remove stats for miners that no longer exist
    Object.keys(minerStats).forEach(id => {
      if (!currentMinerIds.has(parseInt(id))) {
        delete minerStats[id];
      }
    });
    
    // Initialize stats for new miners
    miners.forEach(miner => {
      if (!minerStats[miner.id]) {
        minerStats[miner.id] = {
          hashCount: 0,
          startTime: Date.now(),
          currentNonce: getNextNonce()
        };
      }
    });
  } else if (type === 'stop') {
    isRunning = false;
  }
};

const startMining = async () => {
  let hashCounter = 0;
  const startTime = Date.now();

  // Initialize miner nonces
  miners.forEach(miner => {
    if (!minerStats[miner.id]) {
      minerStats[miner.id] = {
        hashCount: 0,
        startTime: Date.now(),
        currentNonce: getNextNonce()
      };
    }
  });

  while (isRunning) {
    // Randomly select a miner for this hash attempt
    const currentMiner = miners[Math.floor(Math.random() * miners.length)];
    
    // Each miner tries a random nonce
    const nonce = getNextNonce();
    minerStats[currentMiner.id].currentNonce = nonce;

    const hash = calculateHash(
      miningParams.index,
      miningParams.timestamp,
      currentData,
      miningParams.previousHash,
      nonce
    );
    hashCounter++;

    // Update stats for current miner
    minerStats[currentMiner.id].hashCount++;
    minerStats[currentMiner.id].currentHash = hash;
    minerStats[currentMiner.id].hashRate = Math.floor(
      minerStats[currentMiner.id].hashCount / 
      ((Date.now() - minerStats[currentMiner.id].startTime) / 1000)
    );

    if (hashCounter % 100 === 0) {
      self.postMessage({
        type: 'progress',
        hashCount: hashCounter,
        currentNonce: nonce,
        currentHash: hash,
        hashRate: Math.floor(hashCounter / ((Date.now() - startTime) / 1000)),
        minerStats: minerStats
      });
    }

    if (hashMeetsDifficulty(hash, miningParams.difficulty)) {
      self.postMessage({
        type: 'success',
        nonce,
        hash,
        hashCount: hashCounter,
        finalData: currentData,
        minerId: currentMiner.id
      });
      isRunning = false;
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
  }
}; 