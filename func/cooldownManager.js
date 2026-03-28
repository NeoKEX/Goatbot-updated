/**
 * Optimized Cooldown Manager with TTL and automatic cleanup
 * Replaces plain objects with Map-based efficient storage
 */

class CooldownManager {
	constructor(options = {}) {
		this.options = {
			defaultCooldown: options.defaultCooldown || 1000, // 1 second
			cleanupInterval: options.cleanupInterval || 60000, // 1 minute
			maxEntries: options.maxEntries || 10000,
			...options
		};

		// Use Map for O(1) operations: commandName -> Map(senderID -> timestamp)
		this.cooldowns = new Map();
		
		// Stats
		this.stats = {
			totalChecks: 0,
			blocked: 0,
			allowed: 0,
			cleanups: 0
		};

		// Start cleanup interval
		this.cleanupTimer = setInterval(() => this._cleanup(), this.options.cleanupInterval);
	}

	/**
	 * Check if user is on cooldown
	 * @param {string} commandName - Command name
	 * @param {string} senderID - User ID
	 * @param {number} customCooldown - Custom cooldown in milliseconds (optional)
	 * @returns {Object} - { onCooldown: boolean, remainingTime: number }
	 */
	checkCooldown(commandName, senderID, customCooldown = null) {
		this.stats.totalChecks++;
		const cooldown = customCooldown || this.options.defaultCooldown;
		const now = Date.now();

		// Get command cooldowns
		let commandCooldowns = this.cooldowns.get(commandName);
		if (!commandCooldowns) {
			// No cooldowns for this command yet
			this.stats.allowed++;
			return { onCooldown: false, remainingTime: 0 };
		}

		// Check specific user
		const timestamp = commandCooldowns.get(senderID);
		if (!timestamp) {
			this.stats.allowed++;
			return { onCooldown: false, remainingTime: 0 };
		}

		const expirationTime = timestamp + cooldown;
		if (now < expirationTime) {
			this.stats.blocked++;
			return {
				onCooldown: true,
				remainingTime: Math.ceil((expirationTime - now) / 1000)
			};
		}

		// Expired - remove and allow
		commandCooldowns.delete(senderID);
		this.stats.allowed++;
		return { onCooldown: false, remainingTime: 0 };
	}

	/**
	 * Set cooldown for user
	 * @param {string} commandName - Command name
	 * @param {string} senderID - User ID
	 */
	setCooldown(commandName, senderID) {
		let commandCooldowns = this.cooldowns.get(commandName);
		if (!commandCooldowns) {
			commandCooldowns = new Map();
			this.cooldowns.set(commandName, commandCooldowns);
		}
		commandCooldowns.set(senderID, Date.now());

		// Prevent memory bloat
		this._checkMaxEntries();
	}

	/**
	 * Get stats
	 */
	getStats() {
		let totalEntries = 0;
		for (const commandCooldowns of this.cooldowns.values()) {
			totalEntries += commandCooldowns.size;
		}

		return {
			...this.stats,
			totalEntries,
			commandCount: this.cooldowns.size
		};
	}

	/**
	 * Clear all cooldowns
	 */
	clear() {
		this.cooldowns.clear();
	}

	/**
	 * Destroy manager
	 */
	destroy() {
		clearInterval(this.cleanupTimer);
		this.clear();
	}

	// Private methods

	_cleanup() {
		const now = Date.now();
		let cleaned = 0;

		for (const [commandName, commandCooldowns] of this.cooldowns) {
			for (const [senderID, timestamp] of commandCooldowns) {
				// Remove entries older than 5 minutes (should be expired by now)
				if (now - timestamp > 300000) {
					commandCooldowns.delete(senderID);
					cleaned++;
				}
			}

			// Remove empty command entries
			if (commandCooldowns.size === 0) {
				this.cooldowns.delete(commandName);
			}
		}

		if (cleaned > 0) {
			this.stats.cleanups += cleaned;
		}

		return cleaned;
	}

	_checkMaxEntries() {
		let totalEntries = 0;
		for (const commandCooldowns of this.cooldowns.values()) {
			totalEntries += commandCooldowns.size;
		}

		if (totalEntries > this.options.maxEntries) {
			// Remove oldest entries
			const entries = [];
			for (const [commandName, commandCooldowns] of this.cooldowns) {
				for (const [senderID, timestamp] of commandCooldowns) {
					entries.push({ commandName, senderID, timestamp });
				}
			}

			// Sort by timestamp (oldest first)
			entries.sort((a, b) => a.timestamp - b.timestamp);

			// Remove oldest 20%
			const toRemove = Math.floor(entries.length * 0.2);
			for (let i = 0; i < toRemove; i++) {
				const { commandName, senderID } = entries[i];
				const commandCooldowns = this.cooldowns.get(commandName);
				if (commandCooldowns) {
					commandCooldowns.delete(senderID);
					if (commandCooldowns.size === 0) {
						this.cooldowns.delete(commandName);
					}
				}
			}
		}
	}
}

// Create singleton instance
const cooldownManager = new CooldownManager();

module.exports = cooldownManager;
