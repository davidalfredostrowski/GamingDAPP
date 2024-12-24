import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { InjectedConnector } from "@web3-react/injected-connector";
import { useWeb3React } from "@web3-react/core";

const GamingDApp = ({ contractAddress, contractABI }) => {
  const { activate, active, account, library } = useWeb3React();
  const [contract, setContract] = useState(null);
  const [playerSessions, setPlayerSessions] = useState([]);
  const [wager, setWager] = useState("");
  const [display, setDisplay] = useState("");
  const [guess, setGuess] = useState(true); // true for higher, false for lower
  const [isLoading, setIsLoading] = useState(false);

  const injectedConnector = new InjectedConnector({ supportedChainIds: [1, 3, 4, 5, 42] }); // Update with your network ID

  // Connect to wallet
  const connectWallet = async () => {
    try {
      await activate(injectedConnector);
    } catch (error) {
      console.error("Error connecting wallet", error);
    }
  };

  // Load the contract
  useEffect(() => {
    if (active && library) {
      const signer = library.getSigner();
      const gamingContract = new ethers.Contract(contractAddress, contractABI, signer);
      setContract(gamingContract);
    }
  }, [active, library, contractAddress, contractABI]);

  // Fetch player sessions (logs of "RoundComplete" events)
  const fetchPlayerSessions = async () => {
    if (contract) {
      try {
        const events = await contract.queryFilter("RoundComplete");
        const sessions = events.map((event) => ({
          player: event.args[0],
          wager: ethers.utils.formatEther(event.args[1]),
          playerNumber: event.args[2].toString(),
          mysteryNumber: event.args[3].toString(),
          guess: event.args[4],
          result: event.args[5],
        }));
        setPlayerSessions(sessions.reverse()); // Show latest first
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    }
  };

  // Play the game (winOrLose)
  const playGame = async () => {
    if (contract && wager && display) {
      try {
        setIsLoading(true);
        const tx = await contract.winOrLose(display, guess, {
          value: ethers.utils.parseEther(wager),
        });
        await tx.wait();
        await fetchPlayerSessions(); // Update history after the game
        setIsLoading(false);
      } catch (error) {
        console.error("Error playing game:", error);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (contract) {
      fetchPlayerSessions();
    }
  }, [contract]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Gaming DApp</h1>
      {!active ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {account}</p>
          <div>
            <h3>Play Game</h3>
            <input
              type="number"
              placeholder="Wager (ETH)"
              value={wager}
              onChange={(e) => setWager(e.target.value)}
            />
            <input
              type="number"
              placeholder="Your Number (Display)"
              value={display}
              onChange={(e) => setDisplay(e.target.value)}
            />
            <div>
              <label>
                <input
                  type="radio"
                  name="guess"
                  checked={guess}
                  onChange={() => setGuess(true)}
                />
                Higher
              </label>
              <label>
                <input
                  type="radio"
                  name="guess"
                  checked={!guess}
                  onChange={() => setGuess(false)}
                />
                Lower
              </label>
            </div>
            <button onClick={playGame} disabled={isLoading}>
              {isLoading ? "Playing..." : "Play"}
            </button>
          </div>
          <div style={{ marginTop: "20px" }}>
            <h3>Player Sessions</h3>
            <div
              style={{
                maxHeight: "300px",
                overflowY: "scroll",
                border: "1px solid #ccc",
                padding: "10px",
              }}
            >
              {playerSessions.length === 0 ? (
                <p>No sessions found</p>
              ) : (
                playerSessions.map((session, index) => (
                  <div key={index} style={{ marginBottom: "10px" }}>
                    <p><b>Player:</b> {session.player}</p>
                    <p><b>Wager:</b> {session.wager} ETH</p>
                    <p><b>Your Number:</b> {session.playerNumber}</p>
                    <p><b>Mystery Number:</b> {session.mysteryNumber}</p>
                    <p><b>Guess:</b> {session.guess ? "Higher" : "Lower"}</p>
                    <p><b>Result:</b> {session.result}</p>
                    <hr />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamingDApp;
