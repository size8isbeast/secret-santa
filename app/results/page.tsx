'use client';

import { useState, useEffect } from 'react';
import { store, ALL_PLAYERS } from '@/lib/store';
import { useRoomState } from '@/lib/hooks/useRoomState';
import Link from 'next/link';

interface Submission {
  player_name: string;
  round_index: number;
  guessed_santa_name: string;
}

export default function ResultsPage() {
  const roomState = useRoomState();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

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
          <Link
            href="/host"
            className="inline-block mt-4 text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Host View
          </Link>
        </div>

        {/* Game Status */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className="text-lg font-bold text-green-600">
                {roomState.isStarted ? 'In Progress' : 'Not Started'}
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
        {Object.keys(submissionsByRound).length === 0 ? (
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
            {Object.keys(submissionsByRound)
              .map(Number)
              .sort((a, b) => a - b)
              .map((roundIndex) => {
                const recipient = roomState.openingOrder[roundIndex] || `Round ${roundIndex + 1}`;
                const roundSubs = submissionsByRound[roundIndex];

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
                              Guessed Santa
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {roundSubs.map((sub, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-3 px-4 font-medium text-gray-800">
                                {sub.player_name}
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                                  {sub.guessed_santa_name}
                                </span>
                              </td>
                            </tr>
                          ))}
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

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchSubmissions}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            🔄 Refresh Results
          </button>
        </div>
      </div>
    </div>
  );
}
