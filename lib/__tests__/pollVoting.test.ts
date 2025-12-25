import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore } from '../mockStore';

describe('Poll Voting System', () => {
  beforeEach(async () => {
    // Reset the store before each test
    await mockStore.reset();
  });

  describe('Gift Poll', () => {
    it('should allow a player to submit a vote', async () => {
      const result = mockStore.submitPollVote('Alice', 'Bob');
      expect(result).toBe(true);
    });

    it('should prevent duplicate votes from the same player', async () => {
      mockStore.submitPollVote('Alice', 'Bob');
      const result = mockStore.submitPollVote('Alice', 'Charlie');
      expect(result).toBe(false);
    });

    it('should correctly track if a player has voted', async () => {
      expect(mockStore.hasVoted('Alice')).toBe(false);

      mockStore.submitPollVote('Alice', 'Bob');

      expect(mockStore.hasVoted('Alice')).toBe(true);
    });

    it('should return all poll votes', async () => {
      mockStore.submitPollVote('Alice', 'Bob');
      mockStore.submitPollVote('Bob', 'Alice');

      const votes = mockStore.getAllPollVotes();

      expect(votes).toHaveLength(2);
      expect(votes).toEqual([
        { voter_name: 'Alice', voted_for: 'Bob' },
        { voter_name: 'Bob', voted_for: 'Alice' },
      ]);
    });

    it('should calculate poll results correctly', async () => {
      mockStore.submitPollVote('Alice', 'Bob');
      mockStore.submitPollVote('Charlie', 'Bob');
      mockStore.submitPollVote('David', 'Alice');

      const results = mockStore.getPollResults();

      expect(results).toEqual({
        'Bob': 2,
        'Alice': 1,
      });
    });

    it('should clear votes after reset', async () => {
      mockStore.submitPollVote('Alice', 'Bob');
      mockStore.submitPollVote('Bob', 'Alice');

      expect(mockStore.getAllPollVotes()).toHaveLength(2);

      await mockStore.reset();

      expect(mockStore.getAllPollVotes()).toHaveLength(0);
      expect(mockStore.hasVoted('Alice')).toBe(false);
      expect(mockStore.hasVoted('Bob')).toBe(false);
    });

    it('should allow voting again after reset', async () => {
      mockStore.submitPollVote('Alice', 'Bob');
      expect(mockStore.hasVoted('Alice')).toBe(true);

      await mockStore.reset();

      expect(mockStore.hasVoted('Alice')).toBe(false);
      const result = mockStore.submitPollVote('Alice', 'Charlie');
      expect(result).toBe(true);
      expect(mockStore.hasVoted('Alice')).toBe(true);
    });
  });

  describe('Sweater Poll', () => {
    it('should allow a player to submit a sweater vote', async () => {
      const result = mockStore.submitSweaterVote('Alice', 'Bob');
      expect(result).toBe(true);
    });

    it('should prevent duplicate sweater votes from the same player', async () => {
      mockStore.submitSweaterVote('Alice', 'Bob');
      const result = mockStore.submitSweaterVote('Alice', 'Charlie');
      expect(result).toBe(false);
    });

    it('should correctly track if a player has voted for sweater', async () => {
      expect(mockStore.hasSweaterVoted('Alice')).toBe(false);

      mockStore.submitSweaterVote('Alice', 'Bob');

      expect(mockStore.hasSweaterVoted('Alice')).toBe(true);
    });

    it('should return all sweater votes', async () => {
      mockStore.submitSweaterVote('Alice', 'Bob');
      mockStore.submitSweaterVote('Bob', 'Alice');

      const votes = mockStore.getAllSweaterVotes();

      expect(votes).toHaveLength(2);
      expect(votes).toEqual([
        { voter_name: 'Alice', voted_for: 'Bob' },
        { voter_name: 'Bob', voted_for: 'Alice' },
      ]);
    });

    it('should calculate sweater poll results correctly', async () => {
      mockStore.submitSweaterVote('Alice', 'Bob');
      mockStore.submitSweaterVote('Charlie', 'Bob');
      mockStore.submitSweaterVote('David', 'Alice');

      const results = mockStore.getSweaterPollResults();

      expect(results).toEqual({
        'Bob': 2,
        'Alice': 1,
      });
    });

    it('should clear sweater votes after reset', async () => {
      mockStore.submitSweaterVote('Alice', 'Bob');
      mockStore.submitSweaterVote('Bob', 'Alice');

      expect(mockStore.getAllSweaterVotes()).toHaveLength(2);

      await mockStore.reset();

      expect(mockStore.getAllSweaterVotes()).toHaveLength(0);
      expect(mockStore.hasSweaterVoted('Alice')).toBe(false);
      expect(mockStore.hasSweaterVoted('Bob')).toBe(false);
    });

    it('should allow sweater voting again after reset', async () => {
      mockStore.submitSweaterVote('Alice', 'Bob');
      expect(mockStore.hasSweaterVoted('Alice')).toBe(true);

      await mockStore.reset();

      expect(mockStore.hasSweaterVoted('Alice')).toBe(false);
      const result = mockStore.submitSweaterVote('Alice', 'Charlie');
      expect(result).toBe(true);
      expect(mockStore.hasSweaterVoted('Alice')).toBe(true);
    });
  });

  describe('Poll Independence', () => {
    it('should keep gift poll and sweater poll votes separate', async () => {
      // Vote in gift poll
      mockStore.submitPollVote('Alice', 'Bob');

      // Vote in sweater poll
      mockStore.submitSweaterVote('Alice', 'Charlie');

      // Check both polls independently
      expect(mockStore.hasVoted('Alice')).toBe(true);
      expect(mockStore.hasSweaterVoted('Alice')).toBe(true);

      const giftVotes = mockStore.getAllPollVotes();
      const sweaterVotes = mockStore.getAllSweaterVotes();

      expect(giftVotes).toHaveLength(1);
      expect(sweaterVotes).toHaveLength(1);
      expect(giftVotes[0].voted_for).toBe('Bob');
      expect(sweaterVotes[0].voted_for).toBe('Charlie');
    });

    it('should allow same player to vote in both polls', async () => {
      const giftResult = mockStore.submitPollVote('Alice', 'Bob');
      const sweaterResult = mockStore.submitSweaterVote('Alice', 'Bob');

      expect(giftResult).toBe(true);
      expect(sweaterResult).toBe(true);
      expect(mockStore.hasVoted('Alice')).toBe(true);
      expect(mockStore.hasSweaterVoted('Alice')).toBe(true);
    });

    it('should reset both polls independently', async () => {
      mockStore.submitPollVote('Alice', 'Bob');
      mockStore.submitSweaterVote('Alice', 'Charlie');

      await mockStore.reset();

      // Both should be cleared
      expect(mockStore.getAllPollVotes()).toHaveLength(0);
      expect(mockStore.getAllSweaterVotes()).toHaveLength(0);
      expect(mockStore.hasVoted('Alice')).toBe(false);
      expect(mockStore.hasSweaterVoted('Alice')).toBe(false);
    });
  });

  describe('Poll Unlock State', () => {
    it('should start with polls locked', async () => {
      const state = mockStore.getRoomState();
      expect(state.pollUnlocked).toBe(false);
      expect(state.sweaterPollUnlocked).toBe(false);
    });

    it('should unlock gift poll when host calls unlockPoll', async () => {
      mockStore.unlockPoll();

      const state = mockStore.getRoomState();
      expect(state.pollUnlocked).toBe(true);
    });

    it('should unlock sweater poll when host calls unlockSweaterPoll', async () => {
      mockStore.unlockSweaterPoll();

      const state = mockStore.getRoomState();
      expect(state.sweaterPollUnlocked).toBe(true);
    });

    it('should lock polls again after reset', async () => {
      mockStore.unlockPoll();
      mockStore.unlockSweaterPoll();

      await mockStore.reset();

      const state = mockStore.getRoomState();
      expect(state.pollUnlocked).toBe(false);
      expect(state.sweaterPollUnlocked).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty vote retrieval', async () => {
      const giftVotes = mockStore.getAllPollVotes();
      const sweaterVotes = mockStore.getAllSweaterVotes();

      expect(giftVotes).toEqual([]);
      expect(sweaterVotes).toEqual([]);
    });

    it('should handle empty results calculation', async () => {
      const giftResults = mockStore.getPollResults();
      const sweaterResults = mockStore.getSweaterPollResults();

      expect(giftResults).toEqual({});
      expect(sweaterResults).toEqual({});
    });

    it('should handle vote checking for non-existent player', async () => {
      expect(mockStore.hasVoted('NonExistentPlayer')).toBe(false);
      expect(mockStore.hasSweaterVoted('NonExistentPlayer')).toBe(false);
    });

    it('should handle multiple votes for same person', async () => {
      mockStore.submitPollVote('Alice', 'Bob');
      mockStore.submitPollVote('Charlie', 'Bob');
      mockStore.submitPollVote('David', 'Bob');

      const results = mockStore.getPollResults();
      expect(results['Bob']).toBe(3);
    });

    it('should preserve vote integrity across multiple resets', async () => {
      // First game
      mockStore.submitPollVote('Alice', 'Bob');
      expect(mockStore.getAllPollVotes()).toHaveLength(1);

      await mockStore.reset();

      // Second game
      mockStore.submitPollVote('Charlie', 'David');
      expect(mockStore.getAllPollVotes()).toHaveLength(1);
      expect(mockStore.getAllPollVotes()[0].voter_name).toBe('Charlie');

      await mockStore.reset();

      // Third game - should be completely clean
      expect(mockStore.getAllPollVotes()).toHaveLength(0);
    });
  });
});
