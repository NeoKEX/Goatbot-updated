/**
 * Analytics Batcher - Reduces database load by batching analytics writes
 */

class AnalyticsBatcher {
	constructor(options = {}) {
		this.options = {
			flushInterval: options.flushInterval || 30000, // 30 seconds
			maxBatchSize: options.maxBatchSize || 100,
			maxRetries: options.maxRetries || 3,
			...options
		};

		this.buffer = new Map(); // commandName -> count
		this.flushTimer = null;
		this.isFlushing = false;
		this.retryCount = new Map();
		this.stats = {
			buffered: 0,
			flushed: 0,
			errors: 0,
			retries: 0
		};

		// Start flush timer
		this._startFlushTimer();
	}

	/**
	 * Record a command call
	 * @param {string} commandName - Command name
	 */
	record(commandName) {
		const current = this.buffer.get(commandName) || 0;
		this.buffer.set(commandName, current + 1);
		this.stats.buffered++;

		// Flush if buffer is full
		if (this.buffer.size >= this.options.maxBatchSize) {
			this.flush();
		}
	}

	/**
	 * Flush analytics to database
	 */
	async flush() {
		if (this.isFlushing || this.buffer.size === 0) {
			return;
		}

		this.isFlushing = true;
		const batch = new Map(this.buffer);
		this.buffer.clear();

		try {
			const globalData = global.db?.globalData;
			if (!globalData) {
				// Database not ready, restore buffer
				for (const [command, count] of batch) {
					const current = this.buffer.get(command) || 0;
					this.buffer.set(command, current + count);
				}
				return;
			}

			// Get current analytics
			const analytics = await globalData.get("analytics", "data", {});

			// Merge with buffer
			for (const [commandName, count] of batch) {
				analytics[commandName] = (analytics[commandName] || 0) + count;
			}

			// Save back
			await globalData.set("analytics", analytics, "data");

			this.stats.flushed += batch.size;
			this.retryCount.clear();

		} catch (err) {
			this.stats.errors++;

			// Check retry count
			const retryKey = Array.from(batch.keys()).join(',');
			const retries = this.retryCount.get(retryKey) || 0;

			if (retries < this.options.maxRetries) {
				// Restore buffer for retry
				for (const [command, count] of batch) {
					const current = this.buffer.get(command) || 0;
					this.buffer.set(command, current + count);
				}
				this.retryCount.set(retryKey, retries + 1);
				this.stats.retries++;
			}
		} finally {
			this.isFlushing = false;
		}
	}

	/**
	 * Force immediate flush
	 */
	async forceFlush() {
		// Clear timer
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
		}
		await this.flush();
	}

	/**
	 * Get stats
	 */
	getStats() {
		return {
			...this.stats,
			bufferSize: this.buffer.size,
			isFlushing: this.isFlushing,
			buffer: Object.fromEntries(this.buffer)
		};
	}

	/**
	 * Start flush timer
	 */
	_startFlushTimer() {
		this.flushTimer = setInterval(() => {
			this.flush();
		}, this.options.flushInterval);
	}

	/**
	 * Destroy batcher
	 */
	async destroy() {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
		}
		await this.forceFlush();
	}
}

// Create singleton
const analyticsBatcher = new AnalyticsBatcher();

module.exports = analyticsBatcher;
