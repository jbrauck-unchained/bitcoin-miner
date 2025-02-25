import React, { useState, useEffect } from 'react';
import './App.css';
import { sha256 } from 'js-sha256';
import Worker from './miningWorker.js?worker';

const BitcoinCelebration = () => {
  // Create more Bitcoin symbols
  const symbols = Array.from({ length: 50 }, (_, i) => (
    <div 
      key={i} 
      className="bitcoin-symbol"
      style={{
        // Start all symbols from center
        left: '50%',
        top: '50%',
        fontSize: `${Math.random() * 2 + 1}rem`, // Random sizes
        // Random delays for more natural explosion
        animationDelay: `${Math.random() * 200}ms`,
        // Random trajectories covering more screen space
        '--x': `${(Math.random() - 0.5) * 200}vw`,
        '--y': `${(Math.random() - 0.5) * 200}vh`,
        '--rotate': `${Math.random() * 1080 - 540}deg`,
        '--scale': Math.random() * 1.5 + 0.5
      }}
    >
      ₿
    </div>
  ));

  return <div className="bitcoin-celebration">{symbols}</div>;
};

function App() {
  const [blockchain, setBlockchain] = useState([
    {
      index: 0,
      timestamp: "Genesis Block",
      data: "Genesis Block Data",
      previousHash: "0",
      hash: "000000hash123456789",
      nonce: 0
    }
  ]);
  
  const [newBlockData, setNewBlockData] = useState("");
  const [mining, setMining] = useState(false);
  const [difficulty, setDifficulty] = useState(3);
  const [hashRate, setHashRate] = useState(0);
  const [hashCount, setHashCount] = useState(0);
  const [currentNonce, setCurrentNonce] = useState(0);
  const [currentHash, setCurrentHash] = useState("");
  const [worker, setWorker] = useState(null);
  const [foundBlock, setFoundBlock] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [transactionBuffer, setTransactionBuffer] = useState("");
  const MAX_CHARS = 1000;
  
  // Add new state for miners
  const [miners, setMiners] = useState([
    {
      id: 1,
      name: "Miner 1",
      color: "#3498db",
      blocksFound: 0
    }
  ]);
  
  // Add new state for miner progress
  const [minerProgress, setMinerProgress] = useState({});
  
  // Add new state for simple nonce mode
  const [simpleNonce, setSimpleNonce] = useState(false);
  
  useEffect(() => {
    const miningWorker = new Worker();
    setWorker(miningWorker);

    return () => {
      miningWorker.terminate();
    };
  }, []);
  
  // Calculate hash for a block
  const calculateHash = (index, timestamp, data, previousHash, nonce) => {
    return sha256(index + timestamp + data + previousHash + nonce);
  };
  
  // Check if hash meets difficulty (starts with enough zeros)
  const hashMeetsDifficulty = (hash, difficulty) => {
    const requiredPrefix = '0'.repeat(difficulty);
    return hash.startsWith(requiredPrefix);
  };
  
  // Mine a new block
  const mineBlock = async () => {
    if (newBlockData.trim() === "") {
      alert("Please enter some transaction data");
      return;
    }
    
    setMining(true);
    setHashCount(0);
    setCurrentHash("");
    setCurrentNonce(0);
    setHashRate(0);
    
    const lastBlock = blockchain[blockchain.length - 1];
    const newIndex = lastBlock.index + 1;
    const timestamp = Date.now().toString();
    const previousHash = lastBlock.hash;

    if (worker) {
      worker.onmessage = (e) => {
        const { type, hashCount, currentNonce, currentHash, hashRate, nonce, hash, finalData, minerId, minerStats } = e.data;
        
        if (type === 'progress') {
          setHashCount(hashCount);
          setCurrentNonce(currentNonce);
          setCurrentHash(currentHash);
          setHashRate(hashRate);
          // Update individual miner progress
          setMinerProgress(minerStats);
        } else if (type === 'success') {
          // Find the successful miner
          const successfulMiner = miners.find(m => m.id === minerId);
          
          const newBlock = {
            index: newIndex,
            timestamp,
            data: finalData,
            previousHash,
            hash,
            nonce,
            minerName: successfulMiner.name,
            minerColor: successfulMiner.color
          };
          
          // Update miner's block count
          setMiners(prev => prev.map(miner => 
            miner.id === minerId 
              ? { ...miner, blocksFound: miner.blocksFound + 1 }
              : miner
          ));
          
          setFoundBlock(newBlock);
          
          setTimeout(() => {
            setBlockchain(prev => [...prev, newBlock]);
            setFoundBlock(null);
            setNewBlockData("");
            setMining(false);
            setNodes([]);
          }, 8000);
        }
      };

      // Send all miners to the worker
      worker.postMessage({
        type: 'start',
        index: newIndex,
        timestamp,
        data: newBlockData,
        previousHash,
        difficulty,
        miners: miners,
        simpleNonce // Pass the mode to worker
      });
    }
  };
  
  // Stop mining
  const stopMining = () => {
    setMining(false);
    if (worker) {
      worker.terminate();
      const newWorker = new Worker();
      setWorker(newWorker);
    }
  };
  
  // Update the difficulty handler to ensure we always have a valid number
  const handleDifficultyChange = (e) => {
    const value = e.target.value;
    // Only update if we have a valid number between 1-6
    if (value && !isNaN(value) && value >= 1 && value <= 6) {
      setDifficulty(parseInt(value));
    }
  };

  // Add function to generate random transaction data
  const generateTransactionData = () => {
    const transactions = [
      "Alice sent 0.5 BTC to Bob",
      "Charlie sent 1.2 BTC to David",
      "Eve purchased 0.3 BTC",
      "Frank transferred 0.8 BTC to Grace",
      "Helen exchanged 2.1 BTC for USD",
      "Igor sent 0.4 BTC to Julia"
    ];
    return transactions[Math.floor(Math.random() * transactions.length)];
  };

  // Add node data generation interval
  useEffect(() => {
    if (mining && nodes.length > 0) {
      const intervals = nodes.map((node, index) => {
        return setInterval(() => {
          setTransactionBuffer(prev => {
            const newData = `\n[Node ${node.id}]: ${generateTransactionData()}`;
            const updatedData = prev + newData;
            if (updatedData.length <= MAX_CHARS) {
              return updatedData;
            }
            return prev;
          });
        }, 3000 / nodes.length); // Faster updates with more nodes
      });

      return () => {
        intervals.forEach(interval => clearInterval(interval));
      };
    }
  }, [mining, nodes]);

  // Update transaction data when buffer changes
  useEffect(() => {
    if (transactionBuffer) {
      setNewBlockData(prev => prev + transactionBuffer);
      setTransactionBuffer("");
    }
  }, [transactionBuffer]);

  // Add a new node
  const addNode = () => {
    const newNode = {
      id: nodes.length + 1,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
    setNodes(prev => [...prev, newNode]);
  };

  // Update the worker message handler to send new data to the worker
  useEffect(() => {
    if (mining && worker) {
      // Send updated data to worker whenever transaction data changes
      worker.postMessage({
        type: 'updateData',
        data: newBlockData
      });
    }
  }, [newBlockData, mining, worker]);

  // Update the addMiner function to notify the worker
  const addMiner = () => {
    const colors = ["#e74c3c", "#2ecc71", "#f1c40f", "#9b59b6", "#e67e22"];
    const newMiner = {
      id: miners.length + 1,
      name: `Miner ${miners.length + 1}`,
      color: colors[miners.length % colors.length],
      blocksFound: 0
    };
    setMiners(prev => {
      const updatedMiners = [...prev, newMiner];
      // If mining is in progress, update the worker with new miners list
      if (mining && worker) {
        worker.postMessage({
          type: 'updateMiners',
          miners: updatedMiners
        });
      }
      return updatedMiners;
    });
  };

  // Add removeMiner function
  const removeMiner = (minerId) => {
    // Don't allow removing the last miner
    if (miners.length <= 1) return;
    
    setMiners(prev => {
      const updatedMiners = prev.filter(m => m.id !== minerId);
      // If mining is in progress, update the worker
      if (mining && worker) {
        worker.postMessage({
          type: 'updateMiners',
          miners: updatedMiners
        });
      }
      return updatedMiners;
    });
  };

  return (
    <div className="App">
      <h1>Bitcoin Mining Simulator</h1>
      
      <div className="mining-controls">
        <h2>Create a New Block</h2>
        <div className="form-group">
          <label>Initial Transaction Data:</label>
          <textarea 
            value={newBlockData}
            onChange={(e) => setNewBlockData(e.target.value)}
            placeholder="Enter initial transaction data here..."
            disabled={mining}
            maxLength={MAX_CHARS}
          />
          <div className="char-count">
            {newBlockData.length} / {MAX_CHARS} characters
          </div>
        </div>

        {mining && (
          <div className="nodes-control">
            <button 
              onClick={addNode}
              className="add-node-button"
              disabled={newBlockData.length >= MAX_CHARS}
            >
              Add Node
            </button>
            <div className="nodes-container">
              {nodes.map(node => (
                <div 
                  key={node.id}
                  className="node"
                  style={{ backgroundColor: node.color }}
                >
                  <div className="node-icon">📱</div>
                  <div className="node-label">Node {node.id}</div>
                  <div className="node-status">Active</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label>Mining Difficulty (number of leading zeros):</label>
          <input 
            type="number" 
            min="1" 
            max="6"
            value={difficulty || 3} // Provide fallback value
            onChange={handleDifficultyChange}
            disabled={mining}
          />
        </div>
        
        <div className="form-group nonce-mode">
          <label className="toggle-label">
            <input 
              type="checkbox"
              checked={simpleNonce}
              onChange={(e) => setSimpleNonce(e.target.checked)}
              disabled={mining}
            />
            Simple Nonce Mode
            <span className="tooltip">
              ℹ️ When enabled, miners will guess nonces in order (1,2,3...) instead of random numbers
            </span>
          </label>
        </div>
        
        {!mining ? (
          <button onClick={mineBlock} className="mine-button">Start Mining</button>
        ) : (
          <button onClick={stopMining} className="stop-button">Stop Mining</button>
        )}

        <div className="miners-section">
          <h3>Miners</h3>
          <button 
            onClick={addMiner} 
            className="add-miner-button"
            disabled={miners.length >= 5}
          >
            Add Miner
          </button>
          <div className="miners-container">
            {miners.map(miner => (
              <div 
                key={miner.id}
                className="miner"
                style={{ backgroundColor: miner.color }}
              >
                <button 
                  className="remove-miner-button"
                  onClick={() => removeMiner(miner.id)}
                  disabled={miners.length <= 1}
                >
                  ×
                </button>
                <div className="miner-icon">⛏️</div>
                <div className="miner-name">{miner.name}</div>
                <div className="miner-stats">
                  Blocks Found: {miner.blocksFound}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {mining && (
        <div className={`mining-stats ${foundBlock ? 'success' : ''}`}>
          {foundBlock ? (
            <>
              <h2>Block Found!</h2>
              <div className="found-block" style={{ borderColor: foundBlock.minerColor }}>
                <div className="miner-info">
                  <span className="miner-badge" style={{ backgroundColor: foundBlock.minerColor }}>
                    {foundBlock.minerName}
                  </span>
                </div>
                <div className="stat">
                  <span>Block Hash:</span>
                  <span className="hash">{foundBlock.hash}</span>
                </div>
                <div className="stat">
                  <span>Nonce Found:</span>
                  <span>{foundBlock.nonce}</span>
                </div>
                <div className="stat">
                  <span>Timestamp:</span>
                  <span>{new Date(parseInt(foundBlock.timestamp)).toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span>Total Hashes:</span>
                  <span>{hashCount.toLocaleString()}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2>
                Mining in Progress...
                <div className="loading-spinner"></div>
              </h2>
              <div className="miners-progress">
                {miners.map(miner => {
                  const progress = minerProgress[miner.id] || {};
                  return (
                    <div 
                      key={miner.id} 
                      className="miner-progress"
                      style={{ borderColor: miner.color }}
                    >
                      <div className="miner-progress-header" style={{ backgroundColor: miner.color }}>
                        <span>{miner.name}</span>
                        <span>{progress.hashRate?.toLocaleString() || 0} H/s</span>
                      </div>
                      <div className="miner-progress-details">
                        <div className="stat">
                          <span>Current Nonce:</span>
                          <span>{progress.currentNonce || 0}</span>
                        </div>
                        <div className="stat">
                          <span>Current Hash:</span>
                          <span className="hash">{progress.currentHash || '...'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mining-summary">
                <div className="stat">
                  <span>Total Hashes:</span>
                  <span>{hashCount.toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span>Target Pattern:</span>
                  <span className="target">{'0'.repeat(difficulty)}...</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {mining && foundBlock && <BitcoinCelebration />}
      
      <div className="blockchain">
        <h2>Blockchain</h2>
        {blockchain.map((block, index) => (
          <div key={index} className="block" style={{ borderLeft: `5px solid ${block.minerColor}` }}>
            <h3>Block #{block.index}</h3>
            <div className="block-info">
              <div><strong>Timestamp:</strong> {block.timestamp}</div>
              <div><strong>Data:</strong> {block.data}</div>
              <div><strong>Previous Hash:</strong> <span className="hash">{block.previousHash}</span></div>
              <div><strong>Hash:</strong> <span className="hash">{block.hash}</span></div>
              <div><strong>Nonce:</strong> {block.nonce}</div>
              <div><strong>Mined by:</strong> {block.minerName}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;