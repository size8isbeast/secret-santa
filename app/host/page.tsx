'use client';

import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { useRoomState } from '@/lib/hooks/useRoomState';
import { useTimer } from '@/lib/hooks/useTimer';
import { Timer } from '@/components/Timer';
import Link from 'next/link';
import { LocalStorage } from '@/lib/localStorage';

const HOST_KEY = 'edc2026';

export default function HostPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [activePlayers, setActivePlayers] = useState<string[]>([]);

  const roomState = useRoomState();
  const currentRecipient = store.getCurrentRecipient();
  const nextRecipient = roomState.isStarted && roomState.currentIndex < roomState.openingOrder.length - 1
    ? roomState.openingOrder[roomState.currentIndex + 1]
    : null;
  const isLastRound =
    roomState.isStarted &&
    roomState.currentIndex >= roomState.openingOrder.length - 1;

  // Track timer for last round
  const { isExpired } = useTimer({
    startedAt: roomState.roundStartedAt,
    durationSec: roomState.durationSec,
  });

  const isGameOver = isLastRound && isExpired;

  // Fetch active players periodically
  useEffect(() => {
    const fetchActivePlayers = async () => {
      const players = await store.getActivePlayers();
      setActivePlayers(players);
    };

    fetchActivePlayers();
    const interval = setInterval(fetchActivePlayers, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput === HOST_KEY) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid key. Please try again.');
      setKeyInput('');
    }
  };

  const handleStart = () => {
    console.log('🚀 Host clicked Start Game');
    store.startGame();
  };

  const handleNext = () => {
    console.log('➡️ Host clicked Next Round');
    store.nextRecipient();
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset the game? This will clear all player data.')) {
      await store.reset();
      LocalStorage.clearAll();
    }
  };

  // Show password input if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-12">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔐</div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Host Access
              </h1>
              <p className="text-gray-600">
                Enter the host key to continue
              </p>
            </div>

            <form onSubmit={handleKeySubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Enter host key"
                  className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xl font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                Enter
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">
            🎅 Secret Santa Gift Opening 🎁
          </h1>
          {roomState.isStarted && (
            <div className="text-2xl text-gray-600">
              Round {roomState.currentIndex + 1} of {roomState.openingOrder.length}
            </div>
          )}
        </div>

        {/* Main Content */}
        {!roomState.isStarted ? (
          // Pre-game view
          <div className="text-center space-y-8">
            {/* Players who have entered */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Players Ready
              </h2>
              {activePlayers.length > 0 ? (
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  {activePlayers.map((player, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-semibold text-lg shadow-lg"
                    >
                      {player}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-lg mb-6">
                  Waiting for players to enter...
                </p>
              )}
              <p className="text-sm text-gray-600 mb-8">
                {activePlayers.length} player{activePlayers.length !== 1 ? 's' : ''} ready
              </p>
              <button
                onClick={handleStart}
                disabled={activePlayers.length === 0}
                className={`text-4xl font-bold py-6 px-16 rounded-xl shadow-lg transition-all transform ${
                  activePlayers.length > 0
                    ? 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Start Game
              </button>
            </div>
            <div className="bg-blue-50 rounded-xl p-6 max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold mb-3">How it works:</h2>
              <ul className="text-left text-gray-700 space-y-2">
                <li>• Players enter their names on the player screen</li>
                <li>• Click Start to randomize the opening order</li>
                <li>• Each person opens their gift when their name appears</li>
                <li>• Players guess who their Secret Santa is</li>
                <li>• Click Next to move to the next person</li>
              </ul>
            </div>
          </div>
        ) : (
          // Active game view
          <div className="space-y-8">
            {/* Current Recipient Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-16 text-center">
              <div className="text-4xl text-gray-600 mb-4">Now Opening:</div>
              <div className="text-9xl font-bold bg-gradient-to-r from-red-600 via-green-600 to-red-600 bg-clip-text text-transparent mb-8">
                {currentRecipient}
              </div>
              {nextRecipient && (
                <div className="mb-8">
                  <div className="text-2xl text-gray-500 mb-2">Next Up:</div>
                  <div className="text-4xl font-bold text-gray-700">
                    {nextRecipient}
                  </div>
                </div>
              )}
              <Timer
                startedAt={roomState.roundStartedAt}
                durationSec={roomState.durationSec}
              />
            </div>

            {/* Controls */}
            <div className="flex gap-4 justify-center">
              {isLastRound ? (
                <div className="text-center w-full">
                  <div className="text-4xl font-bold text-green-600 mb-6">
                    🎉 All Done! 🎉
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Link
                      href="/results?role=host"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105 inline-block"
                    >
                      📊 View Results
                    </Link>
                    <button
                      onClick={handleReset}
                      className="bg-gray-600 hover:bg-gray-700 text-white text-2xl font-bold py-4 px-8 rounded-xl shadow-lg transition-all"
                    >
                      Reset Game
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleNext}
                    className="bg-green-600 hover:bg-green-700 text-white text-3xl font-bold py-6 px-12 rounded-xl shadow-lg transition-all transform hover:scale-105"
                  >
                    Next →
                  </button>
                  <button
                    onClick={handleReset}
                    className="bg-gray-400 hover:bg-gray-500 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg transition-all"
                  >
                    Reset
                  </button>
                </>
              )}
            </div>

            {/* Progress bar */}
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-red-600 h-full transition-all duration-300"
                style={{
                  width: `${
                    ((roomState.currentIndex + 1) /
                      roomState.openingOrder.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
