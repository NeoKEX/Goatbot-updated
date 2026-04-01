/**
 * @author NTKhang & Modded by NeoKEX
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 *
 * English:
 * ! Please do not change the below code, it is very important for the project.
 * It is my motivation to maintain and develop the project for free.
 * ! If you change it, you will be banned forever
 * Thank you for using
 *
 * Vietnamese:
 * ! Vui lòng không thay đổi mã bên dưới, nó rất quan trọng đối với dự án.
 * Nó là động lực để tôi duy trì và phát triển dự án miễn phí.
 * ! Nếu thay đổi nó, bạn sẽ bị cấm vĩnh viễn
 * Cảm ơn bạn đã sử dụng
 */

process.on('unhandledRejection', (error, promise) => {
	log.error('UNHANDLED_REJECTION', error.message || error);
	// Don't store the promise to avoid memory leak
	// Just log and continue
});

process.on('uncaughtException', (error) => {
	log.error('UNCAUGHT_EXCEPTION', error.message || error);
	log.error('UNCAUGHT_EXCEPTION', error.stack || 'No stack trace');
	// Give time for logs to flush before exiting
	setTimeout(() => process.exit(1), 1000);
});

/**
 * TTLMap - A Map with automatic TTL (Time To Live) expiration
 * Automatically removes entries after specified time to prevent memory leaks
 */
class TTLMap extends Map {
	constructor(options = {}) {
		super();
		this.ttl = options.ttl || 3600000; // Default 1 hour
		this.maxSize = options.maxSize || 1000;
		this.timestamps = new Map();
		this.cleanupInterval = setInterval(() => this._cleanup(), options.cleanupInterval || 60000);
	}

	set(key, value) {
		// Check max size and remove oldest if needed
		if (this.size >= this.maxSize && !this.has(key)) {
			const oldestKey = this.timestamps.keys().next().value;
			this.delete(oldestKey);
		}

		super.set(key, value);
		this.timestamps.set(key, Date.now());
		return this;
	}

	get(key) {
		const value = super.get(key);
		if (value !== undefined) {
			// Update timestamp on access (LRU behavior)
			this.timestamps.set(key, Date.now());
		}
		return value;
	}

	delete(key) {
		this.timestamps.delete(key);
		return super.delete(key);
	}

	_cleanup() {
		const now = Date.now();
		const cutoff = now - this.ttl;
		let cleaned = 0;

		for (const [key, timestamp] of this.timestamps) {
			if (timestamp < cutoff) {
				this.delete(key);
				cleaned++;
			}
		}

		return cleaned;
	}

	destroy() {
		clearInterval(this.cleanupInterval);
		this.clear();
		this.timestamps.clear();
	}
}

const axios = require("axios");
const fs = require("fs-extra");
const { execSync } = require('child_process');
const log = require('./logger/log.js');
const path = require("path");

process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0; // Disable warning: "Warning: a promise was created in a handler but was not returned from it"

function validJSON(pathDir) {
        try {
                if (!fs.existsSync(pathDir))
                        throw new Error(`File "${pathDir}" not found`);
                execSync(`npx jsonlint "${pathDir}"`, { stdio: 'pipe' });
                return true;
        }
        catch (err) {
                let msgError = err.message;
                msgError = msgError.split("\n").slice(1).join("\n");
                const indexPos = msgError.indexOf("    at");
                msgError = msgError.slice(0, indexPos != -1 ? indexPos - 1 : msgError.length);
                throw new Error(msgError);
        }
}

const dirConfig = path.normalize(`${__dirname}/config.json`);
const dirConfigCommands = path.normalize(`${__dirname}/configCommands.json`);
const dirAccount = path.normalize(`${__dirname}/account.txt`);

for (const pathDir of [dirConfig, dirConfigCommands]) {
        try {
                validJSON(pathDir);
        }
        catch (err) {
                log.error("CONFIG", `Invalid JSON file "${pathDir.replace(__dirname, "")}":\n${err.message.split("\n").map(line => `  ${line}`).join("\n")}\nPlease fix it and restart bot`);
                process.exit(0);
        }
}
const config = require(dirConfig);
if (config.whiteListMode?.whiteListIds && Array.isArray(config.whiteListMode.whiteListIds))
        config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds.map(id => id.toString());
const configCommands = require(dirConfigCommands);

global.GoatBot = {
        startTime: Date.now() - process.uptime() * 1000, // time start bot (ms)
        commands: new Map(), // store all commands
        eventCommands: new Map(), // store all event commands
        commandFilesPath: [], // [{ filePath: "", commandName: [] }
        eventCommandsFilesPath: [], // [{ filePath: "", commandName: [] }
        aliases: new Map(), // store all aliases
        onFirstChat: new Set(), // store threadIDs that have been first chatted (memory efficient with automatic cleanup)
        onChat: [], // store all onChat
        onEvent: [], // store all onEvent
        onReply: new TTLMap({ ttl: 30 * 60 * 1000, maxSize: 500, cleanupInterval: 60000 }), // 30 min TTL, max 500 entries
        onReaction: new TTLMap({ ttl: 30 * 60 * 1000, maxSize: 500, cleanupInterval: 60000 }), // 30 min TTL, max 500 entries
        onAnyEvent: [], // store all onAnyEvent
        config, // store config
        configCommands, // store config commands
        envCommands: {}, // store env commands
        envEvents: {}, // store env events
        envGlobal: {}, // store env global
        reLoginBot: function () { }, // function relogin bot, will be set in bot/login/login.js
        Listening: null, // store current listening handle
        oldListening: [], // store old listening handle
        callbackListenTime: {}, // store callback listen 
        storage5Message: [], // store 5 message to check listening loop
        fcaApi: null, // store fca api
        botID: null // store bot id
};

global.db = {
        // all data
        allThreadData: [],
        allUserData: [],
        allDashBoardData: [],
        allGlobalData: [],

        // model
        threadModel: null,
        userModel: null,
        dashboardModel: null,
        globalModel: null,

        // handle data
        threadsData: null,
        usersData: null,
        dashBoardData: null,
        globalData: null,

        receivedTheFirstMessage: {}

        // all will be set in bot/login/loadData.js
};

global.client = {
        dirConfig,
        dirConfigCommands,
        dirAccount,
        countDown: {},
        cache: {},
        database: {
                creatingThreadData: [],
                creatingUserData: [],
                creatingDashBoardData: [],
                creatingGlobalData: []
        },
        commandBanned: configCommands.commandBanned
};

const utils = require("./utils.js");
global.utils = utils;
const { colors } = utils;
const shutdownManager = require("./func/gracefulShutdown.js");

// Initialize global.temp with size-limited data structures
global.temp = {
        createThreadData: [],
        createUserData: [],
        createThreadDataError: new Set(), // Use Set for O(1) lookups and auto-dedup
        contentScripts: {
                cmds: {},
                events: {}
        },
        // Add helper to limit array sizes
        _addWithLimit(arr, item, maxSize = 1000) {
                arr.push(item);
                if (arr.length > maxSize) {
                        arr.splice(0, arr.length - maxSize); // Keep only last maxSize items
                }
        }
};

// watch dirConfigCommands file and dirConfig
const watchAndReloadConfig = (dir, type, prop, logName) => {
        let lastModified = fs.statSync(dir).mtimeMs;
        let isFirstModified = true;

        fs.watch(dir, (eventType) => {
                if (eventType === type) {
                        const oldConfig = global.GoatBot[prop];

                        // wait 200ms to reload config
                        setTimeout(() => {
                                try {
                                        // if file change first time (when start bot, maybe you know it's called when start bot?) => not reload
                                        if (isFirstModified) {
                                                isFirstModified = false;
                                                return;
                                        }
                                        // if file not change => not reload
                                        if (lastModified === fs.statSync(dir).mtimeMs) {
                                                return;
                                        }
                                        global.GoatBot[prop] = JSON.parse(fs.readFileSync(dir, 'utf-8'));
                                        log.success(logName, `Reloaded ${dir.replace(process.cwd(), "")}`);
                                }
                                catch (err) {
                                        log.warn(logName, `Can't reload ${dir.replace(process.cwd(), "")}`);
                                        global.GoatBot[prop] = oldConfig;
                                }
                                finally {
                                        lastModified = fs.statSync(dir).mtimeMs;
                                }
                        }, 200);
                }
        });
};

watchAndReloadConfig(dirConfigCommands, 'change', 'configCommands', 'CONFIG COMMANDS');
watchAndReloadConfig(dirConfig, 'change', 'config', 'CONFIG');

global.GoatBot.envGlobal = global.GoatBot.configCommands.envGlobal;
global.GoatBot.envCommands = global.GoatBot.configCommands.envCommands;
global.GoatBot.envEvents = global.GoatBot.configCommands.envEvents;

// ———————————————— LOAD LANGUAGE ———————————————— //
const getText = global.utils.getText;

/**
 * MemoryManager - Monitors and manages memory to prevent leaks and ensure long-term stability
 */
class MemoryManager {
	constructor(options = {}) {
		this.options = {
			checkInterval: options.checkInterval || 5 * 60 * 1000, // 5 minutes
			heapThreshold: options.heapThreshold || 512 * 1024 * 1024, // 512MB
			maxOldListening: options.maxOldListening || 10,
			maxCallbackListenTime: options.maxCallbackListenTime || 100,
			maxOnFirstChatSize: options.maxOnFirstChatSize || 10000,
			...options
		};

		this.stats = {
			cleanups: 0,
			lastHeapUsed: 0,
			peakHeapUsed: 0
		};

		this._startMonitoring();
	}

	_startMonitoring() {
		setInterval(() => this._checkMemory(), this.options.checkInterval);
	}

	_checkMemory() {
		const memUsage = process.memoryUsage();
		this.stats.lastHeapUsed = memUsage.heapUsed;
		this.stats.peakHeapUsed = Math.max(this.stats.peakHeapUsed, memUsage.heapUsed);

		// Cleanup if heap exceeds threshold
		if (memUsage.heapUsed > this.options.heapThreshold) {
			this._performCleanup();
		}

		// Always do light cleanup
		this._lightCleanup();
	}

	_performCleanup() {
		const { GoatBot } = global;
		let cleaned = 0;

		// Cleanup old listening handles
		if (GoatBot.oldListening.length > this.options.maxOldListening) {
			const toRemove = GoatBot.oldListening.length - this.options.maxOldListening;
			for (let i = 0; i < toRemove; i++) {
				const handle = GoatBot.oldListening.shift();
				if (handle && typeof handle.stop === 'function') {
					try { handle.stop(); } catch (e) {}
				}
			}
			cleaned += toRemove;
		}

		// Cleanup callbackListenTime
		const callbackEntries = Object.keys(GoatBot.callbackListenTime);
		if (callbackEntries.length > this.options.maxCallbackListenTime) {
			// Sort by timestamp and remove oldest
			const sorted = callbackEntries
				.map(key => ({ key, time: GoatBot.callbackListenTime[key] }))
				.sort((a, b) => a.time - b.time);

			const toRemove = sorted.length - this.options.maxCallbackListenTime;
			for (let i = 0; i < toRemove; i++) {
				delete GoatBot.callbackListenTime[sorted[i].key];
			}
			cleaned += toRemove;
		}

		// Cleanup onFirstChat if too large
		if (GoatBot.onFirstChat.size > this.options.maxOnFirstChatSize) {
			const entries = Array.from(GoatBot.onFirstChat);
			const toRemove = entries.slice(0, entries.length - this.options.maxOnFirstChatSize);
			toRemove.forEach(id => GoatBot.onFirstChat.delete(id));
			cleaned += toRemove.length;
		}

		// Clear expired premium users cache
		if (global.temp?.expiredPremiumUsers?.length > 1000) {
			global.temp.expiredPremiumUsers.splice(0, global.temp.expiredPremiumUsers.length - 1000);
			cleaned++;
		}

		// Force garbage collection if available
		if (global.gc && memUsage.heapUsed > this.options.heapThreshold * 1.5) {
			global.gc();
			cleaned++;
		}

		if (cleaned > 0) {
			this.stats.cleanups++;
			log.info('MEMORY', `Cleaned ${cleaned} items, heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
		}
	}

	_lightCleanup() {
		// Cleanup client cache
		if (global.client?.cache) {
			const cache = global.client.cache;
			const now = Date.now();
			for (const [key, value] of Object.entries(cache)) {
				if (value?._timestamp && now - value._timestamp > 3600000) {
					delete cache[key];
				}
			}
		}
	}

	getStats() {
		const memUsage = process.memoryUsage();
		return {
			...this.stats,
			heapUsed: memUsage.heapUsed,
			heapTotal: memUsage.heapTotal,
			rss: memUsage.rss,
			external: memUsage.external,
			heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
			heapTotalMB: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
			rssMB: (memUsage.rss / 1024 / 1024).toFixed(2)
		};
	}
}

// Initialize memory manager
const memoryManager = new MemoryManager();

// ———————————————— AUTO RESTART ———————————————— //
if (config.autoRestart) {
        const time = config.autoRestart.time;
        if (!isNaN(time) && time > 0) {
                utils.log.info("AUTO RESTART", getText("Goat", "autoRestart1", utils.convertTime(time, true)));
                setTimeout(() => {
                        utils.log.info("AUTO RESTART", "Restarting...");
                        process.exit(2);
                }, time);
        }
        else if (typeof time == "string" && time.match(/^((((\d+,)+\d+|(\d+(\/|-|#)\d+)|\d+L?|\*(\/\d+)?|L(-\d+)?|\?|[A-Z]{3}(-[A-Z]{3})?) ?){5,7})$/gmi)) {
                utils.log.info("AUTO RESTART", getText("Goat", "autoRestart2", time));
                const cron = require("node-cron");
                cron.schedule(time, () => {
                        utils.log.info("AUTO RESTART", "Restarting...");
                        process.exit(2);
                });
        }
}

(async () => {
        // ———————————————— CHECK VERSION ———————————————— //
        const { data: { version } } = await axios.get("https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2/main/package.json");
        const currentVersion = require("./package.json").version;
        if (utils.compareVersion(version, currentVersion) === 1)
                utils.log.master("NEW VERSION", getText(
                        "Goat",
                        "newVersionDetected",
                        colors.gray(currentVersion),
                        colors.hex("#eb6a07", version),
                        colors.hex("#eb6a07", "node update")
                ));
        // ———————————————————— LOGIN ———————————————————— //
        require('./bot/login/login.js');
})();

