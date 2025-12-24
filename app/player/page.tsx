'use client';

import { useState, useEffect } from 'react';
import { store, ALL_PLAYERS } from '@/lib/store';
import { useRoomState } from '@/lib/hooks/useRoomState';
import { useTimer } from '@/lib/hooks/useTimer';
import { Timer } from '@/components/Timer';
import Link from 'next/link';

export default function PlayerPage() {
  const roomState = useRoomState();
  const [hasEnteredGame, setHasEnteredGame] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [selectedGuess, setSelectedGuess] = useState<string>('');
  const [hasSubmittedThisRound, setHasSubmittedThisRound] = useState(false);

  const currentRecipient = store.getCurrentRecipient();
  const isRecipient = playerName === currentRecipient;
  const roundIndex = roomState.currentIndex;
  const isLastRound =
    roomState.isStarted &&
    roomState.currentIndex >= roomState.openingOrder.length - 1;

  // Track timer state to disable submit button when time runs out
  const { isExpired } = useTimer({
    startedAt: roomState.roundStartedAt,
    durationSec: roomState.durationSec,
  });

  // Check if player is done with all rounds
  const isPlayerDone = isLastRound && (hasSubmittedThisRound || isRecipient);

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
    // Register player as active
    store.registerPlayer(name);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-12">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">👤</div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Enter Your Name
              </h1>
              <p className="text-lg text-gray-600">
                Type your name to start playing
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem('playerName') as HTMLInputElement;
                const name = input.value.trim();
                if (name) {
                  handleSelectPlayer(name);
                }
              }}
              className="space-y-6"
            >
              <input
                type="text"
                name="playerName"
                placeholder="Your name"
                autoFocus
                required
                className="w-full px-6 py-4 text-2xl text-gray-900 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-center placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                Continue
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center mb-4">
                Quick select:
              </p>
              <div className="flex gap-2 justify-center">
                {ALL_PLAYERS.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleSelectPlayer(name)}
                    className="bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-4 py-2 rounded-lg font-semibold transition-all text-sm"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
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
          {isPlayerDone ? (
            // Player is done with all rounds
            <div className="text-center py-12">
              <div className="text-8xl mb-6">🎉</div>
              <div className="text-5xl font-bold text-green-600 mb-6">
                You&apos;re All Done!
              </div>
              <div className="text-2xl text-gray-600 mb-4">
                Great job! You&apos;ve submitted all your guesses.
              </div>
              <div className="text-xl text-gray-500 mb-8">
                {roomState.resultsUnlocked
                  ? 'Results are now available!'
                  : 'Waiting for host to unlock results...'}
              </div>
              {roomState.resultsUnlocked ? (
                <Link
                  href="/results"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
                >
                  📊 View Results
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-block bg-gray-300 text-gray-500 text-2xl font-bold py-4 px-8 rounded-xl shadow-lg cursor-not-allowed"
                >
                  📊 View Results (Locked)
                </button>
              )}
            </div>
          ) : isRecipient ? (
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
                {roomState.openingOrder.filter((name) => name !== currentRecipient).map(
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
