const { graphQlQueryToJson } = require("graphql-query-to-json");
const ora = require("ora");
const { log, getText } = global.utils;
const { config } = global.GoatBot;
const databaseType = config.database.type;

// with add null if not found data
function fakeGraphql(query, data, obj = {}) {
	if (typeof query != "string" && typeof query != "object")
		throw new Error(`The "query" argument must be of type string or object, got ${typeof query}`);
	if (query == "{}" || !data)
		return data;
	if (typeof query == "string")
		query = graphQlQueryToJson(query).query;
	const keys = query ? Object.keys(query) : [];
	for (const key of keys) {
		if (typeof query[key] === 'object') {
			if (!Array.isArray(data[key]))
				obj[key] = data.hasOwnProperty(key) ? fakeGraphql(query[key], data[key] || {}, obj[key]) : null;
			else
				obj[key] = data.hasOwnProperty(key) ? data[key].map(item => fakeGraphql(query[key], item, {})) : null;
		}
		else
			obj[key] = data.hasOwnProperty(key) ? data[key] : null;
	}
	return obj;
	// i don't know why but it's working by Copilot suggestion :)
}

/**
 * DatabaseCacheManager - Manages in-memory database cache with LRU eviction
 * Prevents memory bloat when bot runs for long periods with many threads/users
 */
class DatabaseCacheManager {
	constructor(options = {}) {
		this.options = {
			maxThreads: options.maxThreads || 5000,
			maxUsers: options.maxUsers || 10000,
			cleanupInterval: options.cleanupInterval || 30 * 60 * 1000, // 30 minutes
			unusedThreshold: options.unusedThreshold || 60 * 60 * 1000, // 1 hour
			...options
		};

		this.accessTimes = new Map(); // Track last access time
		this.stats = {
			threadEvictions: 0,
			userEvictions: 0,
			cleanups: 0
		};

		this._startCleanupInterval();
	}

	recordAccess(id, type = 'thread') {
		this.accessTimes.set(`${type}:${id}`, Date.now());
	}

	_startCleanupInterval() {
		setInterval(() => this._cleanup(), this.options.cleanupInterval);
	}

	_cleanup() {
		const now = Date.now();
		let cleaned = 0;

		// Clean up old access times
		for (const [key, time] of this.accessTimes) {
			if (now - time > this.options.unusedThreshold * 2) {
				this.accessTimes.delete(key);
				cleaned++;
			}
		}

		// Check thread data size
		if (global.db?.allThreadData?.length > this.options.maxThreads) {
			this._evictOldThreads();
		}

		// Check user data size
		if (global.db?.allUserData?.length > this.options.maxUsers) {
			this._evictOldUsers();
		}

		if (cleaned > 0) {
			this.stats.cleanups++;
		}
	}

	_evictOldThreads() {
		const allData = global.db.allThreadData;
		const now = Date.now();

		// Sort by last access time (oldest first)
		const sorted = allData
			.map((t, index) => ({
				index,
				threadID: t.threadID,
				lastAccess: this.accessTimes.get(`thread:${t.threadID}`) || 0
			}))
			.sort((a, b) => a.lastAccess - b.lastAccess);

		// Remove oldest 10% that haven't been accessed recently
		const toRemove = Math.floor(sorted.length * 0.1);
		const removedIDs = new Set();

		for (let i = 0; i < toRemove; i++) {
			const item = sorted[i];
			// Only remove if not accessed in the last hour
			if (now - item.lastAccess > this.options.unusedThreshold) {
				removedIDs.add(item.threadID);
			}
		}

		// Filter out removed threads (keep them in DB but remove from memory)
		global.db.allThreadData = allData.filter(t => !removedIDs.has(t.threadID));
		this.stats.threadEvictions += removedIDs.size;

		if (removedIDs.size > 0) {
			log.info('CACHE', `Evicted ${removedIDs.size} inactive threads from memory cache`);
		}
	}

	_evictOldUsers() {
		const allData = global.db.allUserData;
		const now = Date.now();

		// Sort by last access time (oldest first)
		const sorted = allData
			.map((u, index) => ({
				index,
				userID: u.userID,
				lastAccess: this.accessTimes.get(`user:${u.userID}`) || 0
			}))
			.sort((a, b) => a.lastAccess - b.lastAccess);

		// Remove oldest 10% that haven't been accessed recently
		const toRemove = Math.floor(sorted.length * 0.1);
		const removedIDs = new Set();

		for (let i = 0; i < toRemove; i++) {
			const item = sorted[i];
			// Only remove if not accessed in the last hour
			if (now - item.lastAccess > this.options.unusedThreshold) {
				removedIDs.add(item.userID);
			}
		}

		// Filter out removed users (keep them in DB but remove from memory)
		global.db.allUserData = allData.filter(u => !removedIDs.has(u.userID));
		this.stats.userEvictions += removedIDs.size;

		if (removedIDs.size > 0) {
			log.info('CACHE', `Evicted ${removedIDs.size} inactive users from memory cache`);
		}
	}

	getStats() {
		return {
			...this.stats,
			trackedAccesses: this.accessTimes.size,
			threadCacheSize: global.db?.allThreadData?.length || 0,
			userCacheSize: global.db?.allUserData?.length || 0
		};
	}
}

// Initialize cache manager globally
global.dbCacheManager = new DatabaseCacheManager();

module.exports = async function (api) {
	var threadModel, userModel, dashBoardModel, globalModel, sequelize = null;
	switch (databaseType) {
		case "mongodb": {
			const spin = ora({
				text: getText('indexController', 'connectingMongoDB'),
				spinner: {
					interval: 80,
					frames: [
						'⠋', '⠙', '⠹',
						'⠸', '⠼', '⠴',
						'⠦', '⠧', '⠇',
						'⠏'
					]
				}
			});
			const defaultClearLine = process.stderr.clearLine;
			process.stderr.clearLine = function () { };
			spin.start();
			try {
				var { threadModel, userModel, dashBoardModel, globalModel } = await require("../connectDB/connectMongoDB.js")(config.database.uriMongodb);
				spin.stop();
				process.stderr.clearLine = defaultClearLine;
				log.info("MONGODB", getText("indexController", "connectMongoDBSuccess"));
			}
			catch (err) {
				spin.stop();
				process.stderr.clearLine = defaultClearLine;
				log.err("MONGODB", getText("indexController", "connectMongoDBError"), err);
				process.exit();
			}
			break;
		}
		case "sqlite": {
			const spin = ora({
				text: getText('indexController', 'connectingMySQL'),
				spinner: {
					interval: 80,
					frames: [
						'⠋', '⠙', '⠹',
						'⠸', '⠼', '⠴',
						'⠦', '⠧', '⠇',
						'⠏'
					]
				}
			});
			const defaultClearLine = process.stderr.clearLine;
			process.stderr.clearLine = function () { };
			spin.start();
			try {
				var { threadModel, userModel, dashBoardModel, globalModel, sequelize } = await require("../connectDB/connectSqlite.js")();
				process.stderr.clearLine = defaultClearLine;
				spin.stop();
				log.info("SQLITE", getText("indexController", "connectMySQLSuccess"));
			}
			catch (err) {
				process.stderr.clearLine = defaultClearLine;
				spin.stop();
				log.err("SQLITE", getText("indexController", "connectMySQLError"), err);
				process.exit();
			}
			break;
		}
		default:
			break;
	}

	const threadsData = await require("./threadsData.js")(databaseType, threadModel, api, fakeGraphql);
	const usersData = await require("./usersData.js")(databaseType, userModel, api, fakeGraphql);
	const dashBoardData = await require("./dashBoardData.js")(databaseType, dashBoardModel, fakeGraphql);
	const globalData = await require("./globalData.js")(databaseType, globalModel, fakeGraphql);

	global.db = {
		...global.db,
		threadModel,
		userModel,
		dashBoardModel,
		globalModel,
		threadsData,
		usersData,
		dashBoardData,
		globalData,
		sequelize
	};

	return {
		threadModel,
		userModel,
		dashBoardModel,
		globalModel,
		threadsData,
		usersData,
		dashBoardData,
		globalData,
		sequelize,
		databaseType
	};
};