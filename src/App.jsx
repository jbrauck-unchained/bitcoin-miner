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
        const { type, hashCount, currentNonce, currentHash, hashRate, nonce, hash, finalData } = e.data;
        
        if (type === 'progress') {
          setHashCount(hashCount);
          setCurrentNonce(currentNonce);
          setCurrentHash(currentHash);
          setHashRate(hashRate);
        } else if (type === 'success') {
          const newBlock = {
            index: newIndex,
            timestamp,
            data: finalData,
            previousHash,
            hash,
            nonce
          };
          
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

      worker.postMessage({
        type: 'start',
        index: newIndex,
        timestamp,
        data: newBlockData,
        previousHash,
        difficulty
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
        
        {!mining ? (
          <button onClick={mineBlock} className="mine-button">Start Mining</button>
        ) : (
          <button onClick={stopMining} className="stop-button">Stop Mining</button>
        )}
      </div>
      
      {mining && (
        <div className={`mining-stats ${foundBlock ? 'success' : ''}`}>
          <h2>
            {foundBlock ? 'Block Found!' : 'Mining in Progress...'}
            {!foundBlock && <div className="loading-spinner"></div>}
          </h2>
          
          {foundBlock ? (
            <div className="found-block">
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
          ) : (
            <>
              <div className="stat">
                <span>Hashes Calculated:</span> 
                <span>{hashCount.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span>Hash Rate:</span> 
                <span>{hashRate.toLocaleString()} H/s</span>
              </div>
              <div className="stat">
                <span>Current Nonce:</span> 
                <span>{currentNonce}</span>
              </div>
              <div className="stat">
                <span>Current Hash:</span> 
                <span className="hash">{currentHash}</span>
              </div>
              <div className="stat">
                <span>Target Pattern:</span> 
                <span className="target">{'0'.repeat(difficulty)}...</span>
              </div>
            </>
          )}
        </div>
      )}
      
      {mining && foundBlock && <BitcoinCelebration />}
      
      <div className="blockchain">
        <h2>Blockchain</h2>
        {blockchain.map((block, index) => (
          <div key={index} className="block">
            <h3>Block #{block.index}</h3>
            <div className="block-info">
              <div><strong>Timestamp:</strong> {block.timestamp}</div>
              <div><strong>Data:</strong> {block.data}</div>
              <div><strong>Previous Hash:</strong> <span className="hash">{block.previousHash}</span></div>
              <div><strong>Hash:</strong> <span className="hash">{block.hash}</span></div>
              <div><strong>Nonce:</strong> {block.nonce}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;