'use client';

import { useState, useEffect, Suspense } from 'react';
import { store, ALL_PLAYERS } from '@/lib/store';
import { useRoomState } from '@/lib/hooks/useRoomState';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Submission {
  player_name: string;
  round_index: number;
  guessed_santa_name: string;
  guessed_santas?: string[];
  game_mode?: 'risk' | 'safe';
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const isHost = searchParams.get('role') === 'host';

  const roomState = useRoomState();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [actualSantas, setActualSantas] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const isGameFinished =
    roomState.isStarted &&
    roomState.currentIndex >= roomState.openingOrder.length - 1;

  useEffect(() => {
    fetchSubmissions();
    fetchActualSantas();

    // If host visits, unlock results for players
    if (isHost) {
      store.unlockResults();
    }
  }, [isHost]);

  const fetchActualSantas = async () => {
    const santas = await store.getAllActualSantas();
    setActualSantas(santas);
  };

  const handleSetActualSanta = async (roundIndex: number, santaName: string) => {
    await store.setActualSanta(roundIndex, santaName);
    await fetchActualSantas();
  };

  // Calculate points for each player
  const calculatePoints = (): Record<string, number> => {
    const points: Record<string, number> = {};

    // Initialize all players with 0 points
    roomState.openingOrder.forEach((player) => {
      points[player] = 0;
    });

    // Award points for correct guesses
    submissions.forEach((sub) => {
      const actualSanta = actualSantas[sub.round_index];
      if (!actualSanta) return;

      const gameMode = sub.game_mode || 'risk';
      const guesses = sub.guessed_santas || [sub.guessed_santa_name];

      // Check if any of the guesses match the actual Santa
      const isCorrect = guesses.includes(actualSanta);

      if (isCorrect) {
        // Check if this player was the recipient for this round
        const recipient = roomState.openingOrder[sub.round_index];
        const isRecipient = sub.player_name === recipient;

        let pointsToAdd = 1; // Default for other players

        if (isRecipient) {
          // Recipient used game modes: Risk = 3 points, Safe = 1 point
          pointsToAdd = gameMode === 'risk' ? 3 : 1;
        }

        points[sub.player_name] = (points[sub.player_name] || 0) + pointsToAdd;
      }
    });

    return points;
  };

  const fetchSubmissions = async () => {
    try {
      const data = await store.getAllSubmissions();
      setSubmissions(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setLoading(false);
    }
  };

  // Group submissions by round
  const submissionsByRound = submissions.reduce((acc, sub) => {
    if (!acc[sub.round_index]) {
      acc[sub.round_index] = [];
    }
    acc[sub.round_index].push(sub);
    return acc;
  }, {} as Record<number, Submission[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🎁 Results Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            See who guessed who for each round
          </p>
          {isHost && (
            <Link
              href="/host"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to Host View
            </Link>
          )}
        </div>

        {/* Points Leaderboard */}
        {roomState.openingOrder.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-xl p-6 mb-6 border-2 border-yellow-300">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
              🏆 Leaderboard
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(calculatePoints())
                .sort(([, a], [, b]) => b - a)
                .map(([player, points], index) => (
                  <div
                    key={player}
                    className={`p-4 rounded-xl shadow-md ${
                      index === 0
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white'
                        : index === 1
                        ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
                        : index === 2
                        ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                        : 'bg-white text-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </span>
                        <span className="font-semibold truncate">{player}</span>
                      </div>
                      <span className="text-2xl font-bold">{points}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Game Status */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className={`text-lg font-bold ${
                isGameFinished ? 'text-purple-600' :
                roomState.isStarted ? 'text-green-600' :
                'text-gray-600'
              }`}>
                {isGameFinished ? 'Finished' : roomState.isStarted ? 'In Progress' : 'Not Started'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Current Round</div>
              <div className="text-lg font-bold text-blue-600">
                {roomState.currentIndex + 1} / {roomState.openingOrder.length || ALL_PLAYERS.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Submissions</div>
              <div className="text-lg font-bold text-purple-600">
                {submissions.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Players</div>
              <div className="text-lg font-bold text-gray-800">
                {roomState.openingOrder.length || ALL_PLAYERS.length}
              </div>
            </div>
          </div>
        </div>

        {/* Opening Order */}
        {roomState.isStarted && roomState.openingOrder.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Opening Order
            </h2>
            <div className="flex flex-wrap gap-3">
              {roomState.openingOrder.map((name, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  {index + 1}. {name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submissions by Round */}
        {!roomState.isStarted || roomState.openingOrder.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <div className="text-2xl font-bold text-gray-800 mb-2">
              No submissions yet
            </div>
            <div className="text-lg text-gray-600">
              Start the game and players will submit their guesses
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {roomState.openingOrder.map((recipient, roundIndex) => {
                const roundSubs = submissionsByRound[roundIndex] || [];

                return (
                  <div
                    key={roundIndex}
                    className="bg-white rounded-2xl shadow-xl p-6"
                  >
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      Round {roundIndex + 1}: {recipient} opens their gift
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                              Player
                            </th>
                            <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                              Guessed Santa(s)
                            </th>
                            <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                              Mode
                            </th>
                            <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                              Actual Santa
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {roundSubs.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-gray-500 italic">
                                No submissions yet for this round
                              </td>
                              <td className="py-3 px-4">
                                {isHost ? (
                                  <select
                                    value={actualSantas[roundIndex] || ''}
                                    onChange={(e) => handleSetActualSanta(roundIndex, e.target.value)}
                                    className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-800 focus:outline-none focus:border-blue-500 bg-white w-full"
                                  >
                                    <option value="">Select...</option>
                                    {roomState.openingOrder
                                      .filter((name) => name !== recipient)
                                      .map((name) => (
                                        <option key={name} value={name}>
                                          {name}
                                        </option>
                                      ))}
                                  </select>
                                ) : actualSantas[roundIndex] ? (
                                  <span className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-bold">
                                    {actualSantas[roundIndex]}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">Not set</span>
                                )}
                              </td>
                            </tr>
                          ) : null}
                          {(() => {
                            const actualSanta = actualSantas[roundIndex];
                            return roundSubs.map((sub, idx) => {
                              const gameMode = sub.game_mode || 'risk';
                              const guesses = sub.guessed_santas || [sub.guessed_santa_name];
                              const isCorrect = actualSanta && guesses.includes(actualSanta);

                              // Check if this player was the recipient
                              const isRecipient = sub.player_name === recipient;

                              // Calculate points: recipients use game modes, others get 1 point
                              let pointsAwarded = 0;
                              if (isCorrect) {
                                if (isRecipient) {
                                  pointsAwarded = gameMode === 'risk' ? 3 : 1;
                                } else {
                                  pointsAwarded = 1; // Regular mode for other players
                                }
                              }

                              return (
                                <tr
                                  key={idx}
                                  className={`border-b border-gray-100 ${
                                    isCorrect
                                      ? 'bg-green-50 hover:bg-green-100'
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <td className="py-3 px-4">
                                    <span className={`inline-block px-3 py-1 rounded-lg font-semibold ${
                                      isCorrect
                                        ? 'bg-green-200 text-green-900'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {sub.player_name}
                                      {isCorrect && ` (+${pointsAwarded})`}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-wrap gap-2">
                                      {guesses.map((guess, gIdx) => {
                                        const isThisGuessCorrect = actualSanta && guess === actualSanta;
                                        return (
                                          <span
                                            key={gIdx}
                                            className={`inline-block px-3 py-1 rounded-full font-medium ${
                                              isThisGuessCorrect
                                                ? 'bg-green-500 text-white'
                                                : 'bg-blue-100 text-blue-800'
                                            }`}
                                          >
                                            {guess}
                                            {isThisGuessCorrect && ' ✓'}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    {isRecipient ? (
                                      <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${
                                        gameMode === 'risk'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {gameMode === 'risk' ? '🎯 Risk' : '🛡️ Safe'}
                                      </span>
                                    ) : (
                                      <span className="inline-block px-3 py-1 rounded-lg text-sm font-bold bg-gray-100 text-gray-700">
                                        Regular
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {idx === 0 ? (
                                      // Only show dropdown in first row
                                      isHost ? (
                                        <select
                                          value={actualSantas[roundIndex] || ''}
                                          onChange={(e) => handleSetActualSanta(roundIndex, e.target.value)}
                                          className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-800 focus:outline-none focus:border-blue-500 bg-white w-full"
                                        >
                                          <option value="">Select...</option>
                                          {roomState.openingOrder
                                            .filter((name) => name !== recipient)
                                            .map((name) => (
                                              <option key={name} value={name}>
                                                {name}
                                              </option>
                                            ))}
                                        </select>
                                      ) : actualSantas[roundIndex] ? (
                                        <span className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-bold">
                                          {actualSantas[roundIndex]}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic">Not set</span>
                                      )
                                    ) : null}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Show who didn't submit */}
                    {roomState.openingOrder.length > 0 && (
                      <div className="mt-4">
                        {(() => {
                          const submitted = new Set(
                            roundSubs.map((s) => s.player_name)
                          );
                          const notSubmitted = roomState.openingOrder.filter(
                            (name) => name !== recipient && !submitted.has(name)
                          );

                          if (notSubmitted.length > 0) {
                            return (
                              <div className="text-sm text-gray-500">
                                <span className="font-semibold">
                                  Did not submit:
                                </span>{' '}
                                {notSubmitted.join(', ')}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={fetchSubmissions}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            🔄 Refresh Results
          </button>

          {isGameFinished && isHost && !roomState.pollUnlocked && (
            <button
              onClick={async () => {
                await store.unlockPoll();
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              ✨ One More Thing...
            </button>
          )}

          {isGameFinished && isHost && roomState.pollUnlocked && (
            <Link
              href="/poll?role=host"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105 inline-block"
            >
              📊 View Poll
            </Link>
          )}

          {isGameFinished && !isHost && roomState.pollUnlocked && (
            <Link
              href="/poll"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105 inline-block"
            >
              ✨ Vote for Best Gift!
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading results...</div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
