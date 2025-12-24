'use client';

import { useState, useEffect } from 'react';
import { store, ALL_PLAYERS } from '@/lib/store';
import { useRoomState } from '@/lib/hooks/useRoomState';
import { useTimer } from '@/lib/hooks/useTimer';
import { Timer } from '@/components/Timer';

export default function PlayerPage() {
  const roomState = useRoomState();
  const [hasEnteredGame, setHasEnteredGame] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [selectedGuess, setSelectedGuess] = useState<string>('');
  const [hasSubmittedThisRound, setHasSubmittedThisRound] = useState(false);

  const currentRecipient = store.getCurrentRecipient();
  const isRecipient = playerName === currentRecipient;
  const roundIndex = roomState.currentIndex;

  // Track timer state to disable submit button when time runs out
  const { isExpired } = useTimer({
    startedAt: roomState.roundStartedAt,
    durationSec: roomState.durationSec,
  });

  // Debug logging
  useEffect(() => {
    console.log('👤 Player Page Loaded');
    console.log('🎮 Room State:', roomState);
  }, []);

  useEffect(() => {
    console.log('🔄 Room state changed:', roomState);
  }, [roomState]);

  // Check if already submitted for this round
  useEffect(() => {
    if (playerName) {
      const checkSubmission = async () => {
        const submitted = await store.hasSubmitted(playerName, roundIndex);
        setHasSubmittedThisRound(submitted);
      };
      checkSubmission();
    }
  }, [playerName, roundIndex]);

  // Reset guess selection when round changes
  useEffect(() => {
    setSelectedGuess('');
  }, [roundIndex]);

  const handleSelectPlayer = (name: string) => {
    setPlayerName(name);
  };

  const handleSubmitGuess = async () => {
    if (!playerName || !selectedGuess || !currentRecipient) return;

    const success = await store.submitGuess(
      playerName,
      roundIndex,
      selectedGuess
    );

    if (success) {
      setHasSubmittedThisRound(true);
      setSelectedGuess('');
    }
  };

  // Entry screen - temporary button to enter game
  if (!hasEnteredGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <div className="text-8xl mb-6">🎮</div>
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Secret Santa
            </h1>
            <p className="text-2xl text-gray-600 mb-8">
              Player View
            </p>
            <button
              onClick={() => setHasEnteredGame(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-3xl font-bold py-6 px-12 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              Enter Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Identity selection screen
  if (!playerName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Who are you?
            </h1>
            <p className="text-xl text-gray-600">
              Select your name to start playing
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ALL_PLAYERS.map((name) => (
              <button
                key={name}
                onClick={() => handleSelectPlayer(name)}
                className="bg-white hover:bg-blue-100 text-gray-800 text-xl font-semibold py-6 px-4 rounded-xl shadow-lg transition-all transform hover:scale-105 border-2 border-transparent hover:border-blue-500"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Waiting for game to start
  if (!roomState.isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-gray-700 mb-4">
            Hi, <span className="font-bold text-blue-600">{playerName}</span>!
          </div>
          <div className="text-4xl font-bold text-gray-800 mb-8">
            Waiting for host to start the game...
          </div>
          <div className="animate-pulse text-6xl mb-8">⏳</div>

          {/* Mock button for testing */}
          <button
            onClick={() => store.startGame()}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            Start Game (Mock)
          </button>
        </div>
      </div>
    );
  }

  // Active game view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xl text-gray-600 mb-2">
            You are <span className="font-bold text-blue-600">{playerName}</span>
          </div>
          <div className="text-3xl text-gray-700 mb-1">Currently opening:</div>
          <div className="text-6xl font-bold text-red-600 mb-6">
            {currentRecipient}
          </div>
          <div className="flex justify-center">
            <Timer
              startedAt={roomState.roundStartedAt}
              durationSec={roomState.durationSec}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {isRecipient ? (
            // Skip view - player is the recipient
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🎁</div>
              <div className="text-4xl font-bold text-gray-800 mb-4">
                It&apos;s your turn!
              </div>
              <div className="text-2xl text-gray-600 mb-4">
                You&apos;re opening your gift now
              </div>
              <div className="text-lg text-gray-500 italic">
                (You skip submitting this round)
              </div>
            </div>
          ) : hasSubmittedThisRound ? (
            // Already submitted
            <div className="text-center py-12">
              <div className="text-6xl mb-6">✅</div>
              <div className="text-4xl font-bold text-green-600 mb-4">
                Guess Submitted!
              </div>
              <div className="text-xl text-gray-600">
                Waiting for next round...
              </div>
            </div>
          ) : (
            // Submission form
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Who is {currentRecipient}&apos;s Secret Santa?
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {ALL_PLAYERS.filter((name) => name !== currentRecipient).map(
                  (name) => (
                    <button
                      key={name}
                      onClick={() => !isExpired && setSelectedGuess(name)}
                      disabled={isExpired}
                      className={`py-4 px-3 rounded-lg font-semibold transition-all ${
                        isExpired
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : selectedGuess === name
                          ? 'bg-blue-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800 transform hover:scale-105'
                      }`}
                    >
                      {name}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={handleSubmitGuess}
                disabled={!selectedGuess || isExpired}
                className={`w-full text-2xl font-bold py-6 rounded-xl shadow-lg transition-all ${
                  isExpired
                    ? 'bg-red-300 text-red-700 cursor-not-allowed'
                    : selectedGuess
                    ? 'bg-green-600 hover:bg-green-700 text-white transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isExpired
                  ? 'Time\'s Up!'
                  : selectedGuess
                  ? `Submit: ${selectedGuess}`
                  : 'Select a name'}
              </button>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mt-6 text-center text-gray-600">
          Round {roomState.currentIndex + 1} of {roomState.openingOrder.length}
        </div>
      </div>
    </div>
  );
}
