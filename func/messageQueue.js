/**
 * High-Performance Message Queue System for GoatBot
 * Features: Priority queuing, batch processing, load balancing, deduplication
 * @author neoaz07 (NeoKEX)
 */

class MessageQueue extends require('events').EventEmitter {
	constructor(options = {}) {
		super();
		this.options = {
			maxQueueSize: options.maxQueueSize || 1000,
			batchSize: options.batchSize || 5,
			processingDelay: options.processingDelay || 50,
			maxConcurrent: options.maxConcurrent || 3,
			priorityLevels: options.priorityLevels || 5, // 1 = highest
			...options
		};

		// Priority queues (1 = highest priority, 5 = lowest)
		this.queues = Array.from({ length: this.options.priorityLevels }, () => []);
		this.processing = false;
		this.paused = false;
		this.stats = {
			processed: 0,
			dropped: 0,
			errors: 0,
			startTime: Date.now()
		};

		// Deduplication
		this.recentMessages = new Map();
		this.dedupWindow = 5000; // 5 seconds

		// Rate limiting per thread
		this.threadRateLimits = new Map();
		this.threadWindow = 1000; // 1 second
		this.threadMaxRequests = 10;

		// Worker pool
		this.workers = new Set();
		this.workerQueue = [];
	}

	/**
	 * Add message to queue with priority
	 * @param {Object} message - Message object
	 * @param {number} priority - Priority level (1 = highest, 5 = lowest)
	 * @returns {boolean} - Whether message was added
	 */
	enqueue(message, priority = 3) {
		// Check for duplicates
		if (this._isDuplicate(message)) {
			return false;
		}

		// Check queue size
		const totalSize = this.queues.reduce((sum, q) => sum + q.length, 0);
		if (totalSize >= this.options.maxQueueSize) {
			// Drop lowest priority oldest message
			this._dropOldestLowPriority();
		}

		// Normalize priority
		priority = Math.max(1, Math.min(this.options.priorityLevels, priority));

		// Add timestamp and ID
		message._queueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		message._enqueueTime = Date.now();

		// Add to appropriate queue
		this.queues[priority - 1].push(message);

		// Start processing if not already running
		if (!this.processing && !this.paused) {
			this._startProcessing();
		}

		return true;
	}

	/**
	 * Process messages from queue
	 */
	async _startProcessing() {
		if (this.processing || this.paused) return;
		this.processing = true;

		while (!this.paused) {
			const batch = this._getNextBatch();
			if (batch.length === 0) break;

			// Process batch concurrently with limit
			const chunks = this._chunkArray(batch, this.options.maxConcurrent);

			for (const chunk of chunks) {
				await Promise.allSettled(
					chunk.map(msg => this._processMessage(msg))
				);
			}

			// Small delay to prevent event loop starvation
			await this._delay(this.options.processingDelay);
		}

		this.processing = false;
	}

	/**
	 * Process single message with error handling
	 */
	async _processMessage(message) {
		try {
			// Check thread rate limit
			if (message.threadID && this._isThreadRateLimited(message.threadID)) {
				// Requeue with delay
				setTimeout(() => this.enqueue(message, 5), this.threadWindow);
				return;
			}

			// Mark thread as having recent activity
			if (message.threadID) {
				this._incrementThreadRateLimit(message.threadID);
			}

			// Calculate wait time
			const waitTime = Date.now() - message._enqueueTime;
			message._waitTime = waitTime;

			// Emit for handlers
			this.emit('message', message);
			this.stats.processed++;

		} catch (error) {
			this.stats.errors++;
			this.emit('error', error, message);
		}
	}

	/**
	 * Get next batch of messages (priority-based)
	 */
	_getNextBatch() {
		const batch = [];

		// Take from highest priority first
		for (let i = 0; i < this.queues.length && batch.length < this.options.batchSize; i++) {
			const queue = this.queues[i];
			while (queue.length > 0 && batch.length < this.options.batchSize) {
				batch.push(queue.shift());
			}
		}

		return batch;
	}

	/**
	 * Check if message is duplicate
	 */
	_isDuplicate(message) {
		const key = `${message.threadID}_${message.senderID}_${message.body}`;
		const now = Date.now();

		// Clean old entries
		for (const [k, time] of this.recentMessages) {
			if (now - time > this.dedupWindow) {
				this.recentMessages.delete(k);
			}
		}

		if (this.recentMessages.has(key)) {
			return true;
		}

		this.recentMessages.set(key, now);
		return false;
	}

	/**
	 * Drop oldest message from lowest priority queue
	 */
	_dropOldestLowPriority() {
		for (let i = this.queues.length - 1; i >= 0; i--) {
			if (this.queues[i].length > 0) {
				this.queues[i].shift();
				this.stats.dropped++;
				return;
			}
		}
	}

	/**
	 * Check thread rate limit
	 */
	_isThreadRateLimited(threadID) {
		const data = this.threadRateLimits.get(threadID);
		if (!data) return false;

		const now = Date.now();
		if (now - data.windowStart > this.threadWindow) {
			return false;
		}

		return data.count >= this.threadMaxRequests;
	}

	/**
	 * Increment thread rate limit counter
	 */
	_incrementThreadRateLimit(threadID) {
		const now = Date.now();
		const data = this.threadRateLimits.get(threadID);

		if (!data || now - data.windowStart > this.threadWindow) {
			this.threadRateLimits.set(threadID, {
				count: 1,
				windowStart: now
			});
		} else {
			data.count++;
		}

		// Clean old entries periodically
		if (this.threadRateLimits.size > 1000) {
			for (const [id, d] of this.threadRateLimits) {
				if (now - d.windowStart > this.threadWindow * 2) {
					this.threadRateLimits.delete(id);
				}
			}
		}
	}

	/**
	 * Pause queue processing
	 */
	pause() {
		this.paused = true;
		this.emit('paused');
	}

	/**
	 * Resume queue processing
	 */
	resume() {
		this.paused = false;
		this.emit('resumed');
		if (!this.processing) {
			this._startProcessing();
		}
	}

	/**
	 * Get queue statistics
	 */
	getStats() {
		const queueSizes = this.queues.map((q, i) => ({
			priority: i + 1,
			size: q.length
		}));

		return {
			...this.stats,
			queueSizes,
			totalQueued: queueSizes.reduce((sum, q) => sum + q.size, 0),
			isProcessing: this.processing,
			isPaused: this.paused,
			uptime: Date.now() - this.stats.startTime
		};
	}

	/**
	 * Clear all queues
	 */
	clear() {
		this.queues.forEach(q => q.length = 0);
		this.recentMessages.clear();
		this.threadRateLimits.clear();
	}

	/**
	 * Utility: Split array into chunks
	 */
	_chunkArray(array, size) {
		const chunks = [];
		for (let i = 0; i < array.length; i += size) {
			chunks.push(array.slice(i, i + size));
		}
		return chunks;
	}

	/**
	 * Utility: Delay promise
	 */
	_delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

module.exports = MessageQueue;
