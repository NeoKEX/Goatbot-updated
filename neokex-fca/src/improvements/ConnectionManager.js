"use strict";

/**
 * Advanced Connection Manager for NeoKEX-FCA
 * Provides intelligent reconnection, health monitoring, and stability improvements
 */

class ConnectionManager {
  constructor(options = {}) {
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 2000;
    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.healthCheckInterval = options.healthCheckInterval || 30000;
    this.lastActivity = Date.now();
    this.connectionStats = {
      totalConnections: 0,
      totalReconnections: 0,
      totalFailures: 0,
      uptime: 0,
      lastConnected: null
    };
    this.onReconnect = options.onReconnect || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});
  }

  markConnected() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.lastActivity = Date.now();
    this.connectionStats.totalConnections++;
    this.connectionStats.lastConnected = new Date().toISOString();
  }

  markDisconnected() {
    this.isConnected = false;
    this.onDisconnect();
  }

  markActivity() {
    this.lastActivity = Date.now();
  }

  async shouldReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return false;
    }
    return true;
  }

  async attemptReconnect() {
    if (!await this.shouldReconnect()) {
      this.connectionStats.totalFailures++;
      throw new Error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
    }

    this.reconnectAttempts++;
    this.connectionStats.totalReconnections++;
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    await new Promise(resolve => setTimeout(resolve, Math.min(delay, 30000)));
    
    this.onReconnect();
  }

  getHealthStatus() {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const isStale = timeSinceActivity > this.healthCheckInterval;

    return {
      isConnected: this.isConnected,
      isStale,
      timeSinceActivity,
      reconnectAttempts: this.reconnectAttempts,
      stats: this.connectionStats
    };
  }

  reset() {
    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.lastActivity = Date.now();
  }
}

module.exports = ConnectionManager;
