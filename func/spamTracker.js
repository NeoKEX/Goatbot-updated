/**
 * Optimized Spam Tracker with TTL and Memory-efficient data structures
 * Replaces inefficient array filtering with Map-based TTL tracking
 * @author neoaz07 (NeoKEX)
 */

class SpamTracker {
	constructor(options = {}) {
		this.options = {
			commandThreshold: options.commandThreshold || 8,
			timeWindow: options.timeWindow || 10000, // 10 seconds in ms
			banDuration: options.banDuration || 24 * 60 * 60 * 1000, // 24 hours
			maxEntries: options.maxEntries || 1000,
			cleanupInterval: options.cleanupInterval || 60000, // 1 minute
			...options
		};

		// Use Map for O(1) operations instead of array O(n) filtering
		this.threadActivity = new Map();
		this.bannedThreads = new Map();

		// Stats
		this.stats = {
			violations: 0,
			bans: 0,
			unbans: 0,
			cleanups: 0
		};

		// Start cleanup interval
		this.cleanupTimer = setInterval(() => this._cleanup(), this.options.cleanupInterval);
	}

	/**
	 * Track command usage for a thread
	 * @param {string} threadID - Thread ID
	 * @param {string} commandName - Command name
	 * @returns {Object} - { isBanned: boolean, violations: number, shouldBan: boolean }
	 */
	trackCommand(threadID, commandName) {
		const now = Date.now();

		// Check if already banned
		if (this._isBanned(threadID)) {
			return { isBanned: true, violations: 0, shouldBan: false };
		}

		// Get or create thread tracking data
		let threadData = this.threadActivity.get(threadID);
		if (!threadData) {
			threadData = {
				commands: [],
				firstActivity: now,
				lastActivity: now
			};
			this.threadActivity.set(threadID, threadData);
		}

		// Add new command entry
		threadData.commands.push({
			command: commandName,
			timestamp: now
		});

		threadData.lastActivity = now;

		// Remove old entries outside time window (efficient - only check from start)
		const cutoff = now - this.options.timeWindow;
		while (threadData.commands.length > 0 && threadData.commands[0].timestamp < cutoff) {
			threadData.commands.shift();
		}

		// Check threshold
		const violationCount = threadData.commands.length;
		const shouldBan = violationCount >= this.options.commandThreshold;

		if (shouldBan) {
			this._banThread(threadID);
			this.stats.violations++;
		}

		return {
			isBanned: false,
			violations: violationCount,
			shouldBan
		};
	}

	/**
	 * Check if thread is banned
	 * @param {string} threadID - Thread ID
	 * @returns {boolean}
	 */
	isBanned(threadID) {
		return this._isBanned(threadID);
	}

	/**
	 * Get ban info for a thread
	 * @param {string} threadID - Thread ID
	 * @returns {Object|null} - Ban info or null if not banned
	 */
	getBanInfo(threadID) {
		const banData = this.bannedThreads.get(threadID);
		if (!banData) return null;

		const now = Date.now();
		if (now > banData.expireTime) {
			this._unbanThread(threadID);
			return null;
		}

		return {
			bannedAt: banData.bannedAt,
			expireTime: banData.expireTime,
			remainingTime: banData.expireTime - now,
			reason: banData.reason,
			threadName: banData.threadName
		};
	}

	/**
	 * Manually ban a thread
	 * @param {string} threadID - Thread ID
	 * @param {string} reason - Ban reason
	 * @param {number} duration - Ban duration in ms (optional)
	 * @returns {boolean}
	 */
	banThread(threadID, reason = 'Manual ban', duration = null) {
		const banDuration = duration || this.options.banDuration;
		const now = Date.now();

		this.bannedThreads.set(threadID, {
			bannedAt: now,
			expireTime: now + banDuration,
			reason,
			threadName: null
		});

		// Clear activity data
		this.threadActivity.delete(threadID);
		this.stats.bans++;

		return true;
	}

	/**
	 * Unban a thread
	 * @param {string} threadID - Thread ID
	 * @returns {boolean}
	 */
	unbanThread(threadID) {
		if (this.bannedThreads.has(threadID)) {
			this._unbanThread(threadID);
			return true;
		}
		return false;
	}

	/**
	 * Get all banned threads
	 * @returns {Array} - List of banned thread info
	 */
	getAllBans() {
		const now = Date.now();
		const bans = [];

		for (const [threadID, banData] of this.bannedThreads) {
			if (now > banData.expireTime) {
				this._unbanThread(threadID);
			} else {
				bans.push({
					threadID,
					...banData,
					remainingTime: banData.expireTime - now
				});
			}
		}

		return bans;
	}

	/**
	 * Get thread activity stats
	 * @param {string} threadID - Thread ID
	 * @returns {Object|null}
	 */
	getThreadStats(threadID) {
		const threadData = this.threadActivity.get(threadID);
		if (!threadData) return null;

		const now = Date.now();
		const cutoff = now - this.options.timeWindow;
		const recentCommands = threadData.commands.filter(c => c.timestamp >= cutoff);

		return {
			totalCommands: threadData.commands.length,
			recentCommands: recentCommands.length,
			firstActivity: threadData.firstActivity,
			lastActivity: threadData.lastActivity,
			commandsInWindow: recentCommands.map(c => c.command)
		};
	}

	/**
	 * Get tracker statistics
	 * @returns {Object}
	 */
	getStats() {
		return {
			...this.stats,
			trackedThreads: this.threadActivity.size,
			bannedThreads: this.bannedThreads.size,
			memoryUsage: process.memoryUsage().heapUsed
		};
	}

	/**
	 * Reset all tracking data
	 */
	reset() {
		this.threadActivity.clear();
		this.bannedThreads.clear();
		this.stats = { violations: 0, bans: 0, unbans: 0, cleanups: 0 };
	}

	/**
	 * Destroy tracker and cleanup
	 */
	destroy() {
		clearInterval(this.cleanupTimer);
		this.reset();
	}

	// Private methods

	_isBanned(threadID) {
		const banData = this.bannedThreads.get(threadID);
		if (!banData) return false;

		const now = Date.now();
		if (now > banData.expireTime) {
			this._unbanThread(threadID);
			return false;
		}

		return true;
	}

	_banThread(threadID) {
		const now = Date.now();
		this.bannedThreads.set(threadID, {
			bannedAt: now,
			expireTime: now + this.options.banDuration,
			reason: 'Command spam flood detected',
			threadName: null
		});

		// Clear activity data to free memory
		this.threadActivity.delete(threadID);
		this.stats.bans++;
	}

	_unbanThread(threadID) {
		this.bannedThreads.delete(threadID);
		this.stats.unbans++;
	}

	_cleanup() {
		const now = Date.now();
		let cleaned = 0;

		// Clean expired bans
		for (const [threadID, banData] of this.bannedThreads) {
			if (now > banData.expireTime) {
				this._unbanThread(threadID);
				cleaned++;
			}
		}

		// Clean old activity data
		const cutoff = now - this.options.timeWindow * 2; // 2x window for safety
		for (const [threadID, threadData] of this.threadActivity) {
			if (threadData.lastActivity < cutoff) {
				this.threadActivity.delete(threadID);
				cleaned++;
			} else {
				// Also clean old command entries
				while (threadData.commands.length > 0 && threadData.commands[0].timestamp < cutoff) {
					threadData.commands.shift();
				}
			}
		}

		// Prevent memory bloat - hard limit on entries
		if (this.threadActivity.size > this.options.maxEntries) {
			const entries = Array.from(this.threadActivity.entries());
			entries.sort((a, b) => a[1].lastActivity - b[1].lastActivity);

			const toDelete = entries.slice(0, entries.length - this.options.maxEntries);
			for (const [threadID] of toDelete) {
				this.threadActivity.delete(threadID);
				cleaned++;
			}
		}

		if (cleaned > 0) {
			this.stats.cleanups += cleaned;
		}

		return cleaned;
	}
}

module.exports = SpamTracker;
