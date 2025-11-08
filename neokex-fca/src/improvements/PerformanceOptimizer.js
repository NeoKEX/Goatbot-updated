"use strict";

/**
 * Performance Optimizer for NeoKEX-FCA
 * Caching, debouncing, and performance enhancements
 */

class PerformanceOptimizer {
  constructor(options = {}) {
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 300000;
    this.maxCacheSize = options.maxCacheSize || 1000;
    this.debounceTimers = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
  }

  cacheSet(key, value, customTimeout) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const timeout = customTimeout || this.cacheTimeout;
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      timeout
    });
  }

  cacheGet(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > cached.timeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  cacheHas(key) {
    const value = this.cacheGet(key);
    return value !== null;
  }

  cacheClear() {
    this.cache.clear();
  }

  debounce(key, fn, delay = 300) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(() => {
      fn();
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  async queueRequest(fn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const { fn, resolve, reject } = this.requestQueue.shift();
      
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }

      await new Promise(r => setTimeout(r, 100));
    }

    this.isProcessing = false;
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      queuedRequests: this.requestQueue.length,
      activeDebounces: this.debounceTimers.size
    };
  }
}

module.exports = PerformanceOptimizer;
