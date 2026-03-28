/**
 * Graceful Shutdown Handler
 * Ensures all pending operations complete before shutting down
 */

class GracefulShutdown {
	constructor(options = {}) {
		this.options = {
			timeout: options.timeout || 30000, // 30 seconds max wait
			...options
		};

		this.pendingOperations = new Map();
		this.shutdownCallbacks = [];
		this.isShuttingDown = false;

		// Bind to process events
		this._setupHandlers();
	}

	/**
	 * Register a pending operation
	 * @param {string} id - Operation ID
	 * @param {string} type - Operation type/description
	 */
	startOperation(id, type = 'unknown') {
		if (this.isShuttingDown) {
			throw new Error('Cannot start new operations during shutdown');
		}
		this.pendingOperations.set(id, { type, startTime: Date.now() });
	}

	/**
	 * Mark operation as complete
	 * @param {string} id - Operation ID
	 */
	endOperation(id) {
		this.pendingOperations.delete(id);
	}

	/**
	 * Register shutdown callback
	 * @param {Function} callback - Async function to run during shutdown
	 * @param {number} priority - Lower = runs first (default: 10)
	 */
	onShutdown(callback, priority = 10) {
		this.shutdownCallbacks.push({ callback, priority });
		// Sort by priority
		this.shutdownCallbacks.sort((a, b) => a.priority - b.priority);
	}

	/**
	 * Trigger graceful shutdown
	 */
	async shutdown(signal = 'manual') {
		if (this.isShuttingDown) return;
		this.isShuttingDown = true;

		console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

		// Wait for pending operations
		const startTime = Date.now();
		while (this.pendingOperations.size > 0) {
			if (Date.now() - startTime > this.options.timeout) {
				console.log(`⚠️ Timeout waiting for ${this.pendingOperations.size} pending operations:`);
				for (const [id, info] of this.pendingOperations) {
					console.log(`  - ${id} (${info.type}, ${Date.now() - info.startTime}ms)`);
				}
				break;
			}
			console.log(`⏳ Waiting for ${this.pendingOperations.size} pending operations...`);
			await this._delay(500);
		}

		// Run shutdown callbacks
		console.log(`🔄 Running ${this.shutdownCallbacks.length} shutdown tasks...`);
		for (const { callback, priority } of this.shutdownCallbacks) {
			try {
				await Promise.race([
					callback(),
					this._delay(5000).then(() => {
						console.log(`⚠️ Shutdown task (priority ${priority}) timed out`);
					})
				]);
			} catch (err) {
				console.error(`❌ Shutdown task failed:`, err.message);
			}
		}

		console.log('✅ Graceful shutdown complete');
		process.exit(0);
	}

	/**
	 * Setup process signal handlers
	 */
	_setupHandlers() {
		// Handle signals
		['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach(signal => {
			process.on(signal, () => this.shutdown(signal));
		});

		// Handle uncaught exceptions
		process.on('uncaughtException', (err) => {
			console.error('💥 Uncaught Exception:', err);
			this.shutdown('uncaughtException');
		});

		// Handle unhandled rejections
		process.on('unhandledRejection', (reason, promise) => {
			console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
		});

		// Handle PM2 shutdown message
		process.on('message', (msg) => {
			if (msg === 'shutdown') {
				this.shutdown('pm2-shutdown');
			}
		});
	}

	_delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Get current status
	 */
	getStatus() {
		return {
			isShuttingDown: this.isShuttingDown,
			pendingOperations: this.pendingOperations.size,
			operations: Array.from(this.pendingOperations.entries()).map(([id, info]) => ({
				id,
				...info,
				duration: Date.now() - info.startTime
			})),
			shutdownTasks: this.shutdownCallbacks.length
		};
	}
}

// Create singleton instance
const shutdownManager = new GracefulShutdown();

module.exports = shutdownManager;
