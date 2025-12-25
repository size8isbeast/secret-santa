'use client';

import { useState, useEffect, Suspense } from 'react';
import { store } from '@/lib/store';
import { useRoomState } from '@/lib/hooks/useRoomState';
import { LocalStorage } from '@/lib/localStorage';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function PollContent() {
  const searchParams = useSearchParams();
  const isHost = searchParams.get('role') === 'host';

  const roomState = useRoomState();
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [selectedVote, setSelectedVote] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [allVotes, setAllVotes] = useState<Array<{ voter_name: string; voted_for: string }>>([]);
  const [pollResults, setPollResults] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  // Load player name from localStorage
  useEffect(() => {
    // Reset all state on mount to ensure fresh start
    setSelectedVote('');
    setHasVoted(false);
    setAllVotes([]);
    setPollResults({});
    setShowResults(false);

    const savedName = LocalStorage.getPlayerName();
    if (savedName) {
      setPlayerName(savedName);
      checkVoteStatus(savedName);
    }
  }, []);

  // Fetch votes periodically
  useEffect(() => {
    const fetchVotes = async () => {
      const votes = await store.getAllPollVotes();
      setAllVotes(votes);

      const results = await store.getPollResults();
      setPollResults(results);

      // Show results if all players have voted, otherwise hide results
      const shouldShow = roomState.openingOrder.length > 0 && votes.length >= roomState.openingOrder.length;
      setShowResults(shouldShow);
    };

    fetchVotes();
    const interval = setInterval(fetchVotes, 2000);
    return () => clearInterval(interval);
  }, [roomState.openingOrder.length]);

  const checkVoteStatus = async (name: string) => {
    const voted = await store.hasVoted(name);
    setHasVoted(voted);
  };

  const handleSubmitVote = async () => {
    if (!playerName) {
      alert('Error: Player name is missing. Please refresh and enter your name again.');
      return;
    }

    if (!selectedVote) {
      alert('Please select a player before submitting your vote.');
      return;
    }

    try {
      const success = await store.submitPollVote(playerName, selectedVote);

      if (success) {
        setHasVoted(true);
        setSelectedVote('');
      } else {
        alert('Failed to submit vote. You may have already voted for this poll.');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('An error occurred while submitting your vote.');
    }
  };


  // Check if poll is unlocked
  if (!roomState.pollUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8 flex items-center justify-center">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
              <div className="text-8xl mb-6">🔒</div>
              <h1 className="text-5xl font-bold text-gray-800 mb-6">
                Poll Not Available
              </h1>
              <p className="text-2xl text-gray-600 mb-8">
                The poll has not been unlocked yet. Please wait for the host to start it.
              </p>
              <Link
                href="/results"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                ← Back to Results
              </Link>
            </div>
          </div>
        </div>
    );
  }

  // Host view - can only view results, not vote
  if (isHost) {
    const sortedResults = Object.entries(pollResults)
      .sort(([, a], [, b]) => b - a);
    const winner = sortedResults[0];
    const allPlayersVoted = roomState.openingOrder.length > 0 && allVotes.length >= roomState.openingOrder.length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              🏆 Poll Dashboard (Host)
            </h1>
            <p className="text-xl text-gray-600">
              {allPlayersVoted ? 'Everyone has voted!' : 'Waiting for players to vote...'}
            </p>
          </div>

          {/* Progress */}
          {!allPlayersVoted && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center">
              <div className="text-6xl font-bold text-purple-600 mb-2">
                {allVotes.length} / {roomState.openingOrder.length}
              </div>
              <p className="text-xl text-gray-600">
                {roomState.openingOrder.length - allVotes.length} {roomState.openingOrder.length - allVotes.length === 1 ? 'player' : 'players'} left
              </p>
            </div>
          )}

          {/* Winner Card (if all voted) */}
          {allPlayersVoted && winner && (
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-2xl p-12 mb-8 text-center">
              <div className="text-8xl mb-6">🎁</div>
              <div className="text-6xl font-bold text-white mb-4">
                {winner[0]}
              </div>
              <div className="text-3xl text-white mb-2">
                Best Gift Sender!
              </div>
              <div className="text-2xl text-white/90">
                {winner[1]} {winner[1] === 1 ? 'vote' : 'votes'}
              </div>
            </div>
          )}

          {/* Live Results */}
          {allVotes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                {allPlayersVoted ? 'Final Results' : 'Current Results'}
              </h2>
              <div className="space-y-4">
                {sortedResults.map(([player, votes], index) => (
                  <div
                    key={player}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      allPlayersVoted && index === 0
                        ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-gray-700">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </span>
                      <span className={`text-2xl font-bold ${
                        allPlayersVoted && index === 0 ? 'text-yellow-700' : 'text-gray-800'
                      }`}>
                        {player}
                      </span>
                    </div>
                    <div className={`text-3xl font-bold ${
                      allPlayersVoted && index === 0 ? 'text-yellow-700' : 'text-gray-600'
                    }`}>
                      {votes} {votes === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vote Breakdown */}
          {allVotes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Vote Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allVotes.map((vote, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-700 font-medium">{vote.voter_name}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-purple-600 font-bold">{vote.voted_for}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sweater Poll Buttons */}
          {allPlayersVoted && !roomState.sweaterPollUnlocked && (
            <div className="text-center mb-6">
              <button
                onClick={async () => {
                  await store.unlockSweaterPoll();
                }}
                className="inline-block bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 text-white text-lg font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                🎄 One More Thing...
              </button>
            </div>
          )}

          {allPlayersVoted && roomState.sweaterPollUnlocked && (
            <div className="text-center mb-6">
              <Link
                href="/sweater?role=host"
                className="inline-block bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 text-white text-lg font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                🎄 View Sweater Poll
              </Link>
            </div>
          )}

          {/* Back Button */}
          <div className="text-center">
            <Link
              href="/results?role=host"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              ← Back to Results
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Name entry screen
  if (!playerName) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-12">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎁</div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Best Gift Poll
              </h1>
              <p className="text-lg text-gray-600">
                Enter your name to vote
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem('playerName') as HTMLInputElement;
                const name = input.value.trim();
                if (name) {
                  setPlayerName(name);
                  LocalStorage.savePlayerName(name);
                  checkVoteStatus(name);
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
                className="w-full px-6 py-4 text-2xl text-gray-900 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-center placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-2xl font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
        </div>
      </>
    );
  }

  // Results view
  if (showResults) {
    const sortedResults = Object.entries(pollResults)
      .sort(([, a], [, b]) => b - a);
    const winner = sortedResults[0];

    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              🏆 Poll Results
            </h1>
            <p className="text-xl text-gray-600">
              Everyone has voted!
            </p>
          </div>

          {/* Winner Card */}
          {winner && (
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-2xl p-12 mb-8 text-center">
              <div className="text-8xl mb-6">🎁</div>
              <div className="text-6xl font-bold text-white mb-4">
                {winner[0]}
              </div>
              <div className="text-3xl text-white mb-2">
                Best Gift Sender!
              </div>
              <div className="text-2xl text-white/90">
                {winner[1]} {winner[1] === 1 ? 'vote' : 'votes'}
              </div>
            </div>
          )}

          {/* Sweater Poll Button - Right after winner */}
          {roomState.sweaterPollUnlocked && (
            <div className="text-center mb-8">
              <Link
                href="/sweater"
                className="inline-block bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                🎄 Vote for Ugliest Sweater!
              </Link>
            </div>
          )}

          {/* All Results */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Full Results
            </h2>
            <div className="space-y-4">
              {sortedResults.map(([player, votes], index) => (
                <div
                  key={player}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-gray-700">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <span className={`text-2xl font-bold ${
                      index === 0 ? 'text-yellow-700' : 'text-gray-800'
                    }`}>
                      {player}
                    </span>
                  </div>
                  <div className={`text-3xl font-bold ${
                    index === 0 ? 'text-yellow-700' : 'text-gray-600'
                  }`}>
                    {votes} {votes === 1 ? 'vote' : 'votes'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Who voted for whom */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Vote Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allVotes.map((vote, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-700 font-medium">{vote.voter_name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-purple-600 font-bold">{vote.voted_for}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Back to Results Button */}
          <div className="text-center">
            <Link
              href="/results"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              ← Back to Results
            </Link>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Already voted - waiting screen
  if (hasVoted) {
    const totalPlayers = roomState.openingOrder.length;
    const votedCount = allVotes.length;

    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <div className="text-8xl mb-6">✅</div>
            <h1 className="text-5xl font-bold text-green-600 mb-6">
              Vote Submitted!
            </h1>
            <p className="text-2xl text-gray-600 mb-8">
              Thanks for voting, {playerName}!
            </p>
            <div className="bg-gray-50 rounded-2xl p-8 mb-8">
              <p className="text-xl text-gray-700 mb-4">
                Waiting for other players...
              </p>
              <div className="text-6xl font-bold text-purple-600 mb-2">
                {votedCount} / {totalPlayers}
              </div>
              <p className="text-lg text-gray-500">
                {totalPlayers - votedCount} {totalPlayers - votedCount === 1 ? 'player' : 'players'} left
              </p>
            </div>
            <div className="animate-pulse text-4xl">⏳</div>
          </div>
        </div>
        </div>
      </>
    );
  }

  // Voting screen
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎁</div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Best Gift Sender
          </h1>
          <p className="text-xl text-gray-600">
            Hi, <span className="font-bold text-purple-600">{playerName}</span>!
          </p>
          <p className="text-lg text-gray-500 mt-2">
            Who gave the best gift?
          </p>
        </div>

        {/* Vote Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Cast Your Vote
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {roomState.openingOrder.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedVote(name)}
                className={`py-6 px-4 rounded-xl font-bold text-lg transition-all ${
                  selectedVote === name
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800 transform hover:scale-105'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmitVote}
            disabled={!selectedVote}
            className={`w-full text-2xl font-bold py-6 rounded-xl shadow-lg transition-all ${
              selectedVote
                ? 'bg-purple-600 hover:bg-purple-700 text-white transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {selectedVote ? `Vote for ${selectedVote}` : 'Select a player'}
          </button>
        </div>

        {/* Progress */}
        <div className="mt-6 text-center text-gray-600">
          {allVotes.length} / {roomState.openingOrder.length} players voted
        </div>
      </div>
      </div>
    </>
  );
}

export default function PollPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading poll...</div>
      </div>
    }>
      <PollContent />
    </Suspense>
  );
}
