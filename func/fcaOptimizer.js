/**
 * FCA API Optimizer - High-performance wrapper for @neoaz07/nkxfca
 * Features: Connection pooling, request batching, intelligent caching, rate limiting
 * @author neoaz (NeoKEX)
 */

const EventEmitter = require('events');

class FCAOptimizer extends EventEmitter {
	constructor(api, options = {}) {
		super();
		this.api = api;
		this.options = {
			batchSize: options.batchSize || 10,
			batchDelay: options.batchDelay || 100,
			cacheTTL: options.cacheTTL || 300000, // 5 minutes
			rateLimitWindow: options.rateLimitWindow || 60000, // 1 minute
			rateLimitMax: options.rateLimitMax || 100,
			maxConcurrent: options.maxConcurrent || 5,
			...options
		};

		// Message queue for batching
		this.messageQueue = [];
		this.batchTimer = null;
		this.processing = false;

		// Cache storage
		this.cache = new Map();
		this.cacheTimestamps = new Map();

		// Rate limiting
		this.requestCounts = new Map();
		this.rateLimitResetTimer = null;

		// Request deduplication
		this.pendingRequests = new Map();

		// Connection health
		this.isHealthy = true;
		this.consecutiveErrors = 0;
		this.maxConsecutiveErrors = 5;

		// Stats
		this.stats = {
			totalRequests: 0,
			batchedRequests: 0,
			cacheHits: 0,
			errors: 0,
			startTime: Date.now()
		};

		this._setupRateLimitReset();
	}

	/**
	 * Initialize optimal FCA options for high performance
	 */
	setOptimalOptions() {
		this.api.setOptions({
			logLevel: 'silent',
			selfListen: false,
			listenEvents: true,
			updatePresence: false,
			forceLogin: false,
			autoReconnect: true,
			mqttRefreshRate: 1000, // 1 second refresh for faster message delivery
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
		});
		return this;
	}

	/**
	 * Optimized message sending with intelligent batching
	 */
	async sendMessage(message, threadID, messageID, callback) {
		const requestId = `${threadID}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		return new Promise((resolve, reject) => {
			this.messageQueue.push({
				requestId,
				message,
				threadID,
				messageID,
				callback,
				resolve,
				reject,
				timestamp: Date.now()
			});

			// Start batch timer if not already running
			if (!this.batchTimer && !this.processing) {
				this.batchTimer = setTimeout(() => this._processBatch(), this.options.batchDelay);
			}

			// Process immediately if batch is full
			if (this.messageQueue.length >= this.options.batchSize) {
				clearTimeout(this.batchTimer);
				this.batchTimer = null;
				this._processBatch();
			}
		});
	}

	/**
	 * Process batched messages efficiently
	 */
	async _processBatch() {
		if (this.processing || this.messageQueue.length === 0) {
			this.batchTimer = null;
			return;
		}

		this.processing = true;
		const batch = this.messageQueue.splice(0, this.options.batchSize);

		try {
			// Group by threadID for efficient batch sending
			const groupedByThread = batch.reduce((acc, item) => {
				if (!acc[item.threadID]) acc[item.threadID] = [];
				acc[item.threadID].push(item);
				return acc;
			}, {});

			// Process each thread's messages
			const promises = Object.entries(groupedByThread).map(async ([threadID, items]) => {
				// Check rate limit
				if (this._isRateLimited(threadID)) {
					items.forEach(item => {
						item.reject(new Error('Rate limit exceeded for thread'));
					});
					return;
				}

				// Send messages sequentially to avoid overwhelming the API
				for (const item of items) {
					try {
						this._incrementRateLimit(threadID);
						const result = await this.api.sendMessage(
							item.message,
							item.threadID,
							item.messageID,
							item.callback
						);
						this.stats.batchedRequests++;
						this.consecutiveErrors = 0;
						item.resolve(result);
					} catch (error) {
						this._handleError(error);
						item.reject(error);
					}
				}
			});

			await Promise.all(promises);
		} catch (error) {
			this._handleError(error);
		} finally {
			this.processing = false;
			this.batchTimer = null;

			// Continue processing if more items in queue
			if (this.messageQueue.length > 0) {
				this.batchTimer = setTimeout(() => this._processBatch(), this.options.batchDelay);
			}
		}
	}

	/**
	 * Cached API wrapper with TTL
	 */
	async cachedCall(method, ...args) {
		const cacheKey = `${method}_${JSON.stringify(args)}`;
		const cached = this._getCache(cacheKey);

		if (cached !== undefined) {
			this.stats.cacheHits++;
			return cached;
		}

		// Check for duplicate in-flight requests
		if (this.pendingRequests.has(cacheKey)) {
			return this.pendingRequests.get(cacheKey);
		}

		const promise = this._executeCall(method, args, cacheKey);
		this.pendingRequests.set(cacheKey, promise);

		return promise;
	}

	async _executeCall(method, args, cacheKey) {
		try {
			this.stats.totalRequests++;
			const result = await this.api[method](...args);
			this._setCache(cacheKey, result);
			this.consecutiveErrors = 0;
			return result;
		} catch (error) {
			this._handleError(error);
			throw error;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Optimized thread list fetching with pagination
	 */
	async getThreadListBatch(limit = 9999999, timestamp = null, tags = ['INBOX']) {
		const batchSize = 100; // Optimal batch size for FCA
		const results = [];
		let currentTimestamp = timestamp;
		let remaining = limit;

		while (remaining > 0) {
			const fetchSize = Math.min(batchSize, remaining);
			const cacheKey = `threadList_${fetchSize}_${currentTimestamp}_${tags.join(',')}`;

			try {
				const threads = await this.cachedCall('getThreadList', fetchSize, currentTimestamp, tags);

				if (!threads || threads.length === 0) break;

				results.push(...threads);
				remaining -= threads.length;

				// Update timestamp for next batch
				const lastThread = threads[threads.length - 1];
				if (lastThread && lastThread.timestamp) {
					currentTimestamp = lastThread.timestamp;
				} else {
					break;
				}

				// Small delay to avoid rate limiting
				if (remaining > 0) {
					await this._delay(500);
				}
			} catch (error) {
				this._handleError(error);
				break;
			}
		}

		return results;
	}

	/**
	 * Batch user info fetching
	 */
	async getUserInfoBatch(userIDs) {
		const batchSize = 50; // FCA optimal batch size
		const results = {};

		for (let i = 0; i < userIDs.length; i += batchSize) {
			const batch = userIDs.slice(i, i + batchSize);
			const cacheKey = `userInfo_${batch.join(',')}`;

			try {
				const userInfo = await this.cachedCall('getUserInfo', batch);
				Object.assign(results, userInfo);
			} catch (error) {
				this._handleError(error);
			}

			if (i + batchSize < userIDs.length) {
				await this._delay(300);
			}
		}

		return results;
	}

	/**
	 * Smart retry mechanism with exponential backoff
	 */
	async retryableCall(method, maxRetries = 3, ...args) {
		let lastError;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				return await this.api[method](...args);
			} catch (error) {
				lastError = error;

				// Don't retry on certain errors
				if (error.error === 'Not logged in' || error.error === 'Invalid session') {
					throw error;
				}

				// Exponential backoff
				const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
				await this._delay(delay);
			}
		}

		throw lastError;
	}

	/**
	 * Connection health check
	 */
	checkHealth() {
		return {
			isHealthy: this.isHealthy,
			consecutiveErrors: this.consecutiveErrors,
			queueLength: this.messageQueue.length,
			cacheSize: this.cache.size,
			stats: { ...this.stats }
		};
	}

	/**
	 * Clear cache and reset state
	 */
	clearCache() {
		this.cache.clear();
		this.cacheTimestamps.clear();
		this.pendingRequests.clear();
	}

	// Private methods
	_getCache(key) {
		const timestamp = this.cacheTimestamps.get(key);
		if (!timestamp) return undefined;

		if (Date.now() - timestamp > this.options.cacheTTL) {
			this.cache.delete(key);
			this.cacheTimestamps.delete(key);
			return undefined;
		}

		return this.cache.get(key);
	}

	_setCache(key, value) {
		// Prevent cache from growing too large
		if (this.cache.size > 1000) {
			const oldestKey = this.cacheTimestamps.keys().next().value;
			this.cache.delete(oldestKey);
			this.cacheTimestamps.delete(oldestKey);
		}

		this.cache.set(key, value);
		this.cacheTimestamps.set(key, Date.now());
	}

	_isRateLimited(threadID) {
		const count = this.requestCounts.get(threadID) || 0;
		return count >= this.options.rateLimitMax;
	}

	_incrementRateLimit(threadID) {
		const current = this.requestCounts.get(threadID) || 0;
		this.requestCounts.set(threadID, current + 1);
	}

	_setupRateLimitReset() {
		this.rateLimitResetTimer = setInterval(() => {
			this.requestCounts.clear();
		}, this.options.rateLimitWindow);
	}

	_handleError(error) {
		this.stats.errors++;
		this.consecutiveErrors++;

		if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
			this.isHealthy = false;
			this.emit('unhealthy', error);
		}

		// Log critical errors
		if (global.utils?.log) {
			global.utils.log.error('FCA_OPTIMIZER', error.message || error);
		}
	}

	_delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	destroy() {
		clearTimeout(this.batchTimer);
		clearInterval(this.rateLimitResetTimer);
		this.clearCache();
		this.removeAllListeners();
	}
}

module.exports = FCAOptimizer;
