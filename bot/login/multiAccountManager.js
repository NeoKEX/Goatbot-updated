/**
 * @author NeoKEX
 * MultiAccountManager - Manages multiple account files for seamless switching
 * When one account faces issues, automatically switches to the next available account
 */

const fs = require("fs-extra");
const path = require("path");
const { log } = global.utils;

class MultiAccountManager {
	constructor() {
		this.accounts = []; // Array of account file paths
		this.currentIndex = 0; // Current active account index
		this.isSwitching = false; // Prevent concurrent switches
		this.switchCount = 0; // Track number of switches
		this.failedAccounts = new Set(); // Track failed accounts to avoid retry loop
		this.lastSwitchTime = 0; // Prevent rapid switching
		this.MIN_SWITCH_INTERVAL = 30000; // Minimum 30 seconds between switches
		this.singleAccountRetryCount = 0; // Track retries for single account mode
	}

	/**
	 * Scan for available account files (account.txt, account2.txt, account3.txt, etc.)
	 */
	scanAccounts() {
		const baseDir = process.cwd();
		this.accounts = [];

		// Always check account.txt first
		const primaryAccount = path.join(baseDir, "account.txt");
		if (fs.existsSync(primaryAccount)) {
			this.accounts.push(primaryAccount);
		}

		// Check for account2.txt, account3.txt, etc.
		let index = 2;
		while (true) {
			const accountFile = path.join(baseDir, `account${index}.txt`);
			if (fs.existsSync(accountFile)) {
				this.accounts.push(accountFile);
				index++;
			} else {
				break;
			}
		}

		// Also check account.json files
		const primaryJson = path.join(baseDir, "account.json");
		if (fs.existsSync(primaryJson) && !this.accounts.includes(primaryJson)) {
			this.accounts.push(primaryJson);
		}

		let jsonIndex = 2;
		while (true) {
			const accountFile = path.join(baseDir, `account${jsonIndex}.json`);
			if (fs.existsSync(accountFile)) {
				if (!this.accounts.includes(accountFile)) {
					this.accounts.push(accountFile);
				}
				jsonIndex++;
			} else {
				break;
			}
		}

		if (this.accounts.length === 0) {
			log.warn("MULTI_ACCOUNT", "No account files found. Expected: account.txt, account2.txt, etc.");
		} else {
			log.info("MULTI_ACCOUNT", `Found ${this.accounts.length} account(s): ${this.accounts.map(a => path.basename(a)).join(", ")}`);
		}

		return this.accounts.length;
	}

	/**
	 * Get the current active account file path
	 */
	getCurrentAccount() {
		if (this.accounts.length === 0) {
			this.scanAccounts();
		}

		if (this.currentIndex >= this.accounts.length) {
			// All accounts exhausted, reset and try again
			this.currentIndex = 0;
			this.failedAccounts.clear();
			log.warn("MULTI_ACCOUNT", "All accounts exhausted, cycling back to first account");
		}

		return this.accounts[this.currentIndex];
	}

	/**
	 * Move to next account
	 */
	nextAccount() {
		const previousAccount = this.getCurrentAccount();
		this.failedAccounts.add(previousAccount);
		this.currentIndex++;
		this.switchCount++;
		this.lastSwitchTime = Date.now();

		const nextAccount = this.getCurrentAccount();
		log.info("MULTI_ACCOUNT", `Switching from ${path.basename(previousAccount)} to ${path.basename(nextAccount)} (switch #${this.switchCount})`);

		return nextAccount;
	}

	/**
	 * Check if we should switch accounts (prevents rapid switching)
	 */
	canSwitch() {
		if (this.isSwitching) {
			return false;
		}

		const timeSinceLastSwitch = Date.now() - this.lastSwitchTime;
		if (timeSinceLastSwitch < this.MIN_SWITCH_INTERVAL) {
			log.warn("MULTI_ACCOUNT", `Switch cooldown active. Please wait ${Math.ceil((this.MIN_SWITCH_INTERVAL - timeSinceLastSwitch) / 1000)}s`);
			return false;
		}

		return true;
	}

	/**
	 * Get available accounts (excluding failed ones)
	 */
	getAvailableAccounts() {
		return this.accounts.filter(acc => !this.failedAccounts.has(acc));
	}

	/**
	 * Check if there are more accounts to try
	 */
	hasMoreAccounts() {
		const available = this.getAvailableAccounts();
		const currentAccount = this.getCurrentAccount();
		return available.length > 1 || (available.length === 1 && this.failedAccounts.has(currentAccount));
	}

	/**
	 * Mark current account as working (reset failed status)
	 */
	markCurrentAsWorking() {
		const current = this.getCurrentAccount();
		if (this.failedAccounts.has(current)) {
			this.failedAccounts.delete(current);
			log.info("MULTI_ACCOUNT", `${path.basename(current)} marked as working`);
		}
	}

	/**
	 * Reset all failed accounts (useful for manual retry)
	 */
	resetFailedAccounts() {
		const count = this.failedAccounts.size;
		this.failedAccounts.clear();
		if (count > 0) {
			log.info("MULTI_ACCOUNT", `Reset ${count} failed account(s)`);
		}
	}

	/**
	 * Check if we're in single account mode
	 */
	isSingleAccount() {
		return this.accounts.length <= 1;
	}

	/**
	 * Get retry delay with exponential backoff for single account mode
	 */
	getRetryDelay(attemptCount) {
		const baseDelay = 30000; // 30 seconds
		const maxDelay = 300000; // 5 minutes
		const delay = Math.min(baseDelay * Math.pow(1.5, attemptCount), maxDelay);
		return delay;
	}

	/**
	 * Get manager stats
	 */
	getStats() {
		return {
			totalAccounts: this.accounts.length,
			currentIndex: this.currentIndex,
			currentAccount: this.getCurrentAccount() ? path.basename(this.getCurrentAccount()) : null,
			failedAccounts: Array.from(this.failedAccounts).map(a => path.basename(a)),
			availableAccounts: this.getAvailableAccounts().map(a => path.basename(a)),
			switchCount: this.switchCount,
			isSwitching: this.isSwitching,
			canSwitch: this.canSwitch(),
			singleAccountRetryCount: this.singleAccountRetryCount
		};
	}
}

// Create singleton instance
const multiAccountManager = new MultiAccountManager();

module.exports = multiAccountManager;
